// src/components/inventaire.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  FaHome,
  FaShoppingCart,
  FaUser,
  FaDropbox,
  FaUserCircle,
  FaFilePdf,
  FaChartBar,
  FaHistory,
  FaCubes,
  FaTruck,
  FaTrash,
  FaTimes,
  FaPencilAlt,
} from 'react-icons/fa';
import { MdLogout } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaArrowLeft, FaAngleDown, FaBars } from "react-icons/fa6";
import { IoMdNotificationsOutline as IoMdNotificationsOutlineIcon } from "react-icons/io";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = (() => {
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3001/api`;
    }
  }
  return 'http://localhost:3001/api';
})();

console.log('🌐 API URL:', API_BASE_URL);
const ITEMS_PER_PAGE = 10;

const MONTH_LABELS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const START_YEAR = 2010;
const END_YEAR = new Date().getFullYear() + 5;
const YEARS = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i
);
const MONTHS = [
  { name: 'Janvier', value: 1 }, { name: 'Février', value: 2 },
  { name: 'Mars', value: 3 }, { name: 'Avril', value: 4 },
  { name: 'Mai', value: 5 }, { name: 'Juin', value: 6 },
  { name: 'Juillet', value: 7 }, { name: 'Août', value: 8 },
  { name: 'Septembre', value: 9 }, { name: 'Octobre', value: 10 },
  { name: 'Novembre', value: 11 }, { name: 'Décembre', value: 12 }
];

export default function InventairesScreen() {
  const navigate = useNavigate();
  const chartRef = useRef(null);

  const [activeView, setActiveView] = useState('historique');

  // Data states
  const [inventaireData, setInventaireData] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [attributions, setAttributions] = useState([]);
  const [sorties, setSorties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters for historique view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');

  // Product categories from stocks for filter dropdown
  const [productCategories, setProductCategories] = useState([]);
  
  // State for chart filtering
  const [selectedCategoryForStats, setSelectedCategoryForStats] = useState(null);

  // State for alert notification (styled like stocks.jsx)
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [stockAlertModalVisible, setStockAlertModalVisible] = useState(false);

  // Responsive states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1023 && window.innerWidth > 767);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type, visible: true })
    setTimeout(() => setNotification({ message: '', type: '', visible: false }), 4000)
  }

  // Effect for responsive screen detection
  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyMobile = window.innerWidth <= 767;
      const isCurrentlyTablet = window.innerWidth <= 1023 && window.innerWidth > 767;

      setIsMobile(isCurrentlyMobile);
      setIsTablet(isCurrentlyTablet);

      if (window.innerWidth > 1023) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [inventaireRes, stocksRes, attributionsRes, sortiesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/inventaire`),
        axios.get(`${API_BASE_URL}/stocks`),
        axios.get(`${API_BASE_URL}/attributions`),
        axios.get(`${API_BASE_URL}/sorties`)
      ]);

      setInventaireData(Array.isArray(inventaireRes.data) ? inventaireRes.data : []);
      setStocks(Array.isArray(stocksRes.data) ? stocksRes.data : []);
      setAttributions(Array.isArray(attributionsRes.data) ? attributionsRes.data : []);
      setSorties(Array.isArray(sortiesRes.data) ? sortiesRes.data : []);

      const categories = [...new Set(stocksRes.data.map(item => item.nomProduit).filter(Boolean))].sort();
      setProductCategories(categories);

    } catch (err) {
      console.error('Erreur fetch data', err);
      showNotification('Erreur: impossible de charger les données.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute inventory data from individual tables
  const computeInventoryData = useMemo(() => {
    const inventoryMap = new Map();

    // Process stocks (entrées)
    stocks.forEach(stock => {
      const nomProduit = stock.nomProduit;
      if (!nomProduit) return;

      if (!inventoryMap.has(nomProduit)) {
        inventoryMap.set(nomProduit, {
          nomProduit,
          entree: 0,
          attribution: 0,
          sortie: 0,
          entreeParMois: Array(12).fill(0),
          attributionParMois: Array(12).fill(0),
          sortieParMois: Array(12).fill(0),
          lastUpdate: new Date(stock.date_MiseAJour || stock.date_Creation || Date.now())
        });
      }

      const data = inventoryMap.get(nomProduit);
      data.entree++;
      const month = new Date(stock.date_MiseAJour || stock.date_Creation || Date.now()).getMonth();
      data.entreeParMois[month]++;
      
      if (new Date(stock.date_MiseAJour || stock.date_Creation || Date.now()) > data.lastUpdate) {
        data.lastUpdate = new Date(stock.date_MiseAJour || stock.date_Creation || Date.now());
      }
    });

    // Process attributions
    attributions.forEach(attribution => {
      try {
        const caracteristique = typeof attribution.caracteristique === 'string' 
          ? JSON.parse(attribution.caracteristique) 
          : attribution.caracteristique;
        
        const items = Array.isArray(caracteristique) ? caracteristique : [caracteristique];
        
        items.forEach(item => {
          const nomProduit = item.type;
          if (!nomProduit) return;

          if (!inventoryMap.has(nomProduit)) {
            inventoryMap.set(nomProduit, {
              nomProduit,
              entree: 0,
              attribution: 0,
              sortie: 0,
              entreeParMois: Array(12).fill(0),
              attributionParMois: Array(12).fill(0),
              sortieParMois: Array(12).fill(0),
              lastUpdate: new Date(attribution.date_attribution || Date.now())
            });
          }

          const data = inventoryMap.get(nomProduit);
          data.attribution++;
          const month = new Date(attribution.date_attribution || Date.now()).getMonth();
          data.attributionParMois[month]++;
          
          if (new Date(attribution.date_attribution || Date.now()) > data.lastUpdate) {
            data.lastUpdate = new Date(attribution.date_attribution || Date.now());
          }
        });
      } catch (e) {
        console.error('Error processing attribution:', e);
      }
    });

    // Process sorties
    sorties.forEach(sortie => {
      try {
        const caracteristique = typeof sortie.caracteristique_sortie === 'string'
          ? JSON.parse(sortie.caracteristique_sortie)
          : sortie.caracteristique_sortie;
        
        const items = Array.isArray(caracteristique) ? caracteristique : [caracteristique];
        
        items.forEach(item => {
          const nomProduit = item.designation || item.type;
          if (!nomProduit) return;

          if (!inventoryMap.has(nomProduit)) {
            inventoryMap.set(nomProduit, {
              nomProduit,
              entree: 0,
              attribution: 0,
              sortie: 0,
              entreeParMois: Array(12).fill(0),
              attributionParMois: Array(12).fill(0),
              sortieParMois: Array(12).fill(0),
              lastUpdate: new Date(sortie.dateSortie || Date.now())
            });
          }

          const data = inventoryMap.get(nomProduit);
          data.sortie++;
          const month = new Date(sortie.dateSortie || Date.now()).getMonth();
          data.sortieParMois[month]++;
          
          if (new Date(sortie.dateSortie || Date.now()) > data.lastUpdate) {
            data.lastUpdate = new Date(sortie.dateSortie || Date.now());
          }
        });
      } catch (e) {
        console.error('Error processing sortie:', e);
      }
    });

    // Calculate final metrics
    const result = Array.from(inventoryMap.values()).map(data => {
      const currentMonth = new Date().getMonth();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

      const entreeCurrentYear = data.entreeParMois.reduce((a, b) => a + b, 0);
      const attributionCurrentYear = data.attributionParMois.reduce((a, b) => a + b, 0);
      const sortieCurrentYear = data.sortieParMois.reduce((a, b) => a + b, 0);

      const netCurrentMonth = data.entreeParMois[currentMonth] - data.attributionParMois[currentMonth] - data.sortieParMois[currentMonth];
      const netPreviousMonth = data.entreeParMois[previousMonth] - data.attributionParMois[previousMonth] - data.sortieParMois[previousMonth];
      
      let variationMensuelle = 0;
      if (netPreviousMonth !== 0) {
        variationMensuelle = ((netCurrentMonth - netPreviousMonth) / Math.abs(netPreviousMonth)) * 100;
      } else if (netCurrentMonth !== 0) {
        variationMensuelle = 100;
      }

      const netCurrentYear = entreeCurrentYear - attributionCurrentYear - sortieCurrentYear;
      const netPreviousYear = data.entree - data.attribution - data.sortie - netCurrentYear;
      
      let variationAnnuelle = 0;
      if (netPreviousYear !== 0) {
        variationAnnuelle = ((netCurrentYear - netPreviousYear) / Math.abs(netPreviousYear)) * 100;
      } else if (netCurrentYear !== 0) {
        variationAnnuelle = 100;
      }

      return {
        ...data,
        comparaison: data.entree - data.attribution - data.sortie,
        variationMensuelle,
        variationAnnuelle
      };
    });

    return result.sort((a, b) => b.lastUpdate - a.lastUpdate);
  }, [stocks, attributions, sorties]);

  // derive stock alerts for modal (like stocks.jsx)
  const stockAlerts = useMemo(() => {
    const alerts = [];
    computeInventoryData.forEach(item => {
      // same thresholds used earlier: monthly/annual variation <= 40% are warnings
      if (item.variationMensuelle <= 40) {
        alerts.push({
          product: item.nomProduit,
          type: 'warning',
          message: `Variation Mensuelle faible (≤40%) pour: ${item.nomProduit}`
        });
      }
      if (item.variationAnnuelle <= 40) {
        alerts.push({
          product: item.nomProduit,
          type: 'warning',
          message: `Variation Annuelle faible (≤40%) pour: ${item.nomProduit}`
        });
      }
    });
    return alerts;
  }, [computeInventoryData]);

  const hasCriticalAlerts = stockAlerts.some(a => a.type === 'critical');

  // Chart statistics
  const chartStats = useMemo(() => {
    const stats = {
      entree: Array(12).fill(0),
      attribution: Array(12).fill(0),
      sortie: Array(12).fill(0),
    };

    const dataToProcess = selectedCategoryForStats 
      ? computeInventoryData.filter(d => d.nomProduit === selectedCategoryForStats)
      : computeInventoryData;

    dataToProcess.forEach(item => {
      for (let i = 0; i < 12; i++) {
        stats.entree[i] += item.entreeParMois[i];
        stats.attribution[i] += item.attributionParMois[i];
        stats.sortie[i] += item.sortieParMois[i];
      }
    });

    return stats;
  }, [computeInventoryData, selectedCategoryForStats]);

  // Filtered historique data
  const filteredHistorique = useMemo(() => {
    let data = [...computeInventoryData];

    if (searchQuery) {
      data = data.filter(item =>
        item.nomProduit.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory) {
      data = data.filter(item => item.nomProduit === filterCategory);
    }

    // NOUVEAU FILTRE PAR DATE EXACTE
    if (filterDate) {
      data = data.filter(s => 
        s.lastUpdate && 
        String(s.lastUpdate).slice(0, 10) === filterDate
      );
    }

    if (filterMonth || filterYear) {
      data = data.filter(item => {
        const itemDate = item.lastUpdate;
        if (filterYear && itemDate.getFullYear() !== parseInt(filterYear)) return false;
        if (filterMonth && itemDate.getMonth() + 1 !== parseInt(filterMonth)) return false;
        return true;
      });
    }

    return data;
  }, [computeInventoryData, searchQuery, filterCategory, filterDate, filterMonth, filterYear]);

  // Paginated data
  const paginatedHistorique = useMemo(() => {
    return filteredHistorique.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredHistorique, currentPage]);

  const totalPages = Math.ceil(filteredHistorique.length / ITEMS_PER_PAGE);

  // Export PDF for historique (comme stocks.jsx)
  const exportHistoriquePDF = () => {
    if (filteredHistorique.length === 0) {
      showNotification('Aucune donnée à imprimer.', 'warning');
      return;
    }
    const w = window.open('', '', 'height=600,width=800')
    w.document.write('<html><head><title>Inventaire - Historique</title>')
    w.document.write(`
      <style>
        body { font-family: Arial; font-size:12px; }
        h1 { text-align:center; font-size:18px; }
        table { width:100%; border-collapse:collapse; }
        th,td { border:1px solid #ddd; padding:6px; }
        th { background:#f2f2f2; }
      </style>
    </head><body>`)
    w.document.write(
      `<h1>Inventaire - Historique des Mouvements - ${new Date().toLocaleDateString('fr-FR')}</h1>`
    )
    w.document.write('<table><thead><tr>'
      + '<th>Nom Produit</th><th>Entrée</th><th>Attribution</th><th>Sortie</th>'
      + '<th>Comparaison</th><th>Var. Mensuelle (%)</th><th>Var. Annuelle (%)</th><th>Date MAJ</th>'
      + '</tr></thead><tbody>'
    )
    filteredHistorique.forEach(item => {
      w.document.write(`<tr>
        <td>${item.nomProduit}</td>
        <td>${item.entree}</td>
        <td>${item.attribution}</td>
        <td>${item.sortie}</td>
        <td>${item.comparaison}</td>
        <td>${item.variationMensuelle.toFixed(2)}</td>
        <td>${item.variationAnnuelle.toFixed(2)}</td>
        <td>${item.lastUpdate.toLocaleString('fr-FR')}</td>
      </tr>`)
    })
    w.document.write('</tbody></table></body></html>')
    w.document.close()
    w.print()
  };

  // Export chart as PDF
  const exportChartAsPdf = () => {
    if (!chartRef.current) {
      showNotification("Graphique non disponible.", 'error');
      return;
    }
    const doc = new jsPDF('landscape', 'pt', 'a4');
    doc.setFontSize(16);
    doc.text(`Statistiques d'Inventaire - ${selectedCategoryForStats || 'Tous les produits'}`, 40, 40);
    const base64 = chartRef.current.toBase64Image();
    doc.addImage(base64, 'PNG', 40, 60, 700, 350);
    doc.save('statistiques-inventaire.pdf');
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterMonth('');
    setFilterYear('');
    setFilterDate('');
    setCurrentPage(1);
    fetchAllData();
  };

  const handleStatButtonClick = (category) => {
    setSelectedCategoryForStats(category);
    setActiveView('statistique');
  };

  const handleDeleteItem = async (nomProduit) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'élément "${nomProduit}" ?`)) return;
    
    try {
      const itemToDelete = inventaireData.find(item => item.nom_produit === nomProduit);
      if (itemToDelete) {
        await axios.delete(`${API_BASE_URL}/inventaire/${itemToDelete.id_inventaire}`);
      }
      await fetchAllData();
      showNotification("Élément supprimé avec succès.", 'success');
    } catch (error) {
      showNotification("Erreur lors de la suppression.", 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer TOUS les éléments de l\'inventaire ?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/inventaire`);
      await fetchAllData();
      showNotification("Tous les éléments ont été supprimés avec succès.", 'success');
    } catch (error) {
      showNotification("Erreur lors de la suppression de tous les éléments.", 'error');
    }
  };

  const handleNotificationClick = () => {
    setStockAlertModalVisible(true);
  };

  function resetDateFilters() {
    setFilterDate('')
    setFilterMonth('')
    setFilterYear('')
    setDropdownOpen(null)
  }

  // Historique view
  const renderHistorique = () => (
    <>
      <div className="actions-container">
        <div className="action-buttons">
          <button className="pdf-button print-historique" onClick={exportHistoriquePDF}>
            <IoDocumentTextOutline /> Imprimer PDF
          </button>
          {filteredHistorique.length > 0 && (
            <button className="delete-all-button" onClick={handleDeleteAll}>
              <FaTrash /> Supprimer tout
            </button>
          )}
        </div>
        
        <div className="filters-wrapper">
          <span className="filter-label">Filtres :</span>
          
          {/* Category avec barre de recherche */}
          <div className="dropdown">
            <button className={`dropdown-button ${filterCategory ? 'active-filter' : ''}`} onClick={() => setDropdownOpen(o => o === 'category' ? null : 'category')}>
              {filterCategory || 'Catégorie'} <FaAngleDown />
            </button>
            {dropdownOpen === 'category' && (
              <div className="dropdown-content">
                <div className="dropdown-search">
                  <input
                    type="text"
                    placeholder="Rechercher catégorie…"
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>

                <button onClick={() => { setFilterCategory(''); setDropdownOpen(null); setCategorySearch(''); }}>
                  Toutes
                </button>

                <div className="dropdown-scroll-list">
                  {productCategories
                    .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((cat, i) => (
                      <button 
                        key={i} 
                        onClick={() => { setFilterCategory(cat); setDropdownOpen(null); setCategorySearch(''); }}
                      >
                        {cat}
                      </button>
                  ))}
                </div>

                {productCategories.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                  <div className="no-data-message">Aucune catégorie trouvée.</div>
                )}
              </div>
            )}
          </div>
          
          {/* Date filter comme stocks.jsx */}
          <div className="dropdown">
            <button 
              className={`dropdown-button ${filterDate || filterMonth || filterYear ? 'active-filter' : ''}`} 
              onClick={() => setDropdownOpen(d => d === 'date' ? null : 'date')}
            >
              Date <FaAngleDown size={12} />
            </button>
            {dropdownOpen === 'date' && (
              <div className="dropdown-content date-filters-container">
                {/* NOUVEAU FILTRE PAR DATE EXACTE */}
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="filter-row">
                  <select 
                    value={filterMonth} 
                    onChange={e => setFilterMonth(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Mois (tous)</option>
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                  <select 
                    value={filterYear} 
                    onChange={e => setFilterYear(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Année (tous)</option>
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={resetDateFilters}>
                  Effacer
                </button>
              </div>
            )}
          </div>
          
          <button className="refresh-button" onClick={handleRefresh}>
            <IoMdRefresh size={18}/> Actualiser
          </button>
        </div>
      </div>

      {/* Table with internal scrollbar and action buttons styled like stocks.jsx */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nom Produit</th>
              <th>Entrée</th>
              <th>Attribution</th>
              <th>Sortie</th>
              <th>Comparaison</th>
              <th>Var. Mensuelle</th>
              <th>Var. Annuelle</th>
              <th>Date de Mise à Jour</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="9" className="no-data-cell">Chargement...</td></tr>
            ) : paginatedHistorique.length > 0 ? (
              paginatedHistorique.map((item, index) => (
                <tr key={index}>
                  <td>{item.nomProduit}</td>
                  <td>{item.entree}</td>
                  <td>{item.attribution}</td>
                  <td>{item.sortie}</td>
                  <td className={item.comparaison >= 0 ? 'positive' : 'negative'}>{item.comparaison}</td>
                  <td className={item.variationMensuelle >= 0 ? 'positive' : 'negative'}>{item.variationMensuelle.toFixed(2)}%</td>
                  <td className={item.variationAnnuelle >= 0 ? 'positive' : 'negative'}>{item.variationAnnuelle.toFixed(2)}%</td>
                  <td>{item.lastUpdate.toLocaleString('fr-FR')}</td>
                  <td className="actions-cell">
                    <button
                      className="action-icon edit"
                      onClick={() => handleStatButtonClick(item.nomProduit)}
                      title="Statistiques"
                    >
                      <FaChartBar />
                    </button>
                    <button
                      className="action-icon delete"
                      onClick={() => handleDeleteItem(item.nomProduit)}
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="9" className="no-data-cell">Aucune donnée trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</button>
          <span>Page {currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Suivant</button>
        </div>
      )}
    </>
  );

  // Statistiques view (unchanged)
  const renderStatistiques = () => {
    const currentMonth = new Date().getMonth();
    const totalCurrentMonth = chartStats.entree[currentMonth] + chartStats.attribution[currentMonth] + chartStats.sortie[currentMonth];
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const totalPreviousMonth = chartStats.entree[previousMonth] + chartStats.attribution[previousMonth] + chartStats.sortie[previousMonth];
    
    const variationMensuelle = totalPreviousMonth !== 0 
      ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100 
      : totalCurrentMonth !== 0 ? 100 : 0;

    const chartData = {
      labels: MONTH_LABELS,
      datasets: [
        { label: 'Entrées', data: chartStats.entree, backgroundColor: '#4CAF50' },
        { label: 'Attributions', data: chartStats.attribution, backgroundColor: '#2196F3' },
        { label: 'Sorties', data: chartStats.sortie, backgroundColor: '#F44336' },
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { 
          display: true, 
          text: `Mouvements pour : ${selectedCategoryForStats || 'Tous les produits'}` 
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Quantité' },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              if (value % 1 === 0) {
                return value;
              }
            }
          }
        },
      }
    };

    return (
      <div className="stats-view">
        <div className="stats-cards-container">
          <div className="stat-card">
            <div className="stat-card-number">{totalCurrentMonth}</div>
            <div className="stat-card-label">Équipements (Mois en cours)</div>
          </div>
          <div className="stat-card">
            <div className={`stat-card-number ${variationMensuelle >= 0 ? 'positive' : 'negative'}`}>
              {variationMensuelle.toFixed(2)}%
            </div>
            <div className="stat-card-label">Variation Mensuelle</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="pdf-button export-graph" onClick={exportChartAsPdf}>
              <FaFilePdf />Exporter le Graphe
            </button>
          </div>
        </div>
        
        <div className="chart-container">
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <div style={{ height: '400px' }}>
              <Bar ref={chartRef} options={chartOptions} data={chartData} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
:root {
  --ui-scale: 1;
  --brand-blue: #0070B2;
  --danger-red: #E74C3C;
  --neuf-green: #9be7a6;
  --reforme-red-light: #f7b3b3;
  --bg: #f4f6f9;
  --card-bg: #ffffff;
  --muted: #666;
  --muted-weak: #aaa;
}
.container-fluid {
  transform: scale(var(--ui-scale));
  transform-origin: top left;
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--bg);
  font-family: Arial, sans-serif;
  overflow: hidden;
}
.sidebar { 
  width: 250px; 
  background-color: #689f38; 
  color: white; 
  display: flex; 
  flex-direction: column; 
  padding: 15px; 
  flex-shrink: 0; 
  z-index: 100;
  transition: transform 0.3s ease-in-out;
  margin-left : -20px;
}
.sidebar-title { margin-left : 5px; font-size: 22px; font-weight: bold; margin-bottom: 15px; padding-bottom: 20px;border-bottom: 1px solid rgba(255, 255, 255, 0.2);}
.sidebar-item {  margin-top: -5px; margin-left : 5px; display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; text-decoration: none; color: white; font-size: 14px; transition: background-color 0.2s; }
.sidebar-item:hover { background-color: rgba(255, 255, 255, 0.1); }
.sidebar-item.active { background-color: rgba(255, 255, 255, 0.2); font-weight: bold; }

.sidebar-item-deconnect {  margin-top: 5px; margin-left : 5px; display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; text-decoration: none; color: white; font-size: 14px; transition: background-color 0.2s; }
.sidebar-item-deconnect:hover { background-color: rgba(255, 255, 255, 0.1); }
.sidebar-item-deconnect.active { background-color: rgba(255, 255, 255, 0.2); font-weight: bold; }

.sidebar-footer { padding-top: 10px; margin-left : 5px; margin-top: 10px;  border-top: 1px solid rgba(255, 255, 255, 0.2); }
.user-profile { display: flex; align-items: center; gap: 12px; margin-top: 15px; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: bold; font-size: 14px; }
.user-email { font-size: 12px; opacity: 0.8; }

/* MAIN */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  max-height: 100vh;
}

/* HEADER (desktop) */
.header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 16px;
  margin-bottom:20px;
  flex-shrink:0;
}
.header-title {
  font-size:28px;
  font-weight:700;
  color:#333;
  flex-grow:1;
  text-align:center;
}
.header-right { display:flex; align-items:center; gap:12px; }

/* Search and buttons */
.search-input {
  padding:8px 14px;
  border:1px solid #ddd;
  border-radius:20px;
  font-size:14px;
  width:260px;
  background: #fff;
}
.back-button {
  background: #f4f4f4;
  color:#333;
  padding:8px 12px;
  border-radius:6px;
  border:1px solid #ddd;
  display:flex; align-items:center; gap:8px; cursor:pointer;
}

/* Notification (copied from stocks.jsx) */
.notification-button {
  background:none; border: none; cursor:pointer; padding:8px; border-radius:50%;
  position:relative; transition: all .2s;
}
.notification-button.alert { animation: pulse 2s infinite; color: var(--danger-red); }
@keyframes pulse { 0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)} }
.notification-badge {
  position:absolute; top:-6px; right:-6px; background:var(--danger-red); color:white;
  width:20px; height:20px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; font-size:12px; font-weight:700;
}

/* SCROLL CONTENT */
.scroll-content {
  flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; padding-right:8px;
  display:flex; flex-direction:column;
}

/* ACTIONS & FILTERS */
.actions-container {
  display:flex; justify-content:space-between; align-items:center; gap:12px;
  margin-bottom:18px; flex-wrap:wrap;
}
.action-buttons { display:flex; gap:10px; flex-wrap:wrap; }

.add-button, .pdf-button, .delete-all-button, .category-button {
  padding:10px 16px; border-radius:6px; border:none; cursor:pointer; font-weight:700;
  display:inline-flex; align-items:center; gap:8px; font-size:14px;
}

/* color adjustments */
.add-button { background:#689f38; color:white; }
/* Use stocks.jsx colors for PDF/export buttons as requested */
.pdf-button { background:#E67E22; color:white; }
.delete-all-button { background:var(--danger-red); color:white; }
.category-button { background:#555; color:white; }
.refresh-button { background:#f4f4f4; color:#333; border:1px solid #ddd; padding:10px 14px; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; }

.filters-wrapper { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.filter-label { font-size:14px; color:#555; font-weight:700; }

/* DROPDOWN (new style) */
.dropdown { position:relative; display:inline-block; }
.dropdown-button {
  padding:10px 14px; border:1px solid #ddd; border-radius:6px; background:white; cursor:pointer;
  display:flex; align-items:center; gap:8px; font-size:14px; min-width:120px; justify-content:space-between;
}
.dropdown-content {
  position:absolute; top:100%; left:0; background:white; border:1px solid #ddd; border-radius:6px;
  box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:1000; min-width:200px; max-height:300px; overflow-y:auto;
}
.dropdown-search { padding:8px; border-bottom:1px solid #eee; }
.dropdown-search input {
  width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:14px;
}
.dropdown-content button {
  width:100%; padding:10px 12px; border:none; background:none; text-align:left; cursor:pointer;
  border-bottom:1px solid #f0f0f0; font-size:14px;
}
.dropdown-content button:hover { background:#f5f5f5; }
.dropdown-content button:last-child { border-bottom:none; }

/* ensure dropdown scroll list exists */
.dropdown-scroll-list { max-height: 220px; overflow-y: auto; }

/* Date filters */
.date-filters-container {
  padding:12px; display:flex; flex-direction:column; gap:10px; min-width:250px;
}
.date-filters-container input[type="date"] {
  padding:8px; border:1px solid #ddd; border-radius:4px; font-size:14px;
}
.filter-row { display:flex; gap:8px; }
.filter-row select {
  flex:1; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:14px;
}
.date-filters-container button[type="button"] {
  background:#f4f4f4; color:#333; border:1px solid #ddd; padding:8px; border-radius:4px; cursor:pointer;
}

/* TABLE - add internal scrollbar and keep header sticky */
.table-container {
  flex:1; overflow:auto; border:1px solid #ddd; border-radius:8px; background:white;
  margin-bottom:16px; max-height: calc(100vh - 300px);
}
table {
  width:100%; border-collapse:collapse; font-size:14px; min-width:800px;
  table-layout: auto;
}
th, td {
  padding:12px 14px; text-align:left; border-bottom:1px solid #eee;
  white-space: nowrap;
}
th { background:#f9f9f9; font-weight:700; color:#333; position:sticky; top:0; z-index:10; }
tr:hover { background:#f8f8f8; }
.positive { color:#2E7D32; font-weight:700; }
.negative { color:#C62828; font-weight:700; }
.no-data-cell { text-align:center; padding:40px; color:#777; }

/* ACTION ICONS (copied from stocks.jsx) */
.actions-cell { 
  white-space:nowrap; 
  min-width: 80px;
}
.action-icon { 
  background:none; 
  border:none; 
  cursor:pointer; 
  font-size:16px; 
  margin-right:8px; 
  padding: 6px;
  border-radius:6px;
}
.action-icon.edit { color:#2b82cc; background: transparent; }
.action-icon.delete { color:var(--danger-red); background: transparent; }

/* small hover affordances */
.action-icon:hover { background: rgba(0,0,0,0.04); }

/* PAGINATION */
.pagination-container {
  display:flex; justify-content:center; align-items:center; gap:16px; margin-top:16px;
}
.pagination-container button {
  padding:8px 16px; border:1px solid #ddd; background:white; border-radius:4px; cursor:pointer;
}
.pagination-container button:disabled { opacity:0.5; cursor:not-allowed; }

/* STATS VIEW */
.stats-view { display:flex; flex-direction:column; gap:20px; }
.stats-cards-container { display:flex; gap:16px; align-items:center; }
.stat-card {
  background:white; border-radius:8px; padding:20px; box-shadow:0 2px 4px rgba(0,0,0,0.05);
  text-align:center; min-width:180px;
}
.stat-card-number { font-size:32px; font-weight:700; margin-bottom:8px; }
.stat-card-label { font-size:14px; color:#666; }
.chart-container { background:white; border-radius:8px; padding:20px; box-shadow:0 2px 4px rgba(0,0,0,0.05); }

/* VIEW SWITCHER */
.view-switcher {
  display:flex; background:#f0f0f0; border-radius:8px; padding:4px; margin-bottom:20px; flex-shrink:0;
}
.view-button {
  flex:1; padding:12px 16px; border:none; background:none; border-radius:6px; cursor:pointer;
  font-weight:700; color:#666; display:flex; align-items:center; justify-content:center; gap:8px;
}
.view-button.active { background:white; color:#333; box-shadow:0 2px 4px rgba(0,0,0,0.1); }

/* NOTIFICATION (styled like stocks.jsx) */
.notification-container {
  position:fixed; top:20px; right:20px; z-index:9999; max-width:400px;
  transition:all 0.3s ease-in-out; transform:translateX(150%); opacity:0;
}
.notification-container.visible {
  transform:translateX(0); opacity:1;
}
.notification {
  padding:16px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);
  display:flex; align-items:flex-start; gap:12px; font-size:14px;
}
.notification.error { background:#ffebee; color:#c62828; border-left:4px solid #c62828; }
.notification.success { background:#e8f5e9; color:#2e7d32; border-left:4px solid #2e7d32; }
.notification.warning { background:#fff3e0; color:#ef6c00; border-left:4px solid #ef6c00; }
.notification-close {
  background:none; border:none; cursor:pointer; padding:0; margin-left:auto;
  color:inherit; opacity:0.7;
}

/* RESPONSIVE */
@media (max-width: 1023px) {
  .sidebar { position:fixed; left:0; top:0; height:100vh; transform:translateX(-100%); }
  .sidebar.open { transform:translateX(0); }
  .main-content { width:100%; padding:16px; }
  .header-title { font-size:24px; }
  .search-input { width:200px; }
  .actions-container { flex-direction:column; align-items:stretch; gap:16px; }
  .action-buttons, .filters-wrapper { width:100%; justify-content:center; }
  .table-container { max-height: calc(100vh - 350px); }
}
@media (max-width: 767px) {
  .header { flex-direction:column; gap:12px; }
  .header-title { text-align:center; font-size:20px; }
  .search-input { width:100%; }
  .actions-container { gap:12px; }
  .action-buttons { flex-direction:column; width:100%; }
  .action-buttons button { width:100%; justify-content:center; }
  .filters-wrapper { flex-direction:column; width:100%; }
  .dropdown-button { width:100%; }
  .stats-cards-container { flex-direction:column; }
  .stat-card { width:100%; }
  .table-container { max-height: calc(100vh - 400px); }
  .view-button { padding:10px 12px; font-size:13px; }
}

/* Mobile menu button */
.mobile-menu-button {
  display:none; background:none; border:none; font-size:20px; cursor:pointer; padding:8px;
  position:absolute; left:16px; top:16px; z-index:101;
}
@media (max-width: 1023px) {
  .mobile-menu-button { display:block; }
}

/* Overlay for mobile sidebar */
.sidebar-overlay {
  position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5);
  z-index:99; display:none;
}
@media (max-width: 1023px) {
  .sidebar-overlay.open { display:block; }
}

/* small helpers */
.active-filter { border-color: #0070B2; background-color: #f0f8ff; color: #0070B2; font-weight:700; }

      `}</style>

      <div className="container-fluid">
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FaBars />
        </button>

        {/* Sidebar Overlay */}
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-title">GestionStock</div>
          <a href="/" className="sidebar-item"><FaHome />Accueil</a>
          <a href="/stocks" className="sidebar-item"><FaDropbox />Stocks</a>
          <a href="/attributions" className="sidebar-item"><FaUser />Attributions</a>
          <a href="/sorties" className="sidebar-item"><FaTruck />Sorties</a>
          <a href="/inventaire" className="sidebar-item active"><FaHistory />Inventaire</a>
          <a href="/statistique" className="sidebar-item"><FaChartBar />Statistiques</a>
          <div className="sidebar-footer">
            <div className="user-profile">
              <FaUserCircle size={40} />
              <div className="user-info">
                <div className="user-name">Admin</div>
                <div className="user-email">admin@example.com</div>
              </div>
            </div>
            <a href="/logout" className="sidebar-item-deconnect"><MdLogout />Se déconnecter</a>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="header">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Retour
            </button>
            <h1 className="header-title">Inventaire</h1>
            <div className="header-right">
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button 
                className={`notification-button ${stockAlerts.length > 0 ? 'alert' : ''}`}
                onClick={handleNotificationClick}
                title="Alertes d'inventaire"
              >
                <IoMdNotificationsOutlineIcon size={24} />
                {stockAlerts.length > 0 && <span className="notification-badge">{stockAlerts.length}</span>}
              </button>
            </div>
          </div>

          <div className="scroll-content">
            {/* View Switcher */}
            <div className="view-switcher">
              <button 
                className={`view-button ${activeView === 'historique' ? 'active' : ''}`}
                onClick={() => setActiveView('historique')}
              >
                <FaHistory /> Historique
              </button>
              <button 
                className={`view-button ${activeView === 'statistique' ? 'active' : ''}`}
                onClick={() => setActiveView('statistique')}
              >
                <FaChartBar /> Statistique
              </button>
            </div>

            {/* Main Content Area */}
            {activeView === 'historique' ? renderHistorique() : renderStatistiques()}
          </div>
        </div>
      </div>

      {/* Notification Alert (styled like stocks.jsx) */}
      <div className={`notification-container ${notification.visible ? 'visible' : ''}`}>
        {notification.visible && (
          <div className={`notification ${notification.type}`}>
            <div>
              {notification.type === 'error' && '❌ '}
              {notification.type === 'success' && '✅ '}
              {notification.type === 'warning' && '⚠️ '}
              {notification.message}
            </div>
            <button 
              className="notification-close"
              onClick={() => setNotification({ message: '', type: '', visible: false })}
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      {/* Stock Alert Modal (copied behaviour from stocks.jsx) */}
      {stockAlertModalVisible && (
        <div className="modal-container">
          <div className="modal-view stock-alert-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Alertes d'Inventaire</h3>
            <div className="alert-list">
              {stockAlerts.length === 0 ? (
                <p>Aucune alerte pour le moment.</p>
              ) : (
                stockAlerts.map((alert, idx) => (
                  <div key={idx} className={`alert-item ${alert.type}`}>
                    {alert.message}
                  </div>
                ))
              )}
            </div>
            <div className="modal-buttons">
              <button 
                className="modal-button-cancel" 
                onClick={() => setStockAlertModalVisible(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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

  // Stock alerts state
  const [stockAlerts, setStockAlerts] = useState([]);

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
          lastUpdate: new Date(stock.date_MiseAJour)
        });
      }

      const data = inventoryMap.get(nomProduit);
      data.entree++;
      const month = new Date(stock.date_MiseAJour).getMonth();
      data.entreeParMois[month]++;
      
      if (new Date(stock.date_MiseAJour) > data.lastUpdate) {
        data.lastUpdate = new Date(stock.date_MiseAJour);
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
              lastUpdate: new Date(attribution.date_attribution)
            });
          }

          const data = inventoryMap.get(nomProduit);
          data.attribution++;
          const month = new Date(attribution.date_attribution).getMonth();
          data.attributionParMois[month]++;
          
          if (new Date(attribution.date_attribution) > data.lastUpdate) {
            data.lastUpdate = new Date(attribution.date_attribution);
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
              lastUpdate: new Date(sortie.dateSortie)
            });
          }

          const data = inventoryMap.get(nomProduit);
          data.sortie++;
          const month = new Date(sortie.dateSortie).getMonth();
          data.sortieParMois[month]++;
          
          if (new Date(sortie.dateSortie) > data.lastUpdate) {
            data.lastUpdate = new Date(sortie.dateSortie);
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

  // Calculate stock alerts like in stocks.jsx
  useEffect(() => {
    const categoryCounts = {};
    stocks.forEach(stock => {
      const category = stock.nomProduit;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const alerts = [];
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count < 2) {
        alerts.push({
          category,
          count,
          type: 'critical',
          message: `ALERTE: Il ne reste que ${count} produit(s) dans la catégorie "${category}"`
        });
      } else if (count <= 5) {
        alerts.push({
          category,
          count,
          type: 'warning',
          message: `Attention: Il reste ${count} produits dans la catégorie "${category}"`
        });
      }
    });

    setStockAlerts(alerts);
  }, [stocks]);

  const hasCriticalAlerts = stockAlerts.some(alert => alert.type === 'critical');

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
          <button className="pdf-button" onClick={exportHistoriquePDF}>
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
          
          {/* Category avec barre de recherche et défilement */}
          <div className="dropdown">
            <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'category' ? null : 'category')}>
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
                <div className="dropdown-scroll-list">
                  <button onClick={() => { setFilterCategory(''); setDropdownOpen(null); setCategorySearch(''); }}>
                    Toutes
                  </button>

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

                  {productCategories.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                    <div className="no-data-message">Aucune catégorie trouvée.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Date filter comme stocks.jsx */}
          <div className="dropdown">
            <button 
              className="dropdown-button" 
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

      {/* Table avec barre de défilement interne */}
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
                      title="Voir statistiques"
                    >
                      <FaChartBar/>
                    </button>
                    <button
                      className="action-icon delete"
                      onClick={() => handleDeleteItem(item.nomProduit)}
                      title="Supprimer"
                    >
                      <FaTrash/>
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

  // Statistiques view (avec défilement de page)
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
            <button className="pdf-button" onClick={exportChartAsPdf}>
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

  // Composant d'icône de notification (identique à stocks.jsx)
  const IoMdNotificationsOutline = ({ size }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="currentColor"
    >
      <path d="M256,480a80,80,0,0,0,73.47-48H182.53A80,80,0,0,0,256,480Z"/>
      <path d="M400,288V227.47C400,157,372.64,95.61,304,80l-8-48H216l-8,48c-68.64,15.61-96,77-96,147.47V288L64,352v48H448V352ZM368,368H144V336l32-32V224c0-47.14,21.37-89.67,55-118.51C223.28,99.68,239.31,96,256,96s32.72,3.68,41,9.49C330.63,134.33,352,176.86,352,224v80l32,32Z"/>
    </svg>
  );

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

/* Notification */
.notification-button {
  background:none; border: none; cursor: pointer; position: relative; padding: 8px;
}
.notification-button svg { color: #333; }
.notification-badge {
  position: absolute; top: 0; right: 0; background: var(--danger-red); color: white; 
  border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; 
  align-items: center; justify-content: center;
}

/* Mobile header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.mobile-menu-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #333;
}
.mobile-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.mobile-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Mobile sidebar overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: none;
}
.sidebar-overlay.active {
  display: block;
}

/* TABS */
.tabs-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.tab-button {
  padding: 10px 20px;
  background: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.tab-button.active {
  background: var(--brand-blue);
  color: white;
  border-color: var(--brand-blue);
}

/* ACTIONS */
.actions-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
  flex-shrink: 0;
}
.action-buttons {
  display: flex;
  gap: 10px;
}
.filters-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

/* BUTTONS */
.pdf-button {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.pdf-button:hover {
  background: #b71c1c;
}
.delete-all-button {
  background: var(--danger-red);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.delete-all-button:hover {
  background: #c0392b;
}
.refresh-button {
  background: #f4f4f4;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.refresh-button:hover {
  background: #e9e9e9;
}

/* DROPDOWN */
.dropdown {
  position: relative;
  display: inline-block;
}
.dropdown-button {
  background: white;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  justify-content: space-between;
}
.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-width: 200px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 5px;
}
.dropdown-search {
  padding: 8px;
  border-bottom: 1px solid #eee;
}
.dropdown-search input {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.dropdown-scroll-list {
  max-height: 200px;
  overflow-y: auto;
}
.dropdown-content button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}
.dropdown-content button:hover {
  background: #f5f5f5;
}
.date-filters-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 250px;
}
.date-filters-container input,
.date-filters-container select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.filter-row {
  display: flex;
  gap: 8px;
}
.filter-row select {
  flex: 1;
}
.date-filters-container button {
  background: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
}
.date-filters-container button:hover {
  background: #e9e9e9;
}

/* TABLE */
.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  margin-bottom: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}
th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}
th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 1;
}
tbody tr:hover {
  background: #f8f9fa;
}
.positive { color: #2ecc71; font-weight: bold; }
.negative { color: #e74c3c; font-weight: bold; }
.no-data-cell { text-align: center; color: #999; padding: 40px; }

/* ACTION CELL */
.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}
.action-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}
.action-icon.edit {
  background: #3498db;
  color: white;
}
.action-icon.edit:hover {
  background: #2980b9;
}
.action-icon.delete {
  background: #e74c3c;
  color: white;
}
.action-icon.delete:hover {
  background: #c0392b;
}

/* PAGINATION */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  flex-shrink: 0;
}
.pagination-container button {
  padding: 8px 16px;
  background: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.pagination-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-container span {
  font-size: 14px;
  color: #666;
}

/* STATS VIEW */
.stats-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: auto;
}
.stats-cards-container {
  display: flex;
  gap: 20px;
  align-items: center;
}
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-width: 200px;
  text-align: center;
}
.stat-card-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}
.stat-card-label {
  font-size: 14px;
  color: #666;
}
.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex: 1;
  min-height: 400px;
}

/* NOTIFICATION MODAL */
.notification-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.notification-modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}
.notification-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.notification-modal-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.notification-modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notification-item {
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid;
}
.notification-item.critical {
  background: #ffeaea;
  border-left-color: var(--danger-red);
}
.notification-item.warning {
  background: #fff4e6;
  border-left-color: #f39c12;
}
.notification-message {
  font-size: 14px;
  color: #333;
}

/* RESPONSIVE */
@media (max-width: 767px) {
  .container-fluid {
    flex-direction: column;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    z-index: 1000;
  }
  .sidebar.active {
    transform: translateX(0);
  }
  .main-content {
    padding: 15px;
    max-height: none;
  }
  .header {
    flex-direction: column;
    gap: 10px;
  }
  .header-title {
    text-align: center;
    font-size: 24px;
  }
  .search-input {
    width: 100%;
  }
  .actions-container {
    flex-direction: column;
    align-items: stretch;
  }
  .action-buttons {
    justify-content: center;
  }
  .filters-wrapper {
    justify-content: center;
  }
  .stats-cards-container {
    flex-direction: column;
  }
  .stat-card {
    width: 100%;
  }
  .dropdown-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 300px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 200px;
  }
  .main-content {
    padding: 20px;
  }
  .actions-container {
    flex-direction: column;
    align-items: stretch;
  }
  .filters-wrapper {
    justify-content: center;
  }
}

/* Notification toast */
.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  z-index: 1001;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideInRight 0.3s ease-out;
}
.notification-toast.success { background: #27ae60; }
.notification-toast.error { background: #e74c3c; }
.notification-toast.warning { background: #f39c12; }
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.no-data-message {
  padding: 10px;
  text-align: center;
  color: #666;
  font-style: italic;
}
      `}</style>

      <div className="container-fluid">
        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
          <div className="sidebar-title">Gestion Stock</div>
          <a href="/accueil" className="sidebar-item"><FaHome /> Accueil</a>
          <a href="/stocks" className="sidebar-item"><FaDropbox /> Stocks</a>
          <a href="/attributions" className="sidebar-item"><FaUser /> Attributions</a>
          <a href="/sorties" className="sidebar-item"><FaTruck /> Sorties</a>
          <a href="/inventaire" className="sidebar-item active"><FaHistory /> Inventaire</a>
          <div className="sidebar-footer">
            <a href="/" className="sidebar-item-deconnect"><MdLogout />Se déconnecter</a>
            <div className="user-profile">
              <FaUserCircle size={40} />
              <div className="user-info">
                <div className="user-name">Admin</div>
                <div className="user-email">admin@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Mobile Header */}
          {isMobile && (
            <div className="mobile-header">
              <button className="mobile-menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <FaBars />
              </button>
              <div className="mobile-title">Inventaire</div>
              <div className="mobile-actions">
                <button className="notification-button" onClick={handleNotificationClick}>
                  <IoMdNotificationsOutline size={24} />
                  {hasCriticalAlerts && <span className="notification-badge">!</span>}
                </button>
              </div>
            </div>
          )}

          {/* Desktop Header */}
          {!isMobile && (
            <div className="header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {isTablet && (
                  <button className="mobile-menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <FaBars />
                  </button>
                )}
                <button className="back-button" onClick={() => navigate(-1)}>
                  <FaArrowLeft /> Retour
                </button>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="header-title">Inventaire</div>
              <div className="header-right">
                <button className="notification-button" onClick={handleNotificationClick}>
                  <IoMdNotificationsOutline size={24} />
                  {hasCriticalAlerts && <span className="notification-badge">!</span>}
                </button>
              </div>
            </div>
          )}

          {/* Mobile Search */}
          {isMobile && (
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: '15px', width: '100%' }}
            />
          )}

          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeView === 'historique' ? 'active' : ''}`}
              onClick={() => setActiveView('historique')}
            >
              <FaHistory /> Historique
            </button>
            <button
              className={`tab-button ${activeView === 'statistique' ? 'active' : ''}`}
              onClick={() => setActiveView('statistique')}
            >
              <FaChartBar /> Statistique
            </button>
          </div>

          {/* Content */}
          {activeView === 'historique' ? renderHistorique() : renderStatistiques()}
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && isSidebarOpen && (
          <div className="sidebar-overlay active" onClick={() => setIsSidebarOpen(false)}></div>
        )}
      </div>

      {/* Notification Toast */}
      {notification.visible && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Stock Alerts Modal */}
      {stockAlertModalVisible && (
        <div className="notification-modal">
          <div className="notification-modal-content">
            <div className="notification-modal-header">
              <div className="notification-modal-title">Alertes de Stock</div>
              <button 
                className="notification-modal-close"
                onClick={() => setStockAlertModalVisible(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="notification-list">
              {stockAlerts.length > 0 ? (
                stockAlerts.map((alert, index) => (
                  <div key={index} className={`notification-item ${alert.type}`}>
                    <div className="notification-message">{alert.message}</div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">Aucune alerte pour le moment</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
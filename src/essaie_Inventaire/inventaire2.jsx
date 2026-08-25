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
} from 'react-icons/fa';
import { MdLogout } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaArrowLeft, FaAngleDown, FaBars } from "react-icons/fa6";
import { IoMdNotificationsOutline } from "react-icons/io";

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
  const [alertInfo, setAlertInfo] = useState({ show: false, message: '' });
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Responsive states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1023 && window.innerWidth > 767);

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
      // message styling uses stocks-like notification panel, so avoid window.alert
      setAlertInfo({ show: true, message: "Erreur: impossible de charger les données." });
      setShowNotificationPanel(true);
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

  // Alert check effect (styled messages like stocks.jsx)
  useEffect(() => {
    const lowMonthly = [];
    const lowAnnual = [];

    computeInventoryData.forEach(item => {
      if (item.variationMensuelle <= 40) {
        lowMonthly.push(item.nomProduit);
      }
      if (item.variationAnnuelle <= 40) {
        lowAnnual.push(item.nomProduit);
      }
    });

    let message = '';
    if (lowMonthly.length > 0) {
      message += `Variation Mensuelle faible (≤40%) pour: ${lowMonthly.join(', ')}. `;
    }
    if (lowAnnual.length > 0) {
      message += `Variation Annuelle faible (≤40%) pour: ${lowAnnual.join(', ')}.`;
    }

    if (message) {
      setAlertInfo({ show: true, message });
    } else {
      setAlertInfo({ show: false, message: '' });
    }
  }, [computeInventoryData]);

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
      data = data.filter(item => 
        item.lastUpdate && 
        String(item.lastUpdate).slice(0, 10) === filterDate
      );
    }

    // month/year filters (existants)
    if (filterMonth) {
      data = data.filter(item =>
        item.lastUpdate.getMonth() + 1 === +filterMonth
      );
    }
    if (filterYear) {
      data = data.filter(item =>
        item.lastUpdate.getFullYear() === +filterYear
      );
    }

    return data;
  }, [computeInventoryData, searchQuery, filterCategory, filterDate, filterMonth, filterYear]);

  // Paginated data
  const paginatedHistorique = useMemo(() => {
    return filteredHistorique.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredHistorique, currentPage]);

  const totalPages = Math.ceil(filteredHistorique.length / ITEMS_PER_PAGE);

  // Export PDF for historique - MODIFIÉ POUR UTILISER LA MÊME MÉTHODE QUE STOCKS.JSX
  const exportHistoriquePDF = () => {
    if (filteredHistorique.length === 0) {
      setAlertInfo({ show: true, message: "Aucune donnée à imprimer." });
      setShowNotificationPanel(true);
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
        .positive { color: #27ae60; }
        .negative { color: #e74c3c; }
      </style>
    </head><body>`)
    w.document.write(
      `<h1>Inventaire - Historique des Mouvements - ${new Date().toLocaleDateString('fr-FR')}</h1>`
    )
    w.document.write('<table><thead><tr>'
      + '<th>Nom Produit</th><th>Entrée</th><th>Attribution</th><th>Sortie</th>'
      + '<th>Comparaison</th><th>Var. Mensuelle (%)</th><th>Var. Annuelle (%)</th>'
      + '<th>Date MAJ</th>'
      + '</tr></thead><tbody>'
    )
    filteredHistorique.forEach(item => {
      w.document.write(`<tr>
        <td>${item.nomProduit}</td>
        <td>${item.entree}</td>
        <td>${item.attribution}</td>
        <td>${item.sortie}</td>
        <td class="${item.comparaison >= 0 ? 'positive' : 'negative'}">${item.comparaison}</td>
        <td class="${item.variationMensuelle >= 0 ? 'positive' : 'negative'}">${item.variationMensuelle.toFixed(2)}%</td>
        <td class="${item.variationAnnuelle >= 0 ? 'positive' : 'negative'}">${item.variationAnnuelle.toFixed(2)}%</td>
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
      setAlertInfo({ show: true, message: "Graphique non disponible." });
      setShowNotificationPanel(true);
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
      setAlertInfo({ show: true, message: "Élément supprimé avec succès." });
      setShowNotificationPanel(true);
    } catch (error) {
      setAlertInfo({ show: true, message: "Erreur lors de la suppression." });
      setShowNotificationPanel(true);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer TOUS les éléments de l\'inventaire ?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/inventaire`);
      await fetchAllData();
      setAlertInfo({ show: true, message: "Tous les éléments ont été supprimés avec succès." });
      setShowNotificationPanel(true);
    } catch (error) {
      setAlertInfo({ show: true, message: "Erreur lors de la suppression de tous les éléments." });
      setShowNotificationPanel(true);
    }
  };

  const handleNotificationClick = () => {
    setShowNotificationPanel(!showNotificationPanel);
  };

  const resetDateFilters = () => {
    setFilterDate('');
    setFilterMonth('');
    setFilterYear('');
    setDropdownOpen(null);
  };

  // Historique view - MODIFIÉ POUR AVOIR UNE BARRE DE DÉFILEMENT DANS LE TABLEAU SEULEMENT
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
          
          {/* Category avec barre de recherche */}
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
            )}
          </div>
          
          {/* Date - MODIFIÉ POUR RESSEMBLER À STOCKS.JSX */}
          <div className="dropdown">
            <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'date' ? null : 'date')}>
              Date <FaAngleDown />
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

      {/* TABLEAU AVEC BARRE DE DÉFILEMENT INTERNE SEULEMENT */}
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
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => handleStatButtonClick(item.nomProduit)} className="stat-button">
                        <FaChartBar />
                      </button>
                      <button onClick={() => handleDeleteItem(item.nomProduit)} className="delete-button">
                        <FaTrash />
                      </button>
                    </div>
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

  // Statistiques view (unchanged CSS)
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

  return (
    <>
      {/* Dashboard CSS modifié pour s'adapter aux changements */}
      <style>{`
:root {
  --ui-scale: 1;
  --brand-blue: #0070B2;
  --danger-red: #E74C3C;
  --bg: #f4f6f9;
  --card-bg: #ffffff;
  --muted: #666;
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
}
.sidebar-title { font-size: 22px; font-weight: bold; margin-bottom: 15px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.2);}
.sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; text-decoration: none; color: white; font-size: 14px; transition: background-color 0.2s; }
.sidebar-item:hover { background-color: rgba(255, 255, 255, 0.1); }
.sidebar-item.active { background-color: rgba(255, 255, 255, 0.2); font-weight: bold; }
.sidebar-footer { padding-top: 10px; margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.2); }
.user-profile { display: flex; align-items: center; gap: 12px; margin-top: 15px; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: bold; font-size: 14px; }
.user-email { font-size: 12px; opacity: 0.8; }

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  max-height: 100vh;
}
.header {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  flex-shrink: 0;
}
.back-button {
  background: #f4f4f4; color:#333; padding:8px 12px; border-radius:6px; border:1px solid #ddd;
  display:flex; align-items:center; gap:8px; cursor:pointer; grid-column:1; grid-row:1;
}
.header-title {
  font-size:28px; font-weight:700; color:#333; text-align:center; grid-column:2; grid-row:1;
}
.search-input {
  padding:8px 14px; border:1px solid #ddd; border-radius:20px; font-size:14px; background:#fff;
  width:260px;
}
.header-right { display:flex; align-items:center; gap:12px; grid-column:3; grid-row:1; justify-content:flex-end; }
.menu-button {
  display:block; grid-column:4; grid-row:1; color:#689f38; font-size:20px; background:none; border:none; cursor:pointer; padding:8px;
}
.search-input-container-mobile {
  width: 100%;
  grid-column: 1 / -1;
  grid-row: 2;
  margin-top: 8px;
}

/* MODIFICATION: Scroll content - différent selon la vue */
.scroll-content {
  flex:1; 
  overflow-y: ${activeView === 'historique' ? 'hidden' : 'auto'}; 
  -webkit-overflow-scrolling:touch; 
  padding-right:8px;
  display:flex; 
  flex-direction:column;
}

/* Stocks-like message & alerts styles for Inventaire */
.notification-button {
  background:none; border:none; cursor:pointer; padding:8px; border-radius:50%;
  position:relative; transition: all .2s; color:#555;
}
.notification-button.alert { animation: pulse 2s infinite; color: var(--danger-red); }
@keyframes pulse { 0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)} }
.notification-badge {
  position:absolute; top:-6px; right:-6px; background:var(--danger-red); color:white;
  width:20px; height:20px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; font-size:12px; font-weight:700;
}
.notification-panel {
  position:absolute; top:60px; right:20px; background:white; border-radius:8px;
  box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:1000; width:350px; max-width:90vw;
  border:1px solid #ddd; padding:0;
}
.notification-header {
  padding:12px 16px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;
  align-items:center; font-weight:bold; background:#f9f9f9; border-radius:8px 8px 0 0;
}
.close-button { background:none; border:none; cursor:pointer; font-size:18px; color:#666; }
.notification-body { padding:16px; max-height:300px; overflow-y:auto; }

/* Tabs */
.tabs-container { display:flex; gap:0; margin-bottom:20px; border-bottom:1px solid #ddd; flex-shrink:0; }
.tab-button {
  padding:12px 24px; background:none; border:none; cursor:pointer; font-size:16px; color:#666;
  border-bottom:3px solid transparent; transition:all 0.2s; display:flex; align-items:center; gap:8px;
}
.tab-button.active { color:var(--brand-blue); border-bottom-color:var(--brand-blue); font-weight:bold; }

/* Actions container */
.actions-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
}
.action-buttons { display: flex; gap: 12px; }
.filters-wrapper { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-label { font-weight: 600; color: #555; font-size: 14px; }

/* Dropdowns */
.dropdown { position: relative; }
.dropdown-button {
  padding: 8px 16px; background: white; border: 1px solid #ddd; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;
  min-width: 120px; justify-content: space-between;
}
.dropdown-content {
  position: absolute; top: 100%; left: 0; background: white; border: 1px solid #ddd;
  border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; min-width: 200px;
  max-height: 300px; overflow-y: auto; margin-top: 4px;
}
.dropdown-content button {
  display: block; width: 100%; text-align: left; padding: 8px 12px; background: none;
  border: none; cursor: pointer; font-size: 14px; border-bottom: 1px solid #f0f0f0;
}
.dropdown-content button:hover { background: #f5f5f5; }
.dropdown-search { padding: 8px; border-bottom: 1px solid #eee; }
.dropdown-search input { width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.no-data-message { padding: 8px 12px; color: #999; font-size: 14px; text-align: center; }

/* Date filters - MODIFIÉ POUR RESSEMBLER À STOCKS.JSX */
.date-filters-container {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 250px;
}
.date-filters-container input[type="date"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
}
.filter-row {
  display: flex;
  gap: 8px;
}
.filter-row select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.date-filters-container button {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  font-size: 14px;
}
.date-filters-container button:hover {
  background: #e9e9e9;
}

/* Buttons */
.refresh-button {
  padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;
}
.pdf-button {
  padding: 8px 16px; background: var(--brand-blue); color: white; border: none; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;
}
.delete-all-button {
  padding: 8px 16px; background: var(--danger-red); color: white; border: none; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;
}
.stat-button {
  padding: 6px 10px; background: #2196F3; color: white; border: none; border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px;
}
.delete-button {
  padding: 6px 10px; background: var(--danger-red); color: white; border: none; border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px;
}

/* Table container - MODIFIÉ POUR AVOIR UNE BARRE DE DÉFILEMENT INTERNE SEULEMENT */
.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  margin-bottom: 16px;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}
th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}
th { background: #f8f9fa; font-weight: 600; color: #333; position: sticky; top: 0; z-index: 10; }
tr:hover { background: #f9f9f9; }
.positive { color: #27ae60; font-weight: 600; }
.negative { color: #e74c3c; font-weight: 600; }
.no-data-cell { text-align: center; color: #999; padding: 40px; }

/* Pagination */
.pagination-container {
  display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px;
  flex-shrink: 0;
}
.pagination-container button {
  padding: 8px 16px; background: var(--brand-blue); color: white; border: none; border-radius: 6px;
  cursor: pointer; font-size: 14px;
}
.pagination-container button:disabled {
  background: #ccc; cursor: not-allowed;
}

/* Stats view */
.stats-view { display: flex; flex-direction: column; gap: 20px; }
.stats-cards-container { display: flex; gap: 16px; align-items: center; }
.stat-card {
  background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center; min-width: 150px;
}
.stat-card-number { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
.stat-card-label { font-size: 14px; color: #666; }
.chart-container {
  background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex: 1;
}

/* Responsive */
@media (max-width: 1023px) {
  .header { grid-template-columns: auto 1fr auto; }
  .header-title { font-size: 24px; }
  .search-input { display: none; }
  .search-input-container-mobile { display: block; }
  .search-input-container-mobile input { width: 100%; }
  .actions-container { flex-direction: column; align-items: stretch; }
  .filters-wrapper { justify-content: space-between; width: 100%; }
  .stats-cards-container { flex-direction: column; align-items: stretch; }
  .stat-card { width: 100%; }
}
@media (max-width: 767px) {
  .container-fluid { flex-direction: column; }
  .sidebar { 
    width: 100%; 
    position: fixed; 
    height: 100vh; 
    transform: translateX(-100%); 
    z-index: 1000; 
  }
  .sidebar.open { transform: translateX(0); }
  .main-content { padding: 15px; }
  .header { grid-template-columns: auto 1fr auto auto; gap: 6px; }
  .header-title { font-size: 20px; grid-column: 1 / -1; text-align: left; margin-top: 8px; }
  .back-button { grid-column: 1; grid-row: 1; }
  .header-right { grid-column: 3; grid-row: 1; }
  .menu-button { grid-column: 4; grid-row: 1; }
  .search-input-container-mobile { grid-column: 1 / -1; grid-row: 2; }
  .tabs-container { overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
  .tab-button { padding: 10px 16px; font-size: 14px; }
  .dropdown-content { position: fixed; left: 50%; transform: translateX(-50%); width: 90vw; max-width: 300px; }
  .date-filters-container { min-width: auto; }
  .filter-row { flex-direction: column; }
  .notification-panel { right: 10px; width: calc(100vw - 20px); }
}
      `}</style>

      <div className="container-fluid">
        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-title">Gestion Stock</div>
          <a href="/dashboard" className="sidebar-item"><FaHome />Tableau de Bord</a>
          <a href="/stocks" className="sidebar-item"><FaDropbox />Stocks</a>
          <a href="/inventaire" className="sidebar-item active"><FaCubes />Inventaire</a>
          <a href="/attributions" className="sidebar-item"><FaUser />Attributions</a>
          <a href="/sorties" className="sidebar-item"><FaTruck />Sorties</a>
          <div className="sidebar-footer">
            <a href="/" className="sidebar-item"><MdLogout />Déconnexion</a>
          </div>
          <div className="user-profile">
            <FaUserCircle size={40} />
            <div className="user-info">
              <div className="user-name">Admin</div>
              <div className="user-email">admin@example.com</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="main-content">
          <div className="header">
            {isMobile && (
              <button className="back-button" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Retour
              </button>
            )}
            <h1 className="header-title">Inventaire</h1>
            
            {!isMobile && (
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <div className="header-right">
              <button 
                className={`notification-button ${alertInfo.show ? 'alert' : ''}`}
                onClick={handleNotificationClick}
              >
                <IoMdNotificationsOutline size={24} />
                {alertInfo.show && <span className="notification-badge">!</span>}
              </button>
              <button className="menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <FaBars />
              </button>
            </div>

            {isMobile && (
              <div className="search-input-container-mobile">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {showNotificationPanel && (
            <div className="notification-panel">
              <div className="notification-header">
                Notifications
                <button className="close-button" onClick={() => setShowNotificationPanel(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="notification-body">
                {alertInfo.show ? alertInfo.message : "Aucune notification."}
              </div>
            </div>
          )}

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

          <div className="scroll-content">
            {activeView === 'historique' ? renderHistorique() : renderStatistiques()}
          </div>
        </div>
      </div>
    </>
  );
}
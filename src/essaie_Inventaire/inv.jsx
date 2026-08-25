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
  FaSearch,
  FaSync,
  FaChartBar,
  FaHistory,
  FaCubes,
  FaTruck,
  FaArchive,
  FaTrash,
  FaTimes,
} from 'react-icons/fa';
import { MdLogout } from "react-icons/md";
import { IoMdNotificationsOutline, IoMdRefresh} from "react-icons/io";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Product categories from stocks for filter dropdown
  const [productCategories, setProductCategories] = useState([]);
  
  // State for chart filtering
  const [selectedCategoryForStats, setSelectedCategoryForStats] = useState(null);

  // State for alert notification
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

      // Close sidebar if switching to desktop mode
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

      // Get categories from stocks
      const categories = [...new Set(stocksRes.data.map(item => item.nomProduit).filter(Boolean))].sort();
      setProductCategories(categories);

    } catch (err) {
      console.error('Erreur fetch data', err);
      alert('Impossible de charger les données depuis le serveur.');
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
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      const currentMonth = new Date().getMonth();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

      // Calculer les totaux pour l'année en cours et précédente
      const entreeCurrentYear = data.entreeParMois.reduce((a, b) => a + b, 0);
      const attributionCurrentYear = data.attributionParMois.reduce((a, b) => a + b, 0);
      const sortieCurrentYear = data.sortieParMois.reduce((a, b) => a + b, 0);

      // Calculer la variation mensuelle
      const netCurrentMonth = data.entreeParMois[currentMonth] - data.attributionParMois[currentMonth] - data.sortieParMois[currentMonth];
      const netPreviousMonth = data.entreeParMois[previousMonth] - data.attributionParMois[previousMonth] - data.sortieParMois[previousMonth];
      
      let variationMensuelle = 0;
      if (netPreviousMonth !== 0) {
        variationMensuelle = ((netCurrentMonth - netPreviousMonth) / Math.abs(netPreviousMonth)) * 100;
      } else if (netCurrentMonth !== 0) {
        variationMensuelle = 100;
      }

      // Calculer la variation annuelle (simplifiée)
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

  // Alert check effect
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

    if (filterMonth || filterYear) {
      data = data.filter(item => {
        const itemDate = item.lastUpdate;
        if (filterYear && itemDate.getFullYear() !== parseInt(filterYear)) return false;
        if (filterMonth && itemDate.getMonth() + 1 !== parseInt(filterMonth)) return false;
        return true;
      });
    }

    return data;
  }, [computeInventoryData, searchQuery, filterCategory, filterMonth, filterYear]);

  // Paginated data
  const paginatedHistorique = useMemo(() => {
    return filteredHistorique.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredHistorique, currentPage]);

  const totalPages = Math.ceil(filteredHistorique.length / ITEMS_PER_PAGE);

  // Export PDF for historique
  const exportHistoriquePDF = () => {
    if (filteredHistorique.length === 0) {
      alert('Aucune donnée à imprimer.');
      return;
    }
    const doc = new jsPDF();
    doc.text(`Inventaire - Historique des Mouvements - ${new Date().toLocaleDateString('fr-FR')}`, 14, 15);
    const head = [['Nom Produit', 'Entrée', 'Attribution', 'Sortie', 'Comparaison', 'Var. Mensuelle (%)', 'Var. Annuelle (%)', 'Date MAJ']];
    const body = filteredHistorique.map(item => [
      item.nomProduit,
      item.entree.toString(),
      item.attribution.toString(),
      item.sortie.toString(),
      item.comparaison.toString(),
      item.variationMensuelle.toFixed(2),
      item.variationAnnuelle.toFixed(2),
      item.lastUpdate.toLocaleString('fr-FR'),
    ]);
    doc.autoTable({ head, body, startY: 20 });
    doc.save('inventaire-historique.pdf');
  };

  // Export chart as PDF
  const exportChartAsPdf = () => {
    if (!chartRef.current) {
      alert('Graphique non disponible.');
      return;
    }
    const doc = new jsPDF('landscape', 'pt', 'a4');
    doc.setFontSize(16);
    doc.text(`Statistiques d'Inventaire - ${selectedCategoryForStats || 'Tous les produits'}`, 40, 40);
    const base64 = chartRef.current.toBase64Image();
    doc.addImage(base64, 'PNG', 40, 60, 700, 350);
    doc.save('statistiques-inventaire.pdf');
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterMonth('');
    setFilterYear('');
    setCurrentPage(1);
    fetchAllData();
  };

  // Handle stat button click
  const handleStatButtonClick = (category) => {
    setSelectedCategoryForStats(category);
    setActiveView('statistique');
  };

  // Handle delete item
  const handleDeleteItem = async (nomProduit) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'élément "${nomProduit}" ?`)) return;
    
    try {
      // Find the item in inventaireData to get its id
      const itemToDelete = inventaireData.find(item => item.nom_produit === nomProduit);
      if (itemToDelete) {
        await axios.delete(`${API_BASE_URL}/inventaire/${itemToDelete.id_inventaire}`);
      }
      await fetchAllData();
      alert('Élément supprimé avec succès.');
    } catch (error) {
      alert('Erreur lors de la suppression.');
    }
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer TOUS les éléments de l\'inventaire ?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/inventaire`);
      await fetchAllData();
      alert('Tous les éléments ont été supprimés avec succès.');
    } catch (error) {
      alert('Erreur lors de la suppression de tous les éléments.');
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setShowNotificationPanel(!showNotificationPanel);
  };

  // Render historique view
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
          
          <div className="dropdown">
            <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'category' ? null : 'category')}>
              {filterCategory || 'Catégorie'} <FaAngleDown />
            </button>
            {dropdownOpen === 'category' && (
              <div className="dropdown-content">
                {productCategories.map((cat, i) => (
                  <button key={i} onClick={() => { setFilterCategory(cat); setDropdownOpen(null); }}>{cat}</button>
                ))}
                <button onClick={() => { setFilterCategory(''); setDropdownOpen(null); }}>Toutes</button>
              </div>
            )}
          </div>
          
          <div className="dropdown">
            <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'date' ? null : 'date')}>
              Date <FaAngleDown />
            </button>
            {dropdownOpen === 'date' && (
              <div className="dropdown-content date-filters-container">
                <div className="filter-row">
                  <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                    <option value="">Mois</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                  </select>
                  <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                    <option value="">Année</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button onClick={() => { setFilterMonth(''); setFilterYear(''); setDropdownOpen(null); }}>Réinitialiser</button>
              </div>
            )}
          </div>
          
          <button className="refresh-button" onClick={handleRefresh}>
            <IoMdRefresh size={18}/> Actualiser
          </button>
        </div>
      </div>

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
              <tr><td colSpan="9" style={{ textAlign: 'center' }}>Chargement...</td></tr>
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
              <tr><td colSpan="9" style={{ textAlign: 'center' }}>Aucune donnée trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</button>
          <span>Page {currentPage} sur {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Suivant</button>
        </div>
      )}
    </>
  );

  // Render statistiques view
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
      <style>{`
        /* === STYLES BASÉS SUR livraison.jsx === */
        
        .container-fluid {  
          display: flex; 
          min-height: 100vh; 
          width: 100vw; 
          background-color: #f4f6f9; 
          font-family: Arial, sans-serif; 
        }

        .sidebar { 
          width: 250px; 
          background-color: #689f38; 
          color: white; 
          display: flex; 
          flex-direction: column; 
          padding: 20px; 
          flex-shrink: 0; 
          z-index: 100;
          transition: transform 0.3s ease-in-out;
          margin-left: -20px;
        }

        .sidebar-title { 
          font-size: 22px; 
          font-weight: bold; 
          margin-bottom: 25px; 
        }

        .sidebar-item { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          padding: 12px 10px; 
          border-radius: 6px; 
          margin-bottom: 8px; 
          cursor: pointer; 
          text-decoration: none; 
          color: white; 
          font-size: 14px; 
          transition: background-color 0.2s; 
        }

        .sidebar-item:hover { 
          background-color: rgba(255, 255, 255, 0.1); 
        }

        .sidebar-item.active { 
          background-color: rgba(255, 255, 255, 0.2); 
          font-weight: bold; 
        }

        .sidebar-footer { 
          margin-top: auto; 
          padding-top: 15px; 
          border-top: 1px solid rgba(255, 255, 255, 0.2); 
        }

        .user-profile { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          margin-top: 15px; 
        }

        .user-info { 
          display: flex; 
          flex-direction: column; 
        }

        .user-name { 
          font-weight: bold; 
          font-size: 14px; 
        }

        .user-email { 
          font-size: 11px; 
          opacity: 0.8; 
        }

        /* Main Content Area */
        .main-content { 
          flex: 1;
          padding: 15px 0 15px 15px;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          margin-bottom: 25px; 
          flex-shrink: 0; 
        }

        .header-title { 
          font-size: 24px; 
          font-weight: bold; 
          color: #333; 
          flex-grow: 1;
          text-align: center;
        }

        .header-right { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
        }

        .search-input { 
          padding: 7px 12px; 
          border: 1px solid #ddd; 
          border-radius: 18px; 
          font-size: 13px; 
          width: 220px;
        }

        .back-button { 
          background-color: #f4f4f4; 
          color: #333; 
          padding: 7px 10px; 
          border-radius: 4px; 
          border: 1px solid #ccc; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          flex-shrink: 0;
          font-size: 13px;
        }

        .menu-button { 
          display: none; 
          background: none; 
          border: none; 
          color: #333; 
          font-size: 20px; 
          cursor: pointer; 
          padding: 0; 
          margin-right: 12px; 
        }

        /* Scrollable Content */
        .scroll-content { 
          flex-grow: 1; 
          overflow-y: auto; 
          padding-right: 12px; 
          scrollbar-gutter: stable;
          -webkit-overflow-scrolling: touch; 
        }

        /* Stats Container */
        .stats-container { 
          display: flex; 
          justify-content: space-between; 
          gap: 20px; 
          margin-bottom: 30px; 
        }

        .stat-card { 
          flex: 1; 
          background-color: white; 
          border-radius: 5px; 
          padding: 20px; 
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
          text-align: center; 
        }

        .stat-number { 
          font-size: 28px; 
          font-weight: bold; 
        }

        .stat-label { 
          font-size: 14px; 
          color: #666; 
        }

        /* Actions Container */
        .actions-container { 
          display: flex; 
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px; 
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-buttons { 
          display: flex; 
          gap: 8px; 
          flex-wrap: wrap;
        }

        .add-button, .pdf-button, .delete-all-button { 
          padding: 8px 15px; 
          border-radius: 4px; 
          border: none; 
          cursor: pointer; 
          font-size: 13px; 
          font-weight: bold; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
        }

        .add-button { 
          background-color: #0070B2; 
          color: white; 
        }

        .pdf-button { 
          background-color: #E67E22; 
          color: white; 
        }

        .delete-all-button { 
          background-color: #E74C3C; 
          color: white; 
        }

        .refresh-button { 
          background-color: #95a5a6; 
          color: black; 
          padding: 8px 15px; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer; 
          margin-left: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .refresh-button:hover { 
          background-color: #898c8cff; 
        }

        /* Filters Wrapper */
        .filters-wrapper { 
          display: flex; 
          gap: 12px; 
          align-items: center; 
          flex-wrap: wrap; 
        }

        .filter-label { 
          font-weight: bold; 
          color: #555; 
          font-size: 13px; 
        }

        .dropdown { 
          position: relative; 
          display: inline-block; 
        }

        .dropdown-button { 
          background-color: #fff; 
          color: #555; 
          padding: 8px 12px; 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 4px; 
          min-width: 110px; 
          justify-content: space-between; 
          font-size: 13px; 
        }

        .dropdown-content { 
          position: absolute; 
          top: 100%; 
          left: 0; 
          background-color: #f9f9f9; 
          min-width: 200px; 
          box-shadow: 0 6px 12px rgba(0,0,0,0.15); 
          z-index: 10; 
          border-radius: 4px; 
          max-height: 220px; 
          overflow-y: auto; 
        }

        .dropdown-content a, .dropdown-content button { 
          color: black; 
          padding: 8px 12px; 
          display: block; 
          cursor: pointer; 
          background: none; 
          border: none; 
          width: 100%; 
          text-align: left; 
          font-size: 13px; 
        }

        .dropdown-content a:hover, .dropdown-content button:hover { 
          background-color: #ddd; 
        }

        .date-filters-container { 
          padding: 10px; 
          display: flex; 
          flex-direction: column; 
          gap: 10px; 
        }

        .date-filters-container select { 
          padding: 8px; 
          border: 1px solid #ccc; 
          border-radius: 4px; 
        }

        .filter-row { 
          display: flex; 
          gap: 8px; 
        }

        /* Table Container */
        .table-container { 
          background-color: white; 
          border-radius: 5px; 
          overflow: hidden; 
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
          margin-bottom: 20px; 
          overflow-x: auto; 
        }

        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 13px; 
        }

        th, td { 
          padding: 12px 15px; 
          text-align: left; 
          border-bottom: 1px solid #ddd; 
        }

        th { 
          background-color: #f8f9fa; 
          font-weight: bold; 
          color: #555; 
        }

        tr:hover { 
          background-color: #f5f5f5; 
        }

        .positive { 
          color: #2ecc71; 
          font-weight: bold; 
        }

        .negative { 
          color: #e74c3c; 
          font-weight: bold; 
        }

        /* Pagination */
        .pagination-container { 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          gap: 15px; 
          margin-top: 20px; 
        }

        .pagination-container button { 
          padding: 8px 15px; 
          background-color: #0070B2; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 13px; 
        }

        .pagination-container button:disabled { 
          background-color: #bdc3c7; 
          cursor: not-allowed; 
        }

        .pagination-container span { 
          font-size: 14px; 
          color: #555; 
        }

        /* Stats View */
        .stats-view { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
        }

        .stats-cards-container { 
          display: flex; 
          gap: 20px; 
          align-items: center; 
        }

        .stat-card-number { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 5px; 
        }

        .stat-card-label { 
          font-size: 14px; 
          color: #666; 
        }

        .chart-container { 
          background-color: white; 
          border-radius: 5px; 
          padding: 20px; 
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
        }

        /* Notification Panel */
        .notification-panel { 
          position: absolute; 
          top: 60px; 
          right: 15px; 
          background-color: white; 
          border: 1px solid #ddd; 
          border-radius: 5px; 
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
          width: 300px; 
          z-index: 1000; 
          padding: 15px; 
        }

        .notification-panel h4 { 
          margin-top: 0; 
          margin-bottom: 10px; 
        }

        .notification-panel p { 
          font-size: 13px; 
          color: #333; 
        }

        .notification-panel button { 
          background-color: #0070B2; 
          color: white; 
          border: none; 
          padding: 8px 12px; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 13px; 
          margin-top: 10px; 
        }

        /* Alert Banner */
        .alert-banner { 
          background-color: #ffeb3b; 
          color: #333; 
          padding: 10px 15px; 
          border-radius: 4px; 
          margin-bottom: 20px; 
          font-size: 13px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
        }

        .alert-banner button { 
          background: none; 
          border: none; 
          cursor: pointer; 
          color: #333; 
          font-size: 16px; 
        }

        /* Action Buttons */
        .stat-button, .delete-button { 
          background: none; 
          border: none; 
          cursor: pointer; 
          padding: 5px; 
          border-radius: 3px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
        }

        .stat-button { 
          color: #3498db; 
        }

        .stat-button:hover { 
          background-color: rgba(52, 152, 219, 0.1); 
        }

        .delete-button { 
          color: #e74c3c; 
        }

        .delete-button:hover { 
          background-color: rgba(231, 76, 60, 0.1); 
        }

        /* === STYLES RESPONSIVE === */
        
        /* Tablette */
        @media (max-width: 1023px) {
          .container-fluid {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            height: auto;
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            padding-top: 60px;
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .main-content {
            padding: 15px;
            margin-left: 0;
          }
          
          .header {
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .header-title {
            font-size: 20px;
            text-align: left;
            flex-grow: 0;
          }
          
          .search-input {
            width: 180px;
          }
          
          .stats-container {
            flex-direction: column;
            gap: 15px;
          }
          
          .actions-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .filters-wrapper {
            width: 100%;
            justify-content: flex-start;
          }
          
          .menu-button {
            display: block;
          }
          
          .header-right {
            order: 3;
            width: 100%;
            justify-content: space-between;
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .main-content {
            padding: 10px;
          }
          
          .header-title {
            font-size: 18px;
          }
          
          .search-input {
            width: 150px;
            font-size: 12px;
          }
          
          .back-button, .add-button, .pdf-button, .delete-all-button, .refresh-button {
            font-size: 12px;
            padding: 6px 10px;
          }
          
          .filters-wrapper {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .dropdown-button {
            min-width: 100px;
            font-size: 12px;
          }
          
          .stat-card {
            padding: 15px;
          }
          
          .stat-number, .stat-card-number {
            font-size: 22px;
          }
          
          .stat-label, .stat-card-label {
            font-size: 12px;
          }
          
          th, td {
            padding: 8px 10px;
            font-size: 12px;
          }
          
          .notification-panel {
            width: 250px;
            right: 10px;
          }
          
          .chart-container {
            padding: 15px;
          }
          
          .stats-cards-container {
            flex-direction: column;
            gap: 15px;
          }
          
          .stats-cards-container > div:last-child {
            margin-left: 0;
            width: 100%;
          }
        }

        /* Très petits écrans */
        @media (max-width: 480px) {
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .header-title {
            text-align: left;
            width: 100%;
          }
          
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
          
          .search-input {
            width: 120px;
          }
          
          .action-buttons {
            width: 100%;
            justify-content: space-between;
          }
          
          .add-button, .pdf-button, .delete-all-button {
            flex: 1;
            justify-content: center;
          }
          
          .table-container {
            font-size: 11px;
          }
          
          th, td {
            padding: 6px 8px;
          }
        }

        /* Styles pour l'icône de notification basés sur stocks.jsx */
        .notification-icon {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          color: #333;
          font-size: 22px;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: #e74c3c;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className="container-fluid">
        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-title">Inventaire</div>
          <a href="/" className="sidebar-item"><FaHome />Accueil</a>
          <a href="/stocks" className="sidebar-item"><FaDropbox />Stocks</a>
          <a href="/attributions" className="sidebar-item"><FaUser />Attributions</a>
          <a href="/sorties" className="sidebar-item"><FaTruck />Sorties</a>
          <a href="/inventaire" className="sidebar-item active"><FaArchive />Inventaire</a>
          
          <div className="sidebar-footer">
            <a href="/profile" className="sidebar-item"><FaUserCircle />Profil</a>
            <a href="/logout" className="sidebar-item"><MdLogout />Déconnexion</a>
            <div className="user-profile">
              <FaUserCircle size={32} />
              <div className="user-info">
                <div className="user-name">Admin</div>
                <div className="user-email">admin@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Header */}
          <div className="header">
            {isMobile && (
              <button 
                className="menu-button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <FaBars />
              </button>
            )}
            
            <div className="header-title">
              {activeView === 'historique' ? 'Historique des Mouvements' : 'Statistiques des Mouvements'}
            </div>
            
            <div className="header-right">
              {activeView === 'statistique' && (
                <button className="back-button" onClick={() => setActiveView('historique')}>
                  <FaArrowLeft /> Retour
                </button>
              )}
              
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <button 
                className="notification-icon"
                onClick={handleNotificationClick}
              >
                <IoMdNotificationsOutline />
                {alertInfo.show && <span className="notification-badge">!</span>}
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="scroll-content">
            {/* Alert Banner */}
            {alertInfo.show && (
              <div className="alert-banner">
                <span>{alertInfo.message}</span>
                <button onClick={() => setAlertInfo({ show: false, message: '' })}>
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button 
                className={`add-button ${activeView === 'historique' ? 'active' : ''}`}
                onClick={() => setActiveView('historique')}
                style={{ 
                  backgroundColor: activeView === 'historique' ? '#005a8c' : '#0070B2',
                  opacity: activeView === 'historique' ? 1 : 0.8
                }}
              >
                <FaHistory /> Historique
              </button>
              <button 
                className={`add-button ${activeView === 'statistique' ? 'active' : ''}`}
                onClick={() => setActiveView('statistique')}
                style={{ 
                  backgroundColor: activeView === 'statistique' ? '#005a8c' : '#0070B2',
                  opacity: activeView === 'statistique' ? 1 : 0.8
                }}
              >
                <FaChartBar /> Statistiques
              </button>
            </div>

            {/* Main Content */}
            {activeView === 'historique' ? renderHistorique() : renderStatistiques()}
          </div>
        </div>

        {/* Notification Panel */}
        {showNotificationPanel && (
          <div className="notification-panel">
            <h4>Notifications</h4>
            {alertInfo.show ? (
              <p>{alertInfo.message}</p>
            ) : (
              <p>Aucune notification pour le moment.</p>
            )}
            <button onClick={() => setShowNotificationPanel(false)}>Fermer</button>
          </div>
        )}
      </div>
    </>
  );
}
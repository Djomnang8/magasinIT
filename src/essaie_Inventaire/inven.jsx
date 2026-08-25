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

//const API_BASE_URL = 'http://localhost:3001/api';
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
        .inventaire-container-fluid { 
          display: flex; 
          min-height: 100vh; 
          width: 100vw; 
          background-color: #f4f6f9; 
          font-family: Arial, sans-serif; 
          font-size: 14px;
        }
        
        .inventaire-sidebar { 
          width: 250px; 
          background-color: #689f38; 
          color: white; 
          display: flex; 
          flex-direction: column; 
          padding: 20px; 
          flex-shrink: 0; 
          z-index: 100;
          transition: transform 0.3s ease-in-out;
        }
        
        .inventaire-sidebar-title { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 30px; 
        }
        
        .inventaire-sidebar-item { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
          padding: 15px 10px; 
          border-radius: 8px; 
          margin-bottom: 10px; 
          cursor: pointer; 
          text-decoration: none; 
          color: white; 
          font-size: 16px; 
          transition: background-color 0.2s; 
        }
        
        .inventaire-sidebar-item:hover { 
          background-color: rgba(255, 255, 255, 0.1); 
        }
        
        .inventaire-sidebar-item.active { 
          background-color: rgba(255, 255, 255, 0.2); 
        }
        
        .inventaire-sidebar-footer { 
          margin-top: auto; 
        }
        
        .inventaire-user-profile { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          padding-top: 20px; 
          border-top: 1px solid rgba(255,255,255,0.2); 
        }
        
        .inventaire-main-content { 
          flex: 1; 
          padding: 20px 0 20px 20px;
          display: flex; 
          flex-direction: column; 
          overflow: hidden; 
        }
        
        .inventaire-header { 
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 20px; 
          flex-shrink: 0; 
        }
        
        .inventaire-back-button { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          background-color: #ffffff; 
          padding: 8px 12px; 
          border-radius: 10px; 
          border: 1px solid #ddd; 
          box-shadow: 0 1px 2px rgba(0,0,0,0.05); 
          font-size: 16px; 
          cursor: pointer; 
          grid-column: 1;
          grid-row: 1;
        }
        
        .inventaire-header-title { 
          font-size: 28px; 
          font-weight: bold; 
          color: #333; 
          text-align: center;
          grid-column: 2;
          grid-row: 1;
        }
        
        .inventaire-header-right { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
          grid-column: 3;
          grid-row: 1;
        }

        .search-input-container-mobile {
          width: 100%;
          grid-column: 1 / span 3;
          grid-row: 2;
        }
        
        .search-input { 
          padding: 8px 15px; 
          border: 1px solid #ddd; 
          border-radius: 20px; 
          font-size: 14px; 
          width: 250px; 
          max-width: 100%;
          transition: width 0.3s ease; 
        }
        
        .search-input:focus { 
          width: 300px; 
          outline: none; 
          border-color: #689f38; 
        }
        
        .refresh-button { 
          background-color: #95a5a6; 
          color: white; 
          padding: 10px 15px; 
          border-radius: 5px; 
          border: none; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 14px;
        }
        
        .refresh-button:hover { 
          background-color: #7f8c8d; 
        }

        .menu-button { 
          display: none; 
          background: none; 
          border: none; 
          color: #333; 
          font-size: 24px; 
          cursor: pointer; 
          padding: 0; 
          margin-right: 15px; 
          grid-column: 1;
          grid-row: 1;
        }
        
        .inventaire-view-selector { 
          display: flex; 
          gap: 10px; 
          background-color: #e0e0e0; 
          padding: 5px; 
          border-radius: 8px; 
          margin-bottom: 20px; 
          flex-wrap: wrap;
        }
        
        .inventaire-view-button { 
          padding: 10px 20px; 
          border: none; 
          border-radius: 6px; 
          background-color: transparent; 
          font-weight: bold; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 14px;
        }
        
        .inventaire-view-button.active { 
          background-color: white; 
          color: #333; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
        }
        
        .inventaire-scroll-content { 
          flex-grow: 1; 
          overflow-y: auto; 
          padding-right: 15px; 
          scrollbar-gutter: stable;
          -webkit-overflow-scrolling: touch;
        }
        
        .actions-container { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 20px; 
          flex-wrap: wrap; 
          gap: 15px; 
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .filters-wrapper { 
          display: flex; 
          gap: 15px; 
          align-items: center; 
          flex-wrap: wrap; 
        }
        
        .filter-label { 
          font-weight: bold; 
          color: #555; 
          font-size: 14px; 
        }
        
        .dropdown { 
          position: relative; 
          display: inline-block; 
        }
        
        .dropdown-button { 
          background-color: #fff; 
          color: #555; 
          padding: 10px 15px; 
          border: 1px solid #ddd; 
          border-radius: 5px; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 14px;
        }
        
        .dropdown-content { 
          position: absolute; 
          background-color: white; 
          min-width: 200px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          border-radius: 5px; 
          z-index: 1000; 
          padding: 10px; 
          top: 100%; 
          left: 0; 
          margin-top: 5px; 
        }
        
        .dropdown-content button { 
          display: block; 
          width: 100%; 
          text-align: left; 
          padding: 8px 12px; 
          border: none; 
          background: none; 
          cursor: pointer; 
          font-size: 14px;
        }
        
        .dropdown-content button:hover { 
          background-color: #f0f0f0; 
        }
        
        .date-filters-container { 
          min-width: 250px; 
        }
        
        .filter-row { 
          display: flex; 
          gap: 10px; 
          margin-bottom: 10px; 
        }
        
        .filter-row select { 
          flex: 1; 
          padding: 8px; 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          font-size: 14px;
        }
        
        .pdf-button { 
          background-color: #E67E22; 
          color: white; 
          padding: 10px 15px; 
          border-radius: 5px; 
          border: none; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 14px;
        }
        
        .pdf-button:hover { 
          background-color: #d35400; 
        }
        
        .delete-all-button { 
          background-color: #E74C3C; 
          color: white; 
          padding: 10px 15px; 
          border-radius: 5px; 
          border: none; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 14px;
        }
        
        .delete-all-button:hover { 
          background-color: #c0392b; 
        }
        
        .table-container { 
          background-color: white; 
          border-radius: 8px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
          overflow: hidden; 
          margin-bottom: 20px; 
          width: 100%; 
          overflow-x: auto; 
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
          background-color: #f8f9fa; 
          font-weight: bold; 
          color: #555; 
        }
        
        tr:hover { 
          background-color: #f5f5f5; 
        }
        
        .positive { 
          color: #27ae60; 
          font-weight: bold; 
        }
        
        .negative { 
          color: #e74c3c; 
          font-weight: bold; 
        }
        
        .stat-button { 
          background-color: #3498db; 
          color: white; 
          border: none; 
          padding: 6px 10px; 
          border-radius: 4px; 
          cursor: pointer; 
        }
        
        .stat-button:hover { 
          background-color: #2980b9; 
        }
        
        .delete-button { 
          background-color: #e74c3c; 
          color: white; 
          border: none; 
          padding: 6px 10px; 
          border-radius: 4px; 
          cursor: pointer; 
        }
        
        .delete-button:hover { 
          background-color: #c0392b; 
        }
        
        .pagination-container { 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          gap: 15px; 
          margin-top: 20px; 
        }
        
        .pagination-container button { 
          padding: 8px 15px; 
          border: 1px solid #ddd; 
          background-color: white; 
          border-radius: 4px; 
          cursor: pointer; 
        }
        
        .pagination-container button:disabled { 
          opacity: 0.5; 
          cursor: not-allowed; 
        }
        
        .pagination-container button:hover:not(:disabled) { 
          background-color: #f0f0f0; 
        }
        
        .stats-view { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
        }
        
        .stats-cards-container { 
          display: flex; 
          gap: 20px; 
          flex-wrap: wrap; 
        }
        
        .stat-card { 
          background-color: white; 
          padding: 20px; 
          border-radius: 8px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
          min-width: 200px; 
          text-align: center; 
        }
        
        .stat-card-number { 
          font-size: 32px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        
        .stat-card-label { 
          color: #777; 
          font-size: 14px; 
        }
        
        .chart-container { 
          background-color: white; 
          padding: 20px; 
          border-radius: 8px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
        }
        
        .notification-container {
          position: relative;
          display: inline-block;
        }
        
        .notification-icon {
          position: relative;
          cursor: pointer;
          color: #555;
          font-size: 24px;
          padding: 5px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .notification-icon.has-alert {
          color: #e74c3c;
          animation: pulse 2s infinite;
        }
        
        .notification-icon:hover {
          background-color: rgba(231, 76, 60, 0.1);
        }
        
        .notification-panel {
          position: absolute;
          top: 100%;
          right: 0;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 15px;
          min-width: 300px;
          max-width: 400px;
          z-index: 1000;
          margin-top: 10px;
        }
        
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .notification-title {
          font-weight: bold;
          color: #333;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #777;
        }
        
        .notification-message {
          color: #e74c3c;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .alert-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: #e74c3c;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          z-index: 99;
          display: none;
        }
        
        .sidebar-overlay.active {
          display: block;
        }
        
        /* Responsive styles */
        @media (max-width: 1023px) {
          .inventaire-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
          }
          
          .inventaire-sidebar.open {
            transform: translateX(0);
          }
          
          .menu-button {
            display: block;
          }
          
          .inventaire-main-content {
            padding: 15px;
          }
          
          .inventaire-header {
            grid-template-columns: auto 1fr auto;
            gap: 10px;
          }
          
          .inventaire-header-title {
            font-size: 24px;
          }
          
          .search-input {
            width: 200px;
          }
          
          .search-input:focus {
            width: 250px;
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
        }
        
        @media (max-width: 767px) {
          .inventaire-container-fluid {
            font-size: 12px;
          }
          
          .inventaire-main-content {
            padding: 10px;
          }
          
          .inventaire-header {
            grid-template-columns: auto 1fr auto;
            grid-template-rows: auto auto;
            gap: 8px;
          }
          
          .inventaire-header-title {
            font-size: 20px;
            grid-column: 1 / span 3;
            grid-row: 1;
            text-align: center;
          }
          
          .inventaire-back-button {
            grid-column: 1;
            grid-row: 2;
          }
          
          .inventaire-header-right {
            grid-column: 3;
            grid-row: 2;
          }
          
          .search-input-container-mobile {
            grid-column: 1 / span 3;
            grid-row: 3;
          }
          
          .search-input {
            width: 100%;
          }
          
          .search-input:focus {
            width: 100%;
          }
          
          .inventaire-view-selector {
            flex-direction: column;
          }
          
          .inventaire-view-button {
            justify-content: center;
          }
          
          .actions-container {
            gap: 10px;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .filters-wrapper {
            flex-direction: column;
            align-items: stretch;
          }
          
          .filter-label {
            text-align: center;
          }
          
          .dropdown-button {
            width: 100%;
            justify-content: space-between;
          }
          
          .stats-cards-container {
            flex-direction: column;
          }
          
          .stat-card {
            min-width: auto;
          }
          
          th, td {
            padding: 8px 10px;
            font-size: 12px;
          }
          
          .notification-panel {
            min-width: 250px;
            max-width: 300px;
            right: -50px;
          }
        }
        
        @media (max-width: 480px) {
          .inventaire-header-title {
            font-size: 18px;
          }
          
          .inventaire-view-button {
            padding: 8px 15px;
            font-size: 12px;
          }
          
          .pdf-button, .delete-all-button, .refresh-button, .dropdown-button {
            padding: 8px 12px;
            font-size: 12px;
          }
          
          .notification-panel {
            min-width: 200px;
            max-width: 250px;
            right: -80px;
          }
        }
      `}</style>
      
      <div className="inventaire-container-fluid">
        {/* Sidebar Overlay */}
        {(isMobile || isTablet) && isSidebarOpen && (
          <div 
            className="sidebar-overlay active" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`inventaire-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="inventaire-sidebar-title">Inventaire</div>
          
<a className="sidebar-item" href="/accueil" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaHome/> Accueil
        </a>
        <a className="sidebar-item active" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaTruck/> Livraison
        </a>
        <a className="sidebar-item" href="/action" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaCubes/> Stock
        </a>
        <a className="sidebar-item" href="/fournisseurs" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaShoppingCart/> Fournisseur
        </a>
        <a className="sidebar-item" href="/inventaire" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaChartBar/> Inventaire
        </a>
        <a className="sidebar-item" href="/employes" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaUser/> Employés
        </a>
        <a className="sidebar-item" href="/admin" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaUserCircle/> Administrateur
        </a>
          
          <div className="inventaire-sidebar-footer">
            <div className="inventaire-user-profile">
              <FaUserCircle size={40} />
              <div>
                <div style={{ fontWeight: 'bold' }}>Admin</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Administrateur</div>
              </div>
            </div>
            
            <a href="/" className="inventaire-sidebar-item" style={{ marginTop: '15px' }}>
              <MdLogout size={20} /> Déconnexion
            </a>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="inventaire-main-content">
          <div className="inventaire-header">
            <button 
              className="menu-button" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <FaBars />
            </button>
            
            <button 
              className="inventaire-back-button" 
              onClick={() => navigate('/accueil')}
            >
              <FaArrowLeft /> Retour
            </button>
            
            <div className="inventaire-header-title">Gestion d'Inventaire</div>
            
            <div className="inventaire-header-right">
              
              
              {!isMobile && (
                <input
                  type="text"
                  className="search-input"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
              <div className="notification-container">
                <IoMdNotificationsOutline 
                  className={`notification-icon ${alertInfo.show ? 'has-alert' : ''}`}
                  onClick={handleNotificationClick}
                />
                {alertInfo.show && <div className="alert-badge">!</div>}
                
                {showNotificationPanel && (
                  <div className="notification-panel">
                    <div className="notification-header">
                      <div className="notification-title">Alertes Inventaire</div>
                      <button 
                        className="notification-close"
                        onClick={() => setShowNotificationPanel(false)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="notification-message">
                      {alertInfo.message || "Aucune alerte pour le moment."}
                    </div>
                  </div>
                )}
              </div>
              
              
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
          
          <div className="inventaire-view-selector">
            <button 
              className={`inventaire-view-button ${activeView === 'historique' ? 'active' : ''}`}
              onClick={() => setActiveView('historique')}
            >
              <FaHistory /> Historique
            </button>
            <button 
              className={`inventaire-view-button ${activeView === 'statistique' ? 'active' : ''}`}
              onClick={() => setActiveView('statistique')}
            >
              <FaChartBar /> Statistique
            </button>
          </div>
          
          <div className="inventaire-scroll-content">
            {activeView === 'historique' && renderHistorique()}
            {activeView === 'statistique' && renderStatistiques()}
          </div>
        </div>
      </div>
    </>
  );
}
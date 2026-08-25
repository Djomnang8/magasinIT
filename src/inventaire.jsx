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
  FaUser,
  FaDropbox,
  FaUserCircle,
  FaFilePdf,
  FaChartBar,
  FaHistory,
  FaTruck,
  FaTrash,
  FaTimes,
  FaCubes,
  FaShoppingCart,
 
} from 'react-icons/fa';
import { MdLogout } from "react-icons/md";
import { IoMdRefresh, IoMdClose } from "react-icons/io";
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

  // Adjusted initial chartHeight for better mobile/tablet fit (reduced)
  const [chartHeight, setChartHeight] = useState(() => {
    const h = window.innerHeight;
    const w = window.innerWidth;
    if (w <= 767) return Math.max(280, Math.floor(h * 0.45)); // mobile : slightly smaller so legend/title visible
    if (w <= 1023) return Math.max(360, Math.floor(h * 0.50)); // tablette
    return Math.max(600, Math.floor(h * 0.70)); // PC
  });

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

  // Stock alerts state (generated from computed inventory)
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

useEffect(() => {
  const updateChartHeight = () => {
    const h = window.innerHeight;
    const w = window.innerWidth;
    
    // Rebalanced heights so title/legend/ticks remain visible on small screens
    let newH;
    if (w <= 767) newH = Math.max(240, Math.floor(h * 0.45)); // smaller mobile height to fit chrome UI and legend
    else if (w <= 1023) newH = Math.max(340, Math.floor(h * 0.50)); // tablet
    else newH = Math.max(600, Math.floor(h * 0.70));
    
    setChartHeight(newH);

    // Force Chart.js update/rescale using available modern API safely
    if (chartRef.current) {
      setTimeout(() => {
        try {
          // Chart.js v3+ uses chartRef.current as the chart instance if using forwardRef from react-chartjs-2
          const chartInstance = chartRef.current?.chartInstance || chartRef.current;
          if (chartInstance && typeof chartInstance.resize === 'function') {
            chartInstance.resize();
          }
        } catch(e) {
          // silent fail
          console.log('Chart resize error:', e);
        }
      }, 150);
    }
  };

  updateChartHeight();
  window.addEventListener('resize', updateChartHeight);
  return () => window.removeEventListener('resize', updateChartHeight);
}, [isMobile, isTablet]);

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

      const categories = [...new Set((stocksRes.data || []).map(item => item.nomProduit).filter(Boolean))].sort();
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

  // helper: parse date safely (returns Date or null)
  function parseDateSafe(d) {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // helper: normalise quantité si votre modèle contient un champ quantite (fallback = 1)
  function normalizeQty(obj) {
    if (!obj) return 1;
    const q = Number(obj.quantite ?? obj.quantity ?? obj.qty ?? 1);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }

  // =========================================================================================
  // DEBUT BLOC DE LOGIQUE DE DATE CORRIGÉ
  // =========================================================================================
  const computeInventoryData = useMemo(() => {
    const inventoryMap = new Map();

    // helper pour incrémenter ou initier une entrée produit
    function ensureProduct(nomProduit, initialDate) {
      if (!inventoryMap.has(nomProduit)) {
        inventoryMap.set(nomProduit, {
          nomProduit,
          entree: 0,
          attribution: 0,
          sortie: 0,
          entreeParMois: Array(12).fill(0),
          attributionParMois: Array(12).fill(0),
          sortieParMois: Array(12).fill(0),
          lastUpdate: initialDate || null
        });
      }
      return inventoryMap.get(nomProduit);
    }

    // 1) Stocks => Entrées
    stocks.forEach(stock => {
      const nomProduit = stock.nomProduit;
      if (!nomProduit) return;

      const qty = normalizeQty(stock);
      const stockDate = parseDateSafe(stock.date_MiseAJour) || parseDateSafe(stock.date_Creation) || null;

      const data = ensureProduct(nomProduit, stockDate);
      data.entree += qty;
      if (stockDate) {
        data.entreeParMois[stockDate.getMonth()] += qty;
        if (!data.lastUpdate || stockDate > data.lastUpdate) data.lastUpdate = stockDate;
      }
    });

    // 2) Attributions => Attribution counts (caracteristique may be JSON)
    attributions.forEach(attribution => {
      try {
        const parsed = typeof attribution.caracteristique === 'string'
          ? JSON.parse(attribution.caracteristique)
          : attribution.caracteristique;
        const items = Array.isArray(parsed) ? parsed : [parsed];

        const attrDate = parseDateSafe(attribution.date_attribution) || null;

        items.forEach(item => {
          if (!item) return;
          const nomProduit = item.type || item.nomProduit || item.designation;
          if (!nomProduit) return;
          const qty = normalizeQty(item);

          const data = ensureProduct(nomProduit, attrDate);
          data.attribution += qty;
          if (attrDate) {
            data.attributionParMois[attrDate.getMonth()] += qty;
            if (!data.lastUpdate || attrDate > data.lastUpdate) data.lastUpdate = attrDate;
          }
        });
      } catch (e) {
        console.error('Error processing attribution in computeInventoryData:', e);
      }
    });

    // 3) Sorties => Sortie counts (caracteristique_sortie may be JSON)
    sorties.forEach(sortie => {
      try {
        const parsed = typeof sortie.caracteristique_sortie === 'string'
          ? JSON.parse(sortie.caracteristique_sortie)
          : sortie.caracteristique_sortie;
        const items = Array.isArray(parsed) ? parsed : [parsed];

        const sortieDate = parseDateSafe(sortie.dateSortie) || null;

        items.forEach(item => {
          if (!item) return;
          const nomProduit = item.designation || item.type || item.nomProduit;
          if (!nomProduit) return;
          const qty = normalizeQty(item);

          const data = ensureProduct(nomProduit, sortieDate);
          data.sortie += qty;
          if (sortieDate) {
            data.sortieParMois[sortieDate.getMonth()] += qty;
            if (!data.lastUpdate || sortieDate > data.lastUpdate) data.lastUpdate = sortieDate;
          }
        });
      } catch (e) {
        console.error('Error processing sortie in computeInventoryData:', e);
      }
    });

    // 4) Fusionner avec données persistées inventaire (date persistée si plus récente)
    const persistedDataMap = new Map();
    inventaireData.forEach(row => {
      if (row && row.nom_produit) {
        const d = row.date_MiseAJour ? parseDateSafe(row.date_MiseAJour) : null;
        persistedDataMap.set(row.nom_produit, { date_MiseAJour: d });
      }
    });

    // 5) Calcul final et variations
    const currentMonth = new Date().getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const result = Array.from(inventoryMap.values()).map(item => {
      const entreeCurrentYear = item.entreeParMois.reduce((a,b)=>a+b,0);
      const attributionCurrentYear = item.attributionParMois.reduce((a,b)=>a+b,0);
      const sortieCurrentYear = item.sortieParMois.reduce((a,b)=>a+b,0);
      const netCurrentYear = entreeCurrentYear - attributionCurrentYear - sortieCurrentYear;

      const netCurrentMonth = (item.entreeParMois[currentMonth] || 0) - (item.attributionParMois[currentMonth] || 0) - (item.sortieParMois[currentMonth] || 0);
      const netPreviousMonth = (item.entreeParMois[previousMonth] || 0) - (item.attributionParMois[previousMonth] || 0) - (item.sortieParMois[previousMonth] || 0);

      let variationMensuelle = 0;
      if (netPreviousMonth !== 0) variationMensuelle = ((netCurrentMonth - netPreviousMonth) / Math.abs(netPreviousMonth)) * 100;
      else if (netCurrentMonth !== 0) variationMensuelle = 100;

      // For yearly variation: attempt to infer previous year by comparing totals stored in inventaire table if available
      const persisted = persistedDataMap.get(item.nomProduit);
      let finalDate = item.lastUpdate;
      if (persisted && persisted.date_MiseAJour && (!finalDate || persisted.date_MiseAJour > finalDate)) {
        finalDate = persisted.date_MiseAJour;
      }

      // comparaison = stock.total_entree - attribution - sortie (using aggregated quantities)
      const comparaison = item.entree - item.attribution - item.sortie;

      return {
        ...item,
        comparaison,
        variationMensuelle,
        variationAnnuelle: 0,
        lastUpdate: finalDate
      };
    });

    // sort by lastUpdate desc (nulls last)
    return result.sort((a,b) => {
      if (!a.lastUpdate && !b.lastUpdate) return 0;
      if (!a.lastUpdate) return 1;
      if (!b.lastUpdate) return -1;
      return b.lastUpdate - a.lastUpdate;
    });
  }, [stocks, attributions, sorties, inventaireData]);

  // Fonction pour synchroniser l'inventaire avec la base de données
  const syncInventoryWithDatabase = async () => {
    try {
      for (const item of computeInventoryData) {
        await axios.put(`${API_BASE_URL}/inventaire/produit/${encodeURIComponent(item.nomProduit)}`, {
          total_entree: item.entree,
          total_attribution: item.attribution,
          total_sortie: item.sortie,
          comparaison: item.comparaison,
          variation_mensuelle: item.variationMensuelle,
          variation_annuelle: item.variationAnnuelle
        });
      }
      console.log('Inventaire synchronisé avec la base de données');
    } catch (error) {
      console.error('Erreur lors de la synchronisation de l\'inventaire:', error);
    }
  };

  // Appeler la synchronisation quand les données changent (debounced)
  useEffect(() => {
    if (isLoading) return;
    if (!computeInventoryData || computeInventoryData.length === 0) return;

    let mounted = true;
    const t = setTimeout(async () => {
      if (!mounted) return;
      try {
        await syncInventoryWithDatabase();
      } catch (e) {
        console.error('syncInventoryWithDatabase failed', e);
      }
    }, 1000);

    return () => { mounted = false; clearTimeout(t); };
  }, [computeInventoryData, isLoading]);

  // =========================================================================================
  // FIN BLOC DE LOGIQUE DE DATE CORRIGÉ
  // =========================================================================================

  // Generate stock alerts from computed inventory (variation thresholds)
  useEffect(() => {
    const alerts = [];

    computeInventoryData.forEach(item => {
      const vm = item.variationMensuelle || 0;
      const va = item.variationAnnuelle || 0;

      if (!isNaN(vm) && vm < 50 && vm >= 20) {
        alerts.push({
          product: item.nomProduit,
          type: 'warning',
          message: `Variation Mensuelle faible (${vm.toFixed(2)}%) pour : ${item.nomProduit}`
        });
      }
      if (!isNaN(vm) && vm < 20) {
        alerts.push({
          product: item.nomProduit,
          type: 'critical',
          message: `Variation Mensuelle critique (${vm.toFixed(2)}%) pour : ${item.nomProduit}`
        });
      }

      if (!isNaN(va) && va < 50 && va >= 20) {
        alerts.push({
          product: item.nomProduit,
          type: 'warning',
          message: `Variation Annuelle faible (${va.toFixed(2)}%) pour : ${item.nomProduit}`
        });
      }
      if (!isNaN(va) && va < 20) {
        alerts.push({
          product: item.nomProduit,
          type: 'critical',
          message: `Variation Annuelle critique (${va.toFixed(2)}%) pour : ${item.nomProduit}`
        });
      }
    });

    const unique = [];
    const seen = new Set();
    alerts.forEach(a => {
      if (!seen.has(a.message)) {
        unique.push(a);
        seen.add(a.message);
      }
    });

    setStockAlerts(unique);
  }, [computeInventoryData]);

  const hasCriticalAlerts = stockAlerts.some(alert => alert.type === 'critical');


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

    if (filterDate) {
      data = data.filter(s => 
        s.lastUpdate && 
        s.lastUpdate.toISOString().slice(0, 10) === filterDate
      );
    }

    if (filterMonth || filterYear) {
      data = data.filter(item => {
        const itemDate = item.lastUpdate;
        if (!itemDate) return false;
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


  // Authenticated admin (remplace Admin / admin@example.com) — lecture persistante et validation
  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const raw = localStorage.getItem('admin')
      if (raw) return JSON.parse(raw)
    } catch (e) { /* ignore */ }
    return { nom_complet: 'Admin', adresse_email: 'admin@example.com' }
  })
  
  // Essayer de valider / rafraîchir le profil côté API si token présent
  useEffect(() => {
    async function loadProfile() {
      try {
        // Vérifier immédiatement localStorage pour pré-remplir l'UI
        const raw = localStorage.getItem('admin')
        if (raw) {
          try { setAdminProfile(JSON.parse(raw)) } catch (e) { /* ignore parse */ }
        }
  
        const token = localStorage.getItem('authToken')
        if (!token) return
  
        // Appel de validation / récupération côté serveur
        const resp = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (resp && resp.data && resp.data.admin) {
          const serverAdmin = resp.data.admin
          const normalized = {
            nom_complet: serverAdmin.nom_complet || (raw ? JSON.parse(raw).nom_complet : 'Admin'),
            adresse_email: serverAdmin.adresse_email || (raw ? JSON.parse(raw).adresse_email : 'admin@example.com')
          }
          setAdminProfile(normalized)
          // mettre à jour le localStorage pour rester synchronisé
          try { localStorage.setItem('admin', JSON.stringify(normalized)) } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.warn('Impossible de récupérer/valider le profil admin', err)
        // Ne pas effacer localStorage ; conserver l'info locale pour persistance hors ligne
      }
    }
    loadProfile()
  }, [])

  // Export PDF for historique
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
        <td>${item.lastUpdate ? item.lastUpdate.toLocaleString('fr-FR') : 'N/A'}</td>
       
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
    // try multiple ways to get base64 if react-chartjs-2 wrapper differs
    let base64 = null;
    try {
      const chartInstance = chartRef.current?.chartInstance || chartRef.current;
      base64 = chartInstance.toBase64Image();
    } catch (e) {
      try { base64 = chartRef.current.toBase64Image(); } catch (e2) { base64 = null; }
    }
    if (base64) {
      doc.addImage(base64, 'PNG', 40, 60, 700, 350);
    }
    doc.save('statistiques-inventaire.pdf');
  };

 const handleRefresh = async () => {
  setIsLoading(true);
  setSearchQuery('');
  setFilterCategory('');
  setFilterMonth('');
  setFilterYear('');
  setFilterDate('');
  setCurrentPage(1);
  
  try {
    await fetchAllData();
    // Forcer une synchronisation après le rafraîchissement
    setTimeout(() => {
      if (computeInventoryData.length > 0) {
        syncInventoryWithDatabase();
      }
    }, 1000);
    
    showNotification("Données rafraîchies avec succès", "success");
  } catch (error) {
    showNotification("Erreur lors du rafraîchissement", "error");
  } finally {
    setIsLoading(false);
  }
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
          <button className="pdf-button print-historique orange" onClick={exportHistoriquePDF}>
            <IoDocumentTextOutline /> Imprimer PDF
          </button>
          {filteredHistorique.length > 0 && (
            <button className="delete-all-button" onClick={handleDeleteAll}>
              <FaTrash /> Supprimer tout
            </button>
          )}
        </div>
        
        <div className="filters-wrapper">
          <span className="filter-label">Filtres:</span>
          
          {/* Category dropdown */}
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
          
          {/* Date filter */}
          <div className="dropdown">
            <button 
              className="dropdown-button" 
              onClick={() => setDropdownOpen(d => d === 'date' ? null : 'date')}
            >
              Date <FaAngleDown size={12} />
            </button>
            {dropdownOpen === 'date' && (
              <div className="dropdown-content date-filters-container">
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
                <button type="button" className="clear-button" onClick={resetDateFilters}>
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

      {/* Table with increased height and better mobile layout */}
      <div className={`table-container ${isMobile || isTablet ? 'mobile-table' : ''}`} style={{ maxHeight: 'calc(100vh - 250px)' }}>
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
                  <td>{item.lastUpdate ? item.lastUpdate.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : 'N/A'}</td>
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

  // Statistiques view - VERSION CORRIGÉE AVEC PAS DE 1
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
        stats.entree[i] += item.entreeParMois[i] || 0;
        stats.attribution[i] += item.attributionParMois[i] || 0;
        stats.sortie[i] += item.sortieParMois[i] || 0;
      }
    });

    return stats;
  }, [computeInventoryData, selectedCategoryForStats]);

  const renderStatistiques = () => {
  const currentMonth = new Date().getMonth();
  
  const totalCurrentMonth = chartStats.entree[currentMonth] + chartStats.attribution[currentMonth] + chartStats.sortie[currentMonth];
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const totalPreviousMonth = chartStats.entree[previousMonth] + chartStats.attribution[previousMonth] + chartStats.sortie[previousMonth];
  
  const variationMensuelle = totalPreviousMonth !== 0 
    ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100 
    : totalCurrentMonth !== 0 ? 100 : 0;

  const maxEntreeMensuel = Math.max(...chartStats.entree);
  const maxAttributionMensuel = Math.max(...chartStats.attribution);
  const maxSortieMensuel = Math.max(...chartStats.sortie);
  
  const maxMensuelGlobal = Math.max(maxEntreeMensuel, maxAttributionMensuel, maxSortieMensuel);
  const axisMax = Math.max(1, Math.ceil(maxMensuelGlobal));

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      { 
        label: 'Entrées', 
        data: chartStats.entree, 
        backgroundColor: '#4CAF50',
        borderColor: '#388E3C',
        borderWidth: 1
      },
      { 
        label: 'Attributions', 
        data: chartStats.attribution, 
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 1
      },
      { 
        label: 'Sorties', 
        data: chartStats.sortie, 
        backgroundColor: '#F44336',
        borderColor: '#D32F2F',
        borderWidth: 1
      }
    ]
  };

  // ✅ OPTIONS OPTIMISÉES POUR MOBILE/TABLETTE
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        align: 'center',
        labels: {
          usePointStyle: true,
          padding: 10,
          boxWidth: isMobile ? 8 : 10,
          font: { 
            size: isMobile ? 10 : 12,
            weight: 'normal'
          }
        }
      },
      title: { 
        display: true, 
        text: `Mouvements pour : ${selectedCategoryForStats || 'Tous les produits'}`,
        font: { 
          size: isMobile ? 14 : 16, 
          weight: 'bold' 
        },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: isMobile ? 11 : 13 },
        bodyFont: { size: isMobile ? 10 : 12 },
        padding: 10,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMin: 0,
        suggestedMax: axisMax + 1,
        ticks: {
          stepSize: 1,
          font: { size: isMobile ? 10 : 12 },
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
        title: { 
          display: !isMobile,
          text: 'Quantité',
          font: { size: isMobile ? 12 : 14, weight: 'bold' }
        },
        grid: {
          color: 'rgba(0,0,0,0.08)',
          lineWidth: 1
        }
      },
      x: {
        title: { 
          display: !isMobile,
          text: 'Mois',
          font: { size: isMobile ? 11 : 14, weight: 'bold' }
        },
        ticks: { 
          font: { size: isMobile ? 9 : 11 },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
          autoSkip: true
        },
        grid: {
          color: 'rgba(0,0,0,0.03)'
        }
      }
    },
    layout: {
      padding: { 
        top: 10, 
        bottom: 10, 
        left: 10, 
        right: 10 
      }
    },
    animation: { duration: 600 },
    interaction: { intersect: false, mode: 'index' }
  };

  return (
    <div className="stats-view">
      <div className={`stats-cards-container ${isMobile || isTablet ? 'mobile-stats' : ''}`}>
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
        <div style={{ marginLeft: isMobile ? '0' : 'auto', width: isMobile ? '100%' : 'auto' }}>
          <button className="pdf-button export-graph orange" onClick={exportChartAsPdf}>
            <FaFilePdf />Exporter le Graphe
          </button>
        </div>
      </div>
      
      <div className="chart-container">
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: isMobile ? '320px' : '450px', 
            fontSize: '16px', 
            color: '#666'
          }}>
            Chargement des données...
          </div>
        ) : (
          <div className="chart-wrapper">
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
  --orange: #E67E22;
  --effacer-blue: #007bff;
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
  padding: 15px 20px;
  overflow: hidden;
  max-height: 100vh;
}

/* HEADER (desktop) */
.header {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
  width: 100%;
  min-height: 50px;
}

.back-button {
  grid-column: 1;
  grid-row: 1;
  background: #f4f4f4;
  color:#333;
  padding:6px 10px;
  border-radius:6px;
  border:1px solid #ddd;
  display:flex; 
  align-items:center; 
  gap:6px; 
  cursor:pointer;
  font-size: 13px;
  white-space: nowrap;
}

.header-title {
  grid-column: 2;
  grid-row: 1;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10px;
}

.header-right {
  grid-column: 3;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.search-input-container-mobile {
  grid-column: 1 / -1;
  grid-row: 2;
  width: 100%;
  margin-top: 8px;
}

/* Search and buttons */
.search-input {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 13px;
  width: 100%;
  background: #fff;
  box-sizing: border-box;
  height: 36px;
}

.menu-button {
  grid-column: 4;
  grid-row: 1;
  display: block;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  color: #689f38;
}

/* Notification */
.notification-button {
  background: none; 
  border: none; 
  cursor: pointer; 
  padding: 6px; 
  border-radius: 50%;
  position: relative; 
  transition: all .2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-button.alert { 
  animation: pulse 2s infinite; 
  color: var(--danger-red); 
}

@keyframes pulse { 
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); } 
}

.notification-badge {
  position: absolute; 
  top: -6px; 
  right: -6px; 
  background: var(--danger-red); 
  color: white;
  width: 18px; 
  height: 18px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  border-radius: 50%; 
  font-size: 11px; 
  font-weight: 700;
}

/* SCROLL CONTENT: no page-level scrolling, table will scroll */
.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

/* Ensure scroll-content allows children to set their own heights */
.scroll-content {
  flex: 1 1 auto; /* allow growth */
  min-height: 0;  /* crucial for children scrollbar inside flex items */
  overflow: hidden; /* outer doesn't scroll; table-container will */
  display: flex;
  flex-direction: column;
}

/* Scrollbar styling */
.scroll-content::-webkit-scrollbar { width: 12px; }
.scroll-content::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
.scroll-content::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; border: 2px solid #f1f1f1; }
.scroll-content::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }

/* ACTIONS CONTAINER */
.actions-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

/* PDF BUTTON */
.pdf-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: var(--brand-blue);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.pdf-button:hover { opacity: 0.95; }
.pdf-button.orange { background-color: var(--orange); }

/* DELETE ALL BUTTON */
.delete-all-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: var(--danger-red);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.delete-all-button:hover { background-color: #c0392b; }

/* FILTERS WRAPPER */
.filters-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 600;
  color: #555;
  font-size: 13px;
}

/* DROPDOWN */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-button {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  min-width: 120px;
  justify-content: space-between;
  height: 36px;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 180px;
  margin-top: 4px;
}

.dropdown-search {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.dropdown-search input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.dropdown-scroll-list {
  max-height: 180px;
  overflow-y: auto;
}

.dropdown-scroll-list::-webkit-scrollbar { width: 8px; }
.dropdown-scroll-list::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
.dropdown-scroll-list::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
.dropdown-scroll-list::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }

.dropdown-content button {
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.dropdown-content button:hover {
  background-color: #f5f5f5;
}

.no-data-message {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

/* DATE FILTERS */
.date-filters-container {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 200px;
}

.date-filters-container input[type="date"] {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.filter-row {
  display: flex;
  gap: 8px;
}

.filter-row select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.date-filters-container button { 
  padding: 8px 12px; 
  background-color: #007bff; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 13px;
  width: 100%;
}

.date-filters-container button:hover { 
  background-color: #0056b3; 
}

/* Refresh */
.refresh-button {
  background:#95a5a6; color:#111; padding:10px 14px; border-radius:6px; border:none;
  display:inline-flex; align-items:center; gap:8px; cursor:pointer;
  margin-left: 70px;
}
.refresh-button:hover { background:#7f8c8d; }

/* TABLE CONTAINER with vertical scrollbar */
.table-container {
  background: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;               /* allow it to grow inside .scroll-content */
  width: 100%;
  min-height: 70vh;             /* target increased height */
  height: 75vh; /* Très grande hauteur */
  max-height: 75vh;
  overflow: auto;               /* internal scrolling for table */
  -webkit-overflow-scrolling: touch;
}


.table-container::-webkit-scrollbar { width: 12px; height: 12px; }
.table-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
.table-container::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; border: 2px solid #f1f1f1; }
.table-container::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
border-right: 1px solid #ddd;
  font-size: 13px; 
  white-space: nowrap;
}

th { 
  background-color: #e7e7e7ff; 
  font-weight: bold; 
  color: #000000ff; 
  position: sticky;
  top: 0;
}

tbody tr:hover {
  background-color: #f8f9fa;
}

.positive { color: #2ecc71; font-weight: 600; }
.negative { color: #e74c3c; font-weight: 600; }

.actions-cell {
  display: flex;
  gap: 6px;
}

.action-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  font-size: 12px;
}

.action-icon.edit { color: #3498db; }
.action-icon.edit:hover { background-color: #ebf5fb; }

.action-icon.delete { color: #e74c3c; }
.action-icon.delete:hover { background-color: #fdedec; }

.no-data-cell {
  text-align: center;
  padding: 30px !important;
  color: #666;
  font-style: italic;
}

/* PAGINATION */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 15px;
  flex-shrink: 0;
}

.pagination-container button {
  padding: 6px 12px;
  background: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.pagination-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-container button:not(:disabled):hover {
  background: #e9e9e9;
}

/* STATS VIEW - CORRECTIONS APPLIQUÉES */
.stats-view {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.stats-cards-container {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-width: 160px;
  text-align: center;
  flex: 1;
}

.stat-card-number {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.stat-card-label {
  font-size: 12px;
  color: #666;
}

/* ✅ CORRECTIONS CRITIQUES POUR LE GRAPHIQUE */
.chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  overflow: hidden;
  width: 100%;
  position: relative;
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 15px;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100% !important;
  min-height: 300px;
  position: relative;
}

/* SURCHARGE CHART.JS */
.chartjs-render-monitor {
  max-width: 100% !important;
  max-height: 100% !important;
}

/* EXPORT GRAPH BUTTON */
.export-graph {
  background-color: #28a745;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.export-graph.orange { background-color: var(--orange); }
.export-graph:hover {
  opacity: 0.95;
}

/* ALERT NOTIFICATION */
.alert-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 14px 18px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideInRight 0.3s ease-out;
  font-size: 13px;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.alert-notification.success { background-color: #2ecc71; }
.alert-notification.error { background-color: #e74c3c; }
.alert-notification.warning { background-color: #f39c12; }

/* STOCK ALERTS MODAL */
.stock-alerts-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.stock-alerts-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  max-width: 450px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.stock-alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.stock-alerts-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.close-modal {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-modal:hover {
  background: #f5f5f5;
  color: #333;
}

.alert-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 4px solid;
  font-size: 13px;
}

.alert-item.critical {
  background: #fdedec;
  border-left-color: #e74c3c;
  color: #c0392b;
}

.alert-item.warning {
  background: #fef9e7;
  border-left-color: #f39c12;
  color: #d35400;
}

.alert-message {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

/* NAV TABS */
.nav-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
  flex-shrink: 0;
}

.nav-tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-tab:hover {
  color: #333;
  background-color: #f8f9fa;
}

.nav-tab.active {
  color: var(--brand-blue);
  border-bottom-color: var(--brand-blue);
}

/* Styles pour mobile/tablette */
.mobile-stats {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.mobile-stats .stat-card {
  min-width: auto;
  padding: 12px;
  flex: 1;
}

.mobile-stats .stat-card-number {
  font-size: 20px;
}

.mobile-table {
  max-height: 350px !important;
}

/* MOBILE STYLES - Graphique optimisé */
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
    width: 280px;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    padding: 12px;
    max-height: 100vh;
  }
  
  .header-title {
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  /* ✅ CORRECTION GRAPHIQUE MOBILE */
  .chart-container {
    min-height: 350px !important;
    padding: 10px;
    margin-bottom: 10px;
  }
  
  .chart-wrapper {
    min-height: 320px !important;
    height: 320px !important;
  }
  
  .actions-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .filters-wrapper {
    width: 100%;
    justify-content: space-between;
  }
  
  .dropdown-button {
    min-width: 110px;
  }
  
  .table-container {
    max-height: 350px;
  }
  
  th, td {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .stats-cards-container {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .stat-card {
    min-width: calc(50% - 8px);
    padding: 12px;
  }
  
  .stat-card-number {
    font-size: 20px;
  }
  
  .nav-tabs {
    margin-bottom: 12px;
  }
  
  .nav-tab {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  /* Ajustement de l'espacement pour mieux voir le tableau */
  .actions-container {
    margin-bottom: 12px;
  }
  
  /* Masquer la search bar desktop dans header-right */
  .header-right .search-input {
    display: none;
  }
}

/* TABLET STYLES - Graphique optimisé */
@media (max-width: 1023px) and (min-width: 768px) {
  .sidebar {
    width: 220px;
  }
  
  .header-title {
    font-size: 18px;
  }
  
  .search-input {
    width: 180px;
  }
  
  .actions-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .filters-wrapper {
    width: 100%;
    justify-content: flex-start;
  }
  
  /* ✅ CORRECTION GRAPHIQUE TABLETTE */
  .chart-container {
    min-height: 450px !important;
    padding: 12px;
  }
  
  .chart-wrapper {
    min-height: 420px !important;
    height: 420px !important;
  }
  
  .mobile-table {
    max-height: 400px !important;
  }
  
  .stats-cards-container {
    gap: 12px;
  }
  
  .stat-card {
    min-width: 140px;
    padding: 12px;
  }
}

/* DESKTOP OPTIMIZATION - Plus d'espace pour le graphe */
@media (min-width: 1024px) {
  .main-content {
    padding: 15px 20px;
    max-height: calc(100vh - 20px);
  }
  
  .stats-cards-container {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .stat-card {
    background: white;
    padding: 10px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    min-width: 130px;
    text-align: center;
  }

  .stat-card-number {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  /* ✅ CORRECTION GRAPHIQUE DESKTOP */
  .chart-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 500px;
    max-height: none;
    width: 100%;
  }

  .chart-wrapper {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: auto;
    min-height: 480px;
    width: 100%;
  }
  
  .table-container {
    max-height: 350px;
  }
  
  /* Réduction supplémentaire des éléments pour plus d'espace */
  .header {
    margin-bottom: 12px;
  }
  
  .nav-tabs {
    margin-bottom: 12px;
  }
  
  .actions-container {
    margin-bottom: 12px;
  }
}

/* MOBILE MENU TOGGLE */
.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  color: #333;
}

/* MOBILE/TABLET HEADER LAYOUT */
@media (max-width: 1023px) {
  .header {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    grid-template-rows: auto auto;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
    width: 100%;
  }
  
  .back-button { 
    grid-column: 1; 
    grid-row: 1; 
  }
  
  .header-title { 
    grid-column: 2; 
    grid-row: 1; 
    font-size: 18px; 
    text-align: center; 
    margin: 0; 
  }
  
  .notification-button { 
    grid-column: 3; 
    grid-row: 1; 
    display: flex; 
    justify-content: flex-end; 
  }
  
  .menu-button { 
    grid-column: 4; 
    grid-row: 1; 
    color: #689f38; 
    font-size: 18px; 
    background: none; 
    border: none; 
    cursor: pointer; 
    padding: 6px; 
  }
  
  .search-input { 
    width: 100%; 
    box-sizing: border-box; 
    font-size: 14px; 
  }
  
  .search-input-container-mobile { 
    grid-column: 1 / -1; 
    grid-row: 2; 
    margin-top: 8px; 
  }
}

/* OVERLAY FOR MOBILE MENU */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 99;
  display: none;
}

.sidebar-overlay.open {
  display: block;
}

/* Ajustements supplémentaires pour mobile */
@media (max-width: 767px) {
  .header-title {
    font-size: 16px;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  .mobile-table {
    max-height: 350px !important;
  }
  
  .mobile-menu-toggle {
    display: block;
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 101;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  .stats-cards-container {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .stat-card {
    min-width: calc(50% - 8px);
    padding: 10px;
  }
  
  .stat-card-number {
    font-size: 18px;
  }
  
  .chart-container {
    min-height: 55vh;
  }
  
  .chart-wrapper {
    min-height: 5vh !important;
    height: auto !important;
  }
}

@media (max-width: 1023px) and (min-width: 768px) {
  .chart-container {
    min-height: 55vh;
  }
  
  .chart-wrapper {
    min-height: 55vh !important;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .stat-card-number {
    font-size: 19px;
  }
  
  .mobile-table {
    max-height: 400px !important;
  }
}

/* ✅ CORRECTIONS SUPPLÉMENTAIRES POUR TRÈS PETITS ÉCRANS */
@media (max-width: 380px) {
  .chart-container {
    min-height: 300px !important;
    padding: 8px;
  }
  
  .chart-wrapper {
    min-height: 280px !important;
    height: 280px !important;
  }
  
  .stat-card {
    min-width: 100%;
    margin-bottom: 5px;
  }
  
  .stats-cards-container {
    flex-direction: column;
  }
}

/* ✅ ASSURER LA VISIBILITÉ DES ÉLÉMENTS DU GRAPHE */
@media (max-height: 700px) and (max-width: 767px) {
  .chart-container {
    min-height: 280px !important;
  }
  
  .chart-wrapper {
    min-height: 250px !important;
    height: 250px !important;
  }
}

/* ✅ CORRECTION PÉRIODE DE TRANSITION */
@media (max-width: 1023px) {
  .chart-container {
    transition: min-height 0.3s ease;
  }
}

/* ✅ GARANTIR QUE LE GRAPHE N'EST PAS COUPÉ */
.scroll-content {
  overflow-y: auto;
  overflow-x: hidden;
}

.scroll-content::-webkit-scrollbar {
  width: 8px;
}

.scroll-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scroll-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.scroll-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
`}</style>

      <div className="container-fluid">
        {/* Mobile Menu Toggle
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FaBars />
        </button> */}

        {/* Overlay for mobile */}
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
           <div className="sidebar-title">
                    MAGASIN IT
                    {/* Bouton de fermeture visible sur mobile/tablette */}
                    {(isMobile || isTablet) && (
                       <button style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>
                         <IoMdClose size={24}/>
                       </button>
                    )}
                  </div>
           <a className="sidebar-item" href="/accueil" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
                    <FaHome/> Accueil
                  </a>
                  <a className="sidebar-item" href="/livraison" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
                    <FaTruck/> Livraison
                  </a>
                  <a className="sidebar-item active" href="/action" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
                    <FaCubes/> Stock
                  </a>
                  <a className="sidebar-item" href="/fournisseurs" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
                    <FaShoppingCart/> Fournisseur
                  </a>
                  <a className="sidebar-item" href="/inventaire" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
                    <FaChartBar/> Inventaire
                  </a>
                  <a className="sidebar-item" href="/employe" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
                    <FaUser/> Employés
                  </a>
                  <a className="sidebar-item" href="/admin" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
                    <FaUser/> Administrateur
                  </a>
                  <div className="sidebar-footer">
                    <div className="user-profile">
                      <FaUserCircle size={40}/>
                      <div className="user-info">
                        <div className="user-name">{adminProfile.nom_complet}</div>
                        <div className="user-email">{adminProfile.adresse_email}</div>
          
                      </div>
                    </div>
                    <a
            className="sidebar-item-deconnect"
            href="#logout"
            onClick={(e) => {
              e.preventDefault();
              // Supprimer les clés utilisées pour l'authentification
              try {
                localStorage.removeItem('authToken');
                localStorage.removeItem('admin');
                localStorage.removeItem('isAuthenticated');
              } catch (err) { /* ignore */ }
              navigate('/');
            }}
          >
            <MdLogout/> Déconnexion
          </a>
          
                  </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
{/* Header */}

<div className="header">
  {/* Bouton Retour */}
  <button className="back-button" onClick={() => navigate(-1)}>
    <FaArrowLeft /> Retour
  </button>
  
  {/* Titre */}
  <h1 className="header-title">
    GESTION INVENTAIRE
  </h1>
  
  {/* Barre de recherche mobile/tablette */}
  {(isMobile || isTablet) && (
    <div className="search-input-container-mobile">
      <input
        type="text"
        className="search-input"
        placeholder="Rechercher..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  )}
  
  {/* Notification et menu */}
  <div className="header-right">
    {/* Barre de recherche desktop (cachée sur mobile) */}
    {!(isMobile || isTablet) && (
      <input
        type="text"
        className="search-input"
        placeholder="Rechercher..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    )}
    
    <button 
      className={`notification-button ${hasCriticalAlerts ? 'alert' : ''}`}
      onClick={handleNotificationClick}
      title="Alertes d'inventaire"
    >
      <IoMdNotificationsOutlineIcon size={24} />
      {stockAlerts.length > 0 && (
        <span className="notification-badge">
          {stockAlerts.length}
        </span>
      )}
    </button>
    
    {/* Bouton menu mobile/tablette */}
    {(isMobile || isTablet) && (
      <button className="menu-button" onClick={() => setIsSidebarOpen(true)}>
        <FaBars />
      </button>
    )}
  </div>
</div>

          {/* Navigation Tabs */}
<div className="nav-tabs">
  <button 
    className={`nav-tab ${activeView === 'historique' ? 'active' : ''}`}
    onClick={() => {
      setActiveView('historique');
      // conserve selectedCategoryForStats tel quel (retour à la table)
    }}
  >
    <FaHistory /> Historique
  </button>

  <button 
    className={`nav-tab ${activeView === 'statistique' ? 'active' : ''}`}
    onClick={() => {
      // Lorsque l'utilisateur ouvre l'onglet Statistique depuis la navigation,
      // on remet l'affichage à "Tous les produits"
      setSelectedCategoryForStats(null);
      setActiveView('statistique');
    }}
  >
    <FaChartBar /> Statistique
  </button>
</div>


          {/* Scrollable Content Area */}
          <div className="scroll-content">
            {activeView === 'historique' ? renderHistorique() : renderStatistiques()}
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {notification.visible && (
        <div className={`alert-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Stock Alerts Modal */}
      {stockAlertModalVisible && (
        <div className="stock-alerts-modal">
          <div className="stock-alerts-content">
            <div className="stock-alerts-header">
              <h2 className="stock-alerts-title">Alertes d’Inventaire</h2>
              <button className="close-modal" onClick={() => setStockAlertModalVisible(false)}>
                <FaTimes />
              </button>
            </div>
            
            {stockAlerts.length > 0 ? (
              stockAlerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.type}`}>
                  <p className="alert-message">{alert.message}</p>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Aucune alerte pour le moment.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
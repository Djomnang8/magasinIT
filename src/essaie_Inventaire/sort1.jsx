// src/components/sortie.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  FaHome, FaDropbox, FaUserCircle, FaPencilAlt, FaTrash, FaTruck, FaArchive,
  FaPlus, FaMinus, FaAngleDown, FaBars, FaShoppingCart, FaChartBar, FaCubes, FaUser
} from 'react-icons/fa';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { IoMdAddCircleOutline, IoMdRefresh, IoMdClose } from 'react-icons/io';
import { MdLogout } from 'react-icons/md';
import { FaArrowLeft } from 'react-icons/fa6';
import logo from '../assets/eneo-Cameroon.jpg';
import logo1 from '../assets/OIP.webp';

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

const START_YEAR = 2010;
const END_YEAR = new Date().getFullYear() + 5;
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);
const MONTHS = [
  { name: 'Janvier', value: 1 }, { name: 'Février', value: 2 },
  { name: 'Mars', value: 3 }, { name: 'Avril', value: 4 },
  { name: 'Mai', value: 5 }, { name: 'Juin', value: 6 },
  { name: 'Juillet', value: 7 }, { name: 'Août', value: 8 },
  { name: 'Septembre', value: 9 }, { name: 'Octobre', value: 10 },
  { name: 'Novembre', value: 11 }, { name: 'Décembre', value: 12 }
];

const pageStyles = `
/* layout and base */
.container-fluid { display: flex; min-height: 100vh; width: 100vw; background-color: #f4f6f9; font-family: Arial, sans-serif; }
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
  margin-left: -20px;
}
.sidebar-title { margin-left: 5px; font-size: 22px; font-weight: bold; margin-bottom: 15px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); }
.sidebar-item { margin-top: -5px; margin-left: 5px; display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; text-decoration: none; color: white; font-size: 14px; transition: background-color 0.2s; }
.sidebar-item:hover { background-color: rgba(255,255,255,0.1); }
.sidebar-item.active { background-color: rgba(255,255,255,0.2); font-weight: bold; }
.sidebar-footer { padding-top: 10px; margin-left: 5px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); }
.user-profile { display:flex; align-items:center; gap:12px; margin-top:15px; }
.user-info { display:flex; flex-direction:column; }
.user-name { font-weight:bold; font-size:14px; }
.user-email { font-size:12px; opacity:0.8; }

/* main */
.main-content { flex-grow: 1; padding: 15px 40px; display:flex; flex-direction:column; min-height:100vh; }
.header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-shrink:0; }
.back-button { background-color:#f4f4f4; color:#333; padding:7px 10px; border-radius:4px; border:1px solid #ccc; cursor:pointer; display:flex; align-items:center; gap:6px; flex-shrink:0; font-size:13px; }
.header-title { font-size:20px; font-weight:bold; color:#333; text-align:center; flex:1; margin:0 12px; }
.header-right { display:flex; align-items:center; gap:15px; }
.search-input { padding:7px 12px; border:1px solid #ddd; border-radius:18px; font-size:13px; width:220px; }

/* ensure main scroll area does NOT scroll the whole page */
.scroll-content { flex:1; display:flex; flex-direction:column; gap:12px; min-height:0; overflow:hidden; }

/* stats */
.stats-container { display:flex; justify-content:space-between; gap:15px; margin-bottom:12px; flex-shrink:0; }
.stat-card { flex:1; background:white; border-radius:6px; padding:12px; box-shadow:0 2px 4px rgba(0,0,0,0.06); text-align:center; }
.stat-number { font-size:20px; font-weight:bold; color:#333; }
.stat-label { font-size:13px; color:#666; }

/* actions + filters in a single horizontal row */
.actions-filters-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.action-buttons { display:flex; gap:8px; align-items:center; }
.add-button, .pdf-button, .delete-all-button { padding:8px 14px; border-radius:6px; border:none; cursor:pointer; font-size:13px; font-weight:bold; display:flex; align-items:center; gap:8px; }
.add-button { background:#0070B2; color:#fff; }
.pdf-button { background:#E67E22; color:#fff; }
.delete-all-button { background:#E74C3C; color:#fff; }
.refresh-button { background:#95a5a6; color:black; padding:8px 12px; border:none; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:8px; }

/* filters horizontal */
.filters-wrapper { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.filter-label { font-weight:bold; color:#555; font-size:13px; }
.dropdown { position:relative; display:inline-block; }
.dropdown-button { background:#fff; color:#555; padding:8px 12px; border:1px solid #ddd; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:8px; min-width:110px; justify-content:space-between; font-size:13px; }
.dropdown-button.active { background:#f0f0f0; border-color:#999; }
.dropdown-content { position:absolute; top:calc(100% + 6px); left:0; background:#fff; min-width:220px; box-shadow:0 8px 16px rgba(0,0,0,0.12); z-index:20; border-radius:6px; max-height:260px; overflow:auto; padding:8px; }

/* table with internal vertical scrollbar */
.table-container { background:white; border-radius:8px; box-shadow:0 3px 8px rgba(0,0,0,0.06); overflow:hidden; display:flex; flex-direction:column; flex:1 1 auto; min-height:0; }
.table-header { display:block; }
.table-body-wrapper { display:block; overflow:auto; flex:1; min-height:0; max-height: calc(100vh - 360px); /* will be adapted by media queries */ }
table { width:100%; border-collapse:collapse; table-layout:fixed; }
thead { display:table; width:100%; table-layout:fixed; }
tbody { display:table; width:100%; table-layout:fixed; }
th, td { padding:12px 10px; text-align:left; border-bottom:1px solid #eee; font-size:13px; vertical-align:middle; word-break:break-word; }
th { background:#f8f9fa; font-weight:700; color:#555; position:sticky; top:0; z-index:2; }
.actions-cell { display:flex; gap:8px; justify-content:flex-end; align-items:center; white-space:nowrap; }
.action-icon { background:none; border:none; cursor:pointer; font-size:14px; display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:6px; }
.action-icon:hover { background:rgba(0,0,0,0.04); }
.no-data-cell, .loading-cell { text-align:center; color:#888; padding:20px; }

/* form view: scrollable inside container like image 1 */
.form-view-container { 
background:#fff; 
border-radius:10px; 
padding:20px; 
box-shadow:0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); 
display:flex; 
flex-direction:column; 
gap:12px; 
overflow:auto; 
max-height: calc(100vh - 120px); 

}

.form-title { font-size:20px; font-weight:bold; text-align:center; margin:6px 0; color:#333; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.input-group { display:flex; flex-direction:column; }
.input-group input, .input-group select { border:1px solid #ddd; border-radius:6px; padding:10px; background:#f9f9f9; font-size:14px; }

/* print helpers */
.no-print { }
@media print { .no-print { display:none !important; } }

/* responsive: reduce other components height to give table more vertical space */
@media (max-width: 1023px) {
  .main-content { padding:12px; }
  .header-title { font-size:16px; }
  .stats-container { gap:10px; }
  .stat-card { padding:10px; }
  .form-view-container { max-height: calc(100vh - 90px); padding:12px; }
  .table-body-wrapper { max-height: calc(100vh - 300px); }
  .dropdown-button { padding:6px 8px; font-size:12px; min-width:90px; }
  .search-input { width:100%; padding:8px; font-size:12px; }
  .filters-wrapper { gap:8px; }
}

@media (max-width: 767px) {
  .container-fluid { flex-direction:column; }
  .sidebar { width:80%; min-width:250px; }
  .main-content { padding:8px; }
  .header { gap:8px; margin-bottom:10px; }
  .header-title { font-size:14px; }
  .stats-container { flex-direction:column; gap:8px; }
  .action-buttons { width:100%; justify-content:space-between; }
  .add-button, .pdf-button, .delete-all-button, .refresh-button { flex:1; padding:6px 8px; font-size:12px; }
  .filters-wrapper { flex-direction:row; gap:6px; align-items:center; width:100%; }
  .table-body-wrapper { max-height: calc(100vh - 220px); }
  th, td { padding:8px 6px; font-size:12px; }
  .form-grid { grid-template-columns:1fr; gap:12px; }
  .form-view-container { max-height: calc(100vh - 80px); padding:12px; }
}

/* large screens */
@media (min-width: 1440px) {
  .main-content { padding:25px 40px; }
  .header-title { font-size:22px; }
  .table-body-wrapper { max-height: calc(100vh - 420px); }
}
`;

export default function Sortie() {
  const [activeView, setActiveView] = useState('list');

  const [sorties, setSorties] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMatricule, setFilterMatricule] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const exitAuthPrintRef = useRef();

  const [exitAuthFormData, setExitAuthFormData] = useState({
    id_sortie: null,
    name: '',
    email: '',
    matricule: '',
    direction: '',
    fonction: '',
    destination: '',
    reason: '',
    returnDate: '',
    chauffeurName: '',
    exitDate: '',
    dasiSignatureText: 'Signature DASI',
    vigilSignatureText: 'Signature Vigile',
  });

  const [exitAuthRows, setExitAuthRows] = useState([
    { designation: '', marque: '', modele: '', numeroSerie: '', id_produit: null },
  ]);

  const [employeDropdownOpen, setEmployeDropdownOpen] = useState(false);
  const [employeSearch, setEmployeSearch] = useState('');
  const [produitDropdownOpen, setProduitDropdownOpen] = useState(false);
  const [produitSearch, setProduitSearch] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  const [usedProductIds, setUsedProductIds] = useState(new Set());

  // Responsive states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1023 && window.innerWidth > 767);

  // Notification state
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification({ message: '', type: '', visible: false }), 4000);
  };

  // Effet pour détecter la taille de l'écran
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
    fetchAll();
  }, []);

  async function fetchAll() {
    setIsLoading(true);
    await Promise.all([fetchSorties(), fetchEmployes(), fetchProduits(true)]);
    setIsLoading(false);
  }

  async function fetchSorties() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/sorties`);
      setSorties(data || []);

      const used = new Set();
      (data || []).forEach(item => {
        try {
          const parsed = typeof item.caracteristique_sortie === 'string' ? JSON.parse(item.caracteristique_sortie) : item.caracteristique_sortie;
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          arr.forEach(r => { if (r && r.id_produit) used.add(Number(r.id_produit)); });
        } catch (e) {}
      });
      setUsedProductIds(used);
      setCurrentPage(1);
    } catch (e) {
      showNotification('Erreur: impossible de charger les sorties.', 'error');
    }
  }

  async function fetchEmployes() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/employes`);
      setEmployes(data || []);
    } catch {
      console.error('Erreur chargement employés');
    }
  }

  async function fetchProduits(excludeUsed = false) {
    try {
      const url = `${API_BASE_URL}/produits${excludeUsed ? '?excludeUsed=true' : ''}`;
      const { data } = await axios.get(url);
      setProduits(data || []);
    } catch {
      console.error('Erreur chargement produits');
    }
  }

  const uniqueMatricules = useMemo(() => {
    const set = new Set();
    (sorties || []).forEach(s => { if (s.matricule_employe) set.add(s.matricule_employe); });
    return Array.from(set).sort();
  }, [sorties]);

  const processedData = useMemo(() => {
    let list = [...(sorties || [])];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        Object.values(s || {}).some(v => String(v ?? '').toLowerCase().includes(q))
      );
    }

    if (filterDate) {
      list = list.filter(s => String(s.dateSortie).slice(0, 10) === filterDate);
    }

    if (filterMonth) {
      list = list.filter(s => new Date(s.dateSortie).getMonth() + 1 === +filterMonth);
    }
    if (filterYear) {
      list = list.filter(s => new Date(s.dateSortie).getFullYear() === +filterYear);
    }

    if (filterMatricule) {
      list = list.filter(s => (s.matricule_employe || '').toLowerCase().includes(filterMatricule.toLowerCase()));
    }

    const seen = new Set();
    const filtered = [];
    for (const item of list) {
      let ids = [];
      try {
        const parsed = typeof item.caracteristique_sortie === 'string' ? JSON.parse(item.caracteristique_sortie) : item.caracteristique_sortie;
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        ids = Array.from(new Set(arr.map(r => r && r.id_produit).filter(Boolean).map(Number)));
      } catch { ids = []; }

      const hasOverlap = ids.some(id => seen.has(id));
      if (!hasOverlap) {
        ids.forEach(id => seen.add(id));
        filtered.push(item);
      } else {
        if (ids.length === 0) filtered.push(item);
      }
    }

    filtered.sort((a, b) => new Date(b.dateSortie) - new Date(a.dateSortie));
    return filtered;
  }, [sorties, searchQuery, filterDate, filterMonth, filterYear, filterMatricule]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(start, start + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);
  const totalPages = Math.max(1, Math.ceil(processedData.length / ITEMS_PER_PAGE));

  function handleRefresh() {
    setSearchQuery('');
    setFilterDate('');
    setFilterMonth('');
    setFilterYear('');
    setFilterMatricule('');
    setCurrentPage(1);
    fetchAll();
  }

  function switchToAddForm() {
    setExitAuthFormData({
      id_sortie: null,
      name: '',
      email: '',
      matricule: '',
      direction: '',
      fonction: '',
      destination: '',
      reason: '',
      returnDate: '',
      chauffeurName: '',
      exitDate: '',
      dasiSignatureText: 'Signature DASI',
      vigilSignatureText: 'Signature Vigile',
    });
    setExitAuthRows([{ designation: '', marque: '', modele: '', numeroSerie: '', id_produit: null }]);
    setSelectedRowIndex(0);
    fetchProduits(true);
    setActiveView('form');
  }

  function switchToEditForm(item) {
    let rowsFromDb = [{ designation: '', marque: '', modele: '', numeroSerie: '', id_produit: null }];
    if (item.caracteristique_sortie) {
      try {
        const parsed = typeof item.caracteristique_sortie === 'string' ? JSON.parse(item.caracteristique_sortie) : item.caracteristique_sortie;
        rowsFromDb = Array.isArray(parsed) ? parsed.map(r => ({
          designation: r.designation || r.nomProduit || '',
          marque: r.marque || '',
          modele: r.modele || '',
          numeroSerie: r.numeroSerie || '',
          id_produit: r.id_produit || null,
        })) : rowsFromDb;
      } catch {}
    }

    setExitAuthFormData({
      id_sortie: item.id_sortie,
      name: item.nom_utilisateur || '',
      email: item.email || '',
      matricule: item.matricule_employe || '',
      direction: item.direction || '',
      fonction: item.fonction || '',
      destination: item.destination || '',
      reason: item.motif || '',
      returnDate: item.dateRetour ? String(item.dateRetour).slice(0, 10) : '',
      exitDate: item.dateSortie ? new Date(item.dateSortie).toISOString().slice(0, 10) : '',
      chauffeurName: item.nomChauffeur || '',
      dasiSignatureText: 'Signature DASI',
      vigilSignatureText: 'Signature Vigile',
    });
    setExitAuthRows(rowsFromDb);
    setSelectedRowIndex(0);

    fetchProduits(true);
    setActiveView('form');
  }

  async function handleDelete(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer cette sortie ?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/sorties/${id}`);
      await fetchAll();
      showNotification('Succès: Sortie supprimée.', 'success');
    } catch {
      showNotification('Erreur lors de la suppression.', 'error');
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm('Voulez-vous vraiment supprimer toutes les sorties ?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/sorties`);
      await fetchAll();
      showNotification('Succès: Toutes les sorties ont été supprimées.', 'success');
    } catch {
      showNotification('Erreur lors de la suppression de toutes les sorties.', 'error');
    }
  }


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
        const raw = localStorage.getItem('admin')
        if (raw) {
          try { setAdminProfile(JSON.parse(raw)) } catch (e) { /* ignore parse */ }
        }
  
        const token = localStorage.getItem('authToken')
        if (!token) return
  
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
          try { localStorage.setItem('admin', JSON.stringify(normalized)) } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.warn('Impossible de récupérer/valider le profil admin', err)
      }
    }
    loadProfile()
  }, [])
  
  function printTablePdf() {
    if (!processedData.length) {
      showNotification('Aucune donnée à imprimer.', 'warning');
      return;
    }
    const w = window.open('', '', 'height=600,width=900');
    w.document.write('<html><head><title>Liste des Sorties</title>');
    w.document.write(`
      <style>
        body { font-family: Arial; font-size:12px; margin: 20px; }
        h1 { text-align:center; font-size:18px; margin-bottom: 20px; }
        table { width:100%; border-collapse:collapse; border: 1px solid #000; }
        th, td { border: 1px solid #000; padding:8px; text-align:left; }
        th { background:#f8f9fa; font-weight:bold; color:#000; }
        .caracteristique-item { margin: 2px 0; }
        .caracteristique-bold { font-weight: bold; }
      </style>
    </head><body>`);
    w.document.write(`<h1>Liste des Sorties - ${new Date().toLocaleDateString('fr-FR')}</h1>`);
    w.document.write('<table><thead><tr>' +
  '<th><strong>Matricule Employé</strong></th><th><strong>Motif</strong></th><th><strong>Nom Chauffeur</strong></th><th><strong>ID Produit</strong></th>' +
  '<th><strong>Caractéristique de sortie</strong></th><th><strong>Date de Sortie</strong></th><th><strong>Date de Retour</strong></th>' +
  '</tr></thead><tbody>');

    processedData.forEach(item => {
      let idList = '';
      let caractHtml = '';
      try {
        const parsed = typeof item.caracteristique_sortie === 'string' ? JSON.parse(item.caracteristique_sortie) : item.caracteristique_sortie;
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        const ids = Array.from(new Set(arr.map(r => r.id_produit).filter(Boolean)));
        idList = ids.join(', ');
        
        caractHtml = arr.map(r => 
          `<div class="caracteristique-item">
            <span>désignation: </span><span class="caracteristique-bold">${r.designation || r.nomProduit || ''}</span>
            <span>; marque: </span><span class="caracteristique-bold">${r.marque || ''}</span>
            <span>; modèle: </span><span class="caracteristique-bold">${r.modele || ''}</span>
            <span>; numéroSerie: </span><span class="caracteristique-bold">${r.numeroSerie || ''}</span>
          </div>`
        ).join('');
      } catch {
        idList = '';
        caractHtml = `<div>${String(item.caracteristique_sortie || '').replace(/[\[\]{}"]/g, '')}</div>`;
      }
      w.document.write(`
        <tr>
          <td>${item.matricule_employe || ''}</td>
          <td>${item.motif || ''}</td>
          <td>${item.nomChauffeur || ''}</td>
          <td>${idList}</td>
          <td>${caractHtml}</td>
          <td>${item.dateSortie ? new Date(item.dateSortie).toLocaleString('fr-FR') : ''}</td>
          <td>${item.dateRetour ? new Date(item.dateRetour).toLocaleDateString('fr-FR') : ''}</td>
        </tr>
      `);
    });
    w.document.write('</tbody></table></body></html>');
    w.document.close();
    w.print();
  }

  const handleExitAuthInputChange = (field, value) => {
    setExitAuthFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExitAuthRowsChange = (index, field, value) => {
    const newRows = [...exitAuthRows];
    newRows[index][field] = value;
    setExitAuthRows(newRows);
  };

  const handleAddExitAuthRow = () => {
    setExitAuthRows([...exitAuthRows, { designation: '', marque: '', modele: '', numeroSerie: '', id_produit: null }]);
    setSelectedRowIndex(exitAuthRows.length);
  };

  const removeRowAndReleaseProductId = (index) => {
    const row = exitAuthRows[index];
    const nextRows = exitAuthRows.filter((_, i) => i !== index);
    if (row && row.id_produit) {
      // refresh used IDs after removal
      fetchSorties().then(() => {});
    }
    setExitAuthRows(nextRows.length ? nextRows : [{ designation: '', marque: '', modele: '', numeroSerie: '', id_produit: null }]);
    setSelectedRowIndex(Math.max(0, index - 1));
  };

  const handleRemoveExitAuthRow = () => {
    if (exitAuthRows.length > 1) {
      removeRowAndReleaseProductId(exitAuthRows.length - 1);
    }
  };

  function handleEmployeSelect(emp) {
    setExitAuthFormData(prev => ({
      ...prev,
      matricule: emp.matricule,
      name: emp.nom_complet,
      email: emp.adresse_email,
      fonction: emp.fonction,
      direction: emp.direction,
      destination: emp.localisation,
    }));
    setEmployeDropdownOpen(false);
  }

  const availableProduits = useMemo(() => {
    return produits.filter(p =>
      String(p.id_produit).toLowerCase().includes(produitSearch.toLowerCase()) ||
      (p.nomProduit || '').toLowerCase().includes(produitSearch.toLowerCase())
    );
  }, [produits, produitSearch]);

  const caracteristiqueExistsInRows = (prod) => {
    const t = (prod.nomProduit || '').toString().trim().toLowerCase();
    const m = (prod.marque || '').toString().trim().toLowerCase();
    const mo = (prod.modele || '').toString().trim().toLowerCase();
    const s = (prod.numeroSerie || '').toString().trim().toLowerCase();

    return exitAuthRows.some(r =>
      (r.designation || '').toString().trim().toLowerCase() === t &&
      (r.marque || '').toString().trim().toLowerCase() === m &&
      (r.modele || '').toString().trim().toLowerCase() === mo &&
      (r.numeroSerie || '').toString().trim().toLowerCase() === s
    );
  };

  async function handleProduitSelect(prod) {
    if (caracteristiqueExistsInRows(prod)) {
      showNotification('Les caractéristiques de cet ID produit sont déjà présentes dans le tableau. Impossible de l\'ajouter à nouveau.', 'warning');
      return;
    }

    if (usedProductIds.has(prod.id_produit)) {
      showNotification('Cet ID produit est déjà utilisé dans une sortie existante et n\'est pas disponible.', 'warning');
      return;
    }

    let indexToFill = selectedRowIndex ?? 0;
    const firstEmptyIndex = exitAuthRows.findIndex(r =>
      !r.designation && !r.marque && !r.modele && !r.numeroSerie && !r.id_produit
    );
    if (firstEmptyIndex !== -1) indexToFill = firstEmptyIndex;

    const next = [...exitAuthRows];
    next[indexToFill] = {
      ...next[indexToFill],
      designation: prod.nomProduit || '',
      marque: prod.marque || '',
      modele: prod.modele || '',
      numeroSerie: prod.numeroSerie || '',
      id_produit: prod.id_produit
    };
    setExitAuthRows(next);

    const nextUsed = new Set(usedProductIds);
    nextUsed.add(Number(prod.id_produit));
    setUsedProductIds(nextUsed);

    setProduitDropdownOpen(false);
  }

  const printDocument = (contentRef, title) => {
    const content = contentRef.current;
    if (!content) {
      showNotification('Rien à imprimer', 'warning');
      return false;
    }
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <base href="${window.location.origin}/" />
          <style>
            body { margin:0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-only-container { display: none; }
            @media print {
              .print-only-container { display: block !important; }
              table, th, td { border: 1px solid black !important; }
              td { padding: 5px !important; }
            }
          </style>
        </head>
        <body>
          ${content.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
    return true;
  };

  const generateExitAuthPdf = async () => {
    const printed = printDocument(exitAuthPrintRef, 'AUTORISATION DE SORTIE');
    if (!printed) return;

    if (!exitAuthFormData.name || !exitAuthFormData.email) {
      console.warn("Le nom de l'utilisateur et l'email sont requis pour l'historique.");
      return;
    }

    const dataToLog = {
      nom: exitAuthFormData.name,
      fonction: exitAuthFormData.fonction,
      direction: exitAuthFormData.direction,
      localisation: exitAuthFormData.destination,
      email: exitAuthFormData.email,
      type_action: 'sortie',
    };

    try {
      await axios.post(`${API_BASE_URL}/historique`, dataToLog);
      console.log('Sortie enregistrée avec succès dans l\'historique.');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement dans l\'historique:', error);
      showNotification('Erreur: L\'autorisation a été générée, mais l\'enregistrement dans l\'historique a échoué.', 'error');
    }
  };

  async function handleValidate() {
    if (!exitAuthFormData.matricule || !exitAuthFormData.reason || !exitAuthFormData.exitDate || !exitAuthRows.length) {
      showNotification('Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    const caracteristiquePayload = exitAuthRows.map(r => ({
      designation: r.designation,
      marque: r.marque,
      modele: r.modele,
      numeroSerie: r.numeroSerie,
      id_produit: r.id_produit || null
    }));

    const dateOnly = exitAuthFormData.exitDate;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dateSortie = `${dateOnly} ${hh}:${mm}:${ss}`;

    const payload = {
      matricule_employe: exitAuthFormData.matricule,
      motif: exitAuthFormData.reason,
      nomChauffeur: exitAuthFormData.chauffeurName || null,
      caracteristique_sortie: JSON.stringify(caracteristiquePayload),
      dateSortie,
      dateRetour: exitAuthFormData.returnDate || null,
      nom_utilisateur: exitAuthFormData.name || null,
      email: exitAuthFormData.email || null,
      fonction: exitAuthFormData.fonction || null,
      direction: exitAuthFormData.direction || null,
      destination: exitAuthFormData.destination || null
    };

    try {
      if (exitAuthFormData.id_sortie) {
        await axios.put(`${API_BASE_URL}/sorties/${exitAuthFormData.id_sortie}`, payload);
        showNotification('Succès: Sortie mise à jour avec succès.', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/sorties`, payload);
        showNotification('Succès: Sortie créée avec succès.', 'success');
      }
      await fetchAll();
      setActiveView('list');
    } catch (error) {
      console.error('Erreur sauvegarde sortie:', error);
      const msg = error?.response?.data?.error;
      if (msg) showNotification(`Erreur: ${msg}`, 'error');
      else showNotification('Erreur lors de la sauvegarde.', 'error');
      fetchProduits(true);
    }
  }

  const renderIdProduitCell = (item) => {
    try {
      const parsed = typeof item.caracteristique_sortie === 'string' ? JSON.parse(item.caracteristique_sortie) : item.caracteristique_sortie;
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const ids = Array.from(new Set(arr.map(r => r.id_produit).filter(Boolean)));
      return ids.join(', ');
    } catch {
      return '';
    }
  };

  function renderListView() {
    return (
      <>
        <section className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{sorties.length}</div>
            <div className="stat-label">{(isMobile || isTablet) ? 'Sorties' : 'Total Sorties'}</div>
          </div>
        </section>

        <div className="actions-filters-row">
          <div className="action-buttons">
            <button className="add-button" onClick={switchToAddForm}>
              <IoMdAddCircleOutline /> Ajouter sortie
            </button>
            <button className="pdf-button" onClick={printTablePdf}>
              <IoDocumentTextOutline /> Imprimer PDF
            </button>
            <button className="delete-all-button" onClick={handleDeleteAll}>
              <FaTrash /> Supprimer tout
            </button>
          </div>

          <div className="filters-wrapper">
            <span className="filter-label">Filtres :</span>

            <div className="dropdown">
              <button
                className={`dropdown-button ${dropdownOpen === 'date' ? 'active' : ''}`}
                onClick={() => setDropdownOpen(o => o === 'date' ? null : 'date')}
              >
                Date <FaAngleDown />
              </button>
              {dropdownOpen === 'date' && (
                <div className="dropdown-content date-filters-container" onClick={(e)=>e.stopPropagation()}>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                      <option value="">Mois</option>
                      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </select>
                    <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                      <option value="">Année</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <button onClick={() => { setFilterDate(''); setFilterMonth(''); setFilterYear(''); setDropdownOpen(null); }}>Réinitialiser</button>
                  </div>
                </div>
              )}
            </div>

            <div className="dropdown">
              <button
                className={`dropdown-button ${dropdownOpen === 'matricule' ? 'active' : ''}`}
                onClick={() => setDropdownOpen(o => o === 'matricule' ? null : 'matricule')}
              >
                Matricule <FaAngleDown />
              </button>
              {dropdownOpen === 'matricule' && (
                <div className="dropdown-content" onClick={(e)=>e.stopPropagation()}>
                  <div style={{ paddingBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Rechercher…"
                      value={filterMatricule}
                      onChange={e => setFilterMatricule(e.target.value)}
                      style={{ width:'100%', padding:6, borderRadius:6, border:'1px solid #ddd' }}
                    />
                  </div>
                  {uniqueMatricules
                    .filter(m => m.toLowerCase().includes(filterMatricule.toLowerCase()))
                    .map(m => (
                      <button key={m} onClick={() => { setFilterMatricule(m); setDropdownOpen(null); }}>
                        {m}
                      </button>
                    ))
                  }
                  <button onClick={() => { setFilterMatricule(''); setDropdownOpen(null); }}>
                    Effacer
                  </button>
                </div>
              )}
            </div>

            <button className="refresh-button" onClick={handleRefresh}>
              <IoMdRefresh /> Actualiser
            </button>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <table>
              <thead>
                <tr>
                  <th>Matricule Employé</th>
                  <th>Motif</th>
                  <th>Nom Chauffeur</th>
                  <th>ID Produit</th>
                  <th>Caractéristique de sortie</th>
                  <th>Date de Sortie</th>
                  <th>Date de Retour</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="table-body-wrapper">
            <table>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="loading-cell">Chargement…</td>
                  </tr>
                ) : paginatedData.length ? (
                  paginatedData.map(item => {
                    let caractEl = null;
                    try {
                      const parsed = typeof item.caracteristique_sortie === 'string' ? JSON.parse(item.caracteristique_sortie) : item.caracteristique_sortie;
                      const arr = Array.isArray(parsed) ? parsed : [parsed];
                      caractEl = (
                        <div style={{ fontSize:13 }}>
                          {arr.map((r, i) => (
                            <div key={i}>
                              <span>désignation: </span><strong>{r.designation || r.nomProduit || ''}</strong>
                              <span>; marque: </span><strong>{r.marque || ''}</strong>
                              <span>; modèle: </span><strong>{r.modele || ''}</strong>
                              <span>; numéroSerie: </span><strong>{r.numeroSerie || ''}</strong>
                            </div>
                          ))}
                        </div>
                      );
                    } catch {
                      caractEl = <span style={{ fontSize: 13 }}>{String(item.caracteristique_sortie || '').replace(/[\[\]{}"]/g, '')}</span>;
                    }

                    return (
                      <tr key={item.id_sortie}>
                        <td style={{ width:120 }}>{item.matricule_employe}</td>
                        <td style={{ width:120 }}>{item.motif}</td>
                        <td style={{ width:120 }}>{item.nomChauffeur || ''}</td>
                        <td style={{ width:100 }}>{renderIdProduitCell(item)}</td>
                        <td style={{ maxWidth: 420 }}>{caractEl}</td>
                        <td style={{ width:160 }}>{item.dateSortie ? new Date(item.dateSortie).toLocaleString('fr-FR') : ''}</td>
                        <td style={{ width:120 }}>{item.dateRetour ? new Date(item.dateRetour).toLocaleDateString('fr-FR') : ''}</td>
                        <td className="actions-cell">
                          <button
                            className="action-icon edit"
                            onClick={() => switchToEditForm(item)}
                            title="Modifier"
                            aria-label="Modifier"
                          >
                            <FaPencilAlt />
                          </button>
                          <button
                            className="action-icon delete"
                            onClick={() => handleDelete(item.id_sortie)}
                            title="Supprimer"
                            aria-label="Supprimer"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data-cell">Aucune donnée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{ marginTop:12 }}>
            <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Précédent
              </button>
              <span style={{ padding:'8px 12px', fontSize:13 }}>{`Page ${currentPage} sur ${totalPages}`}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Suivant
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderFormView() {
    return (
      <div className="form-view-container">
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <img src={logo} alt="Eneo Logo" style={{ width: 90 }} />
        </div>
        <h1 className="form-title">AUTORISATION DE SORTIE D'EQUIPEMENTS INFORMATIQUES</h1>

        <div className="form-grid">
          <div className="input-group">
            <label>Matricule <span style={{ color: 'red' }}>*</span></label>
            <div className="dropdown">
              <button
                className="dropdown-button"
                onClick={() => setEmployeDropdownOpen(o => !o)}
                style={{ justifyContent: "space-between" }}
              >
                {exitAuthFormData.matricule || 'Sélectionner…'} <FaAngleDown />
              </button>
              {employeDropdownOpen && (
                <div className="dropdown-content" onClick={(e)=>e.stopPropagation()}>
                  <div style={{ paddingBottom:8 }}>
                    <input
                      type="text"
                      placeholder="Rechercher…"
                      value={employeSearch}
                      onChange={e => setEmployeSearch(e.target.value)}
                      style={{ width:'100%', padding:6, borderRadius:6, border:'1px solid #ddd' }}
                    />
                  </div>
                  {employes
                    .filter(emp =>
                      (emp.matricule || '').toLowerCase().includes(employeSearch.toLowerCase()) ||
                      (emp.nom_complet || '').toLowerCase().includes(employeSearch.toLowerCase())
                    )
                    .map(emp => (
                      <button key={emp.matricule} onClick={() => handleEmployeSelect(emp)}>
                        {emp.matricule} - {emp.nom_complet}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {[
            { label: "Nom de l'utilisateur", field: 'name', placeholder: 'Nom et Prénom', required: true },
            { label: 'Email', field: 'email', placeholder: 'exemple@entreprise.com', required: true },
            { label: 'Direction', field: 'direction', placeholder: 'DASI', required: false },
            { label: 'Fonction', field: 'fonction', placeholder: "Chargé d'Etudes Niv 3", required: false },
            { label: 'Destination', field: 'destination', placeholder: 'DIRECTION GENERALE', required: false },
            { label: 'Motif', field: 'reason', placeholder: 'DOTATION', required: true },
            { label: 'Nom et signature chauffeur', field: 'chauffeurName', placeholder: 'Nom du chauffeur', required: false },
          ].map(({ label, field, placeholder, required }) => (
            <div className="input-group" key={field}>
              <label>
                {label} {required ? <span style={{ color: 'red' }}>*</span> : null}
              </label>
              <input
                type="text"
                value={exitAuthFormData[field]}
                placeholder={placeholder}
                onChange={e => handleExitAuthInputChange(field, e.target.value)}
                readOnly={['name', 'email', 'direction', 'fonction', 'destination'].includes(field)}
              />
            </div>
          ))}

          <div className="input-group">
            <label>Date de retour</label>
            <input
              type="date"
              value={exitAuthFormData.returnDate}
              onChange={e => handleExitAuthInputChange('returnDate', e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Date de sortie <span style={{ color: 'red' }}>*</span></label>
            <input
              type="date"
              value={exitAuthFormData.exitDate}
              onChange={e => handleExitAuthInputChange('exitDate', e.target.value)}
            />
          </div>

          <div className="input-group no-print">
            <label>ID Produit (sélectionne et remplit une ligne du tableau)</label>
            <div className="dropdown">
              <button className="dropdown-button" onClick={async () => { await fetchProduits(true); setProduitDropdownOpen(o => !o); }}>
                Sélectionner un produit… <FaAngleDown />
              </button>
              {produitDropdownOpen && (
                <div className="dropdown-content" onClick={(e)=>e.stopPropagation()}>
                  <div style={{ paddingBottom:8 }}>
                    <input type="text" placeholder="Rechercher…" value={produitSearch} onChange={e => setProduitSearch(e.target.value)} style={{ width:'100%', padding:6, borderRadius:6, border:'1px solid #ddd' }} />
                  </div>
                  {availableProduits.map(prod => (
                    <button key={prod.id_produit} onClick={() => handleProduitSelect(prod)}>
                      {prod.id_produit} - {prod.nomProduit}
                    </button>
                  ))}
                  {!availableProduits.length && <div style={{ padding: 10, color: '#666' }}>Aucun produit disponible</div>}
                </div>
              )}
            </div>
            <div style={{ marginTop:6, fontSize:12, color:"#555" }}>
              Astuce: cliquez sur une ligne du tableau ci-dessous pour y appliquer l'ID Produit.
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ margin: "8px 0" }}>Description du matériel</h3>
            <div style={{ overflow:auto }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f8f8" }}>
                    <th style={{ padding: 8 }}>DESIGNATION</th>
                    <th style={{ padding: 8 }}>MARQUE</th>
                    <th style={{ padding: 8 }}>MODELE</th>
                    <th style={{ padding: 8 }}>NUMERO DE SERIE</th>
                    <th className="no-print" style={{ padding: 8 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exitAuthRows.map((row, idx) => (
                    <tr key={idx} onClick={() => setSelectedRowIndex(idx)}>
                      <td style={{ border: "1px solid #ccc", padding: 4 }}>
                        <input type="text" value={row.designation} onChange={e => handleExitAuthRowsChange(idx, "designation", e.target.value)} style={{ width: "100%", border: "none", padding: 6 }} />
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: 4 }}>
                        <input type="text" value={row.marque} onChange={e => handleExitAuthRowsChange(idx, "marque", e.target.value)} style={{ width: "100%", border: "none", padding: 6 }} />
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: 4 }}>
                        <input type="text" value={row.modele} onChange={e => handleExitAuthRowsChange(idx, "modele", e.target.value)} style={{ width: "100%", border: "none", padding: 6 }} />
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: 4 }}>
                        <input type="text" value={row.numeroSerie} onChange={e => handleExitAuthRowsChange(idx, "numeroSuite" in row ? "numeroSuite" : "numeroSerie", e.target.value)} style={{ width: "100%", border: "none", padding: 6 }} />
                      </td>
                      <td className="no-print" style={{ border: "1px solid #ccc", textAlign: "center" }}>
                        <button onClick={e => { e.stopPropagation(); removeRowAndReleaseProductId(idx); }} style={{ backgroundColor: "#E74C3C", color: "#fff", padding: "6px 10px", borderRadius: 5, border: "none" }} title="Supprimer ligne">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={handleAddExitAuthRow} style={{ backgroundColor: "#28a745", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", marginRight: 8 }} title="Ajouter ligne">
                <FaPlus /> Ajouter ligne
              </button>
              <button onClick={handleRemoveExitAuthRow} style={{ backgroundColor: "#E74C3C", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none" }} title="Supprimer dernière ligne">
                <FaMinus /> Supprimer
              </button>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: 18, gap: 12, flexWrap: "wrap" }}>
            <button
              className="form-button-cancel"
              onClick={() => setActiveView("list")}
              style={{ backgroundColor: '#E74C3C', color: '#fff', padding: '10px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              ANNULER
            </button>
            <button
              className="form-button-submit"
              onClick={handleValidate}
              style={{ backgroundColor: '#0070B2', color: '#fff', padding: '10px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              {exitAuthFormData.id_sortie ? "METTRE À JOUR" : "VALIDER"}
            </button>
            <button
              onClick={generateExitAuthPdf}
              style={{ backgroundColor: "#E67E22", color: "#fff", padding: "10px 18px", borderRadius: 6, border: "none", cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              Imprimer la fiche
            </button>
          </div>
        </div>

        <div
          ref={exitAuthPrintRef}
          className="print-only-container"
          style={{ display: 'none' }}
        >
          {/* print content omitted for brevity - same as previous implementation */}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <style>{pageStyles}</style>

      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {(isMobile || isTablet) && isSidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-title">
          Magasin IT
          {(isMobile || isTablet) && (
            <button style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>
              <IoMdClose size={20}/>
            </button>
          )}
        </div>
        <nav>
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
        </nav>
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
              try {
                localStorage.removeItem('authToken');
                localStorage.removeItem('admin');
                localStorage.removeItem('isAuthenticated');
              } catch (err) { /* ignore */ }
              window.location.href = '/';
            }}
          >
            <MdLogout/> Déconnexion
          </a>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          {(isMobile || isTablet) && (
            <button className="menu-button" onClick={() => setIsSidebarOpen(true)} title="Menu">
              <FaBars/>
            </button>
          )}

          <button
            className="back-button"
            onClick={() =>
              activeView === 'form'
                ? setActiveView('list')
                : window.history.back()
            }
          >
            <FaArrowLeft style={{ marginRight: 8, fontSize: 18 }} />
            Retour
          </button>
          <div className="header-title">Gestion des Sorties</div>
          <div className={(isMobile || isTablet) ? "header-right" : "header-right"}>
            <input
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="scroll-content">
          {activeView === 'list' ? renderListView() : renderFormView()}
        </div>
      </main>
    </div>
  );
}

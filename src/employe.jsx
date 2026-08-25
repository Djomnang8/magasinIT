// src/employe/employe.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHome, FaDropbox, FaUserCircle, FaPencilAlt, FaTrash, FaChartBar,FaUser,
  FaCubes, FaTruck, FaArchive, FaPlus, FaMinus, FaBars, FaShoppingCart
} from 'react-icons/fa';
import { IoMdAddCircleOutline, IoMdRefresh, IoMdClose } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa6";
import { FaAngleDown } from 'react-icons/fa';

// --- CSS STYLES ---
const componentStyles = `
/* employe.css - complete stylesheet adjusted to match StocksScreen behaviors:
   - table vertical scrolling inside a fixed-height table-wrapper (no page scroll)
   - modal/form vertical scrolling with constrained max-height
   - improved responsive behavior so table rows/columns remain visible on mobile/tablet
   - consistent visual tokens with previous employe styles
*/

/* Root / variables */
:root{
  --bg: #f4f6f9;
  --brand-green: #689f38;
  --brand-blue: #0070B2;
  --danger-red: #E74C3C;
  --card-bg: #ffffff;
  --muted: #666;
  --muted-weak: #aaa;
  --ui-font: Arial, sans-serif;
}

/* Layout */
.container-fluid {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--bg);
  font-family: var(--ui-font);
  overflow: hidden; /* prevent the body page from scrolling when internal areas have scrollbars */
}

/* Sidebar */
.sidebar {
  width: 250px;
  background-color: var(--brand-green);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 15px;
  flex-shrink: 0;
  z-index: 100;
  transition: transform 0.3s ease-in-out;
  margin-left: -20px;
}
.sidebar-title {
  margin-left: 5px;
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}
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

/* Main content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px 15px;
  overflow: hidden; /* ensure internal scroll areas handle overflow instead of the page */
}

/* Header */
.header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:20px;
  gap:12px;
  flex-shrink: 0;
}
.header-title {
  font-size:24px;
  font-weight:700;
  color:#333;
  flex-grow:1;
  text-align:center;
}
.header-right { display:flex; align-items:center; gap:12px; }
.back-button {
  background:#f4f4f4;
  color:#333;
  padding:8px 12px;
  border-radius:6px;
  border:1px solid #ddd;
  display:flex;
  align-items:center;
  gap:8px;
  cursor:pointer;
  grid-column: 1;
    grid-row: 1;
    padding: 8px 12px;
    font-size: 14px;
    white-space: nowrap;
}
.menu-button {
    display: block;
    grid-column: 4;
    grid-row: 1;
    color: #689f38;
    font-size: 20px;
    background: none; border: none; cursor: pointer; padding: 8px;
  }
  
/* Search */
.search-input {
  padding:7px 12px;
  border:1px solid #ddd;
  border-radius:18px;
  font-size:13px;
  width:220px;
  background:#fff;
}

/* Scrollable area for the page's inner content (kept but not the page-level scrollbar) */
.scroll-content {
  display:flex;
  flex-direction:column;
  gap:18px;
  overflow: hidden; /* internal components (table-wrapper, modals) will manage own scroll */
  flex: 1 1 auto;
  -webkit-overflow-scrolling: touch;
}

/* Stats */
.stats-container { display:flex; gap:15px; justify-content:space-between; margin-bottom:8px; }
.stat-card {
  flex:1;
  background:var(--card-bg);
  border-radius:8px;
  padding:14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  text-align:center;
}
.stat-number { font-size:24px; font-weight:800; color:#333; }
.stat-label { font-size:13px; color:var(--muted); }

/* Actions & filters */
.actions-container { display:flex; flex-direction:column; gap:12px; align-items:flex-start; }
.action-buttons { display:flex; gap:8px; flex-wrap:wrap; }
.add-button, .pdf-button, .delete-all-button {
  padding:8px 14px; border-radius:6px; border:none; cursor:pointer; font-weight:700; display:inline-flex; gap:8px; align-items:center;
}
.add-button { background:var(--brand-blue); color:white; }
.pdf-button { background:#E67E22; color:white; }
.delete-all-button { background:var(--danger-red); color:white; }
.refresh-button {
  margin-left: 500px; background:#95a5a6; color:#111; padding:8px 12px; border-radius:6px; border:none; cursor:pointer; display:inline-flex; gap:8px;
}

/* Filters */
.filters-wrapper { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.filter-label { font-weight:bold; color:#555; font-size:13px; }
.dropdown { position:relative; display:inline-block; }
.dropdown-button {
  background:#fff; color:#555; padding:8px 12px; border:1px solid #ddd; border-radius:6px; cursor:pointer; min-width:110px;
  display:flex; align-items:center; justify-content:space-between; gap:8px;
}
.direction-dropdown-content,
.dropdown-content {
  position:absolute;
  top:calc(100% + 6px);
  left:0;
  background:#fff;
  min-width:200px;
  max-height:300px;
  overflow-y:auto;
  box-shadow: 0 8px 18px rgba(0,0,0,0.12);
  border-radius:8px;
  z-index: 40;
  padding:6px 0;
}
.direction-search-input { width:100%; padding:7px 10px; border:none; border-bottom:1px solid #eee; box-sizing:border-box; font-size:13px; }
.direction-option,
.dropdown-content button {
  background:none; border:none; width:100%; text-align:left; padding:10px 12px; cursor:pointer; font-size:13px; color:#222;
}
.direction-option:hover,
.dropdown-content button:hover { background:#f2f2f2; }
.direction-option.selected { background:var(--brand-green); color:white; }

/* Table container and wrapper: key changes to force internal vertical scroll for the table alone */
.table-container {
  background:var(--card-bg);
  border-radius:10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  display:flex;
  flex-direction:column;
  width:100%;
  height: 100%; /* allow wrapper to define height */
  min-height: 220px;
  max-height: 520px; /* default maximum height of the whole table area on desktop */
  overflow: hidden; /* preserved; table-wrapper will scroll */
}

/* table-wrapper is the scrollable pane for rows only (keeps header sticky) */
.table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border: 1px solid #eee;
  max-height: 420px; /* actual vertical scroll area for rows (adjustable) */
  min-height: 120px;
  -webkit-overflow-scrolling: touch;
  background: white;
}

/* Table styles */
table {
  width:100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 760px; /* allow horizontal scrolling on narrow screens while keeping rows vertically scrollable */
}
thead {
  position: sticky;
  top: 0;
  background: #fafafa;
  z-index: 20;
}
th, td {
  padding:12px 10px;
  text-align:left;
  border-bottom:1px solid #f0f0f0;
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
  
tbody tr:hover { background:#fcfcfd; }
.actions-cell { white-space: nowrap; min-width: 120px; }

/* Action icons */
.action-icon { background:none; border:none; cursor:pointer; font-size:14px; margin-right:8px; padding:6px; }
.action-icon.edit { color:#3498DB; }
.action-icon.delete { color:var(--danger-red); }

/* No data / loading */
.no-data-cell, .loading-cell { text-align:center; color:#888; padding:18px; }

/* Pagination */
.pagination-container {
  display:flex;
  justify-content:center;
  gap:8px;
  padding:12px 0;
}
.pagination-container button {
  background:var(--brand-green);
  color:white;
  padding:8px 12px;
  border:none;
  border-radius:6px;
  cursor:pointer;
}
.pagination-container button:disabled { background:#ccc; cursor:not-allowed; }
.pagination-info { font-size:13px; color:var(--muted); }

/* Modal / Form styling - modal view constrained to viewport and scrollable internally */
.modal-container {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.45);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1100;
  padding: 16px;
}
.modal-view {
  background: var(--card-bg);
  border-radius:8px;
  padding:20px;
  width: 92%;
  max-width: 520px;
  max-height: 84vh; /* constrain modal to viewport height */
  overflow: hidden; /* inner container handles scroll */
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  display:flex;
  flex-direction:column;
}
.modal-body {
  overflow-y: auto;
  padding-right: 8px;
  -webkit-overflow-scrolling: touch;
  flex: 1 1 auto;
  max-height: calc(84vh - 120px); /* Hauteur maximale avec défilement */
}
.modal-title { margin-bottom:12px; font-size:18px; font-weight:700; text-align:center; }

/* Container du formulaire avec défilement */
.modal-form-container {
  overflow-y: auto;
  max-height: calc(84vh - 160px); /* Hauteur ajustée pour le formulaire */
  padding-right: 8px;
  margin-bottom: 12px;
}

/* modal inputs */
.modal-input { width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:6px; margin-bottom:10px; box-sizing:border-box; font-size:14px; }
.modal-input.error { border-color: var(--danger-red); background: #fff0f0; }
.error-message { color:var(--danger-red); font-size:12px; margin-top:-6px; margin-bottom:8px; }

/* modal footer buttons */
.modal-buttons { display:flex; justify-content:flex-end; gap:10px; margin-top:12px; flex-shrink:0; }
.modal-button-cancel { background:#7f8c8d; color:white; padding:8px 14px; border-radius:6px; border:none; cursor:pointer; }
.modal-button-submit { background:var(--brand-green); color:white; padding:8px 14px; border-radius:6px; border:none; cursor:pointer; }

/* Form layout used inside modal: make the form scroll independently */
.form-grid {
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:12px;
}
.form-grid .full-width { grid-column: 1 / -1; }

/* Notification */
.notification {
  position: fixed;
  top:18px;
  right:18px;
  z-index:1200;
  padding:12px 16px;
  border-radius:8px;
  font-weight:700;
  max-width:420px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
.notification.error { background:#ffecec; color:#b71c1c; border:1px solid #f4b5b5; }
.notification.success { background:#e8f5e9; color:#1b5e20; border:1px solid #a5d6a7; }
.notification.warning { background:#fff9ec; color:#6a4a00; border:1px solid #f39c12; }

/* Direction dropdown small tweaks */
.direction-option.selected { background: var(--brand-green); color: white; }

/* Sidebar overlay for mobile */
.sidebar-overlay {
  display:none;
  position:fixed;
  inset:0;
  background-color: rgba(0,0,0,0.45);
  z-index: 99;
  cursor: pointer;
}

/* Responsive breakpoints */

/* Tablets and below */
@media (max-width: 1023px) {
  .container-fluid { flex-direction: column; position: relative; }
  .sidebar {
    position: fixed;
    height: 100%;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    width: 260px;
    padding: 15px;
    box-shadow: 2px 0 14px rgba(0,0,0,0.28);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay.visible { display:block; }
  .main-content { padding: 14px; width:100%; box-sizing:border-box; }

  /* Header becomes a compact grid */
  .header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap:8px;
    align-items:center;
    margin-bottom:14px;
  }
  .menu-button { 
    display:block; 
    color:var(--brand-green); 
    font-size:18px; 
  }
  .back-button { padding:6px 8px; font-size:13px; white-space:nowrap; }

  /* Réduction de la hauteur des composants pour donner plus d'espace au tableau */
  .stats-container { 
    margin-bottom: 6px; 
    gap: 10px;
  }
  .stat-card { 
    padding: 10px 8px; 
  }
  .stat-number { 
    font-size: 20px; 
  }
  .stat-label { 
    font-size: 12px; 
  }
  
  .actions-container { 
    gap: 8px; 
    margin-bottom: 6px;
  }
  .action-buttons { 
    gap: 6px; 
  }

  /* Filtres en disposition horizontale */
  .filters-wrapper { 
    flex-direction: row; 
    align-items: center; 
    gap: 8px; 
    flex-wrap: wrap;
  }
  .filter-label { 
    margin-bottom: 0; 
  }
  .dropdown, 
  .refresh-button { 
    flex: 0 1 auto; 
    margin-bottom: 0;
  }

  /* Augmentation de la hauteur du tableau */
  .table-container { 
    max-height: 68vh; /* Augmentation de la hauteur maximale */
    min-height: 200px;
  }
  .table-wrapper { 
    max-height: 58vh; /* Augmentation significative de la zone de défilement */
    min-height: 180px;
  }
  table { min-width: 700px; }
  th, td { padding:10px 8px; font-size:13px; }

  /* Modal sizing for tablet */
  .modal-view { 
    max-width: 560px; 
    max-height: 86vh; 
  }
  .modal-body {
    max-height: calc(86vh - 120px);
  }
  .modal-form-container {
    max-height: calc(86vh - 160px);
  }
}

/* Mobile phones */
@media (max-width: 767px) {
  .header {
    grid-template-columns: auto 1fr auto;
    gap:8px;
  }
  .menu-button { display:block; }
  .header-title { font-size:18px; }

  /* Sidebar width on mobile */
  .sidebar { width: 80%; min-width: 250px; }

  /* Stack stats - mais plus compact */
  .stats-container { 
    flex-direction: row; 
    gap:8px; 
    margin-bottom: 6px;
  }
  .stat-card { 
    padding:8px 6px; 
    flex: 1;
  }
  .stat-number { 
    font-size: 18px; 
  }
  .stat-label { 
    font-size: 11px; 
  }

  /* Actions: make buttons full width and wrap */
  .action-buttons { 
    width:100%; 
    display:flex; 
    gap:6px; 
    flex-wrap:wrap; 
  }
  .add-button, .pdf-button, .delete-all-button { 
    flex: 1 1 48%; 
    padding:8px 10px; 
    font-size:13px; 
    justify-content: center;
  }

  /* Filtres en disposition horizontale sur mobile aussi */
  .filters-wrapper { 
    flex-direction: row; 
    align-items: center; 
    gap: 6px; 
    width:100%; 
    flex-wrap: wrap;
  }
  .filter-label { 
    flex: 0 0 auto; 
    font-size: 12px;
  }
  .dropdown, 
  .refresh-button { 
    flex: 1 1 auto; 
    min-width: 120px;
  }
  .dropdown-button, 
  .refresh-button { 
    width: 100%; 
    box-sizing:border-box; 
    font-size: 12px;
    padding: 6px 8px;
  }

  /* Augmentation critique de la hauteur du tableau sur mobile */
  .table-container { 
    max-height: 62vh; /* Hauteur maximale augmentée */
  }
  .table-wrapper { 
    max-height: 52vh; /* Zone de défilement significativement augmentée */
    min-height: 160px;
  }
  table { min-width: 680px; }
  th, td { padding:8px 6px; font-size:12px; white-space: nowrap; }

  /* Modal adjustments for small screens */
  .modal-view { 
    width: 96%; 
    max-width: 420px; 
    max-height: 88vh; 
    padding:14px; 
  }
  .modal-body {
    max-height: calc(88vh - 120px);
  }
  .modal-form-container {
    max-height: calc(88vh - 160px);
  }
  .modal-buttons { 
    flex-direction:column-reverse; 
    gap:8px; 
  }
  .modal-button-cancel, 
  .modal-button-submit { 
    width:100%; 
  }

  /* Pagination stacked */
  .pagination-container { 
    flex-direction:column; 
    gap:8px; 
    padding: 8px 0;
  }
  .pagination-container button { 
    width:100%; 
  }
}

/* Large screens: more breathing room */
@media (min-width: 1440px) {
  .container-fluid { max-width:1600px; margin:0 auto; }
  .sidebar { width:260px; }
  .main-content { padding:25px 40px; }
  .header-title { font-size:28px; }
  .table-container { max-height: 620px; }
  .table-wrapper { max-height: 520px; }
}

/* Accessibility / visual polish */
.table-wrapper::-webkit-scrollbar,
.modal-body::-webkit-scrollbar,
.modal-form-container::-webkit-scrollbar,
.direction-dropdown-content::-webkit-scrollbar,
.dropdown-content::-webkit-scrollbar {
  height:10px;
  width:10px;
}
.table-wrapper::-webkit-scrollbar-thumb,
.modal-body::-webkit-scrollbar-thumb,
.modal-form-container::-webkit-scrollbar-thumb,
.direction-dropdown-content::-webkit-scrollbar-thumb,
.dropdown-content::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 8px;
}
.table-wrapper::-webkit-scrollbar-track,
.modal-body::-webkit-scrollbar-track,
.modal-form-container::-webkit-scrollbar-track {
  background: transparent;
}

/* Styles spécifiques pour le formulaire modal avec défilement */
.modal-form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
`;

// --- CONSTANTS & UTILITIES ---
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

console.log('🌐 API URL:', API_BASE_URL); // Pour debug
const ITEMS_PER_PAGE = 10;

// --- MAIN COMPONENT ---
export default function EmployeScreen() {
  const navigate = useNavigate();

  // --- STATES ---
  const [allEmployes, setAllEmployes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmploye, setCurrentEmploye] = useState(null);
  const [sortBy, setSortBy] = useState({ key: 'nom_complet', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [filterMatricule, setFilterMatricule] = useState(null);
  const [filterDirection, setFilterDirection] = useState(null);
  const [directionSearch, setDirectionSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [matriculeSearch, setMatriculeSearch] = useState('');

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

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchEmployes();
  }, []);

  const fetchEmployes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/employes`);
      setAllEmployes(response.data);
    } catch (error) {
      console.error('Error fetching employes:', error);
      showNotification('Erreur: Impossible de charger les données des employés.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- DATA PROCESSING (MEMOIZED) ---
  const uniqueMatricules = useMemo(() => {
    return [...new Set(allEmployes.map(e => e.matricule).filter(Boolean))];
  }, [allEmployes]);

  const uniqueDirections = useMemo(() => {
      return [...new Set(allEmployes.map(e => e.direction).filter(Boolean))];
    }, [allEmployes]);
  
    const filteredDirections = useMemo(() => {
      if (!directionSearch) return uniqueDirections;
      return uniqueDirections.filter(direction => 
        direction.toLowerCase().includes(directionSearch.toLowerCase())
      );
    }, [uniqueDirections, directionSearch]);
  
    const processedData = useMemo(() => {
      let filtered = [...allEmployes];
  
      if (searchQuery.length > 0) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(employe =>
          (employe.nom_complet && employe.nom_complet.toLowerCase().includes(lowerCaseQuery)) ||
          (employe.matricule && employe.matricule.toLowerCase().includes(lowerCaseQuery)) ||
          (employe.adresse_email && employe.adresse_email.toLowerCase().includes(lowerCaseQuery))
        );
      }
  
      if (filterMatricule) {
        filtered = filtered.filter(employe => employe.matricule === filterMatricule);
      }
  
      if (filterDirection) {
        filtered = filtered.filter(employe => employe.direction === filterDirection);
      }
  
      filtered.sort((a, b) => {
        const aValue = a[sortBy.key] || '';
        const bValue = b[sortBy.key] || '';
        if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
        return 0;
      });
  
      return filtered;
    }, [allEmployes, searchQuery, sortBy, filterMatricule, filterDirection]);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  // --- FORM VALIDATION ---
  const validateForm = () => {
    const errors = {};
    
    if (!currentEmploye?.matricule) errors.matricule = 'Matricule est obligatoire';
    if (!currentEmploye?.nom_complet) errors.nom_complet = 'Nom complet est obligatoire';
    if (!currentEmploye?.fonction) errors.fonction = 'Fonction est obligatoire';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- CRUD HANDLERS ---
  const handleAddEmploye = async () => {
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/employes`, currentEmploye);
      await fetchEmployes();
      closeModal();
      showNotification('Succès: Employé ajouté avec succès.', 'success');
    } catch (error) {
      console.error('Error adding employe:', error);
      showNotification("Erreur: Impossible d'ajouter l'employé. Le matricule et l'email doivent être uniques.", 'error');
    }
  };

  const handleUpdateEmploye = async () => {
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/employes/${currentEmploye.id_employe}`, currentEmploye);
      await fetchEmployes();
      closeModal();
      showNotification('Succès: Employé modifié avec succès.', 'success');
    } catch (error) {
      console.error('Error updating employe:', error);
      showNotification('Erreur: Impossible de modifier l\'employé. Le matricule et l\'email doivent être uniques.', 'error');
    }
  };

  const handleDeleteEmploye = async (id) => {
  if (window.confirm("Voulez-vous vraiment supprimer cet employé ?")) {
    try {
      await axios.delete(`${API_BASE_URL}/employes/${id}`);
      await fetchEmployes();
      showNotification("Succès: Employé supprimé.", 'success');
    } catch (error) {
      console.error('Error deleting employe:', error);
      
      // Message d'erreur personnalisé selon la contrainte
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('attribution')) {
          showNotification("Erreur: Impossible de supprimer - cet employé est lié à des attributions de matériel.", 'error');
        } else if (error.response.data.error.includes('sortie')) {
          showNotification("Erreur: Impossible de supprimer - cet employé est lié à des sorties de matériel.", 'error');
        } else {
          showNotification(`Erreur: ${error.response.data.error}`, 'error');
        }
      } else {
        showNotification("Erreur: Impossible de supprimer l'employé.", 'error');
      }
    }
  }
};
  const handleDeleteAll = async () => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer TOUS les employés ? Cette action est irréversible.')) return;
  try {
    const deletePromises = allEmployes.map(employe => 
      axios.delete(`${API_BASE_URL}/employes/${employe.id_employe}`)
    );
    
    await Promise.all(deletePromises);
    setAllEmployes([]);
    showNotification('Tous les employés ont été supprimés avec succès.', 'success');
  } catch (error) {
    console.error('Erreur suppression totale:', error);
    
    // Message d'erreur personnalisé pour la suppression en masse
    if (error.response?.data?.error) {
      if (error.response.data.error.includes('attribution') || error.response.data.error.includes('sortie')) {
        showNotification("Erreur: Impossible de supprimer tous les employés - certains sont liés à des attributions ou sorties de matériel.", 'error');
      } else {
        showNotification(`Erreur: ${error.response.data.error}`, 'error');
      }
    } else {
      showNotification('Erreur lors de la suppression de tous les employés.', 'error');
    }
  }
};


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

// --- PDF GENERATION ---
  const generatePdf = () => {
    if (processedData.length === 0) {
      showNotification('Aucune donnée à imprimer.', 'warning');
      return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Liste des Employés</title>');
    printWindow.document.write(`<style>
      body { font-family: Arial, sans-serif; font-size: 10px; }
      h1 { text-align: center; font-size: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style></head><body>`);
    printWindow.document.write(`<h1>Liste des Employés - ${new Date().toLocaleDateString('fr-FR')}</h1>`);
    printWindow.document.write('<table><thead><tr><th>Matricule</th><th>Nom complet</th><th>Adresse email</th><th>Localisation</th><th>Direction</th><th>Fonction</th></tr></thead><tbody>');
    processedData.forEach(employe => {
      printWindow.document.write(`<tr>
        <td>${employe.matricule}</td>
        <td>${employe.nom_complet}</td>
        <td>${employe.adresse_email}</td>
        <td>${employe.localisation}</td>
        <td>${employe.direction}</td>
        <td>${employe.fonction}</td>
      </tr>`);
    });
    printWindow.document.write('</tbody></table></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // --- UI HANDLERS ---
  const handleSort = (key) => {
    const direction = sortBy.key === key && sortBy.direction === 'asc' ? 'desc' : 'asc';
    setSortBy({ key, direction });
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setFilterMatricule(null);
    setFilterDirection(null); // <-- AJOUT/CORRECTION : Réinitialiser le filtre de direction
    setSortBy({ key: 'nom_complet', direction: 'asc' });
    setCurrentPage(1);
    fetchEmployes();
  };

  const openModalForAdd = () => {
    setIsEditing(false);
    setCurrentEmploye({ 
      matricule: '', 
      nom_complet: '', 
      adresse_email: '', 
      localisation: '', 
      direction: '', 
      fonction: '' 
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const openModalForEdit = (employe) => {
    setIsEditing(true);
    setCurrentEmploye({
      id_employe: employe.id_employe,
      matricule: employe.matricule,
      nom_complet: employe.nom_complet,
      adresse_email: employe.adresse_email,
      localisation: employe.localisation,
      direction: employe.direction,
      fonction: employe.fonction
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentEmploye(null);
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setCurrentEmploye(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="container-fluid">
      <style>{componentStyles}</style>
      
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Overlay pour fermer la sidebar en cliquant à l'extérieur sur mobile/tablette */}
      {(isMobile || isTablet) && isSidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-title">
          MAGASIN IT
          {(isMobile || isTablet) && (
            <button style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>
              <IoMdClose size={20}/>
            </button>
          )}
        </div>
        <a className="sidebar-item" href="/accueil" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaHome/> Accueil
        </a>
        <a className="sidebar-item" href="/livraison" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaTruck/> Livraison
        </a>
        <a className="sidebar-item" href="/action" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaCubes/> Stock
        </a>
        <a className="sidebar-item" href="/inventaire" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaChartBar/> Inventaire
        </a>
        <a className="sidebar-item" href="/fournisseurs" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaShoppingCart/> Fournisseur
        </a>
        <a className="sidebar-item active" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaUser/> Employés
        </a>
        <a className="sidebar-item" href="/admin" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaUser/> Administrateur
        </a>
        
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <FaUserCircle size={32}/>
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
                  // Optionnel : vider tout le storage si souhaité
                  // localStorage.clear();
              
                  // rediriger vers la page d'authentification
                  navigate('/');
                }}
              >
                <MdLogout/> Déconnexion
              </a>
        </div>
      </aside>

      <main className="main-content">
        <div className="header">
          {(isMobile || isTablet) && (
            <button className="menu-button" onClick={() => setIsSidebarOpen(true)} title="Menu">
              <FaBars/>
            </button>
          )}
          
          <button className="back-button" onClick={() => navigate('/accueil')}>
            <FaArrowLeft/> Retour
          </button>
          
          <h1 className="header-title">Gestion des Employés</h1>
          
          <div className={(isMobile || isTablet) ? "search-input-container-mobile" : "header-right"}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Rechercher des employés..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="scroll-content">
          <section className="stats-container">
            <div className="stat-card">
              <div className="stat-number">{allEmployes.length}</div>
              <div className="stat-label">
                {isMobile || isTablet ? 'Employés' : 'Total Employés'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {[...new Set(allEmployes.map(e => e.direction))].length}
              </div>
              <div className="stat-label">
                {isMobile || isTablet ? 'Directions' : 'Total Directions'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {[...new Set(allEmployes.map(e => e.fonction))].length}
              </div>
              <div className="stat-label">
                {isMobile || isTablet ? 'Fonctions' : 'Total Fonctions'}
              </div>
            </div>
          </section>

          <section className="actions-container">
            <div className="action-buttons">
              <button className="add-button" onClick={openModalForAdd}>
                <IoMdAddCircleOutline/> Ajouter Employé
              </button>
              <button className="pdf-button" onClick={generatePdf}>
                <IoDocumentTextOutline/> Générer PDF
              </button>
              <button className="delete-all-button" onClick={handleDeleteAll}>
                <FaTrash/> Tout Supprimer
              </button>
              
            </div>

            <div className="filters-wrapper">
              <span className="filter-label">Filtrer par:</span>
              
{/* Filtre Matricule */}
<div className="dropdown">
  <button className="dropdown-button" onClick={() => {
    setDropdownOpen(dropdownOpen === 'matricule' ? null : 'matricule');
    setMatriculeSearch('');
  }}>
    Matricule <FaAngleDown/>
  </button>
  {dropdownOpen === 'matricule' && (
    <div className="direction-dropdown-content">
      <input 
        type="text" 
        className="direction-search-input" 
        placeholder="Rechercher matricule..." 
        value={matriculeSearch} 
        onChange={e => setMatriculeSearch(e.target.value)}
      />
      <button 
        className={`direction-option ${!filterMatricule ? 'selected' : ''}`}
        onClick={() => { 
          setFilterMatricule(null); 
          setDropdownOpen(null); 
        }}
      >
        Tous les matricules
      </button>
      {uniqueMatricules
        .filter(matricule => 
          matricule.toLowerCase().includes(matriculeSearch.toLowerCase())
        )
        .map(matricule => (
          <button 
            key={matricule} 
            className={`direction-option ${filterMatricule === matricule ? 'selected' : ''}`}
            onClick={() => { 
              setFilterMatricule(matricule); 
              setDropdownOpen(null); 
            }}
          >
            {matricule}
          </button>
        ))
      }
    </div>
  )}
</div>

              {/* Filtre Direction */}
              <div className="dropdown">
                <button className="dropdown-button" onClick={() => {
                  setDropdownOpen(dropdownOpen === 'direction' ? null : 'direction');
                  setDirectionSearch('');
                }}>
                  Direction <FaAngleDown/>
                </button>
                {dropdownOpen === 'direction' && (
                  <div className="direction-dropdown-content">
                    <input 
                      type="text" 
                      className="direction-search-input" 
                      placeholder="Rechercher direction..." 
                      value={directionSearch} 
                      onChange={e => setDirectionSearch(e.target.value)}
                    />
                    <button 
                      className={`direction-option ${!filterDirection ? 'selected' : ''}`}
                      onClick={() => { 
                        setFilterDirection(null); 
                        setDropdownOpen(null); 
                      }}
                    >
                      Toutes les directions
                    </button>
                    {filteredDirections.map(direction => (
                      <button 
                        key={direction} 
                        className={`direction-option ${filterDirection === direction ? 'selected' : ''}`}
                        onClick={() => { 
                          setFilterDirection(direction); 
                          setDropdownOpen(null); 
                        }}
                      >
                        {direction}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="refresh-button" onClick={handleRefresh}>
                <IoMdRefresh/> Actualiser
              </button>
            </div>
          </section>

          <section className="table-container">
            <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('matricule')}>
                    Matricule {sortBy.key === 'matricule' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('nom_complet')}>
                    Nom Complet {sortBy.key === 'nom_complet' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('adresse_email')}>
                    Adresse Email {sortBy.key === 'adresse_email' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('localisation')}>
                    Localisation {sortBy.key === 'localisation' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('direction')}>
                    Direction {sortBy.key === 'direction' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('fonction')}>
                    Fonction {sortBy.key === 'fonction' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="loading-cell">Chargement des données...</td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data-cell">Aucun employé trouvé</td>
                  </tr>
                ) : (
                  paginatedData.map(employe => (
                    <tr key={employe.id_employe}>
                      <td>{employe.matricule}</td>
                      <td>{employe.nom_complet}</td>
                      <td>{employe.adresse_email}</td>
                      <td>{employe.localisation}</td>
                      <td>{employe.direction}</td>
                      <td>{employe.fonction}</td>
                      <td className="actions-cell">
                        <button className="action-icon edit" onClick={() => openModalForEdit(employe)} title="Modifier">
                          <FaPencilAlt/>
                        </button>
                        <button className="action-icon delete" onClick={() => handleDeleteEmploye(employe.id_employe)} title="Supprimer">
                          <FaTrash/>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </section>

          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
              >
                Précédent
              </button>
              <span style={{ padding: '8px 12px', fontSize: '13px' }}>
                Page {currentPage} sur {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </main>

{modalVisible && (
  <div className="modal-container">
    <div className="modal-view">
      <h2 className="modal-title">
        {isEditing ? 'Modifier Employé' : 'Ajouter Employé'}
      </h2>
      
      {/* Container avec défilement pour le formulaire */}
      <div className="modal-form-container">
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Matricule <span style={{ color: 'red' }}>*</span>
          </label>
          <input 
            type="text" 
            className={`modal-input ${formErrors.matricule ? 'error' : ''}`}
            placeholder="Saisir le matricule" 
            value={currentEmploye?.matricule || ''} 
            onChange={e => handleInputChange('matricule', e.target.value)}
          />
          {formErrors.matricule && <div className="error-message">{formErrors.matricule}</div>}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Nom Complet <span style={{ color: 'red' }}>*</span>
          </label>
          <input 
            type="text" 
            className={`modal-input ${formErrors.nom_complet ? 'error' : ''}`}
            placeholder="Saisir le nom complet" 
            value={currentEmploye?.nom_complet || ''} 
            onChange={e => handleInputChange('nom_complet', e.target.value)}
          />
          {formErrors.nom_complet && <div className="error-message">{formErrors.nom_complet}</div>}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Adresse Email
          </label>
          <input 
            type="email" 
            className="modal-input"
            placeholder="Saisir l'adresse email" 
            value={currentEmploye?.adresse_email || ''} 
            onChange={e => handleInputChange('adresse_email', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Localisation
          </label>
          <input 
            type="text" 
            className="modal-input"
            placeholder="Saisir la localisation" 
            value={currentEmploye?.localisation || ''} 
            onChange={e => handleInputChange('localisation', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Direction
          </label>
          <input 
            type="text" 
            className="modal-input"
            placeholder="Saisir la direction" 
            value={currentEmploye?.direction || ''} 
            onChange={e => handleInputChange('direction', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Fonction <span style={{ color: 'red' }}>*</span>
          </label>
          <input 
            type="text" 
            className={`modal-input ${formErrors.fonction ? 'error' : ''}`}
            placeholder="Saisir la fonction" 
            value={currentEmploye?.fonction || ''} 
            onChange={e => handleInputChange('fonction', e.target.value)}
          />
          {formErrors.fonction && <div className="error-message">{formErrors.fonction}</div>}
        </div>
      </div>
      
      <div className="modal-buttons">
        <button className="modal-button-cancel" onClick={closeModal}>
          Annuler
        </button>
        <button 
          className="modal-button-submit" 
          onClick={isEditing ? handleUpdateEmploye : handleAddEmploye}
        >
          {isEditing ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
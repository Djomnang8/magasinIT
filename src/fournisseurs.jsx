// src/fournisseurs/fournisseurs.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHome, FaDropbox, FaUserCircle, FaPencilAlt, FaTrash, FaUser,
  FaCubes, FaTruck, FaArchive, FaBars, FaShoppingCart, FaAngleDown,FaChartBar
} from 'react-icons/fa';
import { IoMdAddCircleOutline, IoMdRefresh, IoMdClose, IoMdNotificationsOutline } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa6";

// --- CSS STYLES ---
const componentStyles = `
/* General Layout & Sidebar */
.container-fluid {  
  display: flex; 
  min-height: 100vh; 
  width: 100vw; 
  background-color: #f4f6f9; 
  font-family: Arial, sans-serif; 
  overflow: hidden;
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

/* Main Content Area */
.main-content { 
  flex: 1;
  padding: 15px 0 15px 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 100vh;
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

/* Content Area - NO SCROLL */
.content-area {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  overflow: hidden;
}

/* Actions Container */
.actions-container { 
  display: flex; 
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; 
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
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
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-left : 400px;
}

.refresh-button:hover { 
  background-color: #898c8cff; 
}

/* Filters */
.filters-wrapper { 
  display: flex; 
  gap: 15px; 
  align-items: center; 
  flex-wrap: wrap; 
  margin-bottom: 15px;
  flex-shrink: 0;
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
  z-index: 100; /* Augmenté de 10 à 100 pour s'assurer qu'il est au-dessus du tableau */
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

/* Table Container with Scroll */
.table-scroll-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.table-container { 
  background-color: white; 
  border-radius: 8px; 
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06); 
  overflow: auto; 
  display: flex; 
  flex-direction: column; 
  flex: 1;
  min-height: 0;
}

table { 
  width: 100%; 
  border-collapse: collapse; 
  display: table;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

th, td { 
  padding: 12px; 
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

th:last-child, td:last-child { 
  border-right: none; 
}

.actions-cell { 
  white-space: nowrap; 
}

.action-icon { 
  background: none; 
  border: none; 
  cursor: pointer; 
  font-size: 14px; 
  margin-right: 8px; 
}

.action-icon.edit { 
  color: #3498DB; 
}

.action-icon.delete { 
  color: #E74C3C; 
}

.no-data-cell { 
  text-align: center; 
  color: #888; 
  padding: 15px; 
}

.loading-cell { 
  text-align: center; 
  color: #888; 
  padding: 15px; 
}

/* Pagination */
.pagination-container { 
  display: flex; 
  justify-content: center; 
  margin-top: 15px; 
  gap: 8px; 
  flex-shrink: 0;
  padding: 12px 0;
}

.pagination-container button { 
  background-color: #689f38; 
  color: white; 
  padding: 8px 12px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 13px; 
}

.pagination-container button:disabled { 
  background-color: #ccc; 
}

/* Modal */
.modal-container { 
  position: fixed; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  background-color: rgba(0, 0, 0, 0.5); 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  z-index: 1000; 
}

.modal-view { 
  background-color: white; 
  padding: 25px; 
  border-radius: 8px; 
  width: 90%; 
  max-width: 450px; 
  max-height: 90vh; 
  overflow-y: auto; 
}

.modal-title { 
  font-size: 18px; 
  font-weight: bold; 
  margin-bottom: 15px; 
  text-align: center; 
}

.modal-input { 
  width: 100%; 
  padding: 8px; 
  margin-bottom: 12px; 
  border: 1px solid #ddd; 
  border-radius: 4px; 
  font-size: 13px; 
}

.modal-input.error { 
  border-color: #E74C3C; 
  background-color: #ffebee; 
}

.error-message { 
  color: #E74C3C; 
  font-size: 11px; 
  margin-top: -8px; 
  margin-bottom: 8px; 
}

.required-field::after {
  content: " *";
  color: #E74C3C;
}

.modal-buttons { 
  display: flex; 
  justify-content: flex-end; 
  gap: 12px; 
  margin-top: 15px; 
}

.modal-button-cancel { 
  background-color: #7f8c8d; 
  color: white; 
  padding: 8px 15px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 13px; 
}

.modal-button-submit { 
  background-color: #4CAF50; 
  color: white; 
  padding: 8px 15px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 13px; 
}

/* Notification Styles */
.notification { 
  position: fixed; 
  top: 15px; 
  right: 15px; 
  padding: 12px 15px; 
  border-radius: 4px; 
  z-index: 1000; 
  font-weight: bold; 
  max-width: 350px; 
  font-size: 13px; 
}

.notification.error { 
  background-color: #ffebee; 
  color: #c62828; 
  border: 1px solid #ef9a9a; 
}

.notification.success { 
  background-color: #e8f5e9; 
  color: #2e7d32; 
  border: 1px solid #a5d6a7; 
}

.notification.warning { 
  background-color: #fff3e0; 
  color: #ef6c00; 
  border: 1px solid #ffcc80; 
}

/* Overlay pour mobile/tablette */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
  cursor: pointer;
}

/* === MEDIA QUERIES POUR LE RESPONSIVE === */

/* Tablettes (768px - 1023px) et Smartphones (max-width: 767px) */
@media (max-width: 1023px) {
  .container-fluid { 
    flex-direction: column; 
    position: relative;
  }
  
  .sidebar {
    position: fixed;
    height: 100%;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    width: 250px;
    padding: 15px;
  }
  
  .sidebar.open {
    transform: translateX(0);
    box-shadow: 2px 0 4px rgba(0,0,0,0.4);
  }
  
  .sidebar-overlay.visible {
    display: block;
  }
  
  .sidebar-title { margin-left : 5px; font-size: 22px; font-weight: bold; margin-bottom: 15px; padding-bottom: 20px;border-bottom: 1px solid rgba(255, 255, 255, 0.2);}
.sidebar-item {  margin-top: -5px; margin-left : 5px; display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; text-decoration: none; color: white; font-size: 14px; transition: background-color 0.2s; }
.sidebar-item:hover { background-color: rgba(255, 255, 255, 0.1); }
.sidebar-item.active { background-color: rgba(255, 255, 255, 0.2); font-weight: bold; }

.sidebar-item-deconnect {  margin-top: 5px; margin-left : 5px; display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; text-decoration: none; color: white; font-size: 14px; transition: background-color 0.2s; }
.sidebar-item-deconnect:hover { background-color: rgba(255, 255, 255, 0.1); }
.sidebar-item-deconnect.active { background-color: rgba(255, 255, 255, 0.2); font-weight: bold; }

.sidebar-footer { padding-top: 10px; margin-left : 5px; margin-top: 10px;  border-top: 1px solid rgba(255, 255, 255, 0.2); }


  .main-content { 
    padding: 12px 12px; 
    height: 100vh;
    overflow: hidden;
  } 

  .content-area {
    height: calc(100vh - 100px);
  }

  /* Header mobile/tablette */
  .header { 
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 8px;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .menu-button { 
    display: block; 
    color: #689f38;
    font-size: 18px;
    grid-column: 4;
    grid-row: 1;
  }
  
  .back-button { 
    grid-column: 1; 
    grid-row: 1; 
    font-size: 12px;
    padding: 6px 8px;
  }
  
  .header-title { 
    font-size: 18px; 
    text-align: center;
    grid-column: 2; 
    grid-row: 1;
  }
  
  .header-right { 
    grid-column: 3; 
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  
  .search-input-container-mobile {
    width: 100%; 
    grid-column: 1 / span 4;
    grid-row: 2;
  }
  
  .search-input { 
    width: 100%; 
    margin: 0;
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .actions-container { 
    flex-direction: column; 
    align-items: stretch; 
    gap: 12px; 
  }
  
  .action-buttons { 
    width: 100%; 
    justify-content: flex-start; 
    flex-wrap: wrap; 
    gap: 8px;
  }
  
  .filters-wrapper { 
    width: 100%; 
    justify-content: flex-start; 
    flex-wrap: wrap; 
    gap: 8px; 
  }
  
  .dropdown { 
    min-width: 90px; 
  }
  
  .refresh-button { 
    margin-left: 0; 
    width: 100%;
  }
  
  .table-container { 
    overflow-x: auto; 
  }
  
  table { 
    min-width: 700px; 
  }
}

/* Smartphones (max-width: 767px) */
@media (max-width: 767px) {
  .header { 
    grid-template-columns: auto 1fr auto auto; 
    gap: 8px;
  }
  
  .back-button { 
    grid-column: 1; 
    grid-row: 1; 
  }
  
  .header-title { 
    grid-column: 2; 
    grid-row: 1;
  }
  
  .header-right { 
    grid-column: 3; 
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .menu-button { 
    grid-column: 4; 
    grid-row: 1;
  }
  
  .search-input-container-mobile {
    grid-column: 1 / span 4;
    grid-row: 2;
    display: block;
    width: 100%;
  }

  .sidebar { 
    width: 80%;
    min-width: 250px;
  }
  
  .sidebar-item { 
    justify-content: flex-start; 
  }
  
  .main-content { 
    padding: 8px 0 8px 8px; 
  }
  
  .action-buttons { 
    flex-direction: row; 
    gap: 6px; 
    justify-content: space-between; 
  }
  
  .add-button, .pdf-button, .delete-all-button { 
    flex: 1; 
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .filters-wrapper { 
    flex-direction: column; 
    align-items: stretch;
    gap: 6px;
  }
  
  .dropdown { 
    width: 100%; 
  }
  
  .refresh-button { 
    width: 100%; 
  }
  
  th, td { 
    padding: 6px 4px; 
    font-size: 11px; 
  }
  
  .modal-view { 
    padding: 15px; 
    margin: 8px; 
  }
  
  .modal-buttons { 
    flex-direction: column; 
    gap: 8px; 
  }
  
  .modal-button-cancel, .modal-button-submit { 
    width: 100%; 
  }
  
  .pagination-container { 
    flex-wrap: wrap; 
    gap: 6px; 
  }
  
  .pagination-container button { 
    padding: 6px 10px; 
    font-size: 12px; 
  }
}

/* Grands écrans (min-width: 1440px) */
@media (min-width: 1440px) {
  .container-fluid { 
    max-width: 1600px; 
    margin: 0 auto; 
  }
  
  .sidebar { 
    width: 260px; 
  }
  
  .main-content { 
    padding: 25px 40px; 
  }
  
  .header-title { 
    font-size: 28px; 
  }
}

/* Dropdown Search */
.dropdown-search {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.dropdown-search input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.dropdown-scroll-list {
  max-height: 200px;
 
}

.no-data-message {
  padding: 10px;
  text-align: center;
  color: #888;
  font-style: italic;
}
`;

// --- CONSTANTS & UTILITIES ---
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

// --- MAIN COMPONENT ---
export default function FournisseursScreen() {
  const navigate = useNavigate();

  // --- STATES ---
  const [allFournisseurs, setAllFournisseurs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFournisseur, setCurrentFournisseur] = useState(null);
  const [sortBy, setSortBy] = useState({ key: 'nom', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [bonCommandeSearch, setBonCommandeSearch] = useState('');

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
    fetchFournisseurs();
  }, []);

  const fetchFournisseurs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/fournisseurs`);
      setAllFournisseurs(response.data);
    } catch (error) {
      console.error('Error fetching fournisseurs:', error);
      showNotification('Erreur: Impossible de charger les données des fournisseurs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- DATA PROCESSING (MEMOIZED) ---
  const processedData = useMemo(() => {
    let filtered = [...allFournisseurs];

    if (searchQuery.length > 0) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(fournisseur =>
        (fournisseur.nom && fournisseur.nom.toLowerCase().includes(lowerCaseQuery)) ||
        (fournisseur.numero_BonCommande && fournisseur.numero_BonCommande.toLowerCase().includes(lowerCaseQuery)) ||
        (fournisseur.code_Fournisseur && fournisseur.code_Fournisseur.toLowerCase().includes(lowerCaseQuery)) ||
        (fournisseur.telephone && fournisseur.telephone.toLowerCase().includes(lowerCaseQuery)) ||
        (fournisseur.email && fournisseur.email.toLowerCase().includes(lowerCaseQuery)) ||
        (fournisseur.localisation && fournisseur.localisation.toLowerCase().includes(lowerCaseQuery))
      );
    }

    filtered.sort((a, b) => {
      const aValue = a[sortBy.key] || '';
      const bValue = b[sortBy.key] || '';
      if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allFournisseurs, searchQuery, sortBy]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  // Get unique bon de commande numbers for filter
  const uniqueBonCommandes = useMemo(() => {
    const bonCommandes = [...new Set(allFournisseurs.map(f => f.numero_BonCommande).filter(Boolean))];
    return bonCommandes.sort();
  }, [allFournisseurs]);

  // --- FORM VALIDATION ---
  const validateForm = () => {
    const errors = {};
    
    if (!currentFournisseur?.code_Fournisseur) errors.code_Fournisseur = 'Code fournisseur est obligatoire';
    if (!currentFournisseur?.nom) errors.nom = 'Nom est obligatoire';
    if (!currentFournisseur?.numero_BonCommande) errors.numero_BonCommande = 'Numéro de bon de commande est obligatoire';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- CRUD HANDLERS ---
  const handleAddFournisseur = async () => {
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    try {
      // Préparer les données pour l'API
      const fournisseurData = {
        code_Fournisseur: currentFournisseur.code_Fournisseur.trim(),
        nom: currentFournisseur.nom.trim(),
        telephone: currentFournisseur.telephone?.trim() || '',
        email: currentFournisseur.email?.trim() || '',
        localisation: currentFournisseur.localisation?.trim() || '',
        numero_BonCommande: currentFournisseur.numero_BonCommande.trim()
      };

      await axios.post(`${API_BASE_URL}/fournisseurs`, fournisseurData);
      await fetchFournisseurs();
      closeModal();
      showNotification('Succès: Fournisseur ajouté avec succès.', 'success');
    } catch (error) {
      console.error('Error adding fournisseur:', error);
      
      // Gestion d'erreur plus détaillée
      if (error.response?.status === 400) {
        if (error.response.data?.error?.includes('unique')) {
          showNotification("Erreur: Le code fournisseur ou le numéro de bon de commande existe déjà.", 'error');
        } else {
          showNotification("Erreur: Données invalides. Vérifiez les champs obligatoires.", 'error');
        }
      } else if (error.response?.status === 500) {
        showNotification("Erreur serveur. Veuillez réessayer.", 'error');
      } else {
        showNotification("Erreur: Impossible d'ajouter le fournisseur.", 'error');
      }
    }
  };

  const handleUpdateFournisseur = async () => {
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    try {
      // Préparer les données pour l'API
      const fournisseurData = {
        code_Fournisseur: currentFournisseur.code_Fournisseur.trim(),
        nom: currentFournisseur.nom.trim(),
        telephone: currentFournisseur.telephone?.trim() || '',
        email: currentFournisseur.email?.trim() || '',
        localisation: currentFournisseur.localisation?.trim() || '',
        numero_BonCommande: currentFournisseur.numero_BonCommande.trim()
      };

      await axios.put(`${API_BASE_URL}/fournisseurs/${currentFournisseur.id_fournisseur}`, fournisseurData);
      await fetchFournisseurs();
      closeModal();
      showNotification('Succès: Fournisseur modifié avec succès.', 'success');
    } catch (error) {
      console.error('Error updating fournisseur:', error);
      
      if (error.response?.status === 400) {
        if (error.response.data?.error?.includes('unique')) {
          showNotification("Erreur: Le code fournisseur ou le numéro de bon de commande existe déjà.", 'error');
        } else {
          showNotification("Erreur: Données invalides. Vérifiez les champs obligatoires.", 'error');
        }
      } else {
        showNotification('Erreur: Impossible de modifier le fournisseur.', 'error');
      }
    }
  };

  const handleDeleteFournisseur = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce fournisseur ?")) {
      try {
        await axios.delete(`${API_BASE_URL}/fournisseurs/${id}`);
        await fetchFournisseurs();
        showNotification("Succès: Fournisseur supprimé.", 'success');
      } catch (error) {
        console.error('Error deleting fournisseur:', error);
        
        // Message d'erreur personnalisé selon la contrainte
        if (error.response?.data?.error) {
          if (error.response.data.error.includes('livraison')) {
            showNotification("Erreur: Impossible de supprimer - ce fournisseur est lié à des livraisons.", 'error');
          } else {
            showNotification(`Erreur: ${error.response.data.error}`, 'error');
          }
        } else {
          showNotification("Erreur: Impossible de supprimer le fournisseur.", 'error');
        }
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer TOUS les fournisseurs ? Cette action est irréversible.')) return;
    
    try {
      const deletePromises = allFournisseurs.map(fournisseur => 
        axios.delete(`${API_BASE_URL}/fournisseurs/${fournisseur.id_fournisseur}`)
      );
      
      await Promise.all(deletePromises);
      setAllFournisseurs([]);
      showNotification('Tous les fournisseurs ont été supprimés avec succès.', 'success');
    } catch (error) {
      console.error('Erreur suppression totale:', error);
      
      // Message d'erreur personnalisé pour la suppression en masse
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('livraison')) {
          showNotification("Erreur: Impossible de supprimer tous les fournisseurs - certains sont liés à des livraisons.", 'error');
        } else {
          showNotification(`Erreur: ${error.response.data.error}`, 'error');
        }
      } else {
        showNotification('Erreur lors de la suppression de tous les fournisseurs.', 'error');
      }
    }
  };

  // Authenticated admin (remplace Admin / admin@example.com) — lecture persistante et validation
const [adminProfile, setAdminProfile] = useState(() => {
  try {
    const raw = localStorage.getItem('admin');
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { nom_complet: 'Admin', adresse_email: 'admin@example.com' };
});

// Essayer de valider / rafraîchir le profil côté API si token présent
useEffect(() => {
  async function loadProfile() {
    try {
      // Vérifier immédiatement localStorage pour pré-remplir l'UI
      const raw = localStorage.getItem('admin');
      if (raw) {
        try { setAdminProfile(JSON.parse(raw)) } catch (e) { /* ignore parse */ }
      }

      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Appel de validation / récupération côté serveur
      const resp = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp && resp.data && resp.data.admin) {
        const serverAdmin = resp.data.admin;
        const normalized = {
          nom_complet: serverAdmin.nom_complet || (raw ? JSON.parse(raw).nom_complet : 'Admin'),
          adresse_email: serverAdmin.adresse_email || (raw ? JSON.parse(raw).adresse_email : 'admin@example.com')
        };
        setAdminProfile(normalized);
        // mettre à jour le localStorage pour rester synchronisé
        try { localStorage.setItem('admin', JSON.stringify(normalized)) } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.warn('Impossible de récupérer/valider le profil admin', err);
      // Ne pas effacer localStorage ; conserver l'info locale pour persistance hors ligne
    }
  }
  loadProfile();
}, []);

// --- LOGOUT HANDLER ---
const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('admin');
  navigate('/login');
};

  // --- PDF GENERATION ---
  const generatePdf = () => {
    if (processedData.length === 0) {
      showNotification('Aucune donnée à imprimer.', 'warning');
      return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Liste des Fournisseurs</title>');
    printWindow.document.write(`<style>
      body { font-family: Arial, sans-serif; font-size: 10px; }
      h1 { text-align: center; font-size: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style></head><body>`);
    printWindow.document.write(`<h1>Liste des Fournisseurs - ${new Date().toLocaleDateString('fr-FR')}</h1>`);
    printWindow.document.write('<table><thead><tr><th>Code fournisseur</th><th>Nom</th><th>Numéro de téléphone</th><th>Adresse e-mail</th><th>Localisation</th><th>Numéro de bon de commande</th></tr></thead><tbody>');
    processedData.forEach(fournisseur => {
      printWindow.document.write(`<tr>
        <td>${fournisseur.code_Fournisseur}</td>
        <td>${fournisseur.nom}</td>
        <td>${fournisseur.telephone}</td>
        <td>${fournisseur.email}</td>
        <td>${fournisseur.localisation}</td>
        <td>${fournisseur.numero_BonCommande}</td>
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
    setSortBy({ key: 'nom', direction: 'asc' });
    setCurrentPage(1);
    fetchFournisseurs();
  };

  const openModalForAdd = () => {
    setIsEditing(false);
    setCurrentFournisseur({ 
      code_Fournisseur: '', 
      nom: '', 
      telephone: '', 
      email: '', 
      localisation: '', 
      numero_BonCommande: '' 
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const openModalForEdit = (fournisseur) => {
    setIsEditing(true);
    setCurrentFournisseur({
      id_fournisseur: fournisseur.id_fournisseur,
      code_Fournisseur: fournisseur.code_Fournisseur,
      nom: fournisseur.nom,
      telephone: fournisseur.telephone,
      email: fournisseur.email,
      localisation: fournisseur.localisation,
      numero_BonCommande: fournisseur.numero_BonCommande
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentFournisseur(null);
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setCurrentFournisseur(prev => ({ ...prev, [field]: value }));
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
        <a className="sidebar-item active" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
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
            <FaUserCircle size={32}/>
            <div className="user-info">
              <div className="user-name">{adminProfile.nom_complet}</div>
        <div className="user-email">{adminProfile.adresse_email}</div>            
            </div>
          </div>
          <a className="sidebar-item-deconnect" href="/" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
            <MdLogout/> Déconnexion
          </a>
        </div>
      </aside>

      <main className="main-content">
        <div className="header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft/> Retour
          </button>
          <h1 className="header-title">Gestion des Fournisseurs</h1>
          <div className="header-right">
            {!(isMobile || isTablet) && (
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}
            {(isMobile || isTablet) && (
              <button className="menu-button" onClick={() => setIsSidebarOpen(true)}>
                <FaBars/>
              </button>
            )}
          </div>
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
        </div>

        <div className="content-area">
          <div className="actions-container">
            <div className="action-buttons">
              <button className="add-button" onClick={openModalForAdd}>
                <IoMdAddCircleOutline/> Ajouter
              </button>
              <button className="pdf-button" onClick={generatePdf}>
                <IoDocumentTextOutline/> Imprimer
              </button>
              <button className="delete-all-button" onClick={handleDeleteAll}>
                <FaTrash/> Supprimer tout
              </button>
            </div>
          </div>

          <div className="filters-wrapper">
            <div className="filter-label">Filtres :</div>
            
            {/* Filtre Nom */}
            <div className="dropdown">
              <button className="dropdown-button" onClick={() => setDropdownOpen(dropdownOpen === 'nom' ? null : 'nom')}>
                Nom <FaAngleDown/>
              </button>
              {dropdownOpen === 'nom' && (
                <div className="dropdown-content">
                  <button onClick={() => handleSort('nom')}>
                    Trier par Nom {sortBy.key === 'nom' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              )}
            </div>

            {/* Nouveau filtre Numéro de bon de commande */}
            <div className="dropdown">
              <button className="dropdown-button" onClick={() => setDropdownOpen(dropdownOpen === 'bonCommande' ? null : 'bonCommande')}>
                Numéro de bon de commande <FaAngleDown/>
              </button>
              {dropdownOpen === 'bonCommande' && (
                <div className="dropdown-content">
                  <div className="dropdown-search">
                    <input
                      type="text"
                      placeholder="Rechercher un numéro..."
                      value={bonCommandeSearch}
                      onChange={(e) => setBonCommandeSearch(e.target.value)}
                    />
                  </div>
                  <div className="dropdown-scroll-list">
                    {uniqueBonCommandes.length > 0 ? (
                      uniqueBonCommandes
                        .filter(bon => 
                          bon.toLowerCase().includes(bonCommandeSearch.toLowerCase())
                        )
                        .map((bon, index) => (
                          <button 
                            key={index}
                            onClick={() => {
                              setSearchQuery(bon);
                              setDropdownOpen(null);
                              setBonCommandeSearch('');
                            }}
                          >
                            {bon}
                          </button>
                        ))
                    ) : (
                      <div className="no-data-message">Aucun numéro disponible</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="refresh-button" onClick={handleRefresh}>
              <IoMdRefresh/> Actualiser
            </button>
          </div>

          <div className="table-scroll-container">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('code_Fournisseur')}>
                      Code fournisseur {sortBy.key === 'code_Fournisseur' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('nom')}>
                      Nom {sortBy.key === 'nom' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('telephone')}>
                      Téléphone {sortBy.key === 'telephone' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('email')}>
                      E-mail {sortBy.key === 'email' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('localisation')}>
                      Localisation {sortBy.key === 'localisation' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('numero_BonCommande')}>
                      Numéro de bon de commande {sortBy.key === 'numero_BonCommande' && (sortBy.direction === 'asc' ? '↑' : '↓')}
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
                      <td colSpan="7" className="no-data-cell">Aucune donnée disponible</td>
                    </tr>
                  ) : (
                    paginatedData.map((fournisseur) => (
                      <tr key={fournisseur.id_fournisseur}>
                        <td>{fournisseur.code_Fournisseur}</td>
                        <td>{fournisseur.nom}</td>
                        <td>{fournisseur.telephone}</td>
                        <td>{fournisseur.email}</td>
                        <td>{fournisseur.localisation}</td>
                        <td>{fournisseur.numero_BonCommande}</td>
                        <td className="actions-cell">
                          <button className="action-icon edit" onClick={() => openModalForEdit(fournisseur)}>
                            <FaPencilAlt/>
                          </button>
                          <button className="action-icon delete" onClick={() => handleDeleteFournisseur(fournisseur.id_fournisseur)}>
                            <FaTrash/>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Précédent
              </button>
              <span style={{ padding: '8px 12px', fontSize: '13px' }}>
                Page {currentPage} sur {totalPages}
              </span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(currentPage + 1)}
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
              {isEditing ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              isEditing ? handleUpdateFournisseur() : handleAddFournisseur();
            }}>
              <div>
                <label className="required-field">Code fournisseur</label>
                <input
                  type="text"
                  className={`modal-input ${formErrors.code_Fournisseur ? 'error' : ''}`}
                  value={currentFournisseur?.code_Fournisseur || ''}
                  onChange={(e) => handleInputChange('code_Fournisseur', e.target.value)}
                  placeholder="Ex: FRN001"
                />
                {formErrors.code_Fournisseur && <div className="error-message">{formErrors.code_Fournisseur}</div>}
              </div>
              <div>
                <label className="required-field">Nom</label>
                <input
                  type="text"
                  className={`modal-input ${formErrors.nom ? 'error' : ''}`}
                  value={currentFournisseur?.nom || ''}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  placeholder="Ex: Société ABC"
                />
                {formErrors.nom && <div className="error-message">{formErrors.nom}</div>}
              </div>
              <div>
                <label>Téléphone</label>
                <input
                  type="text"
                  className="modal-input"
                  value={currentFournisseur?.telephone || ''}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  placeholder="Ex: +33 1 23 45 67 89"
                />
              </div>
              <div>
                <label>E-mail</label>
                <input
                  type="email"
                  className="modal-input"
                  value={currentFournisseur?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Ex: contact@example.com"
                />
              </div>
              <div>
                <label>Localisation</label>
                <input
                  type="text"
                  className="modal-input"
                  value={currentFournisseur?.localisation || ''}
                  onChange={(e) => handleInputChange('localisation', e.target.value)}
                  placeholder="Ex: Paris, France"
                />
              </div>
              <div>
                <label className="required-field">Numéro de bon de commande</label>
                <input
                  type="text"
                  className={`modal-input ${formErrors.numero_BonCommande ? 'error' : ''}`}
                  value={currentFournisseur?.numero_BonCommande || ''}
                  onChange={(e) => handleInputChange('numero_BonCommande', e.target.value)}
                  placeholder="Ex: BC2024001"
                />
                {formErrors.numero_BonCommande && <div className="error-message">{formErrors.numero_BonCommande}</div>}
              </div>
              <div className="modal-buttons">
                <button type="button" className="modal-button-cancel" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="modal-button-submit">
                  {isEditing ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
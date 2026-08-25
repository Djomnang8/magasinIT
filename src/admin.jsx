// src/admin/admin.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHome, FaDropbox, FaUserCircle, FaPencilAlt, FaTrash, FaUser,
  FaCubes, FaTruck, FaArchive, FaPlus, FaMinus, FaBars, FaShoppingCart,
  FaChartBar
} from 'react-icons/fa';
import { IoMdAddCircleOutline, IoMdRefresh, IoMdClose } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa6";
import { FaAngleDown } from 'react-icons/fa';

// --- CSS STYLES ---
const componentStyles = `
/* General Layout & Sidebar */
.container-fluid {  display: flex; min-height: 100vh; width: 100vw; background-color: #f4f6f9; font-family: Arial, sans-serif; }
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

/* Main Content Area */
.main-content { padding: 15px 0 15px 15px; flex: 1; display: flex; flex-direction: column; }

/* Header */
.header { 
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    margin-bottom: 20px; 
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
    padding: 6px 12px; 
    border: 1px solid #ddd; 
    border-radius: 18px; 
    font-size: 13px; 
    width: 220px;
}
.back-button { 
    background-color: #f4f4f4; 
    color: #333; 
    padding: 6px 10px; 
    border-radius: 4px; 
    border: 1px solid #ccc; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    gap: 6px; 
    flex-shrink: 0;
    font-size: 13px;
}
.menu-button { display: none; background: none; border: none; color: #333; font-size: 20px; cursor: pointer; padding: 0; margin-right: 12px; }

/* Scrollable Content */
.scroll-content { flex-grow: 1; 
  overflow-y: auto; 
  padding-right: 12px; 
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch; }

/* Stats Container */
.stats-container { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; }
.stat-card { flex: 1; background-color: white; border-radius: 4px; padding: 15px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center; }
.stat-number { font-size: 24px; font-weight: bold; }
.stat-label { font-size: 13px; color: #666; }

/* Actions Container */
.actions-container { 
    display: flex; 
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin-bottom: 20px; 
    gap: 12px;
}
.action-buttons { 
    display: flex; 
    gap: 8px; 
    flex-wrap: wrap;
    order: 1;
}
.add-button, .pdf-button, .delete-all-button { padding: 8px 14px; border-radius: 4px; border: none; cursor: pointer; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
.add-button { background-color: #0070B2; color: white; }
.pdf-button { background-color: #E67E22; color: white; }
.delete-all-button { background-color: #E74C3C; color: white; }
.refresh-button { 
    background-color: #95a5a6; 
    color: black; 
    padding: 8px 14px; 
    border: none; 
    border-radius: 4px; 
    cursor: pointer; 
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 510px;
}
.refresh-button:hover{ 
    background-color: #898c8cff; 
}

/* Filters */
.filters-wrapper { 
    display: flex; 
    gap: 12px; 
    align-items: center; 
    flex-wrap: wrap; 
    order: 2;
}
.filter-label { font-weight: bold; color: #555; font-size: 13px; }
.dropdown { position: relative; display: inline-block; }
.dropdown-button { background-color: #fff; color: #555; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; min-width: 110px; justify-content: space-between; font-size: 13px; }
.dropdown-content { position: absolute; top: 100%; left: 0; background-color: #f9f9f9; min-width: 200px; box-shadow: 0 6px 12px rgba(0,0,0,0.15); z-index: 10; border-radius: 4px; max-height: 200px; overflow-y: auto; }
.dropdown-content a, .dropdown-content button { color: black; padding: 8px 12px; display: block; cursor: pointer; background: none; border: none; width: 100%; text-align: left; font-size: 13px; }
.dropdown-content a:hover, .dropdown-content button:hover { background-color: #ddd; }

/* Table */
.table-container { background-color: white; border-radius: 8px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08); overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; 
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

th:last-child, td:last-child { border-right: none; }
.actions-cell { white-space: nowrap; }
.action-icon { background: none; border: none; cursor: pointer; font-size: 14px; margin-right: 8px; }
.action-icon.edit { color: #3498DB; }
.action-icon.delete { color: #E74C3C; }
.no-data-cell { text-align: center; color: #888; padding: 15px; }
.loading-cell { text-align: center; color: #888; padding: 15px; }

/* Pagination */
.pagination-container { display: flex; justify-content: center; margin-top: 20px; gap: 8px; flex-shrink: 0; }
.pagination-container button { background-color: #689f38; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.pagination-container button:disabled { background-color: #ccc; }

/* Modal */
.modal-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-view { background-color: white; padding: 25px; border-radius: 8px; width: 90%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
.modal-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center; }
.modal-input { width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
.modal-input.error { border-color: #E74C3C; background-color: #ffebee; }
.error-message { color: #E74C3C; font-size: 11px; margin-top: -8px; margin-bottom: 8px; }
.modal-buttons { display: flex; justify-content: flex-end; gap: 12px; margin-top: 15px; }
.modal-button-cancel { background-color: #7f8c8d; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.modal-button-submit { background-color: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }

/* Notification Styles */
.notification { position: fixed; top: 15px; right: 15px; padding: 12px 16px; border-radius: 4px; z-index: 1000; font-weight: bold; max-width: 350px; font-size: 13px; }
.notification.error { background-color: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
.notification.success { background-color: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
.notification.warning { background-color: #fff3e0; color: #ef6c00; border: 1px solid #ffcc80; }

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
    box-shadow: 2px 0 5px rgba(0,0,0,0.5);
  }
  
  .sidebar-overlay.visible {
      display: block;
  }
  
  .sidebar-title { margin-bottom: 15px; width: 100%; }
  .sidebar-item { margin-bottom: 5px; padding: 10px 8px; }
  .sidebar-footer { 
    margin-top: auto; 
    padding-top: 12px; 
    width: 100%;
  }

  .main-content { padding: 12px 12px; } 

  /* Header mobile/tablette */
  .header { 
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    align-items: center;
    margin-bottom: 15px;
  }
  .menu-button { 
      display: block; 
      color: #689f38;
  }
  .back-button { 
      grid-column: 1; 
      grid-row: 1; 
      order: 1; 
  }
  .header-title { 
      font-size: 18px; 
      text-align: center;
      grid-column: 2; 
      grid-row: 1;
      order: 2;
  }
  .header-right { 
      grid-column: 3; 
      grid-row: 1;
      order: 3;
      display: flex;
      align-items: center;
      justify-content: flex-end;
  }
  .search-input-container-mobile {
      width: 100%; 
      grid-column: 1 / span 3;
      grid-row: 2;
      order: 4;
  }
  .search-input { 
      width: 100%; 
      margin: 0;
      padding: 8px 12px;
  }
  
  .stats-container { flex-wrap: wrap; }
  .stat-card { flex: 1 1 45%; padding: 12px; }
  
  .actions-container { flex-direction: column; align-items: flex-start; gap: 12px; }
  .action-buttons { width: 100%; justify-content: flex-start; flex-wrap: wrap; gap: 8px;}
  .filters-wrapper { width: 100%; justify-content: flex-start; flex-wrap: wrap; gap: 8px; }
  .dropdown { min-width: 90px; }
  .refresh-button { margin-left: 0; }
  
  .table-container { overflow-x: auto; }
  table { min-width: 700px; }
}

/* Smartphones (max-width: 767px) */
@media (max-width: 767px) {
  .header { 
    grid-template-columns: auto 1fr auto; 
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
  .search-input-container-mobile {
      grid-column: 1 / span 3;
      grid-row: 2;
      display: block;
      width: 100%;
  }

  .sidebar { 
    width: 80%;
    min-width: 250px;
  }
  .sidebar-item { justify-content: flex-start; }
  
  .main-content { padding: 8px 0 8px 8px; }

  .stats-container { flex-direction: column; gap: 8px; }
  .stat-card { flex: 1 1 100%; }
  
  .action-buttons { flex-direction: row; gap: 6px; justify-content: space-between; }
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
  .dropdown { width: 100%; }
  .refresh-button { width: 100%; }
  
  th, td { padding: 6px 4px; font-size: 11px; }
  
  .modal-view { padding: 15px; margin: 8px; }
  .modal-buttons { flex-direction: column; gap: 8px; }
  .modal-button-cancel, .modal-button-submit { width: 100%; }
  
  .pagination-container { flex-wrap: wrap; gap: 6px; }
  .pagination-container button { padding: 6px 10px; }
}

/* Grands écrans (min-width: 1440px) */
@media (min-width: 1440px) {
  .container-fluid { max-width: 1600px; margin: 0 auto; }
  .sidebar { width: 260px; }
  .main-content { padding: 20px 40px; }
  .header-title { font-size: 28px; }
  .stat-card { padding: 20px; }
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
export default function AdminScreen() {
  const navigate = useNavigate();

  // --- STATES ---
  const [allAdmins, setAllAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [sortBy, setSortBy] = useState({ key: 'nom_complet', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [filterMatricule, setFilterMatricule] = useState(null);
  const [formErrors, setFormErrors] = useState({});

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
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/administrateurs`);
      setAllAdmins(response.data);
    } catch (error) {
      console.error('Error fetching administrateurs:', error);
      showNotification('Erreur: Impossible de charger les données des administrateurs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- DATA PROCESSING (MEMOIZED) ---
  const uniqueMatricules = useMemo(() => {
    return [...new Set(allAdmins.map(a => a.matricule_admin).filter(Boolean))];
  }, [allAdmins]);

  const processedData = useMemo(() => {
    let filtered = [...allAdmins];

    if (searchQuery.length > 0) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(admin =>
        (admin.nom_complet && admin.nom_complet.toLowerCase().includes(lowerCaseQuery)) ||
        (admin.matricule_admin && admin.matricule_admin.toLowerCase().includes(lowerCaseQuery)) ||
        (admin.adresse_email && admin.adresse_email.toLowerCase().includes(lowerCaseQuery))
      );
    }

    if (filterMatricule) {
      filtered = filtered.filter(admin => admin.matricule_admin === filterMatricule);
    }

    filtered.sort((a, b) => {
      const aValue = a[sortBy.key] || '';
      const bValue = b[sortBy.key] || '';
      if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allAdmins, searchQuery, sortBy, filterMatricule]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  // --- FORM VALIDATION ---
  // Lignes ~290-305 - Validation améliorée de l'email
const validateForm = () => {
  const errors = {};
  
  if (!currentAdmin?.matricule_admin) errors.matricule_admin = 'Matricule Administrateur est obligatoire';
  if (!currentAdmin?.nom_complet) errors.nom_complet = 'Nom complet est obligatoire';
  if (!currentAdmin?.mot_de_passe) errors.mot_de_passe = 'Mot de passe est obligatoire';
  
  // NOUVEAU: Validation de l'email uniquement s'il est renseigné
  if (currentAdmin?.adresse_email && currentAdmin.adresse_email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentAdmin.adresse_email)) {
      errors.adresse_email = 'Format d\'email invalide';
    }
  }
  
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};

  // --- CRUD HANDLERS ---
  // Lignes ~308-330 - Préparation des données avec email conditionnel
const handleAddAdmin = async () => {
  if (!validateForm()) {
    showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
    return;
  }

  try {
    // NOUVEAU: Préparer les données pour l'envoi avec email conditionnel
    const adminData = {
      matricule_admin: currentAdmin.matricule_admin,
      nom_complet: currentAdmin.nom_complet,
      adresse_email: currentAdmin.adresse_email && currentAdmin.adresse_email.trim() !== '' 
        ? currentAdmin.adresse_email 
        : null, // Envoyer null si l'email est vide
      numero_tel: currentAdmin.numero_tel || null,
      mot_de_passe: currentAdmin.mot_de_passe
    };

    await axios.post(`${API_BASE_URL}/administrateurs`, adminData);
    await fetchAdmins();
    closeModal();
    showNotification('Succès: Administrateur ajouté avec succès.', 'success');
  } catch (error) {
    console.error('Error adding administrateur:', error);
    // NOUVEAU: Gestion spécifique des erreurs 409 (conflit d'unicité)
    if (error.response?.status === 409) {
      showNotification("Erreur: Le matricule ou l'email (s'il est renseigné) existe déjà.", 'error');
    } else {
      showNotification("Erreur: Impossible d'ajouter l'administrateur.", 'error');
    }
  }
};
  // Lignes ~333-365 - Même logique pour la modification
const handleUpdateAdmin = async () => {
  if (!validateForm()) {
    showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
    return;
  }

  try {
    // NOUVEAU: Préparer les données pour l'envoi avec email conditionnel
    const adminData = {
      matricule_admin: currentAdmin.matricule_admin,
      nom_complet: currentAdmin.nom_complet,
      adresse_email: currentAdmin.adresse_email && currentAdmin.adresse_email.trim() !== '' 
        ? currentAdmin.adresse_email 
        : null, // Envoyer null si l'email est vide
      numero_tel: currentAdmin.numero_tel || null,
      mot_de_passe: currentAdmin.mot_de_passe
    };

    await axios.put(`${API_BASE_URL}/administrateurs/${currentAdmin.id_administrateur}`, adminData);
    await fetchAdmins();
    closeModal();
    showNotification('Succès: Administrateur modifié avec succès.', 'success');
  } catch (error) {
    console.error('Error updating administrateur:', error);
    // NOUVEAU: Gestion spécifique des erreurs 409 (conflit d'unicité)
    if (error.response?.status === 409) {
      showNotification('Erreur: Le matricule ou l\'email (s\'il est renseigné) existe déjà.', 'error');
    } else {
      showNotification('Erreur: Impossible de modifier l\'administrateur.', 'error');
    }
  }
};
  const handleDeleteAdmin = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet administrateur ?")) {
      try {
        await axios.delete(`${API_BASE_URL}/administrateurs/${id}`);
        await fetchAdmins();
        showNotification("Succès: Administrateur supprimé.", 'success');
      } catch (error) {
        console.error('Error deleting administrateur:', error);
        showNotification("Erreur: Impossible de supprimer l'administrateur.", 'error');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer TOUS les administrateurs ? Cette action est irréversible.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/administrateurs`);
      setAllAdmins([]);
      showNotification('Tous les administrateurs ont été supprimés avec succès.', 'success');
    } catch (error) {
      console.error('Erreur suppression totale:', error);
      showNotification('Erreur lors de la suppression de tous les administrateurs.', 'error');
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
  printWindow.document.write('<html><head><title>Liste des Administrateurs</title>');
  printWindow.document.write(`<style>
    body { font-family: Arial, sans-serif; font-size: 10px; }
    h1 { text-align: center; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style></head><body>`);
  printWindow.document.write(`<h1>Liste des Administrateurs - ${new Date().toLocaleDateString('fr-FR')}</h1>`);
  printWindow.document.write('<table><thead><tr><th>Matricule Admin</th><th>Nom complet</th><th>Adresse email</th><th>Numéro de téléphone</th><th>Mot de passe</th></tr></thead><tbody>');
  processedData.forEach(admin => {
    printWindow.document.write(`<tr>
      <td>${admin.matricule_admin}</td>
      <td>${admin.nom_complet}</td>
      <td>${admin.adresse_email || ''}</td>  
      <td>${admin.numero_tel || ''}</td>
      <td>${admin.mot_de_passe}</td>
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
    setSortBy({ key: 'nom_complet', direction: 'asc' });
    setCurrentPage(1);
    fetchAdmins();
  };

  const openModalForAdd = () => {
    setIsEditing(false);
    setCurrentAdmin({ 
      matricule_admin: '', 
      nom_complet: '', 
      adresse_email: '', 
      numero_tel: '', 
      mot_de_passe: '' 
    });
    setFormErrors({});
    setModalVisible(true);
  };

  // Lignes ~450-460 - Récupération correcte de l'email
const openModalForEdit = (admin) => {
  setIsEditing(true);
  setCurrentAdmin({
    id_administrateur: admin.id_administrateur,
    matricule_admin: admin.matricule_admin,
    nom_complet: admin.nom_complet,
    adresse_email: admin.adresse_email || '', // NOUVEAU: Gestion des valeurs null
    numero_tel: admin.numero_tel || '',
    mot_de_passe: admin.mot_de_passe
  });
  setFormErrors({});
  setModalVisible(true);
};

  const closeModal = () => {
    setModalVisible(false);
    setCurrentAdmin(null);
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setCurrentAdmin(prev => ({ ...prev, [field]: value }));
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
        <a className="sidebar-item" href="/stocks" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaCubes/> Stock
        </a>
        <a className="sidebar-item" href="/inventaire" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaChartBar/> Inventaire
        </a>
        <a className="sidebar-item" href="/fournisseurs" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaShoppingCart/> Fournisseur
        </a>
        <a className="sidebar-item" href="/employe" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaUser/> Employés
        </a>
        <a className="sidebar-item active" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
          <FaUser/> Administrateur
        </a>
        
        <div className="sidebar-footer">
          <a className="sidebar-item" href="/">
                      
                    </a>
          <div className="user-profile">
            <FaUserCircle size={35}/>
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
          
          <h1 className="header-title">Gestion des Administrateurs</h1>
          
          <div className={(isMobile || isTablet) ? "search-input-container-mobile" : "header-right"}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Rechercher des administrateurs..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="scroll-content">
          <section className="stats-container">
            <div className="stat-card">
              <div className="stat-number">{allAdmins.length}</div>
              <div className="stat-label">
                {isMobile || isTablet ? 'Admins' : 'Total Administrateurs'}
              </div>
            </div>
          </section>

          <div className="actions-container">
            <div className='action-buttons'>
              <button className="add-button" onClick={openModalForAdd}>
                <IoMdAddCircleOutline size={isMobile ? 14 : 18}/> 
                {isMobile ? 'Ajouter' : 'Ajouter Admin'}
              </button>
              <button className="pdf-button" onClick={generatePdf}>
                <IoDocumentTextOutline size={isMobile ? 14 : 18}/> 
                {isMobile ? 'PDF' : 'Générer PDF'}
              </button>
              {allAdmins.length > 0 && (
                <button className="delete-all-button" onClick={handleDeleteAll}>
                  <FaTrash size={isMobile ? 12 : 14}/> 
                  {isMobile ? 'Tout supp.' : 'Supprimer tout'}
                </button>
              )}
            </div>

            <div className="filters-wrapper">
              <span className="filter-label">Filtres :</span>
              
              <div className="dropdown">
                <button className="dropdown-button" onClick={() => setDropdownOpen(d => d === 'matricule' ? null : 'matricule')}>
                  {filterMatricule || 'Matricule'} <FaAngleDown size={10} />
                </button>
                {dropdownOpen === 'matricule' && (
                  <div className="dropdown-content">
                    <a onClick={() => { setFilterMatricule(null); setDropdownOpen(null); }}>Tous</a>
                    {uniqueMatricules.map(mat => (
                      <a key={mat} onClick={() => { setFilterMatricule(mat); setDropdownOpen(null); }}>{mat}</a>
                    ))}
                  </div>
                )}
              </div>

              <div className="dropdown">
                <button className={`dropdown-button ${sortBy.key === 'nom_complet' ? 'active' : ''}`} onClick={() => handleSort('nom_complet')}>
                  Nom {sortBy.key === 'nom_complet' ? (sortBy.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>

              <button className="refresh-button" onClick={handleRefresh}>
                <IoMdRefresh size={isMobile ? 14 : 18}/> 
                {isMobile ? 'Actualiser' : 'Actualiser'}
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Matricule Administrateur</th>
                  <th>Nom complet</th>
                  <th>Adresse email</th>
                  <th>Numéro de téléphone</th>
                  <th>Mot de passe</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="loading-cell">Chargement des données...</td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data-cell">Aucun administrateur trouvé.</td>
                  </tr>
                ) : (
                  paginatedData.map(admin => (
                    <tr key={admin.id_administrateur}>
                      <td>{admin.matricule_admin}</td>
                      <td>{admin.nom_complet}</td>
                      <td>{admin.adresse_email || ''}</td>
                      <td>{admin.numero_tel}</td>
                      <td>{admin.mot_de_passe}</td>
                      <td className="actions-cell">
                        <button className="action-icon edit" onClick={() => openModalForEdit(admin)} title="Modifier">
                          <FaPencilAlt/>
                        </button>
                        <button className="action-icon delete" onClick={() => handleDeleteAdmin(admin.id_administrateur)} title="Supprimer">
                          <FaTrash/>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Précédent
              </button>
              <span>Page {currentPage} sur {totalPages}</span>
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
              {isEditing ? 'Modifier Administrateur' : 'Ajouter Administrateur'}
            </h2>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Matricule Administrateur <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className={`modal-input ${formErrors.matricule_admin ? 'error' : ''}`}
                placeholder="Matricule Administrateur"
                value={currentAdmin?.matricule_admin || ''}
                onChange={e => handleInputChange('matricule_admin', e.target.value)}
              />
              {formErrors.matricule_admin && <div className="error-message">{formErrors.matricule_admin}</div>}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nom complet <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className={`modal-input ${formErrors.nom_complet ? 'error' : ''}`}
                placeholder="Nom complet"
                value={currentAdmin?.nom_complet || ''}
                onChange={e => handleInputChange('nom_complet', e.target.value)}
              />
              {formErrors.nom_complet && <div className="error-message">{formErrors.nom_complet}</div>}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Adresse email
              </label>
                      
<input 
  type="email" 
  className={`modal-input ${formErrors.adresse_email ? 'error' : ''}`}
  placeholder="Adresse email (optionnel)"  // NOUVEAU: Indication optionnel
  value={currentAdmin?.adresse_email || ''}
  onChange={e => handleInputChange('adresse_email', e.target.value)}
/>
{formErrors.adresse_email && <div className="error-message">{formErrors.adresse_email}</div>}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Numéro de téléphone
              </label>
              <input
                type="tel"
                className="modal-input"
                placeholder="Numéro de téléphone"
                value={currentAdmin?.numero_tel || ''}
                onChange={e => handleInputChange('numero_tel', e.target.value)}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Mot de passe <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="password"
                className={`modal-input ${formErrors.mot_de_passe ? 'error' : ''}`}
                placeholder="Mot de passe"
                value={currentAdmin?.mot_de_passe || ''}
                onChange={e => handleInputChange('mot_de_passe', e.target.value)}
              />
              {formErrors.mot_de_passe && <div className="error-message">{formErrors.mot_de_passe}</div>}
            </div>
            
            <div className="modal-buttons">
              <button className="modal-button-cancel" onClick={closeModal}>
                Annuler
              </button>
              <button 
                className="modal-button-submit" 
                onClick={isEditing ? handleUpdateAdmin : handleAddAdmin}
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
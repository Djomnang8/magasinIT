/* ===================== livraison.jsx (Version corrigée avec astérisques rouges) ===================== */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHome, FaDropbox, FaUser, FaPencilAlt, FaTrash,
  FaCubes, FaTruck, FaChartBar, FaPlus, FaMinus, FaBars, FaShoppingCart,FaUserCircle
} from 'react-icons/fa';
import { IoMdAddCircleOutline, IoMdRefresh, IoMdClose } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa6";
import { FaAngleDown } from 'react-icons/fa';

// --- CSS STYLES --- (AVEC ASTÉRISQUES ROUGES)
const componentStyles = `
/* ===================== livraison.jsx (Version corrigée pour mobile/tablette) ===================== */
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

.sidebar-items:hover { background-color: rgba(255, 255, 255, 0.1); }
.sidebar-items.active {  background-color: rgba(255, 255, 255, 0.2);  font-weight: bold; }
.sidebar-items {  color: #0070B2; margin-top: -5px; margin-left : 5px; display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; text-decoration: none; font-size: 14px; transition: background-color 0.2s; }


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
  height: 100vh;
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
  overflow: hidden;
  padding-right: 12px; 
  display: flex;
  flex-direction: column;
}

/* Stats Container */
.stats-container { 
  display: flex; 
  justify-content: space-between; 
  gap: 20px; 
  margin-bottom: 30px; 
  flex-shrink: 0;
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
  margin-left: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.refresh-button:hover { 
  background-color: #898c8cff; 
}

/* Wrapper pour filtres et bouton actualiser */
.filters-controls-wrapper { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
  flex-shrink: 0;
}

/* Filters */
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
.date-filters-container .filter-row { 
  display: flex; 
  gap: 10px; 
}
.date-filters-container input { 
  width: 100%; 
  padding: 6px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
}
.date-filters-container select { 
  flex: 1; 
  padding: 6px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
}
.date-filters-container button { 
  padding: 8px 12px; 
  background-color: #007bff; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  margin-top: 5px; 
}
.date-filters-container button:hover { 
  background-color: #0056b3; 
}

/* Table */
.table-container { 
  background-color: white; 
  border-radius: 8px; 
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06); 
  overflow: auto;
  display: flex; 
  flex-direction: column; 
  flex: 1; 
  min-height: 0;
  width: 100%;
}

table { 
  width: 100%; 
  border-collapse: collapse; 
}

th, td { 
  padding: 12px; 
  text-align: left; 
  border-bottom: 1px solid #eee; 
  border-right: 1px solid #ddd;
  font-size: 13px; 
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

/* Form View */
.form-view-container { 
  background-color: #fff; 
  border-radius: 10px; 
  padding: 30px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); 
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-title { 
  font-size: 24px; 
  font-weight: bold; 
  text-align: center; 
  margin-bottom: 30px; 
  color: #333; 
  flex-shrink: 0;
}

.form-grid { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 25px; 
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}

.input-group { 
  display: flex; 
  flex-direction: column; 
}

.input-group.full-width { 
  grid-column: 1 / -1; 
}

.input-group label { 
  font-size: 14px; 
  font-weight: 500; 
  margin-bottom: 8px; 
  color: #666; 
}

.required-field::after {
  content: " *";
  color: #E74C3C;
  font-weight: bold;
}

.input-group input, .input-group select { 
  border: 1px solid #ddd; 
  border-radius: 5px; 
  padding: 12px; 
  font-size: 14px; 
  background-color: #f9f9f9; 
  width: 100%; 
  box-sizing: border-box; 
}

.input-group input.error, .input-group select.error { 
  border-color: #E74C3C; 
  background-color: #ffebee; 
}

.error-message { 
  color: #E74C3C; 
  font-size: 12px; 
  margin-top: 5px; 
}

.designation-group { 
  display: flex; 
  gap: 15px; 
}

.designation-group .input-group { 
  flex: 1; 
}

.serial-table { 
  border: 1px solid #ccc; 
  margin-top: 10px; 
}

.serial-table-header { 
  display: flex; 
  background-color: #e0e0e0; 
  font-weight: bold; 
}

.serial-table-header div:first-child { 
  width: 60px; 
  text-align: center; 
  padding: 8px; 
  border-right: 1px solid #ccc; 
}

.serial-table-header div:last-child { 
  flex: 1; 
  padding: 8px; 
}

.serial-table-row { 
  display: flex; 
  align-items: center; 
  border-bottom: 1px solid #eee; 
}

.serial-table-row div:first-child { 
  width: 60px; 
  text-align: center; 
  padding: 8px; 
  border-right: 1px solid #ccc; 
  font-weight: bold; 
}

.serial-table-row input { 
  flex: 1; 
  padding: 8px; 
  border: none; 
  outline: none; 
  background: transparent; 
}

.serial-actions { 
  display: flex; 
  gap: 10px; 
  margin-top: 10px; 
}

.serial-actions button { 
  background-color: #0070B2; 
  padding: 8px; 
  border-radius: 5px; 
  border: none; 
  cursor: pointer; 
  color: white; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

.serial-actions button.remove { 
  background-color: #dc3545; 
}

.form-buttons { 
  display: flex; 
  justify-content: flex-end; 
  gap: 15px; 
  margin-top: 30px; 
  border-top: 1px solid #eee; 
  padding-top: 20px; 
  flex-shrink: 0;
}

.form-buttons button { 
  padding: 12px 25px; 
  border-radius: 5px; 
  border: none; 
  cursor: pointer; 
  font-weight: bold; 
}

.form-button-cancel { 
  background-color: #E74C3C; 
  color: white; 
}

.form-button-submit { 
  background-color: #0070B2; 
  color: white; 
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

/* === CORRECTIONS POUR MOBILE/TABLETTE === */

/* Tablettes (768px - 1023px) */
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
  
  .sidebar-title { 
    margin-bottom: 12px; 
    width: 100%; 
    font-size: 20px; 
  }
  
  .sidebar-item { 
    margin-bottom: 4px; 
    padding: 10px 8px; 
    font-size: 13px; 
  }
  
  .sidebar-footer { 
    margin-top: auto; 
    padding-top: 12px; 
    width: 100%;
  }

  .main-content { 
    padding: 10px 10px; 
    height: 100vh;
  } 

  /* CORRECTION: Icône menu remise à sa place originale */
  .header { 
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .menu-button {
    display: block;
    grid-column: 4;
    grid-row: 1;
    color: #689f38;
    font-size: 20px;
    background: none; border: none; cursor: pointer; padding: 8px;
  }
  
  .back-button { 
    grid-column: 2; /* Déplacé après le menu */
    grid-row: 1; 
    justify-self: start;
    font-size: 12px;
    padding: 6px 8px;
  }
  
  .header-title { 
    font-size: 16px;
    text-align: center;
    grid-column: 1 / span 3; /* Prend toute la largeur */
    grid-row: 2; /* Sur une ligne séparée */
    margin-top: 5px;
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
    grid-column: 1 / span 3;
    grid-row: 3; /* Sur une troisième ligne */
    order: 4;
    margin-top: 5px;
  }
  
  .search-input { 
    width: 100%; 
    margin: 0;
    padding: 6px 10px;
    font-size: 12px;
  }
  
  /* Stats réduites */
  .stats-container { 
    margin-bottom: 15px;
    gap: 10px;
  }
  
  .stat-card { 
    padding: 12px;
  }
  
  .stat-number { 
    font-size: 20px;
  }
  
  .stat-label { 
    font-size: 12px;
  }
  
  /* Actions réduites */
  .actions-container { 
    margin-bottom: 12px;
    gap: 8px;
  }
  
  .action-buttons { 
    width: 100%; 
    justify-content: flex-start; 
    flex-wrap: wrap; 
    gap: 6px;
  }
  
  .add-button, .pdf-button, .delete-all-button { 
    padding: 6px 10px;
    font-size: 12px;
  }

  /* CORRECTION: Filtres en horizontal */
  .filters-controls-wrapper {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .filters-wrapper { 
    width: auto; 
    justify-content: flex-start; 
    flex-wrap: wrap; 
    gap: 6px; 
    flex: 1;
  }
  
  .filter-label { 
    font-size: 12px;
    white-space: nowrap;
  }
  
  .dropdown { 
    min-width: 80px;
  }
  
  .dropdown-button { 
    padding: 6px 8px;
    font-size: 12px;
    min-width: 90px;
  }
  
  .refresh-button { 
    margin-left: 0; 
    padding: 6px 10px;
    font-size: 12px;
    white-space: nowrap;
  }
  
  /* TABLEAU AVEC HAUTEUR AUGMENTÉE */
  .table-container { 
    overflow-x: auto;
    min-height: 50vh;
    flex-grow: 1;
  }
  
  table { 
    min-width: 700px; 
  }
  
  th, td { 
    padding: 8px 6px;
    font-size: 12px;
  }

  .form-view-container {
    padding: 15px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  /* Pagination réduite */
  .pagination-container { 
    margin-top: 12px;
    gap: 6px;
  }
  
  .pagination-container button { 
    padding: 6px 10px;
    font-size: 12px;
  }
}

/* Smartphones (max-width: 767px) */
@media (max-width: 767px) {
  .header { 
    grid-template-columns: auto 1fr auto; 
    gap: 6px;
    margin-bottom: 10px;
  }
  
  /* CORRECTION: Structure header mobile avec menu à gauche */
  .menu-button { 
    grid-column: 4;
    grid-row: 1;
    margin-right: 6px;
    font-size: 16px;
  }
  
  .back-button { 
    grid-column: 2;
    grid-row: 1;
    justify-self: start;
    padding: 5px 7px;
    font-size: 11px;
  }
  
  .header-title { 
    grid-column: 1 / span 3;
    grid-row: 2;
    font-size: 14px;
    margin-top: 3px;
  }
  
  .header-right { 
    grid-column: 3;
    grid-row: 1;
  }
  
  .search-input-container-mobile {
    grid-column: 1 / span 3;
    grid-row: 3;
    margin-top: 3px;
  }

  .search-input { 
    padding: 5px 8px;
    font-size: 11px;
  }

  .sidebar { 
    width: 80%;
    min-width: 250px;
  }
  
  .sidebar-item { 
    justify-content: flex-start; 
  }
  
  .main-content { 
    padding: 8px 8px; 
    height: 100vh;
  }
  
  /* Stats encore plus réduites */
  .stats-container { 
    margin-bottom: 12px;
    gap: 8px;
  }
  
  .stat-card { 
    padding: 10px;
  }
  
  .stat-number { 
    font-size: 18px;
  }
  
  .stat-label { 
    font-size: 11px;
  }
  
  /* Actions encore plus réduites */
  .actions-container { 
    margin-bottom: 10px;
  }
  
  .action-buttons { 
    flex-direction: row; 
    gap: 4px; 
    justify-content: space-between; 
    width: 100%;
  }
  
  .add-button, .pdf-button, .delete-all-button { 
    flex: 1; 
    padding: 5px 8px;
    font-size: 11px;
    justify-content: center;
  }
  
  /* CORRECTION: Filtres en horizontal compact */
  .filters-controls-wrapper {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .filters-wrapper { 
    flex-direction: row;
    align-items: center;
    gap: 4px;
    flex: 1;
    flex-wrap: wrap;
  }
  
  .filter-label { 
    font-size: 11px;
    margin-right: 4px;
  }
  
  .dropdown { 
    width: auto;
    min-width: 70px;
  }
  
  .dropdown-button { 
    padding: 5px 6px;
    font-size: 11px;
    min-width: 80px;
  }
  
  .refresh-button { 
    width: auto;
    padding: 5px 8px;
    font-size: 11px;
  }
  
  /* TABLEAU AVEC HAUTEUR MAXIMISÉE */
  .table-container { 
    min-height: 55vh;
    flex-grow: 1;
  }
  
  th, td { 
    padding: 6px 4px; 
    font-size: 11px; 
  }
  
  .form-view-container { 
    padding: 12px;
    margin: 6px;
  }
  
  .form-buttons { 
    flex-direction: column; 
    gap: 6px;
    margin-top: 20px;
  }
  
  .form-button-cancel, .form-button-submit { 
    width: 100%; 
    padding: 10px 15px;
  }
  
  .pagination-container { 
    flex-wrap: wrap; 
    gap: 4px;
    margin-top: 10px;
  }
  
  .pagination-container button { 
    padding: 5px 8px;
    font-size: 11px;
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
const INITIAL_FORM_STATE = {
  nom_fournisseur: '',
  numero_Bordereau: '',
  date_Reception: '',
  objet: '',
  lot: '',
  nomProduit: '',
  marque: '',
  modele: '',
};
const MONTHS = [
  { name: 'Janvier', value: 1 }, { name: 'Février', value: 2 }, { name: 'Mars', value: 3 },
  { name: 'Avril', value: 4 }, { name: 'Mai', value: 5 }, { name: 'Juin', value: 6 },
  { name: 'Juillet', value: 7 }, { name: 'Août', value: 8 }, { name: 'Septembre', value: 9 },
  { name: 'Octobre', value: 10 }, { name: 'Novembre', value: 11 }, { name: 'Décembre', value: 12 }
];
const endYear = new Date().getFullYear() + 5;
const startYear = 2010;
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return '';
  }
};

// --- MAIN COMPONENT ---
export default function LivraisonScreen() {
  const navigate = useNavigate();

  // --- STATES ---
  const [activeView, setActiveView] = useState('list');
  const [allLivraisons, setAllLivraisons] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLivraison, setCurrentLivraison] = useState(INITIAL_FORM_STATE);
  const [serialRows, setSerialRows] = useState([{ value: '' }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Responsive states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1023 && window.innerWidth > 767);

  // Filter & Sort states
  const [filterFournisseur, setFilterFournisseur] = useState(null);
  const [filterBordereau, setFilterBordereau] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDate, setFilterDate] = useState('');
  // Ajouter ces états avec les autres états (vers la ligne 50)
const [fournisseurSearch, setFournisseurSearch] = useState('');
const [bordereauSearch, setBordereauSearch] = useState('');

  // notifications
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
    fetchLivraisons();
    fetchFournisseurs();
  }, []);

  // Normalization helpers
  const normalizeSerialInputArray = (arr) =>
    arr.map(s => String(s || '').trim()).filter(s => s.length > 0);

  // FETCH functions
  const fetchLivraisons = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/livraisons`);
      const raw = response.data || [];

      const normalized = raw.map(item => {
        const normalizedItem = { ...item };
        
        // Gestion de la désignation
        if (!normalizedItem.designation) {
          const parts = [
            normalizedItem.nomProduit || normalizedItem.designation || '',
            normalizedItem.marque || '',
            normalizedItem.modele || ''
          ].map(s => String(s || '').trim()).filter(Boolean);
          normalizedItem.designation = parts.join(' - ') || (normalizedItem.designation || '');
        }

        // Gestion des numéros de série
        const rawSerie = normalizedItem.numero_Serie;
        let serieParsed = rawSerie;
        if (typeof rawSerie === 'string') {
          try {
            const parsed = JSON.parse(rawSerie);
            if (Array.isArray(parsed)) serieParsed = parsed;
            else serieParsed = String(parsed || rawSerie);
          } catch (e) {
            if (rawSerie.includes(',')) {
              serieParsed = rawSerie.split(',').map(s => s.trim()).filter(Boolean);
            } else {
              serieParsed = rawSerie.trim() === '' ? [] : [rawSerie.trim()];
            }
          }
        } else if (Array.isArray(rawSerie)) {
          serieParsed = rawSerie.map(s => String(s || '').trim()).filter(Boolean);
        } else if (rawSerie == null) {
          serieParsed = [];
        } else {
          serieParsed = [String(rawSerie)];
        }

        normalizedItem.numero_Serie = serieParsed;
        normalizedItem.numero_Serie_array = serieParsed;
        normalizedItem.numero_Serie_display = Array.isArray(serieParsed) ? serieParsed.join(', ') : String(serieParsed);
        
        // Dates
        normalizedItem.date_Reception = normalizedItem.date_Reception || null;
        normalizedItem.date_Creation = normalizedItem.date_Creation || null;
        
        return normalizedItem;
      });

      setAllLivraisons(normalized);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      showNotification('Erreur: Impossible de charger les livraisons.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fournisseurs`);
      setFournisseurs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
      showNotification('Erreur: Impossible de charger les fournisseurs.', 'error');
    }
  };

  // --- FILTERING & SORTING ---
  const filteredLivraisons = useMemo(() => {
  let filtered = [...allLivraisons];

  // Search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      (item.nom_fournisseur || '').toLowerCase().includes(query) ||
      (item.numero_Bordereau || '').toLowerCase().includes(query) ||
      (item.designation || '').toLowerCase().includes(query) ||
      (item.objet || '').toLowerCase().includes(query) ||
      (item.lot || '').toLowerCase().includes(query) ||
      (item.numero_Serie_display || '').toLowerCase().includes(query)
    );
  }

  // Fournisseur filter
  if (filterFournisseur) {
    filtered = filtered.filter(item => item.nom_fournisseur === filterFournisseur);
  }

  // Bordereau filter
  if (filterBordereau) {
    filtered = filtered.filter(item => item.numero_Bordereau === filterBordereau);
  }

  // Date filter (NOUVEAU)
  if (filterDate) {
    filtered = filtered.filter(item => 
      item.date_Reception && 
      String(item.date_Reception).slice(0, 10) === filterDate
    );
  }

  // Month/Year filter
  if (filterMonth || filterYear) {
    filtered = filtered.filter(item => {
      if (!item.date_Reception) return false;
      const date = new Date(item.date_Reception);
      const itemMonth = date.getMonth() + 1;
      const itemYear = date.getFullYear();
      
      if (filterMonth && filterYear) {
        return itemMonth === parseInt(filterMonth) && itemYear === parseInt(filterYear);
      } else if (filterMonth) {
        return itemMonth === parseInt(filterMonth);
      } else if (filterYear) {
        return itemYear === parseInt(filterYear);
      }
      return true;
    });
  }

  // Sort by date
  filtered.sort((a, b) => {
    const dateA = new Date(a.date_Creation || a.date_Reception || 0);
    const dateB = new Date(b.date_Creation || b.date_Reception || 0);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return filtered;
}, [allLivraisons, searchQuery, filterFournisseur, filterBordereau, filterDate, filterMonth, filterYear, sortOrder]);
  // Pagination
  const totalPages = Math.ceil(filteredLivraisons.length / ITEMS_PER_PAGE);
  const paginatedLivraisons = filteredLivraisons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


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
    if (filteredLivraisons.length === 0) {
      showNotification('Aucune donnée à imprimer.', 'warning');
      return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Liste des Livraisons</title>');
    printWindow.document.write(`<style>
      body { font-family: Arial, sans-serif; font-size: 10px; }
      h1 { text-align: center; font-size: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style></head><body>`);
    printWindow.document.write(`<h1>Liste des Livraisons - ${new Date().toLocaleDateString('fr-FR')}</h1>`);
    printWindow.document.write('<table><thead><tr><th>Id</th><th>Fournisseur</th><th>N° Bordereau</th><th>Date Réception</th><th>Objet</th><th>Lot</th><th>Désignation</th><th>N° Série</th></tr></thead><tbody>');
    filteredLivraisons.forEach(item => {
      printWindow.document.write(`<tr>
        <td>${item.id_livraison || ''}</td>
        <td>${item.nom_fournisseur || ''}</td>
        <td>${item.numero_Bordereau || ''}</td>
        <td>${item.date_Reception ? new Date(item.date_Reception).toLocaleDateString('fr-FR') : ''}</td>
        <td>${item.objet || ''}</td>
        <td>${item.lot || ''}</td>
        <td>${item.designation || ''}</td>
        <td>${item.numero_Serie_display || ''}</td>
      </tr>`);
    });
    printWindow.document.write('</tbody></table></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // --- FORM HANDLING ---
  const handleAddNew = () => {
    setCurrentLivraison(INITIAL_FORM_STATE);
    setSerialRows([{ value: '' }]);
    setIsEditing(false);
    setActiveView('form');
    setFormErrors({});
  };

  const handleEdit = (livraison) => {
    const designationParts = (livraison.designation || '').split(' - ');
    const [nomProduit = '', marque = '', modele = ''] = designationParts;

    setCurrentLivraison({
      ...livraison,
      nomProduit: nomProduit.trim(),
      marque: marque.trim(),
      modele: modele.trim(),
    });

    // Gérer les numéros de série
    const serieArray = Array.isArray(livraison.numero_Serie_array) 
      ? livraison.numero_Serie_array 
      : (livraison.numero_Serie_display || '').split(',').map(s => s.trim()).filter(Boolean);
    
    setSerialRows(serieArray.length > 0 
      ? serieArray.map(value => ({ value })) 
      : [{ value: '' }]
    );

    setIsEditing(true);
    setActiveView('form');
    setFormErrors({});
  };

  const handleCancel = () => {
    setActiveView('list');
    setCurrentLivraison(INITIAL_FORM_STATE);
    setSerialRows([{ value: '' }]);
    setIsEditing(false);
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setCurrentLivraison(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSerialChange = (index, value) => {
    const updated = [...serialRows];
    updated[index].value = value;
    setSerialRows(updated);
  };

  const addSerialRow = () => {
    setSerialRows([...serialRows, { value: '' }]);
  };

  const removeSerialRow = (index) => {
    if (serialRows.length > 1) {
      const updated = serialRows.filter((_, i) => i !== index);
      setSerialRows(updated);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!currentLivraison.nom_fournisseur) errors.nom_fournisseur = 'Fournisseur requis';
    if (!currentLivraison.numero_Bordereau) errors.numero_Bordereau = 'Numéro de bordereau requis';
    if (!currentLivraison.date_Reception) errors.date_Reception = 'Date de réception requise';
    if (!currentLivraison.nomProduit) errors.nomProduit = 'Nom du produit requis';

    const validSerials = serialRows.some(row => row.value.trim() !== '');
    if (!validSerials) {
      errors.serials = 'Au moins un numéro de série est requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
      return;
    }

    try {
      const designation = [
        currentLivraison.nomProduit,
        currentLivraison.marque,
        currentLivraison.modele
      ].map(s => String(s || '').trim()).filter(Boolean).join(' - ');

      const numero_Serie_list = serialRows
        .map(row => row.value.trim())
        .filter(value => value !== '');

      const payload = {
        nom_fournisseur: currentLivraison.nom_fournisseur,
        numero_Bordereau: currentLivraison.numero_Bordereau,
        date_Reception: currentLivraison.date_Reception,
        objet: currentLivraison.objet || '',
        lot: currentLivraison.lot || '',
        designation,
        numero_Serie_list
      };

      console.log('📤 Envoi des données:', payload);

      if (isEditing) {
        await axios.put(`${API_BASE_URL}/livraisons/${currentLivraison.id_livraison}`, payload);
        showNotification('Livraison modifiée avec succès!', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/livraisons`, payload);
        showNotification('Livraison ajoutée avec succès!', 'success');
      }

      await fetchLivraisons();
      setActiveView('list');
    } catch (error) {
      console.error('❌ Erreur sauvegarde livraison:', error);
      const message = error.response?.data?.error || 'Erreur lors de la sauvegarde';
      showNotification(`Erreur: ${message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette livraison ?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/livraisons/${id}`);
      showNotification('Livraison supprimée avec succès!', 'success');
      await fetchLivraisons();
    } catch (error) {
      console.error('Erreur suppression livraison:', error);
      const message = error.response?.data?.error || 'Erreur lors de la suppression';
      showNotification(`Erreur: ${message}`, 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer TOUTES les livraisons ? Cette action est irréversible.')) return;

    try {
      for (const livraison of allLivraisons) {
        await axios.delete(`${API_BASE_URL}/livraisons/${livraison.id_livraison}`);
      }
      showNotification('Toutes les livraisons ont été supprimées!', 'success');
      await fetchLivraisons();
    } catch (error) {
      console.error('Erreur suppression totale:', error);
      showNotification('Erreur lors de la suppression totale.', 'error');
    }
  };

  const handleRefresh = () => {
  setSearchQuery('');
  setFilterFournisseur(null);
  setFilterBordereau(null);
  setFilterMonth('');
  setFilterYear('');
  setFilterDate('');
  setSortOrder('desc');
  setCurrentPage(1);
  setFournisseurSearch(''); // ← Ajouter
  setBordereauSearch('');   // ← Ajouter
  fetchLivraisons();
};

  const resetDateFilters = () => {
    setFilterMonth('');
    setFilterYear('');
    setDropdownOpen(null);
    setFournisseurSearch('');
    setBordereauSearch('');
  };

  // --- UI RENDERERS ---
  const renderSidebar = () => (
    <>
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
        <a className="sidebar-items active" onClick={() => (isMobile || isTablet) && setIsSidebarOpen(false)}>
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

      {(isMobile || isTablet) && isSidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </>
  );

  const renderHeader = () => (
    <div className="header">
      {(isMobile || isTablet) && (
        <button className="menu-button" onClick={() => setIsSidebarOpen(true)} title="Menu">
          <FaBars/>
        </button>
      )}
      
      <button className="back-button" onClick={() => navigate('/accueil')}>
        <FaArrowLeft/> Retour
      </button>
      
      <h1 className="header-title">Gestion des Livraisons</h1>
      
      <div className="header-right">
        {(isMobile || isTablet) ? (
          <div className="search-input-container-mobile">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : (
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-number">{allLivraisons.length}</div>
        <div className="stat-label">Total Livraisons</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">
          {[...new Set(allLivraisons.map(l => l.nom_fournisseur))].filter(Boolean).length}
        </div>
        <div className="stat-label">Fournisseurs Uniques</div>
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="actions-container">
      <div className="action-buttons">
        <button className="add-button" onClick={handleAddNew}>
          <IoMdAddCircleOutline/> Ajouter Livraison
        </button>
        <button className="pdf-button" onClick={generatePdf}>
          <IoDocumentTextOutline/> Imprimer PDF
        </button>
        {allLivraisons.length > 0 && (
          <button className="delete-all-button" onClick={handleDeleteAll}>
            <FaTrash/> Supprimer tout
          </button>
        )}
      </div>

      {/* BOUTON ACTUALISER DÉPLACÉ DANS renderFilters */}
    </div>
  );

 const renderFilters = () => (
  // NOUVEAU WRAPPER POUR ALIGNER FILTRES ET BOUTON ACTUALISER
  <div className="filters-controls-wrapper"> 
    <div className="filters-wrapper">
      <div className="filter-label">Filtres :</div>
      
      {/* FILTRE FOURNISSEUR AVEC RECHERCHE AMÉLIORÉE */}
<div className="dropdown">
  <button className="dropdown-button" onClick={() => setDropdownOpen(dropdownOpen === 'fournisseur' ? null : 'fournisseur')}>
    {filterFournisseur || 'Fournisseur'} <FaAngleDown/>
  </button>
  {dropdownOpen === 'fournisseur' && (
    <div className="dropdown-content">
      {/* BARRE DE RECHERCHE FOURNISSEUR */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Rechercher fournisseur..."
          value={fournisseurSearch}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px'
          }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setFournisseurSearch(e.target.value)}
        />
      </div>
      <button onClick={() => { 
        setFilterFournisseur(null); 
        setFournisseurSearch('');
        setDropdownOpen(null); 
      }}>
        Tous
      </button>
      {[...new Set(allLivraisons.map(l => l.nom_fournisseur))]
        .filter(Boolean)
        .filter(f => f.toLowerCase().includes(fournisseurSearch.toLowerCase()))
        .map(f => (
          <button key={f} onClick={() => { 
            setFilterFournisseur(f); 
            setFournisseurSearch('');
            setDropdownOpen(null); 
          }}>
            {f}
          </button>
        ))}
    </div>
  )}
</div>

{/* FILTRE BORDEREAU AVEC RECHERCHE AMÉLIORÉE */}
<div className="dropdown">
  <button className="dropdown-button" onClick={() => setDropdownOpen(dropdownOpen === 'bordereau' ? null : 'bordereau')}>
    {filterBordereau || 'Bordereau'} <FaAngleDown/>
  </button>
  {dropdownOpen === 'bordereau' && (
    <div className="dropdown-content">
      {/* BARRE DE RECHERCHE BORDEREAU */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Rechercher bordereau..."
          value={bordereauSearch}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px'
          }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setBordereauSearch(e.target.value)}
        />
      </div>
      <button onClick={() => { 
        setFilterBordereau(null); 
        setBordereauSearch('');
        setDropdownOpen(null); 
      }}>
        Tous
      </button>
      {[...new Set(allLivraisons.map(l => l.numero_Bordereau))]
        .filter(Boolean)
        .filter(b => b.toLowerCase().includes(bordereauSearch.toLowerCase()))
        .map(b => (
          <button key={b} onClick={() => { 
            setFilterBordereau(b); 
            setBordereauSearch('');
            setDropdownOpen(null); 
          }}>
            {b}
          </button>
        ))}
    </div>
  )}
</div>
     
        
<div className="dropdown">
  <button 
    className={`dropdown-button ${dropdownOpen === 'date' ? 'active' : ''}`}
    onClick={() => setDropdownOpen(o => o === 'date' ? null : 'date')}
  >
    Date <FaAngleDown />
  </button>
  {dropdownOpen === 'date' && (
    <div className="dropdown-content date-filters-container">
      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
      />
      <div className="filter-row">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
        >
          <option value="">Mois</option>
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
        >
          <option value="">Année</option>
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <button onClick={() => { 
        setFilterDate(''); 
        setFilterMonth(''); 
        setFilterYear(''); 
        setDropdownOpen(null); 
      }}>
        Réinitialiser
      </button>
    </div>
  )}
</div>
        
        <div className="dropdown">
          <button className="dropdown-button" onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}>
            Tri: {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'} <FaAngleDown/>
          </button>
        </div>
      </div> {/* FIN DE .filters-wrapper */}
      
      {/* BOUTON ACTUALISER ALIGNÉ AVEC LES FILTRES */}
      <button className="refresh-button" onClick={handleRefresh}>
        <IoMdRefresh/> Actualiser
      </button>

    </div> // FIN DE .filters-controls-wrapper
  );

  const renderTable = () => (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Fournisseur</th>
            <th>N° Bordereau</th>
            <th>Date Réception</th>
            <th>Objet</th>
            <th>Lot</th>
            <th>Désignation</th>
            <th>N° Série</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan="9" className="loading-cell">Chargement des données...</td>
            </tr>
          ) : paginatedLivraisons.length === 0 ? (
            <tr>
              <td colSpan="9" className="no-data-cell">Aucune livraison trouvée</td>
            </tr>
          ) : (
            paginatedLivraisons.map(livraison => (
              <tr key={livraison.id_livraison}>
                <td>{livraison.id_livraison}</td>
                <td>{livraison.nom_fournisseur}</td>
                <td>{livraison.numero_Bordereau}</td>
                <td>{livraison.date_Reception ? new Date(livraison.date_Reception).toLocaleDateString('fr-FR') : ''}</td>
                <td>{livraison.objet || ''}</td>
                <td>{livraison.lot || ''}</td>
                <td>{livraison.designation || ''}</td>
                <td>{livraison.numero_Serie_display || ''}</td>
                <td className="actions-cell">
                  <button className="action-icon edit" onClick={() => handleEdit(livraison)} title="Modifier">
                    <FaPencilAlt/>
                  </button>
                  <button className="action-icon delete" onClick={() => handleDelete(livraison.id_livraison)} title="Supprimer">
                    <FaTrash/>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPagination = () => (
    totalPages > 1 && (
      <div className="pagination-container">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Précédent
        </button>
        <span style={{ margin: '0 10px', alignSelf: 'center' }}>
          Page {currentPage} sur {totalPages}
        </span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Suivant
        </button>
      </div>
    )
  );

  const renderForm = () => (
    <div className="form-view-container">
      <h2 className="form-title">
        {isEditing ? 'Modifier la Livraison' : 'Ajouter une Livraison'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label className="required-field">Fournisseur</label>
            <select
              value={currentLivraison.nom_fournisseur}
              onChange={(e) => handleInputChange('nom_fournisseur', e.target.value)}
              className={formErrors.nom_fournisseur ? 'error' : ''}
            >
              <option value="">Sélectionner un fournisseur</option>
              {fournisseurs.map(f => (
                <option key={f.id_fournisseur} value={f.nom}>
                  {f.nom} - {f.numero_BonCommande}
                </option>
              ))}
            </select>
            {formErrors.nom_fournisseur && <div className="error-message">{formErrors.nom_fournisseur}</div>}
          </div>
          
          <div className="input-group">
            <label className="required-field">Numéro de Bordereau</label>
            <input
              type="text"
              className={formErrors.numero_Bordereau ? 'error' : ''}
              value={currentLivraison.numero_Bordereau || ''}
              onChange={(e) => handleInputChange('numero_Bordereau', e.target.value)}
              placeholder="Numéro de bordereau"
            />
            {formErrors.numero_Bordereau && <div className="error-message">{formErrors.numero_Bordereau}</div>}
          </div>
          
          <div className="input-group">
            <label className="required-field">Date de Réception</label>
            <input
              type="date"
              className={formErrors.date_Reception ? 'error' : ''}
              value={formatDateForInput(currentLivraison.date_Reception)}
              onChange={(e) => handleInputChange('date_Reception', e.target.value)}
            />
            {formErrors.date_Reception && <div className="error-message">{formErrors.date_Reception}</div>}
          </div>
          
          <div className="input-group">
            <label>Objet</label>
            <input
              type="text"
              value={currentLivraison.objet || ''}
              onChange={(e) => handleInputChange('objet', e.target.value)}
              placeholder="Objet"
            />
          </div>
          
          <div className="input-group">
            <label>Lot</label>
            <input
              type="text"
              value={currentLivraison.lot || ''}
              onChange={(e) => handleInputChange('lot', e.target.value)}
              placeholder="Lot"
            />
          </div>
          
          <div className="input-group full-width">
            <label className="required-field">Désignation</label>
            <div className="designation-group">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Nom du produit"
                  value={currentLivraison.nomProduit || ''}
                  onChange={(e) => handleInputChange('nomProduit', e.target.value)}
                  className={formErrors.nomProduit ? 'error' : ''}
                />
                {formErrors.nomProduit && <div className="error-message">{formErrors.nomProduit}</div>}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Marque"
                  value={currentLivraison.marque || ''}
                  onChange={(e) => handleInputChange('marque', e.target.value)}
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Modèle"
                  value={currentLivraison.modele || ''}
                  onChange={(e) => handleInputChange('modele', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="input-group full-width">
            <label className="required-field">Numéros de Série</label>
            <div className="serial-table">
              <div className="serial-table-header">
                <div>#</div>
                <div>Numéro de Série</div>
              </div>
              {serialRows.map((row, index) => (
                <div key={index} className="serial-table-row">
                  <div>{index + 1}</div>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleSerialChange(index, e.target.value)}
                    placeholder="Saisir le numéro de série"
                  />
                </div>
              ))}
            </div>
            {formErrors.serials && <div className="error-message">{formErrors.serials}</div>}
            <div className="serial-actions">
              <button type="button" onClick={addSerialRow}>
                <FaPlus/>
              </button>
              <button type="button" onClick={() => removeSerialRow(serialRows.length - 1)} className="remove">
                <FaMinus/>
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-buttons">
          <button type="button" className="form-button-cancel" onClick={handleCancel}>
            Annuler
          </button>
          <button type="submit" className="form-button-submit">
            {isEditing ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="container-fluid">
      <style>{componentStyles}</style>
      
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {renderSidebar()}

      <main className="main-content">
        {renderHeader()}

        <div className="scroll-content">
          {activeView === 'list' ? (
            <>
              {renderStats()}
              {renderActions()}
              {renderFilters()}
              {renderTable()}
              {renderPagination()}
            </>
          ) : (
            renderForm()
          )}
        </div>
      </main>
    </div>
  );
}
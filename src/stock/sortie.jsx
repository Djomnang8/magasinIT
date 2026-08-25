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
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-item {  
  margin-top: -5px; 
  margin-left: 5px; 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  padding: 12px 8px; 
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

.sidebar-item-deconnect {  
  margin-top: 5px; 
  margin-left: 5px; 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  padding: 12px 8px; 
  border-radius: 6px; 
  margin-bottom: 8px; 
  cursor: pointer; 
  text-decoration: none; 
  color: white; 
  font-size: 14px; 
  transition: background-color 0.2s; 
}

.sidebar-item-deconnect:hover { 
  background-color: rgba(255, 255, 255, 0.1); 
}

.sidebar-item-deconnect.active { 
  background-color: rgba(255, 255, 255, 0.2); 
  font-weight: bold; 
}

.sidebar-footer { 
  padding-top: 10px; 
  margin-left: 5px; 
  margin-top: 10px;  
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
  font-size: 12px; 
  opacity: 0.8; 
}

.main-content { 
  flex: 1; 
  padding: 15px 0 15px 15px; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  height: 100vh;
}

.header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  margin-bottom: 25px; 
  flex-shrink: 0; 
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

.scroll-content { 
  flex: 1; 
  overflow: hidden;
  padding-right: 12px; 
  display: flex;
  flex-direction: column;
}

.stats-container { 
  display: flex; 
  justify-content: space-between; 
  gap: 15px; 
  margin-bottom: 25px; 
  flex-shrink: 0; 
}

.stat-card { 
  flex: 1; 
  background-color: white; 
  border-radius: 4px; 
  padding: 15px; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
  text-align: center; 
}

.stat-number { 
  font-size: 24px; 
  font-weight: bold; 
  color: #333; 
}

.stat-label { 
  font-size: 13px; 
  color: #666; 
}

.actions-container { 
  display: flex; 
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 20px; 
  gap: 12px;
  flex-shrink: 0;
}

.action-buttons { 
  display: flex; 
  gap: 8px; 
  flex-wrap: wrap;
  order: 1;
}

.add-button { 
  background-color: #0070B2; 
  color: white; 
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

.pdf-button { 
  background-color: #E67E22; 
  color: white; 
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

.delete-all-button { 
  background-color: #E74C3C; 
  color: white; 
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
  margin-left: 0;
}

.refresh-button:hover { 
  background-color: #7f8c8d; 
}

.filters-controls-wrapper { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
  flex-shrink: 0;
}

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
  transition: background-color 0.3s, border-color 0.3s; 
}

.dropdown-button.active { 
  background-color: #e9e9e9; 
  border-color: #999; 
}

.dropdown-content { 
  position: absolute; 
  top: calc(100% + 4px); 
  left: 0; 
  background-color: #f9f9f9; 
  min-width: 220px; 
  box-shadow: 0 8px 16px rgba(0,0,0,0.2); 
  z-index: 10; 
  border-radius: 5px; 
  max-height: 250px; 
  overflow-y: auto; 
}

.dropdown-content button { 
  color: black; 
  padding: 10px 15px; 
  display: block; 
  cursor: pointer; 
  background: none; 
  border: none; 
  text-align: left; 
  font-size: 14px; 
  width: 100%; 
}

.dropdown-content button:hover { 
  background-color: #ddd; 
}

.dropdown-search { 
  padding: 8px; 
}

.dropdown-search input { 
  width: 100%; 
  padding: 6px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
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
  box-shadow: 0 3px 8px rgba(0,0,0,0.06); 
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
  display: flex; 
  align-items: center; 
  justify-content: flex-end; 
  gap: 8px; 
}

.action-icon { 
  background: none; 
  border: none; 
  cursor: pointer; 
  font-size: 14px; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  vertical-align: middle; 
  width: 36px; 
  height: 36px; 
  border-radius: 6px; 
}

.action-icon.edit { 
  color: #3498DB; 
}

.action-icon.delete { 
  color: #E74C3C; 
}

.action-icon:hover { 
  background: rgba(0,0,0,0.04); 
}

.no-data-cell { 
  text-align: center; 
  color: #888; 
  padding: 20px; 
}

.pagination-container { 
  display: flex; 
  justify-content: center; 
  margin-top: 15px; 
  gap: 10px; 
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

.input-group label { 
  font-size: 14px; 
  font-weight: 500; 
  margin-bottom: 8px; 
  color: #666; 
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
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
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

.no-print { }
@media print {
  .no-print { display: none !important; }
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
    margin-left: 0;
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
    padding: 12px 12px; 
    height: 100vh;
  } 

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
    font-size: 18px;
    grid-column: 4;
    grid-row: 1;
  }
  
  .back-button { 
    grid-column: 2; 
    grid-row: 1; 
    justify-self: start;
    font-size: 12px;
    padding: 6px 8px;
  }
  
  .header-title { 
    font-size: 18px; 
    text-align: center;
    grid-column: 1 / span 3;
    grid-row: 2;
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
    grid-row: 3;
    margin-top: 5px;
  }
  
  .search-input { 
    width: 100%; 
    margin: 0;
    padding: 8px 12px;
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
  
  .stat-card { 
    padding: 20px; 
  }
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
      setSorties(data);

      const used = new Set();
      data.forEach(item => {
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
      setEmployes(data);
    } catch {
      console.error('Erreur chargement employés');
    }
  }

  async function fetchProduits(excludeUsed = false) {
    try {
      const url = `${API_BASE_URL}/produits${excludeUsed ? '?excludeUsed=true' : ''}`;
      const { data } = await axios.get(url);
      setProduits(data);
    } catch {
      console.error('Erreur chargement produits');
    }
  }

  const uniqueMatricules = useMemo(() => {
    const set = new Set();
    sorties.forEach(s => { if (s.matricule_employe) set.add(s.matricule_employe); });
    return Array.from(set).sort();
  }, [sorties]);

  const processedData = useMemo(() => {
    let list = [...sorties];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        Object.values(s).some(v => String(v ?? '').toLowerCase().includes(q))
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
  
  function printTablePdf() {
    if (!processedData.length) {
      showNotification('Aucune donnée à imprimer.', 'warning');
      return;
    }
    const w = window.open('', '', 'height=600,width=900');
    w.document.write('<html><head><title>Liste des Sorties</title>');
    w.document.write(`
      <style>
        body { ffont-family: Arial, sans-serif; font-size:12px; margin: 20px; }
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
        
        // Formatage amélioré pour la colonne Caractéristique
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
    if (row.id_produit) {
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

        {/* REMPLACER l'ancienne structure par celle-ci : */}

{/* NOUVEAU : Container principal pour actions et filtres */}
<div className="actions-filters-container">
  
  {/* Ligne 1 : Boutons d'actions */}
  <div className="actions-container">
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
  </div>

  {/* Ligne 2 : Filtres et bouton actualiser */}
  <div className="filters-controls-wrapper"> 
    <div className="filters-wrapper">
      <span className="filter-label">Filtres :</span>
      
      {/* Filtre Date */}
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
            <button onClick={() => { setFilterDate(''); setFilterMonth(''); setFilterYear(''); setDropdownOpen(null); }}>
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* Filtre Matricule */}
      <div className="dropdown">
        <button
          className={`dropdown-button ${dropdownOpen === 'matricule' ? 'active' : ''}`}
          onClick={() => setDropdownOpen(o => o === 'matricule' ? null : 'matricule')}
        >
          Matricule <FaAngleDown />
        </button>
        {dropdownOpen === 'matricule' && (
          <div className="dropdown-content">
            <div className="dropdown-search">
              <input
                type="text"
                placeholder="Rechercher…"
                value={filterMatricule}
                onChange={e => setFilterMatricule(e.target.value)}
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
    </div>
    
    <button className="refresh-button" onClick={handleRefresh}>
      <IoMdRefresh /> Actualiser
    </button>
  </div>
</div>

        <div className="table-container">
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
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="no-data-cell">Chargement…</td>
                </tr>
              ) : paginatedData.length ? (
                paginatedData.map(item => {
                  let caractEl = null;
                  try {
                    const parsed = typeof item.caracteristique_sortie === 'string' ? JSON.parse(item.caracteristique_sortie) : item.caracteristique_sortie;
                    const arr = Array.isArray(parsed) ? parsed : [parsed];
                    caractEl = (
                      <div>
                        {arr.map((r, i) => (
                          <div key={i}>
                            <span>désignation: </span><span style={{ fontWeight: 'bold' }}>{r.designation || r.nomProduit || ''}</span>
                            <span>; marque: </span><span style={{ fontWeight: 'bold' }}>{r.marque || ''}</span>
                            <span>; modèle: </span><span style={{ fontWeight: 'bold' }}>{r.modele || ''}</span>
                            <span>; numéroSerie: </span><span style={{ fontWeight: 'bold' }}>{r.numeroSerie || ''}</span>
                          </div>
                        ))}
                      </div>
                    );
                  } catch {
                    caractEl = <span style={{ fontSize: 13 }}>{String(item.caracteristique_sortie || '').replace(/[\[\]{}"]/g, '')}</span>;
                  }

                  return (
                    <tr key={item.id_sortie}>
                      <td>{item.matricule_employe}</td>
                      <td>{item.motif}</td>
                      <td>{item.nomChauffeur || ''}</td>
                      <td>{renderIdProduitCell(item)}</td>
                      <td>{caractEl}</td>
                      <td>{item.dateSortie ? new Date(item.dateSortie).toLocaleString('fr-FR') : ''}</td>
                      <td>{item.dateRetour ? new Date(item.dateRetour).toLocaleDateString('fr-FR') : ''}</td>
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
        {totalPages > 1 && (
          <div className="pagination-container">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Précédent
            </button>
            <span style={{ padding: '8px 12px', fontSize: '13px' }}>{`Page ${currentPage} sur ${totalPages}`}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant
            </button>
          </div>
        )}
      </>
    );
  }

  function renderFormView() {
    return (
      <div className="form-view-container">
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <img src={logo} alt="Eneo Logo" style={{ width: '100px' }} />
        </div>
        <h1 className="form-title">AUTORISATION DE SORTIE D'EQUIPEMENTS INFORMATIQUES</h1>

        <div className="form-grid">
          <div className="input-group">
            <label>
              Matricule <span style={{ color: 'red' }}>*</span>
            </label>
            <div className="dropdown">
              <button
                className="dropdown-button"
                onClick={() => setEmployeDropdownOpen(o => !o)}
                style={{ justifyContent: "space-between" }}
              >
                {exitAuthFormData.matricule || 'Sélectionner…'} <FaAngleDown />
              </button>
              {employeDropdownOpen && (
                <div className="dropdown-content">
                  <div className="dropdown-search">
                    <input
                      type="text"
                      placeholder="Rechercher…"
                      value={employeSearch}
                      onChange={e => setEmployeSearch(e.target.value)}
                    />
                  </div>
                  {employes
                    .filter(emp =>
                      emp.matricule.toLowerCase().includes(employeSearch.toLowerCase()) ||
                      emp.nom_complet.toLowerCase().includes(employeSearch.toLowerCase())
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
            <label>
              Date de sortie <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="date"
              value={exitAuthFormData.exitDate}
              onChange={e => handleExitAuthInputChange('exitDate', e.target.value)}
            />
          </div>

          <div className="input-group no-print">
            <label>ID Produit (sélectionne et remplit une ligne du tableau)</label>
            <div className="dropdown">
              <button className="dropdown-button" onClick={async () => {
                await fetchProduits(true);
                setProduitDropdownOpen(o => !o);
              }}>
                Sélectionner un produit… <FaAngleDown />
              </button>
              {produitDropdownOpen && (
                <div className="dropdown-content">
                  <div className="dropdown-search">
                    <input
                      type="text"
                      placeholder="Rechercher…"
                      value={produitSearch}
                      onChange={e => setProduitSearch(e.target.value)}
                    />
                  </div>
                  {availableProduits.map(prod => (
                    <button key={prod.id_produit} onClick={() => handleProduitSelect(prod)}>
                      {prod.id_produit} - {prod.nomProduit}
                    </button>
                  ))}
                  {!availableProduits.length && (
                    <div style={{ padding: 10, color: '#666' }}>Aucun produit disponible</div>
                  )}
                </div>
              )}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
              Astuce: cliquez sur une ligne du tableau ci-dessous pour y appliquer l'ID Produit.
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ margin: "8px 0" }}>Description du matériel</h3>
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
                      <input
                        type="text"
                        value={row.designation}
                        onChange={e => handleExitAuthRowsChange(idx, "designation", e.target.value)}
                        style={{ width: "100%", border: "none", padding: 6 }}
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: 4 }}>
                      <input
                        type="text"
                        value={row.marque}
                        onChange={e => handleExitAuthRowsChange(idx, "marque", e.target.value)}
                        style={{ width: "100%", border: "none", padding: 6 }}
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: 4 }}>
                      <input
                        type="text"
                        value={row.modele}
                        onChange={e => handleExitAuthRowsChange(idx, "modele", e.target.value)}
                        style={{ width: "100%", border: "none", padding: 6 }}
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: 4 }}>
                      <input
                        type="text"
                        value={row.numeroSerie}
                        onChange={e => handleExitAuthRowsChange(idx, "numeroSerie", e.target.value)}
                        style={{ width: "100%", border: "none", padding: 6 }}
                      />
                    </td>
                    <td className="no-print" style={{ border: "1px solid #ccc", textAlign: "center" }}>
                      <button
                        onClick={e => { e.stopPropagation(); removeRowAndReleaseProductId(idx); }}
                        style={{ backgroundColor: "#E74C3C", color: "#fff", padding: "6px 10px", borderRadius: 5, border: "none" }}
                        title="Supprimer ligne"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10 }}>
              <button
                onClick={handleAddExitAuthRow}
                style={{ backgroundColor: "#0070B2", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", marginRight: 8 }}
                title="Ajouter ligne"
              >
                <FaPlus /> Ajouter ligne
              </button>
              <button
                onClick={handleRemoveExitAuthRow}
                style={{ backgroundColor: "#E74C3C", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none" }}
                title="Supprimer dernière ligne"
              >
                <FaMinus /> Supprimer ligne
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
            className="form-button-submit"
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
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, padding: "20px" }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <img src={logo} alt="Eneo Logo" style={{ width: '100px' }} />
            </div>
            <h1 style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>
              AUTORISATION DE SORTIE D'EQUIPEMENTS INFORMATIQUES
            </h1>
            <div style={{ marginBottom: '10px' }}>
              Nous, soussignés Direction Adjointe des Systèmes d'Informations autorisons :
            </div>
            <div>
              <div>
                <span style={{ fontWeight: 'bold' }}>Mr</span>{" "}
                <span style={{ borderBottom: "1px solid black", minWidth: '150px', display: 'inline-block' }}>
                  {exitAuthFormData.name}
                </span>
                <span style={{ marginLeft: '10px' }}>&lt;</span>
                <span style={{ borderBottom: "1px solid black", minWidth: '150px', display: 'inline-block' }}>
                  {exitAuthFormData.email}
                </span>
                <span>&gt;</span>
                <span style={{ marginLeft: '10px' }}>Matricule :</span>
                <span style={{ borderBottom: "1px solid black", minWidth: '50px', display: 'inline-block' }}>
                  {exitAuthFormData.matricule}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>Direction/Délégation/Société :</span>{" "}
                <span style={{ borderBottom: "1px solid black", minWidth: '400px', display: 'inline-block' }}>
                  {exitAuthFormData.direction}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>Fonction :</span>{" "}
                <span style={{ borderBottom: "1px solid black", minWidth: '150px', display: 'inline-block' }}>
                  {exitAuthFormData.fonction}
                </span>
                <span style={{ marginLeft: '10px' }}>Destination :</span>
                <span style={{ borderBottom: "1px solid black", minWidth: '200px', display: 'inline-block' }}>
                  {exitAuthFormData.destination}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>Motif :</span>{" "}
                <span style={{ borderBottom: "1px solid black", minWidth: '150px', display: 'inline-block' }}>
                  {exitAuthFormData.reason}
                </span>
                <span style={{ marginLeft: '10px' }}>Date de retour :</span>
                <span style={{ borderBottom: "1px solid black", minWidth: '100px', display: 'inline-block' }}>
                  {exitAuthFormData.returnDate}
                </span>
              </div>
              <div style={{ marginTop: '10px' }}>A sortir de l'enceinte</div>
            </div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginTop: '20px' }}>
              DESCRIPTION DU MATERIEL
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr>
                  <th>DESIGNATION</th>
                  <th>MARQUE</th>
                  <th>MODELE</th>
                  <th>NUMERO DE SERIE</th>
                </tr>
              </thead>
              <tbody>
                {exitAuthRows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.designation}</td>
                    <td>{row.marque}</td>
                    <td>{row.modele}</td>
                    <td>{row.numeroSerie}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontWeight: 'bold' }}>ENEO KOUMASSI</span> avec le(s) équipement(s) ci-après désigné(s):
            </div>
            <div>Fait pour servir et valoir ce que de droit.</div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Nom et signature chauffeur </span>
              <span style={{ borderBottom: "1px solid black", minWidth: '200px', display: 'inline-block' }}>
                {exitAuthFormData.chauffeurName}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <div>
                Douala, le <span style={{ borderBottom: "1px solid black" }}>{exitAuthFormData.exitDate}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Pour la DASI</span>
                <div style={{ borderBottom: "1px solid black", minHeight: '20px', marginTop: '5px' }}>
                  {exitAuthFormData.dasiSignatureText}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '50px' }}>
              <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                Partie réservée aux Vigiles
              </span>
              <div style={{ marginTop: '10px' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Date de Sortie réelle </span>
                  <span style={{ borderBottom: "1px solid black", minWidth: '100px', display: 'inline-block' }}></span>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Contrôlé par (Nom et signature)</span>
                  <span style={{ borderBottom: "1px solid black", minWidth: '200px', display: 'inline-block' }}></span>
                </div>
                <div style={{ textAlign: 'center', marginTop: '90px' }}>
                  <img src={logo1} alt="Eneo" style={{ width: '100px' }} />
                </div>
              </div>
            </div>
          </div>
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
        <header className="header">
          {(isMobile || isTablet) && (
            <button className="menu-button" onClick={() => setIsSidebarOpen(true)} title="Menu" style={{ order: isMobile ? 3 : 1 }}>
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
          <h2 className="header-title">Gestion des Sorties</h2>
          <div className={(isMobile || isTablet) ? "search-input-container-mobile" : "header-right"}>
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
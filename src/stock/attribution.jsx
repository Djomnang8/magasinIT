import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHome, FaDropbox, FaUserCircle, FaPencilAlt, FaTrash,
  FaCubes, FaTruck, FaArchive, FaPlus, FaMinus, FaBars, FaShoppingCart,
  FaAngleDown, FaArrowLeft,FaUser,FaChartBar
} from 'react-icons/fa';
import { IoMdAddCircleOutline, IoMdRefresh, IoMdClose } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import logo from '../assets/eneo-Cameroon.jpg';

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
  padding: 0px; 
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
  gap: 15px; 
  margin-bottom: 25px; 
  flex-shrink: 0;
}

.stat-card { 
  flex: 1; 
  background-color: white; 
  border-radius: 4px; 
  padding: 15px; 
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); 
  text-align: center; 
}

.stat-number { font-size: 24px; font-weight: bold; }
.stat-label { font-size: 13px; color: #666; }

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
  border: 1px solid transparent; 
  cursor: pointer; 
  font-size: 13px; 
  font-weight: bold; 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  transition: all 0.2s; 
}

.add-button { background-color: #0070B2; color: white; }
.pdf-button { background-color: #E67E22; color: white; }
.delete-all-button { background-color: #E74C3C; color: white; }
.delete-all-button:hover { border-color: #C0392B; background-color: #c0392b; }

.refresh-button { 
  background-color: #95a5a6; 
  color: black; 
  padding: 8px 15px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  margin-left: 130px;
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

.filter-label { font-weight: bold; color: #555; font-size: 13px; }
.dropdown { position: relative; display: inline-block; z-index: 1200;}
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

.dropdown-content a:hover, .dropdown-content button:hover { background-color: #ddd; }

.dropdown-search { padding: 8px; }
.dropdown-search input { 
  width: 100%; 
  padding: 6px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
  font-size: 12px; 
  box-sizing: border-box;
}

.date-filters-container { 
  padding: 10px; 
  display: flex; 
  flex-direction: column; 
  gap: 10px; 
  
}
  .date-filters-container button { padding: 8px 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; }
.date-filters-container button:hover { background-color: #0056b3; }

.date-filters-container .filter-row { display: flex; gap: 10px; }
.date-filters-container input, .date-filters-container select { 
  width: 100%; 
  padding: 6px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
  font-size: 12px; 
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

table { width: 100%; border-collapse: collapse; }
th, td { 
  padding: 10px; 
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
.action-icon { 
  background: none; 
  border: none; 
  cursor: pointer; 
  font-size: 14px; 
  margin-right: 8px; 
}

.action-icon.edit { color: #3498DB; }
.action-icon.delete { color: #E74C3C; }
.no-data-cell { text-align: center; color: #888; padding: 15px; }
.loading-cell { text-align: center; color: #888; padding: 15px; }

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

.pagination-container button:disabled { background-color: #ccc; }

/* Table scrollbars */
.table-container::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Form View Specifics */
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

.form-buttons { 
  display: flex; 
  justify-content: flex-end; 
  gap: 12px; 
  margin-top: 20px; 
  border-top: 1px solid #eee; 
  padding-top: 20px; 
  flex-shrink: 0;
}

.form-button-cancel, .form-button-submit, .form-button-print { 
  padding: 9px 18px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 13px; 
  font-weight: bold; 
}

.form-button-cancel { background-color: #E74C3C; color: white; }
.form-button-submit { background-color: #0070B2; color: white; }
.form-button-print { background-color: #E67E22; color: white; }

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

/* Overlay for mobile/tablet */
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

/* === MEDIA QUERIES FOR RESPONSIVENESS === */

/* TABLET: restored to original grid layout used previously */
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
  
  .sidebar-overlay.visible { display: block; }
  
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

  /* Header for tablet: grid as before */
  .header { 
    display: grid; 
    grid-template-columns: auto 1fr auto; 
    gap: 8px;
    align-items: center; 
    margin-bottom: 12px;
  }
  
  .menu-button { 
    display: block; 
    grid-column: 3; 
    grid-row: 1; 
    color: #689f38; 
    font-size: 18px; 
  }
  
  .back-button { 
    grid-column: 1; 
    grid-row: 1; 
    justify-self: start;
    font-size: 12px; 
    padding: 6px 8px; 
  }
  
  .header-title { 
    font-size: 16px; 
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
    order: 4; 
    margin-top: 5px;
  }
  
  .search-input { 
    width: 100%; 
    margin: 0; 
    padding: 8px 12px; 
    font-size: 12px; 
  }
  
  .stats-container { 
    flex-wrap: wrap; 
    margin-bottom: 15px;
    gap: 10px;
  }
  
  .stat-card { 
    flex: 1 1 45%; 
    padding: 12px; 
  }
  
  .stat-number { 
    font-size: 20px;
  }
  
  .stat-label { 
    font-size: 12px;
  }
  
  .actions-container { 
    flex-direction: column; 
    align-items: flex-start; 
    gap: 10px;
    margin-bottom: 12px;
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
    margin-left: 0px; 
    padding: 6px 10px; 
    font-size: 12px;
    white-space: nowrap;
  }
  
  .table-container { 
    overflow-x: auto; 
    -webkit-overflow-scrolling: touch;
    min-height: 50vh;
    flex-grow: 1;
  }
  
  table { 
    width: 100%; 
    border-collapse: collapse; 
    display: table;
    table-layout: auto;
    min-width: 700px;
  }
  
  thead { 
    position: sticky; 
    top: 0; 
    background: #fafafa; 
    z-index: 10; 
  }
  
  th, td { 
    padding: 8px 6px; 
    text-align: left; 
    border-bottom: 1px solid #eee; 
    border-right: 1px solid #eee; 
    font-size: 12px; 
    white-space: nowrap;
    overflow: visible;
    text-overflow: unset;
    max-width: none;
  }
  
  .form-view-container {
    padding: 15px;
  }
  
  .pagination-container { 
    margin-top: 12px;
    gap: 6px;
  }
  
  .pagination-container button { 
    padding: 6px 10px;
    font-size: 12px;
  }
}

/* MOBILE: follow tablet pattern but ensure menu button at right on same line */
@media (max-width: 767px) {
  .header { 
    display: grid; 
    grid-template-columns: auto 1fr auto; 
    gap: 6px; 
    margin-bottom: 10px;
    align-items: center;
  }
  
  /* Menu button placed in the right-most column, same line as back-button */
  .menu-button { 
    grid-column: 3;
    grid-row: 1;
    display: block;
    color: #689f38;
    font-size: 16px;
    background: none;
    border: none;
    justify-self: end;
  }
  
  .back-button { 
    grid-column: 1;
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
    text-align: center;
  }
  
  .header-right { 
    grid-column: 3;
    grid-row: 1;
    display: none; /* keep search in its original mobile position below header */
  }
  
  .search-input-container-mobile { 
    grid-column: 1 / span 3; 
    grid-row: 3; 
    display: block; 
    width: 100%; 
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
  
  .stats-container { 
    flex-direction: column; 
    gap: 8px; 
    margin-bottom: 12px;
  }
  
  .stat-card { 
    flex: 1 1 100%; 
    padding: 10px;
  }
  
  .stat-number { 
    font-size: 18px;
  }
  
  .stat-label { 
    font-size: 11px;
  }
  
  .actions-container { 
    margin-bottom: 10px;
  }
  
  .action-buttons { 
    flex-direction: row; 
    gap: 4px; 
    justify-content: space-between; 
  }
  
  .add-button, .pdf-button, .delete-all-button { 
    flex: 1; 
    padding: 5px 8px; 
    font-size: 11px; 
    justify-content: center;
  }
  
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
  
  .form-button-cancel, .form-button-submit, .form-button-print { 
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

function formatCaracteristique(caracteristique) {
  let parsed = [];
  try {
    parsed = typeof caracteristique === 'string'
      ? JSON.parse(caracteristique)
      : caracteristique;
    if (!Array.isArray(parsed)) parsed = [parsed];
  } catch (e) {
    return <span>{String(caracteristique)}</span>;
  }
  return (
    <div>
      {parsed.map((r, idx) => (
        <div key={idx} style={{ padding: "2px 0" }}>
          <span>type: </span><span style={{ fontWeight: 'bold' }}>{r.type || ''}</span>
          <span>; marque: </span><span style={{ fontWeight: 'bold' }}>{r.marque || ''}</span>
          <span>; modèle: </span><span style={{ fontWeight: 'bold' }}>{r.modele || ''}</span>
          <span>; numéro de série: </span><span style={{ fontWeight: 'bold' }}>{r.numeroSerie || ''}</span>
        </div>
      ))}
    </div>
  );
}

function extractIdProduit(caracteristique) {
  let ids = [];
  try {
    const parsed = typeof caracteristique === 'string' ? JSON.parse(caracteristique) : caracteristique;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    ids = arr.map(it => it.id_produit).filter(Boolean);
  } catch (e) {}
  return ids.join(', ');
}

function formatCaracteristiqueAncienMateriel(caracteristique) {
  let r = {};
  try {
    const parsed = typeof caracteristique === 'string'
      ? JSON.parse(caracteristique)
      : caracteristique;
    r = Array.isArray(parsed) ? parsed[0] || {} : parsed || {};
    if (Object.keys(r).length === 0) return <span>N/A</span>;
  } catch (e) {
    return <span>{String(caracteristique)}</span>;
  }
  
  const type = r.type || ''; 
  const marque = r.marque || '';
  const modele = r.modele || '';
  const numSerie = r.numeroSerie || '';

  if (!type && !marque && !modele && !numSerie) return <span>N/A</span>;
  
  return (
    <div style={{ padding: "2px 0" }}>
      {type && <><span>Type: </span><span style={{ fontWeight: 'bold' }}>{type}</span></>}
      {marque && <><span>{type ? '; ' : ''}Marque: </span><span style={{ fontWeight: 'bold' }}>{marque}</span></>}
      {modele && <><span>; Modèle: </span><span style={{ fontWeight: 'bold' }}>{modele}</span></>}
      {numSerie && <><span>; N° Série: </span><span style={{ fontWeight: 'bold' }}>{numSerie}</span></>}
    </div>
  );
}

export default function Attribution() {
  const navigate = useNavigate();
  
  // Notifications
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification({ message: '', type: '', visible: false }), 4000);
  };

  // Main states
  const [activeView, setActiveView] = useState('list');
  const [allAttributions, setAllAttributions] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    matricule_employe: '',
    modeUtilisation: 'INDIVIDUEL',
    identificationUtilisateur: '',
    e_mail: '',
    fonction: '',
    direction: '',
    localisation: '',
    etatMateriel: 'Nouveau',
    nomMachine: '',
    ancienneMachine: 'Non',
    etatAncienneMachine: '',
  });
  const [rows, setRows] = useState([{ type: '', marque: '', modele: '', numeroSerie: '', id_produit: null }]);
  const [rowsAncienneMachine, setRowsAncienneMachine] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  // Used IDs in form session
  const [usedProductIds, setUsedProductIds] = new useState(new Set());
  // Dropdowns
  const [employeSearch, setEmployeSearch] = useState('');
  const [employeDropdownOpen, setEmployeDropdownOpen] = useState(false);
  const [produitSearch, setProduitSearch] = useState('');
  const [produitDropdownOpen, setProduitDropdownOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMatricule, setFilterMatricule] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUtilisation, setFilterUtilisation] = useState('');
  const [filterOldMachine, setFilterOldMachine] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContentRef = useRef();
  
  // Responsive states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1023 && window.innerWidth > 767);

  // Screen size effect
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
      setIsTablet(window.innerWidth <= 1023 && window.innerWidth > 767);
      if (window.innerWidth > 1023) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // API fetchers
  useEffect(() => {
    fetchAttributions();
    fetchEmployes();
    fetchProduits(true);
  }, []);

  async function fetchAttributions() {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/attributions`);
      setAllAttributions(data);
      setCurrentPage(1);
    } catch (error) {
      showNotification('Erreur: impossible de charger les attributions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }
  async function fetchEmployes() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/employes`);
      setEmployes(data);
    } catch (error) {
      showNotification('Erreur: impossible de charger les employés.', 'error');
    }
  }
  async function fetchProduits(excludeUsed = false) {
    try {
      const url = `${API_BASE_URL}/produits${excludeUsed ? '?excludeUsed=true' : ''}`;
      const { data } = await axios.get(url);
      setProduits(data);
    } catch (error) {
      showNotification('Erreur: impossible de charger les produits.', 'error');
    }
  }

  // FILTERING & SORTING helpers
function hasAnyOldFields(item) {
    const caracteristiqueAncien = item.caracteristique_ancien_materiel;
    const etatAncienneMachine = item.etatAncienneMachine;
    
    let hasCaracteristique = false;
    if (caracteristiqueAncien) {
        try {
            const parsed = typeof caracteristiqueAncien === 'string' ? JSON.parse(caracteristiqueAncien) : caracteristiqueAncien;
            const arr = Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
            hasCaracteristique = arr.some(obj => Object.values(obj).some(val => String(val).trim() !== ''));
        } catch (e) {
            hasCaracteristique = String(caracteristiqueAncien).trim() !== '';
        }
    }
    
    const hasEtat = etatAncienneMachine && String(etatAncienneMachine).trim() !== '';
    return hasCaracteristique || hasEtat;
}

  function hasAllOldFieldsEmpty(item) {
    return !hasAnyOldFields(item);
  }

  // --- USEMEMO ---
  const processedData = useMemo(() => {
    let list = [...allAttributions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(q)));
    }
    if (filterDate) {
      list = list.filter(item => new Date(item.date_attribution).toISOString().split('T')[0] === filterDate);
    }
    if (filterMatricule) list = list.filter(item => item.matricule_employe && item.matricule_employe.toLowerCase().includes(filterMatricule.toLowerCase()));
    if (filterMonth) list = list.filter(item => new Date(item.date_attribution).getMonth() + 1 === +filterMonth);
    if (filterYear) list = list.filter(item => new Date(item.date_attribution).getFullYear() === +filterYear);
    if (filterStatus) list = list.filter(item => item.identification_matériel && item.identification_matériel.toLowerCase() === filterStatus.toLowerCase());
    if (filterUtilisation) list = list.filter(item => item.mode_Utilisation && item.mode_Utilisation.toLowerCase() === filterUtilisation.toLowerCase());
    if (filterOldMachine === 'avec') list = list.filter(hasAnyOldFields);
    else if (filterOldMachine === 'sans') list = list.filter(hasAllOldFieldsEmpty);
    list.sort((a, b) => new Date(b.date_attribution) - new Date(a.date_attribution));
    return list;
  }, [allAttributions, searchQuery, filterDate, filterMatricule, filterMonth, filterYear, filterStatus, filterUtilisation, filterOldMachine]);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(start, start + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  const sortedMatricules = useMemo(() => {
    const set = new Set();
    allAttributions.forEach(a => { if (a.matricule_employe) set.add(a.matricule_employe); });
    return Array.from(set).sort();
  }, [allAttributions]);

  const filteredProduits = useMemo(() => {
    return produits.filter(p =>
      String(p.id_produit).toLowerCase().includes(produitSearch.toLowerCase()) ||
      (p.nomProduit || '').toLowerCase().includes(produitSearch.toLowerCase())
    );
  }, [produits, produitSearch]);

  // Form logic
  function switchToAddForm() {
    setIsEditing(false);
    setFormData({
      matricule_employe: '',
      modeUtilisation: 'INDIVIDUEL',
      identificationUtilisateur: '',
      e_mail: '',
      fonction: '',
      direction: '',
      localisation: '',
      etatMateriel: 'Nouveau',
      nomMachine: '',
      ancienneMachine: 'Non',
      etatAncienneMachine: '',
    });
    setRows([{ type: '', marque: '', modele: '', numeroSerie: '', id_produit: null }]);
    setSelectedRowIndex(0);
    setRowsAncienneMachine([]);
    setUsedProductIds(new Set());
    fetchProduits(true);
    setActiveView('form');
    setTimeout(() => {
      scrollContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  function switchToEditForm(attribution) {
    setIsEditing(true);
    let parsedRows = [{ type: '', marque: '', modele: '', numeroSerie: '', id_produit: null }];
    if (attribution.caracteristique) {
      try {
        const parsed = typeof attribution.caracteristique === 'string' ? JSON.parse(attribution.caracteristique) : attribution.caracteristique;
        parsedRows = Array.isArray(parsed)
          ? parsed.map(r => ({
              type: r.type || '',
              marque: r.marque || '',
              modele: r.modele || '',
              numeroSerie: r.numeroSerie || '',
              id_produit: r.id_produit || null
            }))
          : [{ type: '', marque: '', modele: '', numeroSerie: '', id_produit: null }];
      } catch (e) {}
    }
    setFormData({
      id_attribution: attribution.id_attribution,
      matricule_employe: attribution.matricule_employe,
      modeUtilisation: attribution.mode_Utilisation,
      identificationUtilisateur: attribution.nom_employe || '',
      e_mail: attribution.adresse_email || '',
      fonction: attribution.fonction || '',
      direction: attribution.direction || '',
      localisation: attribution.localisation || '',
      etatMateriel: attribution.identification_matériel,
      nomMachine: attribution.nom_Machine,
      ancienneMachine: hasAnyOldFields(attribution) ? 'Oui' : 'Non',
      etatAncienneMachine: attribution.etatAncienneMachine || '',
    });
    setRows(parsedRows);
    setSelectedRowIndex(0);
    
    let parsedAncienne = [];
    if (attribution.caracteristique_ancien_materiel) {
      try {
        const parsed = typeof attribution.caracteristique_ancien_materiel === 'string'
          ? JSON.parse(attribution.caracteristique_ancien_materiel)
          : attribution.caracteristique_ancien_materiel;
        
        parsedAncienne = Array.isArray(parsed)
          ? parsed.map(r => ({
              typeAncienne: r.type || '',
              marqueAncienne: r.marque || '',
              modeleAncienne: r.modele || '',
              numeroSerieAncienne: r.numeroSerie || '',
            }))
          : [];
      } catch (e) {
        console.error("Error parsing old material characteristics:", e);
      }
    }
    setRowsAncienneMachine(parsedAncienne); 

    const initialUsed = new Set();
    parsedRows.forEach(r => { if (r.id_produit) initialUsed.add(r.id_produit); });
    setUsedProductIds(initialUsed);
    fetchProduits(true);
    setActiveView('form');
    setTimeout(() => {
      scrollContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  function handleInputChange(field, value) {
    setFormData({ ...formData, [field]: value });
  }
  function handleEmployeSelect(employe) {
    setFormData({
      ...formData,
      matricule_employe: employe.matricule,
      identificationUtilisateur: employe.nom_complet,
      e_mail: employe.adresse_email,
      fonction: employe.fonction,
      direction: employe.direction,
      localisation: employe.localisation,
    });
    setEmployeDropdownOpen(false);
  }
  const caracteristiqueExistsInRows = (prod) => {
    const t = (prod.nomProduit || prod.nom || '').toString().trim().toLowerCase();
    const m = (prod.marque || '').toString().trim().toLowerCase();
    const mo = (prod.modele || '').toString().trim().toLowerCase();
    const s = (prod.numeroSerie || '').toString().trim().toLowerCase();
    return rows.some(r =>
      (r.type || '').toString().trim().toLowerCase() === t &&
      (r.marque || '').toString().trim().toLowerCase() === m &&
      (r.modele || '').toString().trim().toLowerCase() === mo &&
      (r.numeroSerie || '').toString().trim().toLowerCase() === s
    );
  };
  async function handleProduitSelect(produit) {
    if (caracteristiqueExistsInRows(produit)) {
      showNotification('Les caractéristiques de cet ID produit sont déjà présentes dans le tableau.', 'error');
      setProduitDropdownOpen(false);
      return;
    }
    let indexToFill = selectedRowIndex ?? 0;
    const firstEmptyIndex = rows.findIndex(
      r => !r.type && !r.marque && !r.modele && !r.numeroSerie && !r.id_produit
    );
    if (firstEmptyIndex !== -1) indexToFill = firstEmptyIndex;
    const newRows = [...rows];
    newRows[indexToFill] = {
      ...newRows[indexToFill],
      type: produit.nomProduit || produit.nom || '',
      marque: produit.marque || '',
      modele: produit.modele || '',
      numeroSerie: produit.numeroSerie || '',
      id_produit: produit.id_produit,
    };
    setRows(newRows);
    const nextUsed = new Set(usedProductIds);
    nextUsed.add(produit.id_produit);
    setUsedProductIds(nextUsed);
    setProduitDropdownOpen(false);
  }
  const handleRowsChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };
  const handleRowsAncienneChange = (index, field, value) => {
    const newRows = [...rowsAncienneMachine];
    newRows[index][field] = value;
    setRowsAncienneMachine(newRows);
  };
  const handleAddRow = () => {
    setRows([...rows, { type: '', marque: '', modele: '', numeroSerie: '', id_produit: null }]);
    setSelectedRowIndex(rows.length);
  };
  const removeRowAndReleaseProductId = (index) => {
    const row = rows[index];
    const nextRows = rows.filter((_, i) => i !== index);
    if (row.id_produit) {
      const nextUsed = new Set(usedProductIds);
      nextUsed.delete(row.id_produit);
      setUsedProductIds(nextUsed);
      fetchProduits(true);
    }
    setRows(nextRows.length ? nextRows : [{ type: '', marque: '', modele: '', numeroSerie: '', id_produit: null }]);
    setSelectedRowIndex(Math.max(0, index - 1));
  };
  const handleRemoveRow = () => {
    if (rows.length > 1) {
      removeRowAndReleaseProductId(rows.length - 1);
    }
  };
  const handleAddRowAncienne = () =>
    setRowsAncienneMachine([
      ...rowsAncienneMachine,
      { typeAncienne: '', marqueAncienne: '', modeleAncienne: '', numeroSerieAncienne: '' },
    ]);

  const removeAncienneMachineRowByIndex = (index) => {
      setRowsAncienneMachine(rows => rows.filter((_, i) => i !== index));
  };
  
  const handleRemoveRowAncienne = () =>
    rowsAncienneMachine.length &&
    setRowsAncienneMachine(rowsAncienneMachine.slice(0, -1));

  // SUBMIT
  async function handleSubmit() {
    if (!formData.matricule_employe) {
      showNotification('Veuillez sélectionner un employé.', 'error');
      return;
    }
    if (!rows.some(r => r.id_produit)) {
      showNotification('Veuillez sélectionner au moins un ID Produit et remplir le tableau des équipements.', 'error');
      return;
    }
    const caracteristiquePayload = rows.map(({ type, marque, modele, numeroSerie, id_produit }) => ({
      type, marque, modele, numeroSerie, id_produit: id_produit || null
    }));
    const payload = {
      matricule_employe: formData.matricule_employe,
      mode_Utilisation: formData.modeUtilisation,
      identification_matériel: formData.etatMateriel,
      nom_Machine: formData.nomMachine,
      caracteristique_attribution: caracteristiquePayload,
      caracteristique_ancien_materiel:
        formData.ancienneMachine === 'Oui' && rowsAncienneMachine.length
          ? rowsAncienneMachine.map(r => ({
              type: r.typeAncienne,
              marque: r.marqueAncienne,
              modele: r.modeleAncienne,
              numeroSerie: r.numeroSerieAncienne
            }))
          : null,
      etatAncienneMachine: formData.ancienneMachine === 'Oui' ? formData.etatAncienneMachine : null,
    };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/attributions/${formData.id_attribution}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/attributions`, payload);
      }
      await Promise.all([fetchAttributions(), fetchProduits(true)]);
      setActiveView('list');
      showNotification('Attribution enregistrée avec succès.', 'success');
    } catch (error) {
      showNotification(`Erreur lors de la sauvegarde: ${(error?.response?.data?.error || error?.response?.data?.message || 'Erreur inconnue.')}`, 'error');
      fetchProduits(true);
    }
  }
  async function handleDelete(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer cette attribution ?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/attributions/${id}`);
      await Promise.all([fetchAttributions(), fetchProduits(true)]);
      showNotification('Attribution supprimée avec succès.', 'success');
    } catch (error) {
      showNotification('Erreur lors de la suppression.', 'error');
    }
  }
  async function handleDeleteAll() {
    if (!window.confirm('Voulez-vous vraiment supprimer TOUTES les attributions ? Cette action est irréversible.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/attributions`);
      setAllAttributions([]);
      showNotification('Toutes les attributions ont été supprimées avec succès.', 'success');
      fetchProduits(true);
    } catch (error) {
      showNotification('Erreur lors de la suppression de toutes les attributions.', 'error');
    }
  }

  function formatCaracteristiqueAncienMaterielToHtml(caracteristique) {
    let r = {};
    try {
      const parsed = typeof caracteristique === 'string'
        ? JSON.parse(caracteristique)
        : caracteristique;
      r = Array.isArray(parsed) ? parsed[0] || {} : parsed || {};
      if (Object.keys(r).length === 0) return 'N/A';
    } catch (e) {
      return String(caracteristique || 'N/A');
    }

    const type = r.type || ''; 
    const marque = r.marque || '';
    const modele = r.modele || '';
    const numSerie = r.numeroSerie || '';

    if (!type && !marque && !modele && !numSerie) return 'N/A';

    let html = '<div style="padding: 2px 0;">';
    if (type) html += `<span>Type: <b>${type}</b></span>`;
    if (marque) html += `<span>${type ? '; ' : ''}Marque: <b>${marque}</b></span>`;
    if (modele) html += `<span>; Modèle: <b>${modele}</b></span>`;
    if (numSerie) html += `<span>; N° Série: <b>${numSerie}</b></span>`;
    html += '</div>';

    return html;
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

  function generatePdf() {
    if (!processedData.length) {
      showNotification('Aucune donnée à imprimer.', 'warning');
      return;
    }
    const w = window.open('', '', 'height=600,width=900');
    w.document.write('<html><head><title>Liste des Attributions</title>');
    w.document.write(`
      <style>
        body { font-family: Arial; font-size: 10px; }
        h1 { text-align: center; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
        th { background: #f2f2f2; font-weight: bold; }
      </style>
    </head><body>`);
    w.document.write(`<h1>Liste des Attributions - ${new Date().toLocaleDateString('fr-FR')}</h1>`);
    w.document.write(`
      <table>
        <thead>
          <tr>
            <th>Matricule Employé</th>
            <th>ID Produit</th>
            <th>Mode d'Utilisation</th>
            <th>Identification du matériel</th>
            <th>Nom Machine</th>
            <th>Caractéristique</th>
            <th>Caractéristique Ancien Matériel</th>
            <th>État Ancienne Machine</th>
            <th>Date de création</th>
          </tr>
        </thead>
        <tbody>`);
    processedData.forEach(item => {
      let idProduitHtml = '';
      let caractHtml = '';
      try {
        const parsed = typeof item.caracteristique === 'string' 
          ? JSON.parse(item.caracteristique || '[]')
          : (item.caracteristique || []);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        
        idProduitHtml = arr.map(r => r.id_produit).filter(Boolean).join(', ');
        
        caractHtml = arr.map(r =>
          `<div>
            <span>type: <b>${r.type || ''}</b>; </span>
            <span>marque: <b>${r.marque || ''}</b>; </span>
            <span>modèle: <b>${r.modele || ''}</b>; </span>
            <span>numéro de série: <b>${r.numeroSerie || ''}</b></span>
           </div>`
        ).join('');

      } catch (e) {
        idProduitHtml = 'Erreur';
        caractHtml = String(item.caracteristique || '');
      }

      w.document.write(`
        <tr>
          <td>${item.matricule_employe || ''}</td>
          <td>${idProduitHtml}</td>
          <td>${item.mode_Utilisation || ''}</td>
          <td>${item.identification_matériel || ''}</td>
          <td>${item.nom_Machine || ''}</td>
          <td>${caractHtml}</td>
          <td>${
            item.caracteristique_ancien_materiel
              ? formatCaracteristiqueAncienMaterielToHtml(item.caracteristique_ancien_materiel)
              : ''
          }</td>
          <td>${item.etatAncienneMachine || ''}</td>
          <td>${new Date(item.date_attribution).toLocaleString('fr-FR')}</td>
        </tr>`);
    });
    w.document.write('</tbody></table></body></html>');
    w.document.close();
    w.print();
  }

  const printDocument = (contentRef, title) => {
    const content = contentRef.current || contentRef;
    if (!content) {
      alert('Rien à imprimer');
      return false;
    }
    const html = content.outerHTML || content.innerHTML;
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
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid black !important; padding: 6px !important; font-size: 12px; }
              .cell { border: 1px solid black !important; padding: 6px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${html}
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

  const handlePrint = async () => {
    const printContainer = document.createElement('div');
    printContainer.className = 'print-only-container';
    printContainer.style.display = 'block';

    const headerHtml = `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${logo}" alt="Eneo Logo" style="width: 100px" />
      </div>
      <h1 style="text-align: center; font-weight: bold; font-size: 16px; text-decoration: underline; margin-bottom: 20px;">
        FICHE D'ATTRIBUTION DU MATÉRIEL INFORMATIQUE
      </h1>
    `;

    const semanticsHtml = `
      <div style="margin-bottom: 10px; font-size: 12px;">
        <div><span style="font-weight:bold;">Mode d'utilisation choisi :</span> ${formData.modeUtilisation}</div>
        <div><span style="font-weight:bold;">Identification du matériel :</span> ${formData.etatMateriel}</div>
      </div>
    `;

    const idBlockHtml = `
      <div style="display:flex; flex-direction:column; gap:6px; font-size:12px; margin-top:10px;">
        <div><span style="font-weight:bold;">Identification de l'Utilisateur ou Unité :</span> ${formData.identificationUtilisateur}</div>
        <div><span style="font-weight:bold;">Matricule de l'employé :</span> ${formData.matricule_employe}</div>
        <div><span style="font-weight:bold;">Adresse e-mail :</span> ${formData.e_mail}</div>
        <div><span style="font-weight:bold;">Fonction :</span> ${formData.fonction}</div>
        <div><span style="font-weight:bold;">Direction :</span> ${formData.direction}</div>
        <div><span style="font-weight:bold;">Localisation :</span> ${formData.localisation}</div>
        <div><span style="font-weight:bold;">Nom Machine :</span> ${formData.nomMachine}</div>
      </div>
    `;

    const equipmentRowsHtml = rows.map(r => `
      <tr>
        <td>${r.type || ''}</td>
        <td>${r.marque || ''}</td>
        <td>${r.modele || ''}</td>
        <td>${r.numeroSerie || ''}</td>
      </tr>
    `).join('');

    const equipmentTableHtml = `
      <h2 style="font-size:14px; margin-top:15px;">ÉQUIPEMENTS ATTRIBUÉS</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Marque</th>
            <th>Modèle</th>
            <th>Numéro de Série</th>
          </tr>
        </thead>
        <tbody>
          ${equipmentRowsHtml}
        </tbody>
      </table>
    `;

    let oldBlockHtml = '';
    if (formData.ancienneMachine === 'Oui') {
      const oldRowsHtml = rowsAncienneMachine.map(r => `
        <tr>
          <td>${r.typeAncienne || ''}</td>
          <td>${r.marqueAncienne || ''}</td>
          <td>${r.modeleAncienne || ''}</td>
          <td>${r.numeroSerieAncienne || ''}</td>
        </tr>
      `).join('');
      oldBlockHtml = `
        <h2 style="font-size:14px; margin-top:15px;">ANCIENNE MACHINE</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Marque</th>
              <th>Modèle</th>
              <th>Numéro de Série</th>
            </tr>
          </thead>
          <tbody>
            ${oldRowsHtml || '<tr><td colspan="4"></td></tr>'}
          </tbody>
        </table>
        <div style="margin-top:8px; font-size:12px;">
          <span style="font-weight:bold;">ETAT ANCIENNE MACHINE :</span> ${formData.etatAncienneMachine || ''}
        </div>
      `;
    }

    const footerHtml = `
      <div style="background-color:#f0f8ff; padding:12px; border-left:5px solid #007bff; border-radius:8px; margin-top:15px; font-size:12px;">
        Je reconnais avoir reçu ce jour le matériel désigné ci-dessus. Ce matériel est mis à ma
        disposition pour un usage professionnel. Il est et demeure la propriété d'Eneo, de même que
        son contenu (données, e-mails,...). Je m'engage à respecter la politique d'utilisation des
        postes de travail prescrite par Eneo et à restituer ce matériel à la Direction Adjointe des Systèmes
        d'Information d'Eneo en cas de mutation ou de départ définitif de la société, quel qu'en soit
        le motif.
      </div>

      <div style="display:flex; justify-content:space-between; gap:10px; margin-top:20px; font-size:12px;">
        <div style="flex:1;">
          <div style="font-weight:bold; margin-bottom:4px;">Pour la DSI</div>
          <div class="cell" style="height:70px;"></div>
        </div>
        <div style="flex:1;">
          <div style="font-weight:bold; margin-bottom:4px;">IT Support Supervisor</div>
          <div class="cell" style="height:70px;"></div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; gap:10px; margin-top:20px; font-size:12px;">
        <div style="flex:1;">
          <div style="font-weight:bold; margin-bottom:4px;">Mention "Lu et approuvé"</div>
          <div class="cell" style="height:70px;"></div>
        </div>
        <div style="flex:1;">
          <div style="font-weight:bold; margin-bottom:4px;">Signature et Nom de l'utilisateur</div>
          <div class="cell" style="height:70px;"></div>
        </div>
      </div>
    `;

    printContainer.innerHTML = headerHtml + semanticsHtml + idBlockHtml + equipmentTableHtml + oldBlockHtml + footerHtml;

    const printed = printDocument(printContainer, "FICHE D'ATTRIBUTION");
    if (!printed) return;

    if (!formData.identificationUtilisateur || !formData.e_mail) {
      console.warn("User name and email are required for history logging.");
      return;
    }

    const dataToLog = {
      nom: formData.identificationUtilisateur,
      fonction: formData.fonction,
      direction: formData.direction,
      localisation: formData.localisation,
      email: formData.e_mail,
      type_action: 'attribution',
    };

    try {
      await axios.post(`${API_BASE_URL}/historique`, dataToLog);
    } catch (error) {
      console.error('Error logging to history:', error);
      alert('Erreur: La fiche a été générée, mais l\'enregistrement dans l\'historique a échoué.');
    }
  };

const handleRefresh = async () => {
  setIsLoading(true);
  try {
    setSearchQuery('');
    setFilterDate('');
    setFilterMatricule('');
    setFilterMonth('');
    setFilterYear('');
    setFilterStatus('');
    setFilterUtilisation('');
    setFilterOldMachine('');
    await Promise.all([
      fetchAttributions(),
      fetchProduits(true),
      fetchEmployes()
    ]);
    showNotification("Données rafraîchies avec succès.", "success");
  } catch (error) {
    showNotification("Erreur lors du rafraîchissement des données.", "error");
  } finally {
    setIsLoading(false);
  }
};

  // RENDER LIST
  function renderListView() {
    return (
      <>
        <section className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{allAttributions.length}</div>
            <div className="stat-label">Total Attributions</div>
          </div>
        </section>

        <section className="actions-container">
            <div className="action-buttons">
              <button className="add-button" onClick={switchToAddForm}><IoMdAddCircleOutline /> Ajouter Attribution</button>
              <button className="pdf-button" onClick={generatePdf}>
                <IoDocumentTextOutline /> Imprimer PDF
              </button>
              <button className="delete-all-button" onClick={handleDeleteAll}>
                <FaTrash size={14}/> Tout Supprimer
              </button>
            </div>
             <div className="filters-wrapper">
                <span className="filter-label">Filtrer par:</span>
                <div className="dropdown">
                  <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'date' ? null : 'date')}>Date <FaAngleDown /></button>
                  {dropdownOpen === 'date' && (
                    <div className="dropdown-content date-filters-container">
                      <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                      <div className="filter-row">
                        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                          <option value="">Mois</option>
                          {MONTHS.map(m => (<option key={m.value} value={m.value}>{m.name}</option>))}
                        </select>
                        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                          <option value="">Année</option>
                          {YEARS.map(y => (<option key={y} value={y}>{y}</option>))}
                        </select>
                      </div>
                      <button className="date-filters-container button" onClick={() => { setFilterDate(''); setFilterMonth(''); setFilterYear(''); setDropdownOpen(null); }}>Réinitialiser</button>
                    </div>
                  )}
                </div>
                <div className="dropdown">
                  <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'ancienne' ? null : 'ancienne')}>Ancienne machine <FaAngleDown /></button>
                  {dropdownOpen === 'ancienne' && (
                    <div className="dropdown-content">
                      <button onClick={() => { setFilterOldMachine('avec'); setDropdownOpen(null); }}>Avec ancienne machine</button>
                      <button onClick={() => { setFilterOldMachine('sans'); setDropdownOpen(null); }}>Sans ancienne machine</button>
                      <button onClick={() => { setFilterOldMachine(''); setDropdownOpen(null); }}>Effacer</button>
                    </div>
                  )}
                </div>
                <div className="dropdown">
                  <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'matricule' ? null : 'matricule')}>Matricule <FaAngleDown /></button>
                  {dropdownOpen === 'matricule' && (
                    <div className="dropdown-content">
                      <div className="dropdown-search">
                        <input type="text" placeholder="Rechercher…" value={filterMatricule} onChange={e => setFilterMatricule(e.target.value)} />
                      </div>
                      {sortedMatricules
                        .filter(m => m.toLowerCase().includes(filterMatricule.toLowerCase()))
                        .map(m => (
                          <button key={m} onClick={() => { setFilterMatricule(m); setDropdownOpen(null); }}>{m}</button>
                        ))}
                      <button onClick={() => { setFilterMatricule(''); setDropdownOpen(null); }}>Effacer</button>
                    </div>
                  )}
                </div>
                <div className="dropdown">
                  <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'status' ? null : 'status')}>Status <FaAngleDown /></button>
                  {dropdownOpen === 'status' && (
                    <div className="dropdown-content">
                      <button onClick={() => { setFilterStatus('Nouveau'); setDropdownOpen(null); }}>Nouveau</button>
                      <button onClick={() => { setFilterStatus('Récupération'); setDropdownOpen(null); }}>Récupération</button>
                      <button onClick={() => { setFilterStatus(''); setDropdownOpen(null); }}>Effacer</button>
                    </div>
                  )}
                </div>
                <div className="dropdown">
                  <button className="dropdown-button" onClick={() => setDropdownOpen(o => o === 'utilisation' ? null : 'utilisation')}>Utilisation <FaAngleDown /></button>
                  {dropdownOpen === 'utilisation' && (
                    <div className="dropdown-content">
                      {['INDIVIDUEL', 'UNITÉ', 'PROJET'].map(v => (
                        <button key={v} onClick={() => { setFilterUtilisation(v); setDropdownOpen(null); }}>{v}</button>
                      ))}
                      <button onClick={() => { setFilterUtilisation(''); setDropdownOpen(null); }}>Effacer</button>
                    </div>
                  )}
                </div>
                <button className="refresh-button" onClick={handleRefresh}><IoMdRefresh/> Actualiser</button>
            </div>
        </section>
        
        <section className="table-container">
          <table>
            <thead>
              <tr>
                <th>Matricule Employé</th>
                <th>ID Produit</th>
                <th>Mode d'Utilisation</th>
                <th>Identification du matériel</th>
                <th>Nom Machine</th>
                <th>Caractéristique Attribution</th>
                {filterOldMachine === 'sans' ? false : processedData.some(hasAnyOldFields) && (
                  <>
                    <th>Caractéristique Ancien Matériel</th>
                    <th>État Ancienne Machine</th>
                  </>
                )}
                <th>Date de création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="loading-cell">Chargement…</td>
                </tr>
              ) : paginatedData.length ? (
                paginatedData.map(item => (
                  <tr key={item.id_attribution}>
                    <td>{item.matricule_employe}</td>
                    <td>{extractIdProduit(item.caracteristique_attribution)}</td>
                    <td>{item.mode_Utilisation}</td>
                    <td>{item.identification_matériel}</td>
                    <td>{item.nom_Machine}</td>
                    <td>{formatCaracteristique(item.caracteristique_attribution)}</td>
                    {filterOldMachine === 'sans' ? false : processedData.some(hasAnyOldFields) && (
                      <>
                        <td>{formatCaracteristiqueAncienMateriel(item.caracteristique_ancien_materiel|| '')}</td>
                        <td>{item.etatAncienneMachine || 'N/A'}</td>
                      </>
                    )}
                    <td>{new Date(item.date_attribution).toLocaleString('fr-FR')}</td>
                    <td className="actions-cell">
                      <button className="action-icon edit" onClick={() => switchToEditForm(item)} title="Modifier">
                        <FaPencilAlt />
                      </button>
                      <button className="action-icon delete" onClick={() => handleDelete(item.id_attribution)} title="Supprimer">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="no-data-cell">Aucune donnée trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        
        {totalPages > 1 && (
          <div className="pagination-container">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</button>
            <span>{`Page ${currentPage} sur ${totalPages}`}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Suivant</button>
          </div>
        )}
      </>
    );
  }

  // RENDER FORM
  function renderFormView() {
    return (
    <div ref={scrollContentRef} className="form-view-container">  
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E0E0E0', marginBottom: '15px' }}>
            <img src={logo} alt="Eneo Logo" style={{ width: '80px' }} />
        </div>

        <h1 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px', color: '#333' }}>
            FICHE D'ATTRIBUTION DU MATÉRIEL INFORMATIQUE
        </h1>

        {/* Mode d'utilisation */}
        <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>
            Mode d'utilisation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '8px' }}>
            {['INDIVIDUEL', 'UNITÉ', 'PROJET'].map((m) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', marginRight: '15px', cursor: 'pointer' }}
                onClick={() => handleInputChange('modeUtilisation', m)} >
                <div style={{ height: '18px', width: '18px', borderRadius: '50%', border: '2px solid #007bff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}>
                    {formData.modeUtilisation === m && <div style={{ height: '9px', width: '9px', borderRadius: '50%', backgroundColor: '#007bff' }} />}
                </div>
                <span style={{ fontSize: '13px', color: '#333' }}>{m}</span>
                </div>
            ))}
            </div>
        </div>

        {/* Matricule & Identification */}
        <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>
            Matricule de l'employé <span style={{ color: 'red' }}>*</span>
            </label>
            <div className="dropdown">
            <button type="button" className="dropdown-button" onClick={() => setEmployeDropdownOpen(o => !o)}>
                {formData.matricule_employe || 'Sélectionner un employé…'} <FaAngleDown />
            </button>
            {employeDropdownOpen && (
                <div className="dropdown-content">
                <div className="dropdown-search">
                    <input type="text" placeholder="Rechercher…" value={employeSearch} onChange={e => setEmployeSearch(e.target.value)} />
                </div>
                {employes
                    .filter(emp =>
                    emp.matricule.toLowerCase().includes(employeSearch.toLowerCase()) ||
                    emp.nom_complet.toLowerCase().includes(employeSearch.toLowerCase())
                    )
                    .map(emp => (
                    <button type="button" key={emp.matricule} onClick={() => handleEmployeSelect(emp)}>
                        {emp.matricule} - {emp.nom_complet}
                    </button>
                    ))}
                </div>
            )}
            </div>
        </div>

        {/* Auto-filled fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>Identification Utilisateur</label>
                <input type="text" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f0f0f0'}} value={formData.identificationUtilisateur} readOnly />
            </div>
            <div>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>Adresse e-mail</label>
                <input type="email" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f0f0f0'}} value={formData.e_mail} readOnly />
            </div>
            <div>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>Fonction</label>
                <input type="text" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f0f0f0'}} value={formData.fonction} readOnly />
            </div>
             <div>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>Direction</label>
                <input type="text" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f0f0f0'}} value={formData.direction} readOnly />
            </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>Localisation</label>
            <input type="text" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f0f0f0'}} value={formData.localisation} readOnly />
        </div>


        {/* Matériel */}
        <div style={{ marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>
            Identification du matériel
            </h3>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '8px' }}>
            {['Nouveau', 'Récupération'].map((m) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', marginRight: '15px', cursor: 'pointer' }} onClick={() => handleInputChange('etatMateriel', m)} >
                    <div style={{ height: '18px', width: '18px', borderRadius: '50%', border: '2px solid #007bff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}>
                        {formData.etatMateriel === m && <div style={{ height: '9px', width: '9px', borderRadius: '50%', backgroundColor: '#007bff' }} />}
                    </div>
                    <span style={{ fontSize: '13px', color: '#333' }}>{m}</span>
                </div>
            ))}
            </div>
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>Nom Machine</label>
                <input type="text" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px'}} value={formData.nomMachine} onChange={(e) => handleInputChange('nomMachine', e.target.value)} />
            </div>

            <div className="no-print" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>ID Produit <span style={{ color: 'red' }}>*</span></label>
                <div className="dropdown">
                <button type="button" className="dropdown-button" onClick={async () => { await fetchProduits(true); setProduitDropdownOpen(o => !o); }}>
                    {'Sélectionner un produit…'} <FaAngleDown />
                </button>
                {produitDropdownOpen && (
                    <div className="dropdown-content">
                    <div className="dropdown-search">
                        <input type="text" placeholder="Rechercher…" value={produitSearch} onChange={e => setProduitSearch(e.target.value)} />
                    </div>
                    {filteredProduits.map(prod => (
                        <button type="button" key={prod.id_produit} onClick={() => handleProduitSelect(prod)}>
                        {prod.id_produit} - {prod.nomProduit}
                        </button>
                    ))}
                    {!filteredProduits.length && (<div style={{ padding: 10, color: '#666', fontSize: '12px' }}>Aucun produit disponible</div>)}
                    </div>
                )}
                </div>
            </div>
        </div>

        {/* Équipements table */}
        <div style={{ marginBottom: '15px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>ÉQUIPEMENTS ATTRIBUÉS</h2>
            <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Type</th><th>Marque</th><th>Modèle</th><th>Numéro de Série</th>
                        <th className="no-print">Action</th>
                    </tr>
                </thead>
                <tbody>
                {rows.map((row, idx) => (
                    <tr key={idx} onClick={() => setSelectedRowIndex(idx)} style={{backgroundColor: selectedRowIndex === idx ? '#e8f5e9' : 'transparent'}}>
                    <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'transparent' }} value={row.type} onChange={(e) => handleRowsChange(idx, 'type', e.target.value)} /></td>
                    <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'transparent' }} value={row.marque} onChange={(e) => handleRowsChange(idx, 'marque', e.target.value)} /></td>
                    <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'transparent' }} value={row.modele} onChange={(e) => handleRowsChange(idx, 'modele', e.target.value)} /></td>
                    <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'transparent' }} value={row.numeroSerie} onChange={(e) => handleRowsChange(idx, 'numeroSerie', e.target.value)} /></td>
                    <td className="no-print" style={{ textAlign: 'center' }}>
                        <button type="button" style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); removeRowAndReleaseProductId(idx); }} title="Supprimer ligne"><FaTrash /></button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="button" style={{ backgroundColor: '#28a745', padding: '8px', borderRadius: '4px', border: 'none', color: '#fff', display: 'flex', alignItems: 'center' }} onClick={handleAddRow} title="Ajouter ligne"><FaPlus size={14} />Ajouter ligne</button>
            <button type="button" style={{ backgroundColor: '#E74C3C', padding: '8px', borderRadius: '4px', border: 'none', color: '#fff', display: 'flex', alignItems: 'center' }} onClick={handleRemoveRow} title="Supprimer dernière ligne"><FaMinus size={14} />Supprimer ligne</button>
            </div>
        </div>

        {/* Ancienne machine */}
        <div style={{ marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>Ancienne machine</h3>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '8px' }}>
            {['Oui', 'Non'].map((option) => (
                <div key={option} style={{ display: 'flex', alignItems: 'center', marginRight: '15px', cursor: 'pointer' }} onClick={() => handleInputChange('ancienneMachine', option)}>
                    <div style={{ height: '18px', width: '18px', borderRadius: '50%', border: '2px solid #007bff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}>
                        {formData.ancienneMachine === option && <div style={{ height: '9px', width: '9px', borderRadius: '50%', backgroundColor: '#007bff' }} />}
                    </div>
                    <span style={{ fontSize: '13px', color: '#333' }}>{option}</span>
                </div>
            ))}
            </div>

            {formData.ancienneMachine === 'Oui' && (
            <>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Type</th><th>Marque</th><th>Modèle</th><th>Numéro de Série</th><th className="no-print">Action</th></tr></thead>
                        <tbody>
                        {rowsAncienneMachine.map((row, idx) => (
                            <tr key={idx} style={{backgroundColor: selectedRowIndex === idx ? '#e8f5e9' : 'transparent'}}>
                                <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', backgroundColor: 'transparent' }} value={row.typeAncienne} onChange={(e) => handleRowsAncienneChange(idx, 'typeAncienne', e.target.value)} /></td>
                                <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', backgroundColor: 'transparent' }} value={row.marqueAncienne} onChange={(e) => handleRowsAncienneChange(idx, 'marqueAncienne', e.target.value)} /></td>
                                <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', backgroundColor: 'transparent' }} value={row.modeleAncienne} onChange={(e) => handleRowsAncienneChange(idx, 'modeleAncienne', e.target.value)} /></td>
                                <td><input type="text" style={{ border: 'none', padding: '6px', fontSize: '12px', width: '100%', backgroundColor: 'transparent' }} value={row.numeroSerieAncienne} onChange={(e) => handleRowsAncienneChange(idx, 'numeroSerieAncienne', e.target.value)} /></td>
                                <td className="no-print" style={{ textAlign: 'center' }}><button type="button" style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer' }} onClick={() => removeAncienneMachineRowByIndex(idx)} title="Supprimer ligne"><FaTrash /></button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" style={{ backgroundColor: '#0070B2', padding: '8px', borderRadius: '4px', border: 'none', color: '#fff', display: 'flex', alignItems: 'center' }} onClick={handleAddRowAncienne} title="Ajouter ligne"><FaPlus size={14} />Ajouter ligne</button>
                    <button type="button" style={{ backgroundColor: '#E74C3C', padding: '8px', borderRadius: '4px', border: 'none', color: '#fff', display: 'flex', alignItems: 'center' }} onClick={handleRemoveRowAncienne} title="Supprimer dernière ligne"><FaMinus size={14} />Supprimer ligne</button>
                </div>
                <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#666' }}>État de l'ancienne machine</label>
                    <select style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', fontSize: '13px', width: '100%' }} value={formData.etatAncienneMachine} onChange={(e) => handleInputChange('etatAncienneMachine', e.target.value)}>
                        <option value="">Sélectionner un état</option>
                        {['Bon état', 'Cassé', 'En panne'].map(etat => (<option key={etat} value={etat}>{etat}</option>))}
                    </select>
                </div>
            </>
            )}
        </div>

        <div className="form-buttons">
            <button type="button" className="form-button-cancel" onClick={() => setActiveView('list')}>Annuler</button>
            <button type="button" className="form-button-submit" onClick={handleSubmit}>{isEditing ? 'Mettre à jour' : 'Sauvegarder'}</button>
            <button type="button" className="form-button-print" onClick={handlePrint}>Imprimer la fiche</button>
        </div>
    </div>
    );
  }

  return (
    <div className="container-fluid">
      <style>{componentStyles}</style>
      {notification.visible && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}
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
            <button className="menu-button" onClick={() => setIsSidebarOpen(true)} title="Menu"><FaBars/></button>
          )}
          
          <button className="back-button" onClick={() => activeView === 'form' ? setActiveView('list') : navigate('/action')}>
            <FaArrowLeft/> Retour
          </button>
          
          <h1 className="header-title">Gestion des Attributions</h1>
          
          <div className={(isMobile || isTablet) ? "search-input-container-mobile" : "header-right"}>
            <input 
              type="text" 
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
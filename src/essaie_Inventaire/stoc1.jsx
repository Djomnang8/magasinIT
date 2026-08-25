// src/stock/StocksScreen.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  FaHome, FaDropbox, FaUserCircle, FaPencilAlt, FaTrash, FaUser,
  FaTruck, FaChartBar, FaPlus, FaMinus, FaBars, FaCubes, FaShoppingCart
} from 'react-icons/fa'
import {
  IoMdAddCircleOutline, IoMdRefresh, IoMdClose
} from 'react-icons/io'
import { IoDocumentTextOutline } from 'react-icons/io5'
import { MdLogout } from 'react-icons/md'
import { FaArrowLeft, FaAngleDown } from 'react-icons/fa6'

const componentStyles = `
/* StocksScreen.css - updated to match livraison.jsx layout and mobile header (image2) */

/* Scale and root variables */
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
  padding: 20px;
  overflow: hidden;
  max-height: 100vh;
}

/* HEADER (desktop) */
.header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 16px;
  margin-bottom:20px;
  flex-shrink:0;
}
.header-title {
  font-size:28px;
  font-weight:700;
  color:#333;
  flex-grow:1;
  text-align:center;
}
.header-right { display:flex; align-items:center; gap:12px; }

/* Search and buttons */
.search-input {
  padding:8px 14px;
  border:1px solid #ddd;
  border-radius:20px;
  font-size:14px;
  width:260px;
  background: #fff;
}
.back-button {
  background: #f4f4f4;
  color:#333;
  padding:8px 12px;
  border-radius:6px;
  border:1px solid #ddd;
  display:flex; align-items:center; gap:8px; cursor:pointer;
}

/* Notification */
.notification-button {
  background:none; border: none; cursor:pointer; padding:8px; border-radius:50%;
  position:relative; transition: all .2s;
}
.notification-button.alert { animation: pulse 2s infinite; color: var(--danger-red); }
@keyframes pulse { 0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)} }
.notification-badge {
  position:absolute; top:-6px; right:-6px; background:var(--danger-red); color:white;
  width:20px; height:20px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; font-size:12px; font-weight:700;
}

/* SCROLL CONTENT */
.scroll-content {
  flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; padding-right:8px;
  display:flex; flex-direction:column;
}

/* STATS */
.stats-container {
  display:flex; gap:18px; justify-content:space-between; margin-bottom:18px; flex-shrink:0;
}
.stat-card {
  flex:1; background:var(--card-bg); border-radius:8px; padding:18px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06); text-align:center;
}
.stat-number { font-size:26px; font-weight:800; color:#333; }
.stat-number.neuf { color: var(--neuf-green); }
.stat-number.reforme { color: var(--reforme-red-light); }
.stat-label { font-size:13px; color:var(--muted); margin-top:6px; }

/* ACTIONS & FILTERS */
.actions-container {
  display:flex; justify-content:space-between; align-items:center; gap:12px;
  margin-bottom:18px; flex-wrap:wrap;
}
.action-buttons { display:flex; gap:10px; flex-wrap:wrap; }

.add-button, .pdf-button, .delete-all-button, .category-button {
  padding:10px 16px; border-radius:6px; border:none; cursor:pointer; font-weight:700;
  display:inline-flex; align-items:center; gap:8px; font-size:14px;
}

/* color adjustments (user request) */
.add-button { background: var(--brand-blue); color: white; }
.form-button-submit { background: var(--brand-blue); color: white; }
.pdf-button { background: #E67E22; color: white; }
.category-button { background:#f8f9fa; color:#333; border:1px solid rgba(0,0,0,0.06); }
.category-button:hover { border-color:#3498db; background:#e8f5ff; }
.delete-all-button { background: var(--danger-red); color: white; }

/* Refresh */
.refresh-button {
  background:#95a5a6; color:#111; padding:10px 14px; border-radius:6px; border:none;
  display:inline-flex; align-items:center; gap:8px; cursor:pointer;
}
.refresh-button:hover { background:#7f8c8d; }

/* Filters */
.filters-wrapper { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.filter-label { font-weight:700; color:var(--muted); font-size:13px; }

.dropdown { position:relative; display:inline-block; }
.dropdown-button {
  background:#fff; color:#444; padding:9px 12px; border:1px solid #e0e0e0;
  border-radius:6px; display:flex; align-items:center; gap:8px; min-width:130px;
  justify-content:space-between; cursor:pointer;
}
.dropdown-content {
  position:absolute; top:calc(100% + 6px); left:0; background:#fff; box-shadow:0 8px 18px rgba(0,0,0,0.12);
  border-radius:8px; min-width:220px; max-height:300px; overflow:auto; z-index:40; padding:6px;
}
.dropdown-content button { display:block; width:100%; padding:8px 10px; text-align:left; background:none; border:none; cursor:pointer; }
.dropdown-content button:hover { background:#f2f2f2; }

/* DATE FILTERS */
.date-filters-container { padding:10px; display:flex; flex-direction:column; gap:10px; }
.date-filters-container .filter-row { display:flex; gap:10px; }

/* TABLE - CORRECTIONS POUR VISIBILITÉ COMPLÈTE */
.table-container {
  background:var(--card-bg); border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.06);
  overflow:auto; display:flex; flex-direction:column; flex:1; min-height:0;
  width: 100%;
}
table {
  width:100%; border-collapse:collapse; display:table;
  table-layout: auto;
}
thead { position:sticky; top:0; background:#fafafa; z-index:10; }
th, td { 
  padding:14px 12px; 
  text-align:left; 
  border-bottom:1px solid #f0f0f0; 
  font-size:14px; 
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  max-width: none;
}
th { 
  font-weight:700; 
  color:#555; 
  background:#fafafa; 
  position: sticky;
  top: 0;
}
tbody tr:hover { background:#fcfcfd; }

/* STATUS BADGES */
.status-badge {
  display:inline-block; padding:6px 10px; border-radius:18px; font-weight:700; font-size:13px;
  white-space: nowrap;
}
.status-neuf { background: var(--neuf-green); color: #065a12; }
.status-reforme { background: var(--reforme-red-light); color: #7a1b1b; }

/* ACTION ICONS */
.actions-cell { 
  white-space:nowrap; 
  min-width: 80px;
}
.action-icon { 
  background:none; 
  border:none; 
  cursor:pointer; 
  font-size:16px; 
  margin-right:8px; 
  padding: 4px;
}
.action-icon.edit { color:#2b82cc; }
.action-icon.delete { color:var(--danger-red); }

/* NO DATA */
.no-data-cell { text-align:center; color:#888; padding:20px; }

/* PAGINATION */
.pagination-container { 
  display:flex; 
  justify-content:center; 
  align-items: center;
  gap:10px; 
  padding:12px 0; 
  margin-top: auto;
}
.pagination-container button {
  background: #2e7d32; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;
}
.pagination-container button:disabled { background:#ccc; cursor:not-allowed; }
.pagination-info {
  font-size: 14px;
  color: #666;
}

/* FORM */
.form-view-container {
  background:var(--card-bg); border-radius:10px; padding:28px; box-shadow:0 1px 6px rgba(0,0,0,0.08);
}
.form-title { text-align:center; font-size:22px; font-weight:800; margin-bottom:22px; color:#333; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.input-group { display:flex; flex-direction:column; }
.input-group.full-width { grid-column:1/-1; }
.input-group label { font-weight:600; color:var(--muted); margin-bottom:8px; }
.input-group label.required::after { content:" *"; color: var(--danger-red); font-weight:900; margin-left:4px; }

.input-group input, .input-group select {
  padding:10px 12px; border-radius:8px; border:1px solid #e6e6e6; background:#fbfbfc;
  font-size:14px;
}

/* Status picker */
.status-picker-container { display:flex; gap:10px; }
.status-picker-option {
  flex:1; padding:12px; border-radius:10px; border:1px solid #e6e6e6; text-align:center; cursor:pointer; font-weight:700;
  background:#fafafa; color:#444;
  transition: all 0.2s ease;
}
.status-picker-option.selected { 
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.04); 
}
/* CORRECTION : Ajouter la classe .neuf pour le statut Neuf */
.status-picker-option.selected.neuf { 
  background: var(--neuf-green); 
  color:#065a12; 
  border-color: rgba(10,100,30,0.08); 
}
.status-picker-option.selected.reforme { 
  background: var(--reforme-red-light); 
  color:#7a1b1b; 
  border-color: rgba(200,50,50,0.06); 
}
  
/* Form buttons */
.form-buttons { display:flex; justify-content:flex-end; gap:12px; margin-top:22px; border-top:1px solid #f0f0f0; padding-top:18px; }
.form-button-cancel { background: var(--danger-red); color:white; padding:10px 16px; border-radius:8px; border:none; cursor:pointer; font-weight:700; }
.form-button-submit { background: var(--brand-blue); color:white; padding:10px 16px; border-radius:8px; border:none; cursor:pointer; font-weight:700; }

/* NOTIFICATIONS */
.notification { 
  position:fixed; 
  top:18px; 
  right:18px; 
  z-index:120; 
  padding:14px 18px; 
  border-radius:8px; 
  font-weight:700; 
  max-width:420px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.notification.error { background:#ffecec; color:#b71c1c; border:1px solid #f4b5b5; }
.notification.success { background:#e8f6ee; color:#1b5e20; border:1px solid #a7d7b0; }
.notification.warning { background:#fff9ec; color:#6a4a00; border:1px solid #f39c12; }

/* MODAL */
.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-view {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
}

.modal-input,
.modal-select {
  width: 100%;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  padding: 12px;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.modal-button-cancel {
  background-color: #ccc;
  color: #333;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-button-submit {
  background-color: #689f38;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Category Modal */
.add-category-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.add-category-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.category-list-container {
  margin-bottom: 15px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 10px;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.category-list li:last-child {
  border-bottom: none;
}

.remove-category-button {
  background-color: #E74C3C;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Stock Alert Modal */
.stock-alert-modal {
  max-width: 500px;
}

/* ALERT LIST */
.alert-item { 
  padding:10px; 
  border-radius:6px; 
  margin-bottom:8px; 
  background:#fff3f3; 
  border-left:4px solid var(--danger-red); 
  color:#6b1b1b; 
}
.alert-item.warning { background:#fff9ec; border-left-color:#f39c12; color:#6a4a00; }
.alert-item.info { background:#e8f4ff; border-left-color:#3498db; color:#0b4f78; }

/* SIDEBAR OVERLAY */
.sidebar-overlay { 
  display:none; 
  position:fixed; 
  inset:0; 
  background:rgba(0,0,0,0.45); 
  z-index:90; 
}

/* DROPDOWN IMPROVEMENTS */
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
  overflow-y: auto;
}

.no-data-message {
  padding: 10px;
  text-align: center;
  color: #888;
  font-style: italic;
}

/* RESPONSIVE BEHAVIOR */

/* Tablets and smaller */
@media (max-width:1023px) {
  .container-fluid { flex-direction:column; position:relative; }
  .sidebar {
    position:fixed; top:0; left:0; height:100%; width:260px; transform:translateX(-110%);
    padding:18px;
  }
  .sidebar.open { transform:translateX(0); box-shadow:2px 0 14px rgba(0,0,0,0.28); }
  .sidebar-overlay.visible { display:block; }
  .main-content { padding:14px; width:100%; }

  /* Header: match livraison.jsx / image2 layout */
  .header {
    display:grid;
    grid-template-columns: auto 1fr auto;
    gap:8px;
    align-items:center;
    margin-bottom:14px;
  }
  .menu-button { 
    display:block; 
    color:#689f38; 
    font-size:18px; 
    background:none; 
    border:none; 
    cursor:pointer; 
    padding:6px; 
  }
  .back-button { grid-column:1; order:1; padding:6px 8px; font-size:13px; }
  .header-title { grid-column:2; font-size:18px; order:2; text-align:center; margin:0; }
  .header-right { grid-column:3; order:3; display:flex; align-items:center; justify-content:flex-end; gap:8px; }

  /* on small/tablet hide desktop search inside header-right and expose mobile search below */
  .header-right .search-input { display:none; }
  .search-input-container-mobile { 
    width:100%; 
    grid-column:1/ -1; 
    grid-row:2; 
    margin-top:6px; 
    order:4; 
  }
  .search-input { width:100%; padding:10px 12px; border-radius:10px; font-size:13px; }

  .stats-container { flex-wrap:wrap; gap:12px; }
  .stat-card { flex:1 1 45%; padding:14px; }

  .actions-container { flex-direction:column; align-items:flex-start; gap:10px; }
  .action-buttons { width:100%; justify-content:flex-start; gap:8px; }

  /* Align filters with refresh like livraison.jsx */
  .filters-wrapper { width:100%; justify-content:flex-start; gap:8px; }
  .dropdown { min-width:120px; }
  .refresh-button { width:100%; margin-left:0; }
  
  /* TABLE RESPONSIVE */
  .table-container { 
    overflow-x:auto; 
    -webkit-overflow-scrolling: touch;
  }
  table { 
    min-width: 900px;
    width: 100%;
  }
  th, td {
    padding: 12px 8px;
    font-size: 13px;
  }
  
  .form-grid { grid-template-columns:1fr; gap:14px; }
}

/* MOBILE STYLES - Pour écrans <= 767px */
@media (max-width: 767px) {
  .container-fluid {
    flex-direction: column;
    position: relative;
    min-height: 100vh;
    width: 100vw;
  }

  /* SIDEBAR MOBILE */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 85%;
    max-width: 300px;
    min-width: 260px;
    transform: translateX(-110%);
    padding: 18px;
    z-index: 1000;
    background-color: #689f38;
    transition: transform 0.3s ease-in-out;
    box-shadow: none;
    margin-left: 0;
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 2px 0 14px rgba(0, 0, 0, 0.28);
  }

  .sidebar-overlay.visible {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 999;
  }

  /* HEADER MOBILE - Structure corrigée */
  .header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto auto;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 10px;
    width: 100%;
    box-sizing: border-box;
  }

  .menu-button {
    grid-column: 4;
    grid-row: 1;
    display: block;
    color: #689f38;
    font-size: 20px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    margin: 0;
  }

  .header-title {
    grid-column: 2;
    grid-row: 1;
    font-size: 18px;
    font-weight: 700;
    color: #333;
    text-align: center;
    margin: 0;
    padding: 0 8px;
  }

  .notification-container-mobile {
    grid-column: 3;
    grid-row: 1;
    display: flex;
    justify-content: flex-end;
  }

  .notification-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    position: relative;
    transition: all 0.2s;
    color: #666;
  }

  .notification-button.alert {
    animation: pulse 2s infinite;
    color: #E74C3C;
  }

  .notification-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #E74C3C;
    color: white;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
  }

  .back-button {
    grid-column: 1 ;
    grid-row: 1;
    background: #f4f4f4;
    color: #333;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ddd;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    text-decoration: none;
    white-space: nowrap;
    justify-self: start;
    margin-top: 4px;
  }

  .search-input-container-mobile {
    grid-column: 1 / -1;
    grid-row: 3;
    width: 100%;
    margin-top: 8px;
  }

  .search-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 14px;
    background: #fff;
    box-sizing: border-box;
  }

  /* MAIN CONTENT MOBILE */
  .main-content {
    padding: 12px 10px;
    width: 100%;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .scroll-content {
    padding-right: 0;
  }

  /* STATS CARDS MOBILE */
  .stats-container {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-card {
    flex: 1 1 100%;
    padding: 16px;
    border-radius: 8px;
  }

  .stat-number {
    font-size: 24px;
    font-weight: 800;
  }

  .stat-label {
    font-size: 12px;
  }

  /* ACTIONS CONTAINER MOBILE */
  .actions-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }

  .action-buttons {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .add-button,
  .pdf-button,
  .category-button,
  .delete-all-button {
    flex: 1;
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 8px;
    justify-content: center;
    text-align: center;
    min-height: 44px;
  }

  /* FILTERS MOBILE */
  .filters-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: 100%;
  }

  .filter-label {
    font-size: 14px;
    font-weight: 600;
  }

  .dropdown {
    width: 100%;
  }

  .dropdown-button {
    width: 100%;
    min-width: auto;
    padding: 12px;
    justify-content: space-between;
  }

  .dropdown-content {
    width: 100%;
    left: 0;
    right: 0;
    min-width: auto;
  }

  .refresh-button {
    width: 100%;
    padding: 12px 16px;
    margin-left: 0;
    justify-content: center;
  }

  /* TABLE MOBILE */
  .table-container {
    border-radius: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-bottom: 16px;
  }

  table {
    min-width: 1000px;
    width: 100%;
  }

  th, td {
    padding: 10px 8px;
    font-size: 12px;
    white-space: nowrap;
  }

  th {
    font-size: 12px;
    padding: 12px 8px;
  }

  .actions-cell {
    min-width: 70px;
  }

  .action-icon {
    font-size: 14px;
    margin-right: 6px;
    padding: 4px;
  }

  /* STATUS BADGES MOBILE */
  .status-badge {
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 12px;
  }

  /* PAGINATION MOBILE */
  .pagination-container {
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
  }

  .pagination-container button {
    width: 100%;
    padding: 12px;
    font-size: 14px;
  }

  .pagination-info {
    font-size: 13px;
    text-align: center;
  }

  /* FORM VIEW MOBILE */
  .form-view-container {
    padding: 20px 16px;
    border-radius: 8px;
    margin: 0;
  }

  .form-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .input-group.full-width {
    grid-column: 1;
  }

  .input-group label {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .input-group input,
  .input-group select {
    padding: 12px;
    font-size: 14px;
  }

  .status-picker-container {
    flex-direction: column;
    gap: 8px;
  }

  .status-picker-option {
    padding: 14px;
    font-size: 14px;
  }

  .form-buttons {
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
    padding-top: 20px;
  }

  .form-button-cancel,
  .form-button-submit {
    width: 100%;
    padding: 14px;
    font-size: 14px;
  }

  /* MODALS MOBILE */
  .modal-container {
    padding: 20px 16px;
    align-items: flex-start;
  }

  .modal-view {
    width: 95%;
    max-width: none;
    max-height: 85vh;
    padding: 20px 16px;
    border-radius: 12px;
  }

  .modal-title {
    font-size: 18px;
    margin-bottom: 16px;
  }

  .modal-input,
  .modal-select {
    padding: 14px;
    font-size: 14px;
  }

  .modal-buttons {
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  .modal-button-cancel,
  .modal-button-submit {
    width: 100%;
    padding: 14px;
    font-size: 14px;
  }

  /* CATEGORY MODAL MOBILE */
  .add-category-input-group {
    flex-direction: column;
    gap: 10px;
  }

  .add-category-button {
    width: 100%;
    justify-content: center;
    padding: 12px;
  }

  .category-list-container {
    max-height: 150px;
  }

  .category-list li {
    padding: 10px 0;
  }

  /* NOTIFICATION MOBILE */
  .notification {
    top: 12px;
    right: 12px;
    left: 12px;
    max-width: none;
    padding: 12px 16px;
    font-size: 13px;
  }

  /* STOCK ALERT MODAL MOBILE */
  .stock-alert-modal {
    max-width: none;
    width: 95%;
  }

  .alert-item {
    padding: 12px;
    font-size: 13px;
    margin-bottom: 8px;
  }

  /* NO DATA MESSAGE */
  .no-data-cell {
    padding: 30px 20px;
    font-size: 14px;
  }

  /* DROPDOWN IMPROVEMENTS MOBILE */
  .dropdown-search input {
    padding: 12px;
    font-size: 14px;
  }

  .dropdown-scroll-list {
    max-height: 150px;
  }

  .no-data-message {
    padding: 20px 10px;
    font-size: 13px;
  }
}

/* TRÈS PETITS ÉCRANS (<= 380px) */
@media (max-width: 380px) {
  .header {
    padding: 0 8px;
    gap: 6px;
  }

  .menu-button {
    font-size: 18px;
    padding: 6px;
  }

  .header-title {
    font-size: 16px;
  }

  .back-button {
    padding: 10px 12px;
    font-size: 13px;
  }

  .search-input {
    padding: 12px 14px;
    font-size: 13px;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-number {
    font-size: 22px;
  }

  .add-button,
  .pdf-button,
  .category-button,
  .delete-all-button {
    padding: 14px 12px;
    font-size: 13px;
  }

  .form-view-container {
    padding: 16px 12px;
  }

  .modal-view {
    padding: 16px 12px;
  }
}

/* ANIMATIONS PULSE POUR NOTIFICATIONS */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* SCROLLBAR MOBILE */
.table-container::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* TOUCH FRIENDLY */
@media (max-width: 767px) {
  button, 
  .sidebar-item, 
  .action-icon, 
  .dropdown-button {
    min-height: 44px;
    min-width: 44px;
  }

  .action-icon {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Empêcher le zoom sur les inputs iOS */
  @media screen and (-webkit-min-device-pixel-ratio:0) {
    select,
    textarea,
    input {
      font-size: 16px !important;
    }
  }
}
`;

// --- FIN DU BLOC STYLE ---


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
const ITEMS_PER_PAGE = 10

// Date filters range
const START_YEAR = 2010
const END_YEAR = new Date().getFullYear() + 5
const YEARS = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i
)
const MONTHS = [
  { name: 'Janvier', value: 1 }, { name: 'Février', value: 2 },
  { name: 'Mars', value: 3 }, { name: 'Avril', value: 4 },
  { name: 'Mai', value: 5 }, { name: 'Juin', value: 6 },
  { name: 'Juillet', value: 7 }, { name: 'Août', value: 8 },
  { name: 'Septembre', value: 9 }, { name: 'Octobre', value: 10 },
  { name: 'Novembre', value: 11 }, { name: 'Décembre', value: 12 }
]

export default function StocksScreen() {
  const navigate = useNavigate()

  // View
  const [activeView, setActiveView] = useState('list')

  // Stocks data
  const [allStocks, setAllStocks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterCategory, setFilterCategory] = useState(null)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [dropdownOpen, setDropdownOpen] = useState(null)

  // Category list & modal
  const INITIAL_CATEGORIES = [
    'Imprimante', 'Barrette mémoire ROM', 'Clavier',
    'Souris sans fil', 'Souris filaire', 'Clé USB',
    'Adaptateur', 'Câbles HDMI', 'Câbles VGA'
  ]
  const [productCategories, setProductCategories] = useState(() => {
    const saved = localStorage.getItem('productCategories')
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES
  })
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Form state
  const [isEditing, setIsEditing] = useState(false)
  const [currentStock, setCurrentStock] = useState({
    id_produit: null,
    id_livraison: '',
    nomProduit: '',
    marque: '',
    modele: '',
    numeroSerie: '',
    statut: 'Neuf',
    numero_etagere: ''
  })
  // Available serials for the selected delivery
  const [availableSerials, setAvailableSerials] = useState([])
  const [serialDropdownOpen, setSerialDropdownOpen] = useState(false)
  const [serialSearch, setSerialSearch] = useState('')

  // Livraisons dropdown
  const [livraisons, setLivraisons] = useState([])
  const [livSearch, setLivSearch] = useState('')
  const [livDropdownOpen, setLivDropdownOpen] = useState(false)
  // Ajouter (Filters & Sorting area)
const [filterDate, setFilterDate] = useState('')


  // Notification system (comme livraison.jsx)
  const [notification, setNotification] = useState({ message: '', type: '', visible: false })
  const [stockAlertModalVisible, setStockAlertModalVisible] = useState(false)

  // Responsive sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1023 && window.innerWidth > 767)

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type, visible: true })
    setTimeout(() => setNotification({ message: '', type: '', visible: false }), 4000)
  }

  // Effet pour détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyMobile = window.innerWidth <= 767
      const isCurrentlyTablet = window.innerWidth <= 1023 && window.innerWidth > 767

      setIsMobile(isCurrentlyMobile)
      setIsTablet(isCurrentlyTablet)

      if (window.innerWidth > 1023) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch stocks & livraisons
  useEffect(() => {
    fetchStocks()
    fetchLivraisons()
  }, [])

  async function fetchStocks() {
    setIsLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE_URL}/stocks`)
      setAllStocks(data)
      setCurrentPage(1)
    } catch {
      showNotification('Erreur: impossible de charger les produits.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchLivraisons() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/livraisons`)
      setLivraisons(data)
    } catch {
      console.error('Erreur chargement livraisons')
    }
  }

  // Calculate stock alerts
  const stockAlerts = useMemo(() => {
    const categoryCounts = {}
    allStocks.forEach(stock => {
      const category = stock.nomProduit
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    const alerts = []
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count < 2) {
        alerts.push({
          category,
          count,
          type: 'critical',
          message: `ALERTE: Il ne reste que ${count} produit(s) dans la catégorie "${category}"`
        })
      } else if (count <= 5) {
        alerts.push({
          category,
          count,
          type: 'warning',
          message: `Attention: Il reste ${count} produits dans la catégorie "${category}"`
        })
      }
    })

    return alerts
  }, [allStocks])

  const hasCriticalAlerts = stockAlerts.some(alert => alert.type === 'critical')

  // Processed data: filters, sort
  const processedData = useMemo(() => {
    let list = [...allStocks]

    // search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        Object.values(s).some(v =>
          String(v).toLowerCase().includes(q)
        )
      )
    }
    // status
    if (filterStatus) list = list.filter(s => s.statut === filterStatus)
    // category
    if (filterCategory) list = list.filter(s => s.nomProduit === filterCategory)
    // date
    if (filterMonth) {
      list = list.filter(s =>
        new Date(s.date_MiseAJour).getMonth() + 1 === +filterMonth
      )
    }
    if (filterYear) {
      list = list.filter(s =>
        new Date(s.date_MiseAJour).getFullYear() === +filterYear
      )
    }
    /*// sort
    list.sort((a, b) => {
      const dateA = new Date(a.date_Creation || 0)
      const dateB = new Date(b.date_Creation || 0)
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return list
  }, [allStocks, searchQuery, filterStatus, filterCategory, filterMonth, filterYear, sortOrder])*/
  // Remplacez l'ancien comparator par celui-ci
list.sort((a, b) => {
  // Priorité : date_MiseAJour puis date_Creation puis 0
  const dA = new Date(a.date_MiseAJour || a.date_Creation || 0).getTime();
  const dB = new Date(b.date_MiseAJour || b.date_Creation || 0).getTime();

  // Défaut si NaN (date invalide) -> 0
  const dateA = Number.isFinite(dA) ? dA : 0;
  const dateB = Number.isFinite(dB) ? dB : 0;

  return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
});return list
  }, [allStocks, searchQuery, filterStatus, filterCategory, filterMonth, filterYear, sortOrder])


  // pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return processedData.slice(start, start + ITEMS_PER_PAGE)
  }, [processedData, currentPage])
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE)

  // Add/Edit handlers
  function switchToAddForm() {
    setIsEditing(false)
    setCurrentStock({
      id_produit: null,
      id_livraison: '',
      nomProduit: '',
      marque: '',
      modele: '',
      numeroSerie: '',
      statut: 'Neuf',
      numero_etagere: ''
    })
    setAvailableSerials([])
    setSerialSearch('')
    setActiveView('form')
  }

  function switchToEditForm(stock) {
    setIsEditing(true)
    setCurrentStock(stock)
    const delivery = livraisons.find(l => l.id_livraison === stock.id_livraison);
    const allSerials = (delivery?.numero_Serie || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    setAvailableSerials(allSerials)
    setSerialSearch('')
    setActiveView('form')
  }

  function handleCancelForm() {
    setActiveView('list')
  }

  async function handleSubmitForm(e) {
    e.preventDefault()
    if (!currentStock.id_livraison || !currentStock.nomProduit || !currentStock.numeroSerie) {
      showNotification('Veuillez remplir tous les champs obligatoires.', 'error')
      return
    }
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/stocks/${currentStock.id_produit}`, currentStock)
        showNotification('Produit modifié avec succès.', 'success')
      } else {
        await axios.post(`${API_BASE_URL}/stocks`, {
          ...currentStock,
          date_MiseAJour: new Date().toISOString()
        })
        showNotification('Produit ajouté avec succès.', 'success')
      }
      fetchStocks()
      setActiveView('list')
    } catch {
      showNotification('Erreur lors de la sauvegarde.', 'error')
    }
  }

  async function handleDeleteStock(id) {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      await axios.delete(`${API_BASE_URL}/stocks/${id}`)
      showNotification('Produit supprimé.', 'success')
      fetchStocks()
    } catch {
      showNotification('Erreur lors de la suppression.', 'error')
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer TOUS les produits ? Cette action est irréversible.')) return;
    try {
      const deletePromises = allStocks.map(p => axios.delete(`${API_BASE_URL}/stocks/${p.id_produit}`))
      await Promise.all(deletePromises)
      setAllStocks([])
      showNotification('Tous les produits ont été supprimés.', 'success')
    } catch (err) {
      console.error('Erreur suppression totale stocks', err)
      showNotification('Erreur lors de la suppression de tous les produits. Certaines entrées peuvent être liées.', 'error')
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


  function generatePdf() {
    if (!processedData.length) {
      showNotification('Aucune donnée à imprimer.', 'warning')
      return
    }
    const w = window.open('', '', 'height=600,width=800')
    w.document.write('<html><head><title>Liste des Stocks</title>')
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
      `<h1>Liste des Stocks - ${new Date().toLocaleDateString('fr-FR')}</h1>`
    )
    w.document.write('<table><thead><tr>'
      + '<th>ID</th><th>ID Livraison</th><th>Produit</th>'
      + '<th>Marque</th><th>Modèle</th><th>N° Série</th>'
      + '<th>Étagères</th><th>Status</th><th>Date MAJ</th>'
      + '</tr></thead><tbody>'
    )
    processedData.forEach(item => {
      w.document.write(`<tr>
        <td>${item.id_produit}</td>
        <td>${item.id_livraison}</td>
        <td>${item.nomProduit}</td>
        <td>${item.marque}</td>
        <td>${item.modele}</td>
        <td>${item.numeroSerie}</td>
        <td>${item.numero_etagere}</td>
        <td>${item.statut}</td>
        <td>${new Date(item.date_MiseAJour).toLocaleString('fr-FR')}</td>
      </tr>`)
    })
    w.document.write('</tbody></table></body></html>')
    w.document.close()
    w.print()
  }

  function handleRefresh() {
    setSearchQuery('')
    setFilterStatus(null)
    setFilterCategory(null)
    setFilterMonth('')
    setFilterYear('')
    setSortOrder('desc')
    setCurrentPage(1)
    fetchStocks()
  }

  function resetDateFilters() {
    setFilterMonth('')
    setFilterYear('')
    setSortOrder('desc')
    setDropdownOpen(null)
  }

  // Category modal
  function openCategoryModal() {
    setCategoryModalVisible(true)
  }

  function closeCategoryModal() {
    setCategoryModalVisible(false)
    setNewCategoryName('')
  }

  function addNewCategory() {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    if (productCategories.includes(trimmed)) {
      showNotification('Cette catégorie existe déjà.', 'error')
      return
    }
    const updated = [...productCategories, trimmed]
    setProductCategories(updated)
    localStorage.setItem('productCategories', JSON.stringify(updated))
    setNewCategoryName('')
    showNotification('Catégorie ajoutée.', 'success')
  }

  function removeCategory(cat) {
    const updated = productCategories.filter(c => c !== cat)
    setProductCategories(updated)
    localStorage.setItem('productCategories', JSON.stringify(updated))
    showNotification('Catégorie supprimée.', 'success')
  }

  // Handle delivery selection
  function handleLivSelect(l) {
    // Get all serials for the selected delivery, clean them up
    const allSerials = (l.numero_Serie || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Find which of these serial numbers are ALREADY in the stock list for this specific delivery
    const usedSerials = new Set(
      allStocks
        .filter(stock => stock.id_livraison === l.id_livraison)
        .map(stock => stock.numeroSerie)
    );

    // Find the first serial from the available list that is NOT in the used list (but allow n/a)
    let chosenSerial = ''; // Use empty string for better validation check
    for (const serial of allSerials) {
      if (serial && serial.toLowerCase() === 'n/a') {
        chosenSerial = serial;
        break;
      }
      if (!usedSerials.has(serial)) {
        chosenSerial = serial;
        break; // Stop as soon as we find the first available one
      }
    }

    // Split designation into product name, brand, and model
    const [p, b, m] = (l.designation || '').split(' - ');

    // Update the form state with the auto-filled data
    setCurrentStock(prev => ({
      ...prev,
      id_livraison: l.id_livraison,
      nomProduit: p || '',
      marque: b || '',
      modele: m || '',
      numeroSerie: chosenSerial // Auto-select the first available serial (or n/a if present)
    }));
    
    setAvailableSerials(allSerials); // Store all serials for the dropdown
    setLivDropdownOpen(false);
  }

  // Toggle sidebar for mobile/tablet
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Close sidebar when clicking on overlay
  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Handle notification icon click
  const handleNotificationClick = () => {
    setStockAlertModalVisible(true)
  }

  // Render list view
  const renderListView = () => (
    <>
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{allStocks.length}</div>
          <div className="stat-label">Total Produits</div>
        </div>
        <div className="stat-card">
          <div className="stat-number neuf">
            {allStocks.filter(s => s.statut === 'Neuf').length}
          </div>
          <div className="stat-label">Équipements Neufs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number reforme">
            {allStocks.filter(s => s.statut === 'Reformer').length}
          </div>
          <div className="stat-label">Équipements Réformés</div>
        </div>
      </section>

      <div className="actions-container">
        <div className="action-buttons">
          <button className="add-button" onClick={switchToAddForm}>
            <IoMdAddCircleOutline /> Ajouter Produit
          </button>
          <button className="pdf-button" onClick={generatePdf}>
            <IoDocumentTextOutline /> Imprimer PDF
          </button>
          <button className="category-button" onClick={openCategoryModal}>
            Gérer Catégories
          </button>
          {allStocks.length > 0 && (
            <button className="delete-all-button" onClick={handleDeleteAll}>
              <FaTrash /> Supprimer tout
            </button>
          )}
        </div>

        <div className="filters-wrapper">
          <span className="filter-label">Filtres :</span>
          
          {/* Status */}
          <div className="dropdown">
            <button 
              className="dropdown-button" 
              onClick={() => setDropdownOpen(d => d === 'status' ? null : 'status')}
            >
              {filterStatus || 'Status'} <FaAngleDown size={12} />
            </button>
            {dropdownOpen === 'status' && (
              <div className="dropdown-content">
                <button onClick={() => { setFilterStatus(null); setDropdownOpen(null); }}>Tous</button>
                <button onClick={() => { setFilterStatus('Neuf'); setDropdownOpen(null); }}>Neuf</button>
                <button onClick={() => { setFilterStatus('Reformer'); setDropdownOpen(null); }}>Reformer</button>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="dropdown">
            <button 
              className="dropdown-button" 
              onClick={() => setDropdownOpen(d => d === 'category' ? null : 'category')}
            >
              {filterCategory || 'Catégorie'} <FaAngleDown size={12} />
            </button>
            {dropdownOpen === 'category' && (
              <div className="dropdown-content">
                <button onClick={() => { setFilterCategory(null); setDropdownOpen(null); }}>Toutes</button>
                {productCategories.map((cat, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setFilterCategory(cat); setDropdownOpen(null); }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="dropdown">
            <button 
              className="dropdown-button" 
              onClick={() => setDropdownOpen(d => d === 'date' ? null : 'date')}
            >
              Date <FaAngleDown size={12} />
            </button>
            {dropdownOpen === 'date' && (
              <div className="dropdown-content date-filters-container">
                <div className="filter-row">
                  <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                    <option value="">Mois (tous)</option>
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                  <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                    <option value="">Année (tous)</option>
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-row">
                  <button type="button" onClick={resetDateFilters}>Effacer</button>
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          
<div className="dropdown">
  <button
    className="dropdown-button"
    onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
  >
    Tri: {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'} <FaAngleDown size={12} />
  </button>
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
              <th>ID</th>
              <th>ID Livraison</th>
              <th>Produit</th>
              <th>Marque</th>
              <th>Modèle</th>
              <th>N° Série</th>
              <th>Étagères</th>
              <th>Status</th>
              <th>Date MAJ</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="no-data-cell">
                  Chargement...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data-cell">
                  Aucun produit trouvé
                </td>
              </tr>
            ) : (
              paginatedData.map(stock => (
                <tr key={stock.id_produit}>
                  <td>{stock.id_produit}</td>
                  <td>{stock.id_livraison}</td>
                  <td>{stock.nomProduit}</td>
                  <td>{stock.marque}</td>
                  <td>{stock.modele}</td>
                  <td>{stock.numeroSerie}</td>
                  <td>{stock.numero_etagere}</td>
                  <td>
                    <span className={stock.statut === 'Neuf' ? 'status-neuf' : 'status-reforme'}>
                      {stock.statut}
                    </span>
                  </td>
                  <td>{new Date(stock.date_MiseAJour).toLocaleDateString('fr-FR')}</td>
                  <td className="actions-cell">
                    <button
                      className="action-icon edit"
                      onClick={() => switchToEditForm(stock)}
                      title="Modifier"
                    >
                      <FaPencilAlt/>
                    </button>
                    <button
                      className="action-icon delete"
                      onClick={() => handleDeleteStock(stock.id_produit)}
                      title="Supprimer"
                    >
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
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span>Page {currentPage} / {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}
    </>
  );

  // Render form view
  const renderFormView = () => {
    // Determine which serials are already used by other stocks of this delivery
    const usedSerials = new Set(
        allStocks
            .filter(stock => 
                stock.id_livraison === currentStock.id_livraison &&
                stock.id_produit !== currentStock.id_produit // Exclude the stock item being edited
            )
            .map(stock => stock.numeroSerie)
    );

    const filteredSerials = availableSerials
      .filter(serial =>
        serial.toLowerCase().includes(serialSearch.toLowerCase())
      );

    return (
      <div className="form-view-container">
        <h2 className="form-title">
          {isEditing ? 'Modifier un Produit' : 'Ajouter un Produit'}
        </h2>
        <form onSubmit={handleSubmitForm}>
          <div className="form-grid">
            {/* ID Livraison */}
            <div className="input-group">
              <label>ID Livraison <span style={{color:'red'}}>*</span></label>
              <div className="dropdown">
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={() => setLivDropdownOpen(!livDropdownOpen)}
                >
                  {currentStock.id_livraison || 'Sélectionner…'} <FaAngleDown />
                </button>
                {livDropdownOpen && (
                  <div className="dropdown-content">
                    <div className="dropdown-search">
                      <input
                        type="text"
                        placeholder="Rechercher…"
                        value={livSearch}
                        onChange={e => setLivSearch(e.target.value)}
                      />
                    </div>
                    <div className="dropdown-scroll-list">
                      {livraisons
                        .filter(l =>
                          String(l.id_livraison)
                            .toLowerCase()
                            .includes(livSearch.toLowerCase())
                        )
                        .map(l => (
                          <button
                            type="button"
                            key={l.id_livraison}
                            onClick={() => {
                                handleLivSelect(l); 
                                setSerialDropdownOpen(false); // Close serial dropdown
                            }}
                          >
                            {l.id_livraison}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-filled */}
            <div className="input-group">
              <label>Nom du produit <span style={{color:'red'}}>*</span></label>
              <input type="text" value={currentStock.nomProduit} readOnly/>
            </div>
            <div className="input-group">
              <label>Marque</label>
              <input type="text" value={currentStock.marque} readOnly/>
            </div>
            <div className="input-group">
              <label>Modèle</label>
              <input type="text" value={currentStock.modele} readOnly/>
            </div>

            {/* N° Série - MODIFIED TO DROPDOWN */}
            <div className="input-group">
              <label>N° Série <span style={{color:'red'}}>*</span></label>
              <div className="dropdown">
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={() => setSerialDropdownOpen(!serialDropdownOpen)}
                  disabled={!currentStock.id_livraison || availableSerials.length === 0}
                >
                  {currentStock.numeroSerie || 'Sélectionner…'} <FaAngleDown />
                </button>
                {serialDropdownOpen && (
                  <div className="dropdown-content">
                    <div className="dropdown-search">
                      <input
                        type="text"
                        placeholder="Rechercher N° Série…"
                        value={serialSearch}
                        onChange={e => setSerialSearch(e.target.value)}
                      />
                    </div>
                    <div className="dropdown-scroll-list">
                      {filteredSerials.length > 0 ? (
                          filteredSerials.map((serial, i) => (
                            <button
                              type="button"
                              key={i}
                              onClick={() => {
                                setCurrentStock(prev => ({...prev, numeroSerie: serial}));
                                setSerialDropdownOpen(false);
                                setSerialSearch('');
                              }}
                              // Do not disable 'n/a' even if used
                              disabled={
                                String(serial).toLowerCase() === 'n/a'
                                  ? false
                                  : (!isEditing && usedSerials.has(serial))
                              }
                              style={{
                                  color: (String(serial).toLowerCase() !== 'n/a' && !isEditing && usedSerials.has(serial)) ? 'grey' : 'inherit',
                                  fontWeight: serial === currentStock.numeroSerie ? 'bold' : 'normal',
                                  backgroundColor: serial === currentStock.numeroSerie ? '#e6f7ff' : 'white',
                              }}
                            >
                              {serial}
                              {/* NEW: Display a 'used' tag (but not for n/a) */}
                              {(String(serial).toLowerCase() !== 'n/a' && !isEditing && usedSerials.has(serial)) && 
                                  <span style={{color:'red', marginLeft:'5px', fontSize:'0.8em'}}> (Utilisé)</span>}
                              {(String(serial).toLowerCase() !== 'n/a' && isEditing && usedSerials.has(serial) && serial !== currentStock.numeroSerie) &&
                                  <span style={{color:'red', marginLeft:'5px', fontSize:'0.8em'}}> (Utilisé par un autre)</span>}
                              {(String(serial).toLowerCase() === 'n/a') &&
                                  <span style={{color:'#1890ff', marginLeft:'5px', fontSize:'0.8em'}}> (Libre)</span>}
                            </button>
                          ))
                      ) : (
                          <div className="no-data-message">
                              Aucun numéro de série trouvé.
                          </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {!currentStock.id_livraison && (
                  <p style={{fontSize: '0.8em', color: '#ff4d4f', marginTop: '5px'}}>
                      Veuillez sélectionner un ID Livraison d'abord.
                  </p>
              )}
              {currentStock.id_livraison && availableSerials.length === 0 && (
                  <p style={{fontSize: '0.8em', color: '#faad14', marginTop: '5px'}}>
                      Aucun N° Série disponible pour cette livraison.
                  </p>
              )}
            </div>

            {/* Étagères */}
            <div className="input-group">
              <label>N° Étagères <span style={{color:'red'}}>*</span></label>
              <input
                type="text"
                value={currentStock.numero_etagere}
                onChange={e =>
                  setCurrentStock(prev => ({
                    ...prev,
                    numero_etagere: e.target.value
                  }))
                }
              />
            </div>

            {/* Status */}
<div className="input-group">
  <label>Status <span style={{color:'red'}}>*</span></label>
  <div className="status-picker-container">
    {['Neuf','Reformer'].map(s => (
      <div
        key={s}
        className={`status-picker-option ${
          currentStock.statut === s ? 'selected' : ''
        } ${currentStock.statut === s ? (s === 'Reformer' ? 'reforme' : 'neuf') : ''}`}
        onClick={() => setCurrentStock(prev => ({...prev, statut: s}))}
      >
        {s}
      </div>
    ))}
  </div>
</div>
          </div>

          <div className="form-buttons">
            <button
              type="button"
              className="form-button-cancel"
              onClick={() => setActiveView('list')}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="form-button-submit"
            >
              {isEditing ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      {/* Utilisation du style intégré pour la réponse, dans une application réelle, utiliser <link> ou l'importation */}
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
          {/* NOUVELLE STRUCTURE POUR MOBILE/TABLETTE */}
          {(isMobile || isTablet) && (
              // Conteneur de notification (Col. 1)
              <div className="notification-container-mobile">
                  <button 
                      className={`notification-button ${hasCriticalAlerts ? 'alert' : ''}`}
                      onClick={handleNotificationClick}
                      title="Alertes de stock"
                  >
                      <IoMdNotificationsOutline size={24} />
                      {stockAlerts.length > 0 && (
                          <span className="notification-badge">
                              {stockAlerts.length}
                          </span>
                      )}
                  </button>
              </div>
          )}

          {/* Bouton pour ouvrir la sidebar, visible sur mobile/tablette (Col. 2) */}
          {(isMobile || isTablet) && (
              <button className="menu-button" onClick={() => setIsSidebarOpen(true)} title="Menu">
                <FaBars/>
              </button>
          )}
          
          {/* Bouton Retour (Col. 3 sur mobile, normal sur PC) */}
          <button className="back-button" onClick={() => navigate('/action')}>
            <FaArrowLeft/> Retour
          </button>
          
          {/* Titre (Col. 4 sur mobile, flex-grow sur PC) */}
          <h1 className="header-title">Gestion des Stocks</h1>
          
          {/* Conteneur pour la barre de recherche et l'icône de notification PC (Col. 5 sur mobile) */}
          <div className={(isMobile || isTablet) ? "search-input-container-mobile" : "header-right"}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Rechercher..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
            />
            {/* Notification Icon PC - n'est affiché qu'en mode PC (via CSS) */}
            {!(isMobile || isTablet) && (
                <button 
                  className={`notification-button ${hasCriticalAlerts ? 'alert' : ''}`}
                  onClick={handleNotificationClick}
                  title="Alertes de stock"
                >
                  <IoMdNotificationsOutline size={24} />
                  {stockAlerts.length > 0 && (
                    <span className="notification-badge">
                      {stockAlerts.length}
                    </span>
                  )}
                </button>
            )}
          </div>
        </div>

        <div className="scroll-content">
          {activeView === 'list' ? renderListView() : renderFormView()}
        </div>
      </main>

      {/* Category Modal */}
      {categoryModalVisible && (
        <div className="modal-container" onClick={closeCategoryModal}>
          <div className="modal-view" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title"> Gérer les catégories</h3>
            <div className="add-category-input-group">
              <input
                type="text"
                className="modal-input"
                placeholder="Nouvelle catégorie"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <button className="add-category-button" onClick={addNewCategory}>
                <FaPlus /> Ajouter
              </button>
            </div>
            <div className="category-list-container">
              <ul className="category-list">
                {productCategories.map((cat, i) => (
                  <li key={i}>
                    <span>{cat}</span>
                    <button
                      className="remove-category-button"
                      onClick={() => removeCategory(cat)}
                    >
                      <FaMinus />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-buttons">
              <button className="modal-button-cancel" onClick={closeCategoryModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Alert Modal */}
      {stockAlertModalVisible && (
        <div className="modal-container">
          <div className="modal-view stock-alert-modal">
            <h3 className="modal-title">Alertes de Stock</h3>
            <div className="alert-list">
              {stockAlerts.length === 0 ? (
                <p>Aucune alerte de stock pour le moment.</p>
              ) : (
                stockAlerts.map((alert, index) => (
                  <div key={index} className={`alert-item ${alert.type}`}>
                    {alert.message}
                  </div>
                ))
              )}
            </div>
            <div className="modal-buttons">
              <button 
                className="modal-button-cancel" 
                onClick={() => setStockAlertModalVisible(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant d'icône de notification
const IoMdNotificationsOutline = ({ size }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    fill="currentColor"
  >
    <path d="M256,480a80,80,0,0,0,73.47-48H182.53A80,80,0,0,0,256,480Z"/>
    <path d="M400,288V227.47C400,157,372.64,95.61,304,80l-8-48H216l-8,48c-68.64,15.61-96,77-96,147.47V288L64,352v48H448V352ZM368,368H144V336l32-32V224c0-47.14,21.37-89.67,55-118.51C223.28,99.68,239.31,96,256,96s32.72,3.68,41,9.49C330.63,134.33,352,176.86,352,224v80l32,32Z"/>
  </svg>
)
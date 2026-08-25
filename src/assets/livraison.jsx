// src/stock/stocks.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importation des icônes pour le web
import { FaHome, FaDropbox, FaUserCircle, FaPencilAlt, FaTrash } from 'react-icons/fa';
import { IoMdNotificationsOutline, IoMdAddCircleOutline, IoMdRefresh } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa6";


import './stock/stocks.css'; // Fichier CSS pour le style du composant

// --- CONSTANTES ---
const API_BASE_URL = 'http://localhost:3001/api'; // URL de base de l'API
const ITEMS_PER_PAGE = 10;

// --- COMPOSANT PRINCIPAL ---
export default function LivraisonScreen() {
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [allLivraisons, setAllLivraisons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLivraison, setCurrentLivraison] = useState(null);
  const [sortBy, setSortBy] = useState({
    key: 'updated',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // --- GESTION DES DONNÉES (API) ---
  useEffect(() => {
    fetchLivraisons();
  }, []);

  const fetchLivraisons = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/livraisons`);
      setAllLivraisons(response.data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      alert('Erreur: Impossible de charger les données depuis le serveur.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- LOGIQUE DE TRAITEMENT DES DONNÉES ---
  const processedData = useMemo(() => {
    let filtered = [...allLivraisons];
    if (searchQuery.length > 0) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(livraison =>
        Object.values(livraison).some(val =>
          String(val).toLowerCase().includes(lowerCaseQuery)
        )
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
  }, [allLivraisons, searchQuery, sortBy]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);
  
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  
  // --- GESTIONNAIRES D'ÉVÉNEMENTS (CRUD) ---
  const handleAddLivraison = async () => {
    if (!currentLivraison?.nom || !currentLivraison?.fournisseur || !currentLivraison?.quantite) {
      alert('Erreur: Le nom, le fournisseur et la quantité sont obligatoires.');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/livraisons`, currentLivraison);
      await fetchLivraisons();
      closeModal();
      alert('Succès: Livraison ajoutée avec succès.');
    } catch (error) {
      console.error('Error adding delivery:', error);
      alert("Erreur: Impossible d'ajouter la livraison.");
    }
  };

  const handleUpdateLivraison = async () => {
    if (!currentLivraison || !currentLivraison.id) return;
    try {
      await axios.put(`${API_BASE_URL}/livraisons/${currentLivraison.id}`, currentLivraison);
      await fetchLivraisons();
      closeModal();
      alert('Succès: Livraison modifiée avec succès.');
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('Erreur: Impossible de modifier la livraison.');
    }
  };
  
  const handleDeleteLivraison = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet élément ?")) {
      try {
        await axios.delete(`${API_BASE_URL}/livraisons/${id}`);
        await fetchLivraisons();
        alert("Succès: Élément de livraison supprimé.");
      } catch (error) {
        console.error('Error deleting delivery:', error);
        alert("Erreur: Impossible de supprimer l'élément.");
      }
    }
  };

  const generatePdf = () => {
    if (processedData.length === 0) {
      alert('Aucune donnée à imprimer.');
      return;
    }
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Liste des Livraisons</title>');
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1 { text-align: center; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
        th { background-color: #f2f2f2; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h1>Liste des Livraisons - ${new Date().toLocaleDateString('fr-FR')}</h1>`);
    printWindow.document.write('<table>');
    printWindow.document.write(`
      <thead>
        <tr>
          <th>NOM</th><th>FOURNISSEUR</th><th>QUANTITÉ</th><th>DATE</th>
        </tr>
      </thead>
    `);
    printWindow.document.write('<tbody>');
    processedData.forEach(livraison => {
      printWindow.document.write(`
        <tr>
          <td>${livraison.nom}</td>
          <td>${livraison.fournisseur}</td>
          <td>${livraison.quantite}</td>
          <td>${new Date(livraison.updated).toLocaleDateString('fr-FR')}</td>
        </tr>
      `);
    });
    printWindow.document.write('</tbody></table></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  
  // --- GESTIONNAIRES D'UI ---
  const handleSort = (key) => {
    const direction = sortBy.key === key && sortBy.direction === 'asc' ? 'desc' : 'asc';
    setSortBy({ key, direction });
    setCurrentPage(1);
  };
  
  const openModalForAdd = () => {
    setIsEditing(false);
    setCurrentLivraison({ nom: '', fournisseur: '', quantite: '' });
    setModalVisible(true);
  };

  const openModalForEdit = (livraison) => {
    setIsEditing(true);
    setCurrentLivraison(livraison);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentLivraison(null);
  };
  
  // --- CALCUL DES STATS ---
  const totalLivraisons = allLivraisons.length;

  return (
    <div className="container-fluid">
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
          <h1 className="sidebar-title">Magasin IT</h1>
          <nav>
            <a className="sidebar-item" onClick={() => navigate('/accueil')}>
              <FaHome /><span>Accueil</span>
            </a>
            <a className="sidebar-item active">
              <FaDropbox /><span>Stocks</span>
            </a>
          </nav>
          <div className="sidebar-footer">
            <a className="sidebar-item" onClick={() => navigate('/')}>
              <MdLogout /><span>Déconnexion</span>
            </a>
            <div className="user-profile">
              <FaUserCircle size={40} />
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-email">admin@example.com</span>
              </div>
            </div>
          </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        <header className="header">
           <button className="back-button" onClick={() => navigate('/action')}>
              <FaArrowLeft /> Retour
           </button>
          <h2 className="header-title">Gestion des Livraison</h2>
          <div className="header-right">
            <input
              className="search-input"
              type="text"
              placeholder='Rechercher des produits...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IoMdNotificationsOutline size={28} />
          </div>
        </header>

        <section>
          {/* --- STATS --- */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-number">{totalLivraisons}</div>
              <div className="stat-label">Total des Livraisons</div>
            </div>
          </div>
        
          {/* --- ZONE D'ACTIONS --- */}
          <div className="actions-container">
            <div className='action-buttons'>
                <button className="add-button" onClick={openModalForAdd}>
                    <IoMdAddCircleOutline size={20}/> Ajouter une Livraison
                </button>
                <button className="pdf-button" onClick={generatePdf}>
                    <IoDocumentTextOutline size={20}/> Générer PDF
                </button>
            </div>
            <div className="filters-wrapper">
                <div className="filter-block">
                    <span className="filter-label">Trier par :</span>
                    <button className={`filter-button ${sortBy.key === 'nom' ? 'active' : ''}`} onClick={() => handleSort('nom')}>
                        Nom {sortBy.key === 'nom' ? (sortBy.direction === 'asc' ? '↑' : '↓') : ''}
                    </button>
                    <button className={`filter-button ${sortBy.key === 'updated' ? 'active' : ''}`} onClick={() => handleSort('updated')}>
                        Date {sortBy.key === 'updated' ? (sortBy.direction === 'asc' ? '↑' : '↓') : ''}
                    </button>
                </div>
            </div>
            <button className="refresh-button" onClick={fetchLivraisons}>
               <IoMdRefresh size={22} />
            </button>
           </div>

          {/* --- TABLEAU --- */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>NOM</th>
                  <th>FOURNISSEUR</th>
                  <th>QUANTITÉ</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className='loading-cell'>Chargement...</td></tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map(item => (
                    <tr key={item.id}>
                      <td>{item.nom}</td>
                      <td>{item.fournisseur}</td>
                      <td>{item.quantite}</td>
                      <td>
                        {new Date(item.updated).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="actions-cell">
                        <button className="action-icon edit" onClick={() => openModalForEdit(item)}>
                          <FaPencilAlt />
                        </button>
                        <button className="action-icon delete" onClick={() => handleDeleteLivraison(item.id)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="no-results-cell">Aucune livraison trouvée.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          {totalPages > 1 && (
            <div className="pagination-container">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</button>
                <span>{`Page ${currentPage} sur ${totalPages}`}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Suivant</button>
            </div>
          )}
        </section>
      </main>

      {/* --- MODAL --- */}
      {modalVisible && (
        <div className="modal-container" onClick={closeModal}>
          <div className="modal-view" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{isEditing ? 'Modifier la livraison' : 'Ajouter une livraison'}</h3>
            <input
              placeholder='Nom du produit'
              value={currentLivraison?.nom || ''}
              onChange={(e) => setCurrentLivraison((prev) => ({ ...prev, nom: e.target.value }))}
              className="modal-input"
            />
            <input
              placeholder='Fournisseur'
              value={currentLivraison?.fournisseur || ''}
              onChange={(e) => setCurrentLivraison((prev) => ({ ...prev, fournisseur: e.target.value }))}
              className="modal-input"
            />
            <input
              placeholder='Quantité'
              type="number"
              value={currentLivraison?.quantite || ''}
              onChange={(e) => setCurrentLivraison((prev) => ({ ...prev, quantite: e.target.value }))}
              className="modal-input"
            />
            
            <div className="modal-buttons">
              <button className="modal-button-cancel" onClick={closeModal}>ANNULER</button>
              <button className="modal-button-submit" onClick={isEditing ? handleUpdateLivraison : handleAddLivraison}>
                {isEditing ? 'METTRE À JOUR' : 'AJOUTER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
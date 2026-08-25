// src/App.jsx
//import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthentificationScreen from './authentification'; // Le composant par défaut est importé
import Accueil from './accueil'; 
import Action from './action'; 
import StocksScreen from './stock/stocks'; 
import Attribution from './stock/attribution';
import SortieScreen from './stock/sortie';
//import '../src/assets/bootstrap-4.0.0-dist/css/bootstrap.min.css'
import FournisseursScreen from './fournisseurs';
import LivraisonScreen from './livraison';
import InventaireScreen from './inventaire'; 
import EmployeScreen from './employe';
import AdminScreen from './admin'; // Assurez-vous que le chemin est correct


function App() {
  return (
    <Routes>
      {/* La page de connexion est maintenant la racine */}
      <Route path="/" element={<AuthentificationScreen />} />
      <Route path="/accueil" element={<Accueil />} />
      <Route path="/action" element={<Action />} />
      <Route path="/stocks" element={<StocksScreen />} />
      <Route path="/attribution" element={<Attribution />} />
      <Route path="/sortie" element={<SortieScreen />} />
      <Route path="/fournisseurs" element={<FournisseursScreen />} />
      <Route path="/livraison" element={<LivraisonScreen />} />
      <Route path="/inventaire" element={<InventaireScreen />} />  
      <Route path="/employe" element={<EmployeScreen />} /> 
      <Route path="/admin" element={<AdminScreen />} />
    </Routes>
  );
}

export default App;
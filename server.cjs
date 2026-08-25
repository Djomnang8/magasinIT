/* ===================== server.cjs ====================== */
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://magasin_it.com', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion DB
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'magasin_it',
  port: process.env.DB_PORT || 3006,
});
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion MySQL :', err);
    process.exit(1);
  }
  console.log('✅ Connecté MySQL.');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message 
  });
});

/* ===================== UTILITAIRES / HELPERS ===================== */

async function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

/**
 * Reconstruit l'ensemble des id_produit déjà utilisés (dans Attribution et Sortie).
 * ignoreAttributionId: si fourni, ignore l'attribution d'id correspondant (utile pour édition).
 */
async function getAllUsedProductIds(ignoreAttributionId = null) {
  const used = new Set();

  // Attribution: caracteristique_attribution JSON
  try {
    const attributions = await queryAsync('SELECT caracteristique_attribution, id_attribution FROM Attribution');
    for (const a of attributions) {
      if (ignoreAttributionId && Number(a.id_attribution) === Number(ignoreAttributionId)) continue;
      try {
        const parsed = typeof a.caracteristique_attribution === 'string'
          ? JSON.parse(a.caracteristique_attribution)
          : a.caracteristique_attribution;
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        arr.forEach(it => {
          if (it && (it.id_produit || it.id_produit === 0)) used.add(Number(it.id_produit));
        });
      } catch (e) {
        // ignore parse errors
      }
    }
  } catch (e) {
    console.error('Erreur getAllUsedProductIds (attributions):', e);
  }

  // Sorties: caracteristique_sortie JSON
  try {
    const sorties = await queryAsync('SELECT caracteristique_sortie FROM Sortie');
    for (const r of sorties) {
      try {
        const parsed = typeof r.caracteristique_sortie === 'string'
          ? JSON.parse(r.caracteristique_sortie)
          : r.caracteristique_sortie;
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        arr.forEach(it => {
          if (it && (it.id_produit || it.id_produit === 0)) used.add(Number(it.id_produit));
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    console.error('Erreur getAllUsedProductIds (sorties):', e);
  }

  return used;
}

/* ===================== LOGIQUE PRODUIT RÉUTILISABLE ===================== */

async function createProduit(req, res) {
  try {
    const { id_livraison, nomProduit, marque, modele, numeroSerie, statut, numero_etagere } = req.body;

    if (!id_livraison || !nomProduit || !numeroSerie || !statut) {
      return res.status(400).json({ error: 'id_livraison, nomProduit, numeroSerie et statut sont requis.' });
    }

    if (String(numeroSerie).toLowerCase() !== 'n/a') {
      const existing = await queryAsync(
        'SELECT id_produit FROM Produit WHERE LOWER(numeroSerie) = LOWER(?)',
        [numeroSerie]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: `Le numéro de série ${numeroSerie} existe déjà dans le stock.` });
      }
    }

    const sql = `
      INSERT INTO Produit (id_livraison, nomProduit, marque, modele, numeroSerie, statut, numero_etagere, date_MiseAJour)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [id_livraison, nomProduit, marque || null, modele || null, numeroSerie, statut, numero_etagere || null];
    const result = await queryAsync(sql, values);

    res.status(201).json({ message: 'Produit ajouté.', id: result.insertId });
  } catch (err) {
    console.error('Erreur lors de l\'ajout du produit:', err);
    res.status(500).json({ error: 'Erreur serveur. Assurez-vous que id_livraison est valide.' });
  }
}

async function updateProduit(req, res) {
  try {
    const { id_livraison, nomProduit, marque, modele, numeroSerie, statut, numero_etagere } = req.body;

    if (!id_livraison || !nomProduit || !numeroSerie || !statut) {
      return res.status(400).json({ error: 'id_livraison, nomProduit, numeroSerie et statut sont requis.' });
    }

    if (String(numeroSerie).toLowerCase() !== 'n/a') {
      const existing = await queryAsync(
        'SELECT id_produit FROM Produit WHERE LOWER(numeroSerie) = LOWER(?) AND id_produit != ?',
        [numeroSerie, req.params.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: `Le numéro de série ${numeroSerie} existe déjà dans le stock.` });
      }
    }

    const sql = `
      UPDATE Produit
      SET id_livraison = ?, nomProduit = ?, marque = ?, modele = ?, numeroSerie = ?, statut = ?, numero_etagere = ?, date_MiseAJour = NOW()
      WHERE id_produit = ?
    `;
    const values = [id_livraison, nomProduit, marque || null, modele || null, numeroSerie, statut, numero_etagere || null, req.params.id];
    const result = await queryAsync(sql, values);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Produit non trouvé.' });
    res.json({ message: 'Produit mis à jour.' });
  } catch (err) {
    console.error('Erreur mise à jour produit:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function deleteProduit(req, res) {
  try {
    const result = await queryAsync('DELETE FROM Produit WHERE id_produit = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Produit non trouvé.' });
    res.json({ message: 'Produit supprimé.' });
  } catch (err) {
    console.error('Erreur suppression produit:', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Impossible de supprimer : le produit est déjà attribué ou sorti.' });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

/* ===================== API PRODUITS + ALIAS STOCKS ===================== */

// GET stocks (liste)
app.get('/api/stocks', async (req, res) => {
  try {
    const { excludeUsed } = req.query;
    const query = 'SELECT id_produit, id_livraison, nomProduit, marque, modele, numeroSerie, statut, numero_etagere, date_MiseAJour FROM Produit ORDER BY nomProduit ASC';
    let produits = await queryAsync(query);

    if (excludeUsed && (excludeUsed === 'true' || excludeUsed === '1')) {
      const used = await getAllUsedProductIds();
      produits = produits.filter(p => !used.has(Number(p.id_produit)));
    }

    res.json(produits);
  } catch (err) {
    console.error('Erreur lors de la récupération du stock (/api/stocks):', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du stock.' });
  }
});

// Alias CRUD pour stocks (utilise les fonctions Produit)
app.post('/api/stocks', createProduit);
app.put('/api/stocks/:id', updateProduit);
app.delete('/api/stocks/:id', deleteProduit);

// Routes Produit (mêmes handlers, pour compatibilité)
app.get('/api/produits', async (req, res) => {
  try {
    const { excludeUsed } = req.query;
    const query = 'SELECT id_produit, id_livraison, nomProduit, marque, modele, numeroSerie, statut, numero_etagere, date_MiseAJour FROM Produit ORDER BY nomProduit ASC';
    let produits = await queryAsync(query);

    if (excludeUsed && (excludeUsed === 'true' || excludeUsed === '1')) {
      const used = await getAllUsedProductIds();
      produits = produits.filter(p => !used.has(Number(p.id_produit)));
    }

    res.json(produits);
  } catch (err) {
    console.error('Erreur lors de la récupération des produits:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.get('/api/produits/:id', async (req, res) => {
  try {
    const sql = 'SELECT * FROM Produit WHERE id_produit = ?';
    const rows = await queryAsync(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Produit non trouvé.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur récupération produit:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.post('/api/produits', createProduit);
app.put('/api/produits/:id', updateProduit);
app.delete('/api/produits/:id', deleteProduit);

/* ===================== API SORTIES ===================== */

app.get('/api/sorties', async (req, res) => {
  try {
    const { date, matricule, motif } = req.query;
    let conditions = [];
    let params = [];

    if (date) { conditions.push('DATE(s.dateSortie) = ?'); params.push(date); }
    if (matricule) { conditions.push('s.matricule_employe LIKE ?'); params.push(`%${matricule}%`); }
    if (motif) { conditions.push('s.motif LIKE ?'); params.push(`%${motif}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT s.*, e.nom_complet AS nom_utilisateur, e.adresse_email AS email, e.localisation AS destination, e.direction, e.fonction
      FROM Sortie s
      LEFT JOIN employe e ON s.matricule_employe = e.matricule
      ${where}
      ORDER BY s.dateSortie DESC
    `;
    const results = await queryAsync(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Erreur récupération sorties:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.get('/api/sorties/:id', async (req, res) => {
  try {
    const sql = `
      SELECT s.*, e.nom_complet AS nom_utilisateur, e.adresse_email AS email, e.localisation AS destination, e.direction, e.fonction
      FROM Sortie s
      LEFT JOIN employe e ON s.matricule_employe = e.matricule
      WHERE s.id_sortie = ?
    `;
    const rows = await queryAsync(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Sortie non trouvée.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur récupération sortie:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.post('/api/sorties', async (req, res) => {
  try {
    const {
      matricule_employe, motif, nomChauffeur, caracteristique_sortie,
      dateSortie, dateRetour, nom_utilisateur, email, fonction, direction, destination
    } = req.body;

    if (!matricule_employe || !motif || !dateSortie || !caracteristique_sortie) {
      return res.status(400).json({ error: 'Champs requis manquants: matricule_employe, motif, dateSortie, caracteristique_sortie.' });
    }

    let parsed;
    try {
      parsed = typeof caracteristique_sortie === 'string' ? JSON.parse(caracteristique_sortie) : caracteristique_sortie;
    } catch (e) {
      return res.status(400).json({ error: 'caracteristique_sortie doit être un JSON valide.' });
    }
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const ids = Array.from(new Set(arr.map(it => it && (it.id_produit || it.id_produit === 0) ? Number(it.id_produit) : null).filter(Boolean)));

    const used = await getAllUsedProductIds();
    const overlap = ids.filter(id => used.has(id));
    if (overlap.length) {
      return res.status(400).json({ error: 'Certains id_produit sont déjà utilisés (attribués ou sortis).', usedIds: overlap });
    }

    const sql = `INSERT INTO Sortie (matricule_employe, motif, nomChauffeur, caracteristique_sortie, dateSortie, dateRetour)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [matricule_employe, motif, nomChauffeur || null, JSON.stringify(arr), dateSortie, dateRetour || null];
    const result = await queryAsync(sql, values);

    res.status(201).json({ message: 'Sortie ajoutée.', id: result.insertId });
  } catch (err) {
    console.error('Erreur lors de l\'ajout de la sortie:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.put('/api/sorties/:id', async (req, res) => {
  try {
    const { matricule_employe, motif, nomChauffeur, caracteristique_sortie, dateSortie, dateRetour } = req.body;

    if (!matricule_employe || !motif || !dateSortie || !caracteristique_sortie) {
      return res.status(400).json({ error: 'Champs requis manquants: matricule_employe, motif, dateSortie, caracteristique_sortie.' });
    }

    let parsed;
    try {
      parsed = typeof caracteristique_sortie === 'string' ? JSON.parse(caracteristique_sortie) : caracteristique_sortie;
    } catch (e) {
      return res.status(400).json({ error: 'caracteristique_sortie doit être un JSON valide.' });
    }
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const ids = Array.from(new Set(arr.map(it => it && (it.id_produit || it.id_produit === 0) ? Number(it.id_produit) : null).filter(Boolean)));

    const usedIdsElsewhere = new Set();

    const allSorties = await queryAsync('SELECT id_sortie, caracteristique_sortie FROM Sortie');
    for (const s of allSorties) {
      if (Number(s.id_sortie) === Number(req.params.id)) continue;
      try {
        const p = typeof s.caracteristique_sortie === 'string' ? JSON.parse(s.caracteristique_sortie) : s.caracteristique_sortie;
        const list = Array.isArray(p) ? p : [p];
        list.forEach(it => { if (it && (it.id_produit || it.id_produit === 0)) usedIdsElsewhere.add(Number(it.id_produit)); });
      } catch (e) {}
    }

    // Also include attributions
    const attributions = await queryAsync('SELECT caracteristique_attribution FROM Attribution');
    for (const a of attributions) {
      try {
        const p = typeof a.caracteristique_attribution === 'string' ? JSON.parse(a.caracteristique_attribution) : a.caracteristique_attribution;
        const list = Array.isArray(p) ? p : [p];
        list.forEach(it => { if (it && (it.id_produit || it.id_produit === 0)) usedIdsElsewhere.add(Number(it.id_produit)); });
      } catch (e) {}
    }

    const overlap = ids.filter(id => usedIdsElsewhere.has(id));
    if (overlap.length) {
      return res.status(400).json({ error: 'Certains id_produit sont déjà utilisés (attribués ou sortis ailleurs).', usedIds: overlap });
    }

    const sql = `UPDATE Sortie SET matricule_employe = ?, motif = ?, nomChauffeur = ?, caracteristique_sortie = ?, dateSortie = ?, dateRetour = ?
                 WHERE id_sortie = ?`;
    const values = [matricule_employe, motif, nomChauffeur || null, JSON.stringify(arr), dateSortie, dateRetour || null, req.params.id];
    const result = await queryAsync(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Sortie non trouvée.' });
    res.json({ message: 'Sortie mise à jour.' });
  } catch (err) {
    console.error('Erreur mise à jour sortie:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.delete('/api/sorties/:id', async (req, res) => {
  try {
    const result = await queryAsync('DELETE FROM Sortie WHERE id_sortie = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Sortie non trouvée.' });
    res.json({ message: 'Sortie supprimée.' });
  } catch (err) {
    console.error('Erreur suppression sortie:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.delete('/api/sorties', async (req, res) => {
  try {
    await queryAsync('DELETE FROM Sortie');
    res.json({ message: 'Toutes les sorties ont été supprimées.' });
  } catch (err) {
    console.error('Erreur suppression toutes sorties:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ===================== API ATTRIBUTIONS ===================== */
// GET Attributions
app.get('/api/attributions', async (req, res) => {
  try {
    const sql = `
      SELECT
        a.id_attribution,
        a.matricule_employe,
        a.mode_Utilisation,
        a.identification_matériel,
        a.nom_Machine,
        a.date_attribution,
        a.etatAncienneMachine,
        a.caracteristique_attribution,
        a.caracteristique_ancien_materiel,
        e.nom_complet AS nom_employe,
        e.adresse_email,
        e.direction,
        e.fonction,
        e.localisation
      FROM Attribution a
      LEFT JOIN employe e ON a.matricule_employe = e.matricule
      ORDER BY a.date_attribution DESC
    `;
    const results = await queryAsync(sql);

    const formatted = results.map(item => {
      let ids = [];
      try {
        const parsed = JSON.parse(item.caracteristique_attribution || '[]');
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        ids = arr.map(it => it.id_produit).filter(Boolean);
      } catch (e) {}
      return {
        ...item,
        id_produit: ids.join(', '),
        caracteristique: item.caracteristique_attribution,
        caracteristiqueAncien: item.caracteristique_ancien_materiel
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Erreur récupération attributions:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST Attribution
app.post('/api/attributions', async (req, res) => {
  try {
    const {
      matricule_employe,
      mode_Utilisation,
      identification_matériel,
      nom_Machine,
      caracteristique_attribution,
      caracteristique_ancien_materiel,
      etatAncienneMachine,
    } = req.body;

    if (!matricule_employe || !mode_Utilisation || !identification_matériel || !caracteristique_attribution) {
      return res.status(400).json({ error: 'Champs requis manquants.' });
    }

    const sql = `
      INSERT INTO Attribution (
        matricule_employe, mode_Utilisation, identification_matériel,
        nom_Machine, caracteristique_attribution,
        caracteristique_ancien_materiel, etatAncienneMachine, date_attribution
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      matricule_employe,
      mode_Utilisation,
      identification_matériel,
      nom_Machine || null,
      JSON.stringify(caracteristique_attribution),
      caracteristique_ancien_materiel ? JSON.stringify(caracteristique_ancien_materiel) : null,
      etatAncienneMachine || null,
    ];
    const result = await queryAsync(sql, values);
    res.status(201).json({ message: 'Attribution ajoutée.', id: result.insertId });
  } catch (err) {
    console.error('Erreur POST attribution:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT Attribution
app.put('/api/attributions/:id', async (req, res) => {
  try {
    const {
      matricule_employe,
      mode_Utilisation,
      identification_matériel,
      nom_Machine,
      caracteristique_attribution,
      caracteristique_ancien_materiel,
      etatAncienneMachine,
    } = req.body;

    // Dans app.put('/api/attributions/:id', ...)
const sql = `
  UPDATE Attribution SET
    matricule_employe = ?,
    mode_Utilisation = ?,
    identification_matériel = ?,
    nom_Machine = ?,
    caracteristique_attribution = ?,
    caracteristique_ancien_materiel = ?,
    etatAncienneMachine = ?,
    date_attribution = NOW()  /* <-- C'EST LA LIGNE À AJOUTER/MODIFIER */
  WHERE id_attribution = ?
`;

    const values = [
      matricule_employe,
      mode_Utilisation,
      identification_matériel,
      nom_Machine || null,
      JSON.stringify(caracteristique_attribution),
      caracteristique_ancien_materiel ? JSON.stringify(caracteristique_ancien_materiel) : null,
      etatAncienneMachine || null,
      req.params.id,
    ];
    const result = await queryAsync(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Attribution non trouvée.' });
    res.json({ message: 'Attribution mise à jour.' });
  } catch (err) {
    console.error('Erreur PUT attribution:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});


// DELETE Attribution et DELETE all inchangés

app.delete('/api/attributions/:id', async (req, res) => {
  try {
    const result = await queryAsync('DELETE FROM Attribution WHERE id_attribution = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Attribution non trouvée.' });
    res.json({ message: 'Attribution supprimée.' });
  } catch (err) {
    console.error('Erreur suppression attribution:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE all attributions (mirror /api/sorties DELETE)
app.delete('/api/attributions', async (req, res) => {
  try {
    await queryAsync('DELETE FROM Attribution');
    res.json({ message: 'Toutes les attributions ont été supprimées.' });
  } catch (err) {
    console.error('Erreur suppression toutes attributions:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ===================== API EMPLOYES ===================== */

app.get('/api/employes', async (req, res) => {
  try {
    const query = 'SELECT id_employe, matricule, nom_complet, adresse_email, localisation, direction, fonction FROM employe ORDER BY nom_complet ASC';
    const results = await queryAsync(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur lors de la récupération des employés:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});
/*// Routes pour les employés
app.get('/api/employes', (req, res) => {
  const query = 'SELECT * FROM Employe ORDER BY nom_complet';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des employés:', err);
      res.status(500).json({ error: 'Erreur serveur' });
      return;
    }
    res.json(results);
  });
});*/

app.post('/api/employes', (req, res) => {
  const { matricule, nom_complet, adresse_email, localisation, direction, fonction } = req.body;
  
  const query = 'INSERT INTO Employe (matricule, nom_complet, adresse_email, localisation, direction, fonction) VALUES (?, ?, ?, ?, ?, ?)';
  
  db.query(query, [matricule, nom_complet, adresse_email, localisation, direction, fonction], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Matricule ou email déjà existant' });
        return;
      }
      console.error('Erreur lors de l\'ajout de l\'employé:', err);
      res.status(500).json({ error: 'Erreur serveur' });
      return;
    }
    res.json({ message: 'Employé ajouté avec succès', id: results.insertId });
  });
});

app.put('/api/employes/:id', (req, res) => {
  const { id } = req.params;
  const { matricule, nom_complet, adresse_email, localisation, direction, fonction } = req.body;
  
  const query = 'UPDATE Employe SET matricule = ?, nom_complet = ?, adresse_email = ?, localisation = ?, direction = ?, fonction = ? WHERE id_employe = ?';
  
  db.query(query, [matricule, nom_complet, adresse_email, localisation, direction, fonction, id], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Matricule ou email déjà existant' });
        return;
      }
      console.error('Erreur lors de la modification de l\'employé:', err);
      res.status(500).json({ error: 'Erreur serveur' });
      return;
    }
    res.json({ message: 'Employé modifié avec succès' });
  });
});

app.delete('/api/employes/:id', (req, res) => {
  const { id } = req.params;
  
  // D'abord, récupérer le matricule de l'employé
  const getMatriculeQuery = 'SELECT matricule FROM Employe WHERE id_employe = ?';
  
  db.query(getMatriculeQuery, [id], (err, employeResults) => {
    if (err) {
      console.error('Erreur lors de la récupération du matricule:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (employeResults.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    
    const matricule = employeResults[0].matricule;
    
    // Vérifier si l'employé est utilisé dans Attribution
    const checkAttributionQuery = 'SELECT COUNT(*) as count FROM Attribution WHERE matricule_employe = ?';
    const checkSortieQuery = 'SELECT COUNT(*) as count FROM Sortie WHERE matricule_employe = ?';
    
    db.query(checkAttributionQuery, [matricule], (err, attributionResults) => {
      if (err) {
        console.error('Erreur vérification attribution:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      db.query(checkSortieQuery, [matricule], (err, sortieResults) => {
        if (err) {
          console.error('Erreur vérification sortie:', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        const attributionCount = attributionResults[0].count;
        const sortieCount = sortieResults[0].count;
        
        if (attributionCount > 0 || sortieCount > 0) {
          let errorMessage = 'Impossible de supprimer cet employé car il est référencé dans :';
          if (attributionCount > 0) errorMessage += ` ${attributionCount} attribution(s)`;
          if (sortieCount > 0) {
            if (attributionCount > 0) errorMessage += ' et';
            errorMessage += ` ${sortieCount} sortie(s)`;
          }
          return res.status(400).json({ error: errorMessage });
        }
        
        // Si pas de références, procéder à la suppression
        const deleteQuery = 'DELETE FROM Employe WHERE id_employe = ?';
        
        db.query(deleteQuery, [id], (err, results) => {
          if (err) {
            console.error('Erreur lors de la suppression de l\'employé:', err);
            // Fallback pour d'autres erreurs de contrainte
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
              return res.status(400).json({ 
                error: 'Impossible de supprimer cet employé car il est référencé dans d\'autres tables (attributions ou sorties)' 
              });
            }
            return res.status(500).json({ error: 'Erreur serveur' });
          }
          
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Employé non trouvé' });
          }
          
          res.json({ message: 'Employé supprimé avec succès' });
        });
      });
    });
  });
});


/* ===================== API FOURNISSEURS ===================== */

// GET - Récupérer tous les fournisseurs
app.get('/api/fournisseurs', async (req, res) => {
  try {
    const query = 'SELECT id_fournisseur, code_Fournisseur, nom, telephone, email, localisation, numero_BonCommande FROM fournisseur ORDER BY nom ASC';
    const results = await queryAsync(query);
    res.json(results);
  } catch (err) {
    console.error('Erreur lors de la récupération des fournisseurs:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET - Récupérer un fournisseur par ID
app.get('/api/fournisseurs/:id', async (req, res) => {
  try {
    const sql = 'SELECT * FROM fournisseur WHERE id_fournisseur = ?';
    const rows = await queryAsync(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Fournisseur non trouvé.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur récupération fournisseur:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});


// POST - Ajouter un nouveau fournisseur
app.post('/api/fournisseurs', async (req, res) => {
  try {
    const { code_Fournisseur, nom, telephone, email, localisation, numero_BonCommande } = req.body;

    // Champs requis minimum (numero_BonCommande est désormais optionnel)
    if (!code_Fournisseur || !nom || !telephone || !email) {
      return res.status(400).json({ error: 'Code fournisseur, nom, téléphone et email sont requis.' });
    }

    // Conversion de la chaîne vide en NULL pour la base de données
    // Le DB gérera l'unicité du NULL (multiple NULLs sont autorisés)
    const bonCommande = (numero_BonCommande && String(numero_BonCommande).trim() !== '') 
                       ? String(numero_BonCommande).trim() 
                       : null;

    const sql = `
      INSERT INTO fournisseur (code_Fournisseur, nom, telephone, email, localisation, numero_BonCommande)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [code_Fournisseur, nom, telephone, email, localisation || null, bonCommande];

    const result = await queryAsync(sql, values);
    res.status(201).json({ message: 'Fournisseur ajouté.', id: result.insertId });

  } catch (err) {
    console.error('Erreur lors de l\'ajout du fournisseur:', err);
    // Gérer l'erreur de doublon UNIQUE
    if (err.code === 'ER_DUP_ENTRY') {
      const isCode = err.message.includes('code_Fournisseur');
      const isBonCommande = err.message.includes('numero_BonCommande');
      
      let errorMessage = 'Doublon détecté.';
      if (isCode) errorMessage = 'Le code fournisseur existe déjà.';
      if (isBonCommande) errorMessage = 'Le numéro de bon de commande existe déjà.';
      
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT - Modifier un fournisseur existant
app.put('/api/fournisseurs/:id', async (req, res) => {
  try {
    const { code_Fournisseur, nom, telephone, email, localisation, numero_BonCommande } = req.body;
    const { id } = req.params;

    if (!code_Fournisseur || !nom || !telephone || !email) {
      return res.status(400).json({ error: 'Code fournisseur, nom, téléphone et email sont requis.' });
    }

    const bonCommande = (numero_BonCommande && String(numero_BonCommande).trim() !== '') 
                       ? String(numero_BonCommande).trim() 
                       : null;

    const sql = `
      UPDATE fournisseur
      SET code_Fournisseur = ?, nom = ?, telephone = ?, email = ?, localisation = ?, numero_BonCommande = ?
      WHERE id_fournisseur = ?
    `;
    const values = [code_Fournisseur, nom, telephone, email, localisation || null, bonCommande, id];

    const result = await queryAsync(sql, values);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Fournisseur non trouvé.' });

    res.json({ message: 'Fournisseur mis à jour.' });

  } catch (err) {
    console.error('Erreur mise à jour fournisseur:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      const isCode = err.message.includes('code_Fournisseur');
      const isBonCommande = err.message.includes('numero_BonCommande');
      
      let errorMessage = 'Doublon détecté.';
      if (isCode) errorMessage = 'Le code fournisseur existe déjà.';
      if (isBonCommande) errorMessage = 'Le numéro de bon de commande existe déjà.';
      
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE - Supprimer un fournisseur
app.delete('/api/fournisseurs/:id', async (req, res) => {
  try {
    const result = await queryAsync('DELETE FROM fournisseur WHERE id_fournisseur = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Fournisseur non trouvé.' });
    res.json({ message: 'Fournisseur supprimé.' });
  } catch (err) {
    console.error('Erreur suppression fournisseur:', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Impossible de supprimer : le fournisseur est lié à une ou plusieurs livraisons.' });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ===================== API LIVRAISONS (CORRIGÉE) ===================== */

function normalizeSerialsArray(arr) {
  return arr.map(s => String(s || '').trim()).filter(s => s.length > 0);
}

async function findExistingSerials(serialsToCheck, ignoreId = null) {
  if (!serialsToCheck || serialsToCheck.length === 0) return [];
  const serialsSet = new Set(serialsToCheck.filter(s => s.toLowerCase() !== 'n/a'));

  const sql = `SELECT numero_Serie FROM Livraison ${ignoreId ? 'WHERE id_livraison != ?' : ''}`;
  const rows = await queryAsync(sql, ignoreId ? [ignoreId] : []);

  const found = new Set();
  rows.forEach(r => {
    const rawData = r.numero_Serie;
    let storedSerials = [];
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (Array.isArray(parsed)) storedSerials = parsed;
    } catch (e) {
      if (typeof rawData === 'string' && rawData.includes(',')) {
        storedSerials = rawData.split(',').map(x => x.trim()).filter(s => s.length > 0);
      } else if (typeof rawData === 'string' && rawData.length > 0) {
        storedSerials = [rawData.trim()];
      }
    }
    storedSerials.forEach(v => { if (serialsSet.has(v)) found.add(v); });
  });

  return Array.from(found);
}

// GET livraisons avec jointure sur Fournisseur
app.get('/api/livraisons', async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.id_livraison,
        l.id_fournisseurs,
        l.nom_fournisseur,
        l.numero_Bordereau,
        l.date_Reception,
        l.objet,
        l.lot,
        l.designation,
        l.numero_Serie,
        l.date_Creation,
        f.numero_BonCommande
      FROM Livraison l
      LEFT JOIN Fournisseur f ON l.id_fournisseurs = f.id_fournisseur
      ORDER BY l.date_Creation DESC
    `;
    const results = await queryAsync(sql);

    const normalized = results.map(row => {
      let csv = '';
      const raw = row.numero_Serie;
      if (raw == null) {
        csv = '';
      } else {
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed)) {
            csv = parsed.filter(Boolean).join(', ');
          } else if (parsed) {
            csv = String(parsed);
          }
        } catch (e) {
          csv = String(raw);
        }
      }
      return { ...row, numero_Serie: csv };
    });

    res.json(normalized);
  } catch (err) {
    console.error('Erreur récupération livraisons:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST - Ajouter une livraison (VERSION CORRIGÉE)
app.post('/api/livraisons', async (req, res) => {
  try {
    console.log('📥 Données reçues pour nouvelle livraison:', JSON.stringify(req.body, null, 2));
    
    const { nom_fournisseur, numero_Bordereau, date_Reception, objet, lot, designation, numero_Serie_list, nomProduit, marque, modele } = req.body;

    // Validation des champs requis
    if (!nom_fournisseur || !numero_Bordereau || !date_Reception) {
      return res.status(400).json({ error: 'nom_fournisseur, numero_Bordereau et date_Reception sont requis.' });
    }

    // CORRECTION : Formater la date pour MySQL (YYYY-MM-DD)
    let formattedDate = date_Reception;
    try {
      const dateObj = new Date(date_Reception);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
      }
    } catch (e) {
      console.error('Erreur formatage date:', e);
    }

    // Construction de la désignation
    let finalDesignation = designation;
    if (!finalDesignation && nomProduit) {
      finalDesignation = [
        nomProduit,
        marque,
        modele
      ].map(s => String(s || '').trim()).filter(Boolean).join(' - ');
    }

    if (!finalDesignation) {
      return res.status(400).json({ error: 'La désignation est requise (soit directement, soit via nomProduit).' });
    }

    // Validation des numéros de série
    let serials = [];
    if (numero_Serie_list) {
      if (Array.isArray(numero_Serie_list)) {
        serials = normalizeSerialsArray(numero_Serie_list);
      } else {
        serials = normalizeSerialsArray(String(numero_Serie_list).split(/, ?|\n/));
      }
    }

    if (serials.length === 0) {
      return res.status(400).json({ error: 'Au moins un numéro de série valide est requis.' });
    }

    // Vérification des doublons de numéros de série
    const toCheck = serials.filter(s => s.toLowerCase() !== 'n/a');
    const existing = await findExistingSerials(toCheck);
    if (existing.length) {
      return res.status(400).json({ error: `Le(s) numéro(s) de série ${existing.join(', ')} existe(nt) déjà.` });
    }

    // Récupération de l'ID du fournisseur
    const supplier = await queryAsync(
      'SELECT id_fournisseur FROM Fournisseur WHERE nom = ?', 
      [nom_fournisseur]
    );
    
    if (!supplier.length) {
      return res.status(400).json({ error: `Fournisseur '${nom_fournisseur}' introuvable.` });
    }

    const id_fournisseurs = supplier[0].id_fournisseur;
    const jsonToStore = JSON.stringify(serials);

    // Insertion dans la base de données
    const insertSql = `
      INSERT INTO Livraison (id_fournisseurs, nom_fournisseur, numero_Bordereau, date_Reception, objet, lot, designation, numero_Serie, date_Creation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await queryAsync(insertSql, [
      id_fournisseurs, 
      nom_fournisseur, 
      numero_Bordereau, 
      formattedDate,  // ← Date formatée
      objet || null, 
      lot || null, 
      finalDesignation, 
      jsonToStore
    ]);

    console.log('✅ Livraison ajoutée avec succès, ID:', result.insertId);
    
    res.status(201).json({ 
      message: 'Livraison ajoutée avec succès.', 
      id: result.insertId
    });
    
  } catch (err) {
    console.error('❌ Erreur ajout livraison:', err);
    
    if (err.code === 'ER_DUP_ENTRY' && String(err.message).includes('numero_Bordereau')) {
      return res.status(400).json({ error: 'Le numéro de bordereau existe déjà.' });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de la livraison.' });
  }
});

// PUT - Modifier une livraison (VERSION CORRIGÉE)
app.put('/api/livraisons/:id', async (req, res) => {
  try {
    console.log('📥 Données reçues pour modification livraison:', JSON.stringify(req.body, null, 2));
    
    const { id } = req.params;
    const { nom_fournisseur, numero_Bordereau, date_Reception, objet, lot, designation, numero_Serie_list, nomProduit, marque, modele } = req.body;

    // Validation des champs requis
    if (!nom_fournisseur || !numero_Bordereau || !date_Reception) {
      return res.status(400).json({ error: 'nom_fournisseur, numero_Bordereau et date_Reception sont requis.' });
    }

    // CORRECTION : Formater la date pour MySQL (YYYY-MM-DD)
    let formattedDate = date_Reception;
    try {
      const dateObj = new Date(date_Reception);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
      }
    } catch (e) {
      console.error('Erreur formatage date:', e);
    }

    // Construction de la désignation
    let finalDesignation = designation;
    if (!finalDesignation && nomProduit) {
      finalDesignation = [
        nomProduit,
        marque,
        modele
      ].map(s => String(s || '').trim()).filter(Boolean).join(' - ');
    }

    if (!finalDesignation) {
      return res.status(400).json({ error: 'La désignation est requise (soit directement, soit via nomProduit).' });
    }

    // Validation des numéros de série
    let serials = [];
    if (numero_Serie_list) {
      if (Array.isArray(numero_Serie_list)) {
        serials = normalizeSerialsArray(numero_Serie_list);
      } else {
        serials = normalizeSerialsArray(String(numero_Serie_list).split(/, ?|\n/));
      }
    }

    if (serials.length === 0) {
      return res.status(400).json({ error: 'Au moins un numéro de série valide est requis.' });
    }

    // Vérification des doublons de numéros de série
    const toCheck = serials.filter(s => s.toLowerCase() !== 'n/a');
    const existing = await findExistingSerials(toCheck, id);
    if (existing.length) {
      return res.status(400).json({ error: `Le(s) numéro(s) de série ${existing.join(', ')} existe(nt) déjà.` });
    }

    // Récupération de l'ID du fournisseur
    const supplier = await queryAsync(
      'SELECT id_fournisseur FROM Fournisseur WHERE nom = ?', 
      [nom_fournisseur]
    );
    
    if (!supplier.length) {
      return res.status(400).json({ error: `Fournisseur '${nom_fournisseur}' introuvable.` });
    }

    const id_fournisseurs = supplier[0].id_fournisseur;
    const jsonToStore = JSON.stringify(serials);

    // Mise à jour dans la base de données
    const updateSql = `
      UPDATE Livraison 
      SET id_fournisseurs = ?, nom_fournisseur = ?, numero_Bordereau = ?, date_Reception = ?, 
          objet = ?, lot = ?, designation = ?, numero_Serie = ?
      WHERE id_livraison = ?
    `;
    
    const result = await queryAsync(updateSql, [
      id_fournisseurs, 
      nom_fournisseur, 
      numero_Bordereau, 
      formattedDate,  // ← Date formatée
      objet || null, 
      lot || null, 
      finalDesignation, 
      jsonToStore, 
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Livraison non trouvée.' });
    }

    console.log('✅ Livraison modifiée avec succès, ID:', id);
    
    res.json({ 
      message: 'Livraison mise à jour avec succès.'
    });
    
  } catch (err) {
    console.error('❌ Erreur modification livraison:', err);
    
    if (err.code === 'ER_DUP_ENTRY' && String(err.message).includes('numero_Bordereau')) {
      return res.status(400).json({ error: 'Le numéro de bordereau existe déjà.' });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la modification de la livraison.' });
  }
});

// DELETE - Supprimer une livraison
app.delete('/api/livraisons/:id', async (req, res) => {
  try {
    const result = await queryAsync('DELETE FROM Livraison WHERE id_livraison = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Livraison non trouvée.' });
    res.json({ message: 'Livraison supprimée.' });
  } catch (err) {
    console.error('Erreur suppression livraison:', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || String(err.message).includes('a foreign key constraint fails')) {
      return res.status(400).json({
        error: 'Impossible de supprimer cette livraison. Elle est liée à un ou plusieurs produits dans la table Stock et doit être libérée en premier.'
      });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
})

/* ===================== API INVENTAIRE ===================== */
const inventaireRouter = express.Router();

// GET all inventory items
inventaireRouter.get('/', async (req, res) => {
  try {
    const rows = await queryAsync('SELECT id_inventaire, nom_produit, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, date_MiseAJour FROM inventaire ORDER BY date_MiseAJour DESC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error('Erreur récupération inventaire GET /api/inventaire :', error);
    res.status(500).json({ error: error.message });
  }
});

// GET inventory item by product name
inventaireRouter.get('/produit/:nom', async (req, res) => {
  try {
    const rows = await queryAsync('SELECT id_inventaire, nom_produit, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, date_MiseAJour FROM inventaire WHERE nom_produit = ?', [req.params.nom]);
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Erreur récupération inventaire par produit :', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new inventory item
inventaireRouter.post('/', async (req, res) => {
  try {
    const { nom_produit, total_entree = 0, total_attribution = 0, total_sortie = 0, comparaison = 0, variation_mensuelle = 0, variation_annuelle = 0 } = req.body;

    if (!nom_produit) {
      return res.status(400).json({ error: 'nom_produit est requis.' });
    }

    const result = await queryAsync(
      'INSERT INTO inventaire (nom_produit, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, date_MiseAJour) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [nom_produit, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle]
    );

    res.status(201).json({ 
      id_inventaire: result.insertId, 
      nom_produit, 
      total_entree, 
      total_attribution, 
      total_sortie, 
      comparaison, 
      variation_mensuelle, 
      variation_annuelle 
    });
  } catch (error) {
    console.error('Erreur POST inventaire :', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update inventory item - CORRIGÉ : NE MET À JOUR LA DATE QUE SI LES DONNÉES CHANGENT
inventaireRouter.put('/:id', async (req, res) => {
  try {
    const { nom_produit, total_entree = 0, total_attribution = 0, total_sortie = 0, comparaison = 0, variation_mensuelle = 0, variation_annuelle = 0 } = req.body;

    // D'abord, récupérer l'item actuel pour vérifier s'il a changé
    const currentItem = await queryAsync('SELECT * FROM inventaire WHERE id_inventaire = ?', [req.params.id]);
    
    if (!currentItem.length) {
      return res.status(404).json({ error: 'Item inventaire non trouvé.' });
    }

    const item = currentItem[0];
    
    // Vérifier si les données ont réellement changé
    const dataChanged = 
      item.total_entree !== total_entree ||
      item.total_attribution !== total_attribution ||
      item.total_sortie !== total_sortie ||
      item.comparaison !== comparaison;

    // Construire la requête SQL
    let sql, values;
    
    if (dataChanged) {
      // Si les données ont changé, mettre à jour avec la date actuelle
      sql = 'UPDATE inventaire SET nom_produit = ?, total_entree = ?, total_attribution = ?, total_sortie = ?, comparaison = ?, variation_mensuelle = ?, variation_annuelle = ?, date_MiseAJour = NOW() WHERE id_inventaire = ?';
    } else {
      // Si les données n'ont pas changé, NE PAS modifier la date
      sql = 'UPDATE inventaire SET nom_produit = ?, total_entree = ?, total_attribution = ?, total_sortie = ?, comparaison = ?, variation_mensuelle = ?, variation_annuelle = ? WHERE id_inventaire = ?';
    }
    
    values = [nom_produit, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, req.params.id];

    const result = await queryAsync(sql, values);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item inventaire non trouvé.' });
    
    res.json({ 
      message: 'Inventory item updated successfully',
      dataChanged: dataChanged
    });
  } catch (error) {
    console.error('Erreur PUT inventaire :', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update inventory item by product name
inventaireRouter.put('/produit/:nom', async (req, res) => {
  try {
    const { total_entree = 0, total_attribution = 0, total_sortie = 0, comparaison = 0, variation_mensuelle = 0, variation_annuelle = 0 } = req.body;

    // Vérifier si l'item existe
    const existingItem = await queryAsync('SELECT * FROM inventaire WHERE nom_produit = ?', [req.params.nom]);
    
    if (existingItem.length > 0) {
      const item = existingItem[0];
      
      // Vérifier si les données ont changé
      const dataChanged = 
        item.total_entree !== total_entree ||
        item.total_attribution !== total_attribution ||
        item.total_sortie !== total_sortie ||
        item.comparaison !== comparaison;

      let sql, values;
      
      if (dataChanged) {
        // Données changées → mettre à jour la date
        sql = `UPDATE inventaire 
               SET total_entree = ?, total_attribution = ?, total_sortie = ?, comparaison = ?, 
                   variation_mensuelle = ?, variation_annuelle = ?, date_MiseAJour = NOW() 
               WHERE nom_produit = ?`;
      } else {
        // Données identiques → ne pas toucher à la date
        sql = `UPDATE inventaire 
               SET total_entree = ?, total_attribution = ?, total_sortie = ?, comparaison = ?, 
                   variation_mensuelle = ?, variation_annuelle = ?
               WHERE nom_produit = ?`;
      }
      
      values = [total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, req.params.nom];
      
      await queryAsync(sql, values);
    } else {
      // Créer un nouvel item
      await queryAsync(
        'INSERT INTO inventaire (nom_produit, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, date_MiseAJour) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [req.params.nom, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle]
      );
    }

    res.json({ message: 'Inventory item synchronized successfully' });
  } catch (error) {
    console.error('Erreur PUT inventaire par produit :', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE inventory item
inventaireRouter.delete('/:id', async (req, res) => {
  try {
    const result = await queryAsync('DELETE FROM inventaire WHERE id_inventaire = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item inventaire non trouvé.' });
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Erreur DELETE inventaire :', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE all inventory items
inventaireRouter.delete('/', async (req, res) => {
  try {
    await queryAsync('DELETE FROM inventaire');
    res.json({ message: 'All inventory items deleted successfully' });
  } catch (error) {
    console.error('Erreur DELETE ALL inventaire :', error);
    res.status(500).json({ error: error.message });
  }
});

// Monter le router inventaire sur /api/inventaire
app.use('/api/inventaire', inventaireRouter);

// ===================== API DE SYNCHRONISATION CORRIGÉE =====================

// Synchronisation complète : Livraison -> Stocks -> Attribution/Sortie -> Inventaire
app.put('/api/sync/full-sync-from-livraison/:id_livraison', async (req, res) => {
  try {
    const { id_livraison } = req.params;
    const { designation, numero_Serie_list } = req.body;

    // 1. Récupérer la livraison modifiée
    const livraison = await queryAsync(
      'SELECT * FROM Livraison WHERE id_livraison = ?',
      [id_livraison]
    );

    if (!livraison.length) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    // 2. Mettre à jour les produits liés à cette livraison (Stocks)
    const [nomProduit, marque, modele] = designation.split(' - ');
    
    const updatedStocks = await queryAsync(
      `UPDATE Produit SET 
        nomProduit = ?, 
        marque = ?, 
        modele = ?,
        date_MiseAJour = NOW()
       WHERE id_livraison = ?`,
      [nomProduit, marque || null, modele || null, id_livraison]
    );

    // 3. Pour chaque produit mis à jour, synchroniser avec Attribution et Sortie
    const produits = await queryAsync(
      'SELECT id_produit, nomProduit, marque, modele, numeroSerie FROM Produit WHERE id_livraison = ?',
      [id_livraison]
    );

    for (const produit of produits) {
      // Mettre à jour les attributions
      const attributions = await queryAsync('SELECT * FROM Attribution');
      for (const attribution of attributions) {
        try {
          let caracteristique = JSON.parse(attribution.caracteristique_attribution || '[]');
          if (!Array.isArray(caracteristique)) caracteristique = [caracteristique];
          
          let modified = false;
          const updatedCaracteristique = caracteristique.map(item => {
            if (item.id_produit == produit.id_produit) {
              modified = true;
              return { 
                ...item, 
                type: produit.nomProduit, 
                marque: produit.marque, 
                modele: produit.modele, 
                numeroSerie: produit.numeroSerie 
              };
            }
            return item;
          });

          if (modified) {
            await queryAsync(
              'UPDATE Attribution SET caracteristique_attribution = ?, date_attribution = NOW() WHERE id_attribution = ?',
              [JSON.stringify(updatedCaracteristique), attribution.id_attribution]
            );
          }
        } catch (e) {
          console.error('Erreur parsing attribution:', e);
        }
      }

      // Mettre à jour les sorties
      const sorties = await queryAsync('SELECT * FROM Sortie');
      for (const sortie of sorties) {
        try {
          let caracteristique = JSON.parse(sortie.caracteristique_sortie || '[]');
          if (!Array.isArray(caracteristique)) caracteristique = [caracteristique];
          
          let modified = false;
          const updatedCaracteristique = caracteristique.map(item => {
            if (item.id_produit == produit.id_produit) {
              modified = true;
              return { 
                ...item, 
                designation: produit.nomProduit, 
                marque: produit.marque, 
                modele: produit.modele, 
                numeroSerie: produit.numeroSerie 
              };
            }
            return item;
          });

          if (modified) {
            await queryAsync(
              'UPDATE Sortie SET caracteristique_sortie = ?, dateSortie = NOW() WHERE id_sortie = ?',
              [JSON.stringify(updatedCaracteristique), sortie.id_sortie]
            );
          }
        } catch (e) {
          console.error('Erreur parsing sortie:', e);
        }
      }
    }

    // 4. Mettre à jour l'inventaire
    await updateInventaire();

    res.json({ 
      message: 'Synchronisation complète réussie', 
      stocksUpdated: produits.length 
    });
  } catch (error) {
    console.error('Erreur synchronisation complète:', error);
    res.status(500).json({ error: 'Erreur de synchronisation complète' });
  }
});

// Synchronisation depuis Stocks -> Attribution/Sortie -> Inventaire
app.put('/api/sync/from-stocks/:id_produit', async (req, res) => {
  try {
    const { id_produit } = req.params;
    const { nomProduit, marque, modele, numeroSerie } = req.body;

    // 1. Mettre à jour les attributions
    const attributions = await queryAsync('SELECT * FROM Attribution');
    let attributionsUpdated = 0;
    
    for (const attribution of attributions) {
      try {
        let caracteristique = JSON.parse(attribution.caracteristique_attribution || '[]');
        if (!Array.isArray(caracteristique)) caracteristique = [caracteristique];
        
        let modified = false;
        const updatedCaracteristique = caracteristique.map(item => {
          if (item.id_produit == id_produit) {
            modified = true;
            return { 
              ...item, 
              type: nomProduit, 
              marque: marque, 
              modele: modele, 
              numeroSerie: numeroSerie 
            };
          }
          return item;
        });

        if (modified) {
          await queryAsync(
            'UPDATE Attribution SET caracteristique_attribution = ?, date_attribution = NOW() WHERE id_attribution = ?',
            [JSON.stringify(updatedCaracteristique), attribution.id_attribution]
          );
          attributionsUpdated++;
        }
      } catch (e) {
        console.error('Erreur parsing attribution:', e);
      }
    }

    // 2. Mettre à jour les sorties
    const sorties = await queryAsync('SELECT * FROM Sortie');
    let sortiesUpdated = 0;
    
    for (const sortie of sorties) {
      try {
        let caracteristique = JSON.parse(sortie.caracteristique_sortie || '[]');
        if (!Array.isArray(caracteristique)) caracteristique = [caracteristique];
        
        let modified = false;
        const updatedCaracteristique = caracteristique.map(item => {
          if (item.id_produit == id_produit) {
            modified = true;
            return { 
              ...item, 
              designation: nomProduit, 
              marque: marque, 
              modele: modele, 
              numeroSerie: numeroSerie 
            };
          }
          return item;
        });

        if (modified) {
          await queryAsync(
            'UPDATE Sortie SET caracteristique_sortie = ?, dateSortie = NOW() WHERE id_sortie = ?',
            [JSON.stringify(updatedCaracteristique), sortie.id_sortie]
          );
          sortiesUpdated++;
        }
      } catch (e) {
        console.error('Erreur parsing sortie:', e);
      }
    }

    // 3. Mettre à jour l'inventaire
    await updateInventaire();

    res.json({ 
      message: 'Synchronisation depuis stocks réussie',
      attributionsUpdated,
      sortiesUpdated
    });
  } catch (error) {
    console.error('Erreur synchronisation depuis stocks:', error);
    res.status(500).json({ error: 'Erreur de synchronisation depuis stocks' });
  }
});

// Fonction helper pour mettre à jour l'inventaire
async function updateInventaire() {
  try {
    const stocks = await queryAsync('SELECT * FROM Produit');
    const attributions = await queryAsync('SELECT * FROM Attribution');
    const sorties = await queryAsync('SELECT * FROM Sortie');

    const inventoryMap = new Map();

    // Traiter les stocks (entrées)
    stocks.forEach(stock => {
      const nomProduit = stock.nomProduit;
      if (!nomProduit) return;

      if (!inventoryMap.has(nomProduit)) {
        inventoryMap.set(nomProduit, { entree: 0, attribution: 0, sortie: 0 });
      }
      inventoryMap.get(nomProduit).entree++;
    });

    // Traiter les attributions
    attributions.forEach(attribution => {
      try {
        const caracteristique = JSON.parse(attribution.caracteristique_attribution || '[]');
        const items = Array.isArray(caracteristique) ? caracteristique : [caracteristique];
        
        items.forEach(item => {
          const nomProduit = item.type;
          if (!nomProduit) return;

          if (!inventoryMap.has(nomProduit)) {
            inventoryMap.set(nomProduit, { entree: 0, attribution: 0, sortie: 0 });
          }
          inventoryMap.get(nomProduit).attribution++;
        });
      } catch (e) {
        console.error('Erreur processing attribution:', e);
      }
    });

    // Traiter les sorties
    sorties.forEach(sortie => {
      try {
        const caracteristique = JSON.parse(sortie.caracteristique_sortie || '[]');
        const items = Array.isArray(caracteristique) ? caracteristique : [caracteristique];
        
        items.forEach(item => {
          const nomProduit = item.designation;
          if (!nomProduit) return;

          if (!inventoryMap.has(nomProduit)) {
            inventoryMap.set(nomProduit, { entree: 0, attribution: 0, sortie: 0 });
          }
          inventoryMap.get(nomProduit).sortie++;
        });
      } catch (e) {
        console.error('Erreur processing sortie:', e);
      }
    });

    // Mettre à jour la table inventaire
    for (const [nomProduit, data] of inventoryMap.entries()) {
      const comparaison = data.entree - data.attribution - data.sortie;
      
      await queryAsync(
        `INSERT INTO inventaire (nom_produit, total_entree, total_attribution, total_sortie, comparaison, date_MiseAJour)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
           total_entree = ?, 
           total_attribution = ?, 
           total_sortie = ?, 
           comparaison = ?, 
           date_MiseAJour = NOW()`,
        [nomProduit, data.entree, data.attribution, data.sortie, comparaison,
         data.entree, data.attribution, data.sortie, comparaison]
      );
    }
  } catch (error) {
    console.error('Erreur updateInventaire:', error);
    throw error;
  }
}

/* ===================== API ADMINISTRATEURS ===================== */
// GET - Récupérer tous les administrateurs
app.get('/api/administrateurs', (req, res) => {
  const sql = 'SELECT * FROM Authentification ORDER BY nom_complet';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des administrateurs:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// GET - Récupérer un administrateur par ID
app.get('/api/administrateurs/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM Authentification WHERE id_administrateur = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'administrateur:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Administrateur non trouvé' });
    }
    
    res.json(results[0]);
  });
});

// POST - Ajouter un nouvel administrateur
app.post('/api/administrateurs', (req, res) => {
  const { matricule_admin, nom_complet, adresse_email, numero_tel, mot_de_passe } = req.body;
  
  // Validation des champs obligatoires
  if (!matricule_admin || !nom_complet || !mot_de_passe) {
    return res.status(400).json({ 
      error: 'Les champs matricule_admin, nom_complet et mot_de_passe sont obligatoires' 
    });
  }
  
  // Préparer l'email (null si vide)
  const emailValue = adresse_email && adresse_email.trim() !== '' ? adresse_email : null;
  
  const sql = `
    INSERT INTO Authentification 
    (matricule_admin, nom_complet, adresse_email, numero_tel, mot_de_passe) 
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [matricule_admin, nom_complet, emailValue, numero_tel, mot_de_passe], (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'ajout de l\'administrateur:', err);
      
      // Gestion des contraintes d'unicité
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.sqlMessage.includes('matricule_admin')) {
          return res.status(409).json({ error: 'Le matricule administrateur existe déjà' });
        } else if (err.sqlMessage.includes('adresse_email')) {
          return res.status(409).json({ error: 'L\'adresse email existe déjà' });
        }
      }
      
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    res.status(201).json({ 
      message: 'Administrateur ajouté avec succès', 
      id: results.insertId 
    });
  });
});

// PUT - Modifier un administrateur
app.put('/api/administrateurs/:id', (req, res) => {
  const { id } = req.params;
  const { matricule_admin, nom_complet, adresse_email, numero_tel, mot_de_passe } = req.body;
  
  // Validation des champs obligatoires
  if (!matricule_admin || !nom_complet || !mot_de_passe) {
    return res.status(400).json({ 
      error: 'Les champs matricule_admin, nom_complet et mot_de_passe sont obligatoires' 
    });
  }
  
  // Préparer l'email (null si vide)
  const emailValue = adresse_email && adresse_email.trim() !== '' ? adresse_email : null;
  
  const sql = `
    UPDATE Authentification 
    SET matricule_admin = ?, nom_complet = ?, adresse_email = ?, numero_tel = ?, mot_de_passe = ?
    WHERE id_administrateur = ?
  `;
  
  db.query(sql, [matricule_admin, nom_complet, emailValue, numero_tel, mot_de_passe, id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la modification de l\'administrateur:', err);
      
      // Gestion des contraintes d'unicité
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.sqlMessage.includes('matricule_admin')) {
          return res.status(409).json({ error: 'Le matricule administrateur existe déjà' });
        } else if (err.sqlMessage.includes('adresse_email')) {
          return res.status(409).json({ error: 'L\'adresse email existe déjà' });
        }
      }
      
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Administrateur non trouvé' });
    }
    
    res.json({ message: 'Administrateur modifié avec succès' });
  });
});

// DELETE - Supprimer un administrateur
app.delete('/api/administrateurs/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Authentification WHERE id_administrateur = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression de l\'administrateur:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Administrateur non trouvé' });
    }
    
    res.json({ message: 'Administrateur supprimé avec succès' });
  });
});

// DELETE - Supprimer tous les administrateurs
app.delete('/api/administrateurs', (req, res) => {
  const sql = 'DELETE FROM Authentification';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression de tous les administrateurs:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    res.json({ 
      message: `Tous les administrateurs (${results.affectedRows}) ont été supprimés avec succès` 
    });
  });
});

// ===================== API AUTHENTIFICATION =====================
// POST login amélioré — indique si le matricule ou le mot de passe est incorrect
app.post('/api/auth/login', async (req, res) => {
  try {
    const { matricule_admin, mot_de_passe } = req.body;
    if (!matricule_admin || !mot_de_passe) {
      return res.status(400).json({ error: 'matricule_admin et mot_de_passe sont requis.' });
    }

    // 1) Rechercher l'utilisateur par matricule
    const sqlFind = 'SELECT id_administrateur, matricule_admin, nom_complet, adresse_email, numero_tel, mot_de_passe FROM Authentification WHERE matricule_admin = ? LIMIT 1';
    const rows = await queryAsync(sqlFind, [matricule_admin]);

    if (!rows || rows.length === 0) {
      // Matricule introuvable
      return res.status(401).json({ error: 'Matricule inconnu.' });
    }

    const adminRow = rows[0];

    // 2) Vérifier le mot de passe (actuellement en clair, adapter si hashé)
    if (String(adminRow.mot_de_passe) !== String(mot_de_passe)) {
      // Mot de passe incorrect
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Auth OK — construire la réponse
    const admin = {
      id_administrateur: adminRow.id_administrateur,
      matricule_admin: adminRow.matricule_admin,
      nom_complet: adminRow.nom_complet,
      adresse_email: adminRow.adresse_email,
      numero_tel: adminRow.numero_tel
    };

    // Token minimal (base64) conservé pour compatibilité existante
    const tokenPayload = `${admin.id_administrateur}:${admin.matricule_admin}`;
    const token = Buffer.from(tokenPayload).toString('base64');

    res.json({
      message: 'Authentification réussie.',
      admin,
      token
    });
  } catch (err) {
    console.error('Erreur /api/auth/login:', err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'authentification.' });
  }
});


// Optional helper route to validate token client-side (simple)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant.' });
    const token = authHeader.slice(7);
    let decoded = '';
    try {
      decoded = Buffer.from(token, 'base64').toString('utf8');
    } catch (e) {
      return res.status(401).json({ error: 'Token invalide.' });
    }
    const parts = decoded.split(':');
    if (parts.length !== 2) return res.status(401).json({ error: 'Token invalide.' });
    const id = Number(parts[0]);
    const matricule = parts[1];

    const sql = 'SELECT id_administrateur, matricule_admin, nom_complet, adresse_email, numero_tel FROM Authentification WHERE id_administrateur = ? AND matricule_admin = ? LIMIT 1';
    const rows = await queryAsync(sql, [id, matricule]);
    if (!rows.length) return res.status(401).json({ error: 'Token non reconnu.' });

    res.json({ admin: rows[0] });
  } catch (err) {
    console.error('Erreur /api/auth/me:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ===================== API INFO RÉSEAU ===================== */

app.get('/api/network-info', (req, res) => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'localhost';
  
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(netInterface => {
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        localIp = netInterface.address;
      }
    });
  });
  
  res.json({
    ip: localIp,
    viteUrl: `http://${localIp}:5173`,
    apiUrl: `http://${localIp}:3001/api`
  });
});


/* ===================== DÉMARRAGE SERVEUR ===================== */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré et accessible sur http://0.0.0.0:${PORT} (utilisez l'IP de la machine)`);
});
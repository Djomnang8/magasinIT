/* ===================== server.cjs ====================== */
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion DB
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'magasin_it',
  port: 3006,
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion MySQL :', err);
    process.exit(1);
  }
  console.log('✅ Connecté MySQL.');
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

    if (nom_utilisateur && email) {
      const histQuery = 'INSERT INTO historique (nom, email, fonction, direction, localisation, type_action, dates) VALUES (?, ?, ?, ?, ?, ?, ?)';
      const dates = new Date();
      queryAsync(histQuery, [nom_utilisateur, email, fonction || null, direction || null, destination || null, 'sortie', dates])
        .catch(err => console.error('Erreur enregistrement historique sortie:', err));
    }

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
        const p = typeof a.caracteristique_attribution === 'string' ?
          JSON.parse(a.caracteristique_attribution) : a.caracteristique_attribution;
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
// DELETE Attribution
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

/* ===================== API INVENTAIRE CORRIGÉE ===================== */
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

// PUT update inventory item - CORRIGÉ pour mettre à jour la date
inventaireRouter.put('/:id', async (req, res) => {
  try {
    const { nom_produit, total_entree = 0, total_attribution = 0, total_sortie = 0, comparaison = 0, variation_mensuelle = 0, variation_annuelle = 0 } = req.body;

    const result = await queryAsync(
      'UPDATE inventaire SET nom_produit = ?, total_entree = ?, total_attribution = ?, total_sortie = ?, comparaison = ?, variation_mensuelle = ?, variation_annuelle = ?, date_MiseAJour = NOW() WHERE id_inventaire = ?',
      [nom_produit, total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item inventaire non trouvé.' });
    res.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error('Erreur PUT inventaire :', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update inventory item by product name - NOUVELLE ROUTE pour synchronisation
inventaireRouter.put('/produit/:nom', async (req, res) => {
  try {
    const { total_entree = 0, total_attribution = 0, total_sortie = 0, comparaison = 0, variation_mensuelle = 0, variation_annuelle = 0 } = req.body;

    const result = await queryAsync(
      `UPDATE inventaire 
       SET total_entree = ?, total_attribution = ?, total_sortie = ?, comparaison = ?, 
           variation_mensuelle = ?, variation_annuelle = ?, date_MiseAJour = NOW() 
       WHERE nom_produit = ?`,
      [total_entree, total_attribution, total_sortie, comparaison, variation_mensuelle, variation_annuelle, req.params.nom]
    );

    if (result.affectedRows === 0) {
      // Si l'item n'existe pas, le créer
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
      SELECT l.id_livraison, l.id_fournisseurs, l.nom_fournisseur, l.numero_Bordereau, l.date_Reception, l.objet, l.lot, l.designation, l.numero_Serie, l.date_Creation, f.numero_BonCommande
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
// GET - Récupérer une livraison par ID
app.get('/api/livraisons/:id', async (req, res) => {
  try {
    const sql = `
      SELECT l.*, f.numero_BonCommande
      FROM Livraison l
      LEFT JOIN Fournisseur f ON l.id_fournisseurs = f.id_fournisseur
      WHERE l.id_livraison = ?
    `;
    const rows = await queryAsync(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Livraison non trouvée.' });

    const row = rows[0];
    let csv = '';
    const raw = row.numero_Serie;
    if (raw != null) {
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
    row.numero_Serie = csv;

    res.json(row);
  } catch (err) {
    console.error('Erreur récupération livraison:', err);
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
      formattedDate, // ← Date formatée
      objet || null,
      lot || null,
      finalDesignation,
      jsonToStore
    ]);

    console.log('✅ Livraison ajoutée avec succès, ID:', result.insertId);

    // Si des produits sont associés, les insérer dans la table Produit
    if (nomProduit && serials.length > 0) {
      const productInsertSql = `
        INSERT INTO Produit (id_livraison, nomProduit, marque, modele, numeroSerie, statut, date_MiseAJour)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      const productValues = serials.map(serial => [
        result.insertId, // id_livraison de la nouvelle livraison
        nomProduit,
        marque || null,
        modele || null,
        serial,
        'En stock' // Statut initial par défaut
      ]);

      // Exécuter les insertions en série ou utiliser une seule requête multi-valeurs
      for (const vals of productValues) {
        // Ignorer l'insertion pour les numéros de série "N/A" si la DB impose l'unicité
        if (String(vals[4]).toLowerCase() !== 'n/a') {
          try {
            await queryAsync(productInsertSql, vals);
          } catch (productError) {
            if (productError.code === 'ER_DUP_ENTRY') {
              console.warn(`Le produit avec le numéro de série ${vals[4]} existe déjà dans Produit. Ignoré.`);
            } else {
              console.error('Erreur lors de l\'insertion d\'un produit:', productError);
              // Optionnel: Revert la livraison ici si l'insertion de produit est critique
            }
          }
        }
      }
      console.log(`✅ ${productValues.length} produits liés ajoutés/mis à jour dans le stock.`);
    }

    res.status(201).json({ message: 'Livraison ajoutée avec succès.', id: result.insertId });
  } catch (err) {
    console.error('❌ Erreur ajout livraison:', err);
    if (err.code === 'ER_DUP_ENTRY' && String(err.message).includes('numero_Bordereau')) {
      return res.status(400).json({ error: 'Le numéro de bordereau existe déjà.' });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT - Modifier une livraison (VERSION CORRIGÉE)
app.put('/api/livraisons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_fournisseur, numero_Bordereau, date_Reception, objet, lot, designation, numero_Serie_list, nomProduit, marque, modele } = req.body;

    if (!nom_fournisseur || !numero_Bordereau || !date_Reception) {
      return res.status(400).json({ error: 'nom_fournisseur, numero_Bordereau et date_Reception sont requis.' });
    }

    // CORRECTION : Formater la date pour MySQL (YYYY-MM-DD)
    let formattedDate = date_Reception;
    try {
      const dateObj = new Date(date_Reception);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Erreur formatage date:', e);
    }

    // Construction de la désignation (logique identique à POST)
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

    // Validation des numéros de série (logique identique à POST)
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

    // Vérification des doublons de numéros de série, en ignorant ceux de la livraison actuelle
    const toCheck = serials.filter(s => s.toLowerCase() !== 'n/a');
    const existing = await findExistingSerials(toCheck, id);
    if (existing.length) {
      return res.status(400).json({ error: `Le(s) numéro(s) de série ${existing.join(', ')} existe(nt) déjà ailleurs.` });
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

    // Mise à jour de la livraison
    const updateSql = `
      UPDATE Livraison
      SET id_fournisseurs = ?, nom_fournisseur = ?, numero_Bordereau = ?, date_Reception = ?, objet = ?, lot = ?, designation = ?, numero_Serie = ?, date_Creation = NOW()
      WHERE id_livraison = ?
    `;
    const result = await queryAsync(updateSql, [
      id_fournisseurs,
      nom_fournisseur,
      numero_Bordereau,
      formattedDate,
      objet || null,
      lot || null,
      finalDesignation,
      jsonToStore,
      id
    ]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Livraison non trouvée.' });

    // Mise à jour de la table Produit (logique simplifiée: on ne supprime pas les anciens produits de l'ancienne livraison, on met à jour/insère seulement)
    if (nomProduit) {
      // 1. Marquer les produits existants de cette livraison qui ne sont plus dans la liste comme "sortis" ou à reclasser (ou simplement ne rien faire pour éviter la perte de données si déjà attribués)
      // *CETTE LOGIQUE EST OMISE POUR PRÉSERVER LES ÉLÉMENTS DÉJÀ ATTRIBUÉS/SORTIS ET SIMPLIFIER LE CODE*

      // 2. Mettre à jour/Insérer les produits actuels
      const productUpdateInsertSql = `
        INSERT INTO Produit (id_livraison, nomProduit, marque, modele, numeroSerie, statut, date_MiseAJour)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          id_livraison = VALUES(id_livraison),
          nomProduit = VALUES(nomProduit),
          marque = VALUES(marque),
          modele = VALUES(modele),
          date_MiseAJour = NOW()
      `;
      // Note: ON DUPLICATE KEY UPDATE sur numeroSerie nécessite que numeroSerie soit UNIQUE.

      for (const serial of serials) {
        const vals = [
          id, // id_livraison
          nomProduit,
          marque || null,
          modele || null,
          serial,
          'En stock' // Statut
        ];

        // Mettre à jour l'enregistrement existant ou insérer
        try {
          await queryAsync(productUpdateInsertSql, vals);
        } catch (productError) {
          if (productError.code !== 'ER_DUP_ENTRY') {
            console.error('Erreur lors de la mise à jour/insertion d\'un produit:', productError);
          }
        }
      }
      console.log(`✅ ${serials.length} produits liés mis à jour/insérés dans le stock.`);
    }


    res.json({ message: 'Livraison mise à jour.' });
  } catch (err) {
    console.error('❌ Erreur mise à jour livraison:', err);
    if (err.code === 'ER_DUP_ENTRY' && String(err.message).includes('numero_Bordereau')) {
      return res.status(400).json({ error: 'Le numéro de bordereau existe déjà.' });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});


// DELETE - Supprimer une livraison
app.delete('/api/livraisons/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si des produits de cette livraison sont utilisés (attribués/sortis)
    const usedProductIds = await getAllUsedProductIds();
    const productsInDelivery = await queryAsync('SELECT id_produit FROM Produit WHERE id_livraison = ?', [id]);
    const linkedProducts = productsInDelivery.map(p => Number(p.id_produit));

    const overlap = linkedProducts.filter(pid => usedProductIds.has(pid));
    if (overlap.length > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer cette livraison car certains produits associés sont déjà attribués ou sortis.' });
    }

    // Supprimer les produits liés (puisqu'ils ne sont pas utilisés)
    await queryAsync('DELETE FROM Produit WHERE id_livraison = ?', [id]);

    // Supprimer la livraison elle-même
    const result = await queryAsync('DELETE FROM Livraison WHERE id_livraison = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Livraison non trouvée.' });

    res.json({ message: 'Livraison et produits associés non attribués supprimés.' });
  } catch (err) {
    console.error('Erreur suppression livraison:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ===================== API AUTHENTIFICATION ===================== */

app.post('/api/auth/login', async (req, res) => {
  try {
    const { matricule, password } = req.body;
    if (!matricule || !password) return res.status(400).json({ error: 'Matricule et mot de passe requis.' });

    const sql = 'SELECT id_administrateur, matricule_admin, nom_complet, adresse_email, numero_tel FROM Authentification WHERE matricule_admin = ? AND password = ? LIMIT 1';
    const rows = await queryAsync(sql, [matricule, password]);

    if (!rows.length) return res.status(401).json({ error: 'Identifiants invalides.' });

    const admin = rows[0];
    // Création d'un token simple (id + matricule) - NE PAS UTILISER EN PRODUCTION
    const token = `${admin.id_administrateur}:${admin.matricule_admin}`;
    res.json({ token, admin });
  } catch (err) {
    console.error('Erreur /api/auth/login:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token manquant.' });

    const token = authHeader.split(' ')[1] || authHeader;
    const parts = token.split(':');

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

  res.json({ localIp, port: PORT });
});

/* ===================== DÉMARRAGE SERVEUR ===================== */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré et accessible sur http://0.0.0.0:${PORT} (utilisez l'IP de la machine)`);
});
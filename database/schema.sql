-- Création de la base de données
CREATE DATABASE IF NOT EXISTS magasin_it;
USE magasin_it;

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS Fournisseur (
    id_fournisseur INT AUTO_INCREMENT PRIMARY KEY,
    code_Fournisseur VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    localisation VARCHAR(100),
    numero_BonCommande VARCHAR(100) UNIQUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des livraisons
CREATE TABLE IF NOT EXISTS Livraison (
    id_livraison INT AUTO_INCREMENT PRIMARY KEY,
    id_fournisseurs INT NOT NULL,
    nom_fournisseur VARCHAR(100) NOT NULL,
    numero_Bordereau VARCHAR(100) UNIQUE NOT NULL,
    date_Reception DATE NOT NULL,
    objet TEXT,
    lot VARCHAR(100),
    designation TEXT NOT NULL,
    numero_Serie JSON,
    date_Creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_fournisseurs) REFERENCES Fournisseur(id_fournisseur) ON DELETE RESTRICT
);

-- Table des produits (stocks)
CREATE TABLE IF NOT EXISTS Produit (
    id_produit INT AUTO_INCREMENT PRIMARY KEY,
    id_livraison INT NOT NULL,
    nomProduit VARCHAR(100) NOT NULL,
    marque VARCHAR(50),
    modele VARCHAR(50),
    numeroSerie VARCHAR(100) NOT NULL,
    statut ENUM('Neuf','Reformer') DEFAULT 'Neuf',
    numero_etagere VARCHAR(50),
    date_MiseAJour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_livraison) REFERENCES Livraison(id_livraison) ON DELETE RESTRICT,
    UNIQUE KEY unique_numeroSerie (numeroSerie)
);

-- Table des employés
CREATE TABLE IF NOT EXISTS Employe (
    id_employe INT AUTO_INCREMENT PRIMARY KEY,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    nom_complet VARCHAR(100) NOT NULL,
    adresse_email VARCHAR(100) UNIQUE NOT NULL,
    localisation VARCHAR(100),
    direction VARCHAR(100),
    fonction VARCHAR(100),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des attributions
CREATE TABLE IF NOT EXISTS Attribution (
    id_attribution INT AUTO_INCREMENT PRIMARY KEY,
    matricule_employe VARCHAR(50) NOT NULL,
    mode_Utilisation ENUM('INDIVIDUEL', 'UNITÉ', 'PROJET') NOT NULL,
    identification_matériel ENUM('Nouveau', 'Récupération') NOT NULL,
    nom_Machine VARCHAR(100),
    caracteristique_attribution JSON NOT NULL,
    caracteristique_ancien_materiel JSON,
    etatAncienneMachine ENUM('Bon état', 'Cassé', 'En panne'),
    date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matricule_employe) REFERENCES Employe(matricule) ON DELETE RESTRICT
);

-- Table des sorties
CREATE TABLE IF NOT EXISTS Sortie (
    id_sortie INT AUTO_INCREMENT PRIMARY KEY,
    matricule_employe VARCHAR(50) NOT NULL,
    motif TEXT NOT NULL,
    nomChauffeur VARCHAR(100),
    caracteristique_sortie JSON NOT NULL,
    dateSortie DATETIME NOT NULL,
    dateRetour DATETIME,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matricule_employe) REFERENCES Employe(matricule) ON DELETE RESTRICT
);

-- Table d'inventaire (synthèse)
CREATE TABLE IF NOT EXISTS Inventaire (
    id_inventaire INT AUTO_INCREMENT PRIMARY KEY,
    nom_produit VARCHAR(100) NOT NULL UNIQUE,
    total_entree INT DEFAULT 0,
    total_attribution INT DEFAULT 0,
    total_sortie INT DEFAULT 0,
    comparaison INT DEFAULT 0,
    variation_mensuelle DECIMAL(10,2) DEFAULT 0,
    variation_annuelle DECIMAL(10,2) DEFAULT 0,
    date_MiseAJour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table d'authentification des administrateurs
CREATE TABLE IF NOT EXISTS Authentification (
    id_administrateur INT AUTO_INCREMENT PRIMARY KEY,
    matricule_admin VARCHAR(50) UNIQUE NOT NULL,
    nom_complet VARCHAR(100) NOT NULL,
    adresse_email VARCHAR(100) UNIQUE,
    numero_tel VARCHAR(20),
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Index pour améliorer les performances
CREATE INDEX idx_livraison_fournisseur ON Livraison(id_fournisseurs);
CREATE INDEX idx_livraison_date ON Livraison(date_Reception);
CREATE INDEX idx_produit_livraison ON Produit(id_livraison);
CREATE INDEX idx_produit_statut ON Produit(statut);
CREATE INDEX idx_attribution_matricule ON Attribution(matricule_employe);
CREATE INDEX idx_attribution_date ON Attribution(date_attribution);
CREATE INDEX idx_sortie_matricule ON Sortie(matricule_employe);
CREATE INDEX idx_sortie_date ON Sortie(dateSortie);
CREATE INDEX idx_inventaire_nom ON Inventaire(nom_produit);
CREATE INDEX idx_employe_matricule ON Employe(matricule);

-- Insertion d'un administrateur par défaut
INSERT INTO Authentification (matricule_admin, nom_complet, adresse_email, numero_tel, mot_de_passe) 
VALUES ('10', 'Administrateur Principal', 'admin@eneo.cm', '+237 6XX XX XX XX', 'admin123')
ON DUPLICATE KEY UPDATE nom_complet = VALUES(nom_complet);

-- Vue pour les statistiques de stock
CREATE VIEW vue_statistiques_stock AS
SELECT 
    p.statut,
    COUNT(*) as nombre_produits,
    GROUP_CONCAT(DISTINCT p.nomProduit) as produits
FROM Produit p
GROUP BY p.statut;

-- Vue pour le suivi des attributions
CREATE VIEW vue_attributions_completes AS
SELECT 
    a.id_attribution,
    a.matricule_employe,
    e.nom_complet,
    e.fonction,
    e.direction,
    a.mode_Utilisation,
    a.identification_matériel,
    a.nom_Machine,
    a.date_attribution,
    JSON_EXTRACT(a.caracteristique_attribution, '$[*].type') as types_equipements
FROM Attribution a
LEFT JOIN Employe e ON a.matricule_employe = e.matricule;

-- Déclencheur pour mettre à jour automatiquement l'inventaire après une attribution
DELIMITER //
CREATE TRIGGER after_attribution_insert
AFTER INSERT ON Attribution
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE produit_nom VARCHAR(100);
    DECLARE cur CURSOR FOR 
        SELECT JSON_EXTRACT(value, '$.type') 
        FROM JSON_TABLE(NEW.caracteristique_attribution, '$[*]' COLUMNS (value JSON PATH '$')) AS jt;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO produit_nom;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO Inventaire (nom_produit, total_attribution, date_MiseAJour)
        VALUES (produit_nom, 1, NOW())
        ON DUPLICATE KEY UPDATE 
            total_attribution = total_attribution + 1,
            comparaison = total_entree - (total_attribution + 1) - total_sortie,
            date_MiseAJour = NOW();
    END LOOP;
    CLOSE cur;
END//
DELIMITER ;

-- Déclencheur pour mettre à jour l'inventaire après une sortie
DELIMITER //
CREATE TRIGGER after_sortie_insert
AFTER INSERT ON Sortie
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE produit_nom VARCHAR(100);
    DECLARE cur CURSOR FOR 
        SELECT JSON_EXTRACT(value, '$.designation') 
        FROM JSON_TABLE(NEW.caracteristique_sortie, '$[*]' COLUMNS (value JSON PATH '$')) AS jt;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO produit_nom;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO Inventaire (nom_produit, total_sortie, date_MiseAJour)
        VALUES (produit_nom, 1, NOW())
        ON DUPLICATE KEY UPDATE 
            total_sortie = total_sortie + 1,
            comparaison = total_entree - total_attribution - (total_sortie + 1),
            date_MiseAJour = NOW();
    END LOOP;
    CLOSE cur;
END//
DELIMITER ;
/**
 * Serveur Express pour FoodStory
 * Sert les fichiers statiques et gère les données des menus
 * Compatible avec l'environnement serverless Vercel
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MENUS_FILE = path.join(__dirname, 'menus.json');

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging pour déboguer les routes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware de validation pour les routes de plats
app.use('/api/plats/:id/*', (req, res, next) => {
    const platId = parseInt(req.params.id);
    if (isNaN(platId) || platId <= 0) {
        console.error(`❌ [VALIDATION] ID de plat invalide: ${req.params.id}`);
        return res.status(400).json({
            success: false,
            message: 'ID de plat invalide'
        });
    }
    next();
});

// Configuration des fichiers statiques pour Vercel
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Variable globale pour stocker les données en mémoire (fallback pour Vercel)
let donneesMemoire = null;

/**
 * Lit les données des menus depuis le fichier JSON ou la mémoire
 */
async function lireDonneesMenus() {
    try {
        // Essayer de lire depuis le fichier d'abord
        const data = await fs.readFile(MENUS_FILE, 'utf8');
        const donnees = JSON.parse(data);
        
        // Stocker en mémoire comme fallback
        donneesMemoire = donnees;
        
        return donnees;
    } catch (error) {
        console.warn('Impossible de lire le fichier menus.json, utilisation des données en mémoire:', error.message);
        
        // Si on a des données en mémoire, les utiliser
        if (donneesMemoire) {
            return donneesMemoire;
        }
        
        // Sinon, retourner des données par défaut
        const donneesDefaut = {
            menus: {
                actif: {
                    titre: "Menu de cette semaine",
                    periode: "",
                    plats: []
                },
                a_venir: {
                    titre: "Aperçu semaine prochaine", 
                    periode: "",
                    plats: []
                },
                archives: {
                    titre: "Plats archivés",
                    plats: []
                }
            },
            accompagnements: []
        };
        
        donneesMemoire = donneesDefaut;
        return donneesDefaut;
    }
}

/**
 * Écrit les données des menus dans le fichier JSON et en mémoire
 */
async function ecrireDonneesMenus(donnees) {
    try {
        console.log(`💾 [SAUVEGARDE] Début - Données reçues:`, typeof donnees);
        
        // Validation des données
        if (!donnees || typeof donnees !== 'object') {
            console.error(`💾 [SAUVEGARDE] Erreur: Données invalides`);
            return false;
        }
        
        // Toujours stocker en mémoire d'abord
        donneesMemoire = donnees;
        console.log(`💾 [SAUVEGARDE] Données stockées en mémoire`);
        
        // Essayer d'écrire dans le fichier (fonctionnera en local, pas sur Vercel)
        try {
            await fs.writeFile(MENUS_FILE, JSON.stringify(donnees, null, 2), 'utf8');
            console.log(`💾 [SAUVEGARDE] Données sauvegardées dans le fichier et en mémoire`);
        } catch (fileError) {
            console.warn(`💾 [SAUVEGARDE] Impossible d'écrire dans le fichier (normal sur Vercel):`, fileError.message);
        }
        
        return true;
    } catch (error) {
        console.error(`💾 [SAUVEGARDE] Erreur critique:`, error);
        return false;
    }
}

/**
 * Calcule les périodes automatiquement (dimanche à jeudi)
 */
function calculerPeriodes() {
    const maintenant = new Date();
    
    // Trouver le dimanche de cette semaine
    const dimancheActuel = new Date(maintenant);
    dimancheActuel.setDate(maintenant.getDate() - maintenant.getDay());
    
    // Jeudi de cette semaine
    const jeudiActuel = new Date(dimancheActuel);
    jeudiActuel.setDate(dimancheActuel.getDate() + 4);
    
    // Dimanche de la semaine prochaine
    const dimancheProchain = new Date(dimancheActuel);
    dimancheProchain.setDate(dimancheActuel.getDate() + 7);
    
    // Jeudi de la semaine prochaine
    const jeudiProchain = new Date(dimancheProchain);
    jeudiProchain.setDate(dimancheProchain.getDate() + 4);
    
    // Formater les dates avec jour de la semaine
    const jourDimancheActuel = dimancheActuel.toLocaleDateString('fr-FR', { weekday: 'long' });
    const jourJeudiActuel = jeudiActuel.toLocaleDateString('fr-FR', { weekday: 'long' });
    const jourDimancheProchain = dimancheProchain.toLocaleDateString('fr-FR', { weekday: 'long' });
    const jourJeudiProchain = jeudiProchain.toLocaleDateString('fr-FR', { weekday: 'long' });
    
    const jourActuel = dimancheActuel.getDate();
    const jourFinActuel = jeudiActuel.getDate();
    const moisActuel = jeudiActuel.toLocaleDateString('fr-FR', { month: 'long' });
    
    const jourProchain = dimancheProchain.getDate();
    const jourFinProchain = jeudiProchain.getDate();
    const moisProchain = jeudiProchain.toLocaleDateString('fr-FR', { month: 'long' });
    
    // Vérifier si c'est jeudi pour la pilule "dernier jour"
    const aujourdhui = new Date();
    const estJeudi = aujourdhui.getDay() === 4;
    
    return {
        actuelle: `Du ${jourDimancheActuel} ${jourActuel} au ${jourJeudiActuel} ${jourFinActuel} ${moisActuel}`,
        prochaine: `Du ${jourDimancheProchain} ${jourProchain} au ${jourJeudiProchain} ${jourFinProchain} ${moisProchain}`,
        estJeudi: estJeudi
    };
}

/**
 * Trouve un plat dans toutes les catégories
 */
function trouverPlat(donnees, platId) {
    const categories = ['actif', 'a_venir', 'archives'];
    
    for (const categorie of categories) {
        const plat = donnees.menus[categorie].plats.find(p => p.id === platId);
        if (plat) {
            return { plat, categorie };
        }
    }
    
    return null;
}

// Routes API

/**
 * GET /api/status - Route de diagnostic
 */
app.get('/api/status', async (req, res) => {
    try {
        const donneesExistent = donneesMemoire !== null;
        const fichierExiste = await fs.access(MENUS_FILE).then(() => true).catch(() => false);
        
        res.json({
            status: 'OK',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            memoryDataExists: donneesExistent,
            fileExists: fichierExiste,
            platform: process.platform,
            nodeVersion: process.version
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/menus - Récupère tous les menus
 */
app.get('/api/menus', async (req, res) => {
    try {
        const donnees = await lireDonneesMenus();
        
        // Mettre à jour les périodes automatiquement
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        // Trier les plats par ordre d'affichage
        ['actif', 'a_venir', 'archives'].forEach(categorie => {
            if (donnees.menus[categorie] && donnees.menus[categorie].plats) {
                donnees.menus[categorie].plats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));
            }
        });
        
        // Sauvegarder les périodes mises à jour
        await ecrireDonneesMenus(donnees);
        
        res.json(donnees);
    } catch (error) {
        console.error('Erreur GET /api/menus:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des menus',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/menus - Sauvegarde tous les menus
 */
app.post('/api/menus', async (req, res) => {
    try {
        const donnees = req.body;
        
        // Mettre à jour les périodes automatiquement
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ success: true, message: 'Menus sauvegardés avec succès' });
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur POST /api/menus:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde des menus' });
    }
});

/**
 * POST /api/menus/basculer - Bascule les menus
 */
app.post('/api/menus/basculer', async (req, res) => {
    try {
        const donnees = await lireDonneesMenus();
        
        // Sauvegarder l'ancien menu à venir
        const ancienMenuAVenir = { ...donnees.menus.a_venir };
        
        // Le menu à venir devient le menu actuel
        donnees.menus.actif = ancienMenuAVenir;
        donnees.menus.actif.titre = "Menu de cette semaine";
        
        // Créer un nouveau menu à venir vide
        donnees.menus.a_venir = {
            titre: "Aperçu semaine prochaine",
            periode: "",
            plats: []
        };
        
        // Mettre à jour les périodes
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ success: true, message: 'Menus basculés avec succès' });
        } else {
            res.status(500).json({ error: 'Erreur lors du basculement des menus' });
        }
    } catch (error) {
        console.error('Erreur POST /api/menus/basculer:', error);
        res.status(500).json({ error: 'Erreur lors du basculement des menus' });
    }
});

/**
 * POST /api/menus/vider - Vide un menu spécifique
 */
app.post('/api/menus/vider', async (req, res) => {
    try {
        const { categorie } = req.body;
        
        if (!categorie || !['actif', 'a_venir', 'archives'].includes(categorie)) {
            return res.status(400).json({ error: 'Catégorie invalide' });
        }
        
        const donnees = await lireDonneesMenus();
        donnees.menus[categorie].plats = [];
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ success: true, message: `Menu ${categorie} vidé avec succès` });
        } else {
            res.status(500).json({ error: 'Erreur lors du vidage du menu' });
        }
    } catch (error) {
        console.error('Erreur POST /api/menus/vider:', error);
        res.status(500).json({ error: 'Erreur lors du vidage du menu' });
    }
});

/**
 * POST /api/plats - Ajoute un nouveau plat
 */
app.post('/api/plats', async (req, res) => {
    try {
        const { categorie, plat } = req.body;
        const donnees = await lireDonneesMenus();
        
        // Générer un nouvel ID
        const tousLesPlats = [
            ...donnees.menus.actif.plats, 
            ...donnees.menus.a_venir.plats,
            ...donnees.menus.archives.plats
        ];
        const nouvelId = tousLesPlats.length > 0 ? Math.max(...tousLesPlats.map(p => p.id || 0)) + 1 : 1;
        
        // Calculer l'ordre pour le nouveau plat (à la fin)
        const platsCategorie = donnees.menus[categorie].plats;
        const nouvelOrdre = platsCategorie.length > 0 ? Math.max(...platsCategorie.map(p => p.ordre || 0)) + 1 : 1;
        
        // Ajouter le plat avec le nouvel ID et ordre
        const nouveauPlat = { ...plat, id: nouvelId, ordre: nouvelOrdre };
        donnees.menus[categorie].plats.push(nouveauPlat);
        
        // Trier les plats par ordre
        donnees.menus[categorie].plats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));
        
        // Mettre à jour les périodes
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ success: true, plat: nouveauPlat, message: 'Plat ajouté avec succès' });
        } else {
            res.status(500).json({ 
                error: 'Erreur lors de l\'ajout du plat',
                details: 'Échec de la sauvegarde des données'
            });
        }
    } catch (error) {
        console.error('Erreur POST /api/plats:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'ajout du plat',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/plats/:id/archiver - Archive un plat
 * IMPORTANT: Cette route doit être définie AVANT /api/plats/:id
 */
app.post('/api/plats/:id/archiver', async (req, res) => {
    console.log(`🗃️ Archivage du plat ${req.params.id}`);
    try {
        const platId = parseInt(req.params.id);
        const { categorieSource } = req.body;
        const donnees = await lireDonneesMenus();
        
        console.log(`Recherche du plat ${platId} dans la catégorie ${categorieSource}`);
        
        // Trouver le plat dans la catégorie source
        const platIndex = donnees.menus[categorieSource].plats.findIndex(p => p.id === platId);
        
        if (platIndex === -1) {
            console.log(`Plat ${platId} non trouvé dans ${categorieSource}`);
            return res.status(404).json({ error: 'Plat non trouvé' });
        }
        
        // Déplacer le plat vers les archives
        const plat = donnees.menus[categorieSource].plats.splice(platIndex, 1)[0];
        
        // Calculer le nouvel ordre pour les archives
        const platsArchives = donnees.menus.archives.plats;
        const nouvelOrdre = platsArchives.length > 0 ? Math.max(...platsArchives.map(p => p.ordre || 0)) + 1 : 1;
        plat.ordre = nouvelOrdre;
        
        donnees.menus.archives.plats.push(plat);
        
        // Réorganiser les ordres dans la catégorie source
        donnees.menus[categorieSource].plats.forEach((p, index) => {
            p.ordre = index + 1;
        });
        
        console.log(`Plat ${platId} déplacé vers les archives`);
        
        // Mettre à jour les périodes
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ success: true, message: 'Plat archivé avec succès' });
        } else {
            res.status(500).json({ error: 'Erreur lors de l\'archivage du plat' });
        }
    } catch (error) {
        console.error('Erreur POST /api/plats/:id/archiver:', error);
        res.status(500).json({ error: 'Erreur lors de l\'archivage du plat' });
    }
});

/**
 * POST /api/plats/:id/monter - Monter un plat dans l'ordre d'affichage
 */
app.post('/api/plats/:id/monter', async (req, res) => {
    console.log(`🔼 [MONTER] Début - ID: ${req.params.id}, Body:`, req.body);
    try {
        const platId = parseInt(req.params.id);
        const { categorie } = req.body;
        
        console.log(`🔼 [MONTER] Parsed - platId: ${platId}, categorie: ${categorie}`);

        if (!categorie) {
            console.log(`🔼 [MONTER] Erreur: Catégorie manquante`);
            return res.status(400).json({ 
                success: false, 
                message: 'Catégorie requise' 
            });
        }

        console.log(`🔼 [MONTER] Lecture des données...`);
        const donnees = await lireDonneesMenus();
        console.log(`🔼 [MONTER] Données chargées, plats dans ${categorie}:`, donnees.menus[categorie]?.plats?.length || 0);
        
        // Trier les plats par ordre avant manipulation
        donnees.menus[categorie].plats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));
        console.log(`🔼 [MONTER] Plats triés`);
        
        // Trouver l'index du plat
        const platIndex = donnees.menus[categorie].plats.findIndex(p => p.id === platId);
        console.log(`🔼 [MONTER] Index trouvé: ${platIndex}`);
        
        if (platIndex === -1) {
            console.log(`🔼 [MONTER] Erreur: Plat non trouvé`);
            return res.status(404).json({ 
                success: false, 
                message: 'Plat non trouvé' 
            });
        }

        // Vérifier si le plat peut monter (pas déjà en première position)
        if (platIndex === 0) {
            console.log(`🔼 [MONTER] Déjà en première position`);
            return res.json({ 
                success: false, 
                message: 'Le plat est déjà en première position' 
            });
        }

        // Échanger les ordres avec le plat précédent
        const plats = donnees.menus[categorie].plats;
        const ordreActuel = plats[platIndex].ordre;
        const ordrePrecedent = plats[platIndex - 1].ordre;
        
        console.log(`🔼 [MONTER] Échange ordres: ${ordreActuel} <-> ${ordrePrecedent}`);
        
        plats[platIndex].ordre = ordrePrecedent;
        plats[platIndex - 1].ordre = ordreActuel;
        
        // Trier à nouveau après modification
        plats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));
        console.log(`🔼 [MONTER] Plats retriés après échange`);

        // Sauvegarder
        console.log(`🔼 [MONTER] Sauvegarde...`);
        const succes = await ecrireDonneesMenus(donnees);
        console.log(`🔼 [MONTER] Sauvegarde: ${succes ? 'succès' : 'échec'}`);
        
        if (succes) {
            res.json({ 
                success: true, 
                message: 'Plat déplacé vers le haut avec succès'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors du déplacement du plat' });
        }
    } catch (error) {
        console.error('🔼 [MONTER] Erreur catch:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors du déplacement',
            details: error.message
        });
    }
});

/**
 * POST /api/plats/:id/descendre - Descendre un plat dans l'ordre d'affichage
 */
app.post('/api/plats/:id/descendre', async (req, res) => {
    console.log(`🔽 [DESCENDRE] Début - ID: ${req.params.id}, Body:`, req.body);
    try {
        const platId = parseInt(req.params.id);
        const { categorie } = req.body;
        
        console.log(`🔽 [DESCENDRE] Parsed - platId: ${platId}, categorie: ${categorie}`);

        if (!categorie) {
            console.log(`🔽 [DESCENDRE] Erreur: Catégorie manquante`);
            return res.status(400).json({ 
                success: false, 
                message: 'Catégorie requise' 
            });
        }

        console.log(`🔽 [DESCENDRE] Lecture des données...`);
        const donnees = await lireDonneesMenus();
        console.log(`🔽 [DESCENDRE] Données chargées, plats dans ${categorie}:`, donnees.menus[categorie]?.plats?.length || 0);
        
        // Trier les plats par ordre avant manipulation
        donnees.menus[categorie].plats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));
        
        // Trouver l'index du plat
        const platIndex = donnees.menus[categorie].plats.findIndex(p => p.id === platId);
        if (platIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Plat non trouvé' 
            });
        }

        const plats = donnees.menus[categorie].plats;
        
        // Vérifier si le plat peut descendre (pas déjà en dernière position)
        if (platIndex === plats.length - 1) {
            return res.json({ 
                success: false, 
                message: 'Le plat est déjà en dernière position' 
            });
        }

        // Échanger les ordres avec le plat suivant
        const ordreActuel = plats[platIndex].ordre;
        const ordreSuivant = plats[platIndex + 1].ordre;
        
        plats[platIndex].ordre = ordreSuivant;
        plats[platIndex + 1].ordre = ordreActuel;
        
        // Trier à nouveau après modification
        plats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));

        // Sauvegarder
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ 
                success: true, 
                message: 'Plat déplacé vers le bas avec succès'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors du déplacement du plat' });
        }
    } catch (error) {
        console.error('Erreur lors du déplacement du plat:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors du déplacement' 
        });
    }
});

/**
 * POST /api/plats/:id/basculer - Bascule un plat vers une autre catégorie
 * IMPORTANT: Cette route doit être définie AVANT /api/plats/:id
 */
app.post('/api/plats/:id/basculer', async (req, res) => {
    console.log(`🔄 [BASCULER] Début - ID: ${req.params.id}, Body:`, req.body);
    try {
        const platId = parseInt(req.params.id);
        const { categorieSource, categorieDestination } = req.body;
        
        console.log(`🔄 [BASCULER] Parsed - platId: ${platId}, source: ${categorieSource}, dest: ${categorieDestination}`);
        
        if (!categorieSource || !categorieDestination) {
            console.log(`🔄 [BASCULER] Erreur: Paramètres manquants`);
            return res.status(400).json({ 
                success: false, 
                message: 'Catégorie source et destination requises' 
            });
        }
        
        console.log(`🔄 [BASCULER] Lecture des données...`);
        const donnees = await lireDonneesMenus();
        console.log(`🔄 [BASCULER] Données chargées`);
        
        console.log(`🔄 [BASCULER] Basculement: ${categorieSource} → ${categorieDestination} pour le plat ${platId}`);
        
        // Trouver le plat dans la catégorie source
        const platIndex = donnees.menus[categorieSource].plats.findIndex(p => p.id === platId);
        
        if (platIndex === -1) {
            console.log(`Plat ${platId} non trouvé dans ${categorieSource}`);
            return res.status(404).json({ error: 'Plat non trouvé' });
        }
        
        // Déplacer le plat vers la catégorie destination
        const plat = donnees.menus[categorieSource].plats.splice(platIndex, 1)[0];
        
        // Calculer le nouvel ordre pour la destination
        const platsDestination = donnees.menus[categorieDestination].plats;
        const nouvelOrdre = platsDestination.length > 0 ? Math.max(...platsDestination.map(p => p.ordre || 0)) + 1 : 1;
        plat.ordre = nouvelOrdre;
        
        donnees.menus[categorieDestination].plats.push(plat);
        
        // Réorganiser les ordres dans la catégorie source
        donnees.menus[categorieSource].plats.forEach((p, index) => {
            p.ordre = index + 1;
        });
        
        console.log(`Plat ${platId} déplacé de ${categorieSource} vers ${categorieDestination}`);
        
        // Mettre à jour les périodes
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            const nomSource = categorieSource === 'actif' ? 'actuel' : 
                             categorieSource === 'a_venir' ? 'à venir' : 'archives';
            const nomDestination = categorieDestination === 'actif' ? 'actuel' : 
                                  categorieDestination === 'a_venir' ? 'à venir' : 'archives';
            
            res.json({ 
                success: true, 
                message: `Plat basculé du menu ${nomSource} vers le menu ${nomDestination}` 
            });
        } else {
            res.status(500).json({ error: 'Erreur lors du basculement du plat' });
        }
    } catch (error) {
        console.error('Erreur POST /api/plats/:id/basculer:', error);
        res.status(500).json({ error: 'Erreur lors du basculement du plat' });
    }
});

/**
 * PUT /api/plats/:id - Modifie un plat existant
 */
app.put('/api/plats/:id', async (req, res) => {
    try {
        const platId = parseInt(req.params.id);
        const { categorie, plat } = req.body;
        const donnees = await lireDonneesMenus();
        
        // Trouver et modifier le plat
        const platIndex = donnees.menus[categorie].plats.findIndex(p => p.id === platId);
        
        if (platIndex === -1) {
            return res.status(404).json({ error: 'Plat non trouvé' });
        }
        
        donnees.menus[categorie].plats[platIndex] = { ...plat, id: platId };
        
        // Mettre à jour les périodes
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ success: true, message: 'Plat modifié avec succès' });
        } else {
            res.status(500).json({ error: 'Erreur lors de la modification du plat' });
        }
    } catch (error) {
        console.error('Erreur PUT /api/plats:', error);
        res.status(500).json({ error: 'Erreur lors de la modification du plat' });
    }
});

/**
 * DELETE /api/plats/:id - Supprime un plat définitivement
 */
app.delete('/api/plats/:id', async (req, res) => {
    try {
        const platId = parseInt(req.params.id);
        const { categorie } = req.body;
        const donnees = await lireDonneesMenus();
        
        // Supprimer le plat
        const platsAvant = donnees.menus[categorie].plats.length;
        donnees.menus[categorie].plats = donnees.menus[categorie].plats.filter(p => p.id !== platId);
        
        if (donnees.menus[categorie].plats.length === platsAvant) {
            return res.status(404).json({ error: 'Plat non trouvé' });
        }
        
        // Mettre à jour les périodes
        const periodes = calculerPeriodes();
        donnees.menus.actif.periode = periodes.actuelle;
        donnees.menus.a_venir.periode = periodes.prochaine;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ success: true, message: 'Plat supprimé définitivement' });
        } else {
            res.status(500).json({ error: 'Erreur lors de la suppression du plat' });
        }
    } catch (error) {
        console.error('Erreur DELETE /api/plats:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du plat' });
    }
});

// === ROUTES POUR LES ACCOMPAGNEMENTS ===

/**
 * GET /api/accompagnements - Récupère tous les accompagnements
 */
app.get('/api/accompagnements', async (req, res) => {
    try {
        const donnees = await lireDonneesMenus();
        res.json(donnees.accompagnements || []);
    } catch (error) {
        console.error('Erreur GET /api/accompagnements:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des accompagnements' });
    }
});

/**
 * POST /api/accompagnements - Ajoute un nouvel accompagnement
 */
app.post('/api/accompagnements', async (req, res) => {
    try {
        const { nom, emoji } = req.body;
        
        if (!nom || !emoji) {
            return res.status(400).json({ error: 'Nom et emoji requis' });
        }
        
        const donnees = await lireDonneesMenus();
        
        // Initialiser les accompagnements si nécessaire
        if (!donnees.accompagnements) {
            donnees.accompagnements = [];
        }
        
        // Générer un ID unique
        const maxId = donnees.accompagnements.length > 0 
            ? Math.max(...donnees.accompagnements.map(a => a.id || 0))
            : 0;
        
        const nouvelAccompagnement = {
            id: maxId + 1,
            nom: nom.trim(),
            emoji: emoji.trim(),
            actif: true // Par défaut, l'accompagnement est actif
        };
        
        donnees.accompagnements.push(nouvelAccompagnement);
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ 
                success: true, 
                message: 'Accompagnement ajouté avec succès',
                accompagnement: nouvelAccompagnement
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'accompagnement' });
        }
    } catch (error) {
        console.error('Erreur POST /api/accompagnements:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'accompagnement' });
    }
});

/**
 * PUT /api/accompagnements/:id - Modifie un accompagnement existant
 */
app.put('/api/accompagnements/:id', async (req, res) => {
    try {
        const accompagnementId = parseInt(req.params.id);
        const { nom, emoji, actif } = req.body;
        
        if (!nom || !emoji) {
            return res.status(400).json({ error: 'Nom et emoji requis' });
        }
        
        const donnees = await lireDonneesMenus();
        
        if (!donnees.accompagnements) {
            return res.status(404).json({ error: 'Aucun accompagnement trouvé' });
        }
        
        const index = donnees.accompagnements.findIndex(a => a.id === accompagnementId);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Accompagnement non trouvé' });
        }
        
        // Mettre à jour l'accompagnement
        donnees.accompagnements[index] = {
            ...donnees.accompagnements[index],
            nom: nom.trim(),
            emoji: emoji.trim(),
            actif: actif !== undefined ? actif : donnees.accompagnements[index].actif
        };
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ 
                success: true, 
                message: 'Accompagnement modifié avec succès',
                accompagnement: donnees.accompagnements[index]
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la modification de l\'accompagnement' });
        }
    } catch (error) {
        console.error('Erreur PUT /api/accompagnements/:id:', error);
        res.status(500).json({ error: 'Erreur lors de la modification de l\'accompagnement' });
    }
});

/**
 * PUT /api/accompagnements/:id/toggle - Active/désactive un accompagnement
 */
app.put('/api/accompagnements/:id/toggle', async (req, res) => {
    try {
        const accompagnementId = parseInt(req.params.id);
        
        const donnees = await lireDonneesMenus();
        
        if (!donnees.accompagnements) {
            return res.status(404).json({ error: 'Aucun accompagnement trouvé' });
        }
        
        const index = donnees.accompagnements.findIndex(a => a.id === accompagnementId);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Accompagnement non trouvé' });
        }
        
        // Basculer l'état actif
        donnees.accompagnements[index].actif = !donnees.accompagnements[index].actif;
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            const etat = donnees.accompagnements[index].actif ? 'activé' : 'désactivé';
            res.json({ 
                success: true, 
                message: `Accompagnement ${etat} avec succès`,
                accompagnement: donnees.accompagnements[index]
            });
        } else {
            res.status(500).json({ error: 'Erreur lors du changement d\'état de l\'accompagnement' });
        }
    } catch (error) {
        console.error('Erreur PUT /api/accompagnements/:id/toggle:', error);
        res.status(500).json({ error: 'Erreur lors du changement d\'état de l\'accompagnement' });
    }
});

/**
 * DELETE /api/accompagnements/:id - Supprime un accompagnement
 */
app.delete('/api/accompagnements/:id', async (req, res) => {
    try {
        const accompagnementId = parseInt(req.params.id);
        
        const donnees = await lireDonneesMenus();
        
        if (!donnees.accompagnements) {
            return res.status(404).json({ error: 'Aucun accompagnement trouvé' });
        }
        
        const index = donnees.accompagnements.findIndex(a => a.id === accompagnementId);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Accompagnement non trouvé' });
        }
        
        // Supprimer l'accompagnement
        const accompagnementSupprime = donnees.accompagnements.splice(index, 1)[0];
        
        const succes = await ecrireDonneesMenus(donnees);
        
        if (succes) {
            res.json({ 
                success: true, 
                message: 'Accompagnement supprimé avec succès',
                accompagnement: accompagnementSupprime
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'accompagnement' });
        }
    } catch (error) {
        console.error('Erreur DELETE /api/accompagnements/:id:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'accompagnement' });
    }
});

// === ROUTES POUR LES PLATS (spécifiques avant génériques) ===

// Routes pour servir les fichiers HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur FoodStory démarré sur http://localhost:${PORT}`);
    console.log(`📋 Page principale: http://localhost:${PORT}`);
    console.log(`🛠️ Administration: http://localhost:${PORT}/admin.html`);
});

// Export pour Vercel
module.exports = app; 
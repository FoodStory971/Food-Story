/**
 * Fichier principal de l'application FoodStory - Page d'accueil
 * Orchestre l'initialisation et la coordination des services
 */

import { DataService } from './dataService.js';
import { BannerService } from './bannerService.js';
import { MenuRenderer } from './menuRenderer.js';
import { MESSAGES } from './config.js';
import { genererHorairesAffichage } from './utils.js';

/**
 * Classe principale de l'application
 */
class FoodStoryApp {
    constructor() {
        this.dataService = new DataService();
        this.bannerService = new BannerService();
        this.menuRenderer = new MenuRenderer();
    }

    /**
     * Initialise l'application
     */
    async initialiser() {
        try {
            console.log('🚀 Initialisation de FoodStory...');
            
            // Mettre à jour les horaires dans le DOM
            this.mettreAJourHoraires();
            
            // Charger et afficher les données des menus
            await this.chargerEtAfficherMenus();
            
            // Initialiser la bannière dynamique
            this.bannerService.initialiser();
            
            console.log('✅ FoodStory initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.gererErreurInitialisation(error);
        }
    }

    /**
     * Met à jour les horaires dans le DOM à partir de la configuration
     */
    mettreAJourHoraires() {
        const horaires = genererHorairesAffichage();
        
        // Mettre à jour les pilules d'horaires dans le header
        const ligneDetails = document.querySelector('.horaire-ligne-details');
        if (ligneDetails) {
            ligneDetails.innerHTML = `
                <span class="horaire-pilule">${horaires.joursDimanche}</span>
                <span class="horaire-pilule">${horaires.creneauSoir}</span>
                <span class="horaire-pilule">${horaires.joursLundiJeudi}</span>
                <span class="horaire-pilule">${horaires.creneauMidi} & ${horaires.creneauSoir}</span>
            `;
        }
        
        // Mettre à jour le footer
        const footer = document.querySelector('.footer p');
        if (footer) {
            footer.innerHTML = `<br>🕒 ${horaires.horaireComplet}<br>`;
        }
    }

    /**
     * Charge et affiche les menus
     */
    async chargerEtAfficherMenus() {
        try {
            const menusData = await this.dataService.chargerDonnees();
            this.menuRenderer.afficherMenus(menusData);
            console.log('📋 Menus affichés avec succès');
        } catch (error) {
            console.error('Erreur lors du chargement des menus:', error);
            
            // Afficher l'erreur de chargement
            this.menuRenderer.afficherErreurChargement(error.message);
            
            // Optionnel : essayer de charger la structure vide en mode dégradé
            try {
                const donneesVides = this.dataService.chargerDonneesParDefaut();
                this.menuRenderer.afficherMenus(donneesVides);
                this.bannerService.afficherMessageErreur('Mode hors ligne - Impossible de charger les données du serveur');
            } catch (erreurSecondaire) {
                console.error('Erreur lors du chargement de la structure par défaut:', erreurSecondaire);
            }
        }
    }

    /**
     * Affiche un avertissement de connexion
     */
    afficherAvertissementConnexion() {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="message info">
                    <strong>ℹ️ Mode hors ligne</strong><br>
                    Impossible de se connecter au serveur. Affichage des données par défaut.
                    <button onclick="window.location.reload()" style="margin-left: 10px; padding: 5px 10px; border: none; border-radius: 5px; background: #007bff; color: white; cursor: pointer;">
                        🔄 Réessayer
                    </button>
                </div>
            `;
        }
    }

    /**
     * Masque le message d'erreur
     */
    masquerMessageErreur() {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }

    /**
     * Gère les erreurs d'initialisation
     * @param {Error} error - Erreur survenue
     */
    gererErreurInitialisation(error) {
        console.error('Erreur d\'initialisation:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="message error">
                    <strong>⚠️ Erreur de chargement</strong><br>
                    Une erreur est survenue lors du chargement de l'application.
                    <button onclick="window.location.reload()" style="margin-left: 10px; padding: 5px 10px; border: none; border-radius: 5px; background: #dc3545; color: white; cursor: pointer;">
                        🔄 Recharger la page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Rafraîchit les données depuis le serveur
     */
    async rafraichirDonnees() {
        try {
            console.log('🔄 Rafraîchissement des données...');
            await this.chargerEtAfficherMenus();
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        }
    }

    /**
     * Nettoie les ressources avant fermeture
     */
    nettoyer() {
        this.bannerService.arreter();
        console.log('🧹 Ressources nettoyées');
    }
}

// Instance globale de l'application
let appInstance = null;

/**
 * Démarre l'application
 */
async function demarrerApplication() {
    if (appInstance) {
        console.warn('Application déjà démarrée');
        return;
    }
    
    appInstance = new FoodStoryApp();
    await appInstance.initialiser();
}

/**
 * Arrête l'application
 */
function arreterApplication() {
    if (appInstance) {
        appInstance.nettoyer();
        appInstance = null;
        console.log('🛑 Application arrêtée');
    }
}

/**
 * Rafraîchit les données de l'application
 */
async function rafraichirApplication() {
    if (appInstance) {
        await appInstance.rafraichirDonnees();
    }
}

// Démarrage automatique quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrerApplication);
} else {
    demarrerApplication();
}

// Nettoyage avant fermeture de la page
window.addEventListener('beforeunload', arreterApplication);

// Rendre la fonction de rafraîchissement disponible globalement
window.rafraichirApplication = rafraichirApplication;

// Export pour utilisation externe
export { demarrerApplication, arreterApplication, rafraichirApplication }; 
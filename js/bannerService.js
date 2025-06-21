/**
 * Service de gestion de la bannière dynamique ouvert/fermé
 * Responsable de l'affichage du statut d'ouverture en temps réel
 */

import { DATA_CONFIG, MESSAGES } from './config.js';
import { verifierStatutOuverture } from './utils.js';

/**
 * Classe de gestion de la bannière de statut
 */
export class BannerService {
    constructor() {
        this.intervalId = null;
        this.elementsDOM = this.obtenirElementsDOM();
    }

    /**
     * Obtient les références aux éléments DOM de la bannière
     * @returns {Object} Références aux éléments DOM
     */
    obtenirElementsDOM() {
        return {
            statusText: document.getElementById('statusText'),
            phoneNumber: document.getElementById('phoneNumber')
        };
    }

    /**
     * Initialise la bannière et démarre la mise à jour automatique
     * @param {number} intervalleMs - Intervalle de mise à jour en millisecondes (défaut: 60000)
     */
    initialiser(intervalleMs = 60000) {
        this.mettreAJourStatut();
        this.intervalId = setInterval(() => this.mettreAJourStatut(), intervalleMs);
    }

    /**
     * Arrête la mise à jour automatique de la bannière
     */
    arreter() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Met à jour le statut d'ouverture de la bannière
     */
    mettreAJourStatut() {
        if (!this.elementsDOM.statusText || !this.elementsDOM.phoneNumber) {
            console.warn('Éléments DOM de la bannière non trouvés');
            return;
        }

        const statutOuverture = verifierStatutOuverture();
        
        if (statutOuverture.estOuvert) {
            this.afficherStatutOuvert();
        } else {
            this.afficherStatutFerme(statutOuverture.estJourOuvert);
        }
    }

    /**
     * Affiche le statut "ouvert" avec le numéro de téléphone
     */
    afficherStatutOuvert() {
        this.elementsDOM.statusText.textContent = MESSAGES.OUVERT;
        this.elementsDOM.statusText.style.color = '#90EE90';
        
        this.elementsDOM.phoneNumber.style.display = 'block';
        this.elementsDOM.phoneNumber.textContent = DATA_CONFIG.FALLBACK_PHONE;
        this.elementsDOM.phoneNumber.style.fontSize = '2rem';
        this.elementsDOM.phoneNumber.style.animation = 'pulse 2s infinite';
    }

    /**
     * Affiche le statut "fermé" avec le message approprié
     * @param {boolean} estJourOuvert - Indique si c'est un jour d'ouverture
     */
    afficherStatutFerme(estJourOuvert) {
        this.elementsDOM.statusText.textContent = MESSAGES.FERME;
        this.elementsDOM.statusText.style.color = '#FFB6C1';
        
        this.elementsDOM.phoneNumber.style.display = 'block';
        this.elementsDOM.phoneNumber.textContent = estJourOuvert ? 
            MESSAGES.HORAIRES_FERME : 
            MESSAGES.HORAIRES_WEEKEND;
        this.elementsDOM.phoneNumber.style.fontSize = '1.2rem';
        this.elementsDOM.phoneNumber.style.animation = 'none';
    }

    /**
     * Force une mise à jour immédiate du statut
     */
    forcerMiseAJour() {
        this.mettreAJourStatut();
    }

    /**
     * Vérifie si la bannière est active
     * @returns {boolean} True si la bannière est active
     */
    estActive() {
        return this.intervalId !== null;
    }
} 
/**
 * Service de rendu des menus pour l'affichage
 * Responsable de la génération et mise à jour de l'interface utilisateur
 */

import { creerElementPlat } from './utils.js';

/**
 * Classe de rendu des menus
 */
export class MenuRenderer {
    constructor() {
        this.elementsDOM = this.obtenirElementsDOM();
    }

    /**
     * Obtient les références aux éléments DOM des menus
     * @returns {Object} Références aux éléments DOM
     */
    obtenirElementsDOM() {
        return {
            // Menu actuel
            titreActuel: document.getElementById('titre-actuel'),
            periodeActuel: document.getElementById('periode-actuel'),
            platsActuels: document.getElementById('plats-actuels'),
            
            // Menu à venir
            titreAVenir: document.getElementById('titre-a-venir'),
            periodeAVenir: document.getElementById('periode-a-venir'),
            platsAVenir: document.getElementById('plats-a-venir'),
            
            // Accompagnements
            accompagnementsContainer: document.getElementById('accompagnements-container')
        };
    }

    /**
     * Affiche tous les menus avec les données fournies
     * @param {Object} menusData - Données complètes des menus
     */
    afficherMenus(menusData) {
        console.log('Affichage des menus:', menusData);
        
        this.afficherMenuActuel(menusData.menus.actif);
        this.afficherMenuAVenir(menusData.menus.a_venir);
        this.afficherAccompagnements(menusData.accompagnements);
    }

    /**
     * Affiche le menu actuel
     * @param {Object} menuActuel - Données du menu actuel
     */
    afficherMenuActuel(menuActuel) {
        const container = document.getElementById('plats-actuels');
        if (!container) return;

        const platsHTML = menuActuel.plats && menuActuel.plats.length > 0 
            ? menuActuel.plats.map(plat => this.genererCartePlat(plat, false)).join('')
            : this.genererEtatVide('📋', 'Aucun plat dans le menu actuel', 'Les plats seront bientôt ajoutés par l\'équipe.');

        container.innerHTML = platsHTML;
        
        // Mettre à jour les titres et périodes
        const titreElement = document.getElementById('titre-actuel');
        const periodePilules = document.getElementById('periode-pilules-actuel');
        
        if (titreElement) {
            titreElement.textContent = `${menuActuel.titre}`;
        }
        if (periodePilules) {
            periodePilules.innerHTML = this.genererPilulesPeriode(menuActuel.periode, true);
        }
    }

    /**
     * Affiche le menu à venir
     * @param {Object} menuAVenir - Données du menu à venir
     */
    afficherMenuAVenir(menuAVenir) {
        const container = document.getElementById('plats-a-venir');
        if (!container) return;

        const platsHTML = menuAVenir.plats && menuAVenir.plats.length > 0 
            ? menuAVenir.plats.map(plat => this.genererCartePlat(plat, true)).join('')
            : this.genererEtatVide('🔮', 'Menu à venir en préparation', 'Nos chefs préparent de délicieuses surprises pour la semaine prochaine !');

        container.innerHTML = platsHTML;
        
        // Mettre à jour les titres et périodes
        const titreElement = document.getElementById('titre-a-venir');
        const periodePilules = document.getElementById('periode-pilules-a-venir');
        
        if (titreElement) {
            titreElement.textContent = `${menuAVenir.titre}`;
        }
        if (periodePilules) {
            periodePilules.innerHTML = this.genererPilulesPeriode(menuAVenir.periode, false);
        }
    }

    /**
     * Génère l'HTML d'une carte de plat pour la page index
     * @param {Object} plat - Données du plat
     * @param {boolean} estPreview - Si c'est un plat en preview (à venir)
     * @returns {string} HTML de la carte
     */
    genererCartePlat(plat, estPreview = false) {
        const classePreview = estPreview ? 'preview' : '';
        
        return `
            <div class="menu-item ${classePreview}">
                <h3>${plat.emoji || '🍽️'} ${plat.nom}</h3>
                <p class="description">${plat.description}</p>
                <div class="price">${plat.prix}</div>
            </div>
        `;
    }

    /**
     * Affiche les plats dans un conteneur donné
     * @param {HTMLElement} conteneur - Conteneur DOM pour les plats
     * @param {Array} plats - Liste des plats à afficher
     * @param {string} categorie - Catégorie du menu ('actif' ou 'a_venir')
     */
    afficherPlats(conteneur, plats, categorie) {
        conteneur.innerHTML = '';
        
        if (!plats || plats.length === 0) {
            this.afficherMessageVide(conteneur, categorie);
            return;
        }

        plats.forEach(plat => {
            const platElement = creerElementPlat(plat, categorie, false);
            conteneur.appendChild(platElement);
        });
    }

    /**
     * Affiche un message quand aucun plat n'est disponible
     * @param {HTMLElement} conteneur - Conteneur DOM
     * @param {string} categorie - Catégorie du menu
     */
    afficherMessageVide(conteneur, categorie) {
        const message = categorie === 'actif' ? 
            'Aucun plat disponible' : 
            'Aucun plat prévu';
            
        conteneur.innerHTML = `
            <div style="text-align: center; color: #999; padding: 20px;">
                ${message}
            </div>
        `;
    }

    /**
     * Affiche les accompagnements
     * @param {Array} accompagnements - Liste des accompagnements
     */
    afficherAccompagnements(accompagnements) {
        if (!this.elementsDOM.accompagnementsContainer) {
            console.warn('Conteneur des accompagnements non trouvé');
            return;
        }

        this.elementsDOM.accompagnementsContainer.innerHTML = '';
        
        if (!accompagnements || accompagnements.length === 0) {
            return;
        }

        const accompagnementsHTML = this.genererAccompagnements(accompagnements);
        this.elementsDOM.accompagnementsContainer.innerHTML = accompagnementsHTML;
    }

    /**
     * Génère l'HTML pour la section des accompagnements
     * @param {Array} accompagnements - Liste des accompagnements
     * @returns {string} HTML des accompagnements
     */
    genererAccompagnements(accompagnements) {
        if (!accompagnements || accompagnements.length === 0) {
            return '';
        }

        // Filtrer seulement les accompagnements actifs
        const accompagnementsActifs = accompagnements.filter(acc => acc.actif === true);
        
        if (accompagnementsActifs.length === 0) {
            return '';
        }

        const accompagnementsHTML = accompagnementsActifs
            .map(acc => `
                <span class="accompagnement-pilule">
                    ${acc.emoji} ${acc.nom}
                </span>
            `)
            .join('');

        return `
            <div class="accompagnements-discrete">
                <span class="accompagnements-label">Accompagnements :</span>
                <div class="accompagnements-pilules">
                    ${accompagnementsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Met à jour uniquement un menu spécifique
     * @param {string} categorie - Catégorie du menu ('actif' ou 'a_venir')
     * @param {Object} donneesMenu - Données du menu à mettre à jour
     */
    mettreAJourMenu(categorie, donneesMenu) {
        if (categorie === 'actif') {
            this.afficherMenuActuel(donneesMenu);
        } else if (categorie === 'a_venir') {
            this.afficherMenuAVenir(donneesMenu);
        }
    }

    /**
     * Vérifie si tous les éléments DOM nécessaires sont présents
     * @returns {boolean} True si tous les éléments sont présents
     */
    verifierElementsDOM() {
        const elements = Object.values(this.elementsDOM);
        return elements.every(element => element !== null);
    }

    /**
     * Génère l'HTML pour un état vide
     * @param {string} icone - Icône à afficher
     * @param {string} titre - Titre du message
     * @param {string} description - Description du message
     * @returns {string} HTML de l'état vide
     */
    genererEtatVide(icone, titre, description) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icone}</div>
                <div class="empty-state-title">${titre}</div>
                <div class="empty-state-description">${description}</div>
            </div>
        `;
    }

    /**
     * Affiche un message d'erreur de chargement
     * @param {string} messageErreur - Message d'erreur à afficher
     */
    afficherErreurChargement(messageErreur) {
        const containers = ['plats-actuels', 'plats-a-venir'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="message error">
                        <h3>❌ Erreur de chargement</h3>
                        <p>${messageErreur}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            🔄 Recharger la page
                        </button>
                    </div>
                `;
            }
        });
    }

    /**
     * Génère les pilules de période
     * @param {string} periode - Texte de la période
     * @param {boolean} estMenuActuel - Si c'est le menu actuel (pour "Tout fait maison")
     * @returns {string} HTML des pilules
     */
    genererPilulesPeriode(periode, estMenuActuel) {
        let pilules = [];
        
        // Pilule de période
        if (periode) {
            pilules.push(`<span class="periode-pilule">${periode}</span>`);
        }
        
        // Pilule "Tout fait maison" pour le menu actuel
        if (estMenuActuel) {
            pilules.push(`<span class="periode-pilule fait-maison">🏠 Tout fait maison !</span>`);
            
            // Vérifier si c'est jeudi pour ajouter "dernier jour"
            const aujourdhui = new Date();
            const estJeudi = aujourdhui.getDay() === 4;
            
            if (estJeudi) {
                pilules.push(`<span class="periode-pilule dernier-jour">⏰ Dernier jour</span>`);
            }
        }
        
        return `<div class="periode-pilules">${pilules.join('')}</div>`;
    }
} 
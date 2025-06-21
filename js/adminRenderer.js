/**
 * Service de rendu pour l'interface d'administration
 * Responsable de l'affichage et de la gestion des éléments visuels de l'admin
 */

import { ADMIN_CONFIG, MESSAGES } from './config.js';

/**
 * Classe de rendu pour l'administration
 */
export class AdminRenderer {
    constructor() {
        this.modal = null;
        this.configurerModal();
    }

    /**
     * Affiche les menus dans l'interface d'administration
     * @param {Object} menusData - Données des menus
     */
    afficherMenus(menusData) {
        this.configurerModal();
        this.configurerModalAccompagnement();
        
        this.afficherApercuAccompagnements(menusData.accompagnements || []);
        this.afficherMenuActuel(menusData.menus.actif);
        this.afficherMenuAVenir(menusData.menus.a_venir);
        this.afficherMenuArchives(menusData.menus.archives);
    }

    /**
     * Affiche l'aperçu discret des accompagnements actifs
     * @param {Array} accompagnements - Liste des accompagnements
     */
    afficherApercuAccompagnements(accompagnements) {
        const container = document.getElementById('accompagnements-apercu');
        if (!container) return;

        // Générer le bouton d'ajout
        let accompagnementsHTML = `
            <div class="accompagnement-pilule-admin add-pilule" onclick="ouvrirModalAccompagnement()">
                ➕ Ajouter
            </div>
        `;

        if (accompagnements && accompagnements.length > 0) {
            // Ajouter tous les accompagnements (actifs et inactifs) avec leurs boutons
            accompagnementsHTML += accompagnements
                .map(acc => `
                    <div class="accompagnement-pilule-admin ${acc.actif ? 'actif' : 'inactif'}">
                        <span class="pilule-content">
                            ${acc.emoji} ${acc.nom}
                        </span>
                        <div class="pilule-actions">
                            <button class="btn-pilule btn-toggle ${acc.actif ? 'btn-desactiver' : 'btn-activer'}" 
                                    onclick="toggleAccompagnement(${acc.id})" 
                                    title="${acc.actif ? 'Désactiver' : 'Activer'}">
                                ${acc.actif ? '👁️' : '🙈'}
                            </button>
                            <button class="btn-pilule btn-modifier" 
                                    onclick="modifierAccompagnement(${acc.id})" 
                                    title="Modifier">
                                ✏️
                            </button>
                            <button class="btn-pilule btn-supprimer" 
                                    onclick="supprimerAccompagnement(${acc.id})" 
                                    title="Supprimer">
                                🗑️
                            </button>
                        </div>
                    </div>
                `)
                .join('');
        }

        container.innerHTML = `
            <div class="accompagnements-pilules-admin">
                ${accompagnementsHTML}
            </div>
        `;
    }

    /**
     * Affiche le menu actuel
     * @param {Object} menuActuel - Données du menu actuel
     */
    afficherMenuActuel(menuActuel) {
        const container = document.getElementById('menu-actif');
        if (!container) return;

        const platsHTML = menuActuel.plats && menuActuel.plats.length > 0 
            ? menuActuel.plats.map(plat => this.genererCartePlat(plat, 'actif')).join('')
            : this.genererEtatVide('📋', 'Menu actuel vide', 'Ajoutez des plats pour commencer.');

        container.innerHTML = platsHTML;
    }

    /**
     * Affiche le menu à venir
     * @param {Object} menuAVenir - Données du menu à venir
     */
    afficherMenuAVenir(menuAVenir) {
        const container = document.getElementById('menu-a-venir');
        if (!container) return;

        const platsHTML = menuAVenir.plats && menuAVenir.plats.length > 0 
            ? menuAVenir.plats.map(plat => this.genererCartePlat(plat, 'a_venir')).join('')
            : this.genererEtatVide('🔮', 'Menu à venir vide', 'Préparez les plats de la semaine prochaine.');

        container.innerHTML = platsHTML;
    }

    /**
     * Affiche le menu des archives
     * @param {Object} menuArchives - Données du menu archives
     */
    afficherMenuArchives(menuArchives) {
        const container = document.getElementById('menu-archives');
        if (!container) return;

        const platsHTML = menuArchives.plats && menuArchives.plats.length > 0 
            ? menuArchives.plats.map(plat => this.genererCartePlat(plat, 'archives')).join('')
            : this.genererEtatVide('📦', 'Aucun plat archivé', 'Les plats archivés apparaîtront ici.');

        container.innerHTML = platsHTML;
    }

    /**
     * Génère l'HTML d'une carte de plat avec les boutons appropriés
     * @param {Object} plat - Données du plat
     * @param {string} categorie - Catégorie du menu
     * @returns {string} HTML de la carte
     */
    genererCartePlat(plat, categorie) {
        const boutons = this.genererBoutonsPlat(plat.id, categorie);
        
        return `
            <div class="plat-card">
                <div class="plat-header">
                    <span class="plat-emoji">${plat.emoji || '🍽️'}</span>
                    <h3 class="plat-nom">${plat.nom}</h3>
                </div>
                <p class="plat-description">${plat.description}</p>
                <div class="plat-footer">
                    <span class="plat-prix">${plat.prix}</span>
                    <div class="plat-actions">
                        ${boutons}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Génère les boutons d'action selon la catégorie du plat
     * @param {number} platId - ID du plat
     * @param {string} categorie - Catégorie du menu
     * @returns {string} HTML des boutons
     */
    genererBoutonsPlat(platId, categorie) {
        switch (categorie) {
            case 'actif':
                return `
                    <button class="btn-action btn-modifier" onclick="modifierPlat(${platId}, '${categorie}')" title="Modifier le plat">
                        ✏️
                    </button>
                    <button class="btn-action btn-monter" onclick="monterPlat(${platId}, '${categorie}')" title="Monter dans l'ordre d'affichage">
                        ⬆️
                    </button>
                    <button class="btn-action btn-descendre" onclick="descendrePlat(${platId}, '${categorie}')" title="Descendre dans l'ordre d'affichage">
                        ⬇️
                    </button>
                    <button class="btn-action btn-basculer-avenir" onclick="basculerPlat(${platId}, '${categorie}', 'a_venir')" title="Basculer vers le menu à venir">
                        ⏭️
                    </button>
                    <button class="btn-action btn-archiver" onclick="archiverPlat(${platId}, '${categorie}')" title="Archiver le plat">
                        📦
                    </button>
                `;
            
            case 'a_venir':
                return `
                    <button class="btn-action btn-modifier" onclick="modifierPlat(${platId}, '${categorie}')" title="Modifier le plat">
                        ✏️
                    </button>
                    <button class="btn-action btn-monter" onclick="monterPlat(${platId}, '${categorie}')" title="Monter dans l'ordre d'affichage">
                        ⬆️
                    </button>
                    <button class="btn-action btn-descendre" onclick="descendrePlat(${platId}, '${categorie}')" title="Descendre dans l'ordre d'affichage">
                        ⬇️
                    </button>
                    <button class="btn-action btn-basculer-actuel" onclick="basculerPlat(${platId}, '${categorie}', 'actif')" title="Basculer vers le menu actuel">
                        ⏮️
                    </button>
                    <button class="btn-action btn-archiver" onclick="archiverPlat(${platId}, '${categorie}')" title="Archiver le plat">
                        📦
                    </button>
                `;
            
            case 'archives':
                return `
                    <button class="btn-action btn-modifier" onclick="modifierPlat(${platId}, '${categorie}')" title="Modifier le plat">
                        ✏️
                    </button>
                    <button class="btn-action btn-basculer-actuel" onclick="basculerPlat(${platId}, '${categorie}', 'actif')" title="Basculer vers le menu actuel">
                        📋
                    </button>
                    <button class="btn-action btn-basculer-avenir" onclick="basculerPlat(${platId}, '${categorie}', 'a_venir')" title="Basculer vers le menu à venir">
                        🔮
                    </button>
                    <button class="btn-action btn-supprimer" onclick="supprimerPlat(${platId}, '${categorie}')" title="Supprimer définitivement">
                        🗑️
                    </button>
                `;
            
            default:
                return '';
        }
    }

    /**
     * Génère le bouton d'ajout de plat
     * @param {string} categorie - Catégorie du menu
     * @returns {string} HTML du bouton d'ajout
     */
    genererBoutonAjout(categorie) {
        const icone = categorie === 'actif' ? '📋' : 
                     categorie === 'a_venir' ? '🔮' : '📦';
        
        return `
            <div class="plat-card plat-add" onclick="ouvrirModal('${categorie}')">
                <div class="add-content">
                    <span class="add-icon">${icone}</span>
                    <span class="add-text">Ajouter un plat</span>
                </div>
            </div>
        `;
    }

    /**
     * Configure le modal
     */
    configurerModal() {
        this.modal = document.getElementById('modal-plat');
        if (!this.modal) {
            console.error('Modal non trouvé dans le DOM');
            return;
        }

        // Fermer le modal en cliquant sur l'overlay
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.fermerModal();
            }
        });

        // Fermer avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.fermerModal();
            }
        });
    }

    /**
     * Configure les événements du modal
     * @param {Function} onSubmit - Callback de soumission
     * @param {Function} onClose - Callback de fermeture
     */
    configurerEvenementsModal(onSubmit, onClose) {
        const form = document.getElementById('form-plat');
        const btnFermer = document.getElementById('btn-fermer-modal');
        const btnAnnuler = document.getElementById('btn-annuler');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const donnees = {
                    nom: formData.get('nom'),
                    emoji: formData.get('emoji'),
                    description: formData.get('description'),
                    prix: formData.get('prix'),
                    categorie: formData.get('categorie'),
                    platId: formData.get('platId') || null
                };
                onSubmit(donnees);
            });
        }

        if (btnFermer) {
            btnFermer.addEventListener('click', () => {
                this.fermerModal();
                onClose();
            });
        }

        if (btnAnnuler) {
            btnAnnuler.addEventListener('click', () => {
                this.fermerModal();
                onClose();
            });
        }
    }

    /**
     * Ouvre le modal en mode ajout
     * @param {string} categorie - Catégorie du menu
     */
    ouvrirModalAjout(categorie) {
        if (!this.modal) return;

        // Réinitialiser le formulaire
        const form = document.getElementById('form-plat');
        if (form) form.reset();

        // Configurer pour l'ajout
        document.getElementById('modal-titre').textContent = 'Ajouter un plat';
        document.getElementById('btn-submit').textContent = 'Ajouter le plat';
        document.getElementById('categorie').value = categorie;
        document.getElementById('platId').value = '';

        this.modal.style.display = 'flex';
        document.getElementById('nom').focus();
    }

    /**
     * Ouvre le modal en mode modification
     * @param {Object} plat - Données du plat à modifier
     * @param {string} categorie - Catégorie du menu
     */
    ouvrirModalModification(plat, categorie) {
        if (!this.modal) return;

        // Remplir le formulaire avec les données du plat
        document.getElementById('nom').value = plat.nom;
        document.getElementById('emoji').value = plat.emoji;
        document.getElementById('description').value = plat.description;
        document.getElementById('prix').value = plat.prix;
        document.getElementById('categorie').value = categorie;
        document.getElementById('platId').value = plat.id;

        // Configurer pour la modification
        document.getElementById('modal-titre').textContent = 'Modifier le plat';
        document.getElementById('btn-submit').textContent = 'Modifier le plat';

        this.modal.style.display = 'flex';
        document.getElementById('nom').focus();
    }

    /**
     * Ferme le modal
     */
    fermerModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    /**
     * Affiche un message de succès
     * @param {string} message - Message à afficher
     */
    afficherSucces(message) {
        this.afficherMessage(message, 'success');
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message - Message à afficher
     */
    afficherErreur(message) {
        this.afficherMessage(message, 'error');
    }

    /**
     * Affiche un message temporaire
     * @param {string} message - Message à afficher
     * @param {string} type - Type de message ('success', 'error', 'info')
     */
    afficherMessage(message, type = 'info') {
        // Supprimer les anciens messages
        const ancienMessage = document.querySelector('.message-temporaire');
        if (ancienMessage) {
            ancienMessage.remove();
        }

        // Créer le nouveau message
        const messageElement = document.createElement('div');
        messageElement.className = `message message-temporaire ${type}`;
        messageElement.textContent = message;

        // Ajouter au début du body
        document.body.insertBefore(messageElement, document.body.firstChild);

        // Supprimer automatiquement après 3 secondes
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    /**
     * Nettoie les ressources du renderer
     */
    nettoyer() {
        // Nettoyer les événements si nécessaire
        console.log('🧹 AdminRenderer nettoyé');
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
        const containers = ['menu-actif', 'menu-a-venir', 'menu-archives'];
        
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

    // === MÉTHODES POUR LES ACCOMPAGNEMENTS ===

    /**
     * Génère l'HTML pour une carte d'accompagnement
     * @param {Object} accompagnement - Données de l'accompagnement
     * @returns {string} HTML de la carte
     */
    genererCarteAccompagnement(accompagnement) {
        const etatClass = accompagnement.actif ? 'actif' : 'inactif';
        const etatTexte = accompagnement.actif ? 'Affiché sur le site' : 'Masqué du site';
        const etatIcon = accompagnement.actif ? '👁️' : '🙈';
        
        return `
            <div class="accompagnement-card ${etatClass}">
                <div class="accompagnement-header">
                    <span class="accompagnement-emoji">${accompagnement.emoji}</span>
                    <h3 class="accompagnement-nom">${accompagnement.nom}</h3>
                    <div class="accompagnement-etat">
                        <span class="etat-icon">${etatIcon}</span>
                        <span class="etat-texte">${etatTexte}</span>
                    </div>
                </div>
                <div class="accompagnement-actions">
                    <button class="btn-action btn-modifier" onclick="modifierAccompagnement(${accompagnement.id})" title="Modifier l'accompagnement">
                        ✏️
                    </button>
                    <button class="btn-action btn-toggle ${accompagnement.actif ? 'btn-desactiver' : 'btn-activer'}" 
                            onclick="toggleAccompagnement(${accompagnement.id})" 
                            title="${accompagnement.actif ? 'Masquer du site' : 'Afficher sur le site'}">
                        ${accompagnement.actif ? '🙈' : '👁️'}
                    </button>
                    <button class="btn-action btn-supprimer" onclick="supprimerAccompagnement(${accompagnement.id})" title="Supprimer l'accompagnement">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Configure le modal des accompagnements
     */
    configurerModalAccompagnement() {
        this.modalAccompagnement = document.getElementById('modal-accompagnement');
        if (!this.modalAccompagnement) {
            console.error('Modal accompagnement non trouvé dans le DOM');
            return;
        }

        // Fermer le modal en cliquant sur l'overlay
        this.modalAccompagnement.addEventListener('click', (e) => {
            if (e.target === this.modalAccompagnement) {
                this.fermerModalAccompagnement();
            }
        });

        // Fermer avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalAccompagnement.style.display === 'flex') {
                this.fermerModalAccompagnement();
            }
        });
    }

    /**
     * Configure les événements du modal des accompagnements
     * @param {Function} onSubmit - Callback de soumission
     * @param {Function} onClose - Callback de fermeture
     */
    configurerEvenementsModalAccompagnement(onSubmit, onClose) {
        const form = document.getElementById('form-accompagnement');
        const btnFermer = document.getElementById('btn-fermer-modal-accompagnement');
        const btnAnnuler = document.getElementById('btn-annuler-accompagnement');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const donnees = {
                    nom: formData.get('nom'),
                    emoji: formData.get('emoji'),
                    accompagnementId: formData.get('accompagnementId') || null
                };
                onSubmit(donnees);
            });
        }

        if (btnFermer) {
            btnFermer.addEventListener('click', () => {
                this.fermerModalAccompagnement();
                onClose();
            });
        }

        if (btnAnnuler) {
            btnAnnuler.addEventListener('click', () => {
                this.fermerModalAccompagnement();
                onClose();
            });
        }
    }

    /**
     * Ouvre le modal en mode ajout d'accompagnement
     */
    ouvrirModalAccompagnementAjout() {
        if (!this.modalAccompagnement) return;

        // Réinitialiser le formulaire
        const form = document.getElementById('form-accompagnement');
        if (form) form.reset();

        // Configurer pour l'ajout
        document.getElementById('modal-accompagnement-titre').textContent = 'Ajouter un accompagnement';
        document.getElementById('btn-submit-accompagnement').textContent = 'Ajouter l\'accompagnement';
        document.getElementById('accompagnement-id').value = '';

        this.modalAccompagnement.style.display = 'flex';
        document.getElementById('accompagnement-nom').focus();
    }

    /**
     * Ouvre le modal en mode modification d'accompagnement
     * @param {Object} accompagnement - Données de l'accompagnement à modifier
     */
    ouvrirModalAccompagnementModification(accompagnement) {
        if (!this.modalAccompagnement) return;

        // Remplir le formulaire avec les données de l'accompagnement
        document.getElementById('accompagnement-nom').value = accompagnement.nom;
        document.getElementById('accompagnement-emoji').value = accompagnement.emoji;
        document.getElementById('accompagnement-id').value = accompagnement.id;

        // Configurer pour la modification
        document.getElementById('modal-accompagnement-titre').textContent = 'Modifier l\'accompagnement';
        document.getElementById('btn-submit-accompagnement').textContent = 'Modifier l\'accompagnement';

        this.modalAccompagnement.style.display = 'flex';
        document.getElementById('accompagnement-nom').focus();
    }

    /**
     * Ferme le modal des accompagnements
     */
    fermerModalAccompagnement() {
        if (this.modalAccompagnement) {
            this.modalAccompagnement.style.display = 'none';
        }
    }
} 
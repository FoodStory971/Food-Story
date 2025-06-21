/**
 * Interface d'administration pour FoodStory
 * Gestion des plats et accompagnements
 */

import { DataService } from './dataService.js';
import { AdminRenderer } from './adminRenderer.js';
import { ModalEnhancements } from './modalEnhancements.js';

// Variables globales
let dataService;
let adminRenderer;
let modalEnhancements;
let isAuthenticated = false;

// Mot de passe d'administration (codé en dur pour micro sécurité)
const MOT_DE_PASSE_ADMIN = 'Lucien971';

// Initialisation de l'authentification
document.addEventListener('DOMContentLoaded', () => {
    configurerAuthentification();
});

/**
 * Configure le système d'authentification
 */
function configurerAuthentification() {
    const formAuth = document.getElementById('form-authentification');
    const champMotDePasse = document.getElementById('mot-de-passe');
    const erreurAuth = document.getElementById('erreur-auth');
    
    if (!formAuth || !champMotDePasse) {
        console.error('Éléments d\'authentification non trouvés');
        return;
    }

    // Focus automatique sur le champ mot de passe
    champMotDePasse.focus();

    // Gestion de la soumission du formulaire
    formAuth.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const motDePasse = champMotDePasse.value.trim();
        
        if (motDePasse === MOT_DE_PASSE_ADMIN) {
            // Authentification réussie
            authentificationReussie();
        } else {
            // Mot de passe incorrect
            afficherErreurAuthentification();
            champMotDePasse.value = '';
            champMotDePasse.focus();
        }
    });

    // Masquer l'erreur quand l'utilisateur commence à taper
    champMotDePasse.addEventListener('input', () => {
        if (erreurAuth.style.display !== 'none') {
            erreurAuth.style.display = 'none';
        }
    });
}

/**
 * Affiche l'erreur d'authentification
 */
function afficherErreurAuthentification() {
    const erreurAuth = document.getElementById('erreur-auth');
    if (erreurAuth) {
        erreurAuth.style.display = 'block';
        
        // Animation de secousse
        erreurAuth.style.animation = 'none';
        setTimeout(() => {
            erreurAuth.style.animation = 'shake 0.5s ease-in-out';
        }, 10);
    }
}

/**
 * Gère l'authentification réussie
 */
async function authentificationReussie() {
    isAuthenticated = true;
    
    const modalAuth = document.getElementById('modal-authentification');
    const contenuAdmin = document.getElementById('contenu-admin');
    
    console.log('Authentification réussie');
    console.log('Modal auth trouvé:', !!modalAuth);
    console.log('Contenu admin trouvé:', !!contenuAdmin);
    
    if (modalAuth && contenuAdmin) {
        console.log('Masquage du modal et affichage du contenu...');
        
        // Masquer le modal avec la classe CSS
        modalAuth.classList.add('hidden');
        
        // Afficher le contenu admin
        contenuAdmin.style.display = 'block';
        contenuAdmin.style.opacity = '1';
        contenuAdmin.classList.add('authenticated');
        
        console.log('Contenu admin affiché, initialisation...');
        
        // Initialiser l'application
        try {
            await initialiserApplicationAdmin();
            console.log('Application initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            afficherMessage('Erreur lors du chargement de l\'interface', 'error');
        }
    } else {
        console.error('Éléments non trouvés - Modal:', !!modalAuth, 'Contenu:', !!contenuAdmin);
    }
}

/**
 * Initialisation de l'application d'administration (après authentification)
 */
async function initialiserApplicationAdmin() {
    try {
        // Initialiser les services
        dataService = new DataService();
        adminRenderer = new AdminRenderer();
        modalEnhancements = new ModalEnhancements();

        // Exposer globalement pour les fonctions onclick
        window.dataService = dataService;
        window.adminRenderer = adminRenderer;
        window.modalEnhancements = modalEnhancements;

        // Configurer les événements du modal des plats
        adminRenderer.configurerEvenementsModal(
            async (donnees) => {
                const succes = donnees.platId 
                    ? await modifierPlatExistant(donnees.platId, donnees)
                    : await ajouterNouveauPlat(donnees);
                
                if (succes) {
                    adminRenderer.fermerModal();
                    await rafraichirInterface();
                }
            },
            () => {
                // Callback de fermeture - rien à faire
            }
        );

        // Configurer les événements du modal des accompagnements
        adminRenderer.configurerEvenementsModalAccompagnement(
            async (donnees) => {
                const succes = donnees.accompagnementId 
                    ? await modifierAccompagnementExistant(donnees.accompagnementId, donnees)
                    : await ajouterNouvelAccompagnement(donnees);
                
                if (succes) {
                    adminRenderer.fermerModalAccompagnement();
                    await rafraichirInterface();
                }
            },
            () => {
                // Callback de fermeture - rien à faire
            }
        );

        // Configurer les suggestions d'emojis pour les accompagnements
        modalEnhancements.configurerSuggestionsEmojis('accompagnement-emoji', 'accompagnement-emoji-suggestions', 'accompagnements');

        // Charger et afficher les données initiales
        await rafraichirInterface();
        
        console.log('Interface d\'administration initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        afficherMessage('Erreur lors du chargement de l\'interface d\'administration', 'error');
    }
}

// === FONCTIONS UTILITAIRES ===

/**
 * Rafraîchit l'interface complète
 */
async function rafraichirInterface() {
    try {
        const menusData = await dataService.chargerDonnees();
        adminRenderer.afficherMenus(menusData);
    } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        afficherMessage('Erreur lors du rafraîchissement de l\'interface', 'error');
    }
}

/**
 * Affiche un message temporaire
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message (success, error, warning, info)
 */
function afficherMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type} message-temporaire`;
    messageDiv.textContent = message;

    container.appendChild(messageDiv);

    // Supprimer le message après 5 secondes
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// === FONCTIONS GLOBALES POUR LES PLATS ===

/**
 * Ouvre le modal pour ajouter un plat
 * @param {string} categorie - Catégorie du menu
 */
window.ouvrirModal = function(categorie) {
    adminRenderer.ouvrirModalAjout(categorie);
    modalEnhancements.configurerSuggestionsEmojis('emoji', 'emoji-suggestions');
    modalEnhancements.configurerFormatagePrix('prix');
};

/**
 * Modifie un plat existant
 * @param {number} id - ID du plat
 * @param {string} categorie - Catégorie du plat
 */
window.modifierPlat = async function(id, categorie) {
    try {
        const resultat = dataService.trouverPlat(id);
        if (!resultat) {
            afficherMessage('Plat non trouvé', 'error');
            return;
        }

        adminRenderer.ouvrirModalModification(resultat.plat, resultat.categorie);
        modalEnhancements.configurerSuggestionsEmojis('emoji', 'emoji-suggestions');
        modalEnhancements.configurerFormatagePrix('prix');
    } catch (error) {
        console.error('Erreur lors de la modification du plat:', error);
        afficherMessage('Erreur lors de la modification du plat', 'error');
    }
};

/**
 * Supprime un plat
 * @param {number} id - ID du plat
 * @param {string} categorie - Catégorie du plat
 */
window.supprimerPlat = async function(id, categorie) {
    try {
        const resultat = dataService.trouverPlat(id);
        if (!resultat) {
            afficherMessage('Plat non trouvé', 'error');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer le plat "${resultat.plat.nom}" ?\n\nCette action est irréversible.`)) {
            const succes = await dataService.supprimerPlat(resultat.categorie, id);
            if (succes) {
                afficherMessage('Plat supprimé avec succès', 'success');
                await rafraichirInterface();
            } else {
                afficherMessage('Erreur lors de la suppression du plat', 'error');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        afficherMessage('Erreur lors de la suppression du plat', 'error');
    }
};

/**
 * Archive un plat
 * @param {number} id - ID du plat
 * @param {string} categorieSource - Catégorie source
 */
window.archiverPlat = async function(id, categorieSource) {
    try {
        const succes = await dataService.archiverPlat(categorieSource, id);
        if (succes) {
            afficherMessage('Plat archivé avec succès', 'success');
            await rafraichirInterface();
        } else {
            afficherMessage('Erreur lors de l\'archivage du plat', 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
        afficherMessage('Erreur lors de l\'archivage du plat', 'error');
    }
};

/**
 * Bascule un plat vers une autre catégorie
 * @param {number} id - ID du plat
 * @param {string} categorieSource - Catégorie source du plat
 * @param {string} categorieDestination - Catégorie de destination
 */
window.basculerPlat = async function(id, categorieSource, categorieDestination) {
    try {
        const succes = await dataService.basculerPlat(categorieSource, categorieDestination, id);
        if (succes) {
            afficherMessage('Plat basculé avec succès', 'success');
            await rafraichirInterface();
        } else {
            afficherMessage('Erreur lors du basculement du plat', 'error');
        }
    } catch (error) {
        console.error('Erreur lors du basculement:', error);
        afficherMessage('Erreur lors du basculement du plat', 'error');
    }
};

/**
 * Vide un menu après confirmation
 * @param {string} categorie - Catégorie du menu à vider
 */
window.viderMenu = async function(categorie) {
    const nomCategorie = categorie === 'actif' ? 'actuel' : 
                       categorie === 'a_venir' ? 'à venir' : 'archives';
    
    if (!confirm(`Êtes-vous sûr de vouloir vider le menu ${nomCategorie} ?\n\nCette action supprimera tous les plats.`)) {
        return;
    }

    try {
        const succes = await dataService.viderMenu(categorie);
        if (succes) {
            afficherMessage(`Menu ${nomCategorie} vidé avec succès`, 'success');
            await rafraichirInterface();
        } else {
            afficherMessage(`Erreur lors du vidage du menu ${nomCategorie}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du vidage:', error);
        afficherMessage(`Erreur lors du vidage du menu ${nomCategorie}`, 'error');
    }
};

/**
 * Monte un plat dans l'ordre d'affichage
 * @param {number} id - ID du plat
 * @param {string} categorie - Catégorie du plat
 */
window.monterPlat = async function(id, categorie) {
    try {
        const succes = await dataService.monterPlat(categorie, id);
        if (succes) {
            afficherMessage('Plat déplacé vers le haut', 'success');
            await rafraichirInterface();
        } else {
            afficherMessage('Impossible de déplacer le plat (déjà en première position)', 'warning');
        }
    } catch (error) {
        console.error('Erreur lors du déplacement:', error);
        afficherMessage('Erreur lors du déplacement du plat', 'error');
    }
};

/**
 * Descend un plat dans l'ordre d'affichage
 * @param {number} id - ID du plat
 * @param {string} categorie - Catégorie du plat
 */
window.descendrePlat = async function(id, categorie) {
    try {
        const succes = await dataService.descendrePlat(categorie, id);
        if (succes) {
            afficherMessage('Plat déplacé vers le bas', 'success');
            await rafraichirInterface();
        } else {
            afficherMessage('Impossible de déplacer le plat (déjà en dernière position)', 'warning');
        }
    } catch (error) {
        console.error('Erreur lors du déplacement:', error);
        afficherMessage('Erreur lors du déplacement du plat', 'error');
    }
};

// === FONCTIONS GLOBALES POUR LES ACCOMPAGNEMENTS ===

/**
 * Ouvre le modal pour ajouter un accompagnement
 */
window.ouvrirModalAccompagnement = function() {
    adminRenderer.ouvrirModalAccompagnementAjout();
    modalEnhancements.configurerSuggestionsEmojis('accompagnement-emoji', 'accompagnement-emoji-suggestions', 'accompagnements');
};

/**
 * Modifie un accompagnement existant
 * @param {number} id - ID de l'accompagnement
 */
window.modifierAccompagnement = async function(id) {
    try {
        const accompagnement = dataService.trouverAccompagnement(id);
        if (!accompagnement) {
            afficherMessage('Accompagnement non trouvé', 'error');
            return;
        }

        adminRenderer.ouvrirModalAccompagnementModification(accompagnement);
        modalEnhancements.configurerSuggestionsEmojis('accompagnement-emoji', 'accompagnement-emoji-suggestions', 'accompagnements');
    } catch (error) {
        console.error('Erreur lors de la modification de l\'accompagnement:', error);
        afficherMessage('Erreur lors de la modification de l\'accompagnement', 'error');
    }
};

/**
 * Active/désactive un accompagnement
 * @param {number} id - ID de l'accompagnement
 */
window.toggleAccompagnement = async function(id) {
    try {
        const accompagnement = dataService.trouverAccompagnement(id);
        if (!accompagnement) {
            afficherMessage('Accompagnement non trouvé', 'error');
            return;
        }

        const succes = await dataService.toggleAccompagnement(id);
        if (succes) {
            const etat = accompagnement.actif ? 'désactivé' : 'activé';
            afficherMessage(`Accompagnement ${etat} avec succès`, 'success');
            await rafraichirInterface();
        } else {
            afficherMessage('Erreur lors du changement d\'état de l\'accompagnement', 'error');
        }
    } catch (error) {
        console.error('Erreur lors du changement d\'état:', error);
        afficherMessage('Erreur lors du changement d\'état de l\'accompagnement', 'error');
    }
};

/**
 * Supprime un accompagnement
 * @param {number} id - ID de l'accompagnement
 */
window.supprimerAccompagnement = async function(id) {
    try {
        const accompagnement = dataService.trouverAccompagnement(id);
        if (!accompagnement) {
            afficherMessage('Accompagnement non trouvé', 'error');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer l'accompagnement "${accompagnement.nom}" ?\n\nCette action est irréversible.`)) {
            const succes = await dataService.supprimerAccompagnement(id);
            if (succes) {
                afficherMessage('Accompagnement supprimé avec succès', 'success');
                await rafraichirInterface();
            } else {
                afficherMessage('Erreur lors de la suppression de l\'accompagnement', 'error');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        afficherMessage('Erreur lors de la suppression de l\'accompagnement', 'error');
    }
};

// === FONCTIONS INTERNES ===

/**
 * Ajoute un nouveau plat
 * @param {Object} donnees - Données du formulaire
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function ajouterNouveauPlat(donnees) {
    try {
        const plat = {
            nom: donnees.nom,
            emoji: donnees.emoji,
            description: donnees.description,
            prix: donnees.prix
        };

        const succes = await dataService.ajouterPlat(donnees.categorie, plat);
        if (succes) {
            afficherMessage('Plat ajouté avec succès', 'success');
            return true;
        } else {
            afficherMessage('Erreur lors de l\'ajout du plat', 'error');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        afficherMessage('Erreur lors de l\'ajout du plat', 'error');
        return false;
    }
}

/**
 * Modifie un plat existant
 * @param {number} id - ID du plat
 * @param {Object} donnees - Nouvelles données
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function modifierPlatExistant(id, donnees) {
    try {
        // Trouver le plat et sa catégorie
        const resultat = dataService.trouverPlat(id);
        if (!resultat) {
            afficherMessage('Plat non trouvé', 'error');
            return false;
        }

        const plat = {
            nom: donnees.nom,
            emoji: donnees.emoji,
            description: donnees.description,
            prix: donnees.prix
        };

        const succes = await dataService.modifierPlat(resultat.categorie, id, plat);
        if (succes) {
            afficherMessage('Plat modifié avec succès', 'success');
            return true;
        } else {
            afficherMessage('Erreur lors de la modification du plat', 'error');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la modification:', error);
        afficherMessage('Erreur lors de la modification du plat', 'error');
        return false;
    }
}

/**
 * Modifie un accompagnement existant
 * @param {number} id - ID de l'accompagnement
 * @param {Object} donnees - Nouvelles données
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function modifierAccompagnementExistant(id, donnees) {
    try {
        const succes = await dataService.modifierAccompagnement(id, {
            nom: donnees.nom,
            emoji: donnees.emoji
        });

        if (succes) {
            afficherMessage('Accompagnement modifié avec succès', 'success');
            return true;
        } else {
            afficherMessage('Erreur lors de la modification de l\'accompagnement', 'error');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la modification:', error);
        afficherMessage('Erreur lors de la modification de l\'accompagnement', 'error');
        return false;
    }
}

/**
 * Ajoute un nouvel accompagnement
 * @param {Object} donnees - Données de l'accompagnement
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function ajouterNouvelAccompagnement(donnees) {
    try {
        const accompagnement = await dataService.ajouterAccompagnement({
            nom: donnees.nom,
            emoji: donnees.emoji
        });

        if (accompagnement) {
            afficherMessage('Accompagnement ajouté avec succès', 'success');
            return true;
        } else {
            afficherMessage('Erreur lors de l\'ajout de l\'accompagnement', 'error');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        afficherMessage('Erreur lors de l\'ajout de l\'accompagnement', 'error');
        return false;
    }
} 
/**
 * Service de gestion des données pour FoodStory
 * Responsable de la communication avec l'API serveur pour les données des menus
 */

import { DATA_CONFIG, DEFAULT_DATA, MESSAGES } from './config.js';
import { calculerPeriodes, genererNouvelId } from './utils.js';

/**
 * Classe de gestion des données des menus via API
 */
export class DataService {
    constructor() {
        this.menusData = {};
        this.nextId = 1;
        this.baseUrl = window.location.origin; // URL du serveur
    }

    /**
     * Charge les données depuis l'API serveur
     * @returns {Promise<Object>} Données des menus chargées
     */
    async chargerDonnees() {
        try {
            console.log('Chargement des données depuis l\'API...');
            const response = await fetch(`${this.baseUrl}/api/menus`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            this.menusData = await response.json();
            this.validerStructureDonnees();
            this.calculerProchainId();
            
            console.log('Données chargées avec succès depuis l\'API');
            return this.menusData;
        } catch (error) {
            console.error('Erreur lors du chargement depuis l\'API:', error);
            // Ne plus charger automatiquement les données par défaut
            // Laisser la gestion d'erreur au niveau supérieur
            throw new Error(`${MESSAGES.ERREUR_CHARGEMENT}: ${error.message}`);
        }
    }

    /**
     * Charge les données par défaut (structure vide)
     * @returns {Object} Données par défaut
     */
    chargerDonneesParDefaut() {
        console.log('Chargement de la structure par défaut (vide)...');
        this.menusData = JSON.parse(JSON.stringify(DEFAULT_DATA));
        const periodes = calculerPeriodes();
        this.menusData.menus.actif.periode = periodes.actuel;
        this.menusData.menus.a_venir.periode = periodes.aVenir;
        
        // Ajouter la section archives si elle n'existe pas
        if (!this.menusData.menus.archives) {
            this.menusData.menus.archives = {
                titre: "Plats archivés",
                plats: []
            };
        }
        
        this.calculerProchainId();
        return this.menusData;
    }

    /**
     * Valide la structure des données chargées
     * @throws {Error} Si la structure est invalide
     */
    validerStructureDonnees() {
        if (!this.menusData || 
            !this.menusData.menus || 
            !this.menusData.menus.actif || 
            !this.menusData.menus.a_venir) {
            throw new Error('Structure de données invalide');
        }
        
        // Ajouter la section archives si elle n'existe pas
        if (!this.menusData.menus.archives) {
            this.menusData.menus.archives = {
                titre: "Plats archivés",
                plats: []
            };
        }
    }

    /**
     * Calcule le prochain ID disponible
     */
    calculerProchainId() {
        const platsActifs = this.menusData.menus.actif.plats || [];
        const platsAVenir = this.menusData.menus.a_venir.plats || [];
        const platsArchives = this.menusData.menus.archives.plats || [];
        this.nextId = genererNouvelId(platsActifs, platsAVenir, platsArchives);
    }

    /**
     * Sauvegarde les données via l'API
     * @returns {Promise<boolean>} Succès de la sauvegarde
     */
    async sauvegarderDonnees() {
        try {
            const response = await fetch(`${this.baseUrl}/api/menus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.menusData)
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Données sauvegardées:', result.message);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }

    /**
     * Obtient les données des menus
     * @returns {Object} Données complètes des menus
     */
    obtenirDonnees() {
        return this.menusData;
    }

    /**
     * Ajoute un nouveau plat à un menu via l'API
     * @param {string} categorie - Catégorie du menu ('actif', 'a_venir' ou 'archives')
     * @param {Object} donneesPlat - Données du plat à ajouter
     * @returns {Promise<Object>} Plat ajouté avec son ID
     */
    async ajouterPlat(categorie, donneesPlat) {
        try {
            const response = await fetch(`${this.baseUrl}/api/plats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categorie: categorie,
                    plat: {
                        nom: donneesPlat.nom,
                        emoji: donneesPlat.emoji,
                        description: donneesPlat.description,
                        prix: donneesPlat.prix
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // Mettre à jour les données locales
            this.menusData.menus[categorie].plats.push(result.plat);
            this.calculerProchainId();
            
            console.log('Plat ajouté:', result.message);
            return result.plat;
        } catch (error) {
            console.error('Erreur lors de l\'ajout du plat:', error);
            throw error;
        }
    }

    /**
     * Modifie un plat existant via l'API
     * @param {string} categorie - Catégorie du menu
     * @param {number} id - ID du plat à modifier
     * @param {Object} nouvellesDonnees - Nouvelles données du plat
     * @returns {Promise<boolean>} Succès de la modification
     */
    async modifierPlat(categorie, id, nouvellesDonnees) {
        try {
            const response = await fetch(`${this.baseUrl}/api/plats/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categorie: categorie,
                    plat: {
                        nom: nouvellesDonnees.nom,
                        emoji: nouvellesDonnees.emoji,
                        description: nouvellesDonnees.description,
                        prix: nouvellesDonnees.prix
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // Mettre à jour les données locales
            const platIndex = this.menusData.menus[categorie].plats.findIndex(p => p.id === id);
            if (platIndex !== -1) {
                this.menusData.menus[categorie].plats[platIndex] = {
                    id: id,
                    nom: nouvellesDonnees.nom,
                    emoji: nouvellesDonnees.emoji,
                    description: nouvellesDonnees.description,
                    prix: nouvellesDonnees.prix
                };
            }
            
            console.log('Plat modifié:', result.message);
            return true;
        } catch (error) {
            console.error('Erreur lors de la modification du plat:', error);
            return false;
        }
    }

    /**
     * Supprime un plat définitivement via l'API
     * @param {string} categorie - Catégorie du menu
     * @param {number} id - ID du plat à supprimer
     * @returns {Promise<boolean>} Succès de la suppression
     */
    async supprimerPlat(categorie, id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/plats/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categorie: categorie })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // Mettre à jour les données locales
            this.menusData.menus[categorie].plats = this.menusData.menus[categorie].plats.filter(p => p.id !== id);
            
            console.log('Plat supprimé:', result.message);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du plat:', error);
            return false;
        }
    }

    /**
     * Archive un plat via l'API
     * @param {string} categorieSource - Catégorie source du plat
     * @param {number} id - ID du plat à archiver
     * @returns {Promise<boolean>} Succès de l'archivage
     */
    async archiverPlat(categorieSource, id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/plats/${id}/archiver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categorieSource: categorieSource })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // Mettre à jour les données locales
            const platIndex = this.menusData.menus[categorieSource].plats.findIndex(p => p.id === id);
            if (platIndex !== -1) {
                const plat = this.menusData.menus[categorieSource].plats.splice(platIndex, 1)[0];
                this.menusData.menus.archives.plats.push(plat);
            }
            
            console.log('Plat archivé:', result.message);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'archivage du plat:', error);
            return false;
        }
    }

    /**
     * Bascule un plat vers une autre catégorie via l'API
     * @param {string} categorieSource - Catégorie source du plat
     * @param {string} categorieDestination - Catégorie destination du plat
     * @param {number} id - ID du plat à basculer
     * @returns {Promise<boolean>} Succès du basculement
     */
    async basculerPlat(categorieSource, categorieDestination, id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/plats/${id}/basculer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    categorieSource: categorieSource,
                    categorieDestination: categorieDestination
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // Mettre à jour les données locales
            const platIndex = this.menusData.menus[categorieSource].plats.findIndex(p => p.id === id);
            if (platIndex !== -1) {
                const plat = this.menusData.menus[categorieSource].plats.splice(platIndex, 1)[0];
                this.menusData.menus[categorieDestination].plats.push(plat);
            }
            
            console.log('Plat basculé:', result.message);
            return true;
        } catch (error) {
            console.error('Erreur lors du basculement du plat:', error);
            return false;
        }
    }

    /**
     * Trouve un plat par son ID dans toutes les catégories ou dans une catégorie spécifique
     * @param {number|string} idOuCategorie - ID du plat (si recherche globale) ou catégorie (si recherche spécifique)
     * @param {number} [id] - ID du plat (si recherche dans une catégorie spécifique)
     * @returns {Object|null} Plat trouvé avec sa catégorie ou null
     */
    trouverPlat(idOuCategorie, id = null) {
        // Si on a deux paramètres, c'est l'ancienne signature (categorie, id)
        if (id !== null) {
            const plat = this.menusData.menus[idOuCategorie].plats.find(p => p.id == id); // Utiliser == pour comparer string et number
            return plat ? { plat, categorie: idOuCategorie } : null;
        }
        
        // Si on a un seul paramètre, c'est l'ID et on cherche dans toutes les catégories
        const platId = idOuCategorie;
        const categories = ['actif', 'a_venir', 'archives'];
        
        for (const categorie of categories) {
            const plat = this.menusData.menus[categorie].plats.find(p => p.id == platId); // Utiliser == pour comparer string et number
            if (plat) {
                return { plat, categorie };
            }
        }
        
        return null;
    }

    /**
     * Bascule les menus (le menu à venir devient actuel) via l'API
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async basculerMenus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/menus/basculer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // Recharger les données depuis le serveur
            await this.chargerDonnees();
            
            console.log('Menus basculés:', result.message);
            return true;
        } catch (error) {
            console.error('Erreur lors du basculement des menus:', error);
            return false;
        }
    }

    /**
     * Vide un menu spécifique
     * @param {string} categorie - Catégorie du menu à vider
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async viderMenu(categorie) {
        try {
            const response = await fetch('/api/menus/vider', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categorie })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour les données locales
                await this.chargerDonnees();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur lors du vidage du menu:', error);
            return false;
        }
    }

    /**
     * Monte un plat dans l'ordre d'affichage
     * @param {string} categorie - Catégorie du menu
     * @param {number} id - ID du plat à monter
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async monterPlat(categorie, id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/plats/${id}/monter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categorie })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour les données locales
                await this.chargerDonnees();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur lors du déplacement du plat:', error);
            return false;
        }
    }

    /**
     * Descend un plat dans l'ordre d'affichage
     * @param {string} categorie - Catégorie du menu
     * @param {number} id - ID du plat à descendre
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async descendrePlat(categorie, id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/plats/${id}/descendre`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categorie })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour les données locales
                await this.chargerDonnees();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur lors du déplacement du plat:', error);
            return false;
        }
    }

    /**
     * Obtient la liste des accompagnements
     * @returns {Array} Liste des accompagnements
     */
    obtenirAccompagnements() {
        return this.menusData.accompagnements || [];
    }

    // === MÉTHODES POUR LES ACCOMPAGNEMENTS ===

    /**
     * Récupère tous les accompagnements
     * @returns {Promise<Array>} Liste des accompagnements
     */
    async chargerAccompagnements() {
        try {
            const response = await fetch('/api/accompagnements');
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des accompagnements:', error);
            return [];
        }
    }

    /**
     * Ajoute un nouvel accompagnement
     * @param {Object} accompagnement - Données de l'accompagnement
     * @returns {Promise<Object|null>} Accompagnement créé ou null
     */
    async ajouterAccompagnement(accompagnement) {
        try {
            const response = await fetch('/api/accompagnements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accompagnement)
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour les données locales
                await this.chargerDonnees();
                return result.accompagnement;
            }
            
            return null;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'accompagnement:', error);
            return null;
        }
    }

    /**
     * Modifie un accompagnement existant
     * @param {number} id - ID de l'accompagnement
     * @param {Object} accompagnement - Nouvelles données
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async modifierAccompagnement(id, accompagnement) {
        try {
            const response = await fetch(`/api/accompagnements/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accompagnement)
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour les données locales
                await this.chargerDonnees();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur lors de la modification de l\'accompagnement:', error);
            return false;
        }
    }

    /**
     * Active/désactive un accompagnement
     * @param {number} id - ID de l'accompagnement
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async toggleAccompagnement(id) {
        try {
            const response = await fetch(`/api/accompagnements/${id}/toggle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour les données locales
                await this.chargerDonnees();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur lors du changement d\'état de l\'accompagnement:', error);
            return false;
        }
    }

    /**
     * Supprime un accompagnement
     * @param {number} id - ID de l'accompagnement
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async supprimerAccompagnement(id) {
        try {
            const response = await fetch(`/api/accompagnements/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour les données locales
                await this.chargerDonnees();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'accompagnement:', error);
            return false;
        }
    }

    /**
     * Trouve un accompagnement par ID
     * @param {number} id - ID de l'accompagnement
     * @returns {Object|null} Accompagnement trouvé ou null
     */
    trouverAccompagnement(id) {
        if (!this.menusData || !this.menusData.accompagnements) {
            return null;
        }
        
        return this.menusData.accompagnements.find(a => a.id == id) || null; // Utiliser == pour comparer string et number
    }
} 
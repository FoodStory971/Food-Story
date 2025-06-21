/**
 * Configuration centralisée de l'application FoodStory
 */

// Configuration des horaires d'ouverture
export const HORAIRES_CONFIG = {
    FUSEAU_HORAIRE_OFFSET: -4, // GMT-4 pour la Guadeloupe
    JOURS_OUVERTURE: {
        DIMANCHE: 0,
        LUNDI: 1,
        MARDI: 2,
        MERCREDI: 3,
        JEUDI: 4
    },
    CRENEAUX: {
        MIDI: {
            DEBUT: 12 * 60, // 12h00 en minutes
            FIN: 14 * 60 // 14h00 en minutes
        },
        SOIR: {
            DEBUT: 18 * 60, // 18h00 en minutes
            FIN: 21 * 60 // 21h00 en minutes
        }
    },
    // Horaires spéciaux par jour (0=dimanche, 1=lundi, etc.)
    HORAIRES_SPECIAUX: {
        0: { // Dimanche - Soir uniquement
            CRENEAUX_ACTIFS: ['SOIR'],
            DEBUT_JOURNEE: 18 * 60, // Considéré ouvert à partir de 18h
            MESSAGE_MIDI: 'Ouvert ce soir dès 18h'
        },
        1: { // Lundi à jeudi - Midi et soir
            CRENEAUX_ACTIFS: ['MIDI', 'SOIR'],
            DEBUT_JOURNEE: 10 * 60, // Considéré ouvert à partir de 10h
            MESSAGE_MIDI: 'Ouvert aujourd\'hui - Appelez !'
        },
        2: {
            CRENEAUX_ACTIFS: ['MIDI', 'SOIR'],
            DEBUT_JOURNEE: 10 * 60,
            MESSAGE_MIDI: 'Ouvert aujourd\'hui - Appelez !'
        },
        3: {
            CRENEAUX_ACTIFS: ['MIDI', 'SOIR'],
            DEBUT_JOURNEE: 10 * 60,
            MESSAGE_MIDI: 'Ouvert aujourd\'hui - Appelez !'
        },
        4: {
            CRENEAUX_ACTIFS: ['MIDI', 'SOIR'],
            DEBUT_JOURNEE: 10 * 60,
            MESSAGE_MIDI: 'Ouvert aujourd\'hui - Appelez !'
        }
    }
};

// Configuration des données
export const DATA_CONFIG = {
    STORAGE_KEY: 'foodstory-menus',
    JSON_FILE: 'menus.json',
    FALLBACK_PHONE: '06 90 85 13 34',
    API_BASE_URL: '/api',
    BACKUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_RETRIES: 3
};

// Configuration de l'administration
export const ADMIN_CONFIG = {
    MODAL_ANIMATION_DURATION: 300,
    MESSAGE_DISPLAY_DURATION: 3000,
    AUTO_SAVE_DELAY: 1000
};

// Messages de l'interface
export const MESSAGES = {
    OUVERT: '🟢 Ouvert',
    FERME: '🔴 Fermé',
    HORAIRES_WEEKEND: 'Dimanche: 18h-21h • Lundi-Jeudi: 12h-14h & 18h-21h',
    HORAIRES_FERME_DIMANCHE: 'Service: 18h-21h uniquement',
    HORAIRES_FERME_SEMAINE: 'Service: 12h-14h & 18h-21h',
    ERREUR_CHARGEMENT: 'Erreur lors du chargement des données',
    DONNEES_CHARGEES: 'Données chargées avec succès !',
    PLAT_AJOUTE: 'Plat ajouté avec succès !',
    PLAT_MODIFIE: 'Plat modifié avec succès !',
    PLAT_SUPPRIME: 'Plat supprimé avec succès !',
    PLAT_ARCHIVE: 'Plat archivé avec succès !',
    PLAT_BASCULE: 'Plat basculé avec succès !',
    MENUS_BASCULES: 'Menus basculés avec succès !',
    MENU_VIDE: 'Menu vidé avec succès !',
    DONNEES_SAUVEES: 'Données sauvegardées avec succès !',
    ERREUR_SAUVEGARDE: 'Erreur lors de la sauvegarde',
    ERREUR_VALIDATION: 'Erreur de validation des données',
    ERREUR_RESEAU: 'Erreur de connexion réseau',
    PLAT_NON_TROUVE: 'Plat non trouvé',
    CHARGEMENT: 'Chargement en cours...',
    AUCUN_PLAT: 'Aucun plat dans ce menu',
    MODE_HORS_LIGNE: 'Mode hors ligne - Données par défaut affichées'
};

// Données par défaut
export const DEFAULT_DATA = {
    menus: {
        actif: {
            titre: "Menu de cette semaine",
            periode: "",
            plats: []
        },
        a_venir: {
            titre: "Semaine prochaine",
            periode: "",
            plats: []
        },
        archives: {
            titre: "Plats archivés",
            plats: []
        }
    },
};

// Configuration du thème
export const THEME_CONFIG = {
    COULEURS: {
        PRIMAIRE: '#DC143C', // Rouge Toy Story
        SECONDAIRE: '#FFD700', // Jaune Toy Story
        SUCCES: '#28a745',
        AVERTISSEMENT: '#ffc107',
        DANGER: '#dc3545',
        INFO: '#17a2b8'
    },
    ANIMATIONS: {
        DUREE_RAPIDE: '0.2s',
        DUREE_NORMALE: '0.3s',
        DUREE_LENTE: '0.5s'
    }
};

// Configuration responsive
export const BREAKPOINTS = {
    MOBILE: '480px',
    TABLETTE: '768px',
    DESKTOP: '1024px',
    LARGE: '1200px'
}; 
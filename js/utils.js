/**
 * Utilitaires communs pour l'application FoodStory
 */

import { HORAIRES_CONFIG } from './config.js';

/**
 * Calcule les périodes de menu automatiquement (dimanche à jeudi)
 * @returns {Object} Objet contenant les périodes actuelle et à venir
 */
export function calculerPeriodes() {
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
    const jourJeudi = jeudiActuel.getDate();
    const jourDimancheNext = dimancheProchain.getDate();
    const jourJeudiNext = jeudiProchain.getDate();
    
    const moisActuel = jeudiActuel.toLocaleDateString('fr-FR', { month: 'long' });
    const moisProchain = jeudiProchain.toLocaleDateString('fr-FR', { month: 'long' });
    
    // Vérifier si on est jeudi (jour 4 de la semaine, 0=dimanche)
    const aujourdhui = new Date();
    const estJeudi = aujourdhui.getDay() === 4;
    
    return {
        actuel: `Du ${jourDimancheActuel} ${jourActuel} au ${jourJeudiActuel} ${jourJeudi} ${moisActuel}`,
        aVenir: `Du ${jourDimancheProchain} ${jourDimancheNext} au ${jourJeudiProchain} ${jourJeudiNext} ${moisProchain}`,
        estDernierJour: estJeudi
    };
}

/**
 * Obtient l'heure actuelle en Guadeloupe (GMT-4)
 * @returns {Date} Date ajustée au fuseau horaire de la Guadeloupe
 */
export function obtenirHeureGuadeloupe() {
    const maintenant = new Date();
    return new Date(maintenant.getTime() + (HORAIRES_CONFIG.FUSEAU_HORAIRE_OFFSET * 60 * 60 * 1000));
}

/**
 * Vérifie si le restaurant est ouvert selon les horaires
 * @returns {Object} Statut d'ouverture avec détails
 */
export function verifierStatutOuverture() {
    const heureGuadeloupe = new Date();
    const jourActuel = heureGuadeloupe.getDay();
    const heureActuelle = heureGuadeloupe.getHours();
    const minuteActuelle = heureGuadeloupe.getMinutes();
    const tempsEnMinutes = heureActuelle * 60 + minuteActuelle;
    
    // Vérifier si c'est un jour d'ouverture (dimanche=0 à jeudi=4)
    if (jourActuel < 0 || jourActuel > 4) {
        return {
            estOuvert: false,
            estJourOuvert: false,
            message: "Fermé - Ouvert du dimanche au jeudi",
            prochaineCreneau: "Dimanche 18h"
        };
    }
    
    // Récupérer la configuration spéciale pour ce jour
    const configJour = HORAIRES_CONFIG.HORAIRES_SPECIAUX[jourActuel];
    if (!configJour) {
        return {
            estOuvert: false,
            estJourOuvert: true,
            message: "Configuration manquante pour ce jour",
            prochaineCreneau: null
        };
    }
    
    const debutJournee = configJour.DEBUT_JOURNEE;
    const finJournee = 21 * 60; // 21h00 en minutes
    
    // Si c'est un jour d'ouverture et dans la plage horaire
    if (tempsEnMinutes >= debutJournee && tempsEnMinutes <= finJournee) {
        return {
            estOuvert: true,
            estJourOuvert: true,
            message: configJour.MESSAGE_MIDI,
            prochaineCreneau: null
        };
    }
    
    // Avant l'ouverture ou après 21h
    let prochaineCreneau;
    let messageHoraires;
    
    if (jourActuel === 0) { // Dimanche
        messageHoraires = "Fermé - Ouvert ce soir 18h-21h";
        if (tempsEnMinutes < debutJournee) {
            prochaineCreneau = "Aujourd'hui 18h";
        } else {
            prochaineCreneau = "Lundi 10h";
        }
    } else { // Lundi à jeudi
        messageHoraires = "Fermé - Ouvert 12h-14h & 18h-21h";
        if (tempsEnMinutes < debutJournee) {
            prochaineCreneau = "Aujourd'hui 10h";
        } else if (jourActuel === 4) { // Jeudi
            prochaineCreneau = "Dimanche 18h";
        } else {
            prochaineCreneau = "Demain 10h";
        }
    }
    
    return {
        estOuvert: false,
        estJourOuvert: true,
        message: messageHoraires,
        prochaineCreneau: prochaineCreneau
    };
}

/**
 * Génère un nouvel ID unique pour un plat
 * @param {...Array} listesPlats - Listes de plats à vérifier
 * @returns {number} Nouvel ID unique
 */
export function genererNouvelId(...listesPlats) {
    const tousLesPlats = listesPlats.flat();
    const idsExistants = tousLesPlats
        .map(plat => plat.id)
        .filter(id => typeof id === 'number' && !isNaN(id));
    
    return idsExistants.length > 0 ? Math.max(...idsExistants) + 1 : 1;
}

/**
 * Valide les données d'un plat
 * @param {Object} plat - Données du plat à valider
 * @returns {Object} Résultat de la validation
 */
export function validerPlat(plat) {
    const erreurs = [];
    
    if (!plat.nom || plat.nom.trim().length === 0) {
        erreurs.push('Le nom du plat est requis');
    }
    
    if (!plat.emoji || plat.emoji.trim().length === 0) {
        erreurs.push('L\'emoji est requis');
    }
    
    if (!plat.description || plat.description.trim().length === 0) {
        erreurs.push('La description est requise');
    }
    
    if (!plat.prix || plat.prix.trim().length === 0) {
        erreurs.push('Le prix est requis');
    }
    
    if (plat.nom && plat.nom.length > 100) {
        erreurs.push('Le nom du plat ne peut pas dépasser 100 caractères');
    }
    
    if (plat.description && plat.description.length > 500) {
        erreurs.push('La description ne peut pas dépasser 500 caractères');
    }
    
    return {
        estValide: erreurs.length === 0,
        erreurs: erreurs
    };
}

/**
 * Nettoie et formate les données d'un plat
 * @param {Object} donneesPlat - Données brutes du plat
 * @returns {Object} Plat formaté
 */
export function formaterPlat(donneesPlat) {
    return {
        nom: donneesPlat.nom ? donneesPlat.nom.trim() : '',
        emoji: donneesPlat.emoji ? donneesPlat.emoji.trim() : '',
        description: donneesPlat.description ? donneesPlat.description.trim() : '',
        prix: donneesPlat.prix ? donneesPlat.prix.trim() : ''
    };
}

/**
 * Affiche un message temporaire à l'utilisateur
 * @param {string} texte - Texte du message
 * @param {string} type - Type de message ('success', 'error', 'info')
 * @param {number} duree - Durée d'affichage en millisecondes
 */
export function afficherMessage(texte, type = 'info', duree = 5000) {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = texte;
    
    container.innerHTML = '';
    container.appendChild(messageElement);
    
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, duree);
}

/**
 * Crée un élément DOM pour un plat
 * @param {Object} plat - Données du plat
 * @param {string} categorie - Catégorie du menu ('actif' ou 'a_venir')
 * @param {boolean} avecBoutons - Inclure les boutons d'action (pour l'admin)
 * @returns {HTMLElement} Élément DOM du plat
 */
export function creerElementPlat(plat, categorie, avecBoutons = false) {
    const platElement = document.createElement('div');
    platElement.className = `menu-item ${categorie === 'a_venir' ? 'preview' : ''}`;
    
    let boutons = '';
    if (avecBoutons) {
        boutons = `
            <button class="delete-btn" onclick="supprimerPlat(${plat.id}, '${categorie}')" title="Supprimer">×</button>
            <button class="edit-btn" onclick="modifierPlat(${plat.id}, '${categorie}')" title="Modifier">✏️</button>
        `;
    }
    
    platElement.innerHTML = `
        ${boutons}
        <h3>${plat.emoji || '🍽️'} ${plat.nom || 'Plat sans nom'}</h3>
        <p class="description">${plat.description || 'Description non disponible'}</p>
        <div class="price">${plat.prix || 'Prix non défini'}</div>
    `;
    
    return platElement;
}

/**
 * Vérifie si l'établissement est ouvert selon les horaires
 * @returns {boolean} True si ouvert, false sinon
 */
export function estOuvert() {
    // Fuseau horaire GMT-4 (Guadeloupe)
    const maintenant = new Date();
    const offsetGuadeloupe = -4 * 60; // GMT-4 en minutes
    const offsetLocal = maintenant.getTimezoneOffset();
    const offsetDifference = offsetLocal - offsetGuadeloupe;
    
    const heureGuadeloupe = new Date(maintenant.getTime() + offsetDifference * 60000);
    
    const jour = heureGuadeloupe.getDay(); // 0 = dimanche, 6 = samedi
    const heure = heureGuadeloupe.getHours();
    const minute = heureGuadeloupe.getMinutes();
    const heureComplete = heure + minute / 60;
    
    // Ouvert du dimanche (0) au jeudi (4)
    const joursOuverts = [0, 1, 2, 3, 4];
    
    if (!joursOuverts.includes(jour)) {
        return false;
    }
    
    // Horaires : 12h-14h30 et 18h-21h
    const ouvertMidi = heureComplete >= 12 && heureComplete <= 14.5;
    const ouvertSoir = heureComplete >= 18 && heureComplete <= 21;
    
    return ouvertMidi || ouvertSoir;
}

/**
 * Formate une date en français
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée
 */
export function formaterDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Débounce une fonction
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Délai d'attente en ms
 * @returns {Function} Fonction débouncée
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Échappe les caractères HTML
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
export function echapperHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Vérifie si un objet est vide
 * @param {Object} obj - Objet à vérifier
 * @returns {boolean} True si vide
 */
export function estObjetVide(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Clone profondément un objet
 * @param {*} obj - Objet à cloner
 * @returns {*} Clone de l'objet
 */
export function cloneProfond(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Génère l'affichage des horaires à partir de la configuration
 * @returns {Object} Horaires formatés pour l'affichage
 */
export function genererHorairesAffichage() {
    const creneaux = HORAIRES_CONFIG.CRENEAUX;
    
    // Convertir les minutes en format HH:MM
    const formatHeure = (minutes) => {
        const heures = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${heures}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
    };
    
    const heureMidiDebut = formatHeure(creneaux.MIDI.DEBUT);
    const heureMidiFin = formatHeure(creneaux.MIDI.FIN);
    const heureSoirDebut = formatHeure(creneaux.SOIR.DEBUT);
    const heureSoirFin = formatHeure(creneaux.SOIR.FIN);
    
    return {
        jours: 'Dimanche - Jeudi',
        joursDimanche: 'Dimanche',
        joursLundiJeudi: 'Lundi - Jeudi',
        creneauMidi: `${heureMidiDebut} - ${heureMidiFin}`,
        creneauSoir: `${heureSoirDebut} - ${heureSoirFin}`,
        horaireComplet: `Dimanche : ${heureSoirDebut} - ${heureSoirFin} • Lundi-Jeudi : ${heureMidiDebut} - ${heureMidiFin} & ${heureSoirDebut} - ${heureSoirFin}`,
        horaireDimanche: `Dimanche : ${heureSoirDebut} - ${heureSoirFin}`,
        horaireLundiJeudi: `Lundi - Jeudi : ${heureMidiDebut} - ${heureMidiFin} & ${heureSoirDebut} - ${heureSoirFin}`
    };
} 
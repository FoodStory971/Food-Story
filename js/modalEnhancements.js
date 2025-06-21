/**
 * Améliorations pour le modal de création/modification de plats
 * Gestion des suggestions d'emojis et formatage automatique des prix
 */

/**
 * Liste d'emojis suggérés pour les plats
 */
export const EMOJIS_PLATS = [
    // Plats principaux
    '🍗', '🍖', '🥩', '🍤', '🦐', '🐟', '🐠', '🦀',
    '🍝', '🍜', '🍲', '🥘', '🍛', '🍱', '🥙', '🌮',
    '🌯', '🥪', '🍕', '🍔', '🌭', '🥓', '🍳', '🧀',
    
    // Légumes et accompagnements
    '🥗', '🥒', '🥕', '🌽', '🥔', '🍅', '🥬', '🥦',
    '🍆', '🌶️', '🫑', '🥑', '🍄', '🧄', '🧅', '🥖',
    
    // Fruits et desserts
    '🍎', '🍌', '🍓', '🥭', '🍑', '🍒', '🥝', '🍇',
    '🍰', '🧁', '🍮', '🍭', '🍫', '🍪', '🥧', '🍩',
    
    // Boissons
    '☕', '🍵', '🥤', '🧃', '🍷', '🍺', '🥛', '🧋',
    
    // Autres
    '🍽️', '🥄', '🍴', '🔥', '❄️', '🌿', '⭐', '💎'
];

/**
 * Liste d'emojis suggérés pour les accompagnements
 */
export const EMOJIS_ACCOMPAGNEMENTS = [
    // Légumes racines et tubercules
    '🥔', '🥕', '🧄', '🧅', '🍠', '🫘', '🌰',
    
    // Légumes verts et salades
    '🥬', '🥦', '🥒', '🌽', '🍅', '🥑', '🫑', '🌶️',
    
    // Céréales et féculents
    '🍚', '🍞', '🥖', '🥨', '🫓', '🥯', '🧈', '🥜',
    
    // Légumineuses et graines
    '🫘', '🌱', '🌿', '🥜', '🌾', '🫛',
    
    // Fruits
    '🍋', '🍊', '🍎', '🍌', '🥭', '🍇', '🍓', '🥝',
    
    // Herbes et épices
    '🌿', '🍃', '🌱', '🧂', '🫚', '🌶️',
    
    // Produits laitiers et fromages
    '🧀', '🥛', '🧈', '🥥',
    
    // Autres accompagnements
    '🥗', '🍄', '🥖', '🍽️', '⭐', '��'
];

/**
 * Classe pour gérer les améliorations du modal
 */
export class ModalEnhancements {
    constructor() {
        this.emojiInput = null;
        this.prixInput = null;
        this.suggestionsContainer = null;
        this.initialiser();
    }

    /**
     * Initialise les améliorations du modal
     */
    initialiser() {
        this.emojiInput = document.getElementById('emoji');
        this.prixInput = document.getElementById('prix');
        this.suggestionsContainer = document.getElementById('emoji-suggestions');

        if (this.emojiInput && this.suggestionsContainer) {
            this.configurerSuggestionsEmojis();
        }

        if (this.prixInput) {
            this.configurerFormatagePrix();
        }
    }

    /**
     * Configure les suggestions d'emojis
     * @param {string} inputId - ID du champ input emoji
     * @param {string} containerId - ID du conteneur des suggestions
     * @param {string} type - Type d'emojis ('plats' ou 'accompagnements')
     */
    configurerSuggestionsEmojis(inputId = 'emoji', containerId = 'emoji-suggestions', type = 'plats') {
        const emojiInput = document.getElementById(inputId);
        const suggestionsContainer = document.getElementById(containerId);
        
        if (!emojiInput || !suggestionsContainer) {
            console.warn(`Éléments non trouvés: ${inputId} ou ${containerId}`);
            return;
        }

        // Choisir la liste d'emojis appropriée
        const emojis = type === 'accompagnements' ? EMOJIS_ACCOMPAGNEMENTS : EMOJIS_PLATS;
        
        // Générer les suggestions d'emojis
        this.genererSuggestionsEmojis(emojiInput, suggestionsContainer, emojis);

        // Événement focus pour afficher les suggestions
        emojiInput.addEventListener('focus', () => {
            suggestionsContainer.style.display = 'grid';
        });

        // Événement pour masquer les suggestions quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group')) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    /**
     * Génère les suggestions d'emojis dans le conteneur
     * @param {HTMLElement} emojiInput - Champ input emoji
     * @param {HTMLElement} suggestionsContainer - Conteneur des suggestions
     * @param {Array} emojis - Liste des emojis à afficher
     */
    genererSuggestionsEmojis(emojiInput, suggestionsContainer, emojis) {
        suggestionsContainer.innerHTML = emojis
            .map(emoji => `
                <span class="emoji-suggestion" data-emoji="${emoji}" title="Sélectionner ${emoji}">
                    ${emoji}
                </span>
            `).join('');

        // Ajouter les événements de clic sur chaque emoji
        suggestionsContainer.querySelectorAll('.emoji-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                emojiInput.value = emoji;
                suggestionsContainer.style.display = 'none';
                
                // Déclencher l'événement change pour la validation
                emojiInput.dispatchEvent(new Event('change'));
            });
        });
    }

    /**
     * Configure le formatage automatique des prix
     */
    configurerFormatagePrix() {
        // Formatage en temps réel pendant la saisie
        this.prixInput.addEventListener('input', (e) => {
            this.formaterPrix(e.target);
        });

        // Formatage final quand on quitte le champ
        this.prixInput.addEventListener('blur', (e) => {
            this.formaterPrixFinal(e.target);
        });
    }

    /**
     * Formate le prix pendant la saisie
     * @param {HTMLInputElement} input - Champ de saisie du prix
     */
    formaterPrix(input) {
        let valeur = input.value;
        
        // Supprimer tous les caractères non numériques sauf la virgule et le point
        valeur = valeur.replace(/[^\d,.-]/g, '');
        
        // Remplacer le point par une virgule pour la décimale
        valeur = valeur.replace('.', ',');
        
        // Limiter à une seule virgule
        const parties = valeur.split(',');
        if (parties.length > 2) {
            valeur = parties[0] + ',' + parties.slice(1).join('');
        }
        
        // Limiter les décimales à 2 chiffres
        if (parties.length === 2 && parties[1].length > 2) {
            valeur = parties[0] + ',' + parties[1].substring(0, 2);
        }
        
        input.value = valeur;
    }

    /**
     * Formatage final du prix avec ajout automatique du symbole €
     * @param {HTMLInputElement} input - Champ de saisie du prix
     */
    formaterPrixFinal(input) {
        let valeur = input.value.trim();
        
        if (valeur && !valeur.includes('€')) {
            // Ajouter le symbole € s'il n'est pas présent
            valeur += ' €';
            input.value = valeur;
        }
    }

    /**
     * Réinitialise les améliorations pour un nouveau modal
     */
    reinitialiser() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.style.display = 'none';
        }
        
        if (this.emojiInput) {
            this.emojiInput.value = '';
        }
        
        if (this.prixInput) {
            this.prixInput.value = '';
        }
    }

    /**
     * Pré-remplit les champs pour la modification
     * @param {Object} plat - Données du plat à modifier
     */
    preremplirChamps(plat) {
        if (this.emojiInput && plat.emoji) {
            this.emojiInput.value = plat.emoji;
        }
        
        if (this.prixInput && plat.prix) {
            this.prixInput.value = plat.prix;
        }
    }
} 
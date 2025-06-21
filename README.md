# 🍽️ FoodStory - Site vitrine avec administration

Site vitrine pour restaurant de plats à emporter avec thème Toy Story et interface d'administration complète.

## 🚀 Installation et démarrage

### Prérequis
- Node.js (version 14 ou supérieure)
- npm (inclus avec Node.js)

### Installation des dépendances

```bash
npm install
```

### Démarrage du serveur

```bash
# Mode production
npm start

# Mode développement (avec rechargement automatique)
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📋 Utilisation

### Site vitrine
- **URL** : `http://localhost:3000`
- Affichage des menus de la semaine actuelle et à venir
- Bannière dynamique ouvert/fermé selon les horaires (GMT-4)
- Design responsive Toy Story

### Interface d'administration
- **URL** : `http://localhost:3000/admin.html`
- Gestion complète des menus (ajout, modification, suppression)
- Actions rapides (basculement des menus, vidage)
- Calcul automatique des périodes (dimanche au jeudi)

## 🏗️ Architecture

### Structure des fichiers
```
FoodStory/
├── css/                    # CSS modulaire
│   ├── variables.css       # Variables CSS centralisées
│   ├── base.css           # Styles de base et utilitaires
│   ├── components.css     # Composants réutilisables
│   └── layout.css         # Layouts spécifiques
├── js/                    # JavaScript modulaire
│   ├── config.js          # Configuration centralisée
│   ├── utils.js           # Utilitaires communs
│   ├── dataService.js     # Service de données (API)
│   ├── bannerService.js   # Service bannière dynamique
│   ├── menuRenderer.js    # Rendu des menus (site)
│   ├── adminRenderer.js   # Rendu admin
│   ├── main.js           # Orchestrateur principal (site)
│   └── admin.js          # Orchestrateur admin
├── index.html             # Page principale
├── admin.html             # Interface d'administration
├── menus.json             # Données des menus
├── server.js              # Serveur Express
├── package.json           # Dépendances Node.js
└── README.md              # Documentation
```

### API Endpoints

#### Menus
- `GET /api/menus` - Récupère tous les menus
- `POST /api/menus` - Sauvegarde tous les menus

#### Plats
- `POST /api/plats` - Ajoute un nouveau plat
- `PUT /api/plats/:id` - Modifie un plat existant
- `DELETE /api/plats/:id` - Supprime un plat

#### Actions
- `POST /api/menus/basculer` - Bascule les menus
- `POST /api/menus/vider` - Vide un menu

## 🎨 Fonctionnalités

### Site vitrine
- ✅ Thème visuel Toy Story (rouge/jaune)
- ✅ Bannière téléphone dynamique (ouvert/fermé)
- ✅ Affichage des menus actuel et à venir
- ✅ Section accompagnements maison
- ✅ Design responsive (mobile/tablette/desktop)
- ✅ Horaires d'ouverture intégrés

### Administration
- ✅ Vue unifiée des deux menus côte à côte
- ✅ Modal d'ajout/modification de plats
- ✅ Actions rapides (basculement, vidage)
- ✅ Périodes automatiques (dimanche-jeudi)
- ✅ Sauvegarde en temps réel
- ✅ Interface responsive

### Technique
- ✅ Architecture modulaire (CSS et JS)
- ✅ API REST avec Express.js
- ✅ Gestion d'erreurs robuste
- ✅ Mode hors ligne avec données par défaut
- ✅ Variables CSS centralisées
- ✅ Composants réutilisables

## 🕒 Horaires d'ouverture

- **Jours** : Du dimanche au jeudi
- **Heures** : 12h-14h30 & 18h-21h
- **Fuseau horaire** : GMT-4 (Guadeloupe)

## 🛠️ Développement

### Structure modulaire CSS
- **variables.css** : Couleurs, tailles, espacements
- **base.css** : Reset, utilitaires, animations
- **components.css** : Boutons, cartes, modals, formulaires
- **layout.css** : Bannière, headers, sections, responsive

### Structure modulaire JavaScript
- **config.js** : Configuration et constantes
- **utils.js** : Fonctions utilitaires
- **dataService.js** : Communication avec l'API
- **Services de rendu** : Séparation site/admin
- **Orchestrateurs** : Coordination des services

### Gestion des données
- Fichier JSON pour persistance
- API REST pour communication client/serveur
- Calcul automatique des périodes
- Validation des données côté client et serveur

## 📱 Responsive Design

- **Mobile** : < 480px
- **Tablette** : 480px - 768px
- **Desktop** : > 768px

Breakpoints définis dans les variables CSS pour cohérence.

## 🎯 Utilisation en production

1. Installer les dépendances : `npm install`
2. Démarrer le serveur : `npm start`
3. Accéder au site : `http://localhost:3000`
4. Administrer : `http://localhost:3000/admin.html`

Le serveur sert automatiquement tous les fichiers statiques et gère les données via l'API REST. 
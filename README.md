# 🏠 Nettoyage - Plateforme de Services Complets

## 📋 Vue d'ensemble

Plateforme complète de services de nettoyage, travaux manuels et sécurité, développée avec **React (Frontend) + Supabase (Backend + Database)**. Le projet offre une solution intégrée pour la gestion des services, réservations, et administration.

## 🚀 Fonctionnalités Principales

### 🧹 Services de Nettoyage
- **Services Bébé** : Nettoyage spécialisé pour enfants et espaces familiaux
- **Services Jardinage** : Entretien, aménagement et maintenance extérieure
- **Services Sécurité** : Personnel de sécurité qualifié et formé

### 🔨 Travaux Manuels (Hand Workers)
- **Catégories** : Menuisier, Plâtrier, Peintre, Électricien, Plombier, Carreleur, Maçon, Serrurier
- **Employés** : Gestion complète des artisans spécialisés
- **Réservations** : Système de réservation avec calcul automatique des prix
- **Prix dynamique** : Tarification par heure avec heures minimum

### 🛒 Boutique en Ligne
- **Produits** : Catalogue complet de produits de nettoyage
- **Panier** : Gestion des commandes et paiements
- **Promotions** : Système de réductions et offres spéciales

### 🌐 Multilingue
- **Langues** : Français, Anglais, Arabe
- **Traduction** : Système de traduction dynamique
- **Interface** : Adaptation complète par langue

### 👨‍💼 Administration
- **Dashboard** : Statistiques et vue d'ensemble
- **CRUD** : Gestion complète de tous les modules
- **Réservations** : Suivi et gestion des demandes
- **Employés** : Gestion du personnel et des artisans

## 🛠️ Architecture Technique

### Backend + Database (Supabase)
- **Platform** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth intégré
- **API** : API automatique via Supabase Client
- **Real-time** : Mises à jour en temps réel
- **Storage** : Stockage de fichiers intégré

### Frontend (React)
- **Framework** : React 19 avec hooks modernes
- **Routing** : React Router DOM
- **État** : useState, useEffect, useMemo
- **Internationalisation** : i18next
- **Styling** : CSS moderne avec Grid et Flexbox
- **Backend Client** : @supabase/supabase-js

## 📁 Structure du Projet

```
nettoyage/
├── site-menage/             # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── lib/
│   │   │   └── supabase-setup.js
│   │   ├── examples/
│   │   │   ├── AuthenticationExamples.jsx
│   │   │   └── CRUDExamples.jsx
│   │   └── locales/
│   └── public/
├── supabase-schema-complete.sql  # Schéma base de données
├── دليل_التحويل_إلى_Supabase.md  # Guide complet (arabe)
├── QUICK_START_AR.md            # Guide rapide (arabe)
└── مقارنة_Laravel_vs_Supabase.md # Comparaison (arabe)
```

## 🚀 Installation et Configuration

### Prérequis
- **Node.js** 16+
- **npm** ou **yarn**
- **Compte Supabase** (gratuit)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd nettoyage/site-menage

# Installer les dépendances
npm install

# Configuration Supabase
# Créer un fichier .env à la racine de site-menage
# Ajouter:
# REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Démarrer le serveur de développement
npm start
```

### Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter le fichier `supabase-schema-complete.sql` dans SQL Editor
3. Copier les clés API dans le fichier `.env`
4. Voir `QUICK_START_AR.md` pour les détails

## 📚 Documentation

### Guides Disponibles
- **`دليل_التحويل_إلى_Supabase.md`** - Guide complet en arabe
- **`QUICK_START_AR.md`** - Guide de démarrage rapide
- **`مقارنة_Laravel_vs_Supabase.md`** - Comparaison détaillée
- **`INDEX_AR.md`** - Index de tous les fichiers

### Exemples de Code
- **`src/examples/AuthenticationExamples.jsx`** - Exemples d'authentification
- **`src/examples/CRUDExamples.jsx`** - Exemples CRUD complets
- **`src/lib/supabase-setup.js`** - Configuration Supabase

## 🗄️ Base de Données

### Tables Principales
- `users` - Utilisateurs (via Supabase Auth)
- `admins` - Administrateurs
- `services` - Services de nettoyage
- `products` - Produits boutique
- `reservations` - Réservations générales
- `hand_worker_categories` - Catégories travaux manuels
- `hand_workers` - Employés travaux manuels
- `hand_worker_reservations` - Réservations travaux manuels

### Relations
- **Hand Workers** → **Categories** (Many-to-One)
- **Reservations** → **Hand Workers** (Many-to-One)
- **Reservations** → **Categories** (Many-to-One)

Voir `supabase-schema-complete.sql` pour le schéma complet.

## 🌍 Internationalisation

### Langues Supportées
- **Français** (fr) - Langue principale
- **Anglais** (en) - Langue internationale
- **Arabe** (ar) - Langue régionale

### Système de Traduction
- **Frontend** : Fichiers JSON + i18next
- **Base de données** : Champs multilingues (name_ar, name_fr, name_en)

## 🔐 Authentification et Sécurité

### Supabase Auth
- **Authentification** : Email/Password, OAuth
- **Sessions** : Gestion automatique
- **Tokens** : JWT automatiques
- **Row Level Security** : Politiques de sécurité au niveau base de données

### Frontend
- **Hooks** : useAuth pour vérifier l'état utilisateur
- **Protected Routes** : Routes protégées automatiquement
- **Gestion d'erreurs** : Centralisée

## 📊 Fonctionnalités Avancées

### Calcul Automatique des Prix
- **Travaux Manuels** : Prix/heure × durée
- **Services** : Tarification fixe ou variable
- **Promotions** : Application automatique des réductions

### Gestion des Statuts
- **Réservations** : pending → confirmed → in_progress → completed
- **Employés** : available → busy → unavailable
- **Services** : active/inactive

### Interface Responsive
- **Mobile First** : Design adaptatif
- **CSS Grid** : Layout moderne
- **Animations** : Transitions fluides
- **Accessibilité** : Standards WCAG

## 🧪 Tests et Qualité

### Frontend
```bash
# Tests React
npm test

# Build de production
npm run build
```

## 🚀 Déploiement

### Production
- **Frontend** : Build React optimisé (Netlify, Vercel, etc.)
- **Base de données** : Supabase (cloud)
- **Storage** : Supabase Storage

### Environnement
- **Variables** : Configuration via .env
- **SSL** : Certificats HTTPS automatiques
- **CDN** : Assets statiques optimisés

## 📝 Documentation Supplémentaire

- **Guide Complet** : `دليل_التحويل_إلى_Supabase.md`
- **Démarrage Rapide** : `QUICK_START_AR.md`
- **Comparaison** : `مقارنة_Laravel_vs_Supabase.md`
- **Index** : `INDEX_AR.md`

## 🤝 Contribution

### Workflow
1. **Fork** le projet
2. **Créer** une branche feature
3. **Développer** avec tests
4. **Commit** avec messages clairs
5. **Push** et créer une Pull Request

### Standards
- **Code** : ESLint (JavaScript)
- **Commits** : Conventionnel
- **Tests** : Couverture minimale 80%
- **Documentation** : Mise à jour obligatoire

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support et Contact

- **Issues** : GitHub Issues
- **Documentation** : Guides détaillés en arabe
- **Supabase Docs** : [supabase.com/docs](https://supabase.com/docs)

## 🎯 Roadmap

### Version 2.0
- [ ] Système de paiement intégré
- [ ] Notifications email/SMS
- [ ] Calendrier de disponibilité
- [ ] Évaluations et avis clients
- [ ] Géolocalisation des employés

### Version 3.0
- [ ] Application mobile
- [ ] API GraphQL
- [ ] Système de chat en temps réel
- [ ] Intelligence artificielle pour recommandations
- [ ] Intégration avec systèmes externes

---

<p align="center">
<strong>Développé avec ❤️ pour simplifier les services de nettoyage et travaux manuels</strong>
</p>

<p align="center">
<strong>Powered by React + Supabase</strong>
</p>

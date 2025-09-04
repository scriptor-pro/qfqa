# QFQA - Quoi Faire Quand Aujourd'hui

Une application web d'emploi du temps adaptée aux personnes TDAH, autistes, ou les deux.

## 🎯 Vue d'ensemble

QFQA aide les personnes neuroatypiques à organiser leur journée en tenant compte de leur niveau d'énergie et de leurs spécificités neurotypiques. L'application propose un système de planification flexible avec des tâches fixes et des tâches "flottantes" qui peuvent être déplacées par glisser-déposer.

### Fonctionnalités principales

- **Inscription avec sélection du neurotype** (TDAH, Autiste, Les deux)
- **Emploi du temps vertical sur 24 heures** avec vue de la journée en cours
- **Système d'énergie sur échelle 1-12** pour adapter les tâches à votre état
- **Tâches flexibles** avec drag-and-drop et surface proportionnelle à l'énergie
- **Design Bauhaus** : interface épurée, sans éléments inutiles
- **Accessibilité WCAG 2.1 AA** : navigation clavier, contrastes, réduction des mouvements
- **Thème clair/sombre** avec tons sourds
- **Support d'abonnements** avec différents niveaux de fonctionnalités

## 🛠 Technologies

- **Frontend** : SvelteKit avec TypeScript
- **Backend** : API REST intégrée à SvelteKit
- **Base de données** : SQLite avec better-sqlite3
- **Authentification** : JWT tokens
- **Déploiement** : Vercel (serverless)
- **Style** : CSS vanilla avec variables CSS

## 📦 Installation

### Prérequis

- Node.js 18.x ou supérieur
- npm ou yarn

### Configuration locale

1. **Clonez le repository**
   ```bash
   git clone <repository-url>
   cd QFQA
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Configuration des variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Éditez `.env` avec vos valeurs :
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   DATABASE_URL=./qfqa.db
   ```

4. **Lancez le serveur de développement**
   ```bash
   npm run dev
   ```
   
   L'application sera accessible sur `http://localhost:5173`

## 🚀 Déploiement

### Vercel (Recommandé)

1. **Connectez votre repository à Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configurez les variables d'environnement** dans le dashboard Vercel :
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY` (optionnel)
   - `STRIPE_PUBLISHABLE_KEY` (optionnel)

3. **Déployez**
   ```bash
   vercel --prod
   ```

## 🏗 Architecture

### Structure du projet

```
src/
├── lib/
│   ├── components/          # Composants Svelte réutilisables
│   │   ├── EnergyIndicator.svelte
│   │   ├── TaskCard.svelte
│   │   ├── ScheduleElement.svelte
│   │   └── CalendarPicker.svelte
│   ├── auth.ts             # Gestion JWT et validation mots de passe
│   ├── database.ts         # Configuration SQLite et schéma
│   └── drag-drop.ts        # Logique drag-and-drop
├── routes/
│   ├── api/                # API REST endpoints
│   │   ├── auth/           # Authentification
│   │   ├── user/           # Profil utilisateur
│   │   └── schedule/       # Emploi du temps et tâches
│   ├── register/           # Page d'inscription
│   ├── login/              # Page de connexion
│   ├── setup/              # Configuration initiale
│   ├── schedule/           # Interface principale
│   └── +layout.svelte      # Layout global
├── app.css                 # Styles globaux avec thèmes
└── app.html                # Template HTML
```

### Base de données

- **users** : Comptes utilisateur avec neurotype et abonnement
- **subscription_plans** : Plans d'abonnement disponibles
- **payments** : Historique des paiements
- **schedule_elements** : Éléments fixes (RDV, cours...)
- **floating_tasks** : Tâches flexibles
- **energy_levels** : Niveaux d'énergie quotidiens

## 🎨 Design

### Principes Bauhaus appliqués

- **Fonction avant forme** : Chaque élément a une utilité précise
- **Simplicité** : Interface épurée sans distractions
- **Géométrie** : Formes simples et alignements nets
- **Couleurs fonctionnelles** : Tons sourds, système cohérent

### Adaptations neurotypiques

#### TDAH
- Tâches haute énergie plus visibles
- Feedback visuel immédiat
- Flexibilité dans l'organisation

#### Autisme
- Structure prévisible et claire
- Routines respectées
- Évitement de la surcharge sensorielle

#### Les deux
- Équilibre entre structure et flexibilité
- Double approche adaptative

## ♿ Accessibilité

- **Navigation clavier** complète
- **Lecteurs d'écran** supportés
- **Contrastes WCAG AA** respectés
- **Mouvements réduits** par défaut
- **Focus visible** sur tous les éléments interactifs
- **Labels descriptifs** et ARIA

## 🔧 Développement

### Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Aperçu du build
npm run check        # Vérification TypeScript
npm run lint         # Linting du code
npm run format       # Formatage automatique
```

### Ajout de fonctionnalités

1. **Nouvelles pages** : Créer dans `src/routes/`
2. **Composants** : Ajouter dans `src/lib/components/`
3. **API** : Endpoints dans `src/routes/api/`
4. **Styles** : Variables CSS dans `src/app.css`

### Base de données

Les migrations se font automatiquement au démarrage via `src/lib/database.ts`

## 💰 Monétisation

### Plans d'abonnement

- **Gratuit** : 10 tâches, 5 emplois du temps
- **Basic** (5,99€/mois) : 50 tâches, 20 emplois du temps, thèmes
- **Premium** (12,99€/mois) : Illimité, analyses, export

### Intégration Stripe

Configuration dans les variables d'environnement pour les paiements.

## 🤝 Contribution

1. Fork le repository
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changes (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Contacter l'équipe de développement

---

**QFQA** - Parce que chaque cerveau mérite un planning adapté à ses besoins 🧠✨
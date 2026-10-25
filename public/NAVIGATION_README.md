# Navigation QFQA - Documentation

## 🎯 Conformité WCAG 2.1 AA

Cette navigation respecte tous les critères d'accessibilité WCAG 2.1 niveau AA :

### ✅ Critères respectés

#### **1.3.1 - Informations et relations** (A)
- Utilisation de `<nav>` avec `role="navigation"`
- Structure sémantique avec `<ul>`, `<li>`
- Labels ARIA appropriés (`aria-label`, `aria-describedby`)
- Relations logiques entre éléments

#### **1.4.3 - Contraste (minimum)** (AA) 
- Ratio de contraste > 4.5:1 pour le texte normal
- Ratio de contraste > 3:1 pour le texte large
- Tests avec outils de contraste validés

#### **1.4.10 - Reflow** (AA)
- Responsive jusqu'à 320px de largeur
- Pas de scroll horizontal nécessaire
- Menu adaptatif mobile/desktop

#### **1.4.11 - Contraste des éléments non textuels** (AA)
- Bordures et icônes avec contraste suffisant
- États focus/hover clairement visibles

#### **2.1.1 - Clavier** (A)
- Navigation entièrement accessible au clavier
- Support Tab, Shift+Tab, flèches, Échap, Entrée
- Focus trapping dans le menu mobile

#### **2.1.2 - Pas de piège au clavier** (A)
- Focus peut toujours sortir des composants
- Échap ferme le menu mobile
- Focus trapping optionnel uniquement

#### **2.4.3 - Ordre de focus** (A)
- Ordre logique : logo → liens → actions
- Cohérent entre desktop et mobile

#### **2.4.6 - En-têtes et labels** (AA)
- Labels descriptifs pour tous les liens
- Textes d'aide avec `aria-describedby`
- Contexte clair pour chaque action

#### **2.4.7 - Focus visible** (AA)
- Outline distinct sur tous les éléments focusables
- Contraste suffisant pour l'indicateur de focus
- Outline personnalisé cohérent

#### **3.2.1 - Au focus** (A)
- Aucun changement de contexte au focus
- Seuls les changements visuels (hover/focus)

#### **3.2.2 - À la saisie** (A)
- Pas de soumission automatique
- Actions explicites uniquement

#### **4.1.2 - Nom, rôle, valeur** (A)
- Tous les éléments interactifs ont un nom accessible
- Rôles ARIA appropriés
- États dynamiques annoncés (`aria-expanded`, `aria-current`)

## 📱 Responsive Design

### Breakpoints
- **Desktop** (> 768px) : Menu horizontal classique
- **Mobile** (≤ 768px) : Menu hamburger avec sidebar

### Fonctionnalités mobile
- Menu hamburger animé (hamburger → X)
- Sidebar avec overlay semi-transparent
- Navigation au doigt et au clavier
- Fermeture sur overlay ou Échap
- Animation d'entrée des éléments

## ⚡ Performance

### Optimisations appliquées
- CSS optimisé avec variables natives
- JavaScript modulaire et événements délégués
- Chargement asynchrone du composant
- Support `prefers-reduced-motion`
- Lazy loading des styles non critiques

### Métriques cibles
- **FCP** < 1.5s (First Contentful Paint)
- **LCP** < 2.5s (Largest Contentful Paint)
- **CLS** < 0.1 (Cumulative Layout Shift)

## 🔧 Intégration HTMX

### Fonctionnalités HTMX
- Navigation SPA avec `hx-get` et `hx-push-url`
- Indicateurs de chargement (`[hx-request]`)
- États de page active automatiques
- Gestion des erreurs réseau

### Événements personnalisés
```javascript
// Navigation chargée
document.addEventListener('navigationLoaded', () => {});

// Changement de page
document.addEventListener('htmx:pushedIntoHistory', () => {});
```

## 🎨 Personnalisation

### Variables CSS
```css
:root {
  --color-primary: #0066cc;
  --spacing-sm: 1rem;
  --transition-fast: 0.15s ease;
  --border-radius: 4px;
  --focus-outline: 2px solid var(--color-primary);
}
```

### Classes utilitaires
- `.sr-only` : Masquer visuellement mais garder accessible
- `.nav-link.active` : État de page active
- `.has-sticky-nav` : Body avec navigation sticky

## 🧪 Tests d'accessibilité

### Outils utilisés
- **axe DevTools** : Analyse automatisée
- **WAVE** : Validation Web Accessibility
- **Lecteurs d'écran** : NVDA, JAWS, VoiceOver
- **Tests clavier** : Navigation complète au clavier

### Checklist de test

#### ✅ Navigation clavier
- [ ] Tab/Shift+Tab : parcours logique
- [ ] Échap : fermeture du menu mobile
- [ ] Entrée/Espace : activation des liens
- [ ] Flèches : navigation dans le menu mobile

#### ✅ Lecteurs d'écran
- [ ] Annonce du rôle navigation
- [ ] Lecture des labels de liens
- [ ] États dynamiques annoncés
- [ ] Régions live pour le chargement

#### ✅ Responsive
- [ ] Menu mobile fonctionnel à 320px
- [ ] Pas de scroll horizontal
- [ ] Touch targets ≥ 44px
- [ ] Zoom 200% sans perte de fonctionnalité

#### ✅ Contrastes
- [ ] Texte normal ≥ 4.5:1
- [ ] Texte large ≥ 3:1  
- [ ] Éléments UI ≥ 3:1
- [ ] Focus visible distinct

## 🚀 Utilisation

### Intégration dans une page
```html
<!-- Head -->
<link rel="stylesheet" href="/css/navigation.css">

<!-- Body -->
<div id="navigation-placeholder"></div>

<!-- Scripts -->
<script src="/js/load-navigation.js"></script>
<script src="/js/navigation.js"></script>
```

### API JavaScript
```javascript
// Accès à l'instance
const nav = window.qfqaNav;

// Mettre à jour l'authentification
nav.updateAuthState(true, { 
  name: 'Utilisateur', 
  energy: 'Bonne' 
});

// Mettre à jour l'énergie
nav.updateEnergyLevel('Faible');

// Destruction
nav.destroy();
```

## 📋 Maintenance

### Fichiers du composant
- `components/navigation.html` : Structure HTML
- `css/navigation.css` : Styles CSS
- `js/navigation.js` : Logique JavaScript  
- `js/load-navigation.js` : Chargement dynamique

### Points d'attention
- Tester après chaque mise à jour de framework
- Valider les contrastes si changement de couleurs
- Vérifier la compatibilité navigateur
- Tests d'accessibilité réguliers

---

**QFQA Navigation** - Une navigation inclusive et performante 🧠💙
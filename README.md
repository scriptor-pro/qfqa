# QFQA - Quoi Faire Quand Aujourd'hui

Une application d'emploi du temps bienveillante, conçue spécialement pour les personnes TDAH, autistes ou les deux.

## 🎯 Objectif

QFQA aide les personnes neuroatypiques à organiser leur quotidien en tenant compte de leur énergie, de leur neurotype et de leurs sensibilités sensorielles. L'application utilise une échelle sensorielle à 20 niveaux pour évaluer la consommation d'énergie des activités.

## 🏗️ Architecture

### Front-end
- **Technologie** : HTMX + HTML/CSS vanilla + JavaScript
- **Framework CSS** : Vanilla Framework (Ubuntu)
- **Déploiement** : Netlify
- **Accessibilité** : WCAG 2.1 AA

### Back-end
- **Technologie** : PocketBase
- **Déploiement** : Render
- **Base de données** : SQLite embarquée

## ✨ Fonctionnalités

### Gestion des éléments d'emploi du temps
- **Éléments fixes** : rendez-vous, cours, événements avec heure précise
- **Éléments flottants** : tâches déplaçables par drag & drop
- **Évaluation sensorielle** : utilisation de l'échelle 20 niveaux (5 sens)

### Interface adaptée
- **Navigation clavier** complète
- **Suggestions intelligentes** selon l'énergie et le neurotype  
- **Optimisation automatique** de l'emploi du temps
- **Responsive design** mobile/tablette/desktop

### Personnalisation
- **Profil énergétique** par tranches horaires
- **Sensibilités particulières** (bruit, lumière, foule, etc.)
- **Stratégies d'adaptation** personnalisées
- **Thèmes** : clair, sombre, contraste élevé

## 🔧 Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/qfqa.git
cd qfqa

# Servir les fichiers statiques (exemple avec Python)
cd public
python -m http.server 8000

# Ou avec Node.js
npx serve public
```

## 📁 Structure du projet

```
public/
├── index.html          # Page d'accueil
├── login.html          # Connexion
├── register.html       # Inscription
├── forgot-password.html # Récupération mot de passe
├── setup.html          # Configuration emploi du temps
├── schedule.html       # Page principale emploi du temps
├── css/
│   └── main.css        # Styles principaux
├── js/
│   └── main.js         # JavaScript principal
└── netlify.toml        # Configuration Netlify

claude.md                # Spécifications du projet
echelle_sensorielle_20_niveaux_complet.txt # Échelle sensorielle
```

## 🎨 Guide des couleurs

- **Primaire** : #0066cc (bleu)
- **Succès** : #0e8420 (vert)  
- **Attention** : #f99b11 (orange)
- **Erreur** : #c7162b (rouge)
- **Secondaire** : #666666 (gris)

## 🔄 Workflow de développement

1. **Développement** : modifier les fichiers dans `public/`
2. **Test local** : servir avec un serveur HTTP local
3. **Commit** : utiliser des messages descriptifs
4. **Déploiement** : automatique sur Netlify via Git

## 📊 API Endpoints (Backend PocketBase)

```
POST /api/register          # Inscription utilisateur  
POST /api/login             # Connexion
POST /api/check-username    # Vérification nom d'utilisateur
POST /api/forgot-password   # Récupération mot de passe

GET  /api/schedule/fixed-elements     # Éléments fixes
POST /api/schedule/fixed-elements     # Ajouter élément fixe
GET  /api/schedule/floating-elements  # Éléments flottants  
POST /api/schedule/floating-elements  # Ajouter élément flottant

POST /api/schedule/update-task  # Déplacer tâche
POST /api/user/preferences     # Sauver préférences
POST /api/user/energy         # Mettre à jour énergie
```

## ♿ Accessibilité

- **Navigation clavier** : Tab, flèches, Espace, Entrée
- **Lecteurs d'écran** : ARIA labels, roles, live regions
- **Contraste** : ratios WCAG 2.1 AA respectés
- **Animations** : réductibles via `prefers-reduced-motion`
- **Polices** : tailles ajustables, lisibilité optimisée

## 🧪 Tests

### Tests manuels recommandés
- [ ] Navigation au clavier sur toutes les pages
- [ ] Drag & drop souris et clavier  
- [ ] Responsive sur mobile/tablette
- [ ] Lecteur d'écran (NVDA/JAWS)
- [ ] Contraste en mode sombre
- [ ] Performance sur connexion lente

### Outils de validation
- **HTML** : W3C Markup Validator
- **CSS** : W3C CSS Validator  
- **Accessibilité** : axe-core, WAVE
- **Performance** : Lighthouse

## 🚀 Déploiement

### Netlify (Front-end)
1. Connecter le repository GitHub
2. Build settings : publish directory = `public`
3. Variables d'environnement si nécessaire
4. Déploiement automatique sur push

### Render (Back-end PocketBase)
1. Créer un nouveau service web
2. Connecter repository PocketBase
3. Configuration des variables d'environnement
4. URL de production dans `netlify.toml`

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)  
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans `claude.md`

---

*QFQA - Une app bienveillante pour votre quotidien* 💙
# QFQA Backend - PocketBase

Backend API pour l'application QFQA, basé sur PocketBase avec des extensions personnalisées.

## 🏗️ Architecture

- **Framework** : PocketBase (Go)
- **Base de données** : SQLite embarquée
- **Authentification** : JWT avec PocketBase Auth
- **Déploiement** : Render (containerisé)

## 📊 Collections de données

### `users` (étendue)
- Champs PocketBase par défaut
- `neurotype` : tdah|autiste|both

### `user_profiles`
- `user_id` : Relation vers users
- `neurotype` : Type neurologique
- `energy_morning/afternoon/evening` : Profils énergétiques (1-5)
- `current_energy` : Niveau actuel (1-5)
- `sensitivities` : Sensibilités personnelles
- `strategies` : Stratégies d'adaptation
- Préférences interface (thème, notifications, etc.)

### `fixed_elements`
- `user_id` : Propriétaire
- `name`, `date`, `start_time`, `duration` : Infos de base
- `location_type` : home|external
- `address` : Adresse si externe
- `travel_energy_audio/visual` : Énergie trajet (échelle 20)
- `activity_energy` : Énergie activité (1-5)
- `notes` : Notes libres

### `floating_tasks`
- `user_id` : Propriétaire
- `name`, `duration`, `priority` : Infos de base
- `deadline` : Date limite optionnelle
- `sensory_audio/visual/tactile/olfactory/gustatory` : Échelle 20 niveaux
- `sensory_total` : Total calculé automatiquement
- `energy_required` : Calculé selon profil sensoriel (1-5)
- `category` : Catégorie de la tâche
- `scheduled_time/date` : Planification

### `energy_logs`
- `user_id` : Propriétaire
- `energy_level` : Niveau (1-5)
- `time_period` : morning|afternoon|evening|night
- `notes` : Context/observations

## 🔧 API Endpoints

### Authentification
```
POST /api/collections/users/auth-with-password  # Connexion
POST /api/collections/users/records             # Inscription
POST /api/collections/users/request-password-reset
POST /api/collections/users/confirm-password-reset
```

### Endpoints personnalisés
```
GET  /health                           # Santé du service
POST /api/check-username               # Vérifier disponibilité
POST /api/demo-login                   # Connexion démo

GET  /api/schedule/fixed-elements      # Éléments fixes
POST /api/schedule/fixed-elements      # Créer élément fixe
GET  /api/schedule/floating-elements   # Tâches flottantes
POST /api/schedule/floating-elements   # Créer tâche

POST /api/schedule/update-task         # Planifier tâche
POST /api/schedule/remove-task         # Déplanifier tâche
GET  /api/schedule/current             # Emploi du temps jour
GET  /api/schedule/suggestions         # Suggestions IA
POST /api/schedule/optimize            # Optimisation auto

GET  /api/user/energy/current          # Énergie actuelle
POST /api/user/energy/update           # Maj énergie
POST /api/user/preferences             # Sauver préférences

POST /api/sensory/compatibility        # Test compatibilité
```

## 🧠 Logique métier

### Échelle sensorielle (20 niveaux)
Chaque sens (ouïe, vue, toucher, odorat, goût) est évalué sur 20 niveaux d'intensité, de "silence absolu" à "carnaval de Rio". Chaque niveau a un impact énergétique calculé.

### Calcul de compatibilité
```go
// Facteurs pris en compte :
- Neurotype (TDAH: x1.3, Autiste: x1.5, Both: x1.7)
- Sensibilités personnelles (+0.3 par sensibilité déclenchée)
- Période de la journée (énergie disponible)
- Priorité de la tâche (urgente = bonus)
```

### Recommandations intelligentes
- Analyse du profil énergétique utilisateur
- Calcul de scores de compatibilité temporels
- Génération de raisons, avertissements et adaptations
- Prise en compte des stratégies personnelles

## 🛡️ Sécurité

### Authentification
- JWT tokens avec vérification automatique
- Middleware d'auth sur toutes les routes sensibles
- Rate limiting (100 req/min par IP)
- En-têtes de sécurité (XSS, CSRF, etc.)

### Autorizations (RLS)
```sql
-- Exemple : Seul le propriétaire peut voir ses données
@request.auth.id = user_id
```

### Validation
- Validation des données sensorielles (1-20)
- Calculs automatiques (totaux, niveaux d'énergie)
- Sanitization des entrées utilisateur

## 🚀 Déploiement local

```bash
# Installer Go 1.21+
cd backend

# Installer les dépendances
go mod tidy

# Lancer en mode dev
go run . serve --dev

# API disponible sur http://localhost:8090
# Interface admin sur http://localhost:8090/_/
```

## 🐳 Déploiement Render

### Automatique via Git
1. Push vers la branche `main`
2. Render détecte le `Dockerfile`
3. Build et déploiement automatiques
4. Santé check sur `/health`

### Variables d'environnement
```bash
PORT=8080                    # Port Render
PB_DATA=/app/data           # Données persistantes
PB_ENCRYPTION_KEY=auto      # Clé crypto (générée)
NETLIFY_URL=https://...     # Frontend pour CORS
NODE_ENV=production         # Mode production
```

### Persistence
- Volume Render monté sur `/app/data`
- Base SQLite + uploads stockés
- Sauvegarde quotidienne recommandée

## 🧪 Tests

### Tester l'API
```bash
# Santé du service
curl https://qfqa-backend.render.com/health

# Vérifier nom d'utilisateur
curl -X POST https://qfqa-backend.render.com/api/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'

# Connexion démo
curl -X POST https://qfqa-backend.render.com/api/demo-login
```

### Tests de charge
- Rate limiting : >100 req/min = 429
- Payload max : 10MB par défaut
- Timeout : 30s sur les requêtes longues

## 📈 Monitoring

### Logs
```bash
# Render logs en temps réel
render logs -s qfqa-backend -f

# Metrics disponibles
- Temps de réponse API
- Taux d'erreur par endpoint
- Utilisation mémoire/CPU
- Taille base de données
```

### Health checks
```json
GET /health
{
  "status": "healthy",
  "service": "QFQA Backend", 
  "version": "1.0.0"
}
```

## 🔄 Migrations

Les migrations sont automatiquement appliquées au démarrage :
- `migrations/1694701000_initial_collections.go`
- Structure des collections
- Règles de sécurité
- Données de demo

## 🤝 Développement

### Contribuer
1. Fork le repository
2. Créer une branche feature
3. Tester localement avec `go run . serve --dev`
4. Pull Request avec description

### Structure du code
```
backend/
├── main.go              # Point d'entrée + routes
├── api_handlers.go      # Handlers API métier
├── auth_middleware.go   # Sécurité & auth
├── sensory_engine.go    # Logique sensorielle
├── migrations/          # Schema BDD
├── Dockerfile          # Container
└── render.yaml         # Config déploiement
```

---

**QFQA Backend** - Une API bienveillante pour l'organisation du quotidien 💙
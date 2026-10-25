package main

import (
	"log"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
)

func main() {
	app := pocketbase.New()

	// Configuration des hooks et middlewares
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Middlewares de sécurité
		e.Router.Use(securityHeadersMiddleware())
		e.Router.Use(rateLimitMiddleware())
		
		// Configuration CORS pour Netlify
		e.Router.Use(corsMiddleware())
		
		// Middleware d'authentification pour les routes API
		e.Router.Use(authMiddleware(app))

		// Routes personnalisées
		setupCustomRoutes(e.Router, app)
		
		// Configuration des règles de sécurité
		return setupSecurityRules(app)
	})

	// Configuration des hooks d'authentification
	setupAuthHooks(app)

	// Hook après création d'utilisateur
	app.OnRecordAfterCreateRequest("users").Add(func(e *core.RecordCreateEvent) error {
		return initializeUserData(app, e.Record)
	})

	// Hook pour validation des données sensorielles
	app.OnRecordBeforeCreateRequest("floating_tasks").Add(func(e *core.RecordCreateEvent) error {
		return validateSensoryData(e.Record)
	})

	app.OnRecordBeforeUpdateRequest("floating_tasks").Add(func(e *core.RecordUpdateEvent) error {
		return validateSensoryData(e.Record)
	})

	// Démarrage du serveur
	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// Middleware CORS pour autoriser les requêtes depuis Netlify
func corsMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			origin := c.Request().Header.Get("Origin")
			
			// Autoriser les domaines de développement et production
			allowedOrigins := []string{
				"http://localhost:8000",
				"http://127.0.0.1:8000",
				"https://qfqa.netlify.app",
			}

			// Récupérer l'URL Netlify depuis les variables d'environnement
			if netlifyURL := os.Getenv("NETLIFY_URL"); netlifyURL != "" {
				allowedOrigins = append(allowedOrigins, netlifyURL)
			}

			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin {
					c.Response().Header().Set("Access-Control-Allow-Origin", origin)
					break
				}
			}

			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Response().Header().Set("Access-Control-Allow-Credentials", "true")

			if c.Request().Method == "OPTIONS" {
				return c.NoContent(http.StatusOK)
			}

			return next(c)
		}
	}
}

// Configuration des routes personnalisées
func setupCustomRoutes(router *echo.Group, app *pocketbase.PocketBase) {
	// Route de vérification de santé
	router.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status": "healthy",
			"service": "QFQA Backend",
			"version": "1.0.0",
		})
	})

	// Route de vérification de nom d'utilisateur
	router.POST("/api/check-username", func(c echo.Context) error {
		return checkUsernameAvailability(c, app)
	})

	// Route de connexion démo
	router.POST("/api/demo-login", func(c echo.Context) error {
		return handleDemoLogin(c, app)
	})

	// Routes pour suggestions intelligentes
	router.GET("/api/schedule/suggestions", func(c echo.Context) error {
		return generateScheduleSuggestions(c, app)
	})

	// Route pour optimisation automatique
	router.POST("/api/schedule/optimize", func(c echo.Context) error {
		return optimizeUserSchedule(c, app)
	})

	// Route pour calcul de compatibilité sensorielle
	router.POST("/api/sensory/compatibility", func(c echo.Context) error {
		return calculateSensoryCompatibility(c, app)
	})

	// Routes pour gestion de l'énergie quotidienne
	router.GET("/api/user/energy/current", func(c echo.Context) error {
		return getCurrentEnergyLevel(c, app)
	})

	router.POST("/api/user/energy/update", func(c echo.Context) error {
		return updateEnergyLevel(c, app)
	})

	// Routes pour éléments fixes
	router.GET("/api/schedule/fixed-elements", func(c echo.Context) error {
		return getFixedElements(c, app)
	})

	router.POST("/api/schedule/fixed-elements", func(c echo.Context) error {
		return createFixedElement(c, app)
	})

	// Routes pour tâches flottantes  
	router.GET("/api/schedule/floating-elements", func(c echo.Context) error {
		return getFloatingTasks(c, app)
	})
	
	// Alias pour compatibilité frontend
	router.GET("/api/schedule/floating-tasks", func(c echo.Context) error {
		return getFloatingTasks(c, app)
	})

	router.POST("/api/schedule/floating-elements", func(c echo.Context) error {
		return createFloatingTask(c, app)
	})

	// Routes pour planification
	router.POST("/api/schedule/update-task", func(c echo.Context) error {
		return scheduleTask(c, app)
	})

	router.POST("/api/schedule/remove-task", func(c echo.Context) error {
		return unscheduleTask(c, app)
	})

	// Route pour l'emploi du temps actuel
	router.GET("/api/schedule/current", func(c echo.Context) error {
		return getCurrentSchedule(c, app)
	})

	// Route pour sauvegarder les préférences
	router.POST("/api/user/preferences", func(c echo.Context) error {
		return saveUserPreferences(c, app)
	})

	// Routes de navigation temporelle
	router.GET("/api/schedule/previous-day", func(c echo.Context) error {
		return navigateSchedule(c, app, -1)
	})

	router.GET("/api/schedule/next-day", func(c echo.Context) error {
		return navigateSchedule(c, app, 1)
	})
}

// Initialisation des données utilisateur après inscription
func initializeUserData(app *pocketbase.PocketBase, user *models.Record) error {
	// Créer le profil utilisateur avec des valeurs par défaut
	userProfile, err := app.Dao().FindFirstRecordByFilter(
		"user_profiles",
		"user_id = {:userId}",
		map[string]any{"userId": user.Id},
	)

	if err != nil {
		// Créer un nouveau profil utilisateur
		collection, err := app.Dao().FindCollectionByNameOrId("user_profiles")
		if err != nil {
			return err
		}

		userProfile = models.NewRecord(collection)
		userProfile.Set("user_id", user.Id)
		userProfile.Set("energy_morning", 3)
		userProfile.Set("energy_afternoon", 3)
		userProfile.Set("energy_evening", 3)
		userProfile.Set("current_energy", 3)
		
		// Neurotype depuis l'inscription
		if neurotype := user.GetString("neurotype"); neurotype != "" {
			userProfile.Set("neurotype", neurotype)
		}

		// Sensibilités par défaut selon le neurotype
		neurotype := user.GetString("neurotype")
		defaultSensitivities := getDefaultSensitivities(neurotype)
		userProfile.Set("sensitivities", defaultSensitivities)

		if err := app.Dao().SaveRecord(userProfile); err != nil {
			return err
		}
	}

	return nil
}

// Sensibilités par défaut selon le neurotype
func getDefaultSensitivities(neurotype string) []string {
	switch neurotype {
	case "tdah":
		return []string{"sound", "change"}
	case "autiste":
		return []string{"sound", "light", "touch", "change"}
	case "both":
		return []string{"sound", "light", "touch", "crowd", "change"}
	default:
		return []string{}
	}
}

// Validation des données sensorielles
func validateSensoryData(record *models.Record) error {
	// Vérifier que les valeurs sensorielles sont dans la plage 1-20
	sensoryFields := []string{"sensory_audio", "sensory_visual", "sensory_tactile", "sensory_olfactory", "sensory_gustatory"}
	
	for _, field := range sensoryFields {
		if value := record.GetInt(field); value < 1 || value > 20 {
			return apis.NewBadRequestError("Les valeurs sensorielles doivent être entre 1 et 20", nil)
		}
	}

	// Calculer et sauvegarder le score total
	total := 0
	for _, field := range sensoryFields {
		total += record.GetInt(field)
	}
	
	record.Set("sensory_total", total)
	
	// Calculer le niveau d'énergie basé sur le score sensoriel
	energyLevel := calculateEnergyFromSensoryScore(total)
	record.Set("energy_required", energyLevel)

	return nil
}

// Calcul du niveau d'énergie basé sur le score sensoriel
func calculateEnergyFromSensoryScore(sensoryTotal int) int {
	// Échelle 1-5 basée sur le score sensoriel total (5-100)
	switch {
	case sensoryTotal <= 20:
		return 1 // Très faible énergie
	case sensoryTotal <= 40:
		return 2 // Faible énergie
	case sensoryTotal <= 60:
		return 3 // Énergie modérée
	case sensoryTotal <= 80:
		return 4 // Énergie élevée
	default:
		return 5 // Très haute énergie
	}
}

// Vérification de disponibilité du nom d'utilisateur
func checkUsernameAvailability(c echo.Context, app *pocketbase.PocketBase) error {
	var requestData struct {
		Username string `json:"username"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	// Vérifier si le nom d'utilisateur existe déjà
	_, err := app.Dao().FindFirstRecordByFilter(
		"users",
		"username = {:username}",
		map[string]any{"username": requestData.Username},
	)

	available := err != nil // Disponible si erreur (pas trouvé)
	
	response := map[string]interface{}{
		"available": available,
		"message": "",
	}

	if !available {
		response["message"] = "Ce nom d'utilisateur est déjà pris"
	} else if len(requestData.Username) < 3 {
		response["available"] = false
		response["message"] = "Le nom d'utilisateur doit contenir au moins 3 caractères"
	} else if !isValidUsername(requestData.Username) {
		response["available"] = false
		response["message"] = "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, _ et -"
	} else {
		response["message"] = "Ce nom d'utilisateur est disponible"
	}

	return c.JSON(http.StatusOK, response)
}

// Validation du format du nom d'utilisateur
func isValidUsername(username string) bool {
	for _, char := range username {
		if !((char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '_' || char == '-') {
			return false
		}
	}
	return true
}

// Connexion démo
func handleDemoLogin(c echo.Context, app *pocketbase.PocketBase) error {
	// Créer ou récupérer l'utilisateur démo
	demoUser, err := app.Dao().FindFirstRecordByFilter(
		"users",
		"username = 'demo_user'",
	)

	if err != nil {
		// Créer l'utilisateur démo
		collection, err := app.Dao().FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		demoUser = models.NewRecord(collection)
		demoUser.Set("username", "demo_user")
		demoUser.Set("email", "demo@qfqa.app")
		demoUser.Set("neurotype", "both")
		demoUser.SetPassword("demo123456")

		if err := app.Dao().SaveRecord(demoUser); err != nil {
			return err
		}

		// Initialiser les données démo
		if err := initializeDemoData(app, demoUser); err != nil {
			return err
		}
	}

	// Générer un token d'authentification
	token, err := app.Dao().AuthenticateAdmin(demoUser.GetString("email"), "demo123456")
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id": demoUser.Id,
			"username": demoUser.GetString("username"),
			"neurotype": demoUser.GetString("neurotype"),
		},
		"redirect": "/schedule",
	})
}

// Initialisation des données de démonstration
func initializeDemoData(app *pocketbase.PocketBase, user *models.Record) error {
	// Créer quelques tâches flottantes de démonstration
	floatingTasksCollection, err := app.Dao().FindCollectionByNameOrId("floating_tasks")
	if err != nil {
		return err
	}

	demoTasks := []map[string]interface{}{
		{
			"name": "Appeler maman",
			"duration": 30,
			"category": "personal",
			"priority": "high",
			"sensory_audio": 3,
			"sensory_visual": 2,
			"sensory_tactile": 1,
			"sensory_olfactory": 1,
			"sensory_gustatory": 1,
		},
		{
			"name": "Ranger le bureau",
			"duration": 90,
			"category": "household",
			"priority": "medium",
			"sensory_audio": 5,
			"sensory_visual": 8,
			"sensory_tactile": 12,
			"sensory_olfactory": 6,
			"sensory_gustatory": 1,
		},
		{
			"name": "Arroser les plantes",
			"duration": 15,
			"category": "household",
			"priority": "low",
			"sensory_audio": 2,
			"sensory_visual": 3,
			"sensory_tactile": 4,
			"sensory_olfactory": 2,
			"sensory_gustatory": 1,
		},
	}

	for _, taskData := range demoTasks {
		task := models.NewRecord(floatingTasksCollection)
		task.Set("user_id", user.Id)
		
		for key, value := range taskData {
			task.Set(key, value)
		}
		
		// La validation sensorielle sera automatiquement appliquée
		if err := app.Dao().SaveRecord(task); err != nil {
			return err
		}
	}

	return nil
}

// Génération de suggestions intelligentes
func generateScheduleSuggestions(c echo.Context, app *pocketbase.PocketBase) error {
	// Récupérer l'utilisateur connecté
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	// Récupérer le profil utilisateur pour connaître l'énergie actuelle
	userProfile, err := app.Dao().FindFirstRecordByFilter(
		"user_profiles",
		"user_id = {:userId}",
		map[string]any{"userId": authRecord.Id},
	)
	if err != nil {
		return apis.NewNotFoundError("Profil utilisateur introuvable", err)
	}

	currentEnergy := userProfile.GetInt("current_energy")
	
	// Récupérer les tâches flottantes non planifiées
	floatingTasks, err := app.Dao().FindRecordsByFilter(
		"floating_tasks",
		"user_id = {:userId} && scheduled_time = ''",
		"-priority",
		30,
		0,
		map[string]any{"userId": authRecord.Id},
	)
	if err != nil {
		return err
	}

	suggestions := make([]map[string]interface{}, 0)
	
	for _, task := range floatingTasks {
		energyRequired := task.GetInt("energy_required")
		priority := task.GetString("priority")
		
		// Logique de suggestion basée sur l'énergie et la priorité
		var reason string
		var suggestedTime string
		
		if priority == "urgent" || priority == "high" {
			reason = "Tâche prioritaire à traiter rapidement"
			suggestedTime = findBestTimeSlot(currentEnergy, energyRequired, true)
		} else if energyRequired <= currentEnergy {
			reason = fmt.Sprintf("Compatible avec votre énergie actuelle (%d/5)", currentEnergy)
			suggestedTime = findBestTimeSlot(currentEnergy, energyRequired, false)
		} else {
			reason = "À reporter quand votre énergie sera plus élevée"
			suggestedTime = ""
		}
		
		if suggestedTime != "" {
			suggestions = append(suggestions, map[string]interface{}{
				"task_id": task.Id,
				"task_name": task.GetString("name"),
				"reason": reason,
				"suggested_time": suggestedTime,
				"energy_required": energyRequired,
				"priority": priority,
			})
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"suggestions": suggestions,
		"current_energy": currentEnergy,
	})
}

// Trouver le meilleur créneau horaire
func findBestTimeSlot(currentEnergy, energyRequired int, isUrgent bool) string {
	// Logique simplifiée - dans la réalité, on vérifierait les créneaux disponibles
	hour := 9 // Heure par défaut
	
	// Ajuster selon l'énergie requise
	if energyRequired <= 2 {
		hour = 14 // Après-midi pour tâches légères
	} else if energyRequired >= 4 {
		hour = 10 // Matin pour tâches exigeantes
	}
	
	if isUrgent {
		hour = 9 // Immédiatement le matin pour les urgences
	}
	
	return fmt.Sprintf("%02d:00", hour)
}

// Optimisation automatique de l'emploi du temps
func optimizeUserSchedule(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	// Récupérer les tâches non planifiées
	floatingTasks, err := app.Dao().FindRecordsByFilter(
		"floating_tasks",
		"user_id = {:userId} && scheduled_time = ''",
		"-priority, energy_required",
		50,
		0,
		map[string]any{"userId": authRecord.Id},
	)
	if err != nil {
		return err
	}

	optimized := 0
	for _, task := range floatingTasks {
		// Trouver le meilleur créneau pour cette tâche
		energyRequired := task.GetInt("energy_required")
		isUrgent := task.GetString("priority") == "urgent" || task.GetString("priority") == "high"
		
		suggestedTime := findBestTimeSlot(3, energyRequired, isUrgent) // Énergie par défaut
		
		if suggestedTime != "" {
			task.Set("scheduled_time", suggestedTime)
			if err := app.Dao().SaveRecord(task); err == nil {
				optimized++
			}
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"optimized_tasks": optimized,
		"message": fmt.Sprintf("%d tâches ont été planifiées automatiquement", optimized),
	})
}

// Calcul de compatibilité sensorielle
func calculateSensoryCompatibility(c echo.Context, app *pocketbase.PocketBase) error {
	var requestData struct {
		SensoryAudio     int `json:"sensory_audio"`
		SensoryVisual    int `json:"sensory_visual"`
		SensoryTactile   int `json:"sensory_tactile"`
		SensoryOlfactory int `json:"sensory_olfactory"`
		SensoryGustatory int `json:"sensory_gustatory"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	total := requestData.SensoryAudio + requestData.SensoryVisual + 
		requestData.SensoryTactile + requestData.SensoryOlfactory + requestData.SensoryGustatory

	energyLevel := calculateEnergyFromSensoryScore(total)
	
	// Déterminer la compatibilité selon l'heure actuelle
	currentHour := time.Now().Hour()
	var periodEnergy int
	
	if currentHour >= 6 && currentHour < 12 {
		periodEnergy = 4 // Matin - énergie élevée
	} else if currentHour >= 12 && currentHour < 18 {
		periodEnergy = 3 // Après-midi - énergie modérée
	} else if currentHour >= 18 && currentHour < 22 {
		periodEnergy = 2 // Soirée - énergie faible
	} else {
		periodEnergy = 1 // Nuit - énergie très faible
	}

	compatible := energyLevel <= periodEnergy
	
	return c.JSON(http.StatusOK, map[string]interface{}{
		"sensory_total": total,
		"energy_required": energyLevel,
		"period_energy": periodEnergy,
		"compatible": compatible,
		"recommendation": getEnergyRecommendation(energyLevel, periodEnergy),
	})
}

// Recommandations basées sur l'énergie
func getEnergyRecommendation(required, available int) string {
	if required <= available {
		return "Cette tâche convient parfaitement à votre énergie actuelle"
	} else if required == available + 1 {
		return "Cette tâche est légèrement exigeante, prévoyez une pause après"
	} else {
		return "Cette tâche est trop exigeante pour le moment, reportez-la"
	}
}

// Récupérer le niveau d'énergie actuel
func getCurrentEnergyLevel(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	userProfile, err := app.Dao().FindFirstRecordByFilter(
		"user_profiles",
		"user_id = {:userId}",
		map[string]any{"userId": authRecord.Id},
	)
	if err != nil {
		return apis.NewNotFoundError("Profil utilisateur introuvable", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"current_energy": userProfile.GetInt("current_energy"),
		"energy_morning": userProfile.GetInt("energy_morning"),
		"energy_afternoon": userProfile.GetInt("energy_afternoon"),
		"energy_evening": userProfile.GetInt("energy_evening"),
		"last_updated": userProfile.GetDateTime("updated"),
	})
}

// Mettre à jour le niveau d'énergie
func updateEnergyLevel(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	var requestData struct {
		EnergyLevel int `json:"energy_level"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	if requestData.EnergyLevel < 1 || requestData.EnergyLevel > 5 {
		return apis.NewBadRequestError("Le niveau d'énergie doit être entre 1 et 5", nil)
	}

	userProfile, err := app.Dao().FindFirstRecordByFilter(
		"user_profiles",
		"user_id = {:userId}",
		map[string]any{"userId": authRecord.Id},
	)
	if err != nil {
		return apis.NewNotFoundError("Profil utilisateur introuvable", err)
	}

	userProfile.Set("current_energy", requestData.EnergyLevel)
	
	if err := app.Dao().SaveRecord(userProfile); err != nil {
		return apis.NewInternalServerError("Erreur lors de la sauvegarde", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
		"current_energy": requestData.EnergyLevel,
		"message": "Niveau d'énergie mis à jour avec succès",
	})
}

// Navigation temporelle (jour précédent/suivant)
func navigateSchedule(c echo.Context, app *pocketbase.PocketBase, dayOffset int) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	// Date actuelle ou demandée
	currentDateStr := c.QueryParam("current_date")
	var currentDate time.Time
	var err error
	
	if currentDateStr != "" {
		currentDate, err = time.Parse("2006-01-02", currentDateStr)
		if err != nil {
			return apis.NewBadRequestError("Format de date invalide", err)
		}
	} else {
		currentDate = time.Now()
	}

	// Calculer la nouvelle date
	newDate := currentDate.AddDate(0, 0, dayOffset)
	newDateStr := newDate.Format("2006-01-02")

	// Retourner l'emploi du temps de la nouvelle date
	c.Request().URL.RawQuery = fmt.Sprintf("date=%s", newDateStr)
	return getCurrentSchedule(c, app)
}
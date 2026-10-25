package main

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/models"
)

// Handler pour vérifier la disponibilité d'un nom d'utilisateur
func checkUsernameAvailability(c echo.Context, app *pocketbase.PocketBase) error {
	var request struct {
		Username string `json:"username"`
	}

	if err := c.Bind(&request); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	if request.Username == "" {
		return apis.NewBadRequestError("Le nom d'utilisateur est requis", nil)
	}

	// Vérifier si l'utilisateur existe
	_, err := app.Dao().FindRecordByData("users", "username", request.Username)
	
	if err != nil {
		// Utilisateur non trouvé = disponible
		return c.JSON(http.StatusOK, map[string]interface{}{
			"available": true,
			"message": "Ce nom d'utilisateur est disponible",
		})
	}

	// Utilisateur trouvé = non disponible
	return c.JSON(http.StatusOK, map[string]interface{}{
		"available": false,
		"message": "Ce nom d'utilisateur est déjà pris",
	})
}

// Handler pour la connexion démo
func handleDemoLogin(c echo.Context, app *pocketbase.PocketBase) error {
	// Créer une session démo temporaire
	demoUser := map[string]interface{}{
		"id": "demo-user",
		"username": "demo",
		"neurotype": "tdah",
		"demo": true,
	}

	return c.HTML(http.StatusOK, `
		<div hx-trigger="load" hx-get="/schedule.html" hx-target="#main-content" hx-push-url="/schedule">
			<p>Connexion en mode démo... Redirection vers votre emploi du temps.</p>
		</div>
	`)
}

// Handler pour la récupération des éléments fixes
func getFixedElements(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	// Date demandée (par défaut aujourd'hui)
	dateStr := c.QueryParam("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	elements, err := app.Dao().FindRecordsByFilter(
		"fixed_elements",
		"user_id = {:userId} && date = {:date}",
		"start_time",
		100,
		0,
		map[string]any{
			"userId": authRecord.Id,
			"date":   dateStr,
		},
	)

	if err != nil {
		return apis.NewInternalServerError("Erreur lors de la récupération", err)
	}

	// Transformer les données pour le frontend
	result := make([]map[string]interface{}, len(elements))
	for i, element := range elements {
		result[i] = map[string]interface{}{
			"id":                    element.Id,
			"name":                  element.GetString("name"),
			"date":                  element.GetString("date"),
			"start_time":            element.GetString("start_time"),
			"duration":              element.GetInt("duration"),
			"location_type":         element.GetString("location_type"),
			"address":               element.GetString("address"),
			"travel_energy_audio":   element.GetInt("travel_energy_audio"),
			"travel_energy_visual":  element.GetInt("travel_energy_visual"),
			"activity_energy":       element.GetInt("activity_energy"),
			"notes":                 element.GetString("notes"),
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"elements": result,
		"date":     dateStr,
	})
}

// Handler pour la création d'éléments fixes
func createFixedElement(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	var requestData struct {
		Name                string `json:"name"`
		Date                string `json:"date"`
		StartTime           string `json:"start_time"`
		Duration            int    `json:"duration"`
		LocationType        string `json:"location_type"`
		Address             string `json:"address"`
		TravelEnergyAudio   int    `json:"travel_energy_audio"`
		TravelEnergyVisual  int    `json:"travel_energy_visual"`
		ActivityEnergy      int    `json:"activity_energy"`
		Notes               string `json:"notes"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	// Validation
	if requestData.Name == "" {
		return apis.NewBadRequestError("Le nom est requis", nil)
	}
	if requestData.Duration < 5 || requestData.Duration > 480 {
		return apis.NewBadRequestError("La durée doit être entre 5 et 480 minutes", nil)
	}

	collection, err := app.Dao().FindCollectionByNameOrId("fixed_elements")
	if err != nil {
		return apis.NewInternalServerError("Collection introuvable", err)
	}

	record := models.NewRecord(collection)
	record.Set("user_id", authRecord.Id)
	record.Set("name", requestData.Name)
	record.Set("date", requestData.Date)
	record.Set("start_time", requestData.StartTime)
	record.Set("duration", requestData.Duration)
	record.Set("location_type", requestData.LocationType)
	record.Set("address", requestData.Address)
	record.Set("travel_energy_audio", requestData.TravelEnergyAudio)
	record.Set("travel_energy_visual", requestData.TravelEnergyVisual)
	record.Set("activity_energy", requestData.ActivityEnergy)
	record.Set("notes", requestData.Notes)

	if err := app.Dao().SaveRecord(record); err != nil {
		return apis.NewInternalServerError("Erreur lors de la sauvegarde", err)
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":      record.Id,
		"message": "Élément fixe créé avec succès",
	})
}

// Handler pour la récupération des tâches flottantes
func getFloatingTasks(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	// Filtres
	filter := "user_id = {:userId}"
	params := map[string]any{"userId": authRecord.Id}

	// Filtre par statut (planifiées ou non)
	status := c.QueryParam("status")
	if status == "scheduled" {
		filter += " && scheduled_time != ''"
	} else if status == "unscheduled" {
		filter += " && scheduled_time = ''"
	}

	// Filtre par priorité
	if priority := c.QueryParam("priority"); priority != "" {
		filter += " && priority = {:priority}"
		params["priority"] = priority
	}

	tasks, err := app.Dao().FindRecordsByFilter(
		"floating_tasks",
		filter,
		"-priority, -created",
		100,
		0,
		params,
	)

	if err != nil {
		return apis.NewInternalServerError("Erreur lors de la récupération", err)
	}

	// Transformer les données
	result := make([]map[string]interface{}, len(tasks))
	for i, task := range tasks {
		result[i] = map[string]interface{}{
			"id":                task.Id,
			"name":              task.GetString("name"),
			"duration":          task.GetInt("duration"),
			"priority":          task.GetString("priority"),
			"deadline":          task.GetString("deadline"),
			"sensory_audio":     task.GetInt("sensory_audio"),
			"sensory_visual":    task.GetInt("sensory_visual"),
			"sensory_tactile":   task.GetInt("sensory_tactile"),
			"sensory_olfactory": task.GetInt("sensory_olfactory"),
			"sensory_gustatory": task.GetInt("sensory_gustatory"),
			"sensory_total":     task.GetInt("sensory_total"),
			"energy_required":   task.GetInt("energy_required"),
			"category":          task.GetString("category"),
			"scheduled_time":    task.GetString("scheduled_time"),
			"scheduled_date":    task.GetString("scheduled_date"),
			"notes":             task.GetString("notes"),
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"tasks": result,
		"count": len(result),
	})
}

// Handler pour la création de tâches flottantes
func createFloatingTask(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	var requestData struct {
		Name             string `json:"name"`
		Duration         int    `json:"duration"`
		Priority         string `json:"priority"`
		Deadline         string `json:"deadline"`
		SensoryAudio     int    `json:"sensory_audio"`
		SensoryVisual    int    `json:"sensory_visual"`
		SensoryTactile   int    `json:"sensory_tactile"`
		SensoryOlfactory int    `json:"sensory_olfactory"`
		SensoryGustatory int    `json:"sensory_gustatory"`
		Category         string `json:"category"`
		Notes            string `json:"notes"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	// Validation
	if requestData.Name == "" {
		return apis.NewBadRequestError("Le nom est requis", nil)
	}
	if requestData.Duration < 5 || requestData.Duration > 300 {
		return apis.NewBadRequestError("La durée doit être entre 5 et 300 minutes", nil)
	}

	collection, err := app.Dao().FindCollectionByNameOrId("floating_tasks")
	if err != nil {
		return apis.NewInternalServerError("Collection introuvable", err)
	}

	record := models.NewRecord(collection)
	record.Set("user_id", authRecord.Id)
	record.Set("name", requestData.Name)
	record.Set("duration", requestData.Duration)
	record.Set("priority", requestData.Priority)
	record.Set("deadline", requestData.Deadline)
	record.Set("sensory_audio", requestData.SensoryAudio)
	record.Set("sensory_visual", requestData.SensoryVisual)
	record.Set("sensory_tactile", requestData.SensoryTactile)
	record.Set("sensory_olfactory", requestData.SensoryOlfactory)
	record.Set("sensory_gustatory", requestData.SensoryGustatory)
	record.Set("category", requestData.Category)
	record.Set("notes", requestData.Notes)

	// La validation sensorielle sera automatiquement appliquée par le hook
	if err := app.Dao().SaveRecord(record); err != nil {
		return apis.NewInternalServerError("Erreur lors de la sauvegarde", err)
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":             record.Id,
		"sensory_total":  record.GetInt("sensory_total"),
		"energy_required": record.GetInt("energy_required"),
		"message":        "Tâche créée avec succès",
	})
}

// Handler pour la planification d'une tâche
func scheduleTask(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	var requestData struct {
		TaskID        string `json:"task_id"`
		ScheduledTime string `json:"scheduled_time"`
		ScheduledDate string `json:"scheduled_date"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	// Récupérer la tâche
	task, err := app.Dao().FindFirstRecordByFilter(
		"floating_tasks",
		"id = {:taskId} && user_id = {:userId}",
		map[string]any{
			"taskId": requestData.TaskID,
			"userId": authRecord.Id,
		},
	)

	if err != nil {
		return apis.NewNotFoundError("Tâche introuvable", err)
	}

	// Vérifier la compatibilité énergétique
	if requestData.ScheduledDate == "" {
		requestData.ScheduledDate = time.Now().Format("2006-01-02")
	}

	energyRequired := task.GetInt("energy_required")
	if !checkTimeSlotCompatibility(requestData.ScheduledTime, energyRequired) {
		return apis.NewBadRequestError("Ce créneau n'est pas compatible avec cette tâche", nil)
	}

	// Planifier la tâche
	task.Set("scheduled_time", requestData.ScheduledTime)
	task.Set("scheduled_date", requestData.ScheduledDate)

	if err := app.Dao().SaveRecord(task); err != nil {
		return apis.NewInternalServerError("Erreur lors de la planification", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":        "Tâche planifiée avec succès",
		"scheduled_time": requestData.ScheduledTime,
		"scheduled_date": requestData.ScheduledDate,
	})
}

// Handler pour déplanifier une tâche
func unscheduleTask(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	var requestData struct {
		TaskID string `json:"task_id"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	// Récupérer la tâche
	task, err := app.Dao().FindFirstRecordByFilter(
		"floating_tasks",
		"id = {:taskId} && user_id = {:userId}",
		map[string]any{
			"taskId": requestData.TaskID,
			"userId": authRecord.Id,
		},
	)

	if err != nil {
		return apis.NewNotFoundError("Tâche introuvable", err)
	}

	// Déplanifier
	task.Set("scheduled_time", "")
	task.Set("scheduled_date", "")

	if err := app.Dao().SaveRecord(task); err != nil {
		return apis.NewInternalServerError("Erreur lors de la déplanification", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Tâche retirée du planning avec succès",
	})
}

// Handler pour sauvegarder les préférences utilisateur
func saveUserPreferences(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	var requestData struct {
		EnergyMorning     int      `json:"energy_morning"`
		EnergyAfternoon   int      `json:"energy_afternoon"`
		EnergyEvening     int      `json:"energy_evening"`
		Sensitivities     []string `json:"sensitivities"`
		Strategies        []string `json:"strategies"`
		Theme             string   `json:"theme"`
		Notifications     string   `json:"notifications"`
		ReducedMotion     bool     `json:"reduced_motion"`
	}

	if err := c.Bind(&requestData); err != nil {
		return apis.NewBadRequestError("Données invalides", err)
	}

	// Récupérer ou créer le profil utilisateur
	userProfile, err := app.Dao().FindFirstRecordByFilter(
		"user_profiles",
		"user_id = {:userId}",
		map[string]any{"userId": authRecord.Id},
	)

	if err != nil {
		// Créer un nouveau profil
		collection, err := app.Dao().FindCollectionByNameOrId("user_profiles")
		if err != nil {
			return apis.NewInternalServerError("Collection introuvable", err)
		}

		userProfile = models.NewRecord(collection)
		userProfile.Set("user_id", authRecord.Id)
		userProfile.Set("neurotype", authRecord.GetString("neurotype"))
	}

	// Mettre à jour les préférences
	userProfile.Set("energy_morning", requestData.EnergyMorning)
	userProfile.Set("energy_afternoon", requestData.EnergyAfternoon)
	userProfile.Set("energy_evening", requestData.EnergyEvening)
	userProfile.Set("sensitivities", requestData.Sensitivities)
	userProfile.Set("strategies", requestData.Strategies)
	userProfile.Set("theme", requestData.Theme)
	userProfile.Set("notifications", requestData.Notifications)
	userProfile.Set("reduced_motion", requestData.ReducedMotion)

	if err := app.Dao().SaveRecord(userProfile); err != nil {
		return apis.NewInternalServerError("Erreur lors de la sauvegarde", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Préférences sauvegardées avec succès",
	})
}

// Vérification simple de compatibilité temporelle
func checkTimeSlotCompatibility(timeSlot string, energyRequired int) bool {
	// Parse l'heure
	timeObj, err := time.Parse("15:04", timeSlot)
	if err != nil {
		return false
	}

	hour := timeObj.Hour()
	
	// Déterminer l'énergie disponible par période
	var availableEnergy int
	if hour >= 6 && hour < 12 {
		availableEnergy = 4 // Matin
	} else if hour >= 12 && hour < 18 {
		availableEnergy = 3 // Après-midi
	} else if hour >= 18 && hour < 22 {
		availableEnergy = 2 // Soirée
	} else {
		availableEnergy = 1 // Nuit
	}

	return energyRequired <= availableEnergy
}

// Handler pour l'emploi du temps du jour
func getCurrentSchedule(c echo.Context, app *pocketbase.PocketBase) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewUnauthorizedError("Authentification requise", nil)
	}

	dateStr := c.QueryParam("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	// Récupérer les éléments fixes
	fixedElements, err := app.Dao().FindRecordsByFilter(
		"fixed_elements",
		"user_id = {:userId} && date = {:date}",
		"start_time",
		50,
		0,
		map[string]any{
			"userId": authRecord.Id,
			"date":   dateStr,
		},
	)
	if err != nil {
		return apis.NewInternalServerError("Erreur lors de la récupération des éléments fixes", err)
	}

	// Récupérer les tâches planifiées
	scheduledTasks, err := app.Dao().FindRecordsByFilter(
		"floating_tasks",
		"user_id = {:userId} && scheduled_date = {:date} && scheduled_time != ''",
		"scheduled_time",
		50,
		0,
		map[string]any{
			"userId": authRecord.Id,
			"date":   dateStr,
		},
	)
	if err != nil {
		return apis.NewInternalServerError("Erreur lors de la récupération des tâches planifiées", err)
	}

	// Récupérer les tâches non planifiées
	unscheduledTasks, err := app.Dao().FindRecordsByFilter(
		"floating_tasks",
		"user_id = {:userId} && (scheduled_date = '' || scheduled_time = '')",
		"-priority, -created",
		50,
		0,
		map[string]any{"userId": authRecord.Id},
	)
	if err != nil {
		return apis.NewInternalServerError("Erreur lors de la récupération des tâches non planifiées", err)
	}

	// Créer le planning par heure
	schedule := make(map[string][]map[string]interface{})
	
	// Ajouter les éléments fixes
	for _, element := range fixedElements {
		timeSlot := element.GetString("start_time")
		if schedule[timeSlot] == nil {
			schedule[timeSlot] = make([]map[string]interface{}, 0)
		}
		
		schedule[timeSlot] = append(schedule[timeSlot], map[string]interface{}{
			"id":           element.Id,
			"type":         "fixed",
			"name":         element.GetString("name"),
			"duration":     element.GetInt("duration"),
			"energy":       element.GetInt("activity_energy"),
			"location":     element.GetString("address"),
			"notes":        element.GetString("notes"),
		})
	}

	// Ajouter les tâches planifiées
	for _, task := range scheduledTasks {
		timeSlot := task.GetString("scheduled_time")
		if schedule[timeSlot] == nil {
			schedule[timeSlot] = make([]map[string]interface{}, 0)
		}
		
		schedule[timeSlot] = append(schedule[timeSlot], map[string]interface{}{
			"id":             task.Id,
			"type":           "scheduled",
			"name":           task.GetString("name"),
			"duration":       task.GetInt("duration"),
			"energy":         task.GetInt("energy_required"),
			"priority":       task.GetString("priority"),
			"sensory_total":  task.GetInt("sensory_total"),
			"category":       task.GetString("category"),
		})
	}

	// Préparer les tâches non planifiées
	unscheduledData := make([]map[string]interface{}, len(unscheduledTasks))
	for i, task := range unscheduledTasks {
		unscheduledData[i] = map[string]interface{}{
			"id":             task.Id,
			"name":           task.GetString("name"),
			"duration":       task.GetInt("duration"),
			"priority":       task.GetString("priority"),
			"energy":         task.GetInt("energy_required"),
			"sensory_total":  task.GetInt("sensory_total"),
			"category":       task.GetString("category"),
			"deadline":       task.GetString("deadline"),
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"date":              dateStr,
		"schedule":          schedule,
		"unscheduled_tasks": unscheduledData,
		"total_fixed":       len(fixedElements),
		"total_scheduled":   len(scheduledTasks),
		"total_unscheduled": len(unscheduledTasks),
	})
}
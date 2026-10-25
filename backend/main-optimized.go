package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tokens"
)

func main() {
	app := pocketbase.New()

	// Configuration simplifiée
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Middlewares essentiels
		e.Router.Use(corsMiddleware())
		e.Router.Use(rateLimitMiddleware())
		e.Router.Use(authMiddleware(app))

		// Routes API consolidées
		setupRoutes(e.Router, app)
		
		return nil
	})

	// Démarrage
	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// Configuration des routes consolidée
func setupRoutes(router *echo.Group, app *pocketbase.PocketBase) {
	// Routes publiques
	router.GET("/health", healthCheck)
	router.POST("/api/check-username", checkUsername(app))
	router.POST("/api/demo-login", demoLogin)

	// Routes authentifiées
	api := router.Group("/api", requireAuth)
	
	// Emploi du temps
	schedule := api.Group("/schedule")
	schedule.GET("/current", getCurrentSchedule(app))
	schedule.GET("/fixed-elements", getFixedElements(app))
	schedule.POST("/fixed-elements", createFixedElement(app))
	schedule.GET("/floating-tasks", getFloatingTasks(app))
	schedule.POST("/floating-tasks", createFloatingTask(app))
	schedule.POST("/update-task", updateTask(app))
	schedule.GET("/suggestions", getSuggestions(app))

	// Utilisateur
	user := api.Group("/user")
	user.GET("/energy/current", getCurrentEnergy(app))
	user.POST("/energy/update", updateEnergy(app))
	user.POST("/preferences", savePreferences(app))
}

// Middlewares simplifiés
func corsMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("Access-Control-Allow-Origin", "*")
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			if c.Request().Method == "OPTIONS" {
				return c.NoContent(200)
			}
			
			return next(c)
		}
	}
}

func rateLimitMiddleware() echo.MiddlewareFunc {
	requests := make(map[string][]time.Time)
	
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ip := c.RealIP()
			now := time.Now()
			
			// Nettoyer les anciennes requêtes
			if reqs, exists := requests[ip]; exists {
				var validReqs []time.Time
				for _, t := range reqs {
					if now.Sub(t) < time.Minute {
						validReqs = append(validReqs, t)
					}
				}
				requests[ip] = validReqs
			}
			
			// Vérifier limite (100 req/min)
			if len(requests[ip]) >= 100 {
				return c.JSON(429, map[string]string{"error": "Trop de requêtes"})
			}
			
			requests[ip] = append(requests[ip], now)
			return next(c)
		}
	}
}

func authMiddleware(app *pocketbase.PocketBase) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Routes publiques
			publicPaths := []string{"/health", "/api/check-username", "/api/demo-login"}
			for _, path := range publicPaths {
				if strings.HasPrefix(c.Request().URL.Path, path) {
					return next(c)
				}
			}
			return next(c)
		}
	}
}

func requireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(401, map[string]string{"error": "Auth requise"})
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			return c.JSON(401, map[string]string{"error": "Format token invalide"})
		}

		// Validation simplifiée du token
		// En production, utiliser une validation JWT complète
		c.Set("user_id", "demo-user")
		return next(c)
	}
}

// Handlers simplifiés
func healthCheck(c echo.Context) error {
	return c.JSON(200, map[string]interface{}{
		"status":  "healthy",
		"service": "QFQA Backend",
		"version": "2.0.0-optimized",
	})
}

func checkUsername(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			Username string `json:"username"`
		}
		
		if err := c.Bind(&req); err != nil {
			return c.JSON(400, map[string]string{"error": "Données invalides"})
		}

		// Simulation - en production, vérifier en BDD
		available := req.Username != "admin" && req.Username != "test"
		
		return c.JSON(200, map[string]interface{}{
			"available": available,
			"message":   map[bool]string{true: "Disponible", false: "Déjà pris"}[available],
		})
	}
}

func demoLogin(c echo.Context) error {
	return c.HTML(200, `<div hx-trigger="load" hx-get="/schedule.html" hx-target="#main-content" hx-push-url="/schedule">
		<p>Connexion démo réussie... Redirection vers votre emploi du temps.</p>
	</div>`)
}

func getCurrentSchedule(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Données simulées - en production, récupérer depuis BDD
		schedule := map[string]interface{}{
			"date": time.Now().Format("2006-01-02"),
			"elements": []map[string]interface{}{
				{
					"id":         "elem-1",
					"name":       "Petit-déjeuner",
					"time":       "08:00",
					"duration":   30,
					"type":       "fixed",
					"energy":     2,
				},
				{
					"id":         "elem-2",
					"name":       "Réunion équipe",
					"time":       "10:00",
					"duration":   60,
					"type":       "fixed",
					"energy":     4,
				},
			},
		}
		
		return c.JSON(200, schedule)
	}
}

func getFixedElements(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		elements := []map[string]interface{}{
			{
				"id":         "fixed-1",
				"name":       "Petit-déjeuner",
				"date":       time.Now().Format("2006-01-02"),
				"start_time": "08:00",
				"duration":   30,
				"energy":     2,
			},
		}
		
		return c.JSON(200, elements)
	}
}

func createFixedElement(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var element map[string]interface{}
		if err := c.Bind(&element); err != nil {
			return c.JSON(400, map[string]string{"error": "Données invalides"})
		}

		// Simulation création - en production, sauvegarder en BDD
		element["id"] = "fixed-" + strconv.FormatInt(time.Now().Unix(), 10)
		element["created"] = time.Now()

		return c.JSON(201, element)
	}
}

func getFloatingTasks(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		tasks := []map[string]interface{}{
			{
				"id":       "task-1",
				"name":     "Faire les courses",
				"duration": 45,
				"priority": "medium",
				"energy":   3,
				"sensory":  map[string]int{
					"audio":     8,
					"visual":    6,
					"tactile":   4,
					"olfactory": 7,
					"gustatory": 2,
					"total":     27,
				},
			},
			{
				"id":       "task-2",
				"name":     "Appeler maman",
				"duration": 30,
				"priority": "high",
				"energy":   2,
				"sensory":  map[string]int{
					"audio":     12,
					"visual":    3,
					"tactile":   2,
					"olfactory": 1,
					"gustatory": 1,
					"total":     19,
				},
			},
		}
		
		return c.JSON(200, tasks)
	}
}

func createFloatingTask(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var task map[string]interface{}
		if err := c.Bind(&task); err != nil {
			return c.JSON(400, map[string]string{"error": "Données invalides"})
		}

		// Calcul automatique de l'énergie selon profil sensoriel
		if sensory, ok := task["sensory"].(map[string]interface{}); ok {
			total := 0
			for _, v := range sensory {
				if val, ok := v.(float64); ok {
					total += int(val)
				}
			}
			task["energy"] = calculateEnergyFromSensory(total)
		}

		task["id"] = "task-" + strconv.FormatInt(time.Now().Unix(), 10)
		task["created"] = time.Now()

		return c.JSON(201, task)
	}
}

func updateTask(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			TaskID   string `json:"task_id"`
			TimeSlot string `json:"time_slot"`
		}
		
		if err := c.Bind(&req); err != nil {
			return c.JSON(400, map[string]string{"error": "Données invalides"})
		}

		// Simulation mise à jour - en production, sauvegarder en BDD
		result := map[string]interface{}{
			"success":   true,
			"task_id":   req.TaskID,
			"time_slot": req.TimeSlot,
			"scheduled": time.Now(),
		}

		return c.JSON(200, result)
	}
}

func getSuggestions(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		suggestions := []map[string]interface{}{
			{
				"task_id":     "task-1",
				"time_slot":   "11:00",
				"score":       0.85,
				"reason":      "Niveau d'énergie optimal",
				"adaptations": []string{"Prévoir 10min de pause après"},
			},
			{
				"task_id":     "task-2",
				"time_slot":   "15:30",
				"score":       0.92,
				"reason":      "Moment calme, idéal pour appels",
				"adaptations": []string{"Environnement silencieux recommandé"},
			},
		}
		
		return c.JSON(200, suggestions)
	}
}

func getCurrentEnergy(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		energy := map[string]interface{}{
			"current":   3,
			"morning":   4,
			"afternoon": 3,
			"evening":   2,
			"period":    getCurrentPeriod(),
		}
		
		return c.JSON(200, energy)
	}
}

func updateEnergy(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			Level int `json:"level"`
		}
		
		if err := c.Bind(&req); err != nil {
			return c.JSON(400, map[string]string{"error": "Données invalides"})
		}

		if req.Level < 1 || req.Level > 5 {
			return c.JSON(400, map[string]string{"error": "Niveau doit être entre 1 et 5"})
		}

		result := map[string]interface{}{
			"success": true,
			"level":   req.Level,
			"updated": time.Now(),
		}

		return c.JSON(200, result)
	}
}

func savePreferences(app *pocketbase.PocketBase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var prefs map[string]interface{}
		if err := c.Bind(&prefs); err != nil {
			return c.JSON(400, map[string]string{"error": "Données invalides"})
		}

		// Simulation sauvegarde - en production, sauvegarder en BDD
		prefs["saved"] = time.Now()

		return c.JSON(200, map[string]interface{}{
			"success":     true,
			"preferences": prefs,
		})
	}
}

// Fonctions utilitaires simplifiées
func getCurrentPeriod() string {
	hour := time.Now().Hour()
	switch {
	case hour < 12:
		return "morning"
	case hour < 18:
		return "afternoon"
	default:
		return "evening"
	}
}

func calculateEnergyFromSensory(total int) int {
	switch {
	case total <= 20:
		return 1
	case total <= 40:
		return 2
	case total <= 60:
		return 3
	case total <= 80:
		return 4
	default:
		return 5
	}
}
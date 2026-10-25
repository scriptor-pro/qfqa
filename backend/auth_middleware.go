package main

import (
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tokens"
)

// Middleware d'authentification personnalisé pour les routes API
func authMiddleware(app *pocketbase.PocketBase) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Routes publiques (pas d'authentification requise)
			publicRoutes := []string{
				"/health",
				"/api/check-username",
				"/api/demo-login",
				"/api/sensory/compatibility", // Accessible sans auth pour les tests
			}
			
			path := c.Request().URL.Path
			for _, route := range publicRoutes {
				if strings.HasPrefix(path, route) {
					return next(c)
				}
			}

			// Routes nécessitant une authentification
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return apis.NewUnauthorizedError("Token d'authentification manquant", nil)
			}

			// Extraire le token (format: "Bearer <token>")
			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
				return apis.NewUnauthorizedError("Format de token invalide", nil)
			}

			token := tokenParts[1]

			// Vérifier et décoder le token
			claims, err := tokens.NewRecordAuthToken(app, nil).Verify(token)
			if err != nil {
				return apis.NewUnauthorizedError("Token invalide", err)
			}

			// Récupérer l'utilisateur
			user, err := app.Dao().FindRecordById("users", claims.Id)
			if err != nil {
				return apis.NewUnauthorizedError("Utilisateur introuvable", err)
			}

			// Vérifier que l'utilisateur est toujours actif
			if !user.GetBool("verified") {
				return apis.NewUnauthorizedError("Compte non vérifié", nil)
			}

			// Ajouter l'utilisateur au contexte
			c.Set(apis.ContextAuthRecordKey, user)

			return next(c)
		}
	}
}

// Hook pour enregistrer les tentatives de connexion
func setupAuthHooks(app *pocketbase.PocketBase) {
	// Hook avant tentative de connexion
	app.OnRecordAuthRequest().Add(func(e *core.RecordAuthEvent) error {
		// Log de la tentative de connexion
		logAuthAttempt(app, e.Record, "login_attempt", true)
		return nil
	})

	// Hook après connexion réussie
	app.OnRecordAfterAuthWithPasswordRequest().Add(func(e *core.RecordAuthWithPasswordEvent) error {
		// Log de la connexion réussie
		logAuthAttempt(app, e.Record, "login_success", true)
		
		// Mettre à jour la dernière connexion
		e.Record.Set("last_login", time.Now().Format(time.RFC3339))
		return app.Dao().SaveRecord(e.Record)
	})

	// Hook après échec de connexion
	app.OnRecordAuthRequest().Add(func(e *core.RecordAuthEvent) error {
		if e.HttpContext.Response().Status >= 400 {
			logAuthAttempt(app, e.Record, "login_failed", false)
		}
		return nil
	})
}

// Enregistrement des tentatives d'authentification
func logAuthAttempt(app *pocketbase.PocketBase, user *models.Record, eventType string, success bool) {
	// Ici on pourrait enregistrer dans une collection de logs
	// Pour l'instant, on se contente d'un log serveur
	userInfo := "unknown"
	if user != nil {
		userInfo = user.GetString("username")
	}
	
	log.Printf("Auth event: %s for user %s - Success: %v", eventType, userInfo, success)
}

// Validation des règles de sécurité pour les collections
func setupSecurityRules(app *pocketbase.PocketBase) error {
	// Règles pour la collection user_profiles
	userProfilesCollection, err := app.Dao().FindCollectionByNameOrId("user_profiles")
	if err == nil {
		// Un utilisateur ne peut voir/modifier que son propre profil
		userProfilesCollection.ListRule = types.Pointer("@request.auth.id = user_id")
		userProfilesCollection.ViewRule = types.Pointer("@request.auth.id = user_id")
		userProfilesCollection.CreateRule = types.Pointer("@request.auth.id = user_id")
		userProfilesCollection.UpdateRule = types.Pointer("@request.auth.id = user_id")
		userProfilesCollection.DeleteRule = types.Pointer("@request.auth.id = user_id")
		
		if err := app.Dao().SaveCollection(userProfilesCollection); err != nil {
			return err
		}
	}

	// Règles pour les éléments fixes
	fixedElementsCollection, err := app.Dao().FindCollectionByNameOrId("fixed_elements")
	if err == nil {
		rule := "@request.auth.id = user_id"
		fixedElementsCollection.ListRule = types.Pointer(rule)
		fixedElementsCollection.ViewRule = types.Pointer(rule)
		fixedElementsCollection.CreateRule = types.Pointer(rule)
		fixedElementsCollection.UpdateRule = types.Pointer(rule)
		fixedElementsCollection.DeleteRule = types.Pointer(rule)
		
		if err := app.Dao().SaveCollection(fixedElementsCollection); err != nil {
			return err
		}
	}

	// Règles pour les tâches flottantes
	floatingTasksCollection, err := app.Dao().FindCollectionByNameOrId("floating_tasks")
	if err == nil {
		rule := "@request.auth.id = user_id"
		floatingTasksCollection.ListRule = types.Pointer(rule)
		floatingTasksCollection.ViewRule = types.Pointer(rule)
		floatingTasksCollection.CreateRule = types.Pointer(rule)
		floatingTasksCollection.UpdateRule = types.Pointer(rule)
		floatingTasksCollection.DeleteRule = types.Pointer(rule)
		
		if err := app.Dao().SaveCollection(floatingTasksCollection); err != nil {
			return err
		}
	}

	// Règles pour les logs d'énergie
	energyLogsCollection, err := app.Dao().FindCollectionByNameOrId("energy_logs")
	if err == nil {
		rule := "@request.auth.id = user_id"
		energyLogsCollection.ListRule = types.Pointer(rule)
		energyLogsCollection.ViewRule = types.Pointer(rule)
		energyLogsCollection.CreateRule = types.Pointer(rule)
		// Pas de modification/suppression des logs pour préserver l'historique
		energyLogsCollection.UpdateRule = nil
		energyLogsCollection.DeleteRule = nil
		
		if err := app.Dao().SaveCollection(energyLogsCollection); err != nil {
			return err
		}
	}

	return nil
}

// Middleware de limitation du taux de requêtes (rate limiting)
func rateLimitMiddleware() echo.MiddlewareFunc {
	// Structure simple pour le rate limiting en mémoire
	type ClientRequests struct {
		Count     int
		ResetTime time.Time
	}
	
	clients := make(map[string]*ClientRequests)
	maxRequests := 100 // 100 requêtes par minute
	window := time.Minute

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			clientIP := c.RealIP()
			now := time.Now()

			// Nettoyer les anciennes entrées
			if len(clients) > 1000 { // Limite de mémoire
				for ip, req := range clients {
					if now.After(req.ResetTime) {
						delete(clients, ip)
					}
				}
			}

			// Vérifier ou initialiser le client
			client, exists := clients[clientIP]
			if !exists || now.After(client.ResetTime) {
				clients[clientIP] = &ClientRequests{
					Count:     1,
					ResetTime: now.Add(window),
				}
				return next(c)
			}

			// Vérifier la limite
			if client.Count >= maxRequests {
				return c.JSON(http.StatusTooManyRequests, map[string]interface{}{
					"error": "Trop de requêtes. Veuillez patienter avant de réessayer.",
					"retry_after": int(client.ResetTime.Sub(now).Seconds()),
				})
			}

			// Incrémenter le compteur
			client.Count++
			return next(c)
		}
	}
}

// Middleware de sécurité des en-têtes
func securityHeadersMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// En-têtes de sécurité
			c.Response().Header().Set("X-Content-Type-Options", "nosniff")
			c.Response().Header().Set("X-Frame-Options", "DENY")
			c.Response().Header().Set("X-XSS-Protection", "1; mode=block")
			c.Response().Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			
			// CSP pour les API (plus restrictif que le frontend)
			c.Response().Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';")
			
			return next(c)
		}
	}
}

// Validation des données d'entrée
func validateRequestData(c echo.Context, maxSize int64) error {
	// Limiter la taille des requêtes
	if c.Request().ContentLength > maxSize {
		return apis.NewBadRequestError("Requête trop volumineuse", nil)
	}

	// Vérifier le Content-Type pour les requêtes POST/PUT
	if c.Request().Method == "POST" || c.Request().Method == "PUT" {
		contentType := c.Request().Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			return apis.NewBadRequestError("Content-Type doit être application/json", nil)
		}
	}

	return nil
}
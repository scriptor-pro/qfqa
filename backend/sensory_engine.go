package main

import (
	"encoding/json"
	"math"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/models"
)

// Échelle sensorielle complète (20 niveaux par sens)
type SensoryScale struct {
	Audio     []SensoryLevel `json:"audio"`
	Visual    []SensoryLevel `json:"visual"`
	Tactile   []SensoryLevel `json:"tactile"`
	Olfactory []SensoryLevel `json:"olfactory"`
	Gustatory []SensoryLevel `json:"gustatory"`
}

type SensoryLevel struct {
	Level       int    `json:"level"`
	Description string `json:"description"`
	EnergyImpact float64 `json:"energy_impact"`
}

// Profil sensoriel d'une activité
type ActivitySensoryProfile struct {
	Audio     int `json:"audio"`
	Visual    int `json:"visual"`
	Tactile   int `json:"tactile"`
	Olfactory int `json:"olfactory"`
	Gustatory int `json:"gustatory"`
	Total     int `json:"total"`
}

// Profil énergétique utilisateur
type UserEnergyProfile struct {
	Neurotype       string            `json:"neurotype"`
	Morning         int              `json:"morning"`
	Afternoon       int              `json:"afternoon"`
	Evening         int              `json:"evening"`
	Current         int              `json:"current"`
	Sensitivities   []string         `json:"sensitivities"`
	Strategies      []string         `json:"strategies"`
	PersonalFactors map[string]float64 `json:"personal_factors"`
}

// Recommandation pour une activité
type ActivityRecommendation struct {
	ActivityID      string  `json:"activity_id"`
	RecommendedTime string  `json:"recommended_time"`
	CompatibilityScore float64 `json:"compatibility_score"`
	Reasons         []string `json:"reasons"`
	Warnings        []string `json:"warnings"`
	Adaptations     []string `json:"adaptations"`
}

// Initialisation de l'échelle sensorielle complète
func initializeSensoryScale() *SensoryScale {
	return &SensoryScale{
		Audio: []SensoryLevel{
			{1, "Silence absolu", 0.0},
			{2, "Souffle de son propre corps", 0.1},
			{3, "Goutte d'eau qui tombe", 0.2},
			{4, "Tic-tac d'une horloge", 0.3},
			{5, "Écho d'une chapelle vide", 0.4},
			{6, "Bruit discret d'un crayon sur papier", 0.5},
			{7, "Chuchotements d'une bibliothèque", 0.6},
			{8, "Salle de classe quasi vide", 0.7},
			{9, "Conversations basses d'un café", 0.8},
			{10, "Radio en fond sonore discret", 1.0},
			{11, "Brouhaha d'un restaurant animé", 1.2},
			{12, "Terrasse de café avec circulation proche", 1.4},
			{13, "Appels de vendeurs au marché", 1.6},
			{14, "Rue commerçante bondée", 1.8},
			{15, "Annonces d'une gare + foule dense", 2.0},
			{16, "Parc d'attractions : musiques croisées", 2.3},
			{17, "Feu d'artifice (claquements explosifs)", 2.6},
			{18, "Concert de rock assourdissant", 2.9},
			{19, "Stade avec vuvuzelas", 3.2},
			{20, "Carnaval de Rio (chars, feux d'artifice, foule en transe)", 3.5},
		},
		Visual: []SensoryLevel{
			{1, "Obscurité totale", 0.0},
			{2, "Pénombre, une bougie", 0.1},
			{3, "Lueur diffuse derrière un rideau", 0.2},
			{4, "Chambre avec lampe de chevet", 0.3},
			{5, "Salle calme, mobilier simple", 0.4},
			{6, "Salle de classe claire, tableau et bancs", 0.5},
			{7, "Café minimaliste, déco sobre", 0.6},
			{8, "Bibliothèque lumineuse", 0.7},
			{9, "Restaurant animé avec couleurs chaudes", 0.8},
			{10, "Marché aux couleurs variées", 1.0},
			{11, "Rue commerçante animée", 1.2},
			{12, "Gare avec foule et panneaux lumineux", 1.4},
			{13, "Carrefour urbain bondé", 1.6},
			{14, "Parc d'attractions (manèges colorés)", 1.8},
			{15, "Feu d'artifice nocturne", 2.0},
			{16, "Concert : jeux de lumières", 2.3},
			{17, "Discothèque : lasers, stroboscopes", 2.6},
			{18, "Stade : drapeaux, écrans géants", 2.9},
			{19, "Show de Las Vegas : hologrammes", 3.2},
			{20, "Tokyo de nuit : néons géants + foule compacte", 3.5},
		},
		Tactile: []SensoryLevel{
			{1, "Air immobile, pas de contact", 0.0},
			{2, "Sol lisse, froid", 0.1},
			{3, "Papier sous les doigts", 0.2},
			{4, "Bois d'une chaise", 0.3},
			{5, "Tissu d'un vêtement simple", 0.4},
			{6, "Tasse chaude tenue en main", 0.5},
			{7, "Poignée de porte métallique froide", 0.6},
			{8, "Accoudoir d'un fauteuil confortable", 0.7},
			{9, "Vaisselle en céramique d'un café", 0.8},
			{10, "Table serrée, contacts légers", 1.0},
			{11, "Frôlement au marché", 1.2},
			{12, "Sac qui cogne dans la foule", 1.4},
			{13, "Coups d'épaule dans une gare bondée", 1.6},
			{14, "Vibrations du sol au passage d'un train", 1.8},
			{15, "Attraction : secousses rapides", 2.0},
			{16, "Concert : basses qui vibrent dans le corps", 2.3},
			{17, "Foule compacte, chaleur croissante", 2.6},
			{18, "Compression dans un stade bondé", 2.9},
			{19, "Pèlerinage : densité humaine maximale", 3.2},
			{20, "Foule en transe (carnaval, rave géante)", 3.5},
		},
		Olfactory: []SensoryLevel{
			{1, "Aucun parfum", 0.0},
			{2, "Air neutre, stérile", 0.1},
			{3, "Odeur légère de poussière", 0.2},
			{4, "Papier, vieux livres", 0.3},
			{5, "Craie, bois", 0.4},
			{6, "Café filtre discret", 0.5},
			{7, "Café + viennoiseries", 0.6},
			{8, "Odeur d'herbe fraîche", 0.7},
			{9, "Cuisine familiale simple", 0.8},
			{10, "Restaurant avec plats multiples", 1.0},
			{11, "Épices douces (cannelle, cardamome)", 1.2},
			{12, "Marché de fruits et légumes", 1.4},
			{13, "Marché de fritures et grillades", 1.6},
			{14, "Marché aux épices orientales", 1.8},
			{15, "Odeurs de gare (gazole + nourriture)", 2.0},
			{16, "Parc d'attractions (sucre, friture, popcorn)", 2.3},
			{17, "Concert (tabac, bière renversée)", 2.6},
			{18, "Stade (fast-food + corps)", 2.9},
			{19, "Quartier de street-food asiatique", 3.2},
			{20, "Marché humide de poissons, viandes et épices entassés", 3.5},
		},
		Gustatory: []SensoryLevel{
			{1, "Eau neutre", 0.0},
			{2, "Air sec sans goût", 0.1},
			{3, "Eau légèrement minéralisée", 0.2},
			{4, "Goût de poussière, papier", 0.3},
			{5, "Hostie fade, farine crue", 0.4},
			{6, "Goût de craie / bois", 0.5},
			{7, "Biscuit sec", 0.6},
			{8, "Café noir simple", 0.7},
			{9, "Café + sucre", 0.8},
			{10, "Repas simple, salé", 1.0},
			{11, "Repas varié, assaisonné", 1.2},
			{12, "Plat épicé modéré", 1.4},
			{13, "Street food épicée et grasse", 1.6},
			{14, "Snacks sucrés / salés mélangés", 1.8},
			{15, "Bonbons chimiques, sodas", 2.0},
			{16, "Fast food gras", 2.3},
			{17, "Bière et alcool", 2.6},
			{18, "Concert : bière tiède + chips", 2.9},
			{19, "Stade : mélange sueur, alcool, fast food", 3.2},
			{20, "Buffet mondial : sucré, salé, acide, amer, umami en simultané", 3.5},
		},
	}
}

// Calcul du profil sensoriel d'une activité
func calculateActivitySensoryProfile(audio, visual, tactile, olfactory, gustatory int) *ActivitySensoryProfile {
	total := audio + visual + tactile + olfactory + gustatory
	
	return &ActivitySensoryProfile{
		Audio:     audio,
		Visual:    visual,
		Tactile:   tactile,
		Olfactory: olfactory,
		Gustatory: gustatory,
		Total:     total,
	}
}

// Calcul de la charge énergétique basée sur l'échelle sensorielle
func calculateEnergyFromSensoryProfile(profile *ActivitySensoryProfile, neurotype string, sensitivities []string) float64 {
	scale := initializeSensoryScale()
	
	// Récupérer les impacts énergétiques selon l'échelle
	audioImpact := scale.Audio[profile.Audio-1].EnergyImpact
	visualImpact := scale.Visual[profile.Visual-1].EnergyImpact
	tactileImpact := scale.Tactile[profile.Tactile-1].EnergyImpact
	olfactoryImpact := scale.Olfactory[profile.Olfactory-1].EnergyImpact
	gustatoryImpact := scale.Gustatory[profile.Gustatory-1].EnergyImpact
	
	// Calcul de base
	baseEnergy := audioImpact + visualImpact + tactileImpact + olfactoryImpact + gustatoryImpact
	
	// Facteurs multiplicateurs selon le neurotype
	var neuroFactor float64
	switch neurotype {
	case "tdah":
		neuroFactor = 1.3 // Les TDAH sont plus sensibles aux distractions
	case "autiste":
		neuroFactor = 1.5 // Les autistes sont généralement plus sensibles sensoriellement
	case "both":
		neuroFactor = 1.7 // Cumul des sensibilités
	default:
		neuroFactor = 1.0
	}
	
	// Facteurs de sensibilité personnelle
	sensibilityMultiplier := 1.0
	for _, sensitivity := range sensitivities {
		switch sensitivity {
		case "sound":
			if profile.Audio > 10 {
				sensibilityMultiplier += 0.3
			}
		case "light":
			if profile.Visual > 10 {
				sensibilityMultiplier += 0.3
			}
		case "touch":
			if profile.Tactile > 10 {
				sensibilityMultiplier += 0.3
			}
		case "smells":
			if profile.Olfactory > 10 {
				sensibilityMultiplier += 0.3
			}
		}
	}
	
	finalEnergy := baseEnergy * neuroFactor * sensibilityMultiplier
	
	// Conversion en échelle 1-5
	energyLevel := int(math.Ceil(finalEnergy))
	if energyLevel < 1 {
		energyLevel = 1
	}
	if energyLevel > 5 {
		energyLevel = 5
	}
	
	return float64(energyLevel)
}

// Génération de recommandations intelligentes
func generateIntelligentRecommendations(app *pocketbase.PocketBase, userID string) ([]ActivityRecommendation, error) {
	// Récupérer le profil utilisateur
	userProfile, err := app.Dao().FindFirstRecordByFilter(
		"user_profiles",
		"user_id = {:userId}",
		map[string]any{"userId": userID},
	)
	if err != nil {
		return nil, err
	}

	// Récupérer les tâches non planifiées
	tasks, err := app.Dao().FindRecordsByFilter(
		"floating_tasks",
		"user_id = {:userId} && scheduled_time = ''",
		"-priority, energy_required",
		50,
		0,
		map[string]any{"userId": userID},
	)
	if err != nil {
		return nil, err
	}

	// Construire le profil énergétique utilisateur
	energyProfile := &UserEnergyProfile{
		Neurotype:     userProfile.GetString("neurotype"),
		Morning:       userProfile.GetInt("energy_morning"),
		Afternoon:     userProfile.GetInt("energy_afternoon"),
		Evening:       userProfile.GetInt("energy_evening"),
		Current:       userProfile.GetInt("current_energy"),
		Sensitivities: userProfile.GetStringSlice("sensitivities"),
		Strategies:    userProfile.GetStringSlice("strategies"),
	}

	recommendations := make([]ActivityRecommendation, 0)
	
	for _, task := range tasks {
		// Profil sensoriel de la tâche
		profile := calculateActivitySensoryProfile(
			task.GetInt("sensory_audio"),
			task.GetInt("sensory_visual"),
			task.GetInt("sensory_tactile"),
			task.GetInt("sensory_olfactory"),
			task.GetInt("sensory_gustatory"),
		)
		
		// Calculer la charge énergétique réelle
		energyRequired := calculateEnergyFromSensoryProfile(profile, energyProfile.Neurotype, energyProfile.Sensitivities)
		
		// Générer des recommandations temporelles
		timeSlots := analyzeOptimalTimeSlots(energyProfile, energyRequired, task.GetString("priority"))
		
		for _, timeSlot := range timeSlots {
			recommendation := ActivityRecommendation{
				ActivityID:         task.Id,
				RecommendedTime:    timeSlot.Time,
				CompatibilityScore: timeSlot.Score,
				Reasons:           generateReasons(task, timeSlot, energyProfile),
				Warnings:          generateWarnings(task, timeSlot, energyProfile),
				Adaptations:       generateAdaptations(task, energyProfile),
			}
			recommendations = append(recommendations, recommendation)
		}
	}
	
	return recommendations, nil
}

// Analyse des créneaux optimaux
type TimeSlot struct {
	Time  string
	Score float64
}

func analyzeOptimalTimeSlots(profile *UserEnergyProfile, energyRequired float64, priority string) []TimeSlot {
	slots := make([]TimeSlot, 0)
	
	// Créneaux de la journée avec leur énergie disponible
	timeSlots := []struct {
		time   string
		energy int
	}{
		{"08:00", profile.Morning},
		{"09:00", profile.Morning},
		{"10:00", profile.Morning},
		{"11:00", profile.Morning},
		{"14:00", profile.Afternoon},
		{"15:00", profile.Afternoon},
		{"16:00", profile.Afternoon},
		{"17:00", profile.Afternoon},
		{"19:00", profile.Evening},
		{"20:00", profile.Evening},
	}
	
	for _, slot := range timeSlots {
		score := calculateCompatibilityScore(float64(slot.energy), energyRequired, priority)
		
		if score > 0.3 { // Seuil minimum de compatibilité
			slots = append(slots, TimeSlot{
				Time:  slot.time,
				Score: score,
			})
		}
	}
	
	return slots
}

// Calcul du score de compatibilité
func calculateCompatibilityScore(availableEnergy, requiredEnergy float64, priority string) float64 {
	if requiredEnergy > availableEnergy {
		return 0.1 // Score très faible si pas assez d'énergie
	}
	
	// Score de base selon la différence d'énergie
	baseScore := 1.0 - math.Abs(availableEnergy-requiredEnergy)/5.0
	
	// Bonus pour les priorités élevées
	priorityBonus := 1.0
	switch priority {
	case "urgent":
		priorityBonus = 1.5
	case "high":
		priorityBonus = 1.2
	case "medium":
		priorityBonus = 1.0
	case "low":
		priorityBonus = 0.8
	}
	
	return math.Min(1.0, baseScore*priorityBonus)
}

// Génération des raisons pour une recommandation
func generateReasons(task *models.Record, timeSlot TimeSlot, profile *UserEnergyProfile) []string {
	reasons := make([]string, 0)
	
	priority := task.GetString("priority")
	if priority == "urgent" || priority == "high" {
		reasons = append(reasons, "Tâche prioritaire à traiter rapidement")
	}
	
	if timeSlot.Score > 0.8 {
		reasons = append(reasons, "Excellent match avec votre profil énergétique")
	} else if timeSlot.Score > 0.6 {
		reasons = append(reasons, "Bon match avec votre niveau d'énergie")
	}
	
	// Analyser les stratégies personnelles
	for _, strategy := range profile.Strategies {
		switch strategy {
		case "routine":
			reasons = append(reasons, "S'intègre bien dans votre routine habituelle")
		case "breaks":
			reasons = append(reasons, "Créneau permettant des pauses si nécessaire")
		}
	}
	
	return reasons
}

// Génération des avertissements
func generateWarnings(task *models.Record, timeSlot TimeSlot, profile *UserEnergyProfile) []string {
	warnings := make([]string, 0)
	
	if timeSlot.Score < 0.5 {
		warnings = append(warnings, "Cette tâche pourrait être fatigante à ce moment")
	}
	
	energyRequired := task.GetInt("energy_required")
	if energyRequired >= 4 {
		warnings = append(warnings, "Tâche très exigeante, prévoyez du temps de récupération")
	}
	
	sensoryTotal := task.GetInt("sensory_total")
	if sensoryTotal > 60 {
		warnings = append(warnings, "Charge sensorielle élevée, environnement potentiellement sur-stimulant")
	}
	
	return warnings
}

// Génération des adaptations suggérées
func generateAdaptations(task *models.Record, profile *UserEnergyProfile) []string {
	adaptations := make([]string, 0)
	
	// Adaptations selon les sensibilités
	for _, sensitivity := range profile.Sensitivities {
		switch sensitivity {
		case "sound":
			adaptations = append(adaptations, "Utilisez un casque anti-bruit ou de la musique douce")
		case "light":
			adaptations = append(adaptations, "Ajustez l'éclairage ou utilisez des lunettes teintées")
		case "touch":
			adaptations = append(adaptations, "Préparez un environnement tactile confortable")
		case "crowd":
			adaptations = append(adaptations, "Choisissez un moment moins fréquenté si possible")
		}
	}
	
	// Adaptations selon les stratégies préférées
	for _, strategy := range profile.Strategies {
		switch strategy {
		case "breaks":
			adaptations = append(adaptations, "Planifiez des micro-pauses toutes les 25 minutes")
		case "fidget":
			adaptations = append(adaptations, "Ayez un objet fidget à portée de main")
		case "music":
			adaptations = append(adaptations, "Préparez une playlist adaptée à votre concentration")
		}
	}
	
	return adaptations
}

// Sauvegarde d'un log d'énergie
func logEnergyLevel(app *pocketbase.PocketBase, userID string, energyLevel int, period string, notes string) error {
	collection, err := app.Dao().FindCollectionByNameOrId("energy_logs")
	if err != nil {
		return err
	}

	record := models.NewRecord(collection)
	record.Set("user_id", userID)
	record.Set("energy_level", energyLevel)
	record.Set("time_period", period)
	record.Set("notes", notes)

	return app.Dao().SaveRecord(record)
}

// Analyse des patterns énergétiques
func analyzeEnergyPatterns(app *pocketbase.PocketBase, userID string, days int) (map[string]interface{}, error) {
	// Récupérer les logs des X derniers jours
	startDate := time.Now().AddDate(0, 0, -days).Format("2006-01-02")
	
	logs, err := app.Dao().FindRecordsByFilter(
		"energy_logs",
		"user_id = {:userId} && created >= {:startDate}",
		"-created",
		1000,
		0,
		map[string]any{
			"userId":    userID,
			"startDate": startDate,
		},
	)
	
	if err != nil {
		return nil, err
	}

	// Analyser les patterns
	patterns := make(map[string][]int)
	averages := make(map[string]float64)
	
	for _, log := range logs {
		period := log.GetString("time_period")
		level := log.GetInt("energy_level")
		
		if patterns[period] == nil {
			patterns[period] = make([]int, 0)
		}
		patterns[period] = append(patterns[period], level)
	}
	
	// Calculer les moyennes
	for period, levels := range patterns {
		sum := 0
		for _, level := range levels {
			sum += level
		}
		averages[period] = float64(sum) / float64(len(levels))
	}
	
	return map[string]interface{}{
		"patterns":        patterns,
		"averages":        averages,
		"total_logs":      len(logs),
		"analysis_period": fmt.Sprintf("%d jours", days),
	}, nil
}
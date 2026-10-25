package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/models/schema"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db)
		
		// Modification de la collection users existante
		usersCollection, err := dao.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		// Ajouter le champ neurotype
		neuroTypeField := &schema.SchemaField{
			Name:     "neurotype",
			Type:     schema.FieldTypeSelect,
			Required: true,
			Options: &schema.SelectOptions{
				MaxSelect: 1,
				Values:    []string{"tdah", "autiste", "both"},
			},
		}
		usersCollection.Schema.AddField(neuroTypeField)

		if err := dao.SaveCollection(usersCollection); err != nil {
			return err
		}

		// Collection user_profiles
		userProfilesCollection := &models.Collection{
			Name:       "user_profiles",
			Type:       models.CollectionTypeBase,
			ListRule:   types.Pointer("@request.auth.id = user_id"),
			ViewRule:   types.Pointer("@request.auth.id = user_id"),
			CreateRule: types.Pointer("@request.auth.id = user_id"),
			UpdateRule: types.Pointer("@request.auth.id = user_id"),
			Schema: schema.NewSchema(
				&schema.SchemaField{
					Name:     "user_id",
					Type:     schema.FieldTypeRelation,
					Required: true,
					Options: &schema.RelationOptions{
						CollectionId:  usersCollection.Id,
						CascadeDelete: true,
					},
				},
				&schema.SchemaField{
					Name:     "neurotype",
					Type:     schema.FieldTypeSelect,
					Required: true,
					Options: &schema.SelectOptions{
						MaxSelect: 1,
						Values:    []string{"tdah", "autiste", "both"},
					},
				},
				&schema.SchemaField{
					Name: "energy_morning",
					Type: schema.FieldTypeNumber,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(5)),
					},
				},
				&schema.SchemaField{
					Name: "energy_afternoon",
					Type: schema.FieldTypeNumber,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(5)),
					},
				},
				&schema.SchemaField{
					Name: "energy_evening",
					Type: schema.FieldTypeNumber,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(5)),
					},
				},
				&schema.SchemaField{
					Name: "current_energy",
					Type: schema.FieldTypeNumber,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(5)),
					},
				},
				&schema.SchemaField{
					Name: "sensitivities",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 10,
						Values:    []string{"sound", "light", "touch", "crowd", "smells", "change"},
					},
				},
				&schema.SchemaField{
					Name: "strategies",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 10,
						Values:    []string{"breaks", "music", "fidget", "routine"},
					},
				},
				&schema.SchemaField{
					Name: "theme",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 1,
						Values:    []string{"auto", "light", "dark", "high-contrast"},
					},
				},
				&schema.SchemaField{
					Name: "notifications",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 1,
						Values:    []string{"minimal", "normal", "detailed"},
					},
				},
				&schema.SchemaField{
					Name: "reduced_motion",
					Type: schema.FieldTypeBool,
				},
			),
		}

		if err := dao.SaveCollection(userProfilesCollection); err != nil {
			return err
		}

		// Collection fixed_elements (éléments fixes de l'emploi du temps)
		fixedElementsCollection := &models.Collection{
			Name:       "fixed_elements",
			Type:       models.CollectionTypeBase,
			ListRule:   types.Pointer("@request.auth.id = user_id"),
			ViewRule:   types.Pointer("@request.auth.id = user_id"),
			CreateRule: types.Pointer("@request.auth.id = user_id"),
			UpdateRule: types.Pointer("@request.auth.id = user_id"),
			DeleteRule: types.Pointer("@request.auth.id = user_id"),
			Schema: schema.NewSchema(
				&schema.SchemaField{
					Name:     "user_id",
					Type:     schema.FieldTypeRelation,
					Required: true,
					Options: &schema.RelationOptions{
						CollectionId:  usersCollection.Id,
						CascadeDelete: true,
					},
				},
				&schema.SchemaField{
					Name:     "name",
					Type:     schema.FieldTypeText,
					Required: true,
				},
				&schema.SchemaField{
					Name:     "date",
					Type:     schema.FieldTypeDate,
					Required: true,
				},
				&schema.SchemaField{
					Name:     "start_time",
					Type:     schema.FieldTypeText,
					Required: true,
				},
				&schema.SchemaField{
					Name:     "duration",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(5)),
						Max: types.Pointer(float64(480)),
					},
				},
				&schema.SchemaField{
					Name: "location_type",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 1,
						Values:    []string{"home", "external"},
					},
				},
				&schema.SchemaField{
					Name: "address",
					Type: schema.FieldTypeText,
				},
				&schema.SchemaField{
					Name: "travel_energy_audio",
					Type: schema.FieldTypeNumber,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(20)),
					},
				},
				&schema.SchemaField{
					Name: "travel_energy_visual",
					Type: schema.FieldTypeNumber,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(20)),
					},
				},
				&schema.SchemaField{
					Name: "activity_energy",
					Type: schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(5)),
					},
				},
				&schema.SchemaField{
					Name: "notes",
					Type: schema.FieldTypeText,
				},
			),
		}

		if err := dao.SaveCollection(fixedElementsCollection); err != nil {
			return err
		}

		// Collection floating_tasks (tâches flottantes)
		floatingTasksCollection := &models.Collection{
			Name:       "floating_tasks",
			Type:       models.CollectionTypeBase,
			ListRule:   types.Pointer("@request.auth.id = user_id"),
			ViewRule:   types.Pointer("@request.auth.id = user_id"),
			CreateRule: types.Pointer("@request.auth.id = user_id"),
			UpdateRule: types.Pointer("@request.auth.id = user_id"),
			DeleteRule: types.Pointer("@request.auth.id = user_id"),
			Schema: schema.NewSchema(
				&schema.SchemaField{
					Name:     "user_id",
					Type:     schema.FieldTypeRelation,
					Required: true,
					Options: &schema.RelationOptions{
						CollectionId:  usersCollection.Id,
						CascadeDelete: true,
					},
				},
				&schema.SchemaField{
					Name:     "name",
					Type:     schema.FieldTypeText,
					Required: true,
				},
				&schema.SchemaField{
					Name:     "duration",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(5)),
						Max: types.Pointer(float64(300)),
					},
				},
				&schema.SchemaField{
					Name: "priority",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 1,
						Values:    []string{"low", "medium", "high", "urgent"},
					},
				},
				&schema.SchemaField{
					Name: "deadline",
					Type: schema.FieldTypeDate,
				},
				&schema.SchemaField{
					Name:     "sensory_audio",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(20)),
					},
				},
				&schema.SchemaField{
					Name:     "sensory_visual",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(20)),
					},
				},
				&schema.SchemaField{
					Name:     "sensory_tactile",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(20)),
					},
				},
				&schema.SchemaField{
					Name:     "sensory_olfactory",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(20)),
					},
				},
				&schema.SchemaField{
					Name:     "sensory_gustatory",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(20)),
					},
				},
				&schema.SchemaField{
					Name: "sensory_total",
					Type: schema.FieldTypeNumber,
				},
				&schema.SchemaField{
					Name: "energy_required",
					Type: schema.FieldTypeNumber,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(5)),
					},
				},
				&schema.SchemaField{
					Name: "category",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 1,
						Values:    []string{"personal", "work", "health", "social", "household", "creative", "learning", "exercise"},
					},
				},
				&schema.SchemaField{
					Name: "scheduled_time",
					Type: schema.FieldTypeText,
				},
				&schema.SchemaField{
					Name: "scheduled_date",
					Type: schema.FieldTypeDate,
				},
				&schema.SchemaField{
					Name: "notes",
					Type: schema.FieldTypeText,
				},
			),
		}

		if err := dao.SaveCollection(floatingTasksCollection); err != nil {
			return err
		}

		// Collection energy_logs (historique des niveaux d'énergie)
		energyLogsCollection := &models.Collection{
			Name:       "energy_logs",
			Type:       models.CollectionTypeBase,
			ListRule:   types.Pointer("@request.auth.id = user_id"),
			ViewRule:   types.Pointer("@request.auth.id = user_id"),
			CreateRule: types.Pointer("@request.auth.id = user_id"),
			Schema: schema.NewSchema(
				&schema.SchemaField{
					Name:     "user_id",
					Type:     schema.FieldTypeRelation,
					Required: true,
					Options: &schema.RelationOptions{
						CollectionId:  usersCollection.Id,
						CascadeDelete: true,
					},
				},
				&schema.SchemaField{
					Name:     "energy_level",
					Type:     schema.FieldTypeNumber,
					Required: true,
					Options: &schema.NumberOptions{
						Min: types.Pointer(float64(1)),
						Max: types.Pointer(float64(5)),
					},
				},
				&schema.SchemaField{
					Name: "time_period",
					Type: schema.FieldTypeSelect,
					Options: &schema.SelectOptions{
						MaxSelect: 1,
						Values:    []string{"morning", "afternoon", "evening", "night"},
					},
				},
				&schema.SchemaField{
					Name: "notes",
					Type: schema.FieldTypeText,
				},
			),
		}

		if err := dao.SaveCollection(energyLogsCollection); err != nil {
			return err
		}

		return nil
	}, func(db dbx.Builder) error {
		// Rollback - supprimer les collections créées
		collections := []string{"energy_logs", "floating_tasks", "fixed_elements", "user_profiles"}
		
		for _, collectionName := range collections {
			collection, err := dao.FindCollectionByNameOrId(collectionName)
			if err == nil {
				if err := dao.DeleteCollection(collection); err != nil {
					return err
				}
			}
		}

		// Retirer le champ neurotype de users
		usersCollection, err := dao.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		usersCollection.Schema.RemoveField("neurotype")
		return dao.SaveCollection(usersCollection)
	})
}
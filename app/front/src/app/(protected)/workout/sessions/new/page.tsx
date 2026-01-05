"use client";

/**
 * Page de création d'une nouvelle séance.
 * 
 * Permet de :
 * - Donner un nom à la séance
 * - Choisir le type d'activité
 * - Planifier la date
 * - Ajouter des exercices
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workoutApi } from "@/lib/workout-api";
import { googleCalendarApi, appleCalendarApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { MultiSelect } from "@/components/ui/multi-select";
import type { Exercise, ActivityType, UserActivityType, CustomFieldDefinition } from "@/lib/workout-types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Plus,
  X,
  Dumbbell,
  GripVertical,
  Search,
  Activity,
  Bike,
  Footprints,
  Heart,
  Mountain,
  Music,
  Waves,
  Target,
  Timer,
  Trophy,
  Zap,
  Flame,
  PersonStanding,
  CircleDot,
  Swords,
  Medal,
  Volleyball,
  type LucideIcon,
} from "lucide-react";

// Map des icônes disponibles pour les activités
const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  Dumbbell: Dumbbell,
  Footprints: Footprints,
  Music: Music,
  Volleyball: Volleyball,
  Activity: Activity,
  Bike: Bike,
  Heart: Heart,
  Mountain: Mountain,
  Waves: Waves,
  Target: Target,
  Timer: Timer,
  Trophy: Trophy,
  Zap: Zap,
  Flame: Flame,
  PersonStanding: PersonStanding,
  CircleDot: CircleDot,
  Swords: Swords,
  Medal: Medal,
};

// Composant pour afficher une icône d'activité
function ActivityIcon({ iconName, className = "h-5 w-5" }: { iconName: string | null; className?: string }) {
  const IconComponent = iconName ? ACTIVITY_ICONS[iconName] : Activity;
  return IconComponent ? <IconComponent className={className} /> : <Activity className={className} />;
}

// Fonction pour obtenir l'icône d'une activité
function getActivityIcon(activity: { icon: string | null } | null): string {
  if (!activity) return "Activity";
  if (activity.icon && ACTIVITY_ICONS[activity.icon]) {
    return activity.icon;
  }
  return "Activity";
}

// Regex pour identifier les types de paramètres personnalisés
const PARAM_PATTERNS = {
  series: /s[eé]rie|sets?/i,
  reps: /r[eé]p[eé]tition|reps?/i,
  weight: /poids|weight|charge|kg/i,
  duration: /dur[eé]e|temps|time|duration/i,
  distance: /distance|km|kilom[eè]tre/i,
  rest: /repos|rest|pause/i,
};

// Fonction pour identifier le type de paramètre via regex
function identifyParamType(fieldName: string): string | null {
  const normalizedName = fieldName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [type, pattern] of Object.entries(PARAM_PATTERNS)) {
    if (pattern.test(normalizedName)) {
      return type;
    }
  }
  return null;
}

// Fonction pour extraire les paramètres d'un exercice depuis ses field_values
interface ExerciseParams {
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rest?: number;
}

function extractExerciseParams(exercise: Exercise, overrideValues?: Record<number, string>): ExerciseParams {
  const params: ExerciseParams = { sets: 3 }; // Valeur par défaut
  
  if (!exercise.field_values) return params;
  
  exercise.field_values.forEach((fieldValue) => {
    const field = fieldValue.field;
    if (!field) return;
    
    // Utiliser la valeur override si disponible, sinon la valeur par défaut de l'exercice
    const value = overrideValues?.[field.id] ?? fieldValue.value;
    if (!value) return;
    
    const paramType = identifyParamType(field.name);
    
    switch (paramType) {
      case "series":
        params.sets = parseInt(value) || 3;
        break;
      case "reps":
        params.reps = parseInt(value) || undefined;
        break;
      case "weight":
        params.weight = parseFloat(value) || undefined;
        break;
      case "duration":
        params.duration = parseInt(value) || undefined;
        break;
      case "distance":
        params.distance = parseFloat(value) || undefined;
        break;
      case "rest":
        params.rest = parseInt(value) || 90;
        break;
    }
  });
  
  return params;
}

interface SelectedExercise {
  exercise: Exercise;
  fieldValues: Record<number, string>; // field_id -> value
}

// Composant pour rendre un champ personnalisé
function renderCustomField(
  field: CustomFieldDefinition,
  value: string,
  onChange: (value: string) => void
) {
  const options = field.options || [];

  switch (field.field_type) {
    case "select":
      return (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={field.placeholder || "Sélectionner..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: string) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    
    case "multi_select":
      let selectedValues: string[] = [];
      try {
        if (value) {
          selectedValues = JSON.parse(value);
          if (!Array.isArray(selectedValues)) {
            selectedValues = [];
          }
        }
      } catch {
        selectedValues = [];
      }

      const multiSelectOptions = options.map((opt: string) => ({
        label: opt,
        value: opt,
      }));

      return (
        <MultiSelect
          options={multiSelectOptions}
          selected={selectedValues}
          onChange={(selected) => {
            onChange(JSON.stringify(selected));
          }}
          placeholder={field.placeholder || "Sélectionner..."}
        />
      );
    
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label className="text-sm">Oui</Label>
        </div>
      );
    
    case "number":
      return (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder={field.placeholder || "0"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          {field.unit && <span className="text-xs text-muted-foreground">{field.unit}</span>}
        </div>
      );
    
    case "duration":
      return (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="0"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          <span className="text-xs text-muted-foreground">secondes</span>
        </div>
      );
    
    case "date":
      return (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      );
    
    default: // text
      return (
        <Input
          placeholder={field.placeholder || "Valeur..."}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      );
  }
}

// Composant pour un exercice sortable
function SortableExerciseItem({
  item,
  onUpdateField,
  onAddField,
  onRemoveField,
  onRemoveExercise,
}: {
  item: SelectedExercise;
  onUpdateField: (fieldId: number, value: string) => void;
  onAddField: (field: CustomFieldDefinition) => void;
  onRemoveField: (fieldId: number) => void;
  onRemoveExercise: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const activity = item.exercise.custom_activity_type;
  const availableFields = activity?.custom_fields || [];
  const usedFieldIds = new Set(Object.keys(item.fieldValues).map(Number));
  const unusedFields = availableFields.filter((f) => !usedFieldIds.has(f.id));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing mt-1"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <h4 className="font-medium truncate">{item.exercise.name}</h4>
        {activity && (
          <p className="text-xs text-muted-foreground">
            {activity.name}
          </p>
        )}
        
        {/* Champs personnalisés utilisés */}
        {availableFields.length > 0 && (
          <div className="space-y-2 mt-3">
            {availableFields
              .filter((field) => usedFieldIds.has(field.id))
              .map((field) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs">
                      {field.name}
                      {field.unit && (
                        <span className="text-muted-foreground ml-1">({field.unit})</span>
                      )}
                    </Label>
                    {renderCustomField(
                      field,
                      item.fieldValues[field.id] || "",
                      (value) => onUpdateField(field.id, value)
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 mt-5 text-destructive"
                    onClick={() => onRemoveField(field.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            
            {/* Bouton pour ajouter un champ */}
            {unusedFields.length > 0 && (
              <Select
                value=""
                onValueChange={(fieldId) => {
                  const field = availableFields.find((f) => f.id.toString() === fieldId);
                  if (field) onAddField(field);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Ajouter un paramètre..." />
                </SelectTrigger>
                <SelectContent>
                  {unusedFields.map((field) => (
                    <SelectItem key={field.id} value={field.id.toString()}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={onRemoveExercise}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function NewSessionPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Formulaire
  const [name, setName] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [activityType, setActivityType] = useState<ActivityType>("musculation");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | null>(null);

  // Activités personnalisées
  const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);

  // Exercices
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [loadingExercises, setLoadingExercises] = useState(false);
  
  // Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Charger les types d'activités
  const loadActivityTypes = useCallback(async () => {
    try {
      const data = await workoutApi.activityTypes.list();
      setActivityTypes(data);
    } catch (err) {
      console.error("Erreur lors du chargement des activités", err);
    }
  }, []);

  useEffect(() => {
    loadActivityTypes();
  }, [loadActivityTypes]);

  // Mettre à jour l'activité legacy quand on change l'activité personnalisée
  useEffect(() => {
    if (selectedActivityIds.length > 0) {
      const firstActivity = activityTypes.find(a => a.id === selectedActivityIds[0]);
      if (firstActivity) {
        const nameLower = firstActivity.name.toLowerCase();
        if (nameLower.includes("musculation")) setActivityType("musculation");
        else if (nameLower.includes("course")) setActivityType("course");
        else if (nameLower.includes("danse")) setActivityType("danse");
        else if (nameLower.includes("volleyball")) setActivityType("volleyball");
        else setActivityType("autre");
      }
    }
  }, [selectedActivityIds, activityTypes]);

  // Charger les exercices disponibles
  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const data = await workoutApi.exercises.list({
        search: exerciseSearch || undefined,
        limit: 100,
      });
      // Filtrer par activités personnalisées sélectionnées côté client
      let filtered = data;
      if (selectedActivityIds.length > 0) {
        filtered = data.filter(ex => 
          ex.custom_activity_type_id && selectedActivityIds.includes(ex.custom_activity_type_id)
        );
      }
      setAvailableExercises(filtered);
    } catch {
      // Silencieux
    } finally {
      setLoadingExercises(false);
    }
  }, [selectedActivityIds, exerciseSearch]);

  useEffect(() => {
    if (showExerciseDialog) {
      loadExercises();
    }
  }, [showExerciseDialog, loadExercises]);

  const handleAddExercise = (exercise: Exercise) => {
    // Vérifier si l'exercice n'est pas déjà ajouté
    if (selectedExercises.find((e) => e.exercise.id === exercise.id)) {
      showError("Cet exercice est déjà dans la séance");
      return;
    }

    // Initialiser les valeurs des champs personnalisés avec les valeurs par défaut de l'exercice
    const initialFieldValues: Record<number, string> = {};
    if (exercise.field_values) {
      exercise.field_values.forEach((fv) => {
        if (fv.field_id && fv.value !== null) {
          initialFieldValues[fv.field_id] = fv.value;
        }
      });
    }

    // Si l'exercice a une activité personnalisée, initialiser aussi avec les valeurs par défaut des champs
    if (exercise.custom_activity_type?.custom_fields) {
      exercise.custom_activity_type.custom_fields.forEach((field) => {
        if (field.default_value && !initialFieldValues[field.id]) {
          initialFieldValues[field.id] = field.default_value;
        }
      });
    }

    setSelectedExercises((prev) => [
      ...prev,
      {
        exercise,
        fieldValues: initialFieldValues,
      },
    ]);
    // Ne pas fermer le dialog automatiquement - l'utilisateur peut continuer à ajouter des exercices
    setExerciseSearch("");
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFieldValue = (index: number, fieldId: number, value: string) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newFieldValues = { ...item.fieldValues };
          if (value === "" || value === null) {
            delete newFieldValues[fieldId];
          } else {
            newFieldValues[fieldId] = value;
          }
          return { ...item, fieldValues: newFieldValues };
        }
        return item;
      })
    );
  };

  const handleAddField = (index: number, field: CustomFieldDefinition) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newFieldValues = { ...item.fieldValues };
          newFieldValues[field.id] = field.default_value || "";
          return { ...item, fieldValues: newFieldValues };
        }
        return item;
      })
    );
  };

  const handleRemoveField = (index: number, fieldId: number) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newFieldValues = { ...item.fieldValues };
          delete newFieldValues[fieldId];
          return { ...item, fieldValues: newFieldValues };
        }
        return item;
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex((item) => item.exercise.id === active.id);
        const newIndex = items.findIndex((item) => item.exercise.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError("Veuillez entrer un nom pour la séance");
      return;
    }

    setIsLoading(true);
    try {
      // Créer la date/heure planifiée
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

      // Calculer recurrence_data automatiquement selon le type
      let recurrenceData: (number | string)[] | undefined = undefined;
      if (recurrenceType) {
        const scheduledDateObj = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (recurrenceType === "weekly") {
          // Convertir le jour de la semaine en français (0 = dimanche, 1 = lundi, etc.)
          const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
          const dayOfWeek = scheduledDateObj.getDay();
          recurrenceData = [dayNames[dayOfWeek]];
        } else if (recurrenceType === "monthly") {
          // Stocker le jour du mois (ex: 31 pour le 31)
          const dayOfMonth = scheduledDateObj.getDate();
          recurrenceData = [dayOfMonth];
        }
        // Pour "daily", recurrenceData reste undefined
      }

      // Créer la séance (on stocke la première activité sélectionnée)
      const createdSession = await workoutApi.sessions.create({
        name,
        activity_type: activityType,
        custom_activity_type_id: selectedActivityIds.length > 0 ? selectedActivityIds[0] : undefined,
        custom_activity_type_ids: selectedActivityIds,
        scheduled_at: scheduledAt,
        notes: notes || undefined,
        recurrence_type: recurrenceType || undefined,
        recurrence_data: recurrenceData,
        exercises: selectedExercises.map((item, idx) => {
          const params = extractExerciseParams(item.exercise, item.fieldValues);
          return {
            exercise_id: item.exercise.id,
            order: idx,
            target_sets: params.sets,
            target_reps: params.reps,
            target_weight: params.weight,
            target_duration: params.duration,
            target_distance: params.distance,
            rest_seconds: params.rest || 90,
          };
        }),
      });

      // Sync automatique avec les calendriers (silencieux)
      if (createdSession.id) {
        try {
          const [googleStatus, appleStatus] = await Promise.all([
            googleCalendarApi.getStatus().catch(() => ({ connected: false })),
            appleCalendarApi.getStatus().catch(() => ({ connected: false })),
          ]);
          
          const syncPromises = [];
          if (googleStatus.connected) {
            syncPromises.push(googleCalendarApi.syncSession(createdSession.id));
          }
          if (appleStatus.connected) {
            syncPromises.push(appleCalendarApi.syncSession(createdSession.id));
          }
          await Promise.all(syncPromises);
        } catch {
          // Silencieux - ne pas bloquer si la sync échoue
        }
      }

      success(`Séance "${name}" créée avec succès`);
      router.push(`/workout/sessions`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNow = async () => {
    if (!name.trim()) {
      showError("Veuillez entrer un nom pour la séance");
      return;
    }

    setIsLoading(true);
    try {
      // "Lancer maintenant" : la date de la séance est maintenant
      const now = new Date();
      
      // Calculer recurrence_data automatiquement selon le type
      let recurrenceData: (number | string)[] | undefined = undefined;
      if (recurrenceType) {
        if (recurrenceType === "weekly") {
          const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
          const dayOfWeek = now.getDay();
          recurrenceData = [dayNames[dayOfWeek]];
        } else if (recurrenceType === "monthly") {
          const dayOfMonth = now.getDate();
          recurrenceData = [dayOfMonth];
        }
      }

      // Créer la séance avec la date actuelle
      const session = await workoutApi.sessions.create({
        name,
        activity_type: activityType,
        custom_activity_type_id: selectedActivityIds.length > 0 ? selectedActivityIds[0] : undefined,
        custom_activity_type_ids: selectedActivityIds,
        scheduled_at: now.toISOString(), // Date de la séance = maintenant
        notes: notes || undefined,
        recurrence_type: recurrenceType || undefined,
        recurrence_data: recurrenceData,
        exercises: selectedExercises.map((item, idx) => {
          const params = extractExerciseParams(item.exercise, item.fieldValues);
          return {
            exercise_id: item.exercise.id,
            order: idx,
            target_sets: params.sets,
            target_reps: params.reps,
            target_weight: params.weight,
            target_duration: params.duration,
            target_distance: params.distance,
            rest_seconds: params.rest || 90,
          };
        }),
      });

      // Démarrer immédiatement
      await workoutApi.sessions.start(session.id);

      success(`Séance "${name}" lancée ! 💪`);
      router.push(`/workout/sessions/${session.id}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        {/* Header */}
        <section className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Nouvelle séance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planifiez votre entraînement
          </p>
        </section>

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Définissez les détails de la séance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la séance *</Label>
              <Input
                id="name"
                placeholder="Ex: Push Day, Leg Day, Cardio..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Types d'activités (multi-select) */}
            <div className="space-y-2">
              <Label>Types d&apos;activités</Label>
              <MultiSelect
                options={activityTypes.map(activity => ({
                  label: activity.name,
                  value: activity.id.toString(),
                }))}
                selected={selectedActivityIds.map(id => id.toString())}
                onChange={(selected) => {
                  setSelectedActivityIds(selected.map(s => parseInt(s)));
                }}
                placeholder="Sélectionner une ou plusieurs activités"
                renderOption={(option) => {
                  const activity = activityTypes.find(a => a.id.toString() === option.value);
                  return (
                    <div className="flex items-center gap-2">
                      {activity && (
                        <ActivityIcon iconName={getActivityIcon(activity)} className="h-4 w-4" />
                      )}
                      <span>{option.label}</span>
                    </div>
                  );
                }}
                renderBadge={(option) => {
                  const activity = activityTypes.find(a => a.id.toString() === option.value);
                  return (
                    <div className="flex items-center gap-1">
                      {activity && (
                        <ActivityIcon iconName={getActivityIcon(activity)} className="h-3 w-3" />
                      )}
                      <span>{option.label}</span>
                    </div>
                  );
                }}
              />
            </div>

            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Récurrence</Label>
              <Select
                value={recurrenceType || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setRecurrenceType(null);
                  } else {
                    setRecurrenceType(value as "daily" | "weekly" | "monthly");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune récurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune récurrence</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
              {recurrenceType && scheduledDate && scheduledTime && (
                <p className="text-xs text-muted-foreground">
                  {recurrenceType === "daily" && "Cette séance sera programmée tous les jours à la même heure."}
                  {recurrenceType === "weekly" && (() => {
                    const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
                    const scheduledDateObj = new Date(`${scheduledDate}T${scheduledTime}:00`);
                    const dayOfWeek = scheduledDateObj.getDay();
                    return `Cette séance sera programmée tous les ${dayNames[dayOfWeek]}s à la même heure.`;
                  })()}
                  {recurrenceType === "monthly" && (() => {
                    const scheduledDateObj = new Date(`${scheduledDate}T${scheduledTime}:00`);
                    const dayOfMonth = scheduledDateObj.getDate();
                    if (dayOfMonth >= 28) {
                      return `Cette séance sera programmée le dernier jour de chaque mois à la même heure.`;
                    }
                    return `Cette séance sera programmée le ${dayOfMonth} de chaque mois à la même heure.`;
                  })()}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Input
                id="notes"
                placeholder="Objectifs, focus du jour..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Exercices */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Exercices</CardTitle>
                <CardDescription>
                  {selectedExercises.length} exercice{selectedExercises.length > 1 ? "s" : ""} ajouté{selectedExercises.length > 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExerciseDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedExercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun exercice ajouté</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowExerciseDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un exercice
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedExercises.map((item) => item.exercise.id)}
                  strategy={verticalListSortingStrategy}
                >
              <div className="space-y-3">
                {selectedExercises.map((item, index) => (
                      <SortableExerciseItem
                    key={item.exercise.id}
                        item={item}
                        onUpdateField={(fieldId, value) =>
                          handleUpdateFieldValue(index, fieldId, value)
                        }
                        onAddField={(field) => handleAddField(index, field)}
                        onRemoveField={(fieldId) => handleRemoveField(index, fieldId)}
                        onRemoveExercise={() => handleRemoveExercise(index)}
                      />
                ))}
              </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Calendar className="mr-2 h-4 w-4" />
            Planifier
          </Button>
          <Button
            className="flex-1"
            onClick={handleStartNow}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lancer maintenant
          </Button>
        </div>
      </main>

      <Footer />

      {/* Dialog sélection d'exercice */}
      <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajouter un exercice</DialogTitle>
            <DialogDescription>
              Sélectionnez un exercice à ajouter à la séance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un exercice..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Liste des exercices */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {loadingExercises ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableExercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Aucun exercice trouvé</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setShowExerciseDialog(false);
                      router.push("/workout/exercises/new");
                    }}
                  >
                    Créer un exercice
                  </Button>
                </div>
              ) : (
                (() => {
                  // Filtrer les exercices déjà ajoutés
                  const addedExerciseIds = new Set(selectedExercises.map(e => e.exercise.id));
                  const filteredExercises = availableExercises.filter(ex => !addedExerciseIds.has(ex.id));
                  
                  if (filteredExercises.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Tous les exercices disponibles ont été ajoutés</p>
                      </div>
                    );
                  }
                  
                  return filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    onClick={() => handleAddExercise(exercise)}
                  >
                    <h4 className="font-medium">{exercise.name}</h4>
                      {exercise.custom_activity_type && (
                    <p className="text-xs text-muted-foreground">
                          {exercise.custom_activity_type.name}
                    </p>
                      )}
                  </button>
                  ));
                })()
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExerciseDialog(false)}>
              Fermer
            </Button>
            <Button onClick={() => router.push("/workout/exercises/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un exercice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

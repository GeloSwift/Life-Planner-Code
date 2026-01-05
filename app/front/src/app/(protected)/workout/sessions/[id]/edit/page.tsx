"use client";

/**
 * Page d'édition d'une séance (métadonnées).
 *
 * Permet de modifier :
 * - nom
 * - types d'activités (multi-select)
 * - date/heure (si planifiée)
 * - notes
 * - exercices (ajout/suppression)
 */

import { useCallback, useEffect, useMemo, useState, use } from "react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workoutApi } from "@/lib/workout-api";
import { googleCalendarApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { MultiSelect } from "@/components/ui/multi-select";
import type { UserActivityType, WorkoutSession, Exercise, WorkoutSessionExercise, CustomFieldDefinition } from "@/lib/workout-types";
import { Loader2, ArrowLeft, Save, Plus, X, Search, GripVertical } from "lucide-react";
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

interface PageProps {
  params: Promise<{ id: string }>;
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
      return (
        <MultiSelect
          options={options.map(opt => ({ label: opt, value: opt }))}
          selected={selectedValues}
          onChange={(selected) => onChange(JSON.stringify(selected))}
          placeholder={field.placeholder || "Sélectionner..."}
        />
      );
    
    case "text":
      return (
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
          className="h-8 text-sm"
        />
      );
    
    case "number":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
          className="h-8 text-sm"
        />
      );
    
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === "true" || value === "1"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="h-4 w-4"
          />
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
    
    case "duration":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "Durée en secondes"}
          className="h-8 text-sm"
        />
      );
    
    default:
      return (
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
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

export default function EditSessionPage({ params }: PageProps) {
  const { id } = use(params);
  const sessionId = parseInt(id);
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form
  const [name, setName] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("09:00");
  const [notes, setNotes] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionData, activities] = await Promise.all([
        workoutApi.sessions.get(sessionId),
        workoutApi.activityTypes.list(),
      ]);
      setSession(sessionData);
      setActivityTypes(activities);

      setName(sessionData.name || "");
      setNotes(sessionData.notes || "");
      setRecurrenceType(sessionData.recurrence_type || null);

      // Types d'activités
      const ids =
        sessionData.custom_activity_type_ids && sessionData.custom_activity_type_ids.length > 0
          ? sessionData.custom_activity_type_ids
          : sessionData.custom_activity_type_id
            ? [sessionData.custom_activity_type_id]
            : [];
      setSelectedActivityIds(ids);

      // Charger les exercices existants (trier par ordre pour garder l'ordre d'origine)
      const exercisesList = sessionData.exercises || [];
      const loadedExercises: SelectedExercise[] = exercisesList
        .filter((se: WorkoutSessionExercise) => se.exercise !== undefined && se.exercise !== null)
        .sort((a, b) => a.order - b.order)
        .map((se: WorkoutSessionExercise) => {
          // Initialiser les fieldValues depuis les field_values de l'exercice
          const fieldValues: Record<number, string> = {};
          if (se.exercise?.field_values) {
            se.exercise.field_values.forEach((fv) => {
              if (fv.field_id && fv.value !== null) {
                fieldValues[fv.field_id] = fv.value;
              }
            });
          }
          
          return {
            exercise: se.exercise!,
            fieldValues,
          };
        });
      setSelectedExercises(loadedExercises);

      // Date/heure (si planifiée)
      // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
      const dt = sessionData.scheduled_at ? new Date(sessionData.scheduled_at) : null;
      if (dt) {
        // Utiliser les méthodes locales pour éviter les décalages d'heure
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const day = String(dt.getDate()).padStart(2, "0");
        const hours = String(dt.getHours()).padStart(2, "0");
        const minutes = String(dt.getMinutes()).padStart(2, "0");
        setScheduledDate(`${year}-${month}-${day}`);
        setScheduledTime(`${hours}:${minutes}`);
      } else {
        setScheduledDate("");
        setScheduledTime("09:00");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, showError]);

  useEffect(() => {
    if (Number.isNaN(sessionId)) return;
    loadData();
  }, [loadData, sessionId]);

  // Charger les exercices disponibles
  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const data = await workoutApi.exercises.list({
        search: exerciseSearch || undefined,
        limit: 100,
      });
      // Filtrer par activités personnalisées sélectionnées et exclure ceux déjà ajoutés
      let filtered = data;
      if (selectedActivityIds.length > 0) {
        filtered = data.filter(ex => 
          ex.custom_activity_type_id && selectedActivityIds.includes(ex.custom_activity_type_id)
        );
      }
      // Exclure les exercices déjà ajoutés
      const addedExerciseIds = new Set(selectedExercises.map(e => e.exercise.id));
      filtered = filtered.filter(ex => !addedExerciseIds.has(ex.id));
      setAvailableExercises(filtered);
    } catch {
      // Silencieux
    } finally {
      setLoadingExercises(false);
    }
  }, [selectedActivityIds, exerciseSearch, selectedExercises]);

  useEffect(() => {
    if (showExerciseDialog) {
      loadExercises();
    }
  }, [showExerciseDialog, loadExercises]);

  const activityOptions = useMemo(
    () =>
      activityTypes.map((a) => ({
        label: a.name,
        value: a.id.toString(),
      })),
    [activityTypes]
  );

  const handleAddExercise = (exercise: Exercise) => {
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
    setExerciseSearch("");
  };

  const handleRemoveExercise = (exerciseId: number) => {
    setSelectedExercises((prev) => prev.filter((item) => item.exercise.id !== exerciseId));
  };

  const handleUpdateFieldValue = (exerciseId: number, fieldId: number, value: string) => {
    setSelectedExercises((prev) =>
      prev.map((item) => {
        if (item.exercise.id === exerciseId) {
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

  const handleAddField = (exerciseId: number, field: CustomFieldDefinition) => {
    setSelectedExercises((prev) =>
      prev.map((item) => {
        if (item.exercise.id === exerciseId) {
          const newFieldValues = { ...item.fieldValues };
          newFieldValues[field.id] = field.default_value || "";
          return { ...item, fieldValues: newFieldValues };
        }
        return item;
      })
    );
  };

  const handleRemoveField = (exerciseId: number, fieldId: number) => {
    setSelectedExercises((prev) =>
      prev.map((item) => {
        if (item.exercise.id === exerciseId) {
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

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Veuillez entrer un nom");
      return;
    }

    setIsSaving(true);
    try {
      // Créer la date en heure locale pour éviter les décalages UTC
      let scheduled_at: string | undefined = undefined;
      if (scheduledDate && scheduledTime) {
        // Créer une date en heure locale sans conversion UTC
        const [year, month, day] = scheduledDate.split("-").map(Number);
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        const localDate = new Date(year, month - 1, day, hours, minutes, 0);
        // Convertir en ISO string (le backend attend une date ISO)
        scheduled_at = localDate.toISOString();
      }

      // Calculer recurrence_data automatiquement selon le type
      let recurrenceData: (number | string)[] | undefined = undefined;
      if (recurrenceType && scheduledDate && scheduledTime) {
        // Utiliser la date locale pour calculer la récurrence
        const [year, month, day] = scheduledDate.split("-").map(Number);
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        const scheduledDateObj = new Date(year, month - 1, day, hours, minutes, 0);
        
        if (recurrenceType === "weekly") {
          const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
          const dayOfWeek = scheduledDateObj.getDay();
          recurrenceData = [dayNames[dayOfWeek]];
        } else if (recurrenceType === "monthly") {
          const dayOfMonth = scheduledDateObj.getDate();
          recurrenceData = [dayOfMonth];
        }
      }

      // Préparer les données de mise à jour
      const updatePayload: {
        name: string;
        notes?: string;
        scheduled_at?: string;
        custom_activity_type_id?: number;
        custom_activity_type_ids: number[];
        recurrence_type?: "daily" | "weekly" | "monthly";
        recurrence_data?: (number | string)[];
        exercises?: Array<{
          exercise_id: number;
          order: number;
          target_sets: number;
          target_reps?: number;
          target_weight?: number;
          target_duration?: number;
          target_distance?: number;
          rest_seconds: number;
        }>;
      } = {
        name,
        custom_activity_type_ids: selectedActivityIds,
        exercises: selectedExercises.map((item, idx) => {
          const params = extractExerciseParams(item.exercise, item.fieldValues);
          const exerciseData: {
            exercise_id: number;
            order: number;
            target_sets: number;
            rest_seconds: number;
            target_reps?: number;
            target_weight?: number;
            target_duration?: number;
            target_distance?: number;
          } = {
            exercise_id: item.exercise.id,
            order: idx,
            target_sets: params.sets,
            rest_seconds: params.rest || 90,
          };
          if (params.reps) exerciseData.target_reps = params.reps;
          if (params.weight) exerciseData.target_weight = params.weight;
          if (params.duration) exerciseData.target_duration = params.duration;
          if (params.distance) exerciseData.target_distance = params.distance;
          return exerciseData;
        }),
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (notes) updatePayload.notes = notes;
      if (scheduled_at) updatePayload.scheduled_at = scheduled_at;
      if (selectedActivityIds.length > 0) {
        updatePayload.custom_activity_type_id = selectedActivityIds[0];
      }
      // Toujours envoyer recurrence_type et recurrence_data (même si null) pour permettre la suppression
      updatePayload.recurrence_type = recurrenceType || undefined;
      updatePayload.recurrence_data = recurrenceData;

      await workoutApi.sessions.update(sessionId, updatePayload);

      // Sync automatique avec Google Calendar (silencieux)
      try {
        const calendarStatus = await googleCalendarApi.getStatus();
        if (calendarStatus.connected) {
          await googleCalendarApi.syncSession(sessionId);
        }
      } catch {
        // Silencieux - ne pas bloquer si la sync échoue
      }

      success("Séance mise à jour");
      router.push(`/workout/sessions`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <Header variant="sticky" />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">Séance introuvable</p>
              <Button className="mt-4" onClick={() => router.push("/workout/sessions")}>
                Retour
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isSessionInProgress = session.status === "en_cours";
  const isSessionCompleted = session.status === "terminee";
  const isSessionCancelled = session.status === "annulee";
  const canEdit = !isSessionCompleted && !isSessionCancelled;

  // Rediriger si la séance ne peut pas être éditée
  if (!canEdit) {
    return (
      <div className="min-h-screen">
        <Header variant="sticky" />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-destructive">
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-destructive font-medium">
                {isSessionCompleted && "Cette séance est terminée et ne peut pas être modifiée."}
                {isSessionCancelled && "Cette séance a été annulée et ne peut pas être modifiée."}
              </p>
              <Button onClick={() => router.push(`/workout/sessions/${session.id}`)}>
                Voir les détails
              </Button>
              <Button variant="outline" onClick={() => router.push("/workout/sessions")} className="ml-2">
                Retour à la liste
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl pb-32">
        <section className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/workout/sessions")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Modifier la séance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mettez à jour les informations</p>
          {isSessionCompleted && (
            <div className="mt-4 border border-green-500/50 bg-green-500/10 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Cette séance est terminée et ne peut pas être modifiée.
              </p>
            </div>
          )}
          {isSessionCancelled && (
            <div className="mt-4 border border-destructive bg-destructive/10 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">
                Cette séance a été annulée et ne peut pas être modifiée.
              </p>
            </div>
          )}
        </section>

        <Card className={canEdit ? "" : "opacity-50 pointer-events-none"}>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>Nom, activités, date et notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Types d&apos;activités</Label>
              <MultiSelect
                options={activityOptions}
                selected={selectedActivityIds.map((x) => x.toString())}
                onChange={(selected) => setSelectedActivityIds(selected.map((v) => parseInt(v)))}
                placeholder="Sélectionner une ou plusieurs activités"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={scheduledDate} 
                  onChange={(e) => setScheduledDate(e.target.value)}
                  disabled={isSessionInProgress}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={scheduledTime} 
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={isSessionInProgress}
                />
              </div>
            </div>
            {isSessionInProgress && (
              <p className="text-xs text-muted-foreground">
                La date et l&apos;heure ne peuvent pas être modifiées pour une séance en cours
              </p>
            )}

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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Exercices</CardTitle>
                <CardDescription>Gérez les exercices de la séance</CardDescription>
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
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun exercice ajouté. Cliquez sur &quot;Ajouter&quot; pour en ajouter.
              </p>
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
                    {selectedExercises.map((item) => (
                      <SortableExerciseItem
                        key={item.exercise.id}
                        item={item}
                        onUpdateField={(fieldId, value) => handleUpdateFieldValue(item.exercise.id, fieldId, value)}
                        onAddField={(field) => handleAddField(item.exercise.id, field)}
                        onRemoveField={(fieldId) => handleRemoveField(item.exercise.id, fieldId)}
                        onRemoveExercise={() => handleRemoveExercise(item.exercise.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Ajouter un exercice</DialogTitle>
              <DialogDescription>
                Sélectionnez un exercice à ajouter à la séance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un exercice..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {loadingExercises ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : availableExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun exercice disponible
                  </p>
                ) : (
                  availableExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAddExercise(exercise)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{exercise.name}</p>
                        {exercise.custom_activity_type && (
                          <p className="text-xs text-muted-foreground">
                            {exercise.custom_activity_type.name}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/workout/sessions")}>
            Retour
          </Button>
          {canEdit && (
            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

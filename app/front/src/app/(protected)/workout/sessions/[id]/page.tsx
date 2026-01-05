"use client";

/**
 * Page de séance active.
 * 
 * Affiche :
 * - Timer de la séance
 * - Liste des exercices avec séries à cocher
 * - Possibilité d'ajouter des sets
 * - Timer de repos entre les séries
 */

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import {
  ACTIVITY_TYPE_LABELS,
  type WorkoutSession,
  type WorkoutSessionExercise,
  type UserActivityType,
} from "@/lib/workout-types";
import {
  Loader2,
  ArrowLeft,
  Timer,
  Play,
  Square,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  RotateCcw,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SessionPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError, info } = useToast();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutSessionExercise[]>([]);
  const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer de séance
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer de repos
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restDuration = 60; // Changé de 90s à 60s

  // Exercice étendu
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  // Nouveau set - données dynamiques selon les paramètres de l'exercice
  const [newSetData, setNewSetData] = useState<{
    exerciseId: number | null;
    values: Record<string, string>;
  }>({ exerciseId: null, values: {} });

  // Notes sur les exercices
  const [exerciseNotes, setExerciseNotes] = useState<Record<number, string>>({});

  // Notes sur la séance globale
  const [sessionNotes, setSessionNotes] = useState<string>("");

  const loadSession = useCallback(async (preserveExpanded: boolean = false) => {
    try {
      setError(null);
      const [sessionData, activitiesData] = await Promise.all([
        workoutApi.sessions.get(parseInt(id)),
        workoutApi.activityTypes.list(),
      ]);
      setSession(sessionData);
      setActivityTypes(activitiesData);
      // Les exercices sont inclus dans la réponse de la session
      const exercisesList = sessionData.exercises || [];
      setExercises(exercisesList);

      // Charger les notes de la séance
      setSessionNotes(sessionData.notes || "");

      // Charger les notes des exercices
      const notesMap: Record<number, string> = {};
      exercisesList.forEach((ex) => {
        if (ex.notes) {
          notesMap[ex.id] = ex.notes;
        }
      });
      setExerciseNotes(notesMap);

      // Ne pas changer l'exercice étendu si on veut le préserver
      if (!preserveExpanded) {
      // Étendre le premier exercice non complété
        const firstIncomplete = exercisesList.find((e) => !e.is_completed);
      if (firstIncomplete) {
        setExpandedExercise(firstIncomplete.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Timer de séance
  useEffect(() => {
    if (!session?.started_at || session.status !== "en_cours") return;

    const startTime = new Date(session.started_at).getTime();

    const updateTime = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [session?.started_at, session?.status]);

  // Timer de repos
  useEffect(() => {
    if (!isResting || restTimer <= 0) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          // Notification sonore (si supportée)
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          info("Repos terminé ! 💪 C'est reparti !");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting, restTimer, info]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const startRest = () => {
    setRestTimer(restDuration);
    setIsResting(true);
  };

  const stopRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const handleStartSession = async () => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      const updated = await workoutApi.sessions.start(session.id);
      setSession(updated);
      success(`Séance lancée ! 🚀 ${session.name}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      // Sauvegarder les notes de la séance avant de terminer
      if (sessionNotes !== session.notes) {
        await workoutApi.sessions.update(session.id, {
          notes: sessionNotes || undefined,
        });
      }
      
      // Terminer la séance (les notes ont déjà été sauvegardées via update)
      await workoutApi.sessions.complete(session.id);
      success(`Séance terminée ! 🎉 ${session.name} - ${formatTime(elapsedTime)}`);
      router.push("/workout/history");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveExerciseNotes = async (exerciseId: number, notes: string) => {
    if (!session) return;
    try {
      // Utiliser l'endpoint dédié pour mettre à jour les notes (sans toucher aux séries)
      await workoutApi.sessions.updateExerciseNotes(session.id, exerciseId, notes);

      // Mettre à jour l'état local
      setExercises((prev) =>
        prev.map((ex) => (ex.id === exerciseId ? { ...ex, notes } : ex))
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde des notes");
    }
  };

  const handleSaveSessionNotes = async () => {
    if (!session) return;
    try {
      await workoutApi.sessions.update(session.id, {
        notes: sessionNotes || undefined,
      });
      setSession((prev) => (prev ? { ...prev, notes: sessionNotes } : null));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde des notes");
    }
  };

  // Vérifier si toutes les séries sont complétées
  const allSetsCompleted = exercises.length > 0 && exercises.every((ex) => {
    const totalSets = ex.sets?.length || 0;
    const completedSets = ex.sets?.filter((s) => s.is_completed).length || 0;
    return totalSets > 0 && completedSets === totalSets;
  });

  // Désélectionner une série (marquer comme non complétée)
  const handleUncompleteSet = async (setId: number) => {
    if (!session) return;
    try {
      await workoutApi.sessions.updateSet(setId, { is_completed: false });
      await loadSession(true); // Préserver l'exercice étendu
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Basculer l'état d'une série (compléter ou désélectionner)
  const handleToggleSet = async (exerciseId: number, setId: number, isCompleted: boolean) => {
    if (!session || !isActive) return;
    
    if (isCompleted) {
      // Désélectionner
      await handleUncompleteSet(setId);
    } else {
      // Compléter
      await handleCompleteSetInternal(exerciseId, setId);
    }
  };

  const handleCompleteSetInternal = async (exerciseId: number, setId: number) => {
    if (!session) return;
    try {
      await workoutApi.sessions.completeSet(setId);
      await loadSession(true); // Préserver l'exercice étendu
      // Lancer le timer de repos automatiquement
      startRest();
      
      // Vérifier si toutes les séries sont maintenant complétées après rechargement
      const updatedSession = await workoutApi.sessions.get(session.id);
      const updatedExercises = updatedSession.exercises || [];
      const allCompleted = updatedExercises.length > 0 && 
        updatedExercises.every((ex) => {
          const totalSets = ex.sets?.length || 0;
          const completedSets = ex.sets?.filter((s) => s.is_completed).length || 0;
          return totalSets > 0 && completedSets === totalSets;
        });

      if (allCompleted && session.status === "en_cours") {
        // Auto-valider immédiatement
        info("Toutes les séries sont complétées ! Séance terminée.");
        handleCompleteSession();
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAddSet = async (exerciseId: number, details: ExerciseDetails) => {
    if (!session) return;

    const values = newSetData.values;
    const exercise = exercises.find((e) => e.id === exerciseId);
    const setNumber = (exercise?.sets?.length || 0) + 1;

    // Extraire les valeurs selon les paramètres disponibles
    const weight = values.weight ? parseFloat(values.weight) : details.weight;
    const reps = values.reps ? parseInt(values.reps) : details.reps;
    const duration = values.duration ? parseInt(values.duration) : undefined;
    const distance = values.distance ? parseFloat(values.distance) : undefined;

    // Vérification basique - au moins une valeur doit être renseignée
    if (!weight && !reps && !duration && !distance) {
      showError("Veuillez renseigner au moins une valeur");
      return;
    }

    try {
      await workoutApi.sessions.addSet(session.id, exerciseId, {
        set_number: setNumber,
        weight: weight || undefined,
        reps: reps || undefined,
        duration_seconds: duration || undefined,
        distance: distance || undefined,
      });
      setNewSetData({ exerciseId: null, values: {} });
      await loadSession(true); // Préserver l'exercice étendu
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Regex pour identifier les types de paramètres personnalisés
  const PARAM_PATTERNS = {
    // Musculation
    series: /s[eé]rie|sets?/i,
    reps: /r[eé]p[eé]tition|reps?/i,
    weight: /poids|weight|charge|kg/i,
    muscles: /muscle|group/i,
    rest: /repos|rest|pause/i,
    
    // Course à pied / Cardio
    distance: /distance|km|kilom[eè]tre/i,
    duration: /dur[eé]e|temps|time|duration/i,
    speed: /vitesse|speed|allure|pace/i,
    incline: /inclinaison|pente|incline|slope/i,
    calories: /calorie|kcal/i,
    heartRate: /fr[eé]quence.*cardiaque|bpm|heart.*rate|cardio/i,
    
    // Volleyball / Sports collectifs
    passes: /passe|pass/i,
    hits: /coup|frappe|hit|smash|attaque/i,
    serves: /service|serve/i,
    blocks: /bloc|block/i,
    points: /point|score/i,
    
    // Danse
    steps: /pas|step/i,
    choreography: /chor[eé]graphie|mouvement|figure/i,
    rhythm: /rythme|tempo|bpm/i,
    
    // Général
    level: /niveau|level|difficult/i,
    intensity: /intensit[eé]|effort/i,
  };

  // Fonction pour identifier le type de paramètre via regex
  const identifyParamType = (fieldName: string): string | null => {
    const normalizedName = fieldName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    for (const [type, pattern] of Object.entries(PARAM_PATTERNS)) {
      if (pattern.test(normalizedName)) {
        return type;
      }
    }
    return null;
  };

  // Fonction pour obtenir les noms des activités de la séance
  const getSessionActivityNames = useCallback((): string => {
    if (!session) return "";
    
    const names: string[] = [];
    
    // 1) Activités depuis custom_activity_type_ids
    if (session.custom_activity_type_ids && session.custom_activity_type_ids.length > 0) {
      session.custom_activity_type_ids.forEach((id) => {
        const activity = activityTypes.find((a) => a.id === id);
        if (activity) names.push(activity.name);
      });
    }
    
    // 2) Activité principale custom_activity_type
    if (session.custom_activity_type && !names.includes(session.custom_activity_type.name)) {
      names.push(session.custom_activity_type.name);
    } else if (session.custom_activity_type_id && names.length === 0) {
      const activity = activityTypes.find((a) => a.id === session.custom_activity_type_id);
      if (activity && !names.includes(activity.name)) {
        names.push(activity.name);
      }
    }
    
    // 3) Fallback sur activity_type de base
    if (names.length === 0) {
      return ACTIVITY_TYPE_LABELS[session.activity_type];
    }
    
    return names.join(", ");
  }, [session, activityTypes]);

  // Fonction pour extraire les informations clés des paramètres personnalisés
  interface ExerciseDetails {
    sets?: number;
    reps?: number;
    weight?: number;
    muscles?: string[];
    duration?: number;
    distance?: number;
    speed?: number;
    incline?: number;
    other: { name: string; value: string; unit?: string }[];
  }

  const extractExerciseDetails = (exercise: WorkoutSessionExercise): ExerciseDetails => {
    const details: ExerciseDetails = { other: [] };
    
    // D'abord, récupérer depuis les champs de base de l'exercice de session
    if (exercise.target_sets) details.sets = exercise.target_sets;
    if (exercise.target_reps) details.reps = exercise.target_reps;
    if (exercise.target_weight) details.weight = exercise.target_weight;
    if (exercise.target_duration) details.duration = exercise.target_duration;
    if (exercise.target_distance) details.distance = exercise.target_distance;
    
    // Ensuite, parcourir les paramètres personnalisés de l'exercice
    if (exercise.exercise?.field_values && exercise.exercise.field_values.length > 0) {
      exercise.exercise.field_values.forEach((fieldValue) => {
        const field = fieldValue.field;
        if (!field || !fieldValue.value) return;
        
        const paramType = identifyParamType(field.name);
        let displayValue = fieldValue.value;
        
        // Parser les valeurs selon le type
        if (field.field_type === "multi_select") {
          try {
            const parsed = JSON.parse(fieldValue.value);
            if (Array.isArray(parsed)) {
              displayValue = parsed.join(", ");
            }
          } catch {
            // Ignore
          }
        } else if (field.field_type === "checkbox") {
          displayValue = fieldValue.value === "true" ? "Oui" : "Non";
        }
        
        // Assigner selon le type identifié
        switch (paramType) {
          case "series":
            details.sets = parseInt(fieldValue.value) || details.sets;
            break;
          case "reps":
            details.reps = parseInt(fieldValue.value) || details.reps;
            break;
          case "weight":
            details.weight = parseFloat(fieldValue.value) || details.weight;
            break;
          case "muscles":
            if (field.field_type === "multi_select") {
              try {
                details.muscles = JSON.parse(fieldValue.value);
              } catch {
                details.muscles = [fieldValue.value];
              }
            } else {
              details.muscles = [fieldValue.value];
            }
            break;
          case "duration":
            details.duration = parseInt(fieldValue.value) || details.duration;
            break;
          case "distance":
            details.distance = parseFloat(fieldValue.value) || details.distance;
            break;
          case "speed":
            details.speed = parseFloat(fieldValue.value);
            break;
          case "incline":
            details.incline = parseFloat(fieldValue.value);
            break;
          default:
            // Ajouter aux autres paramètres
            details.other.push({
              name: field.name,
              value: displayValue,
              unit: field.unit || undefined,
            });
        }
      });
    }
    
    return details;
  };

  // Fonction pour formater les muscles travaillés (affiché en dessous)
  const formatSecondaryDetails = (details: ExerciseDetails): string | null => {
    const parts: string[] = [];
    
    if (details.muscles && details.muscles.length > 0) {
      parts.push(details.muscles.join(", "));
    }
    
    // Ajouter les autres paramètres non catégorisés
    details.other.forEach((param) => {
      parts.push(`${param.name}: ${param.value}${param.unit ? ` ${param.unit}` : ""}`);
    });
    
    return parts.length > 0 ? parts.join(" • ") : null;
  };

  // Fonction pour formater les détails d'une série de manière dynamique
  const formatSetDetails = (
    set: { weight?: number | null; reps?: number | null; duration_seconds?: number | null; distance?: number | null },
    details: ExerciseDetails
  ): string => {
    const parts: string[] = [];
    
    // Afficher le poids si pertinent (musculation)
    if (details.weight !== undefined || set.weight) {
      parts.push(set.weight ? `${set.weight}kg` : "-");
    }
    
    // Afficher les reps si pertinent
    if (details.reps !== undefined || set.reps) {
      parts.push(`${set.reps || "-"} reps`);
    }
    
    // Afficher la durée si pertinent (cardio, danse)
    if (details.duration !== undefined || set.duration_seconds) {
      if (set.duration_seconds) {
        const minutes = Math.floor(set.duration_seconds / 60);
        const seconds = set.duration_seconds % 60;
        if (minutes > 0) {
          parts.push(`${minutes}min${seconds > 0 ? `${seconds}s` : ""}`);
        } else {
          parts.push(`${seconds}s`);
        }
      } else {
        parts.push("-");
      }
    }
    
    // Afficher la distance si pertinent (course à pied)
    if (details.distance !== undefined || set.distance) {
      parts.push(set.distance ? `${set.distance}km` : "-");
    }
    
    // Afficher la vitesse si pertinent
    if (details.speed !== undefined) {
      parts.push(`${details.speed}km/h`);
    }
    
    // Afficher l'inclinaison si pertinent
    if (details.incline !== undefined) {
      parts.push(`${details.incline}%`);
    }
    
    // Si aucun détail spécifique, afficher un format par défaut
    if (parts.length === 0) {
      if (set.weight || set.reps) {
        return `${set.weight ? `${set.weight}kg` : "-"} × ${set.reps || "-"} reps`;
      }
      return "Série";
    }
    
    return parts.join(" × ");
  };

  // Fonction pour déterminer les champs d'input pertinents pour une série
  interface SetInputField {
    key: string;
    label: string;
    placeholder: string;
    type: "number";
    defaultValue?: number;
  }

  const getSetInputFields = (details: ExerciseDetails): SetInputField[] => {
    const fields: SetInputField[] = [];
    
    // Pour la musculation : poids et reps
    if (details.weight !== undefined) {
      fields.push({
        key: "weight",
        label: "Poids",
        placeholder: "kg",
        type: "number",
        defaultValue: details.weight,
      });
    }
    
    if (details.reps !== undefined) {
      fields.push({
        key: "reps",
        label: "Reps",
        placeholder: "reps",
        type: "number",
        defaultValue: details.reps,
      });
    }
    
    // Pour le cardio : durée et distance
    if (details.duration !== undefined) {
      fields.push({
        key: "duration",
        label: "Durée",
        placeholder: "sec",
        type: "number",
        defaultValue: details.duration,
      });
    }
    
    if (details.distance !== undefined) {
      fields.push({
        key: "distance",
        label: "Distance",
        placeholder: "km",
        type: "number",
        defaultValue: details.distance,
      });
    }
    
    // Si aucun champ spécifique, afficher poids et reps par défaut
    if (fields.length === 0) {
      fields.push(
        { key: "weight", label: "Poids", placeholder: "kg", type: "number" },
        { key: "reps", label: "Reps", placeholder: "reps", type: "number" }
      );
    }
    
    return fields;
  };

  // Calculer la progression globale de la séance
  const calculateProgress = (): { completed: number; total: number; percentage: number } => {
    let totalSets = 0;
    let completedSets = 0;
    
    exercises.forEach((ex) => {
      totalSets += ex.sets?.length || 0;
      completedSets += ex.sets?.filter((s) => s.is_completed).length || 0;
    });
    
    const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    
    return { completed: completedSets, total: totalSets, percentage };
  };

  // Valider toutes les séries d'un exercice
  const handleCompleteAllSets = async (exerciseId: number) => {
    if (!session) return;
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    
    const incompleteSets = exercise.sets?.filter((s) => !s.is_completed) || [];
    if (incompleteSets.length === 0) return;
    
    try {
      // Compléter toutes les séries une par une
      for (const set of incompleteSets) {
        await workoutApi.sessions.completeSet(set.id);
      }
      await loadSession(true); // Préserver l'exercice étendu
      startRest();
      
      // Vérifier si toutes les séries de tous les exercices sont complétées
      const updatedSession = await workoutApi.sessions.get(session.id);
      const updatedExercises = updatedSession.exercises || [];
      const allCompleted = updatedExercises.length > 0 && 
        updatedExercises.every((ex) => {
          const totalSets = ex.sets?.length || 0;
          const completedSets = ex.sets?.filter((s) => s.is_completed).length || 0;
          return totalSets > 0 && completedSets === totalSets;
        });
      
      if (allCompleted && session.status === "en_cours") {
        // Auto-valider immédiatement
        info("Toutes les séries sont complétées ! Séance terminée.");
        handleCompleteSession();
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen">
        <Header variant="sticky" />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">{error || "Séance introuvable"}</p>
              <Button className="mt-4" onClick={() => router.push("/workout/sessions")}>
                Retour
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isActive = session.status === "en_cours";
  const isPlanned = session.status === "planifiee";
  const isCancelled = session.status === "annulee";
  
  // Vérifier si on peut lancer la séance (même jour que planifié)
  const canStartSession = (): boolean => {
    if (!session.scheduled_at) return true; // Si pas de date planifiée, on peut toujours lancer
    
    const now = new Date();
    const scheduled = new Date(session.scheduled_at);
    
    // Même jour (année, mois, jour)
    return now.getFullYear() === scheduled.getFullYear() &&
           now.getMonth() === scheduled.getMonth() &&
           now.getDate() === scheduled.getDate();
  };
  
  const isSessionStartable = canStartSession();

  return (
    <div className="min-h-screen overflow-hidden pb-32">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{session.name}</h1>
              <p className="text-sm text-muted-foreground">
                {getSessionActivityNames()}
              </p>
              {isCancelled && (
                <div className="mt-4 border border-destructive bg-destructive/10 rounded-lg p-3">
                  <p className="text-sm text-destructive font-medium">
                    Cette séance a été annulée car vous ne l&apos;avez pas lancée à temps !
              </p>
                </div>
              )}
            </div>

            {/* Timer principal */}
            {isActive && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="font-mono text-2xl font-bold tabular-nums">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Timer de repos */}
        {isResting && (
          <Card className="mb-6 bg-orange-500/10 border-orange-500">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">
                Temps de repos
              </p>
              <p className="font-mono text-4xl font-bold text-orange-600 dark:text-orange-400">
                {formatTime(restTimer)}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={stopRest}>
                  Passer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestTimer((prev) => prev + 30)}
                >
                  +30s
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions pour séance planifiée */}
        {isPlanned && (
          <Card className="mb-6">
            <CardContent className="py-6 text-center">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              {isSessionStartable ? (
                <>
              <p className="text-muted-foreground mb-4">
                    Cette séance est planifiée pour aujourd&apos;hui. Lancez-la pour commencer !
              </p>
              <Button onClick={handleStartSession} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Lancer la séance
              </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-2">
                    Cette séance est planifiée pour le{" "}
                    <strong>
                      {session.scheduled_at
                        ? new Date(session.scheduled_at).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })
                        : "-"}
                    </strong>
                  </p>
                  <p className="text-sm text-muted-foreground/70 mb-4">
                    Vous ne pouvez lancer cette séance que le jour prévu.
                  </p>
                  <Button disabled variant="secondary">
                    <Play className="h-4 w-4 mr-2" />
                    Lancer la séance
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Barre de progression */}
        {isActive && exercises.length > 0 && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progression</span>
                <span className="text-sm font-bold text-primary">
                  {calculateProgress().percentage}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${calculateProgress().percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {calculateProgress().completed} / {calculateProgress().total} séries complétées
              </p>
            </CardContent>
          </Card>
        )}

        {/* Liste des exercices */}
        {exercises.length > 0 ? (
          <div className="space-y-4">
            {exercises.map((exercise, index) => {
              const isExpanded = expandedExercise === exercise.id;
              const completedSets =
                exercise.sets?.filter((s) => s.is_completed).length || 0;
              const totalSets = exercise.sets?.length || exercise.target_sets;
              const allExerciseSetsCompleted = totalSets > 0 && completedSets === totalSets;
              const exerciseProgress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
              
              // Extraire les détails dynamiques de l'exercice
              const details = extractExerciseDetails(exercise);
              const secondaryDetails = formatSecondaryDetails(details);
              const inputFields = getSetInputFields(details);

              return (
                <Card
                  key={exercise.id}
                  className={exercise.is_completed ? "opacity-60" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Cercle pour valider toutes les séries de l'exercice */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!allExerciseSetsCompleted && isActive) {
                              handleCompleteAllSets(exercise.id);
                            }
                          }}
                          disabled={allExerciseSetsCompleted || !isActive}
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shrink-0 ${
                            allExerciseSetsCompleted || exercise.is_completed
                              ? "bg-green-500 border-green-500 text-white"
                              : isActive
                                ? "border-primary text-primary hover:bg-primary/10 cursor-pointer"
                                : "border-muted-foreground/30 text-muted-foreground"
                          }`}
                          title="Valider toutes les séries"
                        >
                          {allExerciseSetsCompleted || exercise.is_completed ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span className="text-xs">{exerciseProgress}%</span>
                          )}
                        </button>
                        <div 
                          className="flex-1 cursor-pointer min-w-0"
                          onClick={() =>
                            setExpandedExercise(isExpanded ? null : exercise.id)
                          }
                        >
                          <CardTitle className="text-base truncate">
                            {exercise.exercise?.name || `Exercice ${index + 1}`}
                          </CardTitle>
                          {/* Muscles travaillés */}
                          {secondaryDetails && (
                            <p className="text-xs text-primary/70 mt-0.5">
                              {secondaryDetails}
                          </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setExpandedExercise(isExpanded ? null : exercise.id)
                        }
                        className="p-1"
                      >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                      </button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      {/* Liste des sets avec style radio button */}
                      <div className="space-y-2 mb-4">
                        {exercise.sets?.map((set) => (
                          <div
                            key={set.id}
                            onClick={() => {
                              if (isActive) {
                                handleToggleSet(exercise.id, set.id, set.is_completed);
                              }
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              set.is_completed
                                ? "bg-muted/30 border-muted cursor-pointer"
                                : isActive
                                  ? "bg-muted/50 cursor-pointer hover:border-primary"
                                : "bg-muted/50"
                            }`}
                          >
                            {/* Cercle style radio button */}
                            <div
                              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                set.is_completed
                                  ? "bg-primary border-primary"
                                  : "border-primary"
                              }`}
                            >
                              {set.is_completed && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                            {/* Détails de la série construits dynamiquement */}
                            <span className={`text-sm flex-1 ${set.is_completed ? "line-through text-muted-foreground" : ""}`}>
                              {formatSetDetails(set, details)}
                              </span>
                              {set.is_warmup && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded shrink-0">
                                  Échauffement
                                </span>
                              )}
                          </div>
                        ))}
                      </div>

                      {/* Ajouter un set - champs dynamiques */}
                      {isActive && !exercise.is_completed && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {inputFields.map((field) => (
                          <Input
                              key={field.key}
                              type={field.type}
                              placeholder={field.placeholder}
                            className="w-20"
                            value={
                              newSetData.exerciseId === exercise.id
                                  ? newSetData.values[field.key] || ""
                                : ""
                            }
                            onChange={(e) =>
                              setNewSetData({
                                exerciseId: exercise.id,
                                  values: {
                                    ...(newSetData.exerciseId === exercise.id
                                      ? newSetData.values
                                      : {}),
                                    [field.key]: e.target.value,
                                  },
                              })
                            }
                          />
                          ))}
                          <Button
                            size="sm"
                            onClick={() => handleAddSet(exercise.id, details)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                      )}

                      {/* Notes sur l'exercice */}
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-notes-${exercise.id}`}>
                          Notes sur cet exercice
                        </Label>
                        {isActive ? (
                          <Textarea
                            id={`exercise-notes-${exercise.id}`}
                            placeholder="Ajoutez vos notes pour cet exercice..."
                            value={exerciseNotes[exercise.id] || ""}
                            onChange={(e) => {
                              const newNotes = { ...exerciseNotes };
                              newNotes[exercise.id] = e.target.value;
                              setExerciseNotes(newNotes);
                            }}
                            onBlur={() => {
                              handleSaveExerciseNotes(
                                exercise.id,
                                exerciseNotes[exercise.id] || ""
                              );
                            }}
                            className="min-h-[80px]"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {exerciseNotes[exercise.id] || exercise.notes || "Aucune note pour cet exercice."}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Aucun exercice dans cette séance
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notes sur la séance globale */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes sur la séance</CardTitle>
          </CardHeader>
          <CardContent>
            {isActive ? (
              <Textarea
                placeholder="Ajoutez vos notes sur cette séance..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                onBlur={handleSaveSessionNotes}
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {sessionNotes || "Aucune note pour cette séance."}
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Barre d'actions fixe en bas */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
          {/* Barre de progression mini */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${calculateProgress().percentage}%` }}
            />
          </div>
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {calculateProgress().percentage}%
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                ({calculateProgress().completed}/{calculateProgress().total})
              </span>
            </div>
            <div className="flex gap-2">
          <Button
            variant="outline"
                size="sm"
            onClick={startRest}
            disabled={isResting}
          >
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Repos ({restDuration}s)</span>
          </Button>
              <Button 
                size="sm"
                onClick={handleCompleteSession} 
                disabled={isSubmitting}
                className={allSetsCompleted ? "bg-green-500 hover:bg-green-600" : ""}
              >
            {isSubmitting ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
                  <Square className="h-4 w-4 sm:mr-2" />
            )}
                <span className="hidden sm:inline">Terminer</span>
          </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

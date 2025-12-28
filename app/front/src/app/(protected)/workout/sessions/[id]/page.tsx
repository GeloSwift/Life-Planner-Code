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
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import {
  ACTIVITY_TYPE_LABELS,
  type WorkoutSession,
  type WorkoutSessionExercise,
} from "@/lib/workout-types";
import {
  Loader2,
  ArrowLeft,
  Timer,
  Play,
  Square,
  Check,
  Plus,
  Trash2,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer de séance
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer de repos
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restDuration = 90;

  // Exercice étendu
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  // Nouveau set
  const [newSetData, setNewSetData] = useState<{
    exerciseId: number | null;
    weight: string;
    reps: string;
  }>({ exerciseId: null, weight: "", reps: "" });

  const loadSession = useCallback(async () => {
    try {
      setError(null);
      const sessionData = await workoutApi.sessions.get(parseInt(id));
      setSession(sessionData);
      // Les exercices sont inclus dans la réponse de la session
      const exercisesList = sessionData.exercises || [];
      setExercises(exercisesList);

      // Étendre le premier exercice non complété
      const firstIncomplete = exercisesList.find((e) => !e.is_completed);
      if (firstIncomplete) {
        setExpandedExercise(firstIncomplete.id);
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
      await workoutApi.sessions.complete(session.id);
      success(`Séance terminée ! 🎉 ${session.name} - ${formatTime(elapsedTime)}`);
      router.push("/workout");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSet = async (exerciseId: number, setId: number) => {
    if (!session) return;
    try {
      await workoutApi.sessions.completeSet(session.id, exerciseId, setId);
      await loadSession();
      // Lancer le timer de repos automatiquement
      startRest();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAddSet = async (exerciseId: number) => {
    if (!session) return;

    const weight = parseFloat(newSetData.weight);
    const reps = parseInt(newSetData.reps);

    if (isNaN(reps) || reps <= 0) {
      showError("Veuillez entrer un nombre de répétitions valide");
      return;
    }

    const exercise = exercises.find((e) => e.id === exerciseId);
    const setNumber = (exercise?.sets?.length || 0) + 1;

    try {
      await workoutApi.sessions.addSet(session.id, exerciseId, {
        set_number: setNumber,
        weight: isNaN(weight) ? undefined : weight,
        reps,
      });
      setNewSetData({ exerciseId: null, weight: "", reps: "" });
      await loadSession();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteSet = async (exerciseId: number, setId: number) => {
    if (!session) return;
    try {
      await workoutApi.sessions.deleteSet(session.id, exerciseId, setId);
      await loadSession();
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
                {ACTIVITY_TYPE_LABELS[session.activity_type]}
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
              <p className="text-muted-foreground mb-4">
                Cette séance est planifiée. Lancez-la pour commencer !
              </p>
              <Button onClick={handleStartSession} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Lancer la séance
              </Button>
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

              return (
                <Card
                  key={exercise.id}
                  className={exercise.is_completed ? "opacity-60" : ""}
                >
                  <CardHeader
                    className="pb-2 cursor-pointer"
                    onClick={() =>
                      setExpandedExercise(isExpanded ? null : exercise.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            exercise.is_completed
                              ? "bg-green-500 text-white"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {exercise.is_completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {exercise.exercise?.name || `Exercice ${index + 1}`}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {completedSets}/{totalSets} séries
                            {exercise.target_weight &&
                              ` • ${exercise.target_weight}kg`}
                            {exercise.target_reps &&
                              ` • ${exercise.target_reps} reps`}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      {/* Liste des sets */}
                      <div className="space-y-2 mb-4">
                        {exercise.sets?.map((set) => (
                          <div
                            key={set.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              set.is_completed
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium w-8">
                                #{set.set_number}
                              </span>
                              <span className="text-sm">
                                {set.weight ? `${set.weight}kg` : "-"} ×{" "}
                                {set.reps || "-"} reps
                              </span>
                              {set.is_warmup && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded">
                                  Échauffement
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {!set.is_completed && isActive && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-500"
                                  onClick={() =>
                                    handleCompleteSet(exercise.id, set.id)
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {!set.is_completed && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() =>
                                    handleDeleteSet(exercise.id, set.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {set.is_completed && (
                                <Check className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Ajouter un set */}
                      {isActive && !exercise.is_completed && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="kg"
                            className="w-20"
                            value={
                              newSetData.exerciseId === exercise.id
                                ? newSetData.weight
                                : ""
                            }
                            onChange={(e) =>
                              setNewSetData({
                                exerciseId: exercise.id,
                                weight: e.target.value,
                                reps: newSetData.reps,
                              })
                            }
                          />
                          <Input
                            type="number"
                            placeholder="reps"
                            className="w-20"
                            value={
                              newSetData.exerciseId === exercise.id
                                ? newSetData.reps
                                : ""
                            }
                            onChange={(e) =>
                              setNewSetData({
                                exerciseId: exercise.id,
                                weight: newSetData.weight,
                                reps: e.target.value,
                              })
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddSet(exercise.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                      )}
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
      </main>

      {/* Barre d'actions fixe en bas */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-2 justify-center">
          <Button
            variant="outline"
            onClick={startRest}
            disabled={isResting}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Repos ({restDuration}s)
          </Button>
          <Button onClick={handleCompleteSession} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            Terminer
          </Button>
        </div>
      )}
    </div>
  );
}

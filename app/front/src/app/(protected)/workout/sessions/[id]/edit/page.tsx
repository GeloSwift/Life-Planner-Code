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
import { useToast } from "@/components/ui/toast";
import { MultiSelect } from "@/components/ui/multi-select";
import type { UserActivityType, WorkoutSession, Exercise, WorkoutSessionExercise } from "@/lib/workout-types";
import { Loader2, ArrowLeft, Save, Plus, X, Search } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
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
  const [selectedExercises, setSelectedExercises] = useState<Array<{ exercise: Exercise }>>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("09:00");
  const [notes, setNotes] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | null>(null);
  const [recurrenceData, setRecurrenceData] = useState<(number | string)[]>([]);

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
      setRecurrenceData(sessionData.recurrence_data || []);

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
      const loadedExercises = exercisesList
        .filter((se: WorkoutSessionExercise) => se.exercise !== undefined && se.exercise !== null)
        .sort((a, b) => a.order - b.order)
        .map((se: WorkoutSessionExercise) => ({ 
          exercise: se.exercise! 
        }));
      setSelectedExercises(loadedExercises);

      // Date/heure (si planifiée)
      const dt = sessionData.scheduled_at ? new Date(sessionData.scheduled_at) : null;
      if (dt) {
        const iso = dt.toISOString();
        setScheduledDate(iso.split("T")[0]);
        setScheduledTime(iso.split("T")[1].slice(0, 5));
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

    setSelectedExercises((prev) => [...prev, { exercise }]);
    setExerciseSearch("");
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Veuillez entrer un nom");
      return;
    }

    setIsSaving(true);
    try {
      const scheduled_at =
        scheduledDate && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
          : undefined;

      await workoutApi.sessions.update(sessionId, {
        name,
        notes: notes || undefined,
        scheduled_at,
        custom_activity_type_id: selectedActivityIds.length > 0 ? selectedActivityIds[0] : undefined,
        custom_activity_type_ids: selectedActivityIds,
        exercises: selectedExercises.map((item, idx) => ({
          exercise_id: item.exercise.id,
          order: idx,
          target_sets: 3,
          target_reps: 12,
          rest_seconds: 90,
        })),
      });

      success("Séance mise à jour");
      router.push(`/workout/sessions/${sessionId}`);
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
        </section>

        <Card>
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
                    setRecurrenceData([]);
                  } else {
                    setRecurrenceType(value as "daily" | "weekly" | "monthly");
                    if (value === "daily") {
                      setRecurrenceData([]);
                    } else if (value === "weekly") {
                      setRecurrenceData([]);
                    } else if (value === "monthly") {
                      setRecurrenceData([]);
                    }
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

              {recurrenceType === "weekly" && (
                <div className="space-y-2">
                  <Label className="text-sm">Jours de la semaine</Label>
                  <div className="flex flex-wrap gap-2">
                    {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].map((day) => {
                      const dayLower = day.toLowerCase();
                      const isSelected = recurrenceData.includes(dayLower);
                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setRecurrenceData(recurrenceData.filter((d) => d !== dayLower));
                            } else {
                              setRecurrenceData([...recurrenceData, dayLower]);
                            }
                          }}
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurrenceType === "monthly" && (
                <div className="space-y-2">
                  <Label className="text-sm">Jours du mois (1-31)</Label>
                  <Input
                    type="text"
                    placeholder="Ex: 1, 15, 30"
                    value={recurrenceData.map(String).join(", ")}
                    onChange={(e) => {
                      const values = e.target.value
                        .split(",")
                        .map((v) => parseInt(v.trim()))
                        .filter((v) => !isNaN(v) && v >= 1 && v <= 31);
                      setRecurrenceData(values);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Séparez les jours par des virgules (ex: 1, 15, 30)
                  </p>
                </div>
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
              <div className="space-y-2">
                {selectedExercises.map((item, index) => (
                  <div
                    key={item.exercise.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.exercise.name}</p>
                      {item.exercise.custom_activity_type && (
                        <p className="text-xs text-muted-foreground">
                          {item.exercise.custom_activity_type.name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExercise(index)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
            Annuler
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

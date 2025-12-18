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
import { useToast } from "@/components/ui/toast";
import type { Exercise, ActivityType } from "@/lib/workout-types";
import { ACTIVITY_TYPE_LABELS, MUSCLE_GROUP_LABELS } from "@/lib/workout-types";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Plus,
  X,
  Dumbbell,
  GripVertical,
  Search,
} from "lucide-react";

interface SelectedExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  restSeconds: number;
}

export default function NewSessionPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Formulaire
  const [name, setName] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("musculation");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [notes, setNotes] = useState("");

  // Exercices
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Charger les exercices disponibles
  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const data = await workoutApi.exercises.list({
        activity_type: activityType,
        search: exerciseSearch || undefined,
        limit: 50,
      });
      setAvailableExercises(data);
    } catch {
      // Silencieux
    } finally {
      setLoadingExercises(false);
    }
  }, [activityType, exerciseSearch]);

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

    setSelectedExercises((prev) => [
      ...prev,
      {
        exercise,
        sets: 3,
        reps: 12,
        weight: undefined,
        restSeconds: 90,
      },
    ]);
    setShowExerciseDialog(false);
    setExerciseSearch("");
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, updates: Partial<SelectedExercise>) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleMoveExercise = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;

    const newList = [...selectedExercises];
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setSelectedExercises(newList);
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

      // Créer la séance
      const session = await workoutApi.sessions.create({
        name,
        activity_type: activityType,
        scheduled_at: scheduledAt,
        notes: notes || undefined,
      });

      // Ajouter les exercices à la séance (si l'API le supporte)
      // Note: Cette partie dépend de l'API backend, on peut l'adapter

      success(`Séance "${name}" créée avec succès`);
      router.push(`/workout/sessions/${session.id}`);
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
      // Créer la séance
      const session = await workoutApi.sessions.create({
        name,
        activity_type: activityType,
        notes: notes || undefined,
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
            onClick={() => router.push("/workout")}
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

            {/* Type d'activité */}
            <div className="space-y-2">
              <Label>Type d&apos;activité</Label>
              <Select
                value={activityType}
                onValueChange={(v) => setActivityType(v as ActivityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="space-y-3">
                {selectedExercises.map((item, index) => (
                  <div
                    key={item.exercise.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveExercise(index, "up")}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.exercise.name}</h4>
                      {item.exercise.muscle_group && (
                        <p className="text-xs text-muted-foreground">
                          {MUSCLE_GROUP_LABELS[item.exercise.muscle_group]}
                        </p>
                      )}
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <div>
                          <Label className="text-xs">Séries</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.sets}
                            onChange={(e) =>
                              handleUpdateExercise(index, { sets: parseInt(e.target.value) || 1 })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Reps</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.reps}
                            onChange={(e) =>
                              handleUpdateExercise(index, { reps: parseInt(e.target.value) || 1 })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Poids (kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.weight || ""}
                            onChange={(e) =>
                              handleUpdateExercise(index, { weight: parseFloat(e.target.value) || undefined })
                            }
                            className="h-8 text-sm"
                            placeholder="-"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Repos (s)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.restSeconds}
                            onChange={(e) =>
                              handleUpdateExercise(index, { restSeconds: parseInt(e.target.value) || 0 })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
                availableExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    onClick={() => handleAddExercise(exercise)}
                  >
                    <h4 className="font-medium">{exercise.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {exercise.muscle_group
                        ? MUSCLE_GROUP_LABELS[exercise.muscle_group]
                        : ACTIVITY_TYPE_LABELS[exercise.activity_type]}
                    </p>
                  </button>
                ))
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

"use client";

/**
 * Composant Actions Rapides pour le Workout Planner.
 * 
 * Permet de :
 * - Créer une nouvelle séance
 * - Lancer une séance rapide
 * - Créer un exercice
 * - Faire une pesée
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workoutApi } from "@/lib/workout-api";
import {
  ACTIVITY_TYPE_LABELS,
  MUSCLE_GROUP_LABELS,
  type ActivityType,
  type MuscleGroup,
} from "@/lib/workout-types";
import {
  Plus,
  Play,
  Scale,
  Dumbbell,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface QuickActionsProps {
  onActionComplete?: () => void;
}

export function QuickActions({ onActionComplete }: QuickActionsProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [showNewWeight, setShowNewWeight] = useState(false);

  // New session form
  const [sessionName, setSessionName] = useState("");
  const [sessionActivity, setSessionActivity] = useState<ActivityType>("musculation");

  // New exercise form
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseActivity, setExerciseActivity] = useState<ActivityType>("musculation");
  const [exerciseMuscle, setExerciseMuscle] = useState<MuscleGroup | "">("");

  // New weight form
  const [weight, setWeight] = useState("");

  const handleCreateSession = async (startImmediately = false) => {
    if (!sessionName.trim()) {
      showError("Veuillez entrer un nom pour la séance");
      return;
    }

    setIsLoading(true);
    try {
      const session = await workoutApi.sessions.create({
        name: sessionName,
        activity_type: sessionActivity,
      });

      if (startImmediately) {
        await workoutApi.sessions.start(session.id);
        success(`Séance lancée ! 💪 ${sessionName} a commencé`);
      } else {
        success(`Séance créée : ${sessionName}`);
      }

      setShowNewSession(false);
      setSessionName("");
      onActionComplete?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      showError("Veuillez entrer un nom pour l'exercice");
      return;
    }

    setIsLoading(true);
    try {
      await workoutApi.exercises.create({
        name: exerciseName,
        activity_type: exerciseActivity,
        muscle_group: exerciseMuscle || undefined,
      });

      success(`Exercice créé : ${exerciseName}`);

      setShowNewExercise(false);
      setExerciseName("");
      setExerciseMuscle("");
      onActionComplete?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWeight = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      showError("Veuillez entrer un poids valide");
      return;
    }

    setIsLoading(true);
    try {
      await workoutApi.weight.create({
        weight: weightValue,
      });

      success(`Pesée enregistrée ⚖️ ${weightValue} kg`);

      setShowNewWeight(false);
      setWeight("");
      onActionComplete?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Actions rapides
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Nouvelle séance */}
          <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvelle séance</span>
                <span className="sm:hidden">Séance</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle séance</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle séance d&apos;entraînement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name">Nom de la séance</Label>
                  <Input
                    id="session-name"
                    placeholder="Ex: Push Day, Cardio, Leg Day..."
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-activity">Type d&apos;activité</Label>
                  <Select
                    value={sessionActivity}
                    onValueChange={(v) => setSessionActivity(v as ActivityType)}
                  >
                    <SelectTrigger id="session-activity">
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
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCreateSession(false)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Planifier
                </Button>
                <Button
                  onClick={() => handleCreateSession(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Lancer maintenant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Nouvel exercice */}
          <Dialog open={showNewExercise} onOpenChange={setShowNewExercise}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvel exercice</span>
                <span className="sm:hidden">Exercice</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel exercice</DialogTitle>
                <DialogDescription>
                  Ajoutez un exercice personnalisé
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise-name">Nom de l&apos;exercice</Label>
                  <Input
                    id="exercise-name"
                    placeholder="Ex: Développé couché, Squat..."
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exercise-activity">Type d&apos;activité</Label>
                  <Select
                    value={exerciseActivity}
                    onValueChange={(v) => setExerciseActivity(v as ActivityType)}
                  >
                    <SelectTrigger id="exercise-activity">
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
                <div className="space-y-2">
                  <Label htmlFor="exercise-muscle">Groupe musculaire</Label>
                  <Select
                    value={exerciseMuscle}
                    onValueChange={(v) => setExerciseMuscle(v as MuscleGroup)}
                  >
                    <SelectTrigger id="exercise-muscle">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MUSCLE_GROUP_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateExercise} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Nouvelle pesée */}
          <Dialog open={showNewWeight} onOpenChange={setShowNewWeight}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Pesée</span>
                <span className="sm:hidden">Poids</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle pesée</DialogTitle>
                <DialogDescription>
                  Enregistrez votre poids du jour
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddWeight} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Page de gestion des objectifs.
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
import { useToast } from "@/components/ui/toast";
import {
  GOAL_TYPE_LABELS,
  type Goal,
  type GoalType,
  type GoalCreate,
} from "@/lib/workout-types";
import {
  Loader2,
  Target,
  Plus,
  ArrowLeft,
  Trophy,
  TrendingUp,
  Trash2,
  Edit,
  CheckCircle,
} from "lucide-react";

export default function GoalsPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAchieved, setShowAchieved] = useState(false);

  // Formulaire nouveau objectif
  const [newGoal, setNewGoal] = useState<Partial<GoalCreate>>({
    name: "",
    goal_type: "poids_corporel",
    target_value: 0,
    unit: "kg",
  });

  const loadGoals = useCallback(async () => {
    try {
      setError(null);
      const data = await workoutApi.goals.list({
        is_active: !showAchieved ? true : undefined,
        is_achieved: showAchieved ? true : undefined,
      });
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [showAchieved]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateGoal = async () => {
    if (!newGoal.name?.trim() || !newGoal.target_value) {
      showError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      await workoutApi.goals.create(newGoal as GoalCreate);
      success(`Objectif créé ! 🎯 ${newGoal.name}`);
      setShowNewGoal(false);
      setNewGoal({
        name: "",
        goal_type: "poids_corporel",
        target_value: 0,
        unit: "kg",
      });
      loadGoals();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async (goal: Goal, newValue: number) => {
    try {
      await workoutApi.goals.updateProgress(goal.id, newValue);
      success(`Progression mise à jour : ${goal.name}: ${newValue} ${goal.unit}`);
      loadGoals();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (!confirm(`Supprimer l'objectif "${goal.name}" ?`)) return;

    try {
      await workoutApi.goals.delete(goal.id);
      success(`Objectif supprimé : ${goal.name}`);
      loadGoals();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const getUnitForGoalType = (type: GoalType): string => {
    switch (type) {
      case "poids_corporel":
      case "poids_exercice":
        return "kg";
      case "repetitions":
        return "reps";
      case "temps_exercice":
      case "temps":
        return "min";
      case "distance":
        return "km";
      case "nombre_seances":
        return "séances";
      case "serie_consecutive":
        return "jours";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8">
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                Objectifs
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Définissez et suivez vos objectifs
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showAchieved ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowAchieved(!showAchieved)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                {showAchieved ? "Actifs" : "Atteints"}
              </Button>
              <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel objectif
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvel objectif</DialogTitle>
                    <DialogDescription>
                      Définissez un nouvel objectif à atteindre
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal-name">Nom de l&apos;objectif</Label>
                      <Input
                        id="goal-name"
                        placeholder="Ex: Peser 80kg, Bench 100kg..."
                        value={newGoal.name}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-type">Type d&apos;objectif</Label>
                      <Select
                        value={newGoal.goal_type}
                        onValueChange={(v) =>
                          setNewGoal({
                            ...newGoal,
                            goal_type: v as GoalType,
                            unit: getUnitForGoalType(v as GoalType),
                          })
                        }
                      >
                        <SelectTrigger id="goal-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="goal-target">Valeur cible</Label>
                        <Input
                          id="goal-target"
                          type="number"
                          step="0.1"
                          value={newGoal.target_value || ""}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              target_value: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal-unit">Unité</Label>
                        <Input
                          id="goal-unit"
                          value={newGoal.unit}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, unit: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-current">Valeur actuelle (optionnel)</Label>
                      <Input
                        id="goal-current"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={newGoal.current_value || ""}
                        onChange={(e) =>
                          setNewGoal({
                            ...newGoal,
                            current_value: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateGoal} disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Créer l&apos;objectif
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Contenu */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {showAchieved
                  ? "Aucun objectif atteint pour le moment"
                  : "Aucun objectif actif"}
              </p>
              {!showAchieved && (
                <Button className="mt-4" onClick={() => setShowNewGoal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un objectif
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = Math.min(
                100,
                Math.max(0, (goal.current_value / goal.target_value) * 100)
              );

              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {goal.is_achieved ? (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <CardDescription>
                            {GOAL_TYPE_LABELS[goal.goal_type]}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!goal.is_achieved && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newValue = prompt(
                                `Nouvelle valeur pour "${goal.name}":`,
                                String(goal.current_value)
                              );
                              if (newValue !== null) {
                                const parsed = parseFloat(newValue);
                                if (!isNaN(parsed)) {
                                  handleUpdateProgress(goal, parsed);
                                }
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteGoal(goal)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Barre de progression */}
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          goal.is_achieved
                            ? "bg-yellow-500"
                            : progress >= 75
                            ? "bg-green-500"
                            : progress >= 50
                            ? "bg-blue-500"
                            : "bg-primary"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {goal.current_value} {goal.unit}
                      </span>
                      <span className="font-medium">
                        {goal.target_value} {goal.unit}
                        {goal.is_achieved && (
                          <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-500" />
                        )}
                      </span>
                    </div>

                    {goal.achieved_at && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        🎉 Atteint le{" "}
                        {new Date(goal.achieved_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}

                    {goal.deadline && !goal.is_achieved && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        📅 Échéance :{" "}
                        {new Date(goal.deadline).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

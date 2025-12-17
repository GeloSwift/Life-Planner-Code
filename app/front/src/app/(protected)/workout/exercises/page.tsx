"use client";

/**
 * Page liste des exercices.
 * 
 * Affiche tous les exercices avec filtres par :
 * - Type d'activité
 * - Groupe musculaire
 * - Recherche textuelle
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  type Exercise,
  type ActivityType,
  type MuscleGroup,
} from "@/lib/workout-types";
import {
  Loader2,
  Dumbbell,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  X,
  Play,
} from "lucide-react";

export default function ExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityType | "all">("all");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const loadExercises = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await workoutApi.exercises.list({
        activity_type: activityFilter !== "all" ? activityFilter : undefined,
        muscle_group: muscleFilter !== "all" ? muscleFilter : undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [activityFilter, muscleFilter, search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadExercises();
    }, 300);

    return () => clearTimeout(debounce);
  }, [loadExercises]);

  const clearFilters = () => {
    setSearch("");
    setActivityFilter("all");
    setMuscleFilter("all");
  };

  const hasFilters = search || activityFilter !== "all" || muscleFilter !== "all";

  // Grouper les exercices par groupe musculaire
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group || "autre";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return { label: "Débutant", color: "text-green-500" };
    if (difficulty <= 4) return { label: "Intermédiaire", color: "text-yellow-500" };
    return { label: "Avancé", color: "text-red-500" };
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
            onClick={() => router.push("/workout")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                Exercices
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {exercises.length} exercice{exercises.length > 1 ? "s" : ""} disponible
                {exercises.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={() => router.push("/workout/exercises/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel exercice
            </Button>
          </div>
        </section>

        {/* Barre de recherche */}
        <section className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un exercice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Filtres</span>
              {hasFilters && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
                  {[activityFilter !== "all", muscleFilter !== "all", search].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filtres dépliables */}
          {showFilters && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Type d&apos;activité</label>
                    <Select
                      value={activityFilter}
                      onValueChange={(v) => setActivityFilter(v as ActivityType | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Groupe musculaire</label>
                    <Select
                      value={muscleFilter}
                      onValueChange={(v) => setMuscleFilter(v as MuscleGroup | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {Object.entries(MUSCLE_GROUP_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {hasFilters && (
                    <div className="flex items-end">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Effacer
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
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
        ) : exercises.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {hasFilters
                  ? "Aucun exercice ne correspond à vos critères"
                  : "Aucun exercice disponible"}
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/workout/exercises/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un exercice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedExercises).map(([group, groupExercises]) => (
              <section key={group}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {MUSCLE_GROUP_LABELS[group as MuscleGroup] || "Autre"}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({groupExercises.length})
                  </span>
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupExercises.map((exercise) => {
                    const difficulty = getDifficultyLabel(exercise.difficulty);

                    return (
                      <Card
                        key={exercise.id}
                        className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                        onClick={() => router.push(`/workout/exercises/${exercise.id}`)}
                      >
                        {/* Image/Vidéo */}
                        {exercise.image_url || exercise.video_url ? (
                          <div className="relative h-32 bg-muted rounded-t-lg overflow-hidden">
                            {exercise.video_url ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <Play className="h-8 w-8 text-white" />
                              </div>
                            ) : null}
                            {exercise.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={exercise.image_url}
                                alt={exercise.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
                            <Dumbbell className="h-8 w-8 text-primary/30" />
                          </div>
                        )}

                        <CardHeader className="pb-2">
                          <CardTitle className="text-base line-clamp-1">
                            {exercise.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {exercise.description || "Aucune description"}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {ACTIVITY_TYPE_LABELS[exercise.activity_type]}
                            </span>
                            <span className={difficulty.color}>{difficulty.label}</span>
                          </div>

                          {exercise.equipment && (
                            <p className="mt-2 text-xs text-muted-foreground truncate">
                              🏋️ {exercise.equipment}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

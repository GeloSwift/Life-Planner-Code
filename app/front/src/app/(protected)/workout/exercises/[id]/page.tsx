"use client";

/**
 * Page de détail d'un exercice.
 * 
 * Affiche toutes les informations d'un exercice avec possibilité d'édition.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import type { Exercise } from "@/lib/workout-types";
import {
  Loader2,
  ArrowLeft,
  Dumbbell,
  Edit,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function ExerciseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = parseInt(params.id as string);
  const { success, error: showError } = useToast();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadExercise = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await workoutApi.exercises.get(exerciseId);
      setExercise(data);
    } catch (err) {
      showError("Erreur lors du chargement de l'exercice");
      console.error(err);
      router.push("/workout/exercises");
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, showError, router]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  const handleDelete = async () => {
    if (!exercise) return;

    setIsDeleting(true);
    try {
      await workoutApi.exercises.delete(exercise.id);
      success(`Exercice "${exercise.name}" supprimé`);
      router.push("/workout/exercises");
    } catch (err) {
      showError("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!exercise) {
    return null;
  }

  const activity = exercise.custom_activity_type;

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <section className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/workout/exercises")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                {activity && (
                  <ActivityIcon 
                    iconName={getActivityIcon(activity)} 
                    className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" 
                  />
                )}
                {!activity && <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />}
                {exercise.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {activity?.name || "Exercice"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => router.push(`/workout/exercises/${exercise.id}/edit`)}
                className="w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Image/GIF */}
          {(exercise.gif_data || exercise.image_url) && (
            <Card className="p-0 overflow-hidden">
              <div className="relative w-full bg-muted overflow-hidden aspect-video">
                {exercise.gif_data ? (
                  <Image
                    src={exercise.gif_data}
                    alt={exercise.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                    unoptimized
                  />
                ) : exercise.image_url ? (
                  <Image
                    src={exercise.image_url}
                    alt={exercise.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                ) : null}
              </div>
            </Card>
          )}

          {/* Informations générales - Affichée uniquement si au moins un champ est rempli */}
          {(exercise.description || exercise.instructions || exercise.equipment) && (
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exercise.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  </div>
                )}

                {exercise.instructions && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Instructions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {exercise.instructions}
                    </p>
                  </div>
                )}

                {exercise.equipment && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Équipement</h3>
                    <p className="text-sm text-muted-foreground">🏋️ {exercise.equipment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Champs personnalisés */}
        {exercise.field_values && exercise.field_values.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Paramètres personnalisés</CardTitle>
              <CardDescription>
                Champs spécifiques à {activity?.name || "cette activité"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {exercise.field_values.map((fieldValue) => {
                  const field = fieldValue.field;
                  if (!field) return null;

                  let displayValue = fieldValue.value || "—";
                  if (field.field_type === "multi_select" && fieldValue.value) {
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

                  return (
                    <div key={fieldValue.id} className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {field.name}
                      </h3>
                      <p className="text-sm">
                        {displayValue}
                        {field.unit && (
                          <span className="text-muted-foreground ml-1">{field.unit}</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;exercice</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{exercise.name}&quot; ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

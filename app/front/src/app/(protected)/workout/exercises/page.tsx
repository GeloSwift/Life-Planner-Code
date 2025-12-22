"use client";

/**
 * Page liste des exercices avec activités personnalisées.
 * 
 * Fonctionnalités :
 * - Filtres par activité personnalisée
 * - Affichage des exercices avec leurs champs personnalisés
 * - Édition et suppression d'exercices
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  type Exercise,
  type UserActivityType,
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
  Edit,
  Trash2,
  Copy,
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

export default function ExercisesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState<number | "all">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [customFieldFilters, setCustomFieldFilters] = useState<Record<number, string>>({});
  const [activeCustomFilterFields, setActiveCustomFilterFields] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger les types d'activités
  const loadActivityTypes = useCallback(async () => {
    try {
      const types = await workoutApi.activityTypes.list();
      setActivityTypes(types);
    } catch (err) {
      console.error("Erreur lors du chargement des activités", err);
    }
  }, []);

  useEffect(() => {
    loadActivityTypes();
  }, [loadActivityTypes]);

  // Stocker les exercices bruts pour éviter de recharger depuis l'API à chaque changement de filtre
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  const loadExercises = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await workoutApi.exercises.list({
        search: search.trim() || undefined,
        limit: 100,
      });
      
      setAllExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  // Filtrer et trier les exercices côté client
  useEffect(() => {
    let filtered = [...allExercises];
    
    // Filtrer par activité personnalisée
    if (activityFilter !== "all") {
      filtered = filtered.filter(ex => ex.custom_activity_type_id === activityFilter);
    }
    
    // Filtrer par champs personnalisés
    if (Object.keys(customFieldFilters).length > 0) {
      filtered = filtered.filter(ex => {
        if (!ex.field_values) return false;
        
        return Object.entries(customFieldFilters).every(([fieldId, filterValue]) => {
          if (!filterValue || filterValue.trim() === "") return true;
          
          const fieldValue = ex.field_values.find(fv => fv.field_id === parseInt(fieldId));
          if (!fieldValue || !fieldValue.value) return false;
          
          const value = fieldValue.value;
          const field = fieldValue.field;
          
          if (field?.field_type === "multi_select") {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                const filterValues = filterValue.split(",").map(v => v.trim().toLowerCase());
                return filterValues.some(fv => 
                  parsed.some(p => p.toLowerCase().includes(fv))
                );
              }
            } catch {
              // Ignore
            }
          }
          
          if (field?.field_type === "select") {
            return value.toLowerCase() === filterValue.toLowerCase();
          }
          
          return value.toLowerCase().includes(filterValue.toLowerCase());
        });
      });
    }
    
    // Trier par ordre alphabétique
    filtered.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    setExercises(filtered);
  }, [allExercises, activityFilter, customFieldFilters, sortOrder]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadExercises();
    }, 300);

    return () => clearTimeout(debounce);
  }, [loadExercises]);

  const clearFilters = () => {
    setSearch("");
    setActivityFilter("all");
    setCustomFieldFilters({});
    setActiveCustomFilterFields([]);
    setSortOrder("asc");
  };

  const hasFilters = search || activityFilter !== "all" || Object.keys(customFieldFilters).some(k => customFieldFilters[parseInt(k)]);
  
  // Obtenir les champs personnalisés de l'activité sélectionnée pour les filtres
  const selectedActivityForFilters = activityTypes.find(a => a.id === activityFilter);
  const availableCustomFields = selectedActivityForFilters?.custom_fields || [];

  // Grouper les exercices par activité
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const activityId = exercise.custom_activity_type_id || "default";
    const key = activityId.toString();
    if (!acc[key]) {
      acc[key] = {
        activity: exercise.custom_activity_type || null,
        exercises: [],
      };
    }
    acc[key].exercises.push(exercise);
    return acc;
  }, {} as Record<string, { activity: UserActivityType | null; exercises: Exercise[] }>);

  // Fonction pour obtenir l'icône d'une activité
  const getActivityIcon = (activity: UserActivityType | null): string => {
    if (!activity) return "Activity";
    if (activity.icon && ACTIVITY_ICONS[activity.icon]) {
      return activity.icon;
    }
    return "Activity";
  };

  // Supprimer un exercice
  const handleDeleteClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exerciseToDelete) return;

    setIsDeleting(true);
    try {
      await workoutApi.exercises.delete(exerciseToDelete.id);
      success(`Exercice "${exerciseToDelete.name}" supprimé`);
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
      loadExercises();
    } catch (err) {
      showError("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Éditer un exercice
  const handleEditClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/workout/exercises/${exercise.id}/edit`);
  };

  // Dupliquer un exercice
  const handleDuplicateClick = async (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Préparer les données pour la duplication
      const selectedActivityName = exercise.custom_activity_type?.name.toLowerCase() || "autre";
      let legacyActivityType = "autre";
      if (selectedActivityName.includes("musculation")) legacyActivityType = "musculation";
      else if (selectedActivityName.includes("course")) legacyActivityType = "course";
      else if (selectedActivityName.includes("danse")) legacyActivityType = "danse";
      else if (selectedActivityName.includes("volleyball")) legacyActivityType = "volleyball";

      const fieldValuesData = exercise.field_values?.map(fv => ({
        field_id: fv.field_id,
        value: fv.value || "",
      })) || [];

      // Créer la copie
      const duplicated = await workoutApi.exercises.create({
        name: `${exercise.name} (copie)`,
        description: exercise.description || undefined,
        instructions: exercise.instructions || undefined,
        video_url: exercise.video_url || undefined,
        image_url: exercise.image_url || undefined,
        activity_type: legacyActivityType as never,
        custom_activity_type_id: exercise.custom_activity_type_id || undefined,
        gif_data: exercise.gif_data || undefined,
        equipment: exercise.equipment || undefined,
        field_values: fieldValuesData.length > 0 ? fieldValuesData : undefined,
      });

      success(`Exercice "${exercise.name}" dupliqué`);
      // Rediriger vers la page d'édition du nouvel exercice
      router.push(`/workout/exercises/${duplicated.id}/edit`);
    } catch (err) {
      showError("Erreur lors de la duplication");
      console.error(err);
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
            </div>
            <Button 
              onClick={() => router.push("/workout/exercises/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouvel exercice</span>
              <span className="sm:hidden">Nouveau</span>
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
                  {[
                    activityFilter !== "all",
                    search,
                    ...Object.values(customFieldFilters).filter(v => v && v.trim()),
                  ].filter(Boolean).length}
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
                      value={activityFilter.toString()}
                      onValueChange={(v) => {
                        setActivityFilter(v === "all" ? "all" : parseInt(v));
                        // Réinitialiser les filtres personnalisés quand on change d'activité
                        setCustomFieldFilters({});
                        setActiveCustomFilterFields([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {activityTypes.map((activity) => (
                          <SelectItem key={activity.id} value={activity.id.toString()}>
                            <div className="flex items-center gap-2">
                              <ActivityIcon iconName={getActivityIcon(activity)} className="h-4 w-4" />
                              <span>{activity.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Tri</label>
                    <Select
                      value={sortOrder}
                      onValueChange={(v) => setSortOrder(v as "asc" | "desc")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">A-Z</SelectItem>
                        <SelectItem value="desc">Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasFilters && (
                    <div className="flex items-end sm:items-end">
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
                        <X className="h-4 w-4 mr-2" />
                        Effacer
                      </Button>
                    </div>
                  )}
                </div>

                {/* Filtres personnalisés par champ */}
                {availableCustomFields.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <label className="text-sm font-medium">Filtres personnalisés</label>
                      <Select
                        value=""
                        onValueChange={(v) => {
                          if (v && !activeCustomFilterFields.includes(parseInt(v))) {
                            setActiveCustomFilterFields(prev => [...prev, parseInt(v)]);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-full sm:w-[200px]">
                          <SelectValue placeholder="Ajouter un filtre..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCustomFields
                            .filter(field => !activeCustomFilterFields.includes(field.id))
                            .map((field) => (
                              <SelectItem key={field.id} value={field.id.toString()}>
                                {field.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {activeCustomFilterFields.map((fieldId) => {
                        const field = availableCustomFields.find(f => f.id === fieldId);
                        if (!field) return null;
                        
                        const filterValue = customFieldFilters[fieldId] || "";
                        
                        return (
                          <div key={fieldId} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-muted-foreground">
                                {field.name}
                                {field.unit && <span className="ml-1">({field.unit})</span>}
                              </label>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCustomFilterFields(prev => prev.filter(id => id !== fieldId));
                                  setCustomFieldFilters(prev => {
                                    const updated = { ...prev };
                                    delete updated[fieldId];
                                    return updated;
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            {field.field_type === "select" && field.options ? (
                              <Select
                                value={filterValue}
                                onValueChange={(v) => {
                                  setCustomFieldFilters(prev => ({
                                    ...prev,
                                    [fieldId]: v === "all" ? "" : v,
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Tous" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Tous</SelectItem>
                                  {field.options.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.field_type === "multi_select" && field.options ? (
                              <MultiSelect
                                options={field.options.map(opt => ({ label: opt, value: opt }))}
                                selected={filterValue ? filterValue.split(",") : []}
                                onChange={(selected) => {
                                  setCustomFieldFilters(prev => ({
                                    ...prev,
                                    [fieldId]: selected.join(","),
                                  }));
                                }}
                                placeholder="Tous"
                              />
                            ) : (
                              <Input
                                placeholder={`Filtrer par ${field.name.toLowerCase()}...`}
                                value={filterValue}
                                onChange={(e) => {
                                  setCustomFieldFilters(prev => ({
                                    ...prev,
                                    [fieldId]: e.target.value,
                                  }));
                                }}
                                className="h-9"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
            {Object.entries(groupedExercises).map(([key, group]) => (
              <section key={key}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {group.activity && (
                    <ActivityIcon 
                      iconName={getActivityIcon(group.activity)} 
                      className="h-5 w-5 text-primary" 
                    />
                  )}
                  {group.activity?.name || "Autre"}
                </h2>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {group.exercises.map((exercise) => {
                    const activity = exercise.custom_activity_type;

                    return (
                      <Card
                        key={exercise.id}
                        className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 relative p-0 overflow-hidden"
                        onClick={() => router.push(`/workout/exercises/${exercise.id}`)}
                      >
                        {/* Actions rapides */}
                        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => handleDuplicateClick(exercise, e)}
                            title="Dupliquer"
                          >
                            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => handleEditClick(exercise, e)}
                            title="Modifier"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => handleDeleteClick(exercise, e)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        {/* Image/GIF/Vidéo - Hauteur fixe pour aligner toutes les cartes */}
                        <div className="relative w-full bg-muted overflow-hidden aspect-video">
                          {exercise.gif_data ? (
                            <img
                              src={exercise.gif_data}
                              alt={exercise.name}
                              className="w-full h-full object-cover"
                            />
                          ) : exercise.image_url || exercise.video_url ? (
                            <>
                              {exercise.video_url && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                <Play className="h-8 w-8 text-white" />
                              </div>
                              )}
                            {exercise.image_url && (
                              <img
                                src={exercise.image_url}
                                alt={exercise.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              {activity ? (
                                <ActivityIcon 
                                  iconName={getActivityIcon(activity)} 
                                  className="h-8 w-8 sm:h-10 sm:w-10 text-primary/30" 
                                />
                              ) : (
                                <Dumbbell className="h-8 w-8 sm:h-10 sm:w-10 text-primary/30" />
                              )}
                          </div>
                        )}
                        </div>

                        <CardHeader className="pb-2 pt-4">
                          <CardTitle className="text-base line-clamp-1">
                            {exercise.name}
                          </CardTitle>
                          {exercise.description && (
                          <CardDescription className="line-clamp-2">
                              {exercise.description}
                          </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="pt-0 pb-4 space-y-2">
                          {/* Activité */}
                          <div className="flex items-center gap-2 text-xs">
                            {activity && (
                              <ActivityIcon 
                                iconName={getActivityIcon(activity)} 
                                className="h-3.5 w-3.5 text-muted-foreground" 
                              />
                            )}
                            <span className="text-muted-foreground">
                              {activity?.name || "Autre"}
                            </span>
                          </div>

                          {/* Champs personnalisés (afficher tous) */}
                          {exercise.field_values && exercise.field_values.length > 0 && (
                            <div className="space-y-1 pt-1 border-t">
                              {exercise.field_values.map((fieldValue) => {
                                const field = fieldValue.field;
                                if (!field) return null;
                                
                                let displayValue = fieldValue.value;
                                if (field.field_type === "multi_select" && fieldValue.value) {
                                  try {
                                    const parsed = JSON.parse(fieldValue.value);
                                    if (Array.isArray(parsed)) {
                                      displayValue = parsed.join(", ");
                                    }
                                  } catch {
                                    // Ignore
                                  }
                                }

                                return (
                                  <div key={fieldValue.id} className="text-xs">
                                    <span className="font-medium text-muted-foreground">
                                      {field.name}:
                                    </span>{" "}
                                    <span className="text-foreground">
                                      {displayValue || "—"}
                                    </span>
                                    {field.unit && (
                                      <span className="text-muted-foreground ml-1">
                                        {field.unit}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Équipement */}
                          {exercise.equipment && (
                            <p className="text-xs text-muted-foreground truncate pt-1 border-t">
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

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;exercice</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{exerciseToDelete?.name}&quot; ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setExerciseToDelete(null);
              }}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
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

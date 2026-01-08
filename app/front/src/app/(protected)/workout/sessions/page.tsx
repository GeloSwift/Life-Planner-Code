"use client";

/**
 * Page liste des séances.
 * 
 * Fonctionnalités :
 * - Liste des séances avec leurs activités personnalisées
 * - Filtres par statut et activité
 * - Affichage des séances planifiées, en cours, terminées
 * - Navigation vers les détails d'une séance
 */

import { useEffect, useState, useCallback, type MouseEvent } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import {
  type WorkoutSession,
  type UserActivityType,
  SessionStatus,
  SESSION_STATUS_LABELS,
} from "@/lib/workout-types";
import { SkeletonSessionsList } from "@/components/ui/skeleton";
import {
  Loader2,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Calendar,
  Copy,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
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
  Dumbbell,
  Check,
  X,
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

// Fonction pour obtenir l'icône d'une activité
function getActivityIcon(activity: { icon: string | null } | null): string {
  if (!activity) return "Activity";
  if (activity.icon && ACTIVITY_ICONS[activity.icon]) {
    return activity.icon;
  }
  return "Activity";
}

// Fonction pour obtenir l'icône de statut
function getStatusIcon(status: SessionStatus) {
  switch (status) {
    case "planifiee":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "en_cours":
      return <Play className="h-4 w-4 text-green-500" />;
    case "terminee":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "annulee":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

export default function SessionsPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<WorkoutSession[]>([]);
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Mode sélection multiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  const [contextMenuSession, setContextMenuSession] = useState<WorkoutSession | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [activityFilter, setActivityFilter] = useState<number | "all">("all");
  
  // Activités personnalisées
  const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);

  // Charger les sessions et activités
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionsData, activitiesData] = await Promise.all([
        workoutApi.sessions.list(),
        workoutApi.activityTypes.list(),
      ]);
      setSessions(sessionsData);
      setActivityTypes(activitiesData);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSessionActivities = useCallback((session: WorkoutSession): UserActivityType[] => {
    const map = new Map<number, UserActivityType>();

    // 1) IDs déclarés sur la séance
    const ids = session.custom_activity_type_ids || [];
    ids.forEach((id) => {
      const activity = activityTypes.find((a) => a.id === id);
      if (activity) map.set(activity.id, activity);
    });

    // 2) Activité principale de la séance
    if (session.custom_activity_type) {
      map.set(session.custom_activity_type.id, session.custom_activity_type);
    } else if (session.custom_activity_type_id) {
      const activity = activityTypes.find((a) => a.id === session.custom_activity_type_id);
      if (activity) map.set(activity.id, activity);
    }

    // 3) Fallback via activités des exercices (si dispo)
    if (session.exercises) {
      session.exercises.forEach((ex) => {
        const a = ex.exercise?.custom_activity_type;
        if (a) map.set(a.id, a);
      });
    }

    return Array.from(map.values());
  }, [activityTypes]);

  // Filtrer les sessions
  useEffect(() => {
    let filtered = [...sessions];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.name.toLowerCase().includes(query) ||
          session.notes?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((session) => session.status === statusFilter);
    }

    // Filtre par activité
    if (activityFilter !== "all") {
      filtered = filtered.filter((session) => {
        if (session.custom_activity_type_id === activityFilter) return true;
        if (session.custom_activity_type_ids && session.custom_activity_type_ids.includes(activityFilter)) return true;
        // fallback : activités des exercices (si elles arrivent avec la séance)
        return Boolean(session.exercises?.some((ex) => ex.exercise?.custom_activity_type_id === activityFilter));
      });
    }

    // Trier par date (plus récentes en premier)
    filtered.sort((a, b) => {
      const dateA = a.scheduled_at || a.created_at;
      const dateB = b.scheduled_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, statusFilter, activityFilter]);

  const handleDeleteClick = (session: WorkoutSession, e: MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await workoutApi.sessions.delete(sessionToDelete.id);
      success(`Séance "${sessionToDelete.name}" supprimée`);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateClick = async (session: WorkoutSession, e: MouseEvent) => {
    e.stopPropagation();
    try {
      const full = await workoutApi.sessions.get(session.id);
      
      // Si la date originale est dans le passé, on la met à demain à la même heure
      // pour éviter que le système automatique change le statut à "annulée"
      let newScheduledAt = full.scheduled_at ?? undefined;
      if (full.scheduled_at) {
        const originalDate = new Date(full.scheduled_at);
        const now = new Date();
        
        // Si la date est dans le passé, la mettre à demain à la même heure
        if (originalDate < now) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
          newScheduledAt = tomorrow.toISOString();
        }
      }
      
      const duplicated = await workoutApi.sessions.create({
        name: `${full.name} (copie)`,
        activity_type: full.activity_type,
        custom_activity_type_id: full.custom_activity_type_id ?? undefined,
        custom_activity_type_ids: full.custom_activity_type_ids ?? [],
        scheduled_at: newScheduledAt,
        notes: full.notes ?? undefined,
        recurrence_type: full.recurrence_type ?? undefined,
        recurrence_data: full.recurrence_data ?? undefined,
        exercises: full.exercises?.map((ex) => {
          const exerciseData: {
            exercise_id: number;
            order: number;
            target_sets: number;
            rest_seconds: number;
            target_reps?: number;
            target_weight?: number;
            target_duration?: number;
            target_distance?: number;
            notes?: string;
          } = {
            exercise_id: ex.exercise_id,
            order: ex.order,
            target_sets: ex.target_sets,
            rest_seconds: ex.rest_seconds,
          };
          if (ex.target_reps) exerciseData.target_reps = ex.target_reps;
          if (ex.target_weight) exerciseData.target_weight = ex.target_weight;
          if (ex.target_duration) exerciseData.target_duration = ex.target_duration;
          if (ex.target_distance) exerciseData.target_distance = ex.target_distance;
          if (ex.notes) exerciseData.notes = ex.notes;
          return exerciseData;
        }),
      });
      
      // Le backend crée toujours les séances avec le statut "planifiee" par défaut.
      // Si on a mis à jour la date pour qu'elle soit dans le futur, le système automatique
      // ne changera pas le statut. On vérifie quand même pour être sûr.
      let finalSession = duplicated;
      
      // Vérifier le statut après création
      finalSession = await workoutApi.sessions.get(duplicated.id);
      
      // Si le statut n'est pas "planifiee", le forcer explicitement
      if (finalSession.status !== "planifiee") {
        await workoutApi.sessions.update(duplicated.id, {
          status: "planifiee",
        });
        finalSession = await workoutApi.sessions.get(duplicated.id);
      }
      
      success(`Séance "${full.name}" dupliquée`);
      // Rediriger directement vers la page d'édition sans recharger la liste
      // Utiliser replace au lieu de push pour éviter d'ajouter une entrée dans l'historique
      // et rendre la transition plus fluide (évite les flashs)
      router.replace(`/workout/sessions/${finalSession.id}/edit`);
    } catch (err) {
      console.error("Erreur lors de la duplication:", err);
      showError(err instanceof Error ? err.message : "Erreur lors de la duplication");
    }
  };

  const handleEditClick = (session: WorkoutSession, e: MouseEvent) => {
    e.stopPropagation();
    // Empêcher l'édition des séances terminées ou annulées
    if (session.status === "terminee" || session.status === "annulee") {
      showError("Cette séance ne peut pas être modifiée");
      return;
    }
    router.push(`/workout/sessions/${session.id}/edit`);
  };

  // Gestion de la sélection multiple
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedSessionIds(new Set());
  };

  const toggleSessionSelection = (sessionId: number) => {
    const newSelected = new Set(selectedSessionIds);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessionIds(newSelected);
  };

  const selectAll = () => {
    setSelectedSessionIds(new Set(filteredSessions.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedSessionIds(new Set());
  };

  // Gestion du long press (mobile)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTouchStart = (session: WorkoutSession, _e: React.TouchEvent) => {
    if (selectionMode) return;
    
    const timer = setTimeout(() => {
      setContextMenuSession(session);
      setContextMenuOpen(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Actions du menu contextuel
  const handleContextMenuSelect = () => {
    if (contextMenuSession) {
      setSelectionMode(true);
      setSelectedSessionIds(new Set([contextMenuSession.id]));
      setContextMenuOpen(false);
      setContextMenuSession(null);
    }
  };

  const handleContextMenuDuplicate = async () => {
    if (contextMenuSession) {
      setContextMenuOpen(false);
      const fakeEvent = { stopPropagation: () => {} } as MouseEvent;
      await handleDuplicateClick(contextMenuSession, fakeEvent);
      setContextMenuSession(null);
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenuSession) {
      setContextMenuOpen(false);
      const fakeEvent = { stopPropagation: () => {} } as MouseEvent;
      handleEditClick(contextMenuSession, fakeEvent);
      setContextMenuSession(null);
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenuSession) {
      setContextMenuOpen(false);
      setSessionToDelete(contextMenuSession);
      setDeleteDialogOpen(true);
      setContextMenuSession(null);
    }
  };

  // Suppression en batch
  const handleBatchDelete = async () => {
    if (selectedSessionIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedSessionIds).map((id) =>
        workoutApi.sessions.delete(id).catch((err) => {
          console.error(`Erreur lors de la suppression de la séance ${id}:`, err);
          return null;
        })
      );
      await Promise.all(deletePromises);
      
      const count = selectedSessionIds.size;
      success(`${count} séance${count > 1 ? "s" : ""} supprimée${count > 1 ? "s" : ""}`);
      setSelectionMode(false);
      setSelectedSessionIds(new Set());
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplanClick = async (session: WorkoutSession, e: MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Récupérer la session complète avec ses exercices
      const full = await workoutApi.sessions.get(session.id);
      
      const now = new Date();
      let nextDate: Date | null = null;
      
      // Si la séance a une récurrence, calculer la prochaine date selon la récurrence
      if (session.recurrence_type && session.scheduled_at) {
        const scheduledTime = new Date(session.scheduled_at);
        
        if (session.recurrence_type === "daily") {
          // Demain à la même heure
          nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + 1);
          nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
        } else if (session.recurrence_type === "weekly" && session.recurrence_data && session.recurrence_data.length > 0) {
          // Semaine suivante, même jour de la semaine à la même heure
          const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
          const targetDay = dayNames.indexOf(String(session.recurrence_data[0]).toLowerCase());
          if (targetDay === -1) {
            showError("Jour de la semaine invalide");
            return;
          }

          // Calculer le jour de la semaine de la date originale
          const originalDayOfWeek = scheduledTime.getDay();

          // Si le jour cible correspond au jour original, on prend la semaine suivante
          nextDate = new Date(scheduledTime);
          if (targetDay === originalDayOfWeek) {
            nextDate.setDate(nextDate.getDate() + 7);
          } else {
            const daysUntilTarget = (targetDay - originalDayOfWeek + 7) % 7 || 7;
            nextDate.setDate(nextDate.getDate() + daysUntilTarget);
          }
          nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
        } else if (session.recurrence_type === "monthly" && session.recurrence_data && session.recurrence_data.length > 0) {
          // Mois suivant, même jour du mois à la même heure
          const dayOfMonth = Number(session.recurrence_data[0]);
          nextDate = new Date(scheduledTime);
          nextDate.setMonth(nextDate.getMonth() + 1);

          const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
          nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
        }
      }

      // Si pas de récurrence, replanifier pour demain à la même heure
      if (!nextDate) {
        const scheduledTime = session.scheduled_at ? new Date(session.scheduled_at) : now;
        nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
      }

      // CRÉER UNE NOUVELLE SÉANCE (au lieu de modifier l'existante)
      // Cela permet de garder l'historique de la séance originale
      await workoutApi.sessions.create({
        name: full.name, // Même nom (pas de "(copie)")
        activity_type: full.activity_type,
        custom_activity_type_id: full.custom_activity_type_id ?? undefined,
        custom_activity_type_ids: full.custom_activity_type_ids ?? [],
        scheduled_at: nextDate.toISOString(),
        notes: undefined, // Notes vides pour la nouvelle séance
        recurrence_type: full.recurrence_type ?? undefined,
        recurrence_data: full.recurrence_data ?? undefined,
        exercises: full.exercises?.map((ex) => {
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
            exercise_id: ex.exercise_id,
            order: ex.order,
            target_sets: ex.target_sets,
            rest_seconds: ex.rest_seconds,
          };
          if (ex.target_reps) exerciseData.target_reps = ex.target_reps;
          if (ex.target_weight) exerciseData.target_weight = ex.target_weight;
          if (ex.target_duration) exerciseData.target_duration = ex.target_duration;
          if (ex.target_distance) exerciseData.target_distance = ex.target_distance;
          return exerciseData;
        }),
      });

      success("Séance replanifiée (nouvelle séance créée)");
      await loadData();
    } catch (err) {
      console.error("Erreur lors de la replanification:", err);
      showError(err instanceof Error ? err.message : "Erreur lors de la replanification");
    }
  };

  const formatRecurrence = (type: string | null | undefined, data: (string | number)[] | null | undefined): string => {
    if (!type) return "";
    if (type === "daily") return "Tous les jours";
    if (type === "weekly" && data && data.length > 0) {
      const dayNames: Record<string, string> = {
        lundi: "Lundi",
        mardi: "Mardi",
        mercredi: "Mercredi",
        jeudi: "Jeudi",
        vendredi: "Vendredi",
        samedi: "Samedi",
        dimanche: "Dimanche",
      };
      const day = dayNames[String(data[0]).toLowerCase()] || String(data[0]);
      return `Tous les ${day}s`;
    }
    if (type === "monthly" && data && data.length > 0) {
      const day = Number(data[0]);
      if (day >= 28) {
        return "Le dernier jour du mois";
      }
      return `Le ${day} de chaque mois`;
    }
    return "";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non planifiée";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, "0")}`;
    }
    return `${minutes}min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen overflow-hidden">
        <BackgroundDecorations />
        <Header variant="sticky" />
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl pb-32">
          <SkeletonSessionsList />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className={`container mx-auto px-4 py-6 sm:py-8 max-w-6xl ${selectionMode ? "pb-24" : "pb-32"}`}>
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
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                {selectionMode ? (
                  <>
                    {selectedSessionIds.size} séance{selectedSessionIds.size > 1 ? "s" : ""} sélectionnée{selectedSessionIds.size > 1 ? "s" : ""}
                  </>
                ) : (
                  "Séances"
                )}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectionMode ? "Sélectionnez les séances à supprimer" : "Gérez vos séances d'entraînement"}
              </p>
            </div>
            <div className="flex gap-2">
              {selectionMode ? (
                <>
                  {/* Sur PC, afficher tous les boutons dans le header */}
                  <div className="hidden sm:flex gap-2">
                    <Button
                      variant="outline"
                      onClick={selectedSessionIds.size === filteredSessions.length ? deselectAll : selectAll}
                    >
                      {selectedSessionIds.size === filteredSessions.length ? "Tout désélectionner" : "Tout sélectionner"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleBatchDelete}
                      disabled={selectedSessionIds.size === 0 || isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Supprimer ({selectedSessionIds.size})
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={toggleSelectionMode}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={toggleSelectionMode}
                    className="w-full sm:w-auto"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sélectionner</span>
                    <span className="sm:hidden">Sélectionner</span>
                  </Button>
                  <Button
                    onClick={() => router.push("/workout/sessions/new")}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Nouvelle séance</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une séance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par statut */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SessionStatus | "all")}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(SESSION_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtre par activité */}
              <Select
                value={activityFilter === "all" ? "all" : activityFilter.toString()}
                onValueChange={(v) => setActivityFilter(v === "all" ? "all" : parseInt(v))}
              >
                <SelectTrigger>
                  <Activity className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Activité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les activités</SelectItem>
                  {activityTypes.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id.toString()}>
                      <div className="flex items-center gap-2">
                        <ActivityIcon iconName={getActivityIcon(activity)} className="h-4 w-4" />
                        {activity.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des séances */}
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                {sessions.length === 0
                  ? "Aucune séance créée"
                  : "Aucune séance ne correspond aux filtres"}
              </p>
              {sessions.length === 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/workout/sessions/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une séance
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => {
              const activities = getSessionActivities(session);

              return (
                <Card
                  key={session.id}
                  className={`group transition-all relative p-0 overflow-hidden ${
                    selectionMode
                      ? selectedSessionIds.has(session.id)
                        ? "ring-2 ring-primary"
                        : ""
                      : session.status === "annulee" || session.status === "terminee"
                      ? "opacity-50 cursor-pointer hover:shadow-lg hover:-translate-y-1"
                      : "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                  }`}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSessionSelection(session.id);
                    } else {
                      router.push(`/workout/sessions/${session.id}`);
                    }
                  }}
                  onTouchStart={(e) => handleTouchStart(session, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                >
                  {/* Case à cocher en mode sélection */}
                  {selectionMode && (
                    <div className="absolute top-2 left-2 z-30">
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                          selectedSessionIds.has(session.id)
                            ? "bg-primary border-primary"
                            : "bg-background border-primary/50"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSessionSelection(session.id);
                        }}
                      >
                        {selectedSessionIds.has(session.id) && (
                          <Check className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions rapides (masquées en mode sélection) */}
                  {!selectionMode && (
                    <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {/* Boutons pour séances actives (planifiée, en cours) */}
                    {session.status !== "annulee" && session.status !== "terminee" && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8"
                          onClick={(e) => handleDuplicateClick(session, e)}
                          title="Dupliquer"
                        >
                          <Copy className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8"
                          onClick={(e) => handleEditClick(session, e)}
                          title="Modifier"
                        >
                          <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Boutons pour séances annulées */}
                    {session.status === "annulee" && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8"
                          onClick={(e) => handleDuplicateClick(session, e)}
                          title="Dupliquer"
                        >
                          <Copy className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8"
                          onClick={(e) => handleReplanClick(session, e)}
                          title="Replanifier"
                        >
                          <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Boutons pour séances terminées */}
                    {session.status === "terminee" && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8"
                          onClick={(e) => handleDuplicateClick(session, e)}
                          title="Dupliquer"
                        >
                          <Copy className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                        {session.recurrence_type && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 sm:h-8 sm:w-8"
                            onClick={(e) => handleReplanClick(session, e)}
                            title="Replanifier"
                          >
                            <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    
                    {/* Bouton supprimer (toujours disponible) */}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
                      onClick={(e) => handleDeleteClick(session, e)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  )}

                  {/* Image avec logos des activités */}
                  <div className="relative w-full bg-muted overflow-hidden aspect-video">
                    {activities.length > 0 ? (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5 gap-2 p-4">
                        {activities.slice(0, 3).map((activity) => (
                          <ActivityIcon
                            key={activity.id}
                            iconName={getActivityIcon(activity)}
                            className="h-10 w-10 sm:h-12 sm:w-12 text-primary"
                          />
                        ))}
                        {activities.length > 3 && (
                          <span className="text-xs font-semibold text-primary">
                            +{activities.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
                        <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary/30" />
                      </div>
                    )}
                    {/* Badge de statut en haut à droite */}
                    <div className="absolute top-2 left-2 z-10">
                      {getStatusIcon(session.status)}
                    </div>
                  </div>

                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base line-clamp-1">
                      {session.name}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      {activities.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap text-xs">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-1 mr-2">
                              <ActivityIcon
                                iconName={getActivityIcon(activity)}
                                className="h-3 w-3 text-muted-foreground"
                              />
                              <span className="text-muted-foreground">{activity.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {session.recurrence_type && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatRecurrence(session.recurrence_type, session.recurrence_data)}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 pb-4 space-y-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="text-xs">{formatDate(session.scheduled_at || session.created_at)}</span>
                      </div>
                      {session.duration_seconds && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Durée</span>
                          <span className="text-xs">{formatDuration(session.duration_seconds)}</span>
                        </div>
                      )}
                      {session.exercises && session.exercises.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Exercices</span>
                          <span className="text-xs">{session.exercises.length}</span>
                        </div>
                      )}
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
                        {session.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Barre d'actions sticky en bas pour mobile (mode sélection) */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50 sm:hidden shadow-lg">
          <div className="flex gap-2 max-w-6xl mx-auto px-4">
            <Button
              variant="outline"
              onClick={selectedSessionIds.size === filteredSessions.length ? deselectAll : selectAll}
              className="flex-1"
              size="sm"
            >
              {selectedSessionIds.size === filteredSessions.length ? "Tout" : "Tout"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={selectedSessionIds.size === 0 || isDeleting}
              className="flex-1"
              size="sm"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer ({selectedSessionIds.size})
            </Button>
            <Button
              variant="ghost"
              onClick={toggleSelectionMode}
              className="flex-1"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Ajouter du padding en bas sur mobile si en mode sélection pour éviter que le contenu soit masqué */}
      {selectionMode && <div className="h-20 sm:hidden" />}

      <Footer />

      {/* Menu contextuel (mobile - long press) */}
      <Sheet open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <SheetContent side="bottom" className="pb-8 px-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg">{contextMenuSession?.name}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={handleContextMenuSelect}
            >
              <Check className="h-4 w-4 mr-2" />
              Sélectionner
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={handleContextMenuDuplicate}
            >
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </Button>
            {contextMenuSession?.status !== "terminee" && contextMenuSession?.status !== "annulee" && (
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={handleContextMenuEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            <Button
              variant="destructive"
              className="w-full justify-center"
              onClick={handleContextMenuDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog confirmation suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la séance</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-medium">{sessionToDelete?.name}</span> ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

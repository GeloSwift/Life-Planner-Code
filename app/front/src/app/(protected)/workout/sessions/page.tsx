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

  // Mode suppression récurrente
  const [recurringDeleteMode, setRecurringDeleteMode] = useState<"choose" | "occurrence" | "all">("choose");
  const [selectedOccurrenceDate, setSelectedOccurrenceDate] = useState<string | null>(null);
  const [occurrenceSearchMonth, setOccurrenceSearchMonth] = useState<number>(new Date().getMonth());
  const [occurrenceSearchYear, setOccurrenceSearchYear] = useState<number>(new Date().getFullYear());

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
    setRecurringDeleteMode("choose");
    setSelectedOccurrenceDate(null);
    setOccurrenceSearchMonth(new Date().getMonth());
    setOccurrenceSearchYear(new Date().getFullYear());
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    
    // Mise à jour optimiste
    const sessionName = sessionToDelete.name;
    const sessionId = sessionToDelete.id;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
    setRecurringDeleteMode("choose");
    
    try {
      await workoutApi.sessions.delete(sessionId);
      success(`Séance "${sessionName}" supprimée`);
      loadData(); // Refresh silencieux
    } catch (err) {
      loadData(); // Annuler si erreur
      showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const handleDeleteOccurrence = async () => {
    if (!sessionToDelete || !selectedOccurrenceDate) return;
    setIsDeleting(true);
    try {
      await workoutApi.sessions.excludeOccurrence(sessionToDelete.id, selectedOccurrenceDate);
      success(`Occurrence du ${new Date(selectedOccurrenceDate).toLocaleDateString("fr-FR")} supprimée`);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      setRecurringDeleteMode("choose");
      setSelectedOccurrenceDate(null);
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  // Générer les occurrences futures d'une séance récurrente
  const generateOccurrences = (session: WorkoutSession, monthsAhead: number = 6): Date[] => {
    if (!session.recurrence_type || !session.scheduled_at) return [];

    const startDate = new Date(session.scheduled_at);
    const dates: Date[] = [];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsAhead);

    // Exceptions de récurrence
    const exceptions = new Set(session.recurrence_exceptions ?? []);

    const dayMapping: Record<string, number> = {
      "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4,
      "friday": 5, "saturday": 6, "sunday": 0,
      "lundi": 1, "mardi": 2, "mercredi": 3, "jeudi": 4,
      "vendredi": 5, "samedi": 6, "dimanche": 0,
    };

    if (session.recurrence_type === "daily") {
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = current.toISOString().split("T")[0];
        if (!exceptions.has(dateStr) && current >= new Date()) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (session.recurrence_type === "weekly") {
      const recurrenceData = session.recurrence_data ?? [];
      if (recurrenceData.length === 0) {
        const current = new Date(startDate);
        while (current <= endDate) {
          const dateStr = current.toISOString().split("T")[0];
          if (!exceptions.has(dateStr) && current >= new Date()) {
            dates.push(new Date(current));
          }
          current.setDate(current.getDate() + 7);
        }
      } else {
        const targetDays = recurrenceData.map(d => dayMapping[String(d).toLowerCase()]).filter(d => d !== undefined);
        const current = new Date(startDate);
        while (current <= endDate) {
          if (targetDays.includes(current.getDay())) {
            const dateStr = current.toISOString().split("T")[0];
            if (!exceptions.has(dateStr) && current >= new Date()) {
              dates.push(new Date(current));
            }
          }
          current.setDate(current.getDate() + 1);
        }
      }
    } else if (session.recurrence_type === "monthly") {
      const recurrenceData = session.recurrence_data ?? [];
      const targetDays = recurrenceData.length > 0 ? recurrenceData.map(d => Number(d)) : [startDate.getDate()];
      const current = new Date(startDate);
      while (current <= endDate) {
        for (const day of targetDays) {
          const testDate = new Date(current.getFullYear(), current.getMonth(), day);
          if (testDate.getDate() === day && testDate <= endDate && testDate >= new Date()) {
            const dateStr = testDate.toISOString().split("T")[0];
            if (!exceptions.has(dateStr)) {
              dates.push(testDate);
            }
          }
        }
        current.setMonth(current.getMonth() + 1);
      }
    }

    return dates.sort((a, b) => a.getTime() - b.getTime());
  };

  // Filtrer les occurrences par mois/année
  const getFilteredOccurrences = () => {
    if (!sessionToDelete) return [];
    const occurrences = generateOccurrences(sessionToDelete, 12);
    return occurrences.filter(d =>
      d.getMonth() === occurrenceSearchMonth &&
      d.getFullYear() === occurrenceSearchYear
    );
  };

  const handleDuplicateClick = (session: WorkoutSession, e: MouseEvent) => {
    e.stopPropagation();
    // Au lieu de créer immédiatement, on redirige vers la page "New" avec l'ID à dupliquer
    // Cela permettra à l'utilisateur d'annuler s'il le souhaite.
    router.push(`/workout/sessions/new?duplicateId=${session.id}`);
  };

  const handleReplanClick = async (session: WorkoutSession, e: MouseEvent) => {
    e.stopPropagation();

    const now = new Date();
    let nextDate: Date | null = null;
    const scheduledTime = session.scheduled_at ? new Date(session.scheduled_at) : now;

    // Calcul de la date (même logique qu'avant mais déplacée au début pour l'optimisme)
    if (session.recurrence_type && session.scheduled_at) {
        if (session.recurrence_type === "daily") {
          nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + 1);
          nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
        } else if (session.recurrence_type === "weekly" && session.recurrence_data && session.recurrence_data.length > 0) {
          const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
          const targetDay = dayNames.indexOf(String(session.recurrence_data[0]).toLowerCase());
          if (targetDay !== -1) {
            const originalDayOfWeek = scheduledTime.getDay();
            nextDate = new Date(scheduledTime);
            if (targetDay === originalDayOfWeek) {
              nextDate.setDate(nextDate.getDate() + 7);
            } else {
              const daysUntilTarget = (targetDay - originalDayOfWeek + 7) % 7 || 7;
              nextDate.setDate(nextDate.getDate() + daysUntilTarget);
            }
            nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
          }
        } else if (session.recurrence_type === "monthly" && session.recurrence_data && session.recurrence_data.length > 0) {
          const dayOfMonth = Number(session.recurrence_data[0]);
          nextDate = new Date(scheduledTime);
          nextDate.setMonth(nextDate.getMonth() + 1);
          const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
          nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
        }
    }

    if (!nextDate) {
        nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    }

    // Mise à jour optimiste
    const optimisticSession: WorkoutSession = {
        ...session,
        id: -Date.now(),
        status: "planifiee",
        scheduled_at: nextDate.toISOString(),
        notes: null,
        created_at: new Date().toISOString()
    };
    
    setSessions(prev => [optimisticSession, ...prev]);
    success("Séance replanifiée (en cours...)");

    try {
      // Récupérer la session complète avec ses exercices
      const full = await workoutApi.sessions.get(session.id);

      // CRÉER UNE NOUVELLE SÉANCE
      await workoutApi.sessions.create({
        name: full.name,
        activity_type: full.activity_type,
        custom_activity_type_id: full.custom_activity_type_id ?? undefined,
        custom_activity_type_ids: full.custom_activity_type_ids ?? [],
        scheduled_at: nextDate!.toISOString(),
        notes: undefined,
        recurrence_type: full.recurrence_type ?? undefined,
        recurrence_data: full.recurrence_data ?? undefined,
        exercises: full.exercises?.map((ex) => {
          const exerciseData: any = {
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

      success("Séance replanifiée avec succès");
      loadData();
    } catch (err) {
      console.error("Erreur lors de la replanification:", err);
      showError(err instanceof Error ? err.message : "Erreur lors de la replanification");
      loadData(); // Rollback
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
      const fakeEvent = { stopPropagation: () => { } } as MouseEvent;
      await handleDuplicateClick(contextMenuSession, fakeEvent);
      setContextMenuSession(null);
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenuSession) {
      setContextMenuOpen(false);
      const fakeEvent = { stopPropagation: () => { } } as MouseEvent;
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

    // Mise à jour optimiste
    const idsToDelete = new Set(selectedSessionIds);
    setSessions((prev) => prev.filter((s) => !idsToDelete.has(s.id)));
    const count = idsToDelete.size;
    success(`${count} séance${count > 1 ? "s" : ""} supprimée${count > 1 ? "s" : ""}`);
    
    setSelectionMode(false);
    setSelectedSessionIds(new Set());

    try {
      const deletePromises = Array.from(idsToDelete).map((id) =>
        workoutApi.sessions.delete(id).catch((err) => {
          console.error(`Erreur lors de la suppression de la séance ${id}:`, err);
          return null;
        })
      );
      await Promise.all(deletePromises);
      loadData(); // Refresh silencieux
    } catch (err) {
      loadData(); // Annuler si erreur
      showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const formatRecurrence = (type: string | null | undefined, data: (string | number)[] | null | undefined): string => {
    if (!type) return "";
    if (type === "daily") return "Tous les jours";
    if (type === "weekly" && data && data.length > 0) {
      const dayNames: Record<string, string> = {
        lundi: "lundi",
        mardi: "mardi",
        mercredi: "mercredi",
        jeudi: "jeudi",
        vendredi: "vendredi",
        samedi: "samedi",
        dimanche: "dimanche",
      };
      const day = dayNames[String(data[0]).toLowerCase()] || String(data[0]);
      return `Tous les ${day}s`;
    }
    if (type === "monthly" && data && data.length > 0) {
      const day = Number(data[0]);
      if (day >= 28) {
        return "Dernier jour du mois";
      }
      return `Le ${day} de chaque mois`;
    }
    return "";
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

      <main className={`container mx-auto px-4 py-6 sm:py-8 max-w-6xl ${selectionMode ? "pb-24" : "pb-32"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        {/* Header */}
        <section className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/workout")}
            className="mb-4 hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour au Dashboard
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
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {selectionMode ? (
                <>
                  {/* Sur PC, afficher tous les boutons dans le header */}
                  <div className="hidden sm:flex gap-2 flex-wrap">
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
                    className="flex-1 sm:w-auto"
                    size="sm"
                  >
                    <Check className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sélectionner</span>
                    <span className="sm:hidden">Sélect.</span>
                  </Button>
                  <Button
                    onClick={() => router.push("/workout/sessions/new")}
                    className="flex-1 sm:w-auto"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
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
                  className={`group transition-all relative p-0 overflow-hidden ${selectionMode
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
                      // Pour les séances récurrentes planifiées, ajouter la date du jour comme occurrence_date
                      if (session.recurrence_type && session.status === "planifiee") {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                        router.push(`/workout/sessions/${session.id}?occurrence_date=${todayStr}`);
                      } else {
                        router.push(`/workout/sessions/${session.id}`);
                      }
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
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${selectedSessionIds.has(session.id)
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
                    <div className="absolute top-2 right-2 z-20 flex gap-1 flex-wrap justify-end max-w-[calc(100%-3rem)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 pb-4 space-y-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {session.recurrence_type ? "Programmé" : "Date"}
                        </span>
                        <span className="text-xs">
                          {session.recurrence_type
                            ? `${formatRecurrence(session.recurrence_type, session.recurrence_data)}, ${formatTime(session.scheduled_at)}`
                            : formatDate(session.scheduled_at || session.created_at)
                          }
                        </span>
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
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setRecurringDeleteMode("choose");
          setSelectedOccurrenceDate(null);
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Supprimer la séance</DialogTitle>
            <DialogDescription>
              {sessionToDelete?.name}
              {sessionToDelete?.recurrence_type && (
                <span className="block mt-1 text-xs">
                  (Séance récurrente : {formatRecurrence(sessionToDelete.recurrence_type, sessionToDelete.recurrence_data)})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Choix initial pour les séances récurrentes */}
          {sessionToDelete?.recurrence_type && recurringDeleteMode === "choose" && (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setRecurringDeleteMode("occurrence")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Une occurrence
              </Button>
              <Button
                variant="destructive"
                className="justify-start"
                onClick={() => setRecurringDeleteMode("all")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Toute la série
              </Button>
            </div>
          )}

          {/* Sélection d'une occurrence à supprimer */}
          {sessionToDelete?.recurrence_type && recurringDeleteMode === "occurrence" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecurringDeleteMode("choose")}
                >
                  ← Retour
                </Button>
              </div>

              {/* Navigation mois/année */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (occurrenceSearchMonth === 0) {
                      setOccurrenceSearchMonth(11);
                      setOccurrenceSearchYear(occurrenceSearchYear - 1);
                    } else {
                      setOccurrenceSearchMonth(occurrenceSearchMonth - 1);
                    }
                  }}
                >
                  ←
                </Button>
                <span className="text-sm font-medium capitalize">
                  {new Date(occurrenceSearchYear, occurrenceSearchMonth).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (occurrenceSearchMonth === 11) {
                      setOccurrenceSearchMonth(0);
                      setOccurrenceSearchYear(occurrenceSearchYear + 1);
                    } else {
                      setOccurrenceSearchMonth(occurrenceSearchMonth + 1);
                    }
                  }}
                >
                  →
                </Button>
              </div>

              {/* Liste des occurrences */}
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {getFilteredOccurrences().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune occurrence ce mois-ci
                  </p>
                ) : (
                  <div className="divide-y">
                    {getFilteredOccurrences().map((date) => {
                      const dateStr = date.toISOString().split("T")[0];
                      return (
                        <button
                          key={dateStr}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between ${selectedOccurrenceDate === dateStr ? "bg-accent" : ""
                            }`}
                          onClick={() => setSelectedOccurrenceDate(dateStr)}
                        >
                          <span className="capitalize">
                            {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                          </span>
                          {selectedOccurrenceDate === dateStr && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteOccurrence}
                  disabled={isDeleting || !selectedOccurrenceDate}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Supprimer cette occurrence
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Confirmation suppression de toute la série */}
          {sessionToDelete?.recurrence_type && recurringDeleteMode === "all" && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecurringDeleteMode("choose")}
              >
                ← Retour
              </Button>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Confirmer
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Séances non-récurrentes : simple confirmation */}
          {!sessionToDelete?.recurrence_type && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Supprimer
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

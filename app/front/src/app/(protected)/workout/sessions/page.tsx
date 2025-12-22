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
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import {
  type WorkoutSession,
  type UserActivityType,
  SessionStatus,
  SESSION_STATUS_LABELS,
} from "@/lib/workout-types";
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
      return <CheckCircle className="h-4 w-4 text-gray-500" />;
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
      const duplicated = await workoutApi.sessions.create({
        name: `${full.name} (copie)`,
        activity_type: full.activity_type,
        custom_activity_type_id: full.custom_activity_type_id ?? undefined,
        custom_activity_type_ids: full.custom_activity_type_ids ?? [],
        scheduled_at: full.scheduled_at ?? undefined,
        notes: full.notes ?? undefined,
        exercises: full.exercises?.map((ex) => ({
          exercise_id: ex.exercise_id,
          order: ex.order,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps ?? undefined,
          target_weight: ex.target_weight ?? undefined,
          target_duration: ex.target_duration ?? undefined,
          target_distance: ex.target_distance ?? undefined,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes ?? undefined,
        })),
      });
      success(`Séance "${full.name}" dupliquée`);
      router.push(`/workout/sessions/${duplicated.id}/edit`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la duplication");
    }
  };

  const handleEditClick = (session: WorkoutSession, e: MouseEvent) => {
    e.stopPropagation();
    router.push(`/workout/sessions/${session.id}/edit`);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl pb-32">
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
                Séances
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gérez vos séances d&apos;entraînement
              </p>
            </div>
            <Button
              onClick={() => router.push("/workout/sessions/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouvelle séance</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
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
                  className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 relative p-0 overflow-hidden"
                  onClick={() => router.push(`/workout/sessions/${session.id}`)}
                >
                  {/* Actions rapides */}
                  <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={(e) => handleDuplicateClick(session, e)}
                      title="Dupliquer"
                    >
                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={(e) => handleEditClick(session, e)}
                      title="Modifier"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={(e) => handleDeleteClick(session, e)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  {/* Image avec logos des activités */}
                  <div className="relative w-full bg-muted overflow-hidden aspect-video">
                    {activities.length > 0 ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 gap-2 p-4">
                        {activities.slice(0, 3).map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-center justify-center bg-background/80 rounded-full p-3 shadow-sm"
                          >
                            <ActivityIcon
                              iconName={getActivityIcon(activity)}
                              className="h-6 w-6 sm:h-8 sm:w-8 text-primary"
                            />
                          </div>
                        ))}
                        {activities.length > 3 && (
                          <div className="flex items-center justify-center bg-background/80 rounded-full p-3 shadow-sm">
                            <span className="text-xs font-semibold text-primary">
                              +{activities.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary/30" />
                      </div>
                    )}
                    {/* Badge de statut en haut à droite */}
                    <div className="absolute top-2 left-2 z-10 bg-background/80 rounded-full px-2 py-1 text-xs flex items-center gap-1">
                      {getStatusIcon(session.status)}
                      <span className="text-muted-foreground">{SESSION_STATUS_LABELS[session.status]}</span>
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

      <Footer />

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

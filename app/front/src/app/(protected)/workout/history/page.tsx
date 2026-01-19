"use client";

/**
 * Page historique des séances.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import type { WorkoutSession, WorkoutSessionExercise } from "@/lib/workout-types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/workout-types";
import {
    Loader2,
    ArrowLeft,
    Calendar,
    Clock,
    Dumbbell,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Star,
    TrendingUp,
    Target,
    Check,
    Minus,
} from "lucide-react";

// Fonction pour obtenir la couleur de progression
const getProgressColor = (percentage: number): string => {
    if (percentage >= 70) return "green";
    if (percentage >= 20) return "orange";
    return "red";
};

const getProgressColorClass = (percentage: number, type: "bg" | "text"): string => {
    const color = getProgressColor(percentage);
    if (type === "bg") {
        return color === "green" ? "bg-green-500" : color === "orange" ? "bg-orange-500" : "bg-red-500";
    }
    return color === "green" ? "text-green-500" : color === "orange" ? "text-orange-500" : "text-red-500";
};

// Regex pour identifier les muscles dans les custom fields
const MUSCLE_PATTERN = /muscle|group/i;

// Extraire les muscles travaillés depuis les field_values d'un exercice
const extractMuscles = (exercise: WorkoutSessionExercise): string | null => {
    if (!exercise.exercise?.field_values) return null;

    for (const fv of exercise.exercise.field_values) {
        if (fv.field?.name && MUSCLE_PATTERN.test(fv.field.name) && fv.value) {
            const value = fv.value;

            // Le value est toujours une string, parser si c'est du JSON
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.join(", ");
                }
                return String(value);
            } catch {
                // Ce n'est pas du JSON, retourner la chaîne telle quelle
                return String(value);
            }
        }
    }
    return null;
};

// Interface unifiée pour l'affichage dans l'historique
interface HistoryItem {
    id: string; // "session_X" ou "occurrence_X"
    type: "session" | "occurrence";
    name: string;
    activity_type: string;
    date: Date;
    duration_seconds: number | null;
    rating: number | null;
    notes: string | null;
    // Données originales pour affichage détaillé
    session?: WorkoutSession;
    occurrence?: {
        id: number;
        session_id: number;
        occurrence_date: string;
        status: string;
        started_at?: string | null;
        ended_at?: string | null;
        duration_seconds?: number | null;
        rating?: number | null;
        notes?: string | null;
        session_name?: string | null;
        activity_type?: string | null;
    };
}

export default function HistoryPage() {
    const router = useRouter();
    const { error: showError } = useToast();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]); // Toutes les sessions (pour calcul)
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]); // Items fusionnés pour affichage
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [expandedSession, setExpandedSession] = useState<string | null>(null);

    const loadSessions = useCallback(async () => {
        try {
            // Charger les séances terminées (non-récurrentes)
            const [completedData, allData, occurrencesData] = await Promise.all([
                workoutApi.sessions.list({
                    status: "terminee",
                    limit: 100,
                }),
                workoutApi.sessions.list({ limit: 100 }),
                workoutApi.occurrences.listHistory({ limit: 100 }),
            ]);

            setSessions(completedData);
            setAllSessions(allData);

            // Créer les items d'historique unifiés
            const items: HistoryItem[] = [];

            // Ajouter les sessions terminées non-récurrentes
            completedData.forEach((session) => {
                // Ne pas inclure les sessions récurrentes car elles sont représentées par leurs occurrences
                if (!session.recurrence_type) {
                    items.push({
                        id: `session_${session.id}`,
                        type: "session",
                        name: session.name,
                        activity_type: session.activity_type,
                        date: new Date(session.ended_at || session.started_at || session.created_at),
                        duration_seconds: session.duration_seconds || null,
                        rating: session.rating || null,
                        notes: session.notes || null,
                        session,
                    });
                }
            });

            // Ajouter les occurrences terminées
            occurrencesData.forEach((occ) => {
                items.push({
                    id: `occurrence_${occ.id}`,
                    type: "occurrence",
                    name: occ.session_name || "Séance",
                    activity_type: occ.activity_type || "autre",
                    date: new Date(occ.occurrence_date),
                    duration_seconds: occ.duration_seconds || null,
                    rating: occ.rating || null,
                    notes: occ.notes || null,
                    occurrence: occ,
                });
            });

            // Trier par date décroissante
            items.sort((a, b) => b.date.getTime() - a.date.getTime());
            setHistoryItems(items);

        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur lors du chargement");
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Générer la liste des mois disponibles (basé sur historyItems)
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        // Ajouter les mois depuis toutes les sessions planifiées
        allSessions.forEach((session) => {
            const date = new Date(session.scheduled_at || session.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            months.add(monthKey);
        });
        // Ajouter les mois des historyItems
        historyItems.forEach((item) => {
            const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
            months.add(monthKey);
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a)); // Plus récent en premier
    }, [allSessions, historyItems]);

    // Filtrer les historyItems par mois sélectionné
    const filteredItems = useMemo(() => {
        if (selectedMonth === "all") return historyItems;
        return historyItems.filter((item) => {
            const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
            return monthKey === selectedMonth;
        });
    }, [historyItems, selectedMonth]);

    // Grouper les items par mois
    const itemsByMonth = useMemo(() => {
        const grouped: Record<string, HistoryItem[]> = {};
        filteredItems.forEach((item) => {
            const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(item);
        });
        return grouped;
    }, [filteredItems]);

    // Garder filteredSessions pour compatibilité avec l'affichage existant
    const filteredSessions = useMemo(() => {
        return historyItems
            .filter(item => item.session) // Seulement les sessions (pas les occurrences pures)
            .map(item => item.session!);
    }, [historyItems]);

    // Garder sortedSessions pour compatibilité avec l'affichage existant
    const sortedSessions = useMemo(() => {
        // Créer un tableau fusionné avec les sessions ET les occurrences
        // On retourne les sessions des historyItems pour garder l'affichage compatible
        return historyItems
            .filter(item => {
                if (selectedMonth === "all") return true;
                const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
                return monthKey === selectedMonth;
            })
            .filter(item => item.session) // Pour l'instant on filtre les pure occurrences
            .map(item => item.session!);
    }, [historyItems, selectedMonth]);

    // Calculer les statistiques de progression pour le mois sélectionné
    // Maintenant inclut les occurrences pour un comptage précis des séances récurrentes
    const monthStats = useMemo(() => {
        const targetMonth = selectedMonth === "all" ? null : selectedMonth;

        // Compter les items terminés (sessions + occurrences)
        let completedCount = 0;
        historyItems.forEach((item) => {
            if (targetMonth) {
                const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
                if (monthKey === targetMonth) {
                    completedCount++;
                }
            } else {
                completedCount++;
            }
        });

        // Compter TOUTES les séances planifiées pour ce mois
        const sessionsToCount = allSessions.length > 0 ? allSessions : sessions;
        let plannedCount = 0;
        sessionsToCount.forEach((session) => {
            const sessionDate = new Date(session.scheduled_at || session.created_at);

            if (targetMonth) {
                const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}`;
                if (monthKey === targetMonth) {
                    plannedCount++;
                }
            } else {
                plannedCount++;
            }
        });

        // S'assurer qu'on a au moins autant de planifiées que de terminées
        plannedCount = Math.max(plannedCount, completedCount);

        // Calculer le pourcentage
        const percentage = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0;

        return { completed: completedCount, planned: plannedCount, percentage };
    }, [historyItems, sessions, allSessions, selectedMonth]);

    // Grouper par mois (pour l'affichage existant)
    const sessionsByMonth = useMemo(() => {
        const grouped: Record<string, WorkoutSession[]> = {};
        sortedSessions.forEach((session) => {
            const date = new Date(session.ended_at || session.started_at || session.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(session);
        });
        return grouped;
    }, [sortedSessions]);

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "-";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes} min`;
    };

    const formatMonthLabel = (monthKey: string) => {
        const [year, month] = monthKey.split("-");
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
        });
    };

    // Calculer la progression d'un exercice dans la session
    const getExerciseProgress = (exercise: WorkoutSessionExercise) => {
        const totalSets = exercise.sets?.length || exercise.target_sets || 0;
        const completedSets = exercise.sets?.filter((s) => s.is_completed).length || 0;
        const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
        return { completed: completedSets, total: totalSets, percentage };
    };

    // Calculer la progression globale d'une session
    const getSessionProgress = (session: WorkoutSession) => {
        if (!session.exercises || session.exercises.length === 0) {
            return { completed: 0, total: 0, percentage: 0 };
        }

        let totalSets = 0;
        let completedSets = 0;

        session.exercises.forEach((ex) => {
            const exProgress = getExerciseProgress(ex);
            totalSets += exProgress.total;
            completedSets += exProgress.completed;
        });

        const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
        return { completed: completedSets, total: totalSets, percentage };
    };

    const progressColor = getProgressColor(monthStats.percentage);

    return (
        <div className="min-h-screen overflow-hidden flex flex-col">
            <BackgroundDecorations />
            <Header variant="sticky" />

            <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
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
                                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                                Historique des séances
                            </h1>
                        </div>

                        {/* Filtre par mois */}
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filtrer par mois" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les mois</SelectItem>
                                {availableMonths.map((monthKey) => (
                                    <SelectItem key={monthKey} value={monthKey}>
                                        {formatMonthLabel(monthKey)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </section>

                {/* Statistiques de progression */}
                {!isLoading && (
                    <section className="mb-6">
                        <Card className={`border-${progressColor === "green" ? "green" : progressColor === "orange" ? "orange" : "red"}-500/20`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-full p-3 ${progressColor === "green" ? "bg-green-500/20" : progressColor === "orange" ? "bg-orange-500/20" : "bg-red-500/20"}`}>
                                            <TrendingUp className={`h-6 w-6 ${getProgressColorClass(monthStats.percentage, "text")}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Progression
                                                {selectedMonth !== "all" && (
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        ({formatMonthLabel(selectedMonth)})
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {monthStats.completed} séance{monthStats.completed > 1 ? "s" : ""} terminée
                                                {monthStats.completed > 1 ? "s" : ""} sur {monthStats.planned} planifiée
                                                {monthStats.planned > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-3xl font-bold ${getProgressColorClass(monthStats.percentage, "text")}`}>
                                            {monthStats.percentage}%
                                        </span>
                                    </div>
                                </div>
                                {/* Barre de progression */}
                                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${getProgressColorClass(monthStats.percentage, "bg")}`}
                                        style={{ width: `${monthStats.percentage}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Contenu */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : sortedSessions.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {selectedMonth === "all"
                                    ? "Aucune séance terminée"
                                    : `Aucune séance terminée en ${formatMonthLabel(selectedMonth)}`}
                            </p>
                            {selectedMonth === "all" && (
                                <Button className="mt-4" onClick={() => router.push("/workout")}>
                                    Commencer une séance
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(sessionsByMonth).map(([monthKey, monthSessions]) => (
                            <section key={monthKey}>
                                <h2 className="text-lg font-semibold mb-4 capitalize">
                                    {formatMonthLabel(monthKey)}
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({monthSessions.length} séance{monthSessions.length > 1 ? "s" : ""})
                                    </span>
                                </h2>
                                <div className="space-y-3">
                                    {monthSessions.map((session) => {
                                        const sessionKey = `session_${session.id}`;
                                        const isExpanded = expandedSession === sessionKey;
                                        const sessionProgress = getSessionProgress(session);

                                        return (
                                            <Card
                                                key={session.id}
                                                className="transition-all hover:shadow-lg"
                                            >
                                                <CardContent className="p-4">
                                                    <div
                                                        className="flex items-center justify-between cursor-pointer"
                                                        onClick={() =>
                                                            setExpandedSession(isExpanded ? null : sessionKey)
                                                        }
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`rounded-full p-3 ${sessionProgress.percentage >= 70
                                                                ? "bg-green-500/10"
                                                                : sessionProgress.percentage >= 20
                                                                    ? "bg-orange-500/10"
                                                                    : "bg-red-500/10"
                                                                }`}>
                                                                <CheckCircle className={`h-5 w-5 ${getProgressColorClass(sessionProgress.percentage, "text")}`} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">{session.name}</h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {ACTIVITY_TYPE_LABELS[session.activity_type]}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {new Date(
                                                                            session.ended_at ||
                                                                            session.started_at ||
                                                                            session.created_at
                                                                        ).toLocaleDateString("fr-FR", {
                                                                            day: "numeric",
                                                                            month: "short",
                                                                        })}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {formatDuration(session.duration_seconds)}
                                                                    </span>
                                                                    <span className={`flex items-center gap-1 ${getProgressColorClass(sessionProgress.percentage, "text")}`}>
                                                                        <Target className="h-3 w-3" />
                                                                        {sessionProgress.completed}/{sessionProgress.total} séries
                                                                        ({sessionProgress.percentage}%)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {session.rating && (
                                                                <div className="flex items-center gap-1">
                                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                                    <span className="text-sm">{session.rating}/5</span>
                                                                </div>
                                                            )}
                                                            <Button variant="ghost" size="sm">
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Notes de la session */}
                                                    {session.notes && (
                                                        <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                                                            {session.notes}
                                                        </p>
                                                    )}

                                                    {/* Détails des exercices (déplié) */}
                                                    {isExpanded && session.exercises && session.exercises.length > 0 && (
                                                        <div className="mt-4 border-t pt-4 space-y-3">
                                                            <h4 className="text-sm font-semibold text-muted-foreground">
                                                                Exercices réalisés
                                                            </h4>
                                                            {session.exercises.map((exercise) => {
                                                                const exProgress = getExerciseProgress(exercise);
                                                                const exerciseName =
                                                                    exercise.exercise?.name || `Exercice ${exercise.exercise_id}`;
                                                                const muscles = extractMuscles(exercise);

                                                                return (
                                                                    <div
                                                                        key={exercise.id}
                                                                        className="bg-muted/30 rounded-lg p-3"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <h5 className="font-medium text-sm">
                                                                                    {exerciseName}
                                                                                </h5>
                                                                                {/* Muscles travaillés */}
                                                                                {muscles && (
                                                                                    <p className="text-xs text-primary/70">
                                                                                        {muscles}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Indicateur de progression */}
                                                                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className={`h-full transition-all duration-300 ${getProgressColorClass(exProgress.percentage, "bg")}`}
                                                                                        style={{ width: `${exProgress.percentage}%` }}
                                                                                    />
                                                                                </div>
                                                                                <span
                                                                                    className={`text-sm font-medium ${getProgressColorClass(exProgress.percentage, "text")}`}
                                                                                >
                                                                                    {exProgress.percentage}%
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Détails des séries */}
                                                                        {exercise.sets && exercise.sets.length > 0 && (
                                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                                {exercise.sets.map((set) => (
                                                                                    <span
                                                                                        key={set.id}
                                                                                        className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${set.is_completed
                                                                                            ? "bg-green-500/20 text-green-600"
                                                                                            : "bg-muted text-muted-foreground/50"
                                                                                            }`}
                                                                                    >
                                                                                        {set.weight && `${set.weight}kg`}
                                                                                        {set.weight && set.reps && " × "}
                                                                                        {set.reps && `${set.reps}`}
                                                                                        {!set.weight && !set.reps && "-"}
                                                                                        {set.is_completed ? (
                                                                                            <Check className="h-3 w-3" />
                                                                                        ) : (
                                                                                            <Minus className="h-3 w-3" />
                                                                                        )}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Notes de l'exercice */}
                                                                        {exercise.notes && (
                                                                            <p className="mt-2 text-xs text-muted-foreground italic">
                                                                                {exercise.notes}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
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

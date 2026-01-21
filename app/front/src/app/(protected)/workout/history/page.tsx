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

// Générer toutes les dates d'une récurrence (pour le calcul de stats)
const generateRecurringDatesForStats = (
    startDate: Date,
    recurrenceType: string | null,
    recurrenceData: (number | string)[] | null,
    recurrenceEndDate: string | null | undefined,
    filterMonth?: string // Format: "YYYY-MM" ou null pour tous les mois
): string[] => {
    if (!recurrenceType) {
        // Pas de récurrence, juste la date de départ
        const key = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
        if (!filterMonth) return [key];
        const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
        return monthKey === filterMonth ? [key] : [];
    }

    const dates: string[] = [];
    let endDate: Date;

    if (recurrenceEndDate) {
        const dateOnly = recurrenceEndDate.split("T")[0];
        endDate = new Date(dateOnly + "T23:59:59");
    } else {
        // Fallback: 3 mois
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
    }

    const dayMapping: Record<string, number> = {
        "monday": 1, "lundi": 1,
        "tuesday": 2, "mardi": 2,
        "wednesday": 3, "mercredi": 3,
        "thursday": 4, "jeudi": 4,
        "friday": 5, "vendredi": 5,
        "saturday": 6, "samedi": 6,
        "sunday": 0, "dimanche": 0,
    };

    if (recurrenceType === "daily") {
        const current = new Date(startDate);
        while (current <= endDate) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, "0");
            const d = String(current.getDate()).padStart(2, "0");
            const isoDay = `${y}-${m}-${d}`;
            const monthKey = `${y}-${m}`;

            if (!filterMonth || monthKey === filterMonth) {
                dates.push(isoDay);
            }
            current.setDate(current.getDate() + 1);
        }
    } else if (recurrenceType === "weekly" && recurrenceData) {
        const targetDays = recurrenceData.map(day => {
            if (typeof day === "number") return day;
            return dayMapping[day.toLowerCase()] ?? -1;
        }).filter(d => d !== -1);

        const current = new Date(startDate);
        while (current <= endDate) {
            if (targetDays.includes(current.getDay())) {
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, "0");
                const d = String(current.getDate()).padStart(2, "0");
                const isoDay = `${y}-${m}-${d}`;
                const monthKey = `${y}-${m}`;

                if (!filterMonth || monthKey === filterMonth) {
                    dates.push(isoDay);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    } else if (recurrenceType === "monthly" && recurrenceData) {
        const targetDays = recurrenceData
            .filter((d): d is number => typeof d === "number")
            .filter(d => d >= 1 && d <= 31);

        const current = new Date(startDate);
        current.setDate(1);
        while (current <= endDate) {
            for (const targetDay of targetDays) {
                const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
                const dayToUse = Math.min(targetDay, lastDayOfMonth);
                const testDate = new Date(current.getFullYear(), current.getMonth(), dayToUse);
                if (testDate >= startDate && testDate <= endDate) {
                    const y = testDate.getFullYear();
                    const m = String(testDate.getMonth() + 1).padStart(2, "0");
                    const d = String(testDate.getDate()).padStart(2, "0");
                    const isoDay = `${y}-${m}-${d}`;
                    const monthKey = `${y}-${m}`;

                    if (!filterMonth || monthKey === filterMonth) {
                        dates.push(isoDay);
                    }
                }
            }
            current.setMonth(current.getMonth() + 1);
        }
    } else {
        // Fallback: juste la date de départ
        const key = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
        if (!filterMonth) return [key];
        const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
        return monthKey === filterMonth ? [key] : [];
    }

    return dates;
};

export default function HistoryPage() {
    const router = useRouter();
    const { error: showError } = useToast();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]); // Toutes les sessions (pour calcul)
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [expandedSession, setExpandedSession] = useState<number | null>(null);

    const loadSessions = useCallback(async () => {
        try {
            // Charger l'historique des séances terminées (inclut les occurrences)
            const completedData = await workoutApi.sessions.getHistory();
            setSessions(completedData);

            // Charger toutes les séances parentes pour calculer les stats
            const allData = await workoutApi.sessions.list({ limit: 100 });
            setAllSessions(allData);
        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur lors du chargement");
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Générer la liste des mois disponibles (basé sur les sessions terminées ET les occurrences planifiées)
    const availableMonths = useMemo(() => {
        const months = new Set<string>();

        // Ajouter les mois des sessions terminées
        sessions.forEach((session) => {
            const date = new Date(session.ended_at || session.started_at || session.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            months.add(monthKey);
        });

        // Ajouter les mois des occurrences virtuelles (récurrences)
        allSessions.forEach((session) => {
            // Ignorer les sessions enfants
            if (session.parent_session_id) return;

            const sessionDate = session.scheduled_at
                ? new Date(session.scheduled_at)
                : new Date(session.created_at);

            // Parser recurrence_data si c'est une string
            let parsedRecurrenceData: (number | string)[] | null = null;
            if (session.recurrence_data) {
                if (typeof session.recurrence_data === "string") {
                    try {
                        parsedRecurrenceData = JSON.parse(session.recurrence_data);
                    } catch {
                        parsedRecurrenceData = null;
                    }
                } else if (Array.isArray(session.recurrence_data)) {
                    parsedRecurrenceData = session.recurrence_data;
                }
            }

            // Générer toutes les dates pour cette session (sans filtre de mois)
            const occurrenceDates = generateRecurringDatesForStats(
                sessionDate,
                session.recurrence_type ?? null,
                parsedRecurrenceData,
                session.recurrence_end_date,
                undefined // Pas de filtre de mois
            );

            // Ajouter chaque mois unique
            occurrenceDates.forEach((date) => {
                const monthKey = date.substring(0, 7); // "YYYY-MM"
                months.add(monthKey);
            });
        });

        return Array.from(months).sort((a, b) => a.localeCompare(b)); // Ordre chronologique (plus ancien en premier)
    }, [sessions, allSessions]);

    // Filtrer par mois sélectionné
    const filteredSessions = useMemo(() => {
        if (selectedMonth === "all") return sessions;
        return sessions.filter((session) => {
            const date = new Date(session.ended_at || session.started_at || session.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            return monthKey === selectedMonth;
        });
    }, [sessions, selectedMonth]);

    // Trier par date décroissante
    const sortedSessions = useMemo(() => {
        return [...filteredSessions].sort(
            (a, b) =>
                new Date(b.ended_at || b.started_at || b.created_at).getTime() -
                new Date(a.ended_at || a.started_at || a.created_at).getTime()
        );
    }, [filteredSessions]);

    // Calculer les statistiques de progression pour le mois sélectionné
    const monthStats = useMemo(() => {
        const targetMonth = selectedMonth === "all" ? null : selectedMonth;

        // Collecter les dates d'occurrences enfants existantes par parent
        const childOccurrenceDatesByParent = new Map<number, Set<string>>();
        const childOccurrenceDates = new Set<string>(); // Toutes les dates avec enfants

        allSessions.forEach((session) => {
            if (session.parent_session_id && session.occurrence_date) {
                const parentId = session.parent_session_id;
                if (!childOccurrenceDatesByParent.has(parentId)) {
                    childOccurrenceDatesByParent.set(parentId, new Set());
                }
                childOccurrenceDatesByParent.get(parentId)!.add(session.occurrence_date);
                childOccurrenceDates.add(session.occurrence_date);
            }
        });

        // Compter les séances terminées pour ce mois/période
        let completedCount = 0;
        sessions.forEach((session) => {
            if (targetMonth) {
                const sessionDate = new Date(session.ended_at || session.started_at || session.created_at);
                const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}`;
                if (monthKey === targetMonth) {
                    completedCount++;
                }
            } else {
                // Tous les mois - compter toutes les séances terminées
                completedCount++;
            }
        });

        // Compter TOUTES les occurrences planifiées (incluant les récurrences virtuelles)
        const allPlannedDates = new Set<string>();

        allSessions.forEach((session) => {
            // Ignorer les sessions enfants (elles seront comptées via leur parent ou comme terminées)
            if (session.parent_session_id) return;

            const sessionDate = session.scheduled_at
                ? new Date(session.scheduled_at)
                : new Date(session.created_at);

            // Parser recurrence_data si c'est une string
            let parsedRecurrenceData: (number | string)[] | null = null;
            if (session.recurrence_data) {
                if (typeof session.recurrence_data === "string") {
                    try {
                        parsedRecurrenceData = JSON.parse(session.recurrence_data);
                    } catch {
                        parsedRecurrenceData = null;
                    }
                } else if (Array.isArray(session.recurrence_data)) {
                    parsedRecurrenceData = session.recurrence_data;
                }
            }

            // Générer toutes les dates pour cette session
            const occurrenceDates = generateRecurringDatesForStats(
                sessionDate,
                session.recurrence_type ?? null,
                parsedRecurrenceData,
                session.recurrence_end_date,
                targetMonth ?? undefined
            );

            // Dates d'enfants existants pour ce parent
            const childDates = childOccurrenceDatesByParent.get(session.id) ?? new Set<string>();

            // Ajouter les dates qui n'ont pas déjà un enfant
            occurrenceDates.forEach((date) => {
                if (!childDates.has(date)) {
                    allPlannedDates.add(date);
                }
            });
        });

        // Ajouter les enfants complétés comme "planifiés" aussi
        sessions.forEach((session) => {
            if (session.occurrence_date) {
                if (!targetMonth) {
                    allPlannedDates.add(session.occurrence_date);
                } else {
                    const monthKey = session.occurrence_date.substring(0, 7);
                    if (monthKey === targetMonth) {
                        allPlannedDates.add(session.occurrence_date);
                    }
                }
            }
        });

        const plannedCount = Math.max(allPlannedDates.size, completedCount);

        // Calculer le pourcentage
        const percentage = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0;

        return { completed: completedCount, planned: plannedCount, percentage };
    }, [sessions, allSessions, selectedMonth]);

    // Grouper par mois
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
                                <SelectItem value="all" className="font-semibold">Tous les mois</SelectItem>
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
                                        const isExpanded = expandedSession === session.id;
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
                                                            setExpandedSession(isExpanded ? null : session.id)
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

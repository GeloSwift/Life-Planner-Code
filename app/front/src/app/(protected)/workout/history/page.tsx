"use client";

/**
 * Page historique des séances.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import type { WorkoutSession } from "@/lib/workout-types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/workout-types";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle,
  XCircle,
  Play,
  Star,
} from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const { error: showError } = useToast();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const data = await workoutApi.sessions.list({
        status: "terminee",
        limit: 50,
      });
      setSessions(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Trier par date décroissante
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.ended_at || b.started_at || b.created_at).getTime() - 
              new Date(a.ended_at || a.started_at || a.created_at).getTime()
  );

  // Grouper par mois
  const sessionsByMonth: Record<string, WorkoutSession[]> = {};
  sortedSessions.forEach((session) => {
    const date = new Date(session.ended_at || session.started_at || session.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!sessionsByMonth[monthKey]) {
      sessionsByMonth[monthKey] = [];
    }
    sessionsByMonth[monthKey].push(session);
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "terminee":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "annulee":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "en_cours":
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-orange-500" />;
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

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              Historique des séances
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sessions.length} séance{sessions.length > 1 ? "s" : ""} terminée
              {sessions.length > 1 ? "s" : ""}
            </p>
          </div>
        </section>

        {/* Contenu */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucune séance terminée</p>
              <Button className="mt-4" onClick={() => router.push("/workout")}>
                Commencer une séance
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(sessionsByMonth).map(([monthKey, monthSessions]) => {
              const [year, month] = monthKey.split("-");
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              });

              return (
                <section key={monthKey}>
                  <h2 className="text-lg font-semibold mb-4 capitalize">{monthName}</h2>
                  <div className="space-y-3">
                    {monthSessions.map((session) => (
                      <Card
                        key={session.id}
                        className="cursor-pointer transition-all hover:shadow-lg"
                        onClick={() => router.push(`/workout/sessions/${session.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="rounded-full bg-primary/10 p-3">
                                <Dumbbell className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{session.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {ACTIVITY_TYPE_LABELS[session.activity_type]}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(session.ended_at || session.started_at || session.created_at).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(session.duration_seconds)}
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
                              {getStatusIcon(session.status)}
                            </div>
                          </div>
                          {session.notes && (
                            <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                              {session.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

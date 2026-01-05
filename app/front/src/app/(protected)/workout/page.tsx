"use client";

/**
 * Page principale du Workout Planner.
 * 
 * Dashboard avec :
 * - Actions rapides
 * - Stats de la semaine
 * - Calendrier des séances
 * - Objectifs actifs
 * - Évolution du poids
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActions } from "@/components/workout/quick-actions";
import { WeightChart } from "@/components/workout/weight-chart";
import { GoalsProgress } from "@/components/workout/goals-progress";
import { SessionCalendar } from "@/components/workout/session-calendar";
import { ActiveSession } from "@/components/workout/active-session";
import { workoutApi } from "@/lib/workout-api";
import { googleCalendarApi } from "@/lib/api";
import type { DashboardResponse } from "@/lib/workout-types";
import { useToast } from "@/components/ui/toast";
import {
  Loader2,
  Dumbbell,
  Target,
  Flame,
  Timer,
  TrendingUp,
  Calendar,
  ArrowRight,
  RefreshCw,
  CalendarSync,
  Link2,
} from "lucide-react";

export default function WorkoutPage() {
  const router = useRouter();
  const { success, error: showError, info } = useToast();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Google Calendar
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const data = await workoutApi.stats.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger le statut Google Calendar
  const loadCalendarStatus = useCallback(async () => {
    try {
      const status = await googleCalendarApi.getStatus();
      setCalendarConnected(status.connected);
    } catch {
      setCalendarConnected(false);
    }
  }, []);

  // Synchroniser avec Google Calendar
  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const result = await googleCalendarApi.syncAll();
      if (result.synced > 0) {
        success(`${result.synced} séance(s) synchronisée(s) avec Google Calendar`);
      } else {
        info("Toutes les séances sont déjà synchronisées");
      }
    } catch (err) {
      showError("Erreur lors de la synchronisation");
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Connecter Google Calendar
  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    try {
      const { auth_url } = await googleCalendarApi.connect();
      window.location.href = auth_url;
    } catch (err) {
      showError("Erreur lors de la connexion à Google Calendar");
      setIsConnecting(false);
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadCalendarStatus();
  }, [loadDashboard, loadCalendarStatus]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = dashboard?.stats;

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                Workout Planner
              </h1>
              <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                Planifiez et suivez vos entraînements
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboard()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </section>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Séance active */}
        {dashboard?.active_session && (
          <section className="mb-6 sm:mb-8">
            <ActiveSession
              session={dashboard.active_session}
              onUpdate={loadDashboard}
            />
          </section>
        )}

        {/* Actions rapides */}
        <section className="mb-6 sm:mb-8">
          <QuickActions onActionComplete={loadDashboard} />
        </section>

        {/* Stats de la semaine */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Cette semaine</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-red-500/10 p-2 sm:p-3 flex-shrink-0">
                  <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Séances</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats?.sessions_this_week ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-orange-500/10 p-2 sm:p-3 flex-shrink-0">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Série</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats?.current_streak ?? 0} j
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-blue-500/10 p-2 sm:p-3 flex-shrink-0">
                  <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Durée moy.</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats?.average_session_duration ?? 0} min
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-green-500/10 p-2 sm:p-3 flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Total kg</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats?.total_weight_lifted
                      ? (stats.total_weight_lifted / 1000).toFixed(1) + "k"
                      : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Grille principale */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Calendrier */}
          <section>
            <Card className="h-full overflow-hidden">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Planning
                  </CardTitle>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Bouton sync Google Calendar */}
                    {calendarConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 sm:h-9 px-2 sm:px-3"
                        onClick={handleSyncCalendar}
                        disabled={isSyncing}
                        title="Synchroniser avec Google Calendar"
                      >
                        {isSyncing ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <CalendarSync className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="hidden sm:inline ml-1">Sync</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 sm:h-9 px-2 sm:px-3"
                        onClick={handleConnectCalendar}
                        disabled={isConnecting}
                        title="Connecter Google Calendar"
                      >
                        {isConnecting ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="hidden sm:inline ml-1">Google Cal</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                      onClick={() => router.push("/workout/sessions")}
                    >
                      Voir tout
                      <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">Vos séances du mois</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                <SessionCalendar
                  sessions={[
                    ...(dashboard?.recent_sessions ?? []),
                    ...(dashboard?.upcoming_sessions ?? []),
                  ]}
                />
              </CardContent>
            </Card>
          </section>

          {/* Objectifs + Évolution du poids */}
          <section className="space-y-4 sm:space-y-6">
            {/* Objectifs */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    Objectifs
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                    onClick={() => router.push("/workout/goals")}
                  >
                    Gérer
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <CardDescription className="text-xs sm:text-sm">Vos objectifs en cours</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <GoalsProgress goals={dashboard?.active_goals ?? []} />
              </CardContent>
            </Card>

            {/* Évolution du poids */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    Évolution
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                    onClick={() => router.push("/workout/weight")}
                  >
                    Voir
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  {dashboard?.latest_weight
                    ? `Dernier : ${dashboard.latest_weight.weight} kg`
                    : "Aucune pesée"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                <WeightChart latestWeight={dashboard?.latest_weight} />
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Liens rapides */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Explorer</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={() => router.push("/workout/exercises")}
            >
              <CardHeader>
                <div className="mb-2 w-fit rounded-lg p-2 bg-red-500/10">
                  <Dumbbell className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-lg">Exercices</CardTitle>
                <CardDescription>
                  Parcourez la liste des exercices par muscle
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={() => router.push("/workout/sessions")}
            >
              <CardHeader>
                <div className="mb-2 w-fit rounded-lg p-2 bg-purple-500/10">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-lg">Séances</CardTitle>
                <CardDescription>
                  Consultez et gérez vos séances d&apos;entraînement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={() => router.push("/workout/history")}
            >
              <CardHeader>
                <div className="mb-2 w-fit rounded-lg p-2 bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-lg">Historique</CardTitle>
                <CardDescription>
                  Consultez vos séances passées
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

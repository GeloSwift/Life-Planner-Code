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
import type { DashboardResponse } from "@/lib/workout-types";
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
} from "lucide-react";

export default function WorkoutPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendrier */}
          <section>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Planning
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/workout/calendar")}
                  >
                    Voir tout
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Vos séances du mois</CardDescription>
              </CardHeader>
              <CardContent>
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
          <section className="space-y-6">
            {/* Objectifs */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Objectifs
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/workout/goals")}
                  >
                    Gérer
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Vos objectifs en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <GoalsProgress goals={dashboard?.active_goals ?? []} />
              </CardContent>
            </Card>

            {/* Évolution du poids */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Évolution du poids
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/workout/weight")}
                  >
                    Historique
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {dashboard?.latest_weight
                    ? `Dernier poids : ${dashboard.latest_weight.weight} kg`
                    : "Aucune pesée enregistrée"}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              onClick={() => router.push("/workout/templates")}
            >
              <CardHeader>
                <div className="mb-2 w-fit rounded-lg p-2 bg-purple-500/10">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-lg">Programmes</CardTitle>
                <CardDescription>
                  Créez et gérez vos modèles de séances
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

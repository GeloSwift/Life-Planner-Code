"use client";

/**
 * Composant affichant la séance active en cours.
 * 
 * Affiche un timer, les exercices, et permet de compléter la séance.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { workoutApi } from "@/lib/workout-api";
import type { WorkoutSession } from "@/lib/workout-types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/workout-types";
import { useToast } from "@/components/ui/toast";
import {
  Play,
  Square,
  Timer,
  ArrowRight,
  Loader2,
  Dumbbell,
} from "lucide-react";

interface ActiveSessionProps {
  session: WorkoutSession;
  onUpdate?: () => void;
}

export function ActiveSession({ session, onUpdate }: ActiveSessionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculer le temps écoulé
  useEffect(() => {
    if (!session.started_at) return;

    const startTime = new Date(session.started_at).getTime();

    const updateTime = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [session.started_at]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await workoutApi.sessions.complete(session.id);
      toast({
        title: "Séance terminée ! 🎉",
        description: `${session.name} - ${formatTime(elapsedTime)}`,
      });
      onUpdate?.();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Erreur lors de la complétion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette séance ?")) return;

    setIsLoading(true);
    try {
      await workoutApi.sessions.cancel(session.id);
      toast({
        title: "Séance annulée",
        description: session.name,
      });
      onUpdate?.();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Erreur lors de l'annulation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Infos de la séance */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-primary/20 p-3 animate-pulse">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  Séance en cours
                </span>
              </div>
              <h3 className="font-semibold text-lg truncate">{session.name}</h3>
              <p className="text-sm text-muted-foreground">
                {ACTIVITY_TYPE_LABELS[session.activity_type]}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2">
              <Timer className="h-5 w-5 text-primary" />
              <span className="font-mono text-2xl font-bold tabular-nums">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/workout/sessions/${session.id}`)}
            >
              <Play className="h-4 w-4 mr-2" />
              Continuer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Terminer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bouton annuler discret */}
        <div className="mt-3 pt-3 border-t border-primary/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Annuler la séance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

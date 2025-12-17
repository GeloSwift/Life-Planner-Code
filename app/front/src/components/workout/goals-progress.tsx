"use client";

/**
 * Composant affichant la progression des objectifs.
 */

import { useRouter } from "next/navigation";
import type { Goal } from "@/lib/workout-types";
import { GOAL_TYPE_LABELS } from "@/lib/workout-types";
import { Target, Trophy, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoalsProgressProps {
  goals: Goal[];
}

export function GoalsProgress({ goals }: GoalsProgressProps) {
  const router = useRouter();

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Target className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm text-center">Aucun objectif actif</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/workout/goals/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un objectif
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.slice(0, 4).map((goal) => {
        const progress = Math.min(
          100,
          Math.max(0, (goal.current_value / goal.target_value) * 100)
        );
        const isAchieved = goal.is_achieved;

        return (
          <div
            key={goal.id}
            className="group cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent/50"
            onClick={() => router.push(`/workout/goals/${goal.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isAchieved ? (
                  <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <span className="font-medium text-sm truncate">{goal.name}</span>
              </div>
              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                {GOAL_TYPE_LABELS[goal.goal_type]}
              </span>
            </div>

            {/* Barre de progression */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all duration-500 ${
                  isAchieved
                    ? "bg-yellow-500"
                    : progress >= 75
                    ? "bg-green-500"
                    : progress >= 50
                    ? "bg-blue-500"
                    : "bg-primary"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Valeurs */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-muted-foreground">
                {goal.current_value} {goal.unit}
              </span>
              <span className="font-medium">
                {goal.target_value} {goal.unit}
              </span>
            </div>

            {/* Deadline si présente */}
            {goal.deadline && !isAchieved && (
              <div className="mt-2 text-xs text-muted-foreground">
                Échéance :{" "}
                {new Date(goal.deadline).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        );
      })}

      {goals.length > 4 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => router.push("/workout/goals")}
        >
          Voir les {goals.length - 4} autres objectifs
        </Button>
      )}
    </div>
  );
}

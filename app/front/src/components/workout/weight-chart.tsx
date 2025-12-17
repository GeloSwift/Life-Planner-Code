"use client";

/**
 * Composant graphique d'évolution du poids.
 * 
 * Affiche une courbe de l'évolution du poids sur les derniers mois.
 */

import { useEffect, useState } from "react";
import { workoutApi } from "@/lib/workout-api";
import type { WeightEntry } from "@/lib/workout-types";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeightChartProps {
  latestWeight?: WeightEntry | null;
}

export function WeightChart({ latestWeight }: WeightChartProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        // Charger les 30 derniers jours
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 90);
        
        const data = await workoutApi.weight.list({
          from_date: fromDate.toISOString().split("T")[0],
          limit: 100,
        });
        setEntries(data);
      } catch {
        // Silencieux si pas de données
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [latestWeight]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <p className="text-sm">Aucune donnée de poids</p>
        <p className="text-xs mt-1">
          Utilisez les actions rapides pour enregistrer votre poids
        </p>
      </div>
    );
  }

  // Calculer les stats
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  const minWeight = Math.min(...sortedEntries.map((e) => e.weight));
  const maxWeight = Math.max(...sortedEntries.map((e) => e.weight));
  const weightRange = maxWeight - minWeight || 1;

  // Calculer la tendance
  const firstWeight = sortedEntries[0]?.weight ?? 0;
  const lastWeight = sortedEntries[sortedEntries.length - 1]?.weight ?? 0;
  const trend = lastWeight - firstWeight;

  const TrendIcon = trend > 0.5 ? TrendingUp : trend < -0.5 ? TrendingDown : Minus;
  const trendColor = trend > 0.5 ? "text-red-500" : trend < -0.5 ? "text-green-500" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          <span className={trendColor}>
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)} kg sur 90j
          </span>
        </div>
        <div className="text-muted-foreground">
          Min: {minWeight.toFixed(1)} kg | Max: {maxWeight.toFixed(1)} kg
        </div>
      </div>

      {/* Graphique simple SVG */}
      <div className="relative h-40 w-full">
        <svg
          viewBox={`0 0 ${sortedEntries.length * 20} 100`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grille de fond */}
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Zone remplie */}
          <path
            d={`
              M 0 ${100 - ((sortedEntries[0].weight - minWeight) / weightRange) * 80 - 10}
              ${sortedEntries
                .map(
                  (entry, i) =>
                    `L ${i * 20 + 10} ${100 - ((entry.weight - minWeight) / weightRange) * 80 - 10}`
                )
                .join(" ")}
              L ${(sortedEntries.length - 1) * 20 + 10} 100
              L 0 100
              Z
            `}
            fill="url(#weightGradient)"
          />

          {/* Ligne */}
          <path
            d={`
              M 10 ${100 - ((sortedEntries[0].weight - minWeight) / weightRange) * 80 - 10}
              ${sortedEntries
                .map(
                  (entry, i) =>
                    `L ${i * 20 + 10} ${100 - ((entry.weight - minWeight) / weightRange) * 80 - 10}`
                )
                .join(" ")}
            `}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {sortedEntries.map((entry, i) => (
            <circle
              key={entry.id}
              cx={i * 20 + 10}
              cy={100 - ((entry.weight - minWeight) / weightRange) * 80 - 10}
              r="3"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      {/* Dernières entrées */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(sortedEntries[0].measured_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>
          {new Date(sortedEntries[sortedEntries.length - 1].measured_at).toLocaleDateString(
            "fr-FR",
            { day: "numeric", month: "short" }
          )}
        </span>
      </div>
    </div>
  );
}

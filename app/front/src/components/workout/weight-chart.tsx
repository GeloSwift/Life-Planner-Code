"use client";

/**
 * Composant graphique d'évolution du poids.
 * 
 * Affiche une courbe de l'évolution du poids avec axe Y 70-90kg.
 */

import { useEffect, useState } from "react";
import { workoutApi } from "@/lib/workout-api";
import type { WeightEntry } from "@/lib/workout-types";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeightChartProps {
  latestWeight?: WeightEntry | null;
}

// Configuration du graphique
const MIN_WEIGHT = 70;
const MAX_WEIGHT = 90;
const WEIGHT_RANGE = MAX_WEIGHT - MIN_WEIGHT;
const CHART_HEIGHT = 160;
const CHART_PADDING = { top: 10, bottom: 30, left: 45, right: 15 };

export function WeightChart({ latestWeight }: WeightChartProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      try {
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

  // Trier les entrées par date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  // Calculer la tendance
  const firstWeight = sortedEntries[0]?.weight ?? 0;
  const lastWeight = sortedEntries[sortedEntries.length - 1]?.weight ?? 0;
  const trend = lastWeight - firstWeight;
  const actualMin = Math.min(...sortedEntries.map((e) => e.weight));
  const actualMax = Math.max(...sortedEntries.map((e) => e.weight));

  const TrendIcon = trend > 0.5 ? TrendingUp : trend < -0.5 ? TrendingDown : Minus;
  const trendColor = trend > 0.5 ? "text-red-500" : trend < -0.5 ? "text-green-500" : "text-muted-foreground";

  // Dimensions du graphique
  const chartWidth = 500;
  const chartInnerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Calculer les positions des points
  const getX = (index: number) => {
    if (sortedEntries.length === 1) return chartWidth / 2;
    return CHART_PADDING.left + (index / (sortedEntries.length - 1)) * chartInnerWidth;
  };

  const getY = (weight: number) => {
    // Clamp weight entre MIN et MAX
    const clampedWeight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
    const percentage = (clampedWeight - MIN_WEIGHT) / WEIGHT_RANGE;
    return CHART_PADDING.top + chartInnerHeight * (1 - percentage);
  };

  // Créer le path de la courbe lisse (courbe de Bézier)
  const createSmoothPath = () => {
    if (sortedEntries.length < 2) {
      const x = getX(0);
      const y = getY(sortedEntries[0].weight);
      return `M ${x} ${y}`;
    }

    const points = sortedEntries.map((entry, i) => ({
      x: getX(i),
      y: getY(entry.weight),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const tension = 0.3;
      
      const cpx1 = prev.x + (curr.x - prev.x) * tension;
      const cpy1 = prev.y;
      const cpx2 = curr.x - (curr.x - prev.x) * tension;
      const cpy2 = curr.y;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  // Créer le path pour l'aire sous la courbe
  const createAreaPath = () => {
    const linePath = createSmoothPath();
    const lastX = getX(sortedEntries.length - 1);
    const firstX = getX(0);
    const bottomY = CHART_HEIGHT - CHART_PADDING.bottom;
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Labels de l'axe Y
  const yLabels = [70, 75, 80, 85, 90];

  return (
    <div className="space-y-3">
      {/* Stats rapides */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          <span className={trendColor}>
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)} kg sur 90j
          </span>
        </div>
        <div className="text-muted-foreground text-xs">
          Min: {actualMin.toFixed(1)} kg | Max: {actualMax.toFixed(1)} kg
        </div>
      </div>

      {/* Graphique SVG */}
      <div className="relative w-full" style={{ height: CHART_HEIGHT }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradient bleu pour l'aire */}
            <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            {/* Glow effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Lignes horizontales de grille */}
          {yLabels.map((label) => (
            <g key={label}>
              <line
                x1={CHART_PADDING.left}
                y1={getY(label)}
                x2={chartWidth - CHART_PADDING.right}
                y2={getY(label)}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4 4"
              />
              <text
                x={CHART_PADDING.left - 8}
                y={getY(label)}
                fill="currentColor"
                fillOpacity="0.5"
                fontSize="11"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Label kg */}
          <text
            x={10}
            y={CHART_PADDING.top}
            fill="currentColor"
            fillOpacity="0.5"
            fontSize="10"
          >
            kg
          </text>

          {/* Aire sous la courbe */}
          <path
            d={createAreaPath()}
            fill="url(#weightAreaGradient)"
          />

          {/* Ligne de la courbe */}
          <path
            d={createSmoothPath()}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Points */}
          {sortedEntries.map((entry, i) => (
            <g key={entry.id}>
              <circle
                cx={getX(i)}
                cy={getY(entry.weight)}
                r="5"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {/* Tooltip au survol (simplifié) */}
              <title>{`${entry.weight} kg - ${new Date(entry.measured_at).toLocaleDateString("fr-FR")}`}</title>
            </g>
          ))}
        </svg>
      </div>

      {/* Dates */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
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

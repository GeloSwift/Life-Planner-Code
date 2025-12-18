"use client";

/**
 * Composant graphique d'évolution du poids.
 * 
 * Utilise Recharts de Shadcn pour un affichage professionnel.
 */

import { useEffect, useState } from "react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { workoutApi } from "@/lib/workout-api";
import type { WeightEntry } from "@/lib/workout-types";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface WeightChartProps {
  latestWeight?: WeightEntry | null;
}

const chartConfig = {
  weight: {
    label: "Poids",
    color: "hsl(217, 91%, 60%)", // blue-500
  },
} satisfies ChartConfig;

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
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
        <p className="text-sm">Aucune donnée de poids</p>
        <p className="text-xs mt-1">
          Utilisez les actions rapides pour enregistrer votre poids
        </p>
      </div>
    );
  }

  // Trier les entrées par date et formater les données pour Recharts
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  const chartData = sortedEntries.map((entry) => ({
    date: new Date(entry.measured_at).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }),
    fullDate: new Date(entry.measured_at).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    weight: entry.weight,
    notes: entry.notes,
  }));

  // Calculer la tendance
  const firstWeight = sortedEntries[0]?.weight ?? 0;
  const lastWeight = sortedEntries[sortedEntries.length - 1]?.weight ?? 0;
  const trend = lastWeight - firstWeight;
  const actualMin = Math.min(...sortedEntries.map((e) => e.weight));
  const actualMax = Math.max(...sortedEntries.map((e) => e.weight));

  const TrendIcon = trend > 0.5 ? TrendingUp : trend < -0.5 ? TrendingDown : Minus;
  const trendColor = trend > 0.5 ? "text-red-500" : trend < -0.5 ? "text-green-500" : "text-muted-foreground";

  // Calculer les bornes de l'axe Y (arrondi à 5)
  const yMin = Math.floor((actualMin - 2) / 5) * 5;
  const yMax = Math.ceil((actualMax + 2) / 5) * 5;

  return (
    <div className="space-y-2">
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

      {/* Graphique Recharts */}
      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => `${value}`}
            width={35}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, props) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-lg">{value} kg</span>
                    <span className="text-xs text-muted-foreground">
                      {props.payload?.fullDate}
                    </span>
                    {props.payload?.notes && (
                      <span className="text-xs text-blue-400">
                        {props.payload.notes}
                      </span>
                    )}
                  </div>
                )}
                hideLabel
                hideIndicator
              />
            }
          />
          <Area
            dataKey="weight"
            type="monotone"
            fill="url(#weightGradient)"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={2.5}
            dot={{ fill: "hsl(217, 91%, 60%)", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

"use client";

/**
 * Mini calendrier des séances.
 * 
 * Affiche les séances planifiées et passées sur un calendrier mensuel.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutSession } from "@/lib/workout-types";
import { SESSION_STATUS_LABELS } from "@/lib/workout-types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SessionCalendarProps {
  sessions: WorkoutSession[];
}

export function SessionCalendar({ sessions }: SessionCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajuster pour commencer la semaine le lundi (0 = lundi, 6 = dimanche)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;
    
    const daysInMonth = lastDay.getDate();
    
    // Créer le tableau des jours
    const daysArray: (number | null)[] = [];
    
    // Jours vides avant le premier jour du mois
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
    
    return daysArray;
  }, [currentDate]);

  // Mapper les séances par jour
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, WorkoutSession[]>();
    
    sessions.forEach((session) => {
      const sessionDate = session.scheduled_at
        ? new Date(session.scheduled_at)
        : session.started_at
        ? new Date(session.started_at)
        : null;
      
      if (sessionDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        if (
          sessionDate.getFullYear() === year &&
          sessionDate.getMonth() === month
        ) {
          const day = sessionDate.getDate();
          const existing = map.get(day) || [];
          map.set(day, [...existing, session]);
        }
      }
    });
    
    return map;
  }, [sessions, currentDate]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth();

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "terminee":
        return "bg-green-500";
      case "en_cours":
        return "bg-blue-500";
      case "planifiee":
        return "bg-orange-500";
      case "annulee":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {currentDate.toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </span>
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Aujourd&apos;hui
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {/* En-têtes des jours */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {day}
          </div>
        ))}

        {/* Jours du mois */}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const daySessions = sessionsByDay.get(day) || [];
          const isToday =
            isCurrentMonth && today.getDate() === day;
          const hasSessions = daySessions.length > 0;

          return (
            <div
              key={day}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-md text-sm
                transition-colors cursor-pointer hover:bg-accent
                ${isToday ? "bg-primary/10 font-bold text-primary" : ""}
                ${hasSessions ? "font-medium" : "text-muted-foreground"}
              `}
              onClick={() => {
                if (hasSessions && daySessions.length === 1) {
                  router.push(`/workout/sessions/${daySessions[0].id}`);
                }
              }}
              title={
                hasSessions
                  ? daySessions
                      .map(
                        (s) =>
                          `${s.name} (${SESSION_STATUS_LABELS[s.status]})`
                      )
                      .join("\n")
                  : undefined
              }
            >
              <span>{day}</span>
              {hasSessions && (
                <div className="flex gap-0.5 mt-0.5">
                  {daySessions.slice(0, 3).map((session, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                        session.status
                      )}`}
                    />
                  ))}
                  {daySessions.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">
                      +{daySessions.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Terminée</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>En cours</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Planifiée</span>
        </div>
      </div>
    </div>
  );
}

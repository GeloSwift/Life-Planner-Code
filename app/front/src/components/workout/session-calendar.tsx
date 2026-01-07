"use client";

/**
 * Calendrier des séances avec vue mois/semaine.
 * 
 * Fonctionnalités :
 * - Vue mensuelle avec pastilles colorées
 * - Vue semaine/agenda
 * - Tooltip au survol pour détails des séances
 * - Dialog de sélection si plusieurs séances le même jour
 * - Export vers calendriers externes (Google, Apple)
 */

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutSession } from "@/lib/workout-types";
import { SESSION_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from "@/lib/workout-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Clock,
  Dumbbell,
  Play,
  CheckCircle,
  XCircle,
  CalendarPlus,
  Download,
} from "lucide-react";

interface SessionCalendarProps {
  sessions: WorkoutSession[];
}

type ViewMode = "month" | "week";

export function SessionCalendar({ sessions }: SessionCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDaySessions, setSelectedDaySessions] = useState<WorkoutSession[] | null>(null);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calcul des jours du mois
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;
    
    const daysInMonth = lastDay.getDate();
    const daysArray: (number | null)[] = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
    
    return daysArray;
  }, [currentDate]);

  // Calcul des jours de la semaine
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Fonction pour générer les dates récurrentes
  const generateRecurringDates = (
    startDate: Date,
    recurrenceType: "daily" | "weekly" | "monthly" | null | undefined,
    recurrenceData: (number | string)[] | null | undefined,
    monthsAhead: number = 3
  ): Date[] => {
    if (!recurrenceType || !startDate) {
      return [startDate];
    }
    
    const dates: Date[] = [];
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsAhead);
    
    // Mapping des jours de la semaine
    const dayMapping: Record<string, number> = {
      "monday": 1,
      "tuesday": 2,
      "wednesday": 3,
      "thursday": 4,
      "friday": 5,
      "saturday": 6,
      "sunday": 0,
      "lundi": 1,
      "mardi": 2,
      "mercredi": 3,
      "jeudi": 4,
      "vendredi": 5,
      "samedi": 6,
      "dimanche": 0,
    };
    
    if (recurrenceType === "daily") {
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (recurrenceType === "weekly") {
      if (!recurrenceData || recurrenceData.length === 0) {
        // Par défaut, même jour de la semaine
        const current = new Date(startDate);
        while (current <= endDate) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 7);
        }
      } else {
        // Jours spécifiques de la semaine
        const targetDays = recurrenceData.map(day => {
          const dayStr = String(day).toLowerCase();
          return dayMapping[dayStr] ?? null;
        }).filter((d): d is number => d !== null);
        
        if (targetDays.length > 0) {
          // Commencer à partir de la date de départ et chercher tous les jours correspondants
          const current = new Date(startDate);
          const startDayOfWeek = startDate.getDay();
          
          // Si le jour de départ correspond déjà, l'ajouter
          if (targetDays.includes(startDayOfWeek)) {
            dates.push(new Date(startDate));
          }
          
          // Continuer à partir du jour suivant jusqu'à la fin
          current.setDate(current.getDate() + 1);
          
          while (current <= endDate) {
            const currentDay = current.getDay();
            if (targetDays.includes(currentDay)) {
              dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
          }
        } else {
          // Fallback: même jour de la semaine
          const current = new Date(startDate);
          while (current <= endDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 7);
          }
        }
      }
    } else if (recurrenceType === "monthly") {
      if (!recurrenceData || recurrenceData.length === 0) {
        // Par défaut, même jour du mois
        const current = new Date(startDate);
        while (current <= endDate) {
          dates.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
      } else {
        // Jours spécifiques du mois
        const targetDays = recurrenceData
          .map(day => {
            const dayNum = typeof day === "number" ? day : parseInt(String(day), 10);
            return isNaN(dayNum) ? null : dayNum;
          })
          .filter((d): d is number => d !== null && d >= 1 && d <= 31);
        
        if (targetDays.length > 0) {
          const current = new Date(startDate);
          const startDay = startDate.getDate();
          
          // Ajouter la date de départ si elle correspond
          if (targetDays.includes(startDay)) {
            dates.push(new Date(startDate));
          }
          
          // Générer les dates pour les mois suivants
          current.setMonth(current.getMonth() + 1);
          while (current <= endDate) {
            for (const day of targetDays) {
              const testDate = new Date(current.getFullYear(), current.getMonth(), day);
              if (testDate.getDate() === day && testDate <= endDate) {
                dates.push(testDate);
              }
            }
            current.setMonth(current.getMonth() + 1);
          }
        }
      }
    } else {
      // Pas de récurrence, juste la date de départ
      dates.push(startDate);
    }
    
    return dates;
  };

  // Mapper les séances par jour (incluant les récurrences)
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    
    sessions.forEach((session) => {
      const sessionDate = session.scheduled_at
        ? new Date(session.scheduled_at)
        : session.started_at
        ? new Date(session.started_at)
        : null;
      
      if (!sessionDate) return;
      
      // Parser recurrence_data si c'est une string JSON (au cas où Pydantic ne l'a pas fait)
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
      
      // Générer toutes les dates récurrentes (6 mois à l'avance pour être sûr)
      const recurringDates = generateRecurringDates(
        sessionDate,
        session.recurrence_type ?? null,
        parsedRecurrenceData,
        6 // 6 mois à l'avance pour couvrir une large période
      );
      
      // Ajouter chaque occurrence au mapping
      recurringDates.forEach((date) => {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const existing = map.get(key) || [];
        map.set(key, [...existing, session]);
      });
    });
    
    return map;
  }, [sessions]);

  const getSessionsForDay = (year: number, month: number, day: number) => {
    const key = `${year}-${month}-${day}`;
    return sessionsByDay.get(key) || [];
  };

  const goToPrev = () => {
    if (viewMode === "month") {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isCurrentPeriod = viewMode === "month"
    ? today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth()
    : weekDays.some(d => d.toDateString() === today.toDateString());

  const handleDayClick = (daySessions: WorkoutSession[]) => {
    // Réinitialiser le hover pour éviter le tooltip après fermeture du dialog
    setHoveredDay(null);
    
    if (daySessions.length === 0) return;
    
    if (daySessions.length === 1) {
      router.push(`/workout/sessions/${daySessions[0].id}`);
    } else {
      setSelectedDaySessions(daySessions);
      setShowSessionsDialog(true);
    }
  };

  const handleDayHover = (key: string | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (key) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredDay(key);
      }, 200);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredDay(null);
      }, 100);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "terminee": return "bg-green-500";
      case "en_cours": return "bg-blue-500";
      case "planifiee": return "bg-orange-500";
      case "annulee": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "terminee": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "en_cours": return <Play className="h-3 w-3 text-blue-500" />;
      case "planifiee": return <Clock className="h-3 w-3 text-orange-500" />;
      case "annulee": return <XCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Labels jours abrégés pour mobile
  const weekDayLabels = ["L", "M", "M", "J", "V", "S", "D"];
  const weekDayLabelsFull = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Composant pour afficher les détails d'une séance
  const SessionCard = ({ session, compact = false }: { session: WorkoutSession; compact?: boolean }) => (
    <Card 
      className={`cursor-pointer hover:bg-accent/50 transition-colors ${
        session.status === "annulee" ? "opacity-50" : ""
      } ${compact ? "" : "mb-2 last:mb-0"}`}
      onClick={() => router.push(`/workout/sessions/${session.id}`)}
    >
      <CardContent className={compact ? "p-2" : "p-3"}>
        <div className="flex items-start gap-2">
          {getStatusIcon(session.status)}
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${compact ? "text-xs" : "text-sm"}`}>
              {session.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {ACTIVITY_TYPE_LABELS[session.activity_type]}
            </p>
            {session.scheduled_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatTime(session.scheduled_at)}
              </p>
          )}
        </div>
      </div>
      </CardContent>
    </Card>
  );

  // Tooltip pour le survol d'un jour (desktop uniquement)
  const DayTooltip = ({ day, month, year, isVisible }: { day: number; month: number; year: number; isVisible: boolean }) => {
    const daySessions = getSessionsForDay(year, month, day);
    
    if (!isVisible || daySessions.length === 0) return null;

    return (
      <div className="hidden sm:block absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-popover border rounded-lg shadow-xl p-2.5 pointer-events-none">
        <div className="text-xs font-medium text-muted-foreground mb-1.5 capitalize">
          {new Date(year, month, day).toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </div>
        <div className="space-y-1.5 max-h-32 overflow-hidden">
          {daySessions.slice(0, 3).map((session) => (
            <div key={session.id} className="flex items-center gap-1.5 text-xs">
              {getStatusIcon(session.status)}
              <span className="truncate flex-1">{session.name}</span>
              {session.scheduled_at && (
                <span className="text-muted-foreground shrink-0">
                  {formatTime(session.scheduled_at)}
                </span>
              )}
          </div>
        ))}
          {daySessions.length > 3 && (
            <p className="text-xs text-muted-foreground">+{daySessions.length - 3} autres</p>
          )}
        </div>
        {/* Flèche du tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover" />
      </div>
    );
  };

  // Composant jour
  const DayCell = ({ day, month, year }: { day: number; month: number; year: number }) => {
    const daySessions = getSessionsForDay(year, month, day);
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const hasSessions = daySessions.length > 0;
    const dayKey = `${year}-${month}-${day}`;
    const isHovered = hoveredDay === dayKey;

          return (
            <div
        className="relative"
        onMouseEnter={() => handleDayHover(dayKey)}
        onMouseLeave={() => handleDayHover(null)}
      >
        <div
              className={`
            aspect-square flex flex-col items-center justify-center rounded-md text-xs sm:text-sm
                transition-colors cursor-pointer hover:bg-accent
            ${isToday ? "bg-primary/10 font-bold text-primary ring-1 ring-primary/30" : ""}
                ${hasSessions ? "font-medium" : "text-muted-foreground"}
              `}
          onClick={() => handleDayClick(daySessions)}
            >
              <span>{day}</span>
              {hasSessions && (
                <div className="flex gap-0.5 mt-0.5">
                  {daySessions.slice(0, 3).map((session, i) => (
                    <div
                      key={i}
                  className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${getStatusColor(session.status)}`}
                    />
                  ))}
            </div>
          )}
        </div>
        <DayTooltip day={day} month={month} year={year} isVisible={isHovered} />
      </div>
    );
  };

  // Export du calendrier complet
  const handleExportCalendar = (type: "google" | "ics") => {
    const futureSessions = sessions.filter(
      s => (s.status === "planifiee" || s.status === "en_cours") && s.scheduled_at
    );
    
    if (type === "google") {
      // Pour Google, on ne peut qu'ouvrir une session à la fois
      // On affiche un message explicatif
      alert("Pour synchroniser avec Google Calendar, téléchargez le fichier .ics et importez-le dans Google Calendar (Paramètres > Importer)");
      downloadAllSessionsICS(futureSessions);
    } else {
      downloadAllSessionsICS(futureSessions);
    }
  };

  return (
    <div className="space-y-2">
      {/* Navigation et contrôles */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[130px] text-center">
            {viewMode === "month"
              ? currentDate.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
              : `Sem. ${weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
            }
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          {!isCurrentPeriod && (
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs h-7 px-2">
              Auj.
            </Button>
          )}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none h-7 w-7 p-0"
              onClick={() => setViewMode("month")}
            >
              <CalendarIcon className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "week" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none h-7 w-7 p-0"
              onClick={() => setViewMode("week")}
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
          {/* Export calendrier */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Download className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" align="end">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-7 w-full"
                onClick={() => handleExportCalendar("ics")}
              >
                <CalendarPlus className="h-3 w-3 mr-2" />
                Exporter (.ics)
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Vue Mois */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 overflow-visible">
          {weekDayLabels.map((day, i) => (
            <div
              key={day + i}
              className="text-center text-[10px] sm:text-xs text-muted-foreground font-medium py-1"
            >
              <span className="sm:hidden">{weekDayLabels[i]}</span>
              <span className="hidden sm:inline">{weekDayLabelsFull[i]}</span>
            </div>
          ))}
          {monthDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            return (
              <DayCell
                key={day}
                day={day}
                month={currentDate.getMonth()}
                year={currentDate.getFullYear()}
              />
            );
          })}
        </div>
      )}

      {/* Vue Semaine/Agenda */}
      {viewMode === "week" && (
        <div className="space-y-1.5">
          {weekDays.map((date) => {
            const daySessions = getSessionsForDay(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            );
            const isToday = date.toDateString() === today.toDateString();
            
            return (
              <div
                key={date.toISOString()}
                className={`rounded-lg border p-2 sm:p-3 ${
                  isToday ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs sm:text-sm font-medium capitalize ${isToday ? "text-primary" : ""}`}>
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {date.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-1 py-0.5 rounded">
                        Auj.
                    </span>
                  )}
                </div>
                </div>
                
                {daySessions.length === 0 ? (
                  <p className="text-[10px] sm:text-xs text-muted-foreground italic">-</p>
                ) : (
                  <div className="space-y-1">
                    {daySessions.map((session) => (
                      <SessionCard key={session.id} session={session} compact />
                    ))}
                  </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Dialog pour sélectionner parmi plusieurs séances */}
      <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="h-4 w-4" />
              Séances du jour
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {selectedDaySessions?.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// Utilitaires pour l'export calendrier
// =============================================================================

/**
 * Génère un lien Google Calendar pour une séance
 */
export function generateGoogleCalendarUrl(session: WorkoutSession): string {
  const startDate = session.scheduled_at ? new Date(session.scheduled_at) : new Date();
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "");
  };
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `🏋️ ${session.name}`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: `Séance de ${ACTIVITY_TYPE_LABELS[session.activity_type]}\n\nStatut: ${SESSION_STATUS_LABELS[session.status]}`,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Génère le contenu ICS pour une ou plusieurs séances
 */
export function generateICSContent(sessionsToExport: WorkoutSession[]): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, -1) + "Z";
  };
  
  const buildRRULE = (session: WorkoutSession): string => {
    if (!session.recurrence_type) return "";
    
    const dayMapping: Record<string, string> = {
      "monday": "MO",
      "tuesday": "TU",
      "wednesday": "WE",
      "thursday": "TH",
      "friday": "FR",
      "saturday": "SA",
      "sunday": "SU",
      "lundi": "MO",
      "mardi": "TU",
      "mercredi": "WE",
      "jeudi": "TH",
      "vendredi": "FR",
      "samedi": "SA",
      "dimanche": "SU",
    };
    
    if (session.recurrence_type === "daily") {
      return "RRULE:FREQ=DAILY";
    } else if (session.recurrence_type === "weekly") {
      if (session.recurrence_data && session.recurrence_data.length > 0) {
        const byday = session.recurrence_data
          .map(day => dayMapping[String(day).toLowerCase()])
          .filter((d): d is string => d !== undefined);
        if (byday.length > 0) {
          return `RRULE:FREQ=WEEKLY;BYDAY=${byday.join(",")}`;
        }
      }
      return "RRULE:FREQ=WEEKLY";
    } else if (session.recurrence_type === "monthly") {
      if (session.recurrence_data && session.recurrence_data.length > 0) {
        const monthdays = session.recurrence_data
          .map(day => {
            const dayNum = typeof day === "number" ? day : parseInt(String(day), 10);
            return isNaN(dayNum) || dayNum < 1 || dayNum > 31 ? null : String(dayNum);
          })
          .filter((d): d is string => d !== null);
        if (monthdays.length > 0) {
          return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${monthdays.join(",")}`;
        }
      }
      return "RRULE:FREQ=MONTHLY";
    }
    return "";
  };
  
  const events = sessionsToExport.map((session) => {
    const startDate = session.scheduled_at ? new Date(session.scheduled_at) : new Date();
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // 1h30
    
    const rrule = buildRRULE(session);
    const rruleLine = rrule ? `${rrule}\n` : "";
    
    return `BEGIN:VEVENT
UID:${session.id}@lifeplanner
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
${rruleLine}SUMMARY:🏋️ ${session.name}
DESCRIPTION:Séance de ${ACTIVITY_TYPE_LABELS[session.activity_type]}
STATUS:${session.status === "terminee" ? "COMPLETED" : "CONFIRMED"}
END:VEVENT`;
  }).join("\n");
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Life Planner//Workout Planner//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Life Planner - Séances
${events}
END:VCALENDAR`;
}

/**
 * Télécharge un fichier ICS pour une séance
 */
export function downloadICS(session: WorkoutSession): void {
  const content = generateICSContent([session]);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `seance-${session.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge un fichier ICS pour toutes les séances
 */
export function downloadAllSessionsICS(sessions: WorkoutSession[]): void {
  if (sessions.length === 0) {
    alert("Aucune séance planifiée à exporter");
    return;
  }
  
  const content = generateICSContent(sessions);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planning-seances.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

"use client";

/**
 * Page d'édition d'une séance (métadonnées).
 *
 * Permet de modifier :
 * - nom
 * - types d'activités (multi-select)
 * - date/heure (si planifiée)
 * - notes
 *
 * NB: l'édition des exercices/sets d'une séance (contenu) reste gérée sur la page détail.
 */

import { useCallback, useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import { MultiSelect } from "@/components/ui/multi-select";
import type { UserActivityType, WorkoutSession } from "@/lib/workout-types";
import { Loader2, ArrowLeft, Save, Activity } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditSessionPage({ params }: PageProps) {
  const { id } = use(params);
  const sessionId = parseInt(id);
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);

  // Form
  const [name, setName] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("09:00");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionData, activities] = await Promise.all([
        workoutApi.sessions.get(sessionId),
        workoutApi.activityTypes.list(),
      ]);
      setSession(sessionData);
      setActivityTypes(activities);

      setName(sessionData.name || "");
      setNotes(sessionData.notes || "");

      // Types d'activités
      const ids =
        sessionData.custom_activity_type_ids && sessionData.custom_activity_type_ids.length > 0
          ? sessionData.custom_activity_type_ids
          : sessionData.custom_activity_type_id
            ? [sessionData.custom_activity_type_id]
            : [];
      setSelectedActivityIds(ids);

      // Date/heure (si planifiée)
      const dt = sessionData.scheduled_at ? new Date(sessionData.scheduled_at) : null;
      if (dt) {
        const iso = dt.toISOString();
        setScheduledDate(iso.split("T")[0]);
        setScheduledTime(iso.split("T")[1].slice(0, 5));
      } else {
        setScheduledDate("");
        setScheduledTime("09:00");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, showError]);

  useEffect(() => {
    if (Number.isNaN(sessionId)) return;
    loadData();
  }, [loadData, sessionId]);

  const activityOptions = useMemo(
    () =>
      activityTypes.map((a) => ({
        label: a.name,
        value: a.id.toString(),
      })),
    [activityTypes]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Veuillez entrer un nom");
      return;
    }

    setIsSaving(true);
    try {
      const scheduled_at =
        scheduledDate && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
          : undefined;

      await workoutApi.sessions.update(sessionId, {
        name,
        notes: notes || undefined,
        scheduled_at,
        custom_activity_type_id: selectedActivityIds.length > 0 ? selectedActivityIds[0] : undefined,
        custom_activity_type_ids: selectedActivityIds,
      });

      success("Séance mise à jour");
      router.push(`/workout/sessions/${sessionId}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <Header variant="sticky" />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">Séance introuvable</p>
              <Button className="mt-4" onClick={() => router.push("/workout/sessions")}>
                Retour
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl pb-32">
        <section className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/workout/sessions/${sessionId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Modifier la séance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mettez à jour les informations</p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>Nom, activités, date et notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Types d&apos;activités</Label>
              <MultiSelect
                options={activityOptions}
                selected={selectedActivityIds.map((x) => x.toString())}
                onChange={(selected) => setSelectedActivityIds(selected.map((v) => parseInt(v)))}
                placeholder="Sélectionner une ou plusieurs activités"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                La première activité sélectionnée reste l&apos;activité principale.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input id="time" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => router.push(`/workout/sessions/${sessionId}`)}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}


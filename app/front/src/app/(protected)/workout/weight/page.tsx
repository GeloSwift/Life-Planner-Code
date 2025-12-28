"use client";

/**
 * Page historique des pesées.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import { WeightChart } from "@/components/workout/weight-chart";
import type { WeightEntry } from "@/lib/workout-types";
import {
  Loader2,
  Scale,
  Plus,
  ArrowLeft,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function WeightPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState(new Date().toTimeString().slice(0, 5));
  const [newNotes, setNewNotes] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      const data = await workoutApi.weight.list({ limit: 100 });
      setEntries(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleCreate = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      showError("Veuillez entrer un poids valide");
      return;
    }

    setIsSubmitting(true);
    try {
      const dateTime = new Date(`${newDate}T${newTime}:00`);
      await workoutApi.weight.create({
        weight,
        measured_at: dateTime.toISOString(),
        notes: newNotes || undefined,
      });
      success(`Pesée enregistrée : ${weight} kg`);
      setShowNewEntry(false);
      setNewWeight("");
      setNewNotes("");
      setNewTime(new Date().toTimeString().slice(0, 5));
      loadEntries();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entry: WeightEntry) => {
    try {
      await workoutApi.weight.delete(entry.id);
      success("Pesée supprimée");
      loadEntries();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  // Trier par date décroissante
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  );

  // Calculer les variations
  const getVariation = (index: number) => {
    if (index >= sortedEntries.length - 1) return null;
    const current = sortedEntries[index].weight;
    const previous = sortedEntries[index + 1].weight;
    return current - previous;
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <section className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Scale className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                Suivi du poids
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {entries.length} pesée{entries.length > 1 ? "s" : ""} enregistrée
                {entries.length > 1 ? "s" : ""}
              </p>
            </div>
            <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle pesée
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle pesée</DialogTitle>
                  <DialogDescription>
                    Enregistrez votre poids
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Poids (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 75.5"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Heure</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Input
                      id="notes"
                      placeholder="Ex: Après le sport, à jeun..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Graphique */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution</CardTitle>
              <CardDescription>Sur les 90 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <WeightChart latestWeight={sortedEntries[0]} />
            </CardContent>
          </Card>
        </section>

        {/* Liste des pesées */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Historique</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sortedEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucune pesée enregistrée</p>
                <Button className="mt-4" onClick={() => setShowNewEntry(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Première pesée
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedEntries.map((entry, index) => {
                const variation = getVariation(index);
                
                return (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-2xl font-bold">{entry.weight}</p>
                            <p className="text-xs text-muted-foreground">kg</p>
                          </div>
                          <div>
                            <p className="font-medium">
                              {new Date(entry.measured_at).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </p>
                            {variation !== null && (
                              <p className={`text-sm flex items-center gap-1 ${
                                variation > 0 ? "text-red-500" : variation < 0 ? "text-green-500" : "text-muted-foreground"
                              }`}>
                                {variation > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : variation < 0 ? (
                                  <TrendingDown className="h-3 w-3" />
                                ) : null}
                                {variation > 0 ? "+" : ""}{variation.toFixed(1)} kg
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

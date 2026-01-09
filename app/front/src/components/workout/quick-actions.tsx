"use client";

/**
 * Composant Actions Rapides pour le Workout Planner.
 * 
 * Permet de :
 * - Créer une nouvelle séance
 * - Créer un exercice
 * - Faire une pesée
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import {
  Scale,
  Dumbbell,
  Loader2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface QuickActionsProps {
  onActionComplete?: () => void;
}

export function QuickActions({ onActionComplete }: QuickActionsProps) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewWeight, setShowNewWeight] = useState(false);

  // Formulaire pesée
  const [weight, setWeight] = useState("");
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split("T")[0]);
  const [weightTime, setWeightTime] = useState(new Date().toTimeString().slice(0, 5));
  const [weightNotes, setWeightNotes] = useState("");

  const resetWeightForm = () => {
    setWeight("");
    setWeightDate(new Date().toISOString().split("T")[0]);
    setWeightTime(new Date().toTimeString().slice(0, 5));
    setWeightNotes("");
  };

  const handleAddWeight = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      showError("Veuillez entrer un poids valide");
      return;
    }

    setIsLoading(true);
    try {
      const dateTime = new Date(`${weightDate}T${weightTime}:00`);
      await workoutApi.weight.create({
        weight: weightValue,
        measured_at: dateTime.toISOString(),
        notes: weightNotes || undefined,
      });

      success(`Pesée enregistrée ⚖️ ${weightValue} kg`);

      setShowNewWeight(false);
      resetWeightForm();
      onActionComplete?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="inline-block w-1 h-5 bg-primary rounded-full"></span>
        Actions rapides
      </h2>
      <div className="flex flex-wrap gap-2">
        {/* Nouvelle séance */}
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/workout/sessions/new")}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle séance</span>
          <span className="sm:hidden">Séance</span>
        </Button>

        {/* Nouvel exercice */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/workout/exercises/new")}
        >
          <Dumbbell className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvel exercice</span>
          <span className="sm:hidden">Exercice</span>
        </Button>

        {/* Nouvelle pesée */}
        <Dialog open={showNewWeight} onOpenChange={(open) => {
          setShowNewWeight(open);
          if (!open) resetWeightForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Pesée</span>
              <span className="sm:hidden">Poids</span>
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
                <Label htmlFor="quick-weight">Poids (kg)</Label>
                <Input
                  id="quick-weight"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 75.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quick-date">Date</Label>
                  <Input
                    id="quick-date"
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-time">Heure</Label>
                  <Input
                    id="quick-time"
                    type="time"
                    value={weightTime}
                    onChange={(e) => setWeightTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-notes">Notes (optionnel)</Label>
                <Input
                  id="quick-notes"
                  placeholder="Ex: Après le sport, à jeun..."
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddWeight} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

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
import { Card, CardContent } from "@/components/ui/card";
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
  const [weight, setWeight] = useState("");

  const handleAddWeight = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      showError("Veuillez entrer un poids valide");
      return;
    }

    setIsLoading(true);
    try {
      await workoutApi.weight.create({
        weight: weightValue,
      });

      success(`Pesée enregistrée ⚖️ ${weightValue} kg`);

      setShowNewWeight(false);
      setWeight("");
      onActionComplete?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Actions rapides
        </h3>
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
          <Dialog open={showNewWeight} onOpenChange={setShowNewWeight}>
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
                  Enregistrez votre poids du jour
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
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
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
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Page de création d'exercice avec champs dynamiques selon le type d'activité.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workoutApi } from "@/lib/workout-api";
import { useToast } from "@/components/ui/toast";
import {
  MUSCLE_GROUP_LABELS,
  type ActivityType,
  type MuscleGroup,
} from "@/lib/workout-types";
import {
  Loader2,
  ArrowLeft,
  Dumbbell,
  Plus,
} from "lucide-react";

// Types d'activités disponibles avec leurs champs spécifiques
const ACTIVITY_CONFIGS: Record<string, {
  label: string;
  fields: string[];
}> = {
  musculation: {
    label: "Musculation",
    fields: ["muscle_group", "equipment", "sets", "reps", "weight", "rest_time"],
  },
  course: {
    label: "Course à pied",
    fields: ["distance", "time", "speed", "incline"],
  },
  marche_inclinee: {
    label: "Marche inclinée",
    fields: ["distance", "time", "speed", "incline"],
  },
  cyclisme: {
    label: "Cyclisme",
    fields: ["distance", "time", "speed"],
  },
  natation: {
    label: "Natation",
    fields: ["distance", "time", "laps"],
  },
  danse: {
    label: "Danse",
    fields: ["time", "dance_style"],
  },
  volleyball: {
    label: "Volleyball",
    fields: ["time", "sets_played"],
  },
  boxe: {
    label: "Boxe",
    fields: ["time", "rounds"],
  },
  yoga: {
    label: "Yoga",
    fields: ["time", "yoga_style"],
  },
  autre: {
    label: "Autre",
    fields: ["time", "custom_field"],
  },
};

// Labels des champs
const FIELD_LABELS: Record<string, { label: string; placeholder: string; type: string; unit?: string }> = {
  muscle_group: { label: "Groupe musculaire", placeholder: "Sélectionner...", type: "select" },
  equipment: { label: "Équipement", placeholder: "Ex: Haltères, Barre...", type: "text" },
  sets: { label: "Séries", placeholder: "Ex: 3", type: "number", unit: "séries" },
  reps: { label: "Répétitions", placeholder: "Ex: 12", type: "number", unit: "reps" },
  weight: { label: "Poids", placeholder: "Ex: 50", type: "number", unit: "kg" },
  rest_time: { label: "Temps de repos", placeholder: "Ex: 90", type: "number", unit: "sec" },
  distance: { label: "Distance", placeholder: "Ex: 5", type: "number", unit: "km" },
  time: { label: "Durée", placeholder: "Ex: 30", type: "number", unit: "min" },
  speed: { label: "Vitesse", placeholder: "Ex: 10", type: "number", unit: "km/h" },
  incline: { label: "Inclinaison", placeholder: "Ex: 15", type: "number", unit: "%" },
  laps: { label: "Longueurs", placeholder: "Ex: 20", type: "number", unit: "longueurs" },
  dance_style: { label: "Style de danse", placeholder: "Ex: Salsa, Hip-hop...", type: "text" },
  sets_played: { label: "Sets joués", placeholder: "Ex: 3", type: "number", unit: "sets" },
  rounds: { label: "Rounds", placeholder: "Ex: 12", type: "number", unit: "rounds" },
  yoga_style: { label: "Style de yoga", placeholder: "Ex: Hatha, Vinyasa...", type: "text" },
  custom_field: { label: "Champ personnalisé", placeholder: "Valeur...", type: "text" },
};

export default function NewExercisePage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Formulaire principal
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState<string>("musculation");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">("");
  const [difficulty, setDifficulty] = useState(3);

  // Champs dynamiques
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Dialog pour ajouter un nouveau type d'activité
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [customActivities, setCustomActivities] = useState<Record<string, { label: string; fields: string[] }>>({});

  // Combinaison des activités
  const allActivities = { ...ACTIVITY_CONFIGS, ...customActivities };
  const currentActivityConfig = allActivities[activityType];
  const availableFields = currentActivityConfig?.fields || [];

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleAddActivity = () => {
    if (!newActivityName.trim()) {
      showError("Veuillez entrer un nom pour le type d'activité");
      return;
    }

    const key = newActivityName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    
    if (allActivities[key]) {
      showError("Ce type d'activité existe déjà");
      return;
    }

    setCustomActivities((prev) => ({
      ...prev,
      [key]: {
        label: newActivityName,
        fields: ["time", "custom_field"], // Champs par défaut pour un nouveau type
      },
    }));

    setActivityType(key);
    setShowNewActivity(false);
    setNewActivityName("");
    success(`Type d'activité "${newActivityName}" ajouté`);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError("Veuillez entrer un nom pour l'exercice");
      return;
    }

    setIsLoading(true);
    try {
      // Ajouter les métadonnées des champs dynamiques dans le champ instructions
      const dynamicFields = Object.entries(fieldValues)
        .filter(([, value]) => value)
        .map(([key, value]) => {
          const config = FIELD_LABELS[key];
          return `${config?.label || key}: ${value}${config?.unit ? ` ${config.unit}` : ""}`;
        });

      // Préparer les données selon le type d'activité
      const finalActivityType = activityType === "marche_inclinee" ? "course" : activityType;
      
      await workoutApi.exercises.create({
        name,
        description: description || undefined,
        activity_type: finalActivityType as ActivityType,
        muscle_group: muscleGroup || undefined,
        difficulty,
        instructions: dynamicFields.length > 0 ? dynamicFields.join("\n") : undefined,
      });
      
      success(`Exercice "${name}" créé avec succès`);
      router.push("/workout/exercises");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        {/* Header */}
        <section className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/workout/exercises")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            Nouvel exercice
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez un exercice personnalisé
          </p>
        </section>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Définissez les caractéristiques de l&apos;exercice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;exercice *</Label>
              <Input
                id="name"
                placeholder="Ex: Développé couché, Course 5km..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Description optionnelle..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Type d'activité */}
            <div className="space-y-2">
              <Label>Type d&apos;activité</Label>
              <div className="flex gap-2">
                <Select
                  value={activityType}
                  onValueChange={(v) => {
                    setActivityType(v);
                    setFieldValues({});
                    setMuscleGroup("");
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(allActivities).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewActivity(true)}
                  title="Ajouter un type d'activité"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Difficulté */}
            <div className="space-y-2">
              <Label>Difficulté : {difficulty}/5</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant={difficulty >= level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty(level)}
                    className="flex-1"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Champs dynamiques selon le type d'activité */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Paramètres {currentActivityConfig?.label || ""}
            </CardTitle>
            <CardDescription>
              Champs spécifiques à ce type d&apos;exercice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableFields.map((fieldName) => {
              const fieldConfig = FIELD_LABELS[fieldName];
              
              if (!fieldConfig) return null;

              // Champ spécial pour le groupe musculaire
              if (fieldName === "muscle_group") {
                return (
                  <div key={fieldName} className="space-y-2">
                    <Label>{fieldConfig.label}</Label>
                    <Select
                      value={muscleGroup}
                      onValueChange={(v) => setMuscleGroup(v as MuscleGroup)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={fieldConfig.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MUSCLE_GROUP_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              return (
                <div key={fieldName} className="space-y-2">
                  <Label htmlFor={fieldName}>
                    {fieldConfig.label}
                    {fieldConfig.unit && (
                      <span className="text-muted-foreground ml-1">({fieldConfig.unit})</span>
                    )}
                  </Label>
                  <Input
                    id={fieldName}
                    type={fieldConfig.type}
                    placeholder={fieldConfig.placeholder}
                    value={fieldValues[fieldName] || ""}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  />
                </div>
              );
            })}

            {availableFields.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun champ spécifique pour ce type d&apos;activité
              </p>
            )}
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer l&apos;exercice
          </Button>
        </div>
      </main>

      <Footer />

      {/* Dialog nouveau type d'activité */}
      <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau type d&apos;activité</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau type d&apos;activité à la liste
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-activity">Nom du type d&apos;activité</Label>
              <Input
                id="new-activity"
                placeholder="Ex: Escalade, Ski, Tennis..."
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewActivity(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddActivity}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

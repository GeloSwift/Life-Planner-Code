"use client";

/**
 * Page d'édition d'exercice avec activités personnalisées et champs dynamiques.
 * 
 * Réutilise la logique de création mais charge les données existantes.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import type {
  UserActivityType,
  CustomFieldDefinition,
  CustomFieldType,
  ExerciseFieldValueCreate,
} from "@/lib/workout-types";
import {
  Loader2,
  ArrowLeft,
  Dumbbell,
  Plus,
  Minus,
  X,
  Image as ImageIcon,
  Trash2,
  Activity,
  Bike,
  Footprints,
  Heart,
  Mountain,
  Music,
  Waves,
  Target,
  Timer,
  Trophy,
  Zap,
  Flame,
  PersonStanding,
  CircleDot,
  Swords,
  Medal,
  Volleyball,
  type LucideIcon,
} from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

// Map des icônes disponibles pour les activités
const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  Dumbbell: Dumbbell,
  Footprints: Footprints,
  Music: Music,
  Volleyball: Volleyball,
  Activity: Activity,
  Bike: Bike,
  Heart: Heart,
  Mountain: Mountain,
  Waves: Waves,
  Target: Target,
  Timer: Timer,
  Trophy: Trophy,
  Zap: Zap,
  Flame: Flame,
  PersonStanding: PersonStanding,
  CircleDot: CircleDot,
  Swords: Swords,
  Medal: Medal,
};

// Icônes par défaut pour les activités prédéfinies
const DEFAULT_ACTIVITY_ICONS: Record<string, string> = {
  "Musculation": "Dumbbell",
  "Course à pied": "Footprints",
  "Danse": "Music",
  "Volleyball": "Volleyball",
};

// Types pour les champs personnalisés
const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Texte",
  number: "Nombre",
  select: "Liste déroulante",
  multi_select: "Multi-sélection",
  checkbox: "Case à cocher",
  date: "Date",
  duration: "Durée",
};

// Composant pour afficher une icône d'activité
function ActivityIcon({ iconName, className = "h-5 w-5" }: { iconName: string | null; className?: string }) {
  const IconComponent = iconName ? ACTIVITY_ICONS[iconName] : Activity;
  return IconComponent ? <IconComponent className={className} /> : <Activity className={className} />;
}

export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = parseInt(params.id as string);
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExercise, setIsLoadingExercise] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulaire principal
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [gifData, setGifData] = useState<string | null>(null);
  const [gifPreview, setGifPreview] = useState<string | null>(null);

  // Activités personnalisées
  const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Champs dynamiques (valeurs pour l'exercice)
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});

  // Dialogs
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityIcon, setNewActivityIcon] = useState("Activity");
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [newFieldUnit, setNewFieldUnit] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState("");

  // Charger les types d'activités
  const loadActivityTypes = useCallback(async () => {
    try {
      const types = await workoutApi.activityTypes.list();
      setActivityTypes(types);
    } catch (err) {
      showError("Erreur lors du chargement des activités");
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  }, [showError]);

  // Charger l'exercice existant
  const loadExercise = useCallback(async () => {
    try {
      setIsLoadingExercise(true);
      const exercise = await workoutApi.exercises.get(exerciseId);
      
      setName(exercise.name);
      setDescription(exercise.description || "");
      setSelectedActivityId(exercise.custom_activity_type_id || null);
      
      // Charger le GIF si présent
      if (exercise.gif_data) {
        setGifData(exercise.gif_data);
        setGifPreview(exercise.gif_data);
      }
      
      // Charger les valeurs des champs personnalisés
      if (exercise.field_values) {
        const values: Record<number, string> = {};
        exercise.field_values.forEach(fv => {
          if (fv.field_id) {
            values[fv.field_id] = fv.value || "";
          }
        });
        setFieldValues(values);
      }
    } catch (err) {
      showError("Erreur lors du chargement de l'exercice");
      console.error(err);
      router.push("/workout/exercises");
    } finally {
      setIsLoadingExercise(false);
    }
  }, [exerciseId, showError, router]);

  useEffect(() => {
    loadActivityTypes();
    loadExercise();
  }, [loadActivityTypes, loadExercise]);

  // Activité sélectionnée
  const selectedActivity = activityTypes.find(a => a.id === selectedActivityId);
  const customFields = selectedActivity?.custom_fields || [];

  // Fonction pour obtenir l'icône d'une activité
  const getActivityIcon = (activity: UserActivityType): string => {
    if (activity.icon && ACTIVITY_ICONS[activity.icon]) {
      return activity.icon;
    }
    return DEFAULT_ACTIVITY_ICONS[activity.name] || "Activity";
  };

  // Gestion des fichiers GIF
  const handleGifUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("gif") && !file.type.includes("image")) {
      showError("Veuillez sélectionner un fichier GIF ou image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError("Le fichier ne doit pas dépasser 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setGifData(base64);
      setGifPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeGif = () => {
    setGifData(null);
    setGifPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Gestion des valeurs de champs
  const handleFieldChange = (fieldId: number, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Ajouter une nouvelle activité
  const handleAddActivity = async () => {
    if (!newActivityName.trim()) {
      showError("Veuillez entrer un nom pour l'activité");
      return;
    }

    try {
      const newActivity = await workoutApi.activityTypes.create({
        name: newActivityName,
        icon: newActivityIcon,
      });
      
      setActivityTypes(prev => [...prev, newActivity]);
      setSelectedActivityId(newActivity.id);
      setShowNewActivity(false);
      setNewActivityName("");
      setNewActivityIcon("Activity");
      success(`Activité "${newActivityName}" créée`);
    } catch (err) {
      showError("Erreur lors de la création de l'activité");
      console.error(err);
    }
  };

  // Supprimer une activité personnalisée
  const handleDeleteActivity = async (activityId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const activity = activityTypes.find(a => a.id === activityId);
    if (!activity || activity.is_default) return;

    try {
      await workoutApi.activityTypes.delete(activityId);
      setActivityTypes(prev => prev.filter(a => a.id !== activityId));
      
      if (selectedActivityId === activityId) {
        const remaining = activityTypes.filter(a => a.id !== activityId);
        setSelectedActivityId(remaining[0]?.id || null);
      }
      
      success("Activité supprimée");
    } catch (err) {
      showError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  // Ajouter un nouveau champ personnalisé à l'activité
  const handleAddField = async () => {
    if (!newFieldName.trim() || !selectedActivityId) {
      showError("Veuillez entrer un nom pour le champ");
      return;
    }

    try {
      const options = newFieldType === "select" || newFieldType === "multi_select"
        ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean)
        : undefined;

      const newField = await workoutApi.activityTypes.addField(selectedActivityId, {
        name: newFieldName,
        field_type: newFieldType,
        unit: newFieldUnit || undefined,
        options,
      });

      setActivityTypes(prev => prev.map(a => {
        if (a.id === selectedActivityId) {
          return {
            ...a,
            custom_fields: [...(a.custom_fields || []), newField],
          };
        }
        return a;
      }));

      setShowNewField(false);
      setNewFieldName("");
      setNewFieldType("text");
      setNewFieldUnit("");
      setNewFieldOptions("");
      success(`Champ "${newFieldName}" ajouté à ${selectedActivity?.name}`);
    } catch (err) {
      showError("Erreur lors de l'ajout du champ");
      console.error(err);
    }
  };

  // Supprimer un champ personnalisé
  const handleDeleteField = async (fieldId: number) => {
    try {
      await workoutApi.activityTypes.deleteField(fieldId);
      
      setActivityTypes(prev => prev.map(a => ({
        ...a,
        custom_fields: a.custom_fields?.filter(f => f.id !== fieldId) || [],
      })));
      
      setFieldValues(prev => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
      
      success("Champ supprimé");
    } catch (err) {
      showError("Erreur lors de la suppression du champ");
      console.error(err);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!name.trim()) {
      showError("Veuillez entrer un nom pour l'exercice");
      return;
    }

    if (!selectedActivityId) {
      showError("Veuillez sélectionner un type d'activité");
      return;
    }

    setIsLoading(true);
    try {
      // Préparer les valeurs des champs
      const fieldValuesData: ExerciseFieldValueCreate[] = Object.entries(fieldValues)
        .filter(([, value]) => value)
        .map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value,
        }));

      // Déterminer le activity_type legacy
      const selectedActivityName = selectedActivity?.name.toLowerCase() || "autre";
      let legacyActivityType = "autre";
      if (selectedActivityName.includes("musculation")) legacyActivityType = "musculation";
      else if (selectedActivityName.includes("course")) legacyActivityType = "course";
      else if (selectedActivityName.includes("danse")) legacyActivityType = "danse";
      else if (selectedActivityName.includes("volleyball")) legacyActivityType = "volleyball";

      await workoutApi.exercises.update(exerciseId, {
        name,
        description: description || undefined,
        activity_type: legacyActivityType as never,
        custom_activity_type_id: selectedActivityId,
        gif_data: gifData || undefined,
        field_values: fieldValuesData.length > 0 ? fieldValuesData : undefined,
      });
      
      success(`Exercice "${name}" modifié avec succès`);
      router.push("/workout/exercises");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu d'un champ personnalisé
  const renderCustomField = (field: CustomFieldDefinition) => {
    const value = fieldValues[field.id] || "";
    const options = field.options || [];

    switch (field.field_type) {
      case "select":
        return (
          <Select value={value} onValueChange={(v) => handleFieldChange(field.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Sélectionner..."} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "multi_select":
        let selectedValues: string[] = [];
        try {
          if (value) {
            selectedValues = JSON.parse(value);
            if (!Array.isArray(selectedValues)) {
              selectedValues = [];
            }
          }
        } catch {
          selectedValues = [];
        }

        const multiSelectOptions = options.map((opt: string) => ({
          label: opt,
          value: opt,
        }));

        return (
          <MultiSelect
            options={multiSelectOptions}
            selected={selectedValues}
            onChange={(selected) => {
              handleFieldChange(field.id, JSON.stringify(selected));
            }}
            placeholder={field.placeholder || "Sélectionner plusieurs options..."}
          />
        );
      
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`field-${field.id}`}
              checked={value === "true"}
              onChange={(e) => handleFieldChange(field.id, e.target.checked ? "true" : "false")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={`field-${field.id}`} className="text-sm">Oui</Label>
          </div>
        );
      
      case "number":
        return (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder={field.placeholder || "0"}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="flex-1"
            />
            {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
          </div>
        );
      
      case "duration":
        return (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="0"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">secondes</span>
          </div>
        );
      
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
      
      default: // text
        return (
          <Input
            placeholder={field.placeholder || "Valeur..."}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  if (loadingActivities || isLoadingExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            Modifier l&apos;exercice
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez les caractéristiques de l&apos;exercice
          </p>
        </section>

        {/* Formulaire principal */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Définissez les caractéristiques de base de l&apos;exercice
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

            {/* Type d'activité avec icônes React */}
            <div className="space-y-2">
              <Label>Type d&apos;activité</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedActivityId?.toString() || ""}
                  onValueChange={(v) => {
                    setSelectedActivityId(parseInt(v));
                    setFieldValues({});
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner une activité">
                      {selectedActivity && (
                        <div className="flex items-center gap-2">
                          <ActivityIcon iconName={getActivityIcon(selectedActivity)} className="h-4 w-4" />
                          <span>{selectedActivity.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((activity) => (
                      <SelectItem 
                        key={activity.id} 
                        value={activity.id.toString()}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <ActivityIcon iconName={getActivityIcon(activity)} className="h-4 w-4" />
                          <span className="flex-1">{activity.name}</span>
                          {!activity.is_default && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteActivity(activity.id, e)}
                              className="ml-2 text-destructive hover:text-destructive/80 p-1"
                              title="Supprimer cette activité"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
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

            {/* Upload GIF */}
            <div className="space-y-2">
              <Label>Illustration (GIF/Image)</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {gifPreview ? (
                  <div className="relative flex items-center justify-center bg-muted rounded-lg overflow-hidden" style={{ minHeight: "150px", maxHeight: "400px" }}>
                    <img
                      src={gifPreview}
                      alt="Aperçu"
                      className="w-full h-auto max-h-full object-contain rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeGif}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour ajouter un GIF ou une image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 2MB • GIF, PNG, JPG
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/gif,image/png,image/jpeg,image/webp"
                  onChange={handleGifUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Champs personnalisés de l'activité */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedActivity && (
                  <ActivityIcon iconName={getActivityIcon(selectedActivity)} className="h-5 w-5 text-primary" />
                )}
                <div>
                  <CardTitle>
                    Paramètres {selectedActivity?.name || ""}
                  </CardTitle>
                  <CardDescription>
                    Champs personnalisés pour ce type d&apos;activité
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewField(true)}
                disabled={!selectedActivityId}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {customFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun champ personnalisé pour cette activité</p>
                <p className="text-sm mt-1">Cliquez sur &quot;Ajouter&quot; pour créer des paramètres</p>
              </div>
            ) : (
              customFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      {field.name}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                      {field.unit && (
                        <span className="text-muted-foreground ml-1">({field.unit})</span>
                      )}
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {renderCustomField(field)}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button
            variant="outline"
            className="flex-1 w-full sm:w-auto"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </main>

      <Footer />

      {/* Dialog nouvelle activité */}
      <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle activité</DialogTitle>
            <DialogDescription>
              Créez un nouveau type d&apos;activité personnalisé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-activity-name">Nom de l&apos;activité</Label>
              <Input
                id="new-activity-name"
                placeholder="Ex: Escalade, Ski, Tennis..."
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Choisir une icône</Label>
              <div className="grid grid-cols-6 gap-2 p-2 border rounded-lg max-h-40 overflow-y-auto">
                {Object.entries(ACTIVITY_ICONS).map(([iconName, IconComponent]) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewActivityIcon(iconName)}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                      newActivityIcon === iconName
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    title={iconName}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Icône sélectionnée : {newActivityIcon}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewActivity(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddActivity}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nouveau champ */}
      <Dialog open={showNewField} onOpenChange={setShowNewField}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau champ personnalisé</DialogTitle>
            <DialogDescription>
              Ajoutez un paramètre à {selectedActivity?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Nom du champ</Label>
              <Input
                id="field-name"
                placeholder="Ex: Poids, Distance, Répétitions..."
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de champ</Label>
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as CustomFieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(newFieldType === "number" || newFieldType === "duration") && (
              <div className="space-y-2">
                <Label htmlFor="field-unit">Unité (optionnel)</Label>
                <Input
                  id="field-unit"
                  placeholder="Ex: kg, km, min..."
                  value={newFieldUnit}
                  onChange={(e) => setNewFieldUnit(e.target.value)}
                />
              </div>
            )}
            {(newFieldType === "select" || newFieldType === "multi_select") && (
              <div className="space-y-2">
                <Label htmlFor="field-options">Options (séparées par des virgules)</Label>
                <Input
                  id="field-options"
                  placeholder="Ex: Facile, Moyen, Difficile"
                  value={newFieldOptions}
                  onChange={(e) => setNewFieldOptions(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewField(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddField}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

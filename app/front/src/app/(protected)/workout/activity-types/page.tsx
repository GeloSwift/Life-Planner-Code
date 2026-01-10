"use client";

/**
 * Page de gestion des types d'activités sportives.
 * 
 * Permet de :
 * - Voir tous les types d'activités (par défaut + personnalisés)
 * - Créer un nouveau type
 * - Modifier un type existant
 * - Supprimer un type personnalisé
 * - Marquer un type comme favori (influence les stats du dashboard)
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { workoutApi } from "@/lib/workout-api";
import { UserActivityType } from "@/lib/workout-types";
import {
    ArrowLeft,
    Plus,
    Star,
    Pencil,
    Trash2,
    MoreVertical,
    Loader2,
    Dumbbell,
    Footprints,
    Music,
    Bike,
    Waves,
    Flame,
    Timer,
    Heart,
    Mountain,
    PersonStanding,
    Medal,
    Swords,
    Target,
    Zap,
    Trophy,
    Activity,
    LucideIcon,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Liste des icônes disponibles pour les types d'activités
const AVAILABLE_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
    { name: "Dumbbell", icon: Dumbbell, label: "Haltère" },
    { name: "Footprints", icon: Footprints, label: "Course" },
    { name: "Bike", icon: Bike, label: "Vélo" },
    { name: "Waves", icon: Waves, label: "Natation" },
    { name: "Music", icon: Music, label: "Danse" },
    { name: "Flame", icon: Flame, label: "CrossFit" },
    { name: "Timer", icon: Timer, label: "HIIT" },
    { name: "Heart", icon: Heart, label: "Cardio" },
    { name: "Mountain", icon: Mountain, label: "Randonnée" },
    { name: "PersonStanding", icon: PersonStanding, label: "Yoga" },
    { name: "Medal", icon: Medal, label: "Sport" },
    { name: "Swords", icon: Swords, label: "Combat" },
    { name: "Target", icon: Target, label: "Précision" },
    { name: "Zap", icon: Zap, label: "Intensif" },
    { name: "Trophy", icon: Trophy, label: "Compétition" },
    { name: "Activity", icon: Activity, label: "Activité" },
];

// Couleurs disponibles
const AVAILABLE_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#22c55e", // green
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#d946ef", // fuchsia
    "#ec4899", // pink
];

// Composant pour afficher une icône par son nom
function ActivityIcon({ iconName, className, style }: { iconName: string | null; className?: string; style?: React.CSSProperties }) {
    const iconData = AVAILABLE_ICONS.find(i => i.name === iconName);
    if (!iconData) {
        return <Activity className={className} style={style} />;
    }
    const IconComponent = iconData.icon;
    return <IconComponent className={className} style={style} />;
}

export default function ActivityTypesPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();

    const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingType, setEditingType] = useState<UserActivityType | null>(null);
    const [formData, setFormData] = useState({ name: "", icon: "", color: "" });

    // Confirmation dialog
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<UserActivityType | null>(null);

    const loadActivityTypes = useCallback(async () => {
        try {
            const types = await workoutApi.activityTypes.list();
            setActivityTypes(types);
        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur de chargement");
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadActivityTypes();
    }, [loadActivityTypes]);

    const handleOpenCreate = () => {
        setEditingType(null);
        setFormData({ name: "", icon: "Activity", color: "#3b82f6" });
        setShowDialog(true);
    };

    const handleOpenEdit = (type: UserActivityType) => {
        setEditingType(type);
        setFormData({
            name: type.name,
            icon: type.icon || "Activity",
            color: type.color || "#3b82f6",
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showError("Le nom est requis");
            return;
        }

        setIsSaving(true);
        try {
            if (editingType) {
                // Update
                await workoutApi.activityTypes.update(editingType.id, {
                    name: formData.name,
                    icon: formData.icon || undefined,
                    color: formData.color || undefined,
                });
                success("Type d'activité modifié ✏️");
            } else {
                // Create
                await workoutApi.activityTypes.create({
                    name: formData.name,
                    icon: formData.icon || undefined,
                    color: formData.color || undefined,
                });
                success("Type d'activité créé ✨");
            }
            setShowDialog(false);
            loadActivityTypes();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!typeToDelete) return;

        setIsSaving(true);
        try {
            await workoutApi.activityTypes.delete(typeToDelete.id);
            success("Type d'activité supprimé 🗑️");
            setShowDeleteConfirm(false);
            setTypeToDelete(null);
            loadActivityTypes();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleFavorite = async (type: UserActivityType) => {
        try {
            await workoutApi.activityTypes.toggleFavorite(type.id);
            success(type.is_favorite ? "Favori retiré" : "Marqué comme favori ⭐");
            loadActivityTypes();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur");
        }
    };

    // Séparer les types par défaut et personnalisés
    const defaultTypes = activityTypes.filter(t => t.is_default);
    const customTypes = activityTypes.filter(t => !t.is_default);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/workout")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Types d&apos;activités</h1>
                        <p className="text-muted-foreground text-sm">
                            Gérez vos types d&apos;activités sportives
                        </p>
                    </div>
                    <Button onClick={handleOpenCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nouveau</span>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Types par défaut */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Par défaut</CardTitle>
                                <CardDescription>
                                    Types d&apos;activités standards disponibles pour tous
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {defaultTypes.map(type => (
                                        <div
                                            key={type.id}
                                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div
                                                className="rounded-xl p-2.5 flex-shrink-0"
                                                style={{
                                                    backgroundColor: type.color ? `${type.color}20` : "rgba(59, 130, 246, 0.1)",
                                                }}
                                            >
                                                <ActivityIcon
                                                    iconName={type.icon}
                                                    className="h-5 w-5"
                                                    style={{ color: type.color || "#3b82f6" }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{type.name}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={type.is_favorite ? "text-yellow-500" : "text-muted-foreground"}
                                                onClick={() => handleToggleFavorite(type)}
                                            >
                                                <Star
                                                    className="h-5 w-5"
                                                    fill={type.is_favorite ? "currentColor" : "none"}
                                                />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Types personnalisés */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Personnalisés</CardTitle>
                                <CardDescription>
                                    Vos types d&apos;activités personnalisés
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {customTypes.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Aucun type personnalisé</p>
                                        <p className="text-sm">Créez votre premier type d&apos;activité !</p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {customTypes.map(type => (
                                            <div
                                                key={type.id}
                                                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                                            >
                                                <div
                                                    className="rounded-xl p-2.5 flex-shrink-0"
                                                    style={{
                                                        backgroundColor: type.color ? `${type.color}20` : "rgba(59, 130, 246, 0.1)",
                                                    }}
                                                >
                                                    <ActivityIcon
                                                        iconName={type.icon}
                                                        className="h-5 w-5"
                                                        style={{ color: type.color || "#3b82f6" }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium">{type.name}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={type.is_favorite ? "text-yellow-500" : "text-muted-foreground"}
                                                    onClick={() => handleToggleFavorite(type)}
                                                >
                                                    <Star
                                                        className="h-5 w-5"
                                                        fill={type.is_favorite ? "currentColor" : "none"}
                                                    />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(type)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setTypeToDelete(type);
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Info favori */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4 flex gap-4">
                                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">Type favori</p>
                                    <p className="text-muted-foreground">
                                        Le type d&apos;activité marqué comme favori influence la 4ème stat
                                        affichée sur le dashboard (ex: poids total pour musculation, séries pour les autres).
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>

            <Footer />

            {/* Dialog Create/Edit */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingType ? "Modifier le type" : "Nouveau type d'activité"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingType
                                ? "Modifiez les informations de ce type d'activité"
                                : "Créez un nouveau type d'activité personnalisé"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Nom */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Escalade, Ski, Padel..."
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        {/* Icône */}
                        <div className="space-y-2">
                            <Label>Icône</Label>
                            <div className="grid grid-cols-8 gap-2">
                                {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                                    <Button
                                        key={name}
                                        type="button"
                                        variant={formData.icon === name ? "default" : "outline"}
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Couleur */}
                        <div className="space-y-2">
                            <Label>Couleur</Label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`h-8 w-8 rounded-full transition-all ${formData.color === color
                                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                                            : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-3">
                            <div
                                className="rounded-xl p-2.5"
                                style={{
                                    backgroundColor: formData.color ? `${formData.color}20` : "rgba(59, 130, 246, 0.1)",
                                }}
                            >
                                <ActivityIcon
                                    iconName={formData.icon}
                                    className="h-6 w-6"
                                    style={{ color: formData.color || "#3b82f6" }}
                                />
                            </div>
                            <span className="font-medium">
                                {formData.name || "Aperçu"}
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingType ? "Enregistrer" : "Créer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Confirmation suppression */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer ce type ?</DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible. Les exercices et séances utilisant ce type
                            ne seront pas supprimés mais perdront leur association.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

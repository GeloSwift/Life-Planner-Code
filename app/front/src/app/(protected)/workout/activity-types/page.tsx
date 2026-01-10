"use client";

/**
 * Page de gestion des sports.
 * 
 * Permet de gérer tous les types d'activités sportives
 * (par défaut et personnalisés) dans une liste unifiée.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
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
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { workoutApi } from "@/lib/workout-api";
import { UserActivityType } from "@/lib/workout-types";
import {
    ArrowLeft,
    Plus,
    Star,
    Pencil,
    Trash2,
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
    Search,
    Volleyball,
    type LucideIcon,
} from "lucide-react";

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
    Swords: Swords,
    Medal: Medal,
};

// Liste des icônes pour le sélecteur
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
    { name: "Volleyball", icon: Volleyball, label: "Volley" },
    { name: "Activity", icon: Activity, label: "Autre" },
];

// Couleurs disponibles
const AVAILABLE_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
    "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
    "#a855f7", "#d946ef", "#ec4899",
];

// Composant pour afficher une icône d'activité
function ActivityIcon({ iconName, className = "h-5 w-5", style }: { iconName: string | null; className?: string; style?: React.CSSProperties }) {
    const IconComponent = iconName ? ACTIVITY_ICONS[iconName] : Activity;
    return IconComponent ? <IconComponent className={className} style={style} /> : <Activity className={className} style={style} />;
}

export default function SportsPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();

    const [activityTypes, setActivityTypes] = useState<UserActivityType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");

    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingType, setEditingType] = useState<UserActivityType | null>(null);
    const [formData, setFormData] = useState({ name: "", icon: "Activity", color: "#3b82f6" });

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

    // Filtrer par recherche
    const filteredTypes = activityTypes.filter(type =>
        type.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenCreate = () => {
        setEditingType(null);
        setFormData({ name: "", icon: "Activity", color: "#3b82f6" });
        setShowDialog(true);
    };

    const handleOpenEdit = (type: UserActivityType, e: React.MouseEvent) => {
        e.stopPropagation();
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
                await workoutApi.activityTypes.update(editingType.id, {
                    name: formData.name,
                    icon: formData.icon || undefined,
                    color: formData.color || undefined,
                });
                success("Sport modifié ✏️");
            } else {
                await workoutApi.activityTypes.create({
                    name: formData.name,
                    icon: formData.icon || undefined,
                    color: formData.color || undefined,
                });
                success("Sport créé ✨");
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
            success("Sport supprimé 🗑️");
            setShowDeleteConfirm(false);
            setTypeToDelete(null);
            loadActivityTypes();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur lors de la suppression");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleFavorite = async (type: UserActivityType, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await workoutApi.activityTypes.toggleFavorite(type.id);
            success(type.is_favorite ? "Favori retiré" : "Marqué comme favori ⭐");
            loadActivityTypes();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Erreur");
        }
    };

    const handleDeleteClick = (type: UserActivityType, e: React.MouseEvent) => {
        e.stopPropagation();
        setTypeToDelete(type);
        setShowDeleteConfirm(true);
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
                                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                                Sports
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Gérez vos activités sportives
                            </p>
                        </div>
                        <Button onClick={handleOpenCreate} size="sm">
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Nouveau sport</span>
                            <span className="sm:hidden">Nouveau</span>
                        </Button>
                    </div>
                </section>

                {/* Barre de recherche */}
                <section className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un sport..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </section>

                {/* Liste des sports */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredTypes.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {search ? "Aucun sport ne correspond à votre recherche" : "Aucun sport disponible"}
                            </p>
                            <Button className="mt-4" onClick={handleOpenCreate}>
                                <Plus className="h-4 w-4 mr-2" />
                                Créer un sport
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTypes.map(type => (
                            <Card
                                key={type.id}
                                className="group cursor-pointer hover:shadow-md transition-all duration-200"
                                onClick={(e) => handleOpenEdit(type, e)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Icône */}
                                        <div
                                            className="rounded-xl p-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                                            style={{
                                                backgroundColor: type.color ? `${type.color}20` : "rgba(59, 130, 246, 0.1)",
                                            }}
                                        >
                                            <ActivityIcon
                                                iconName={type.icon}
                                                className="h-6 w-6"
                                                style={{ color: type.color || "#3b82f6" }}
                                            />
                                        </div>

                                        {/* Infos */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold truncate">{type.name}</p>
                                                {type.is_favorite && (
                                                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" fill="currentColor" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {type.is_default ? "Par défaut" : "Personnalisé"}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${type.is_favorite ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                                                onClick={(e) => handleToggleFavorite(type, e)}
                                            >
                                                <Star
                                                    className="h-4 w-4"
                                                    fill={type.is_favorite ? "currentColor" : "none"}
                                                />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => handleOpenEdit(type, e)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {!type.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={(e) => handleDeleteClick(type, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Footer />

            {/* Dialog Create/Edit */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingType ? "Modifier le sport" : "Nouveau sport"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingType
                                ? "Modifiez les informations de ce sport"
                                : "Créez un nouveau sport personnalisé"}
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
                            <div className="grid grid-cols-9 gap-1.5">
                                {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                                    <Button
                                        key={name}
                                        type="button"
                                        variant={formData.icon === name ? "default" : "outline"}
                                        size="icon"
                                        className="h-8 w-8"
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
                                        className={`h-7 w-7 rounded-full transition-all ${formData.color === color
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
                        <DialogTitle>Supprimer ce sport ?</DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible. Les exercices et séances utilisant ce sport
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

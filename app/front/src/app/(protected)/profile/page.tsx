"use client";

/**
 * Page de profil utilisateur.
 * 
 * Affiche et permet de modifier les informations du compte utilisateur :
 * - Photo de profil (upload)
 * - Nom complet (username)
 * - Mot de passe (si connecté avec email/password)
 */

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { 
  Loader2, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  ArrowLeft, 
  Upload,
  Check,
  X,
  Camera
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  
  // États pour les formulaires
  const [fullName, setFullName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialise les valeurs depuis l'utilisateur
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
    }
  }, [user]);

  // Redirige vers login si non authentifié (après le chargement)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLocalAuth = user.auth_provider === "local";

  // Gestion de l'upload d'avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifie le type de fichier
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    // Vérifie la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Convertit l'image en base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await authApi.updateAvatar(base64String);
          await refreshUser();
          alert("Photo de profil mise à jour avec succès !");
        } catch (error) {
          console.error("Erreur lors de la mise à jour de l'avatar:", error);
          alert("Erreur lors de la mise à jour de la photo de profil");
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier:", error);
      alert("Erreur lors de la lecture du fichier");
      setIsUploadingAvatar(false);
    }
  };

  // Gestion de la mise à jour du nom
  const handleUpdateName = async () => {
    if (fullName.trim() === user.full_name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      await authApi.updateMe({ full_name: fullName.trim() || null });
      await refreshUser();
      setIsEditingName(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du nom:", error);
      alert("Erreur lors de la mise à jour du nom");
    } finally {
      setIsSavingName(false);
    }
  };

  // Gestion de la mise à jour du mot de passe
  const handleUpdatePassword = async () => {
    setPasswordError("");

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Tous les champs sont requis");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSavingPassword(true);
    try {
      // Note: L'API actuelle ne vérifie pas l'ancien mot de passe
      // Pour une sécurité complète, il faudrait ajouter cette vérification côté backend
      await authApi.updateMe({ password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
      alert("Mot de passe mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      setPasswordError("Erreur lors de la mise à jour du mot de passe");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header de la page */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
          <p className="mt-2 text-muted-foreground">
            Gérez vos informations personnelles et les paramètres de votre compte
          </p>
        </div>

        {/* Avatar et nom */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
            <CardDescription>
              Votre photo de profil est visible par vous uniquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    className="h-24 w-24 rounded-full border-2 border-primary/20 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground border-2 border-primary/20">
                    <User className="h-12 w-12" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  title="Changer la photo"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-lg font-semibold">{user.full_name || "Utilisateur"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de modification du nom */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nom complet</CardTitle>
            <CardDescription>
              Modifiez votre nom d'affichage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingName ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom complet"
                    disabled={isSavingName}
                  />
                </div>
                <Button
                  onClick={handleUpdateName}
                  disabled={isSavingName}
                  size="icon"
                >
                  {isSavingName ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setFullName(user.full_name || "");
                    setIsEditingName(false);
                  }}
                  disabled={isSavingName}
                  variant="outline"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-base font-medium">
                  {user.full_name || "Non renseigné"}
                </p>
                <Button
                  onClick={() => setIsEditingName(true)}
                  variant="outline"
                  size="sm"
                >
                  Modifier
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulaire de modification du mot de passe (seulement pour les utilisateurs locaux) */}
        {isLocalAuth && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>
                Modifiez votre mot de passe (minimum 8 caractères)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditingPassword ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Votre mot de passe actuel"
                      disabled={isSavingPassword}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      disabled={isSavingPassword}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez votre nouveau mot de passe"
                      disabled={isSavingPassword}
                      className="mt-1"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdatePassword}
                      disabled={isSavingPassword}
                    >
                      {isSavingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError("");
                        setIsEditingPassword(false);
                      }}
                      disabled={isSavingPassword}
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium">••••••••</p>
                  <Button
                    onClick={() => setIsEditingPassword(true)}
                    variant="outline"
                    size="sm"
                  >
                    Modifier
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informations du compte */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>
              Détails de votre compte et méthode de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-1 text-base font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Méthode de connexion</p>
                <p className="mt-1 text-base font-medium capitalize">
                  {user.auth_provider === "google" ? "Google" : "Email et mot de passe"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Compte créé le</p>
                <p className="mt-1 text-base font-medium">
                  {new Date(user.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email vérifié</p>
                <p className="mt-1 text-base font-medium">
                  {user.is_email_verified ? (
                    <span className="text-green-600 dark:text-green-400">✅ Oui</span>
                  ) : (
                    <span className="text-muted-foreground">❌ Non</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

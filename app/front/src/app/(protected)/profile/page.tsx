"use client";

/**
 * Page de profil utilisateur.
 * 
 * Affiche et permet de modifier les informations du compte utilisateur :
 * - Photo de profil (upload)
 * - Nom complet (username)
 * - Mot de passe (si connecté avec email/password)
 */

import { useRouter, useSearchParams } from "next/navigation";
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
  Check,
  X,
  Camera,
  CheckCircle2,
  Send
} from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/toast";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, success, error, warning, closeToast } = useToast();
  
  // États pour les formulaires
  const [fullName, setFullName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyEmailButtonRef = useRef<HTMLButtonElement>(null);
  
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

  // Gère la redirection depuis d'autres pages (email non vérifié)
  useEffect(() => {
    const emailNotVerified = searchParams.get("email_not_verified");
    
    if (emailNotVerified === "true" && user && !user.is_email_verified && user.auth_provider === "local") {
      // Affiche un toast de warning
      warning("Veuillez vérifier votre email pour accéder à toutes les fonctionnalités.");
      
      // Scroll vers le bouton de vérification après un court délai
      setTimeout(() => {
        verifyEmailButtonRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        });
      }, 300);
      
      // Nettoie l'URL pour éviter de réafficher le toast au rechargement
      router.replace("/profile", { scroll: false });
    }
  }, [searchParams, user, warning, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLocalAuth = user.auth_provider === "local";

  // Fonction pour compresser l'image
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calcule les nouvelles dimensions en gardant le ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Impossible de créer le contexte canvas"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Gestion de l'upload d'avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifie le type de fichier
    if (!file.type.startsWith("image/")) {
      error("Veuillez sélectionner une image");
      return;
    }

    // Vérifie la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Compresse l'image avant l'upload (max 400px de largeur, qualité 80%)
      const compressedBase64 = await compressImage(file, 400, 0.8);
      
      // Vérifie que la taille compressée n'est pas trop grande (max 200KB en base64 ≈ 150KB réels)
      if (compressedBase64.length > 200 * 1024) {
        // Re-compresse avec une qualité plus faible
        const moreCompressed = await compressImage(file, 300, 0.6);
        await authApi.updateAvatar(moreCompressed);
      } else {
        await authApi.updateAvatar(compressedBase64);
      }
      
      await refreshUser();
      success("Photo de profil mise à jour avec succès !");
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'avatar:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      error(`Erreur lors de la mise à jour de la photo de profil: ${errorMessage}`);
    } finally {
      setIsUploadingAvatar(false);
      // Réinitialise l'input pour permettre de sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      await authApi.updateMe({ full_name: fullName.trim() || undefined });
      await refreshUser();
      setIsEditingName(false);
      success("Nom mis à jour avec succès !");
    } catch (err) {
      console.error("Erreur lors de la mise à jour du nom:", err);
      error("Erreur lors de la mise à jour du nom");
    } finally {
      setIsSavingName(false);
    }
  };

  // Gestion de l'envoi de l'email de réinitialisation de mot de passe
  const handleRequestPasswordReset = async () => {
    setIsSendingPasswordReset(true);
    setPasswordResetSent(false);
    try {
      await authApi.requestPasswordReset(user.email);
      setPasswordResetSent(true);
      success("Email de réinitialisation envoyé ! Vérifiez votre boîte de réception (et vos spams).");
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email de réinitialisation:", err);
      error("Erreur lors de l'envoi de l'email de réinitialisation");
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header de la page */}
        <div className="mb-8">
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
              Modifiez votre nom d&apos;affichage
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

        {/* Réinitialisation du mot de passe (seulement pour les utilisateurs locaux) */}
        {isLocalAuth && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>
                Réinitialisez votre mot de passe en recevant un lien par email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordResetSent ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950 p-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Email envoyé !
                      </p>
                      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                        Un lien de réinitialisation a été envoyé à <strong>{user.email}</strong>.
                        Vérifiez votre boîte de réception (et vos spams).
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setPasswordResetSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Envoyer un nouvel email
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium">••••••••</p>
                  <Button
                    onClick={handleRequestPasswordReset}
                    disabled={isSendingPasswordReset}
                    variant="outline"
                    size="sm"
                  >
                    {isSendingPasswordReset ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Réinitialiser
                      </>
                    )}
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
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-1 text-base font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Méthode de connexion</p>
                <p className="mt-1 text-base font-medium capitalize">
                  {user.auth_provider === "google" ? "Google" : "Connexion Classique"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
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

            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email vérifié</p>
                <div className="mt-1 flex items-center gap-2">
                  {user.is_email_verified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-base font-medium text-green-600 dark:text-green-400">Oui</span>
                    </>
                  ) : (
                    <Button
                      ref={verifyEmailButtonRef}
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await authApi.sendVerificationEmail();
                          success("Email de vérification envoyé ! Vérifiez votre boîte de réception (et vos spams).");
                        } catch (err) {
                          console.error("Erreur lors de l'envoi de l'email:", err);
                          error("Erreur lors de l'envoi de l'email de vérification");
                        }
                      }}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Vérifier mon email
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>

      <Footer />
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

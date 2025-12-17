"use client";

/**
 * Page de réinitialisation de mot de passe.
 * 
 * Cette page est appelée quand l'utilisateur clique sur le lien
 * de réinitialisation reçu par email.
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, CheckCircle2, XCircle, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast, ToastContainer } from "@/components/ui/toast";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toasts, success, error, closeToast } = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    
    if (!tokenParam) {
      setStatus("error");
      setMessage("Token de réinitialisation manquant");
      return;
    }

    setToken(tokenParam);
    setStatus("form");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Validations
    if (!newPassword || !confirmPassword) {
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

    if (!token) {
      setPasswordError("Token manquant");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword(token, newPassword);
      setStatus("success");
      setMessage(response.message);
      success("Mot de passe réinitialisé avec succès !");
      // Redirige vers login après 3 secondes
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setStatus("error");
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la réinitialisation";
      setMessage(errorMessage);
      error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="default" />
      
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              {status === "loading" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <CardTitle>Chargement...</CardTitle>
                  <CardDescription>
                    Vérification du token de réinitialisation
                  </CardDescription>
                </>
              )}
              
              {status === "form" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Nouveau mot de passe</CardTitle>
                  <CardDescription>
                    Entrez votre nouveau mot de passe
                  </CardDescription>
                </>
              )}
              
              {status === "success" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Mot de passe réinitialisé !</CardTitle>
                  <CardDescription>
                    {message || "Votre mot de passe a été réinitialisé avec succès"}
                  </CardDescription>
                </>
              )}
              
              {status === "error" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Erreur de réinitialisation</CardTitle>
                  <CardDescription>
                    {message || "Le lien de réinitialisation est invalide ou a expiré"}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {status === "form" && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <PasswordInput
                      id="new-password"
                      placeholder="Minimum 8 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <PasswordInput
                      id="confirm-password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {passwordError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Réinitialisation...
                      </>
                    ) : (
                      "Réinitialiser le mot de passe"
                    )}
                  </Button>
                </form>
              )}
              
              {status === "success" && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Redirection vers la page de connexion dans quelques secondes...
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/login">Se connecter maintenant</Link>
                  </Button>
                </div>
              )}
              
              {status === "error" && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Le lien de réinitialisation peut avoir expiré ou être invalide.
                    Vous pouvez demander un nouvel email de réinitialisation.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild className="flex-1">
                      <Link href="/">Retour à l&apos;accueil</Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href="/forgot-password">Nouveau lien</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}


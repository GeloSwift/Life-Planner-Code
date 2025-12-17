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
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, CheckCircle2, XCircle, Lock, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { useToast, ToastContainer } from "@/components/ui/toast";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout } = useAuth();
  const { toasts, success, error, closeToast } = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Validation du mot de passe (identique à register)
  const passwordRequirements = [
    { met: newPassword.length >= 8, label: "Au moins 8 caractères" },
    { met: /[A-Z]/.test(newPassword), label: "Une lettre majuscule" },
    { met: /[a-z]/.test(newPassword), label: "Une lettre minuscule" },
    { met: /[0-9]/.test(newPassword), label: "Un chiffre" },
  ];
  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const doPasswordsMatch = newPassword === confirmPassword && newPassword.length > 0;

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

    if (!isPasswordValid) {
      setPasswordError("Le mot de passe ne respecte pas les critères requis");
      return;
    }

    if (!doPasswordsMatch) {
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
      
      // Déconnecte l'utilisateur et redirige immédiatement vers login
      try {
        await logout();
      } catch (logoutErr) {
        // Ignore les erreurs de logout (peut-être pas connecté)
        console.log("Logout error (ignored):", logoutErr);
      }
      
      // Redirige immédiatement vers login
      router.replace("/login");
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
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className={`h-12 transition-all ${
                        newPassword.length > 0 && !isPasswordValid
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      required
                      autoComplete="new-password"
                    />
                    {/* Password requirements with animation */}
                    {newPassword.length > 0 && (
                      <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {passwordRequirements.map((req, index) => (
                          <div
                            key={req.label}
                            className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                              req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                            }`}
                            style={{ transitionDelay: `${index * 50}ms` }}
                          >
                            <div className={`rounded-full p-0.5 transition-all ${
                              req.met ? "bg-green-600 dark:bg-green-400" : "bg-muted"
                            }`}>
                              <Check className={`h-2 w-2 text-white transition-all ${req.met ? "scale-100" : "scale-0"}`} />
                            </div>
                            {req.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <PasswordInput
                      id="confirm-password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className={`h-12 transition-all ${
                        confirmPassword.length > 0 && !doPasswordsMatch
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      required
                      autoComplete="new-password"
                    />
                    {confirmPassword.length > 0 && !doPasswordsMatch && (
                      <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                    {confirmPassword.length > 0 && doPasswordsMatch && (
                      <p className="text-xs text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Les mots de passe correspondent
                      </p>
                    )}
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {passwordError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
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
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-center text-sm text-muted-foreground">
                      Mot de passe réinitialisé avec succès. Redirection en cours...
                    </p>
                  </div>
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


"use client";

/**
 * Page de demande de réinitialisation de mot de passe.
 * 
 * L'utilisateur entre son email et reçoit un lien de réinitialisation.
 */

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast, ToastContainer } from "@/components/ui/toast";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const { toasts, success, error, closeToast } = useToast();
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animation d'entrée
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pré-remplit l'email si fourni dans l'URL
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authApi.requestPasswordReset(email);
      setIsSuccess(true);
      success("Email de réinitialisation envoyé ! Vérifiez votre boîte de réception (et vos spams).");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left side - Decorative */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-pulse delay-1000" />
        <div 
          className={`relative flex h-full flex-col justify-between p-12 text-primary-foreground transition-all duration-700 ${
            mounted ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
          }`}
        >
          <Link href="/" className="w-fit">
            <h1 className="text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity cursor-pointer">
              Life Planner
            </h1>
          </Link>
          <div className="space-y-4">
            <blockquote className="text-xl font-medium leading-relaxed">
              &ldquo;Un mot de passe oublié n&apos;est pas la fin du monde. 
              C&apos;est juste un nouveau départ.&rdquo;
            </blockquote>
          </div>
          <div className="text-sm opacity-70">
            Réinitialisez votre mot de passe en toute sécurité
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <Card 
          className={`w-full max-w-md border-0 shadow-none transition-all duration-500 lg:border lg:shadow-sm ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <CardHeader className="space-y-1 text-center">
            <Link href="/" className="mb-4 lg:hidden block">
              <h1 className="gradient-text text-2xl font-bold hover:opacity-80 transition-opacity">
                Life Planner
              </h1>
            </Link>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Mot de passe oublié ?
            </CardTitle>
            <CardDescription>
              {isSuccess 
                ? "Vérifiez votre boîte email" 
                : "Entrez votre email pour recevoir un lien de réinitialisation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isSuccess ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 rounded-lg bg-green-50 dark:bg-green-950 p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Email envoyé !
                    </h3>
                    <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                      Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
                      Vérifiez aussi vos spams.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour à la connexion
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={handleSubmit} 
                className={`space-y-4 transition-all duration-500 delay-200 ${
                  mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-10 transition-all focus:scale-[1.01]"
                      required
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien de réinitialisation"
                  )}
                </Button>
              </form>
            )}

            <div 
              className={`transition-all duration-500 delay-300 ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <p className="text-center text-sm text-muted-foreground">
                Vous vous souvenez de votre mot de passe ?{" "}
                <Link 
                  href="/login" 
                  className="font-medium text-primary hover:underline"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}


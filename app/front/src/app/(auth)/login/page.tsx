"use client";

/**
 * Page de connexion.
 * 
 * Fonctionnalités:
 * - Formulaire email/mot de passe avec toggle visibilité
 * - Bouton OAuth Google
 * - Gestion des erreurs
 * - Redirection automatique si déjà connecté
 * - Toggle mode sombre
 * - Animations de transition directionnelles
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { GoogleIcon } from "@/components/icons/oauth-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({ google: false });
  const [mounted, setMounted] = useState(false);
  
  // Direction de l'animation (from=register signifie qu'on vient de register, donc animation vers la gauche)
  const fromRegister = searchParams.get("from") === "register";

  // Animation d'entrée
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirige si déjà connecté (avant le rendu pour éviter le flash)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Ne rend rien tant que l'auth est en cours de chargement ou si déjà connecté
  if (authLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Charge les providers OAuth disponibles
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/providers`
        );
        if (response.ok) {
          const data = await response.json();
          setOauthProviders(data);
        }
      } catch {
        // Ignore l'erreur, on n'affiche pas les boutons OAuth
      }
    };
    loadProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur avec Google");
    }
  };

  // Loading state pendant la vérification de l'auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Classes d'animation selon la direction
  const slideInClass = fromRegister
    ? "translate-x-0 opacity-100"
    : "translate-x-0 opacity-100";
  const slideOutClass = fromRegister
    ? "translate-x-10 opacity-0"
    : "-translate-x-10 opacity-0";

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
        {/* Animated circles */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-pulse delay-1000" />
        <div 
          className={`relative flex h-full flex-col justify-between p-12 text-primary-foreground transition-all duration-700 ${
            mounted ? slideInClass : slideOutClass
          }`}
        >
          <Link href="/" className="w-fit">
            <h1 className="text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity cursor-pointer">
              Life Planner
            </h1>
          </Link>
          <div className="space-y-4">
            <blockquote className="text-xl font-medium leading-relaxed">
              &ldquo;Le meilleur moment pour planter un arbre était il y a 20 ans. 
              Le deuxième meilleur moment, c&apos;est maintenant.&rdquo;
            </blockquote>
            <p className="text-sm opacity-80">— Proverbe chinois</p>
          </div>
          <div className="text-sm opacity-70">
            Planifiez. Organisez. Accomplissez.
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
              Bon retour parmi nous
            </CardTitle>
            <CardDescription>
              Connectez-vous à votre compte pour continuer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OAuth Buttons */}
            {oauthProviders.google && (
              <div 
                className={`space-y-4 transition-all duration-500 delay-100 ${
                  mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <Button
                  variant="outline"
                  className="h-12 w-full gap-3 text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <GoogleIcon className="h-5 w-5" />
                  Continuer avec Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      ou avec email
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email/Password Form */}
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <span className="text-sm text-muted-foreground cursor-not-allowed opacity-50">
                    Mot de passe oublié ?
                  </span>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10 transition-all focus:scale-[1.01]"
                    required
                    autoComplete="current-password"
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
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div 
              className={`transition-all duration-500 delay-300 ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <p className="text-center text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link 
                  href="/register?from=login" 
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline group"
                >
                  Créer un compte
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

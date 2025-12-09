"use client";

/**
 * Page d'inscription.
 * 
 * Fonctionnalités:
 * - Formulaire nom/email/mot de passe
 * - Bouton OAuth Google
 * - Validation du mot de passe (min 8 caractères)
 * - Gestion des erreurs
 * - Redirection automatique si déjà connecté
 * - Toggle mode sombre
 * - Animations de transition
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, User, AlertCircle, Check, ArrowLeft } from "lucide-react";
import { GoogleIcon } from "@/components/icons/oauth-icons";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({ google: false });
  const [mounted, setMounted] = useState(false);

  // Animation d'entrée
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validation du mot de passe
  const passwordRequirements = [
    { met: password.length >= 8, label: "Au moins 8 caractères" },
    { met: /[A-Z]/.test(password), label: "Une lettre majuscule" },
    { met: /[a-z]/.test(password), label: "Une lettre minuscule" },
    { met: /[0-9]/.test(password), label: "Un chiffre" },
  ];
  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const doPasswordsMatch = password === confirmPassword && password.length > 0;

  // Redirige si déjà connecté
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

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
        // Ignore l'erreur
      }
    };
    loadProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas les critères requis");
      return;
    }

    if (!doPasswordsMatch) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, fullName || undefined);
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

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left side - Form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <Card 
          className={`w-full max-w-md border-0 shadow-none transition-all duration-500 lg:border lg:shadow-sm ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <CardHeader className="space-y-1 text-center">
            <div className="mb-4 lg:hidden">
              <h1 className="gradient-text text-2xl font-bold">Life Planner</h1>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Créer un compte
            </CardTitle>
            <CardDescription>
              Commencez à planifier votre vie dès aujourd&apos;hui
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
                  S&apos;inscrire avec Google
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

            {/* Registration Form */}
            <form 
              onSubmit={handleSubmit} 
              className={`space-y-4 transition-all duration-500 delay-200 ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 pl-10 transition-all focus:scale-[1.01]"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
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
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10 transition-all focus:scale-[1.01]"
                    required
                    autoComplete="new-password"
                  />
                </div>
                {/* Password requirements with animation */}
                {password.length > 0 && (
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
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-12 pl-10 transition-all focus:scale-[1.01] ${
                      confirmPassword.length > 0 && !doPasswordsMatch
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    required
                    autoComplete="new-password"
                  />
                </div>
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

              <Button
                type="submit"
                className="h-12 w-full text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>

            <div 
              className={`space-y-4 transition-all duration-500 delay-300 ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <p className="text-center text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline group"
                >
                  <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                  Se connecter
                </Link>
              </p>

              <p className="text-center text-xs text-muted-foreground">
                En créant un compte, vous acceptez nos{" "}
                <span className="underline cursor-pointer hover:text-foreground">
                  Conditions d&apos;utilisation
                </span>{" "}
                et notre{" "}
                <span className="underline cursor-pointer hover:text-foreground">
                  Politique de confidentialité
                </span>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Decorative */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-bl from-accent via-accent/80 to-primary" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        {/* Animated circles */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse delay-1000" />
        <div 
          className={`relative flex h-full flex-col justify-between p-12 text-white transition-all duration-700 ${
            mounted ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
          }`}
        >
          <div className="text-right">
            <h1 className="text-3xl font-bold tracking-tight">Life Planner</h1>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Transformez vos rêves<br />en plans d&apos;action
            </h2>
            <ul className="space-y-3 text-white/90">
              {[
                "Suivi de vos habitudes quotidiennes",
                "Gestion de vos objectifs",
                "Planification de vos séances de sport",
                "Suivi de votre budget",
              ].map((item, index) => (
                <li 
                  key={item}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    mounted ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="rounded-full bg-white/20 p-1">
                    <Check className="h-4 w-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-sm opacity-70">
            Rejoignez des milliers d&apos;utilisateurs
          </div>
        </div>
      </div>
    </div>
  );
}

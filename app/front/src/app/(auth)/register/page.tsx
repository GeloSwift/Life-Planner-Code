"use client";

/**
 * Page d'inscription.
 * 
 * Fonctionnalités:
 * - Formulaire nom/email/mot de passe
 * - Boutons OAuth (Google, Apple)
 * - Validation du mot de passe (min 8 caractères)
 * - Gestion des erreurs
 * - Redirection automatique si déjà connecté
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, User, AlertCircle, Check } from "lucide-react";
import { GoogleIcon, AppleIcon } from "@/components/icons/oauth-icons";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithApple, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({ google: false, apple: false });

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

  const handleAppleLogin = async () => {
    setError(null);
    try {
      await loginWithApple();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur avec Apple");
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
      {/* Left side - Form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
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
            {(oauthProviders.google || oauthProviders.apple) && (
              <>
                <div className="grid gap-3">
                  {oauthProviders.google && (
                    <Button
                      variant="outline"
                      className="h-12 gap-3 text-base"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <GoogleIcon className="h-5 w-5" />
                      S&apos;inscrire avec Google
                    </Button>
                  )}
                  {oauthProviders.apple && (
                    <Button
                      variant="outline"
                      className="h-12 gap-3 text-base"
                      onClick={handleAppleLogin}
                      disabled={isLoading}
                    >
                      <AppleIcon className="h-5 w-5" />
                      S&apos;inscrire avec Apple
                    </Button>
                  )}
                </div>

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
              </>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 pl-10"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                    required
                    autoComplete="new-password"
                  />
                </div>
                {/* Password requirements */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req) => (
                      <div
                        key={req.label}
                        className={`flex items-center gap-2 text-xs ${
                          req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`}
                      >
                        <Check className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-12 pl-10 ${
                      confirmPassword.length > 0 && !doPasswordsMatch
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword.length > 0 && !doPasswordsMatch && (
                  <p className="text-xs text-destructive">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-12 w-full text-base font-medium"
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

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Se connecter
              </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                Conditions d&apos;utilisation
              </Link>{" "}
              et notre{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Politique de confidentialité
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Decorative */}
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-gradient-to-bl from-accent via-accent/80 to-primary" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="text-right">
            <h1 className="text-3xl font-bold tracking-tight">Life Planner</h1>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Transformez vos rêves<br />en plans d&apos;action
            </h2>
            <ul className="space-y-3 text-white/90">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5" />
                Suivi de vos habitudes quotidiennes
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5" />
                Gestion de vos objectifs
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5" />
                Planification de vos séances de sport
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5" />
                Suivi de votre budget
              </li>
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


"use client";

/**
 * Page de profil utilisateur.
 * 
 * Affiche et permet de modifier les informations du compte utilisateur.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Loader2, User, Mail, Calendar, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

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
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.email}
                  className="h-24 w-24 rounded-full border-2 border-primary/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground border-2 border-primary/20">
                  <User className="h-12 w-12" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">{user.full_name || "Utilisateur"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
                <p className="mt-1 text-base font-medium">
                  {user.full_name || "Non renseigné"}
                </p>
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

            <div className="flex items-start gap-4 sm:col-span-2">
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
          <Button variant="outline" disabled>
            Modifier le profil (bientôt disponible)
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}


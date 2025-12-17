"use client";

/**
 * Page Dashboard - Page d'accueil après connexion.
 * 
 * Cette page est protégée et nécessite une authentification.
 * Le middleware redirige vers /login si non connecté.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import {
  Loader2,
  Dumbbell,
  Utensils,
  Wallet,
  CheckSquare,
  Calendar,
  TrendingUp,
  Hand,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirige vers login si non authentifié (après le chargement)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    
    // Redirige vers le profil si l'email n'est pas vérifié (sauf pour OAuth)
    if (!isLoading && user && !user.is_email_verified && user.auth_provider === "local") {
      router.replace("/profile");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: Dumbbell,
      title: "Séances de Sport",
      description: "Planifiez et suivez vos entraînements",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      href: "/workout",
    },
    {
      icon: Utensils,
      title: "Recettes",
      description: "Gérez vos repas et listes de courses",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      href: "/recipes",
    },
    {
      icon: Wallet,
      title: "Budget",
      description: "Suivez vos dépenses et économies",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      href: "/budget",
    },
    {
      icon: CheckSquare,
      title: "Habitudes",
      description: "Construisez de bonnes habitudes",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      href: "/habits",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="sticky" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            <span>Bienvenue{user.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}</span>
            <Hand className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Voici un aperçu de votre journée. Prêt à atteindre vos objectifs ?
          </p>
        </section>

        {/* Quick Stats */}
        <section className="mb-8 sm:mb-12 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="rounded-full bg-primary/10 p-2 sm:p-3 shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Jour actuel</p>
                <p className="text-xl sm:text-2xl font-bold truncate">
                  {new Date().toLocaleDateString("fr-FR", { weekday: "long" })}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="rounded-full bg-green-500/10 p-2 sm:p-3 shrink-0">
                <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Habitudes du jour</p>
                <p className="text-xl sm:text-2xl font-bold">0/0</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="rounded-full bg-red-500/10 p-2 sm:p-3 shrink-0">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Séances cette semaine</p>
                <p className="text-xl sm:text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="rounded-full bg-blue-500/10 p-2 sm:p-3 shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Série actuelle</p>
                <p className="text-xl sm:text-2xl font-bold">0 jours</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features Grid */}
        <section>
          <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold">Modules</h3>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => router.push(feature.href)}
              >
                <CardHeader>
                  <div className={`mb-2 w-fit rounded-lg p-2 ${feature.bgColor}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-start group-hover:text-primary">
                    Ouvrir →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


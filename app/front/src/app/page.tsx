"use client";

/**
 * Page d'accueil (Landing Page).
 * 
 * Affiche une présentation de l'application avec des CTA
 * pour se connecter ou créer un compte.
 */

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Loader2,
  Dumbbell,
  Utensils,
  Wallet,
  CheckSquare,
  ArrowRight,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: Dumbbell,
      title: "Sport & Fitness",
      description: "Planifiez vos séances et suivez vos progrès",
    },
    {
      icon: Utensils,
      title: "Nutrition",
      description: "Gérez vos repas et listes de courses",
    },
    {
      icon: Wallet,
      title: "Budget",
      description: "Suivez vos finances et économisez",
    },
    {
      icon: CheckSquare,
      title: "Habitudes",
      description: "Construisez des routines durables",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <Link href="/" className="gradient-text text-2xl font-bold">
          Life Planner
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.full_name || user.email}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Commencer</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center lg:py-32">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Votre assistant de vie personnel
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Organisez votre vie,{" "}
            <span className="gradient-text">atteignez vos objectifs</span>
          </h2>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Life Planner regroupe tous les outils dont vous avez besoin pour 
            planifier votre sport, gérer votre budget, suivre vos habitudes 
            et atteindre vos objectifs.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            {isAuthenticated ? (
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/dashboard">
                  Accéder au tableau de bord
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/register">
                    Créer un compte gratuit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/login">Se connecter</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tout ce dont vous avez besoin
          </h3>
          <p className="mt-2 text-muted-foreground">
            Une application, tous vos objectifs
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 font-semibold">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-16 text-center text-primary-foreground sm:px-16">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <div className="relative z-10">
            {isAuthenticated && user ? (
              <>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Bienvenue, {user.full_name || "Champion"} ! 🎉
                </h3>
                <p className="mx-auto mt-4 max-w-xl opacity-90">
                  Votre compte est prêt. Accédez à votre tableau de bord pour 
                  commencer à planifier votre vie et atteindre vos objectifs.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-8 h-12 px-8 text-base"
                  asChild
                >
                  <Link href="/dashboard">
                    Mon tableau de bord
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Prêt à transformer votre vie ?
                </h3>
                <p className="mx-auto mt-4 max-w-xl opacity-90">
                  Rejoignez des milliers de personnes qui utilisent Life Planner 
                  pour atteindre leurs objectifs au quotidien.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-8 h-12 px-8 text-base"
                  asChild
                >
                  <Link href="/register">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <p>© 2024 Life Planner. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

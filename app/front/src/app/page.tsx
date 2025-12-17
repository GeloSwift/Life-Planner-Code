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
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import {
  Loader2,
  Dumbbell,
  Utensils,
  Wallet,
  CheckSquare,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

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
    {
      icon: GraduationCap,
      title: "Révision de cours",
      description: "Résumez en cartes mentales et quizz interactifs",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center lg:py-32">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Votre assistant de vie personnel
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Organisez votre vie,{" "}
            <span className="gradient-text">atteignez vos objectifs</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Life Planner regroupe tous les outils dont vous avez besoin pour 
            planifier votre sport, gérer votre budget, suivre vos habitudes, 
            réviser vos cours et atteindre vos objectifs.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
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
                    Créer un compte
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
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Une application, tous vos objectifs
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex w-fit rounded-xl bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

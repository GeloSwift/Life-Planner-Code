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
      href: "/workout",
    },
    {
      icon: Utensils,
      title: "Nutrition",
      description: "Gérez vos repas et listes de courses",
      href: "/recipes",
    },
    {
      icon: Wallet,
      title: "Budget",
      description: "Suivez vos finances et économisez",
      href: "/budget",
    },
    {
      icon: CheckSquare,
      title: "Habitudes",
      description: "Construisez des routines durables",
      href: "/habits",
    },
    {
      icon: GraduationCap,
      title: "Révision de cours",
      description: "Résumez en cartes mentales et quizz interactifs",
      href: "/revision",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 text-center lg:py-32">
        <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 sm:px-4 text-xs sm:text-sm font-medium text-primary">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">Votre assistant de vie personnel</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Organisez votre vie,{" "}
            <span className="gradient-text">atteignez vos objectifs</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground px-2 sm:px-0">
            Life Planner regroupe tous les outils dont vous avez besoin pour 
            planifier votre sport, gérer votre budget, suivre vos habitudes, 
            réviser vos cours et atteindre vos objectifs.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 pt-2 sm:flex-row">
            {isAuthenticated ? (
              <Button size="lg" className="h-11 sm:h-12 w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base" asChild>
                <Link href="/dashboard">
                  Accéder au tableau de bord
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="h-11 sm:h-12 w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base" asChild>
                  <Link href="/register">
                    Créer un compte
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-11 sm:h-12 w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base" asChild>
                  <Link href="/login">Se connecter</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        <div className="mb-12 sm:mb-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            Une application, tous vos objectifs
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((feature, index) => (
            <Link
              key={feature.title}
              href={isAuthenticated ? feature.href : "/login"}
              className="group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex w-fit rounded-xl bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

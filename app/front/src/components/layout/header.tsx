"use client";

/**
 * Header réutilisable pour toutes les pages.
 * 
 * Affiche le logo, le toggle de thème, et les actions utilisateur
 * selon l'état d'authentification.
 */

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, LogOut } from "lucide-react";

interface HeaderProps {
  /**
   * Variante du header :
   * - "default" : Header standard avec navigation
   * - "sticky" : Header sticky avec backdrop blur (pour dashboard)
   */
  variant?: "default" | "sticky";
}

export function Header({ variant = "default" }: HeaderProps) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const headerClasses =
    variant === "sticky"
      ? "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm"
      : "";

  const containerClasses =
    variant === "sticky"
      ? "container mx-auto flex h-16 items-center justify-between px-4"
      : "container mx-auto flex items-center justify-between px-4 py-6";

  return (
    <header className={headerClasses}>
      <div className={containerClasses}>
        <Link href="/" className="gradient-text text-2xl font-bold hover:opacity-80 transition-opacity">
          Life Planner
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {isAuthenticated && user && !isLoading ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{user.full_name || user.email}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Déconnexion"
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Déconnexion</span>
              </Button>
            </>
          ) : !isLoading ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Commencer</Link>
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}


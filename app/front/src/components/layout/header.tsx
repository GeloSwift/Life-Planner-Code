"use client";

/**
 * Header réutilisable pour toutes les pages.
 * 
 * Affiche le logo, le toggle de thème, et les actions utilisateur
 * selon l'état d'authentification.
 * Sur mobile, les boutons sont dans un menu burger.
 */

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User, LogOut, Menu } from "lucide-react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const headerClasses =
    variant === "sticky"
      ? "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm"
      : "";

  const containerClasses =
    "container mx-auto flex items-center justify-between px-4 py-6";

  // Navigation pour utilisateur authentifié
  const authenticatedNav = (
    <>
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        onClick={() => setIsMenuOpen(false)}
      >
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.full_name || user.email}
            className="h-8 w-8 rounded-full border-2 border-primary/20 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <User className="h-4 w-4" />
          </div>
        )}
        <span className="hidden sm:inline">{user?.full_name || user?.email}</span>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          logout();
          setIsMenuOpen(false);
        }}
        title="Déconnexion"
        disabled={isLoading}
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Déconnexion</span>
      </Button>
    </>
  );

  // Navigation pour utilisateur non authentifié
  const unauthenticatedNav = (
    <>
      <Button variant="ghost" asChild>
        <Link href="/login" onClick={() => setIsMenuOpen(false)}>Se connecter</Link>
      </Button>
      <Button asChild>
        <Link href="/register" onClick={() => setIsMenuOpen(false)}>Commencer</Link>
      </Button>
    </>
  );

  return (
    <header className={headerClasses}>
      <div className={containerClasses}>
        <Link href="/" className="gradient-text text-2xl font-bold hover:opacity-80 transition-opacity">
          Life Planner
        </Link>
        
        {/* Navigation desktop - visible à partir de md (768px) */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          <ThemeToggle />
          {isAuthenticated && user && !isLoading ? authenticatedNav : !isLoading ? unauthenticatedNav : null}
        </nav>

        {/* Menu burger pour mobile - visible jusqu'à md */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                {isAuthenticated && user && !isLoading ? (
                  <>
                    {/* Profil utilisateur dans le menu */}
                    <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-3">
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                          className="h-10 w-10 rounded-full border-2 border-primary/20 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.full_name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Liens de navigation */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                        Tableau de bord
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                        Mon profil
                      </Link>
                    </Button>
                    
                    {/* Séparateur */}
                    <div className="my-2 border-t" />
                    
                    {/* Déconnexion */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </Button>
                  </>
                ) : !isLoading ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                        Se connecter
                      </Link>
                    </Button>
                    <Button
                      className="w-full"
                      asChild
                    >
                      <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                        Créer un compte
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


"use client";

/**
 * Layout pour les pages protégées (authentification requise).
 * 
 * Ce layout est utilisé pour /dashboard, /profile, /workout, etc.
 * 
 * Vérifie :
 * 1. Que l'utilisateur est connecté (sinon redirection vers /login)
 * 2. Que l'email est vérifié pour les utilisateurs locaux
 *    (sinon redirection vers /profile, sauf pour la page /profile elle-même)
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (isLoading) {
      return;
    }

    // Rediriger vers login si non connecté
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Ne vérifie pas l'email pour la page profil (sinon boucle infinie)
    if (pathname === "/profile") {
      return;
    }

    // Redirige vers le profil si l'email n'est pas vérifié (utilisateurs locaux uniquement)
    if (user && !user.is_email_verified && user.auth_provider === "local") {
      router.replace("/profile?email_not_verified=true");
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // Affiche un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Affiche un loader si non connecté (en attendant la redirection)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Affiche un loader si email non vérifié (en attendant la redirection)
  if (user && !user.is_email_verified && user.auth_provider === "local" && pathname !== "/profile") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}


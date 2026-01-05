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
 * 
 * OPTIMISATION: Ne bloque pas le rendu pendant le loading initial.
 * Les pages enfants gèrent elles-mêmes l'affichage des skeletons.
 */

import { useEffect, useRef } from "react";
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
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (isLoading) {
      return;
    }

    // Éviter les redirections multiples
    if (hasRedirected.current) {
      return;
    }

    // Rediriger vers login si non connecté
    if (!isAuthenticated) {
      hasRedirected.current = true;
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Ne vérifie pas l'email pour la page profil (sinon boucle infinie)
    if (pathname === "/profile") {
      return;
    }

    // Redirige vers le profil si l'email n'est pas vérifié (utilisateurs locaux uniquement)
    if (user && !user.is_email_verified && user.auth_provider === "local") {
      hasRedirected.current = true;
      router.replace("/profile?email_not_verified=true");
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // Reset le flag de redirection quand le pathname change
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Pendant le chargement initial de l'auth, on laisse les enfants se rendre
  // avec leurs propres skeletons - cela réduit le "flash" de loading
  // On n'affiche un spinner que si vraiment nécessaire (redirect en cours)
  if (isLoading) {
    // Optimisation: On ne bloque plus avec un spinner plein écran
    // Les pages enfants affichent leurs propres skeletons
    return <>{children}</>;
  }

  // Affiche un loader UNIQUEMENT si non connecté (en attendant la redirection)
  // C'est le seul cas où on a besoin d'un spinner car on ne veut pas
  // flasher le contenu protégé avant la redirection
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


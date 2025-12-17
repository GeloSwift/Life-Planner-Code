"use client";

/**
 * Layout pour les pages protégées (authentification requise).
 * 
 * Ce layout est utilisé pour /dashboard, /profile, etc.
 * Le middleware s'assure que l'utilisateur est connecté.
 * 
 * Vérifie aussi que l'email est vérifié pour les utilisateurs locaux
 * (sauf pour la page /profile elle-même).
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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ne vérifie pas l'email pour la page profil (sinon boucle infinie)
    if (pathname === "/profile") {
      return;
    }

    // Redirige vers le profil si l'email n'est pas vérifié (utilisateurs locaux uniquement)
    if (!isLoading && user && !user.is_email_verified && user.auth_provider === "local") {
      // Ajoute un paramètre pour indiquer qu'on a été redirigé
      router.replace("/profile?email_not_verified=true");
    }
  }, [isLoading, user, router, pathname]);

  // Affiche un loader pendant le chargement ou la vérification
  if (isLoading || (user && !user.is_email_verified && user.auth_provider === "local" && pathname !== "/profile")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}


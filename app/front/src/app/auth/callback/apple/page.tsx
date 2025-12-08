"use client";

/**
 * Page de callback pour Apple Sign In.
 * 
 * Apple redirige vers cette page avec un code d'autorisation.
 * On échange ce code contre des tokens via l'API.
 * 
 * Note: Apple envoie les données en POST (response_mode: form_post).
 * On utilise donc un route handler séparé pour gérer le POST.
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const state = searchParams.get("state");

      // Vérifie les erreurs OAuth
      if (errorParam) {
        setError(`Erreur Apple: ${errorParam}`);
        return;
      }

      if (!code) {
        setError("Code d'autorisation manquant");
        return;
      }

      // Vérifie le state CSRF
      const savedState = sessionStorage.getItem("oauth_state");
      if (state && savedState && state !== savedState) {
        setError("Erreur de validation (state mismatch)");
        return;
      }

      try {
        await handleOAuthCallback("apple", code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de connexion");
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-6 w-6" />
          <p>{error}</p>
        </div>
        <Button asChild>
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Connexion avec Apple...</p>
    </div>
  );
}


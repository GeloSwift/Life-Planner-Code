"use client";

/**
 * Callback page for Google Calendar OAuth.
 * 
 * Receives the authorization code from Google and exchanges it for tokens
 * via the backend API.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GoogleCalendarCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage("Autorisation refusée par l'utilisateur");
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Paramètres manquants dans l'URL");
        return;
      }

      try {
        // Appeler le backend pour échanger le code
        const response = await fetch(
          `${API_URL}/workout/calendar/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Google Calendar connecté avec succès !");
          
          // Rediriger vers le profil après 2 secondes
          setTimeout(() => {
            router.push("/profile");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.detail || "Erreur lors de la connexion");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Erreur de connexion au serveur");
        console.error(err);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Connexion en cours..."}
            {status === "success" && "Connexion réussie !"}
            {status === "error" && "Erreur de connexion"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          
          {status === "success" && (
            <p className="text-xs text-muted-foreground">
              Redirection vers votre profil...
            </p>
          )}
          
          {status === "error" && (
            <Button onClick={() => router.push("/profile")} className="mt-2">
              Retour au profil
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

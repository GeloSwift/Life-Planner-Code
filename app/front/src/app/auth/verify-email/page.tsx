"use client";

/**
 * Page de vérification d'email.
 * 
 * Cette page est appelée quand l'utilisateur clique sur le lien
 * de vérification reçu par email.
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        setStatus("success");
        setMessage(response.message);
        // Rafraîchit les données utilisateur pour mettre à jour is_email_verified
        await refreshUser();
        // Redirige vers le profil après 2 secondes
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Erreur lors de la vérification de l'email"
        );
      }
    };

    verify();
  }, [token, router, refreshUser]);

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundDecorations />
      <Header variant="default" />
      
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              {token && status === "loading" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <CardTitle>Vérification en cours...</CardTitle>
                  <CardDescription>
                    Veuillez patienter pendant la vérification de votre email
                  </CardDescription>
                </>
              )}
              
              {token && status === "success" && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Email vérifié !</CardTitle>
                  <CardDescription>
                    {message || "Votre email a été vérifié avec succès"}
                  </CardDescription>
                </>
              )}
              
              {(!token || status === "error") && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Erreur de vérification</CardTitle>
                  <CardDescription>
                    {!token
                      ? "Token de vérification manquant"
                      : message || "Le lien de vérification est invalide ou a expiré"}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {token && status === "success" && (
                <p className="text-center text-sm text-muted-foreground">
                  Redirection vers votre profil dans quelques secondes...
                </p>
              )}
              
              {(!token || status === "error") && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Le lien de vérification peut avoir expiré ou être invalide.
                    Vous pouvez demander un nouvel email de vérification depuis votre profil.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild className="flex-1">
                      <Link href="/">Retour à l&apos;accueil</Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href="/profile">Aller au profil</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}


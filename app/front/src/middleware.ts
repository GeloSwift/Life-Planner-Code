/**
 * Middleware Next.js pour la protection des routes.
 * 
 * Ce middleware s'exécute avant chaque requête et permet de:
 * - Vérifier l'authentification
 * - Rediriger vers login si non connecté
 * - Rediriger vers dashboard si déjà connecté (pour /login, /register)
 * 
 * Documentation:
 * https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes qui nécessitent d'être connecté
const protectedRoutes = ["/dashboard", "/profile", "/settings"];

// Routes qui nécessitent d'être déconnecté (auth pages)
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Récupère le token des cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;

  // Vérifie si c'est une route protégée
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // Vérifie si c'est une route d'authentification
  const isAuthRoute = authRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // Vérifie si c'est un callback OAuth (toujours autorisé)
  const isOAuthCallback = pathname.startsWith("/auth/callback");

  // Routes protégées: redirige vers login si non connecté
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    // Sauvegarde l'URL de destination pour rediriger après login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Routes d'auth: redirige vers dashboard si déjà connecté
  // (sauf pour les callbacks OAuth)
  if (isAuthRoute && isAuthenticated && !isOAuthCallback) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configuration: sur quelles routes le middleware s'exécute
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


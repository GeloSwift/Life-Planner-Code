"use client";

/**
 * Contexte d'authentification pour l'application.
 * 
 * Ce module fournit:
 * - Un contexte React pour l'état d'authentification
 * - Un provider qui gère automatiquement l'état
 * - Des hooks personnalisés pour accéder à l'auth
 * 
 * Documentation Next.js:
 * https://nextjs.org/docs/app/building-your-application/rendering/context
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import type { User, AuthContextType, OAuthProviders } from "./types";

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<OAuthProviders>({ google: false });
  const router = useRouter();

  // Vérifie si l'utilisateur est authentifié au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
      } catch {
        // Non connecté ou token expiré
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const loadProviders = async () => {
      try {
        const availableProviders = await authApi.getProviders();
        setProviders(availableProviders);
      } catch {
        // Ignore l'erreur, utilise les valeurs par défaut
      }
    };

    checkAuth();
    loadProviders();
  }, []);

  /**
   * Connexion avec email et mot de passe.
   */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.login({ email, password });
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Inscription d'un nouvel utilisateur.
   */
  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    try {
      await authApi.register({ email, password, full_name: fullName });
      // Connexion automatique après inscription
      await authApi.login({ email, password });
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Déconnexion.
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore l'erreur - on déconnecte localement quand même
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push("/login");
    }
  }, [router]);

  /**
   * Redirige vers Google pour l'authentification.
   */
  const loginWithGoogle = useCallback(async () => {
    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const { authorization_url, state } = await authApi.getGoogleUrl(redirectUri);
    
    // Stocke le state pour la validation CSRF
    sessionStorage.setItem("oauth_state", state);
    
    // Redirige vers Google
    window.location.href = authorization_url;
  }, []);

  /**
   * Gère le callback OAuth après redirection (Google uniquement).
   */
  const handleOAuthCallback = useCallback(async (
    provider: "google",
    code: string,
  ) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      await authApi.googleCallback(code, redirectUri);
      
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      
      // Nettoie le state
      sessionStorage.removeItem("oauth_state");
      
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Rafraîchit les informations de l'utilisateur.
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  // Mémorise la valeur du contexte pour éviter les re-renders inutiles
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      loginWithGoogle,
      handleOAuthCallback,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, loginWithGoogle, handleOAuthCallback, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook pour accéder au contexte d'authentification.
 * 
 * @throws Error si utilisé en dehors du AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook pour accéder à l'utilisateur uniquement.
 */
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook pour vérifier si l'utilisateur est authentifié.
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}


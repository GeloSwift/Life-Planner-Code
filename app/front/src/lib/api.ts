/**
 * Service API pour communiquer avec le backend FastAPI.
 * 
 * Ce module centralise tous les appels API et gère:
 * - La configuration de base (URL, headers)
 * - La gestion automatique des tokens
 * - Le refresh automatique des tokens expirés
 * - La transformation des erreurs
 * 
 * Documentation Next.js:
 * https://nextjs.org/docs/app/building-your-application/data-fetching
 */

import type {
  User,
  UserCreate,
  UserUpdate,
  LoginRequest,
  TokenResponse,
  OAuthURLResponse,
  OAuthProviders,
  APIError,
  MessageResponse,
} from "./types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =============================================================================
// TOKEN STORAGE (localStorage pour cross-origin)
// =============================================================================

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}


// =============================================================================
// FETCH WRAPPER
// =============================================================================

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Wrapper autour de fetch avec gestion automatique des erreurs et des tokens.
 */
async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // Ajoute le token d'authentification si disponible et requis
  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include", // Garde les cookies pour compatibilité
  });

  // Gestion des erreurs HTTP
  if (!response.ok) {
    let error: APIError;
    try {
      error = await response.json();
    } catch {
      error = { detail: `HTTP ${response.status}: ${response.statusText}` };
    }

    // Formate le message d'erreur
    const message =
      typeof error.detail === "string"
        ? error.detail
        : error.detail?.[0]?.msg || "Une erreur est survenue";

    throw new Error(message);
  }

  // Certaines réponses peuvent être vides (204 No Content)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// =============================================================================
// AUTH API
// =============================================================================

export const authApi = {
  /**
   * Inscription d'un nouvel utilisateur.
   */
  async register(data: UserCreate): Promise<User> {
    return apiFetch<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  /**
   * Connexion avec email et mot de passe.
   * Stocke les tokens dans localStorage pour les requêtes suivantes.
   */
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });
    // Stocke les tokens pour les requêtes futures
    setStoredTokens(response.access_token, response.refresh_token);
    return response;
  },

  /**
   * Déconnexion - supprime les tokens.
   */
  async logout(): Promise<MessageResponse> {
    try {
      const response = await apiFetch<MessageResponse>("/auth/logout", {
        method: "POST",
      });
      return response;
    } finally {
      // Toujours supprimer les tokens locaux, même si l'appel API échoue
      clearStoredTokens();
    }
  },

  /**
   * Récupère l'utilisateur actuellement connecté.
   */
  async getMe(): Promise<User> {
    return apiFetch<User>("/auth/me");
  },

  /**
   * Met à jour les informations de l'utilisateur connecté.
   */
  async updateMe(data: UserUpdate): Promise<User> {
    return apiFetch<User>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Met à jour l'avatar de l'utilisateur connecté.
   */
  async updateAvatar(avatarUrl: string): Promise<User> {
    return apiFetch<User>("/auth/me/avatar", {
      method: "POST",
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
  },

  /**
   * Rafraîchit les tokens.
   * Utilise le refresh token stocké dans les cookies.
   */
  async refresh(): Promise<TokenResponse> {
    return apiFetch<TokenResponse>("/auth/refresh", {
      method: "POST",
    });
  },

  /**
   * Récupère la liste des providers OAuth configurés.
   */
  async getProviders(): Promise<OAuthProviders> {
    return apiFetch<OAuthProviders>("/auth/providers", {
      skipAuth: true,
    });
  },

  /**
   * Récupère l'URL d'autorisation Google.
   */
  async getGoogleUrl(redirectUri: string): Promise<OAuthURLResponse> {
    const params = new URLSearchParams({ redirect_uri: redirectUri });
    return apiFetch<OAuthURLResponse>(`/auth/google/url?${params}`, {
      skipAuth: true,
    });
  },

  /**
   * Callback Google OAuth - échange le code contre des tokens.
   */
  async googleCallback(code: string, redirectUri: string): Promise<TokenResponse> {
    const response = await apiFetch<TokenResponse>("/auth/google/callback", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
      skipAuth: true,
    });
    // Stocke les tokens pour les requêtes futures
    setStoredTokens(response.access_token, response.refresh_token);
    return response;
  },
};

// =============================================================================
// HEALTH API
// =============================================================================

export const healthApi = {
  /**
   * Vérifie que l'API est accessible.
   */
  async check(): Promise<{ status: string; version: string }> {
    return apiFetch("/health", { skipAuth: true });
  },
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export const api = {
  auth: authApi,
  health: healthApi,
};

export default api;


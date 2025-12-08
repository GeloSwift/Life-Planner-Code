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

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include", // Envoie les cookies httpOnly
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
   * Les tokens sont automatiquement stockés dans les cookies httpOnly.
   */
  async login(data: LoginRequest): Promise<TokenResponse> {
    return apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  /**
   * Déconnexion - supprime les cookies.
   */
  async logout(): Promise<MessageResponse> {
    return apiFetch<MessageResponse>("/auth/logout", {
      method: "POST",
    });
  },

  /**
   * Récupère l'utilisateur actuellement connecté.
   */
  async getMe(): Promise<User> {
    return apiFetch<User>("/auth/me");
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
    return apiFetch<TokenResponse>("/auth/google/callback", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
      skipAuth: true,
    });
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


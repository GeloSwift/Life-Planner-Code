/**
 * Types TypeScript pour l'application Life Planner.
 * 
 * Ces types correspondent aux schemas Pydantic du backend.
 * Ils assurent la cohérence entre frontend et backend.
 */

// =============================================================================
// ENUMS
// =============================================================================

export type AuthProvider = "local" | "google" | "apple";

// =============================================================================
// USER TYPES
// =============================================================================

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  auth_provider: AuthProvider;
  avatar_url: string | null;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface OAuthLoginRequest {
  code: string;
  redirect_uri: string;
}

export interface OAuthURLResponse {
  authorization_url: string;
  state: string;
}

export interface OAuthProviders {
  google: boolean;
  apple: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface MessageResponse {
  message: string;
}

export interface APIError {
  detail: string | { msg: string; type: string }[];
}

// =============================================================================
// AUTH CONTEXT TYPES
// =============================================================================

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  handleOAuthCallback: (provider: "google" | "apple", code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}


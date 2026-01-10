/**
 * Service API pour le module Workout Planner.
 * 
 * Ce module gère tous les appels API liés aux séances d'entraînement,
 * exercices, objectifs, poids, etc.
 */

import { getStoredToken, setStoredTokens, clearStoredTokens, authApi } from "./api";
import type {
  Exercise,
  ExerciseCreate,
  ExerciseUpdate,
  WorkoutTemplate,
  WorkoutTemplateCreate,
  WorkoutTemplateUpdate,
  TemplateExerciseCreate,
  WorkoutSession,
  WorkoutSessionCreate,
  WorkoutSessionUpdate,
  WorkoutSessionExercise,
  WorkoutSet,
  SetCreate,
  SetUpdate,
  WeightEntry,
  WeightEntryCreate,
  WeightEntryUpdate,
  Goal,
  GoalCreate,
  GoalUpdate,
  WorkoutStats,
  CalendarResponse,
  DashboardResponse,
  EnumOption,
  ActivityType,
  MuscleGroup,
  UserActivityType,
  UserActivityTypeCreate,
  UserActivityTypeUpdate,
  CustomFieldDefinition,
  CustomFieldDefinitionCreate,
} from "./workout-types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =============================================================================
// FETCH WRAPPER
// =============================================================================

/**
 * Rafraîchit le token automatiquement en cas d'expiration.
 */
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshTokenIfNeeded(): Promise<void> {
  if (isRefreshing && refreshPromise) {
    await refreshPromise;
    return;
  }

  isRefreshing = true;
  refreshPromise = authApi
    .refresh()
    .then((response) => {
      setStoredTokens(response.access_token, response.refresh_token);
    })
    .catch((error) => {
      // Si le refresh échoue, on supprime les tokens
      clearStoredTokens();
      throw error;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  await refreshPromise;
}

/**
 * Wrapper autour de fetch avec gestion automatique des erreurs et des tokens.
 * Rafraîchit automatiquement le token en cas d'expiration (401).
 */
async function workoutFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getStoredToken();
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Si 401 (Unauthorized) et qu'on n'est pas en train de rafraîchir, on essaie de rafraîchir le token
  if (!response.ok && response.status === 401 && !isRefreshing) {
    try {
      await refreshTokenIfNeeded();

      // Réessaie la requête avec le nouveau token
      const newToken = getStoredToken();
      if (newToken) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
      }

      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    } catch {
      // Si le refresh échoue, on continue avec l'erreur 401 originale
    }
  }

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = { detail: `HTTP ${response.status}: ${response.statusText}` };
    }
    const message =
      typeof error.detail === "string"
        ? error.detail
        : error.detail?.[0]?.msg || "Une erreur est survenue";
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// =============================================================================
// EXERCISES API
// =============================================================================

export const exercisesApi = {
  async list(params?: {
    activity_type?: ActivityType;
    muscle_group?: MuscleGroup;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<Exercise[]> {
    const searchParams = new URLSearchParams();
    if (params?.activity_type) searchParams.set("activity_type", params.activity_type);
    if (params?.muscle_group) searchParams.set("muscle_group", params.muscle_group);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    return workoutFetch<Exercise[]>(`/workout/exercises${query ? `?${query}` : ""}`);
  },

  async get(id: number): Promise<Exercise> {
    return workoutFetch<Exercise>(`/workout/exercises/${id}`);
  },

  async create(data: ExerciseCreate): Promise<Exercise> {
    return workoutFetch<Exercise>("/workout/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: ExerciseUpdate): Promise<Exercise> {
    return workoutFetch<Exercise>(`/workout/exercises/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await workoutFetch<void>(`/workout/exercises/${id}`, {
      method: "DELETE",
    });
  },
};

// =============================================================================
// TEMPLATES API
// =============================================================================

export const templatesApi = {
  async list(params?: {
    activity_type?: ActivityType;
    skip?: number;
    limit?: number;
  }): Promise<WorkoutTemplate[]> {
    const searchParams = new URLSearchParams();
    if (params?.activity_type) searchParams.set("activity_type", params.activity_type);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    return workoutFetch<WorkoutTemplate[]>(`/workout/templates${query ? `?${query}` : ""}`);
  },

  async get(id: number): Promise<WorkoutTemplate> {
    return workoutFetch<WorkoutTemplate>(`/workout/templates/${id}`);
  },

  async create(data: WorkoutTemplateCreate): Promise<WorkoutTemplate> {
    return workoutFetch<WorkoutTemplate>("/workout/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: WorkoutTemplateUpdate): Promise<WorkoutTemplate> {
    return workoutFetch<WorkoutTemplate>(`/workout/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await workoutFetch<void>(`/workout/templates/${id}`, {
      method: "DELETE",
    });
  },

  async addExercise(templateId: number, data: TemplateExerciseCreate): Promise<WorkoutTemplate> {
    return workoutFetch<WorkoutTemplate>(`/workout/templates/${templateId}/exercises`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async removeExercise(templateId: number, exerciseId: number): Promise<WorkoutTemplate> {
    return workoutFetch<WorkoutTemplate>(
      `/workout/templates/${templateId}/exercises/${exerciseId}`,
      { method: "DELETE" }
    );
  },
};

// =============================================================================
// SESSIONS API
// =============================================================================

export const sessionsApi = {
  async list(params?: {
    status?: string;
    activity_type?: ActivityType;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<WorkoutSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.activity_type) searchParams.set("activity_type", params.activity_type);
    if (params?.from_date) searchParams.set("from_date", params.from_date);
    if (params?.to_date) searchParams.set("to_date", params.to_date);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    return workoutFetch<WorkoutSession[]>(`/workout/sessions${query ? `?${query}` : ""}`);
  },

  async get(id: number): Promise<WorkoutSession> {
    return workoutFetch<WorkoutSession>(`/workout/sessions/${id}`);
  },

  async create(data: WorkoutSessionCreate): Promise<WorkoutSession> {
    return workoutFetch<WorkoutSession>("/workout/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: WorkoutSessionUpdate): Promise<WorkoutSession> {
    return workoutFetch<WorkoutSession>(`/workout/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async excludeOccurrence(id: number, date: string): Promise<WorkoutSession> {
    return workoutFetch<WorkoutSession>(`/workout/sessions/${id}/exclude?date=${date}`, {
      method: "POST",
    });
  },

  async delete(id: number): Promise<void> {
    await workoutFetch<void>(`/workout/sessions/${id}`, {
      method: "DELETE",
    });
  },

  async start(id: number): Promise<WorkoutSession> {
    return workoutFetch<WorkoutSession>(`/workout/sessions/${id}/start`, {
      method: "POST",
    });
  },

  async complete(id: number): Promise<WorkoutSession> {
    // Le backend utilise /end, mais on garde le nom "complete" pour la clarté côté frontend
    return workoutFetch<WorkoutSession>(`/workout/sessions/${id}/end`, {
      method: "POST",
    });
  },

  async cancel(id: number): Promise<WorkoutSession> {
    return workoutFetch<WorkoutSession>(`/workout/sessions/${id}/cancel`, {
      method: "POST",
    });
  },

  async getActive(): Promise<WorkoutSession | null> {
    try {
      return await workoutFetch<WorkoutSession>("/workout/sessions/active");
    } catch {
      return null;
    }
  },

  async createFromTemplate(templateId: number, scheduledAt?: string): Promise<WorkoutSession> {
    const body: { scheduled_at?: string } = {};
    if (scheduledAt) body.scheduled_at = scheduledAt;

    return workoutFetch<WorkoutSession>(`/workout/sessions/from-template/${templateId}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // Exercise within session
  async getExercises(sessionId: number): Promise<WorkoutSessionExercise[]> {
    return workoutFetch<WorkoutSessionExercise[]>(`/workout/sessions/${sessionId}/exercises`);
  },

  async completeExercise(sessionId: number, exerciseId: number): Promise<WorkoutSessionExercise> {
    return workoutFetch<WorkoutSessionExercise>(
      `/workout/sessions/${sessionId}/exercises/${exerciseId}/complete`,
      { method: "POST" }
    );
  },

  async updateExerciseNotes(sessionId: number, exerciseId: number, notes: string): Promise<WorkoutSessionExercise> {
    const params = new URLSearchParams();
    if (notes) {
      params.set("notes", notes);
    }
    return workoutFetch<WorkoutSessionExercise>(
      `/workout/sessions/${sessionId}/exercises/${exerciseId}?${params.toString()}`,
      { method: "PUT" }
    );
  },

  // Sets within session exercise
  async addSet(sessionId: number, exerciseId: number, data: SetCreate): Promise<WorkoutSet> {
    return workoutFetch<WorkoutSet>(
      `/workout/sessions/${sessionId}/exercises/${exerciseId}/sets`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  async updateSet(setId: number, data: SetUpdate): Promise<WorkoutSet> {
    return workoutFetch<WorkoutSet>(
      `/workout/sets/${setId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  async completeSet(setId: number): Promise<WorkoutSet> {
    return workoutFetch<WorkoutSet>(
      `/workout/sets/${setId}/complete`,
      { method: "POST" }
    );
  },
};

// =============================================================================
// WEIGHT API
// =============================================================================

export const weightApi = {
  async list(params?: {
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<WeightEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.from_date) searchParams.set("from_date", params.from_date);
    if (params?.to_date) searchParams.set("to_date", params.to_date);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    return workoutFetch<WeightEntry[]>(`/workout/weight${query ? `?${query}` : ""}`);
  },

  async get(id: number): Promise<WeightEntry> {
    return workoutFetch<WeightEntry>(`/workout/weight/${id}`);
  },

  async create(data: WeightEntryCreate): Promise<WeightEntry> {
    return workoutFetch<WeightEntry>("/workout/weight", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: WeightEntryUpdate): Promise<WeightEntry> {
    return workoutFetch<WeightEntry>(`/workout/weight/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await workoutFetch<void>(`/workout/weight/${id}`, {
      method: "DELETE",
    });
  },

  async getLatest(): Promise<WeightEntry | null> {
    try {
      return await workoutFetch<WeightEntry>("/workout/weight/latest");
    } catch {
      return null;
    }
  },
};

// =============================================================================
// GOALS API
// =============================================================================

export const goalsApi = {
  async list(params?: {
    is_active?: boolean;
    is_achieved?: boolean;
    goal_type?: string;
    skip?: number;
    limit?: number;
  }): Promise<Goal[]> {
    const searchParams = new URLSearchParams();
    if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
    if (params?.is_achieved !== undefined) searchParams.set("is_achieved", String(params.is_achieved));
    if (params?.goal_type) searchParams.set("goal_type", params.goal_type);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    return workoutFetch<Goal[]>(`/workout/goals${query ? `?${query}` : ""}`);
  },

  async get(id: number): Promise<Goal> {
    return workoutFetch<Goal>(`/workout/goals/${id}`);
  },

  async create(data: GoalCreate): Promise<Goal> {
    return workoutFetch<Goal>("/workout/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: GoalUpdate): Promise<Goal> {
    return workoutFetch<Goal>(`/workout/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await workoutFetch<void>(`/workout/goals/${id}`, {
      method: "DELETE",
    });
  },

  async updateProgress(id: number, currentValue: number): Promise<Goal> {
    return workoutFetch<Goal>(`/workout/goals/${id}/progress`, {
      method: "POST",
      body: JSON.stringify({ current_value: currentValue }),
    });
  },
};

// =============================================================================
// STATS & DASHBOARD API
// =============================================================================

export const statsApi = {
  async getStats(): Promise<WorkoutStats> {
    return workoutFetch<WorkoutStats>("/workout/stats");
  },

  async getDashboard(): Promise<DashboardResponse> {
    return workoutFetch<DashboardResponse>("/workout/dashboard");
  },

  async getCalendar(year: number, month: number): Promise<CalendarResponse> {
    return workoutFetch<CalendarResponse>(`/workout/calendar?year=${year}&month=${month}`);
  },
};

// =============================================================================
// ACTIVITY TYPES API (Custom user activities)
// =============================================================================

export const activityTypesApi = {
  async list(): Promise<UserActivityType[]> {
    return workoutFetch<UserActivityType[]>("/workout/activity-types");
  },

  async get(id: number): Promise<UserActivityType> {
    return workoutFetch<UserActivityType>(`/workout/activity-types/${id}`);
  },

  async create(data: UserActivityTypeCreate): Promise<UserActivityType> {
    return workoutFetch<UserActivityType>("/workout/activity-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: UserActivityTypeUpdate): Promise<UserActivityType> {
    return workoutFetch<UserActivityType>(`/workout/activity-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await workoutFetch<void>(`/workout/activity-types/${id}`, {
      method: "DELETE",
    });
  },

  async toggleFavorite(id: number): Promise<UserActivityType> {
    return workoutFetch<UserActivityType>(`/workout/activity-types/${id}/favorite`, {
      method: "POST",
    });
  },

  async getFavorite(): Promise<UserActivityType | null> {
    try {
      return await workoutFetch<UserActivityType>("/workout/activity-types/favorite");
    } catch {
      return null;
    }
  },

  async addField(activityTypeId: number, data: CustomFieldDefinitionCreate): Promise<CustomFieldDefinition> {
    return workoutFetch<CustomFieldDefinition>(`/workout/activity-types/${activityTypeId}/fields`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteField(fieldId: number): Promise<void> {
    await workoutFetch<void>(`/workout/fields/${fieldId}`, {
      method: "DELETE",
    });
  },
};

// =============================================================================
// ENUMS API
// =============================================================================

export const enumsApi = {
  async getActivityTypes(): Promise<EnumOption[]> {
    return workoutFetch<EnumOption[]>("/workout/enums/activity-types");
  },

  async getMuscleGroups(): Promise<EnumOption[]> {
    return workoutFetch<EnumOption[]>("/workout/enums/muscle-groups");
  },

  async getGoalTypes(): Promise<EnumOption[]> {
    return workoutFetch<EnumOption[]>("/workout/enums/goal-types");
  },

  async getSessionStatuses(): Promise<EnumOption[]> {
    return workoutFetch<EnumOption[]>("/workout/enums/session-statuses");
  },
};

// =============================================================================
// EXPORT ALL
// =============================================================================

export const workoutApi = {
  exercises: exercisesApi,
  templates: templatesApi,
  sessions: sessionsApi,
  weight: weightApi,
  goals: goalsApi,
  stats: statsApi,
  enums: enumsApi,
  activityTypes: activityTypesApi,
};

export default workoutApi;

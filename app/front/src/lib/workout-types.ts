/**
 * Types TypeScript pour le module Workout Planner.
 * 
 * Ces types correspondent aux schemas Pydantic du backend.
 */

// =============================================================================
// ENUMS (en français, correspondant au backend)
// =============================================================================

export type ActivityType =
  | "musculation"
  | "course"
  | "cyclisme"
  | "natation"
  | "volleyball"
  | "boxe"
  | "basketball"
  | "football"
  | "tennis"
  | "yoga"
  | "crossfit"
  | "hiit"
  | "danse"
  | "autre";

export type MuscleGroup =
  | "poitrine"
  | "dos"
  | "epaules"
  | "biceps"
  | "triceps"
  | "avant_bras"
  | "abdominaux"
  | "obliques"
  | "lombaires"
  | "quadriceps"
  | "ischio_jambiers"
  | "fessiers"
  | "mollets"
  | "adducteurs"
  | "corps_complet"
  | "cardio";

export type GoalType =
  | "poids_corporel"
  | "poids_exercice"
  | "repetitions"
  | "temps_exercice"
  | "distance"
  | "temps"
  | "nombre_seances"
  | "serie_consecutive";

export type SessionStatus =
  | "planifiee"
  | "en_cours"
  | "terminee"
  | "annulee";

// =============================================================================
// LABELS POUR L'UI (français)
// =============================================================================

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  musculation: "Musculation",
  course: "Course à pied",
  cyclisme: "Cyclisme",
  natation: "Natation",
  volleyball: "Volleyball",
  boxe: "Boxe",
  basketball: "Basketball",
  football: "Football",
  tennis: "Tennis",
  yoga: "Yoga",
  crossfit: "CrossFit",
  hiit: "HIIT",
  danse: "Danse",
  autre: "Autre",
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  poitrine: "Poitrine",
  dos: "Dos",
  epaules: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  avant_bras: "Avant-bras",
  abdominaux: "Abdominaux",
  obliques: "Obliques",
  lombaires: "Lombaires",
  quadriceps: "Quadriceps",
  ischio_jambiers: "Ischio-jambiers",
  fessiers: "Fessiers",
  mollets: "Mollets",
  adducteurs: "Adducteurs",
  corps_complet: "Corps complet",
  cardio: "Cardio",
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  poids_corporel: "Poids corporel",
  poids_exercice: "Poids d'exercice",
  repetitions: "Répétitions",
  temps_exercice: "Temps d'exercice",
  distance: "Distance",
  temps: "Temps",
  nombre_seances: "Nombre de séances",
  serie_consecutive: "Série consécutive",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

// =============================================================================
// CUSTOM FIELD TYPES (Notion-like)
// =============================================================================

export type CustomFieldType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "checkbox"
  | "date"
  | "duration";

export interface CustomFieldDefinition {
  id: number;
  activity_type_id: number;
  name: string;
  field_type: CustomFieldType;
  options: string[] | null; // Liste d'options pour select/multi_select
  unit: string | null;
  placeholder: string | null;
  default_value: string | null;
  is_required: boolean;
  order: number;
  created_at: string;
}

export interface CustomFieldDefinitionCreate {
  name: string;
  field_type: CustomFieldType;
  options?: string[];
  unit?: string;
  placeholder?: string;
  default_value?: string;
  is_required?: boolean;
  order?: number;
}

export interface UserActivityType {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  user_id: number | null;
  created_at: string;
  custom_fields: CustomFieldDefinition[];
}

export interface UserActivityTypeCreate {
  name: string;
  icon?: string;
  color?: string;
}

export interface UserActivityTypeUpdate {
  name?: string;
  icon?: string;
  color?: string;
}

export interface ExerciseFieldValue {
  id: number;
  exercise_id: number;
  field_id: number;
  value: string | null;
  field?: CustomFieldDefinition;
}

export interface ExerciseFieldValueCreate {
  field_id: number;
  value: string;
}

// =============================================================================
// EXERCISE TYPES
// =============================================================================

export interface Exercise {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  video_url: string | null;
  image_url: string | null;
  gif_data: string | null;  // Base64 encoded GIF
  activity_type: ActivityType;
  custom_activity_type_id: number | null;
  custom_activity_type: UserActivityType | null;
  muscle_group: MuscleGroup | null;
  secondary_muscles: string | null;
  equipment: string | null;
  is_compound: boolean;
  user_id: number | null;
  field_values: ExerciseFieldValue[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseCreate {
  name: string;
  description?: string;
  instructions?: string;
  video_url?: string;
  image_url?: string;
  gif_data?: string;  // Base64 encoded GIF
  activity_type: ActivityType;
  custom_activity_type_id?: number;
  muscle_group?: MuscleGroup;
  secondary_muscles?: string;
  equipment?: string;
  is_compound?: boolean;
  field_values?: ExerciseFieldValueCreate[];
}

export interface ExerciseUpdate {
  name?: string;
  description?: string;
  instructions?: string;
  video_url?: string;
  image_url?: string;
  gif_data?: string;  // Base64 encoded GIF
  activity_type?: ActivityType;
  custom_activity_type_id?: number;
  muscle_group?: MuscleGroup;
  secondary_muscles?: string;
  equipment?: string;
  is_compound?: boolean;
  field_values?: ExerciseFieldValueCreate[];
}

// =============================================================================
// WORKOUT TEMPLATE TYPES
// =============================================================================

export interface WorkoutTemplateExercise {
  id: number;
  template_id: number;
  exercise_id: number;
  order: number;
  target_sets: number;
  target_reps: number | null;
  target_weight: number | null;
  target_duration: number | null;
  target_distance: number | null;
  rest_seconds: number;
  notes: string | null;
  exercise?: Exercise;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  description: string | null;
  activity_type: ActivityType;
  custom_activity_type_id: number | null;
  custom_activity_type: UserActivityType | null;
  color: string | null;
  estimated_duration: number | null;
  user_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  exercises?: WorkoutTemplateExercise[];
}

export interface TemplateExerciseCreate {
  exercise_id: number;
  order?: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  target_duration?: number;
  target_distance?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface WorkoutTemplateCreate {
  name: string;
  description?: string;
  activity_type: ActivityType;
  color?: string;
  estimated_duration?: number;
  is_public?: boolean;
  exercises?: TemplateExerciseCreate[];
}

export interface WorkoutTemplateUpdate {
  name?: string;
  description?: string;
  activity_type?: ActivityType;
  custom_activity_type_id?: number;
  color?: string;
  estimated_duration?: number;
  is_public?: boolean;
}

// =============================================================================
// WORKOUT SESSION TYPES
// =============================================================================

export interface WorkoutSet {
  id: number;
  session_exercise_id: number;
  set_number: number;
  weight: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance: number | null;
  is_warmup: boolean;
  is_dropset: boolean;
  is_failure: boolean;
  is_completed: boolean;
  completed_at: string | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutSessionExercise {
  id: number;
  session_id: number;
  exercise_id: number;
  order: number;
  target_sets: number;
  target_reps: number | null;
  target_weight: number | null;
  target_duration: number | null;
  target_distance: number | null;
  rest_seconds: number;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  exercise?: Exercise;
  sets?: WorkoutSet[];
}

export interface WorkoutSession {
  id: number;
  name: string;
  activity_type: ActivityType;
  custom_activity_type_id: number | null;
  custom_activity_type_ids?: number[]; // multi-activités (optionnel pour rétro-compat)
  custom_activity_type: UserActivityType | null;
  status: SessionStatus;
  user_id: number;
  template_id: number | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  rating: number | null;
  perceived_difficulty: number | null;
  calories_burned: number | null;
  recurrence_type?: "daily" | "weekly" | "monthly" | null;
  recurrence_data?: (number | string)[] | null; // Pour weekly: ["monday", "wednesday"], pour monthly: [1, 15]
  created_at: string;
  updated_at: string;
  exercises?: WorkoutSessionExercise[];
}

export interface WorkoutSessionCreate {
  name: string;
  activity_type: ActivityType;
  custom_activity_type_id?: number;
  custom_activity_type_ids?: number[];
  template_id?: number;
  scheduled_at?: string;
  notes?: string;
  recurrence_type?: "daily" | "weekly" | "monthly";
  recurrence_data?: (number | string)[]; // Pour weekly: ["monday", "wednesday"], pour monthly: [1, 15]
  exercises?: Array<{
    exercise_id: number;
    order?: number;
    target_sets: number;
    target_reps?: number;
    target_weight?: number;
    target_duration?: number;
    target_distance?: number;
    rest_seconds: number;
    notes?: string;
  }>;
}

export interface WorkoutSessionUpdate {
  name?: string;
  activity_type?: ActivityType;
  custom_activity_type_id?: number;
  custom_activity_type_ids?: number[];
  scheduled_at?: string;
  notes?: string;
  status?: SessionStatus;
  rating?: number;
  perceived_difficulty?: number;
  calories_burned?: number;
  recurrence_type?: "daily" | "weekly" | "monthly";
  recurrence_data?: (number | string)[]; // Pour weekly: ["monday", "wednesday"], pour monthly: [1, 15]
  exercises?: Array<{
    exercise_id: number;
    order?: number;
    target_sets: number;
    target_reps?: number;
    target_weight?: number;
    target_duration?: number;
    target_distance?: number;
    rest_seconds: number;
    notes?: string;
  }>;
}

export interface SetCreate {
  set_number: number;
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance?: number;
  is_warmup?: boolean;
  is_dropset?: boolean;
  is_failure?: boolean;
  rpe?: number;
  notes?: string;
}

export interface SetUpdate {
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance?: number;
  is_warmup?: boolean;
  is_dropset?: boolean;
  is_failure?: boolean;
  is_completed?: boolean;
  rpe?: number;
  notes?: string;
}

// =============================================================================
// WEIGHT ENTRY TYPES
// =============================================================================

export interface WeightEntry {
  id: number;
  user_id: number;
  weight: number;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  water_percentage: number | null;
  measured_at: string;
  notes: string | null;
  created_at: string;
}

export interface WeightEntryCreate {
  weight: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  water_percentage?: number;
  measured_at?: string;
  notes?: string;
}

export interface WeightEntryUpdate {
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  water_percentage?: number;
  measured_at?: string;
  notes?: string;
}

// =============================================================================
// GOAL TYPES
// =============================================================================

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  initial_value: number | null;
  unit: string;
  exercise_id: number | null;
  deadline: string | null;
  achieved_at: string | null;
  is_achieved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  exercise?: Exercise;
}

export interface GoalCreate {
  name: string;
  description?: string;
  goal_type: GoalType;
  target_value: number;
  current_value?: number;
  initial_value?: number;
  unit: string;
  exercise_id?: number;
  deadline?: string;
}

export interface GoalUpdate {
  name?: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  deadline?: string;
  is_active?: boolean;
}

// =============================================================================
// STATS & DASHBOARD TYPES
// =============================================================================

export interface WorkoutStats {
  total_sessions: number;
  completed_sessions: number;
  total_duration_minutes: number;
  sessions_this_week: number;
  sessions_this_month: number;
  current_streak: number;
  longest_streak: number;
  favorite_activity: ActivityType | null;
  average_session_duration: number;
  total_sets_completed: number;
  total_reps_completed: number;
  total_weight_lifted: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  status: SessionStatus;
  activity_type: ActivityType;
  duration_seconds: number | null;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  month: number;
  year: number;
}

export interface DashboardResponse {
  stats: WorkoutStats;
  recent_sessions: WorkoutSession[];
  upcoming_sessions: WorkoutSession[];
  active_goals: Goal[];
  latest_weight: WeightEntry | null;
  active_session: WorkoutSession | null;
}

// =============================================================================
// ENUM OPTIONS (pour les selects)
// =============================================================================

export interface EnumOption {
  value: string;
  label: string;
}

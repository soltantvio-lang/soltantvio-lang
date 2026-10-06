/**
 * FIT MAX | فیت مکس
 * Global TypeScript Interfaces & Domain Definitions
 */

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type GoalType = 
  | 'muscle_gain'
  | 'fat_loss'
  | 'athletic'
  | 'v_shape'
  | 'strength'
  | 'calisthenics_skill'
  | 'endurance'
  | 'general_fitness';

export type EnvironmentType = 'home' | 'gym' | 'park' | 'combination';

export type EquipmentType = 
  | 'bodyweight'
  | 'pullup_bar'
  | 'resistance_bands'
  | 'dumbbells'
  | 'barbell'
  | 'parallel_bars'
  | 'gym_machines'
  | 'dip_station';

export type PhysicalLimitation = 
  | 'none'
  | 'shoulder_pain'
  | 'wrist_pain'
  | 'knee_pain'
  | 'lower_back_pain'
  | 'elbow_pain'
  | 'neck_pain';

export interface UserAssessment {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  
  // Benchmarks
  pushupsMax: number;
  pullupsMax: number;
  squatsMax: number;
  plankSeconds: number;
  experienceMonths: number;
  calculatedLevel: FitnessLevel;

  // Environment & Equipment
  environment: EnvironmentType;
  equipment: EquipmentType[];

  // Goals
  primaryGoal: GoalType;
  secondaryGoals: GoalType[];

  // Lifestyle
  trainingDaysPerWeek: number; // 2, 3, 4, 5, 6
  minutesPerSession: number; // 30, 45, 60, 90
  dailyActivityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  sleepHours: number;

  // Safety & Limitations
  limitations: PhysicalLimitation[];
  hasMedicalCondition: boolean;
  medicalNotes?: string;
}

export interface FitnessProfile {
  level: FitnessLevel;
  primaryGoal: GoalType;
  environment: EnvironmentType;
  recommendedFrequencyDays: number;
  estimatedBMR: number;
  estimatedTDEE: number;
  targetCalories: number;
  macroProteinGrams: number;
  macroCarbsGrams: number;
  macroFatsGrams: number;
  createdAt: string;
}

export type ExerciseCategory = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'calves' | 'full_body' | 'cardio_mobility';

export type MovementPattern = 
  | 'push_horizontal' 
  | 'push_vertical' 
  | 'pull_horizontal' 
  | 'pull_vertical' 
  | 'squat' 
  | 'hinge' 
  | 'lunge' 
  | 'core_flexion' 
  | 'core_anti_extension' 
  | 'core_rotational' 
  | 'core_lateral' 
  | 'isolation'
  | 'cardio';

export interface Exercise {
  id: string;
  name_fa: string;
  name_en: string;
  category: ExerciseCategory;
  movement_pattern: MovementPattern;
  primary_muscles: string[];
  secondary_muscles: string[];
  difficulty: FitnessLevel;
  equipment: EquipmentType[];
  environment: EnvironmentType[];
  instructions: string;
  starting_position: string;
  execution: string;
  breathing: string;
  common_mistakes: string[];
  regression_id?: string;
  progression_id?: string;
  alternative_ids: string[];
  contraindications: PhysicalLimitation[];
  youtube_embed_url?: string;
  youtube_video_id?: string;
  image_url?: string;
  is_featured?: boolean;
}

export type ExerciseRole = 'foundation' | 'progression' | 'accessory' | 'core' | 'finisher';
export type ExerciseAdaptationAction = 'KEEP' | 'PROGRESS' | 'MODIFY' | 'REPLACE' | 'ADD' | 'REMOVE' | 'REGRESS';

export interface PrescribedExercise {
  exercise_id: string;
  original_exercise_id?: string;
  exercise_source?: 'planned' | 'user_alternative' | 'adaptive_rotation';
  sets: number;
  target_reps: string; // e.g., "8-12" or "30s"
  rest_seconds: number;
  tempo?: string; // e.g., "3-0-1-0"
  role?: ExerciseRole;
  adaptation_action?: ExerciseAdaptationAction;
  notes_fa?: string;
  why_prescribed_fa?: string;
  is_optional?: boolean;
  estimated_duration_mins?: number;
}

export interface TimeBudgetBreakdown {
  warmup_mins: number;
  main_workout_mins: number;
  accessory_mins: number;
  core_finisher_mins: number;
  rest_mins: number;
  transition_mins: number;
  total_estimated_mins: number;
  target_budget_mins: number;
}

export interface ProgramQualityCheckResult {
  passed: boolean;
  overall_score: number; // 0 to 100
  checks: Array<{
    id: string;
    name_fa: string;
    passed: boolean;
    detail_fa: string;
  }>;
}

export interface SportIdentityCard {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  physicalProfile: {
    age: number;
    sex: 'male' | 'female';
    heightCm: number;
    weightKg: number;
    bmi: number;
    bodyFatEstimate?: string;
    limitations?: PhysicalLimitation[];
  };
  strengthProfile?: {
    pushStrengthScore: number;
    pullStrengthScore: number;
    legStrengthScore: number;
    coreStrengthScore: number;
    gripStrengthScore: number;
    relativeStrengthScore: number;
  };
  skillProfile?: {
    pushupLevel: FitnessLevel;
    pullupLevel: FitnessLevel;
    dipLevel: FitnessLevel;
    squatLevel: FitnessLevel;
    coreControl: FitnessLevel;
    balance?: 'good' | 'fair' | 'poor';
    mobility?: 'restricted' | 'fair' | 'good' | 'excellent';
  };
  trainingProfile: {
    level: FitnessLevel;
    pushLevel?: FitnessLevel;
    pullLevel?: FitnessLevel;
    legsLevel?: FitnessLevel;
    coreLevel?: FitnessLevel;
    frequencyDays: number;
    sessionDurationMins: number;
    experienceMonths?: number;
    historyMonths?: number;
    recoveryCapacity?: 'low' | 'medium' | 'high';
    strengths?: string[];
    weaknesses?: string[];
  };
  environmentProfile: {
    environment: EnvironmentType;
    equipment: EquipmentType[];
  };
  goalProfile: {
    primaryGoal: GoalType;
    secondaryGoals: GoalType[];
  };
  recoveryProfile?: {
    sleepHours: number;
    dailyActivityLevel: string;
    estimatedRecoveryScore: 'low' | 'medium' | 'high';
  };
  safetyProfile: {
    limitations?: PhysicalLimitation[];
    activeLimitations?: PhysicalLimitation[];
    hasMedicalCondition?: boolean;
    medicalNotes?: string;
    safetyNotes?: string[];
  };
}

export interface AIProgramAnalysis {
  recommendedSplit: string;
  primaryFocusMuscles: string[];
  volumePrescription: string;
  adaptationDirection: 'increase_intensity' | 'decrease_intensity' | 'maintain_and_progress';
  keySafetyWarnings: string[];
  avgLoggedDifficulty?: number;
}

export interface WorkoutDay {
  day_number: number;
  title_fa: string;
  title_en: string;
  focus_fa: string;
  is_rest_day?: boolean;
  estimated_duration_mins?: number;
  intensity_level?: 'light' | 'moderate' | 'high' | 'challenging';
  time_budget_breakdown?: TimeBudgetBreakdown;
  week_theme_fa?: string;
  warmup: PrescribedExercise[];
  main_workout: PrescribedExercise[];
  accessory: PrescribedExercise[];
  finisher?: PrescribedExercise[];
  cooldown_mobility?: PrescribedExercise[];
}

export interface WeeklyProgramReview {
  week_number: number;
  phase_number?: number;
  completion_rate_percent?: number;
  total_sessions_completed?: number;
  total_sessions_scheduled?: number;
  average_rpe?: number;
  perceived_difficulty?: 'too_easy' | 'optimal' | 'too_hard';
  adaptation_strategy: 'Progression' | 'Maintenance' | 'Deload' | 'Variation' | 'Regression' | 'Consolidation';
  key_findings_fa: string[];
  adjustments_made_fa: string[];
  adherence_score?: number;
  completion_rate?: number;
  overall_rpe_avg?: number;
}

export interface WeeklyPerformanceAnalysisData {
  week_number: number;
  total_sessions_scheduled: number;
  total_sessions_completed: number;
  week_completion_rate: number;
  is_week_completed: boolean;
  average_rpe: number;
  average_fatigue: number;
  failure_rate: number;
  has_pain_flag: boolean;
  pain_locations: string[];
  adherence_score: number;
  recovery_status: 'optimal' | 'moderate' | 'fatigued' | 'compromised';
  overall_strategy_decision: 'Progression' | 'Consolidation' | 'Maintenance' | 'Deload' | 'Regression';
  strategy_reason_fa: string;
  strong_areas_fa: string[];
  weak_areas_fa: string[];
  generated_at: string;
}

export interface ExerciseContinuityItem {
  exercise_id: string;
  exercise_name_fa: string;
  role: ExerciseRole;
  week_status: Record<number, ExerciseAdaptationAction>;
  rationale_fa: string;
}

export interface WeeklyDifferenceSummary {
  week_a: number;
  week_b: number;
  is_identical: boolean;
  similarity_score_percent: number;
  shared_foundation_exercises: string[];
  reps_sets_variations_count: number;
  tempo_rest_adjustments_count: number;
  exercises_modified_or_replaced_count: number;
  status: 'passed_progressive' | 'failed_duplicate' | 'failed_too_random';
  status_fa: string;
}

export interface AntiDuplicationAuditReport {
  passed: boolean;
  total_weeks_audited: number;
  checks: {
    w1_vs_w2_distinct: boolean;
    w2_vs_w3_distinct: boolean;
    w3_vs_w4_distinct: boolean;
    structure_variation_passed: boolean;
    foundation_continuity_preserved: boolean;
    goal_alignment_passed: boolean;
  };
  weekly_comparisons: WeeklyDifferenceSummary[];
  engine_verdict_fa: string;
}

export interface WorkoutProgram {
  id: string;
  week_id?: string;
  title_fa: string;
  description_fa: string;
  level: FitnessLevel;
  goal: GoalType;
  days_per_week: number;
  session_duration_budget_mins?: number;
  phase_number: number; // e.g., 1, 2, 3
  phase_name_fa: string;
  current_week: number; // e.g., 1, 2, 3, 4
  week_focus_title_fa?: string;
  total_weeks: number; // e.g., 4 weeks per phase
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'deload';
  days: WorkoutDay[];
  scientific_notes_fa: string[];
  why_this_program_fa?: string;
  sport_identity_card?: SportIdentityCard;
  ai_program_analysis?: AIProgramAnalysis;
  weekly_review?: WeeklyProgramReview;
  history_reviews?: WeeklyProgramReview[];
  validation_passed?: boolean;
  workout_generation_report?: WorkoutGenerationReport;
  program_quality_check?: ProgramQualityCheckResult;
  exercise_continuity_matrix?: ExerciseContinuityItem[];
  anti_duplication_report?: AntiDuplicationAuditReport;
  weeks_map?: Record<number, WorkoutProgram>;
  weekly_performance_analysis?: WeeklyPerformanceAnalysisData;
}

export interface RejectedExerciseAudit {
  exercise_id: string;
  name_fa: string;
  name_en: string;
  reason: 'equipment_unavailable' | 'environment_mismatch' | 'injury_restriction' | 'difficulty_mismatch';
  reason_fa: string;
  required_equipment?: EquipmentType[];
  conflict_injuries?: PhysicalLimitation[];
}

export interface WorkoutGenerationReport {
  timestamp: string;
  user_environment: EnvironmentType;
  available_equipment: EquipmentType[];
  goal: GoalType;
  level: FitnessLevel;
  total_database_exercises: number;
  eligible_pool_size: number;
  rejected_exercises_count: number;
  rejected_gym_exercises_count: number;
  rejected_breakdown: {
    equipment_unavailable: number;
    environment_mismatch: number;
    injury_restriction: number;
    difficulty_mismatch: number;
  };
  rejected_reasons_summary: string[];
  rejected_details_sample?: RejectedExerciseAudit[];
  selected_exercises: Array<{
    id: string;
    name_fa: string;
    name_en: string;
    category: ExerciseCategory;
    movement_pattern: MovementPattern;
    difficulty: FitnessLevel;
    equipment: EquipmentType[];
  }>;
  validation: {
    passed: boolean;
    gym_only_exercises_in_home_count: number;
    unauthorized_equipment_count: number;
    contraindication_violations_count: number;
    violations_log: string[];
  };
}

export interface ExerciseLogItem {
  exercise_id: string;
  exercise_original_id?: string;
  exercise_performed_id?: string;
  exercise_source?: 'planned' | 'user_alternative' | 'adaptive_rotation';
  set_number: number;
  reps_completed: number;
  weight_kg?: number;
  rpe?: number; // Rate of Perceived Exertion 1-10
  difficulty_rating_1_10: number;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  program_id: string;
  week_number: number; // Isolated Week Context: 1, 2, 3, 4
  day_number: number;  // Day within the week: 1..7
  duration_minutes: number;
  logs: ExerciseLogItem[];
  overall_fatigue_1_10: number;
  notes?: string;
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name_fa: string;
  max_reps?: number;
  max_weight_kg?: number;
  date: string;
}

export interface YouTubeVideo {
  id: string;
  youtube_id: string;
  title_fa: string;
  description_fa: string;
  category: 'starter' | 'forearms' | 'technique' | 'challenges' | 'nutrition' | 'lifestyle' | 'pullups' | 'pushups' | 'calisthenics' | 'hypertrophy' | 'fat_loss';
  duration: string;
  thumbnail_url?: string;
  related_exercise_ids?: string[];
  featured?: boolean;
}

export interface Article {
  id: string;
  title_fa: string;
  slug: string;
  excerpt_fa: string;
  content_fa: string;
  category: 'science' | 'calisthenics' | 'nutrition' | 'technique' | 'mobility' | 'lifestyle';
  category_fa?: string;
  author: string;
  read_time_minutes: number;
  published_date: string;
  image_url: string;
  youtube_video_id?: string;
  related_exercise_ids?: string[];
  key_takeaways?: string[];
}

export interface Challenge {
  id: string;
  title_fa: string;
  description_fa: string;
  duration_days: number;
  category: 'pullup' | 'pushup' | 'core' | 'habit';
  badge_icon: string;
  daily_tasks: {
    day: number;
    title_fa: string;
    instructions_fa: string;
    exercise_ids: string[];
  }[];
}

export interface UserChallengeProgress {
  challenge_id: string;
  started_at: string;
  completed_days: number[];
  is_finished: boolean;
}

export interface ArticleComment {
  id: string;
  article_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Product {
  id: string;
  title_fa: string;
  description_fa: string;
  price_toman: number;
  is_free: boolean;
  image_url: string;
  features_fa: string[];
  category: 'course' | 'ebook' | 'specialized_plan';
  type?: string;
  duration_days?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  assessment?: UserAssessment;
  fitnessProfile?: FitnessProfile;
  currentProgram?: WorkoutProgram;
  workoutLogs: WorkoutLog[];
  personalRecords: PersonalRecord[];
  challengeProgress: UserChallengeProgress[];
  savedExerciseIds: string[];
  savedVideoIds: string[];
  bodyWeightLogs: { date: string; weightKg: number }[];
  isAdmin?: boolean;
  status?: 'active' | 'inactive';
  registeredAt?: string;
}

// ADMIN PANEL DOMAIN TYPES
export interface AdminActivityLog {
  id: string;
  adminUser: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  siteDescription: string;
  youtubeUrl: string;
  telegramAdminHandle: string;
  contactPhone: string;
  contactEmail: string;
  footerText: string;
  socialLinks: { platform: string; url: string }[];
}

export interface TypographySettings {
  headerFont: string;
  bodyFont: string;
  buttonFont: string;
  cardFont: string;
  fontSizeScale: 'normal' | 'large' | 'compact';
}

export interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  cardColor: string;
  borderColor: string;
  accentColor: string;
}

export interface HeroBanner {
  id: string;
  title_fa: string;
  description_fa: string;
  image_url: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  display_order: number;
}

export interface PageSection {
  id: string;
  section_key: string;
  title_fa: string;
  content_fa: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

export interface PageContent {
  id: string;
  page_slug: string; // e.g., 'home', 'workout', 'library', 'education', 'nutrition', 'articles', 'challenges', 'lifestyle', 'about', 'contact'
  page_title_fa: string;
  meta_description_fa: string;
  banner_url?: string;
  sections: PageSection[];
}

export interface MediaFile {
  id: string;
  filename: string;
  folder: 'character' | 'exercises' | 'workouts' | 'nutrition' | 'articles' | 'courses' | 'thumbnails' | 'site' | 'other';
  url: string;
  alt_text: string;
  created_at: string;
  size_kb?: number;
}

export interface AICoachKnowledge {
  id: string;
  title_fa: string;
  category: 'exercise_science' | 'nutrition' | 'safety' | 'faq' | 'calisthenics_technique';
  content_fa: string;
  sources: string[];
  is_active: boolean;
}

export interface NavItem {
  id: string;
  label_fa: string;
  tab_id: string;
  badge?: string;
  icon_name?: string;
  link_url?: string;
  is_active: boolean;
  display_order: number;
}

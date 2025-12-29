export type RepRange = {
  min: number;
  max: number;
};

export type RirRange = {
  min: number;
  max: number;
};

export type TechniqueFlag = "ok" | "bad" | null;

export interface ExerciseMeta {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  isCompound: boolean;
  defaultRepRange: RepRange;
  defaultRestSec: number;
  equipmentTags?: string[];
  defaultSets?: number;
  microIncrementOverrideKg?: number;
}

export interface ExercisePrescription {
  exerciseId: string;
  setsPlanned: number;
  repRange: RepRange;
  rirTarget: RirRange;
  restSec: number;
  loadRecommendationKg: number | null;
  progressionRule: "double_progression";
  notes?: string;
}

export interface SetLog {
  setIndex: number;
  reps: number;
  loadKg: number;
  rir: number | null;
  technique: TechniqueFlag;
  createdAt: number;
}

export interface ExerciseSessionLog {
  exerciseId: string;
  workSets?: SetLog[]; // preferido para progressão (séries de trabalho)
  feederSets?: SetLog[]; // aquecimento/feeder (não conta para progressão)
  sets?: SetLog[]; // compatibilidade legado (quando havia apenas um array)
  createdAt: number;
}

export interface WorkoutSessionLog {
  workoutId: string;
  dateISO: string;
  exercises: ExerciseSessionLog[];
  durationSec?: number;
}

export interface ProgressionSummaryEntry {
  dateISO: string;
  topSetReps: number;
  topSetLoadKg: number;
  avgRir: number | null;
  techniqueOkRate: number | null;
}

export interface ProgressionState {
  exerciseId: string;
  lastLoadKg: number | null;
  lastCompletedAt?: number;
  lastRepBest?: number;
  lastWasDeload?: boolean;
  lastNWorkoutsSummary: ProgressionSummaryEntry[];
  recommendedLoadKg: number | null;
  microIncrementKg: number;
  stallCounter: number;
  deloadUntilDateISO?: string | null;
}

export interface ExerciseRecommendation {
  exerciseId: string;
  action: "increase" | "maintain" | "reduce";
  recommendedLoadKg: number | null;
  reason: string;
  summary: {
    topSetReps: number;
    topSetLoadKg: number;
    avgRir: number | null;
  };
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  name?: string;
  tags?: string[];
  repRange?: RepRange;
  repRangeText?: string;
  restSec?: number;
  setsPlanned?: number;
  isCompound?: boolean;
  equipmentTags?: string[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}

export interface WorkoutPrescriptionRequest {
  exercises: WorkoutExerciseInput[];
  progressionByExerciseId?: Record<string, ProgressionState | undefined>;
  metaCatalog?: Record<string, ExerciseMeta>;
}

export interface WorkoutPrescriptionResult {
  prescriptions: ExercisePrescription[];
}

export interface ApplyWorkoutResultRequest {
  workoutLog: WorkoutSessionLog;
  currentProgression?: Record<string, ProgressionState | undefined>;
  metaCatalog?: Record<string, ExerciseMeta>;
}

export interface ApplyWorkoutResult {
  progressionByExerciseId: Record<string, ProgressionState>;
  recommendations: ExerciseRecommendation[];
}

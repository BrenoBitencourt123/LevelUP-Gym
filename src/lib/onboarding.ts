import type { UserWorkoutPlan, UserWorkout } from "@/lib/appState";
import type {
  OnboardingActivity,
  OnboardingGoal,
  OnboardingSex,
} from "@/lib/appState";
import type { WorkoutSchedule } from "@/lib/storage";
import { workouts, type Workout } from "@/data/workouts";

export type OnboardingInput = {
  birthDate: string;
  goal: OnboardingGoal;
  sex: OnboardingSex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: OnboardingActivity;
  trainingDays: number;
  targetWeightKg?: number;
  weeksTarget?: number;
};

export function getAgeFromBirthDate(birthDate: string): number {
  if (!birthDate) return 0;
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return 0;

  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1;
  const d = today.getDate();

  if (m < month || (m === month && d < day)) {
    age -= 1;
  }

  return Math.max(age, 0);
}

export function getActivityFactor(level: OnboardingActivity): number {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "high":
      return 1.725;
    case "athlete":
      return 1.9;
    default:
      return 1.2;
  }
}

export function calculateBmr(
  sex: OnboardingSex,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

function getGoalAdjustment(goal: OnboardingGoal): number {
  switch (goal) {
    case "fat_loss":
      return -0.15;
    case "muscle_gain":
      return 0.12;
    case "recomp":
      return -0.05;
    case "performance":
      return 0.05;
    case "maintenance":
    default:
      return 0;
  }
}

function getProteinPerKg(goal: OnboardingGoal): number {
  switch (goal) {
    case "fat_loss":
    case "recomp":
      return 2.0;
    case "muscle_gain":
      return 2.2;
    case "performance":
    case "maintenance":
    default:
      return 1.8;
  }
}

export function calculateNutritionTargets(input: OnboardingInput): {
  kcalTarget: number;
  pTarget: number;
  cTarget: number;
  gTarget: number;
} {
  const bmr = calculateBmr(input.sex, input.weightKg, input.heightCm, input.age);
  const tdee = bmr * getActivityFactor(input.activityLevel);
  const trainingBoost = getTrainingDayBoost(input.trainingDays);
  const baseKcal = tdee + trainingBoost;
  const targetAdjustment = getTargetDailyAdjustment(input);
  const kcalBase = targetAdjustment !== null
    ? baseKcal + targetAdjustment
    : baseKcal * (1 + getGoalAdjustment(input.goal));
  const kcal = Math.max(1200, Math.round(kcalBase));

  const proteinG = Math.round(input.weightKg * getProteinPerKg(input.goal));
  const fatG = Math.round(input.weightKg * 0.8);

  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const remainingKcal = Math.max(kcal - proteinKcal - fatKcal, 0);
  const carbsG = Math.round(remainingKcal / 4);

  return {
    kcalTarget: kcal,
    pTarget: proteinG,
    cTarget: carbsG,
    gTarget: fatG,
  };
}

const KCAL_PER_KG = 7700;
const SAFE_LOSS_KG_PER_WEEK = 0.75;
const SAFE_GAIN_KG_PER_WEEK = 0.4;
const TRAINING_DAY_KCAL = 80;

function getTrainingDayBoost(trainingDays?: number): number {
  if (!trainingDays || trainingDays <= 0) return 0;
  return Math.round((trainingDays * TRAINING_DAY_KCAL) / 7);
}

function getTargetDailyAdjustment(input: OnboardingInput): number | null {
  if (!input.targetWeightKg || !input.weeksTarget || input.weeksTarget <= 0) return null;

  const deltaKg = input.targetWeightKg - input.weightKg;
  const weeks = input.weeksTarget;

  if ((input.goal === "fat_loss" || input.goal === "recomp") && deltaKg >= 0) return 0;
  if (input.goal === "muscle_gain" && deltaKg <= 0) return 0;
  if (input.goal === "maintenance" || input.goal === "performance") return 0;

  let weeklyChange = deltaKg / weeks;

  if (input.goal === "fat_loss" || input.goal === "recomp") {
    weeklyChange = Math.max(weeklyChange, -SAFE_LOSS_KG_PER_WEEK);
    weeklyChange = Math.min(weeklyChange, 0);
  } else if (input.goal === "muscle_gain") {
    weeklyChange = Math.min(weeklyChange, SAFE_GAIN_KG_PER_WEEK);
    weeklyChange = Math.max(weeklyChange, 0);
  }

  return Math.round((weeklyChange * KCAL_PER_KG) / 7);
}

function convertWorkout(workout: Workout): UserWorkout {
  return {
    id: workout.id,
    titulo: workout.titulo,
    duracaoEstimada: workout.duracaoEstimada,
    exercicios: workout.exercicios.map((ex) => ({
      id: ex.id,
      nome: ex.nome,
      muscleGroup:
        ex.tags.find((t) => t !== "Principal" && t !== "Acessório") ||
        "Outro",
      tags: ex.tags,
      repsRange: ex.repsRange,
      descansoSeg: ex.descansoSeg,
      warmupEnabled: ex.warmupEnabled,
      feederSetsDefault: ex.feederSetsDefault,
      workSetsDefault: ex.workSetsDefault,
    })),
  };
}

function pickWorkoutIds(trainingDays: number): string[] {
  const ordered = ["upper-a", "lower-a", "upper-b", "lower-b"];
  if (trainingDays <= 2) return ordered.slice(0, 2);
  if (trainingDays === 3) return ordered.slice(0, 3);
  return ordered;
}

export function buildWorkoutPlan(trainingDays: number): UserWorkoutPlan {
  const selectedIds = pickWorkoutIds(trainingDays);
  const selectedWorkouts = selectedIds
    .map((id) => workouts[id])
    .filter(Boolean)
    .map(convertWorkout);

  return {
    workouts: selectedWorkouts,
    updatedAt: new Date().toISOString(),
  };
}

function getScheduleSlots(trainingDays: number): number[] {
  if (trainingDays <= 2) return [0, 3];
  if (trainingDays === 3) return [0, 2, 4];
  if (trainingDays === 4) return [0, 1, 3, 4];
  if (trainingDays === 5) return [0, 1, 2, 3, 4];
  return [0, 1, 2, 3, 4, 5];
}

export function buildWorkoutSchedule(
  trainingDays: number,
  workoutIds: string[]
): WorkoutSchedule {
  const schedule: WorkoutSchedule = [null, null, null, null, null, null, null];
  if (workoutIds.length === 0) return schedule;

  const slots = getScheduleSlots(trainingDays);
  slots.forEach((dayIndex, i) => {
    schedule[dayIndex] = workoutIds[i % workoutIds.length] ?? null;
  });
  return schedule;
}

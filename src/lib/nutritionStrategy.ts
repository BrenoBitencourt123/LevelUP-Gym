import { getLocalState, updateLocalState } from "@/lib/appState";
import { calculateBmr, getActivityFactor, getAgeFromBirthDate } from "@/lib/onboarding";
import { getWeightHistory, saveNutritionGoals, type NutritionGoals } from "@/lib/storage";
import type { ObjectiveType } from "@/lib/objectives";

export function getMaintenanceCalories(): number | null {
  const state = getLocalState();
  const onboarding = state.profile.onboarding;
  if (!onboarding) return null;

  const age = onboarding.age || getAgeFromBirthDate(onboarding.birthDate);
  if (!age || !onboarding.heightCm || !onboarding.weightKg || !onboarding.sex) return null;

  const bmr = calculateBmr(onboarding.sex, onboarding.weightKg, onboarding.heightCm, age);
  const tdee = bmr * getActivityFactor(onboarding.activityLevel);
  return Math.round(tdee);
}

function getGoalAdjustment(objectiveType: ObjectiveType): number {
  if (objectiveType === "perder_peso") return -0.15;
  if (objectiveType === "ganhar_massa") return 0.12;
  return 0;
}

export function applyQuickNutritionSetup(objectiveType: ObjectiveType): NutritionGoals {
  const state = getLocalState();
  const weightHistory = getWeightHistory();
  const latestWeight = weightHistory[0]?.weight;
  const onboardingWeight = state.profile.onboarding?.weightKg;
  const weightKg = latestWeight || onboardingWeight || 70;

  const maintenance = getMaintenanceCalories() ?? Math.round(weightKg * 30);
  const kcalTarget = Math.max(1200, Math.round(maintenance * (1 + getGoalAdjustment(objectiveType))));

  const proteinPerKg = objectiveType === "ganhar_massa" ? 2.0 : objectiveType === "perder_peso" ? 1.8 : 1.6;
  const fatPerKg = 0.8;

  const pTarget = Math.round(weightKg * proteinPerKg);
  const gTarget = Math.round(weightKg * fatPerKg);
  const usedKcal = pTarget * 4 + gTarget * 9;
  const cTarget = Math.max(0, Math.round((kcalTarget - usedKcal) / 4));

  const goals: NutritionGoals = {
    kcalTarget,
    pTarget,
    cTarget,
    gTarget,
  };

  saveNutritionGoals(goals);
  updateLocalState((prev) => ({
    ...prev,
    nutrition: {
      ...prev.nutrition,
      targets: {
        kcal: goals.kcalTarget,
        protein: goals.pTarget,
        carbs: goals.cTarget,
        fats: goals.gTarget,
      },
    },
  }));

  return goals;
}

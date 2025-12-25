import { getLocalState, updateLocalState } from "@/lib/appState";
import { getWeightHistory, saveNutritionGoals, type NutritionGoals } from "@/lib/storage";
import type { ObjectiveType } from "@/lib/objectives";

export function applyQuickNutritionSetup(objectiveType: ObjectiveType): NutritionGoals {
  const state = getLocalState();
  const weightHistory = getWeightHistory();
  const latestWeight = weightHistory[0]?.weight;
  const onboardingWeight = state.profile.onboarding?.weightKg;
  const weightKg = latestWeight || onboardingWeight || 70;

  const maintenance = Math.round(weightKg * 30);
  const kcalBias = objectiveType === "perder_peso" ? -300 : objectiveType === "ganhar_massa" ? 300 : 0;
  const kcalTarget = Math.max(1200, maintenance + kcalBias);

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

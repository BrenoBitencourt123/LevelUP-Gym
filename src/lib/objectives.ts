export type ObjectiveType = "perder_peso" | "ganhar_massa" | "manutencao";
export type ObjectiveStatus = "ativo" | "concluido" | "abandonado";
export type ObjectiveMetric = "peso" | "cintura" | "forca" | "faixa_peso" | "semanas";

export interface ObjectiveTarget {
  primaryMetric: ObjectiveMetric;
  primaryValue: number;
  secondaryMetric?: ObjectiveMetric;
  secondaryValue?: number;
  maintenanceRangeKg?: number;
  weeksTarget?: number;
  minReductionKg?: number;
}

export interface ObjectiveMetrics {
  weightKg?: number;
  waistCm?: number;
  strengthProxy?: number;
}

export interface ActiveObjective {
  id: string;
  type: ObjectiveType;
  title: string;
  startAt: string;
  target: ObjectiveTarget;
  startMetrics: ObjectiveMetrics;
  currentMetrics: ObjectiveMetrics;
  progressPercent: number;
  objectiveLevel: number;
  status: ObjectiveStatus;
  rewardXp: number;
  suggestedWeeks: number;
  completedAt?: string;
  rewardClaimed?: boolean;
  badgeId?: string;
  trainingDays?: number;
  trainingLevel?: "iniciante" | "intermediario";
  stableDays?: number;
  weeksCompleted?: number;
}

export interface ObjectiveMissionDefinition {
  id: string;
  title: string;
  xp: number;
  why: string;
  completionType: "quest" | "manual";
  questKey?: "treinoDoDiaDone" | "registrarAlimentacaoDone" | "registrarPesoDone";
  educationKey?: EducationKey;
}

export interface ObjectiveMission extends ObjectiveMissionDefinition {
  completed: boolean;
}

export interface WorkoutCheckIn {
  dateKey: string;
  status: "done" | "missed";
  workoutId?: string;
  resolvedAt: string;
}

export interface ObjectiveCampaignState {
  active?: ActiveObjective;
  history: ActiveObjective[];
  dailyMissions: Record<string, Record<string, boolean>>;
  workoutCheckIns: Record<string, WorkoutCheckIn>;
}

export interface ObjectiveTrainingProfile {
  basePlan: "upperLower";
  volumeMultiplier: number;
  cardioSuggestionPerWeek: number;
  repRangeFocus?: string;
}

export interface ObjectiveNutritionStrategy {
  label: string;
  description: string;
  kcalBias: "deficit" | "superavit" | "manutencao";
}

export interface ObjectiveCreationInput {
  type: ObjectiveType;
  startWeightKg: number;
  targetWeightKg?: number;
  startWaistCm?: number;
  targetWaistCm?: number;
  strengthProxy?: number;
  targetStrength?: number;
  weeksTarget: number;
  trainingDays: number;
  trainingLevel: "iniciante" | "intermediario";
  startAt?: string;
}

export type EducationKey =
  | "objective-strategy"
  | "objective-realistic-goals"
  | "progressive-overload"
  | "workout-why"
  | "nutrition-logging"
  | "nutrition-protein"
  | "mission-workout"
  | "mission-nutrition"
  | "mission-weight"
  | "mission-cardio"
  | "mission-sleep";

const OBJECTIVE_LEVELS = 10;
const MIN_REDUCTION_DEFAULT = 2;

export function getObjectiveTitle(type: ObjectiveType): string {
  switch (type) {
    case "perder_peso":
      return "Perder peso";
    case "ganhar_massa":
      return "Ganhar massa";
    case "manutencao":
      return "Manutencao";
  }
}

export function getObjectiveBadgeId(type: ObjectiveType): string {
  return `objetivo-${type}`;
}

export function getObjectiveTrainingProfile(type: ObjectiveType): ObjectiveTrainingProfile {
  if (type === "perder_peso") {
    return {
      basePlan: "upperLower",
      volumeMultiplier: 0.9,
      cardioSuggestionPerWeek: 2,
    };
  }
  if (type === "ganhar_massa") {
    return {
      basePlan: "upperLower",
      volumeMultiplier: 1.15,
      cardioSuggestionPerWeek: 1,
    };
  }
  return {
    basePlan: "upperLower",
    volumeMultiplier: 1.0,
    cardioSuggestionPerWeek: 1,
  };
}

export function getObjectiveNutritionStrategy(type: ObjectiveType): ObjectiveNutritionStrategy {
  if (type === "perder_peso") {
    return {
      label: "Deficit calorico",
      description: "Menos energia, mantendo proteina alta.",
      kcalBias: "deficit",
    };
  }
  if (type === "ganhar_massa") {
    return {
      label: "Superavit calorico",
      description: "Mais energia para crescer e recuperar.",
      kcalBias: "superavit",
    };
  }
  return {
    label: "Manutencao",
    description: "Equilibrio para manter resultados.",
    kcalBias: "manutencao",
  };
}

export function createObjective(input: ObjectiveCreationInput): ActiveObjective {
  const startAt = input.startAt ?? new Date().toISOString();
  const id = `obj-${Date.now()}`;
  const suggestedWeeks = clampNumber(input.weeksTarget, 4, 24);
  const rewardXp = clampNumber(Math.round(1500 + suggestedWeeks * 120), 1500, 5000);
  const minReductionKg = Math.max(MIN_REDUCTION_DEFAULT, Math.round(input.startWeightKg * 0.02));

  let target: ObjectiveTarget = {
    primaryMetric: "peso",
    primaryValue: input.targetWeightKg ?? input.startWeightKg,
    secondaryMetric: input.targetWaistCm ? "cintura" : undefined,
    secondaryValue: input.targetWaistCm,
    weeksTarget: suggestedWeeks,
    minReductionKg,
  };

  if (input.type === "manutencao") {
    target = {
      primaryMetric: "faixa_peso",
      primaryValue: input.targetWeightKg ?? input.startWeightKg,
      maintenanceRangeKg: 1,
      weeksTarget: suggestedWeeks,
    };
  }

  const objective: ActiveObjective = {
    id,
    type: input.type,
    title: getObjectiveTitle(input.type),
    startAt,
    target,
    startMetrics: {
      weightKg: input.startWeightKg,
      waistCm: input.startWaistCm,
      strengthProxy: input.strengthProxy,
    },
    currentMetrics: {
      weightKg: input.startWeightKg,
      waistCm: input.startWaistCm,
      strengthProxy: input.strengthProxy,
    },
    progressPercent: 0,
    objectiveLevel: 1,
    status: "ativo",
    rewardXp,
    suggestedWeeks,
    badgeId: getObjectiveBadgeId(input.type),
    trainingDays: input.trainingDays,
    trainingLevel: input.trainingLevel,
  };

  return applyObjectiveProgress(objective, { now: new Date() });
}

export function applyObjectiveProgress(
  objective: ActiveObjective,
  input: {
    weightHistory?: { weight: number; timestamp: string }[];
    consistency?: number;
    now?: Date;
  }
): ActiveObjective {
  const now = input.now ?? new Date();
  const updated: ActiveObjective = { ...objective };
  const latestWeight = getLatestWeight(input.weightHistory);
  if (latestWeight !== undefined) {
    updated.currentMetrics = {
      ...updated.currentMetrics,
      weightKg: latestWeight,
    };
  }

  const weeksCompleted = Math.max(0, Math.floor(daysBetween(updated.startAt, now) / 7));
  updated.weeksCompleted = weeksCompleted;

  let progressPercent = 0;
  let stableDays = 0;
  let isCompleted = false;

  if (objective.type === "perder_peso") {
    const startWeight = objective.startMetrics.weightKg ?? 0;
    const currentWeight = updated.currentMetrics.weightKg ?? startWeight;
    const targetWeight = objective.target.primaryValue || startWeight;
    const denom = Math.max(0.1, startWeight - targetWeight);
    const weightProgress = clampNumber((startWeight - currentWeight) / denom, 0, 1);
    const waistProgress = getSecondaryProgress(
      objective.startMetrics.waistCm,
      updated.currentMetrics.waistCm,
      objective.target.secondaryValue
    );
    const combined = waistProgress !== null ? weightProgress * 0.7 + waistProgress * 0.3 : weightProgress;
    const bonus = getConsistencyBonus(input.consistency);
    progressPercent = clampNumber(combined * 100 + bonus, 0, 95);

    const minReduction = objective.target.minReductionKg ?? MIN_REDUCTION_DEFAULT;
    const minReductionTarget = startWeight - minReduction;
    const stableDaysTarget = getStableDays(input.weightHistory, targetWeight, now);
    const stableDaysReduction = getStableDays(input.weightHistory, minReductionTarget, now);
    stableDays = Math.max(stableDaysTarget, stableDaysReduction);

    const reachedTarget = currentWeight <= targetWeight;
    const reachedReduction = currentWeight <= minReductionTarget;
    isCompleted =
      (reachedTarget && stableDaysTarget >= 7) ||
      (reachedReduction && stableDaysReduction >= 7);
  } else if (objective.type === "ganhar_massa") {
    const startWeight = objective.startMetrics.weightKg ?? 0;
    const currentWeight = updated.currentMetrics.weightKg ?? startWeight;
    const targetWeight = objective.target.primaryValue || startWeight;
    const denom = Math.max(0.1, targetWeight - startWeight);
    const weightProgress = clampNumber((currentWeight - startWeight) / denom, 0, 1);
    progressPercent = clampNumber(weightProgress * 100 + getConsistencyBonus(input.consistency), 0, 95);

    const weeksTarget = objective.target.weeksTarget ?? objective.suggestedWeeks;
    const consistentEnough = (input.consistency ?? 0) >= 70;
    isCompleted = currentWeight >= targetWeight || (weeksCompleted >= weeksTarget && consistentEnough);
  } else {
    const targetWeight = objective.target.primaryValue || objective.startMetrics.weightKg || 0;
    const range = objective.target.maintenanceRangeKg ?? 1;
    stableDays = getStableDaysInRange(input.weightHistory, targetWeight, range, now);
    const weeksTarget = objective.target.weeksTarget ?? objective.suggestedWeeks;
    progressPercent = clampNumber((stableDays / (weeksTarget * 7)) * 100, 0, 95);
    isCompleted = stableDays >= weeksTarget * 7;
  }

  if (isCompleted) {
    progressPercent = 100;
    updated.status = "concluido";
    updated.completedAt = updated.completedAt ?? now.toISOString();
  }

  updated.progressPercent = Math.round(progressPercent);
  updated.objectiveLevel = getObjectiveLevelFromPercent(updated.progressPercent);
  updated.stableDays = stableDays;
  return updated;
}

export function getObjectiveLevelFromPercent(percent: number): number {
  if (percent <= 0) return 1;
  const step = 100 / OBJECTIVE_LEVELS;
  return clampNumber(Math.ceil(percent / step), 1, OBJECTIVE_LEVELS);
}

export function getObjectiveRemainingLabel(objective: ActiveObjective): string {
  if (objective.type === "perder_peso") {
    const current = objective.currentMetrics.weightKg;
    const target = objective.target.primaryValue;
    if (current === undefined || !target) return "Acompanhe o peso";
    const diff = Math.max(0, current - target);
    return diff > 0 ? `Faltam ${diff.toFixed(1)} kg` : "Meta atingida";
  }
  if (objective.type === "ganhar_massa") {
    const current = objective.currentMetrics.weightKg;
    const target = objective.target.primaryValue;
    if (current === undefined || !target) return "Acompanhe o peso";
    const diff = Math.max(0, target - current);
    return diff > 0 ? `Faltam ${diff.toFixed(1)} kg` : "Meta atingida";
  }
  const range = objective.target.maintenanceRangeKg ?? 1;
  return `Manter dentro de ±${range} kg`;
}

export function buildObjectiveMissionDefinitions(type: ObjectiveType): ObjectiveMissionDefinition[] {
  if (type === "perder_peso") {
    return [
      {
        id: "treino",
        title: "Fazer treino do dia",
        xp: 150,
        why: "Treino mantem massa magra e acelera o gasto.",
        completionType: "quest",
        questKey: "treinoDoDiaDone",
        educationKey: "mission-workout",
      },
      {
        id: "nutricao",
        title: "Registrar alimentacao",
        xp: 80,
        why: "Registrar aumenta consciencia e adesao.",
        completionType: "quest",
        questKey: "registrarAlimentacaoDone",
        educationKey: "mission-nutrition",
      },
      {
        id: "cardio",
        title: "Passos ou cardio leve",
        xp: 70,
        why: "Movimento leve ajuda no deficit sem estresse.",
        completionType: "manual",
        educationKey: "mission-cardio",
      },
      {
        id: "peso",
        title: "Registrar peso (semanal)",
        xp: 120,
        why: "Pesos semanais mostram tendencia real.",
        completionType: "quest",
        questKey: "registrarPesoDone",
        educationKey: "mission-weight",
      },
    ];
  }

  if (type === "ganhar_massa") {
    return [
      {
        id: "treino",
        title: "Fazer treino do dia",
        xp: 150,
        why: "O estimulo certo gera adaptacao e ganho.",
        completionType: "quest",
        questKey: "treinoDoDiaDone",
        educationKey: "mission-workout",
      },
      {
        id: "nutricao",
        title: "Registrar alimentacao (foco proteina)",
        xp: 90,
        why: "Proteina suficiente sustenta hipertrofia.",
        completionType: "quest",
        questKey: "registrarAlimentacaoDone",
        educationKey: "nutrition-protein",
      },
      {
        id: "sono",
        title: "Dormir 7h+",
        xp: 70,
        why: "Recuperacao libera o crescimento.",
        completionType: "manual",
        educationKey: "mission-sleep",
      },
      {
        id: "peso",
        title: "Registrar peso (semanal)",
        xp: 120,
        why: "Acompanhar ganho evita excesso de gordura.",
        completionType: "quest",
        questKey: "registrarPesoDone",
        educationKey: "mission-weight",
      },
    ];
  }

  return [
    {
      id: "treino",
      title: "Fazer treino do dia",
      xp: 140,
      why: "Consistencia mantem sua base.",
      completionType: "quest",
      questKey: "treinoDoDiaDone",
      educationKey: "mission-workout",
    },
    {
      id: "nutricao",
      title: "Registrar alimentacao",
      xp: 80,
      why: "O controle evita sair da faixa.",
      completionType: "quest",
      questKey: "registrarAlimentacaoDone",
      educationKey: "mission-nutrition",
    },
    {
      id: "peso",
      title: "Registrar peso (semanal)",
      xp: 120,
      why: "Pequenas variacoes precisam de ajuste.",
      completionType: "quest",
      questKey: "registrarPesoDone",
      educationKey: "mission-weight",
    },
  ];
}

export function resolveObjectiveMissions(
  definitions: ObjectiveMissionDefinition[],
  completed: {
    treinoDoDiaDone: boolean;
    registrarAlimentacaoDone: boolean;
    registrarPesoDone: boolean;
    manual: Record<string, boolean>;
  }
): ObjectiveMission[] {
  return definitions.map((def) => {
    if (def.completionType === "manual") {
      return { ...def, completed: Boolean(completed.manual[def.id]) };
    }
    const questValue = def.questKey ? completed[def.questKey] : false;
    return { ...def, completed: Boolean(questValue) };
  });
}

function getLatestWeight(history?: { weight: number; timestamp: string }[]): number | undefined {
  if (!history || history.length === 0) return undefined;
  return history[0].weight;
}

function getSecondaryProgress(start?: number, current?: number, target?: number): number | null {
  if (start === undefined || current === undefined || target === undefined) return null;
  const denom = Math.max(0.1, start - target);
  return clampNumber((start - current) / denom, 0, 1);
}

function getConsistencyBonus(consistency?: number): number {
  if (!consistency) return 0;
  return clampNumber(Math.round(consistency / 20), 0, 6);
}

function getStableDays(
  history: { weight: number; timestamp: string }[] | undefined,
  threshold: number,
  now: Date
): number {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const thresholdEntry = sorted.find((entry) => entry.weight <= threshold);
  if (!thresholdEntry) return 0;

  const thresholdTime = new Date(thresholdEntry.timestamp).getTime();
  const exceededAfter = sorted.some(
    (entry) => new Date(entry.timestamp).getTime() > thresholdTime && entry.weight > threshold
  );
  if (exceededAfter) return 0;

  const diffDays = Math.floor((now.getTime() - thresholdTime) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function getStableDaysInRange(
  history: { weight: number; timestamp: string }[] | undefined,
  target: number,
  range: number,
  now: Date
): number {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const outOfRange = sorted.find((entry) => Math.abs(entry.weight - target) > range);
  const startTime = outOfRange ? new Date(outOfRange.timestamp).getTime() : new Date(sorted[sorted.length - 1].timestamp).getTime();
  const diffDays = Math.floor((now.getTime() - startTime) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function daysBetween(startAt: string, now: Date): number {
  const start = new Date(startAt).getTime();
  return Math.max(0, Math.floor((now.getTime() - start) / (1000 * 60 * 60 * 24)));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

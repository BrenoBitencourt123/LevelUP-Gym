import {
  ApplyWorkoutResult,
  ApplyWorkoutResultRequest,
  ExerciseMeta,
  ExercisePrescription,
  ExerciseRecommendation,
  ProgressionState,
  RepRange,
  RirRange,
  SetLog,
  WorkoutExerciseInput,
  WorkoutPrescriptionRequest,
  WorkoutPrescriptionResult,
} from "./types";

const DEFAULT_REP_RANGE: RepRange = { min: 6, max: 10 };
const DEFAULT_RIR_COMPOUND: RirRange = { min: 1, max: 2 };
const DEFAULT_RIR_ISOLATION: RirRange = { min: 0, max: 1 };
const DEFAULT_REST_COMPOUND = 120;
const DEFAULT_REST_ISOLATION = 90;
const DEFAULT_SETS_PLANNED = 3;

const MAX_SUMMARY_ITEMS = 8;
const MIN_LOAD_KG = 0.5;

const BARBELL_HINT_IDS = new Set([
  "supino-reto",
  "agachamento-livre",
  "levantamento-terra",
  "remada-curvada",
  "desenvolvimento",
  "desenvolvimento-arnold",
]);

const NON_MUSCLE_TAGS = new Set(["principal", "acessório", "acessorio", "accessory"]);

function parseRepRange(text?: string): RepRange {
  if (!text) return DEFAULT_REP_RANGE;
  const numbers = text.match(/\d+/g)?.map((n) => Number(n));
  if (numbers && numbers.length >= 2) return { min: numbers[0], max: numbers[1] };
  if (numbers && numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return DEFAULT_REP_RANGE;
}

function inferPrimaryMuscles(tags?: string[]): string[] {
  if (!tags || tags.length === 0) return ["unknown"];
  const muscles = tags
    .map((t) => t.toLowerCase())
    .filter((t) => !NON_MUSCLE_TAGS.has(t));
  return muscles.length > 0 ? muscles : ["unknown"];
}

function inferIsCompound(tags?: string[]): boolean {
  if (!tags || tags.length === 0) return true;
  const lower = tags.map((t) => t.toLowerCase());

  const hasKnownMarker =
    lower.includes("principal") ||
    lower.includes("acessório") ||
    lower.includes("acessorio") ||
    lower.includes("accessory");

  if (!hasKnownMarker) return true;
  return lower.includes("principal");
}

function resolveMicroIncrement(meta: ExerciseMeta, state?: ProgressionState): number {
  if (meta.microIncrementOverrideKg && meta.microIncrementOverrideKg > 0) return meta.microIncrementOverrideKg;
  if (state?.microIncrementKg && state.microIncrementKg > 0) return state.microIncrementKg;
  if (meta.equipmentTags?.includes("barbell") || BARBELL_HINT_IDS.has(meta.id)) return 2.5;
  return 1;
}

function buildMetaFromInput(input: WorkoutExerciseInput, fallback?: ExerciseMeta): ExerciseMeta {
  const repRange = input.repRange ?? fallback?.defaultRepRange ?? parseRepRange(input.repRangeText);

  const isCompound =
    input.isCompound ??
    fallback?.isCompound ??
    inferIsCompound(input.tags ?? fallback?.primaryMuscles);

  const restSec =
    input.restSec ??
    fallback?.defaultRestSec ??
    (isCompound ? DEFAULT_REST_COMPOUND : DEFAULT_REST_ISOLATION);

  return {
    id: input.exerciseId,
    name: input.name ?? fallback?.name ?? input.exerciseId,
    primaryMuscles: input.primaryMuscles ?? fallback?.primaryMuscles ?? inferPrimaryMuscles(input.tags),
    secondaryMuscles: input.secondaryMuscles ?? fallback?.secondaryMuscles,
    isCompound: isCompound ?? true,
    defaultRepRange: repRange,
    defaultRestSec: restSec,
    equipmentTags: input.equipmentTags ?? fallback?.equipmentTags,
    defaultSets: input.setsPlanned ?? fallback?.defaultSets ?? DEFAULT_SETS_PLANNED,
    microIncrementOverrideKg: fallback?.microIncrementOverrideKg,
  };
}

function computeAvgRir(sets: SetLog[]): number | null {
  const rirValues = sets.map((s) => s.rir).filter((v): v is number => typeof v === "number");
  if (rirValues.length === 0) return null;
  const sum = rirValues.reduce((acc, v) => acc + v, 0);
  return Number((sum / rirValues.length).toFixed(2));
}

function computeTechniqueOkRate(sets: SetLog[]): number | null {
  if (sets.length === 0) return null;
  const badCount = sets.filter((s) => s.technique === "bad").length;
  const okCount = sets.length - badCount;
  return Number(((okCount / sets.length) * 100).toFixed(1));
}

function getTopSet(sets: SetLog[]): { reps: number; loadKg: number } | null {
  if (sets.length === 0) return null;
  return sets.reduce(
    (best, current) => {
      if (current.reps > best.reps) return { reps: current.reps, loadKg: current.loadKg };
      if (current.reps === best.reps && current.loadKg > best.loadKg) {
        return { reps: current.reps, loadKg: current.loadKg };
      }
      return best;
    },
    { reps: sets[0].reps, loadKg: sets[0].loadKg }
  );
}

function normalizeLoadKg(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) return null;
  const rounded = Number(value.toFixed(2));
  if (rounded <= 0) return MIN_LOAD_KG;
  return Math.max(rounded, MIN_LOAD_KG);
}

function getRirTarget(meta: ExerciseMeta): RirRange {
  return meta.isCompound ? DEFAULT_RIR_COMPOUND : DEFAULT_RIR_ISOLATION;
}

export function getWorkoutPrescription(params: WorkoutPrescriptionRequest): WorkoutPrescriptionResult {
  const { exercises, progressionByExerciseId = {}, metaCatalog = {} } = params;

  const prescriptions: ExercisePrescription[] = exercises.map((exercise) => {
    const fallbackMeta = metaCatalog[exercise.exerciseId];
    const meta = buildMetaFromInput(exercise, fallbackMeta);
    const rirTarget = getRirTarget(meta);

    const progression = progressionByExerciseId[exercise.exerciseId];
    const load = progression?.recommendedLoadKg ?? progression?.lastLoadKg ?? null;

    return {
      exerciseId: exercise.exerciseId,
      setsPlanned: exercise.setsPlanned ?? meta.defaultSets ?? DEFAULT_SETS_PLANNED,
      repRange: meta.defaultRepRange,
      rirTarget,
      restSec: meta.defaultRestSec,
      loadRecommendationKg: load,
      progressionRule: "double_progression",
      notes: `Suba a carga quando bater ${meta.defaultRepRange.max} reps em todas as séries com RIR ~${rirTarget.min}-${rirTarget.max}.`,
    };
  });

  return { prescriptions };
}

export function applyWorkoutResult(params: ApplyWorkoutResultRequest): ApplyWorkoutResult {
  const { workoutLog, currentProgression = {}, metaCatalog = {} } = params;

  const updated: Record<string, ProgressionState> = { ...currentProgression };
  const recommendations: ExerciseRecommendation[] = [];

  for (const session of workoutLog.exercises) {
    const existing = currentProgression[session.exerciseId];

    // Tenta aproveitar dados do session se existirem (sem depender disso)
    const s: any = session as any;

    const metaInput: WorkoutExerciseInput = {
      exerciseId: session.exerciseId,
      name: s?.name ?? s?.exerciseName ?? undefined,
      tags: s?.tags ?? undefined,
      repRange: s?.repRange ?? undefined,
      repRangeText: s?.repRangeText ?? s?.repsRangeText ?? s?.repsRange ?? undefined,
      restSec: s?.restSec ?? undefined,
      setsPlanned: s?.setsPlanned ?? undefined,
      isCompound: s?.isCompound ?? undefined,
      primaryMuscles: s?.primaryMuscles ?? undefined,
      secondaryMuscles: s?.secondaryMuscles ?? undefined,
      equipmentTags: s?.equipmentTags ?? undefined,
    };

    const meta = buildMetaFromInput(metaInput, metaCatalog[session.exerciseId]);
    const rirTarget = getRirTarget(meta);
    const microIncrement = resolveMicroIncrement(meta, existing);

    const workSets: SetLog[] = (session as any).workSets ?? (session as any).sets ?? [];

    const topSet = getTopSet(workSets);
    const avgRir = computeAvgRir(workSets);
    const techniqueOkRate = computeTechniqueOkRate(workSets);
    const anyTechniqueBad = workSets.some((s) => s.technique === "bad");

    const belowMinCount = workSets.filter((s) => s.reps < meta.defaultRepRange.min).length;
    const majorityBelowMin = workSets.length > 0 && belowMinCount > workSets.length / 2;

    const allSetsAtOrAboveTop =
      workSets.length > 0 && workSets.every((s) => s.reps >= meta.defaultRepRange.max);

    const inDeload =
      existing?.deloadUntilDateISO &&
      new Date(workoutLog.dateISO).getTime() <= new Date(existing.deloadUntilDateISO).getTime();

    // ✅ Carga da sessão: ignora topSet com load 0 (muito comum quando usuário ainda não definiu carga)
    const topSetLoad = typeof topSet?.loadKg === "number" ? topSet.loadKg : null;
    const existingLoad = typeof existing?.lastLoadKg === "number" ? existing.lastLoadKg : null;

    const sessionLoad =
      topSetLoad !== null && topSetLoad > 0
        ? topSetLoad
        : existingLoad !== null && existingLoad > 0
        ? existingLoad
        : null;

    let action: ExerciseRecommendation["action"] = "maintain";
    let recommendedLoadKg: number | null = sessionLoad;
    let stallCounter = existing?.stallCounter ?? 0;
    let reason = "Mantido para consolidar o range de reps.";

    const prevSummary = existing?.lastNWorkoutsSummary?.[0];

    // Se não tem resumo anterior, não “pune” com stall no começo
    const progressed = !prevSummary
      ? true
      : Boolean(
          sessionLoad !== null &&
            ((topSet?.loadKg ?? 0) > prevSummary.topSetLoadKg ||
              ((topSet?.loadKg ?? 0) === prevSummary.topSetLoadKg && (topSet?.reps ?? 0) > prevSummary.topSetReps))
        );

    const rirTooLow = avgRir !== null && avgRir < rirTarget.min - 0.5;

    if (sessionLoad === null) {
      action = "maintain";
      recommendedLoadKg = null;
      stallCounter = 0;
      reason = "Defina a carga inicial para receber recomendações.";
    } else if (majorityBelowMin || rirTooLow || anyTechniqueBad) {
      action = "reduce";
      recommendedLoadKg = normalizeLoadKg(sessionLoad - microIncrement);
      stallCounter += 1;
      reason = majorityBelowMin
        ? "Reps abaixo do mínimo em mais da metade das séries."
        : anyTechniqueBad
        ? "Técnica marcada como ruim."
        : "Esforço muito alto (RIR muito baixo).";
    } else if (
      allSetsAtOrAboveTop &&
      !inDeload &&
      (avgRir === null || avgRir >= rirTarget.min - 0.5) &&
      !anyTechniqueBad
    ) {
      action = "increase";
      recommendedLoadKg = normalizeLoadKg(sessionLoad + microIncrement);
      stallCounter = 0;
      reason = "Topo do range batido em todas as séries com RIR adequado.";
    } else {
      action = "maintain";
      recommendedLoadKg = normalizeLoadKg(sessionLoad);

      if (!progressed) {
        if (!inDeload) stallCounter += 1;
        reason = "Ainda não bateu o topo em todas as séries.";
      } else {
        reason = "Progresso de reps/carga dentro do range. Mantendo.";
      }
    }

    if (inDeload && action === "maintain") {
      stallCounter = 0;
      reason = "Deload ativo: mantenha a carga e foque em execução/técnica.";
    }

    const summary = {
      dateISO: workoutLog.dateISO,
      topSetReps: topSet?.reps ?? 0,
      topSetLoadKg: topSet?.loadKg ?? 0,
      avgRir,
      techniqueOkRate,
    };

    updated[session.exerciseId] = {
      exerciseId: session.exerciseId,
      lastLoadKg: sessionLoad,
      lastCompletedAt: Date.parse(workoutLog.dateISO) || Date.now(),
      lastRepBest: topSet?.reps ?? existing?.lastRepBest,
      lastWasDeload: Boolean(inDeload),
      lastNWorkoutsSummary: [summary, ...(existing?.lastNWorkoutsSummary ?? [])].slice(0, MAX_SUMMARY_ITEMS),
      recommendedLoadKg,
      microIncrementKg: microIncrement,
      stallCounter,
      deloadUntilDateISO: existing?.deloadUntilDateISO ?? null,
    };

    recommendations.push({
      exerciseId: session.exerciseId,
      action,
      recommendedLoadKg,
      reason,
      summary: {
        topSetReps: summary.topSetReps,
        topSetLoadKg: summary.topSetLoadKg,
        avgRir: summary.avgRir,
      },
    });
  }

  return { progressionByExerciseId: updated, recommendations };
}

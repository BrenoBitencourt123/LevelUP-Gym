const DEFAULT_REP_RANGE = { min: 6, max: 10 };
const DEFAULT_RIR_COMPOUND = { min: 1, max: 2 };
const DEFAULT_RIR_ISOLATION = { min: 0, max: 1 };
const DEFAULT_REST_COMPOUND = 120;
const DEFAULT_REST_ISOLATION = 90;
const DEFAULT_SETS_PLANNED = 3;
const MAX_SUMMARY_ITEMS = 8;
const BARBELL_HINT_IDS = new Set([
    "supino-reto",
    "agachamento-livre",
    "levantamento-terra",
    "remada-curvada",
    "desenvolvimento",
    "desenvolvimento-arnold",
]);
const NON_MUSCLE_TAGS = new Set(["principal", "acessório", "acessorio", "accessory"]);
function parseRepRange(text) {
    if (!text)
        return DEFAULT_REP_RANGE;
    const numbers = text.match(/\d+/g)?.map((n) => Number(n));
    if (numbers && numbers.length >= 2) {
        return { min: numbers[0], max: numbers[1] };
    }
    if (numbers && numbers.length === 1) {
        return { min: numbers[0], max: numbers[0] };
    }
    return DEFAULT_REP_RANGE;
}
function inferPrimaryMuscles(tags) {
    if (!tags || tags.length === 0)
        return ["unknown"];
    const muscles = tags
        .map((t) => t.toLowerCase())
        .filter((t) => !NON_MUSCLE_TAGS.has(t));
    return muscles.length > 0 ? muscles : ["unknown"];
}
function inferIsCompound(tags) {
    if (!tags || tags.length === 0)
        return true;
    const lower = tags.map((t) => t.toLowerCase());
    const hasKnownMarker = lower.includes("principal") ||
        lower.includes("acessório") ||
        lower.includes("acessorio") ||
        lower.includes("accessory");
    if (!hasKnownMarker)
        return true;
    return lower.includes("principal");
}
function resolveMicroIncrement(meta, state) {
    if (meta.microIncrementOverrideKg && meta.microIncrementOverrideKg > 0) {
        return meta.microIncrementOverrideKg;
    }
    if (state?.microIncrementKg && state.microIncrementKg > 0) {
        return state.microIncrementKg;
    }
    if (meta.equipmentTags?.includes("barbell") || BARBELL_HINT_IDS.has(meta.id)) {
        return 2.5;
    }
    return 1;
}
function buildMetaFromInput(input, fallback) {
    const repRange = input.repRange ?? fallback?.defaultRepRange ?? parseRepRange(input.repRangeText);
    const isCompound = input.isCompound ?? fallback?.isCompound ?? inferIsCompound(input.tags ?? fallback?.primaryMuscles);
    const restSec = input.restSec ??
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
function computeAvgRir(sets) {
    const rirValues = sets.map((s) => s.rir).filter((v) => typeof v === "number");
    if (rirValues.length === 0)
        return null;
    const sum = rirValues.reduce((acc, v) => acc + v, 0);
    return Number((sum / rirValues.length).toFixed(2));
}
function computeTechniqueOkRate(sets) {
    if (sets.length === 0)
        return null;
    const badCount = sets.filter((s) => s.technique === "bad").length;
    const okCount = sets.length - badCount;
    return Number(((okCount / sets.length) * 100).toFixed(1));
}
function getTopSet(sets) {
    if (sets.length === 0)
        return null;
    return sets.reduce((best, current) => {
        if (current.reps > best.reps)
            return { reps: current.reps, loadKg: current.loadKg };
        if (current.reps === best.reps && current.loadKg > best.loadKg) {
            return { reps: current.reps, loadKg: current.loadKg };
        }
        return best;
    }, { reps: sets[0].reps, loadKg: sets[0].loadKg });
}
function ensurePositive(value) {
    if (value === null || Number.isNaN(value))
        return null;
    return value < 0 ? 0 : Number(value.toFixed(2));
}
function getRirTarget(meta) {
    return meta.isCompound ? DEFAULT_RIR_COMPOUND : DEFAULT_RIR_ISOLATION;
}
export function getWorkoutPrescription(params) {
    const { exercises, progressionByExerciseId = {}, metaCatalog = {} } = params;
    const prescriptions = exercises.map((exercise) => {
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
            notes: `Suba carga quando bater ${meta.defaultRepRange.max} reps em todas as series com RIR ~${rirTarget.min}-${rirTarget.max}.`,
        };
    });
    return { prescriptions };
}
export function applyWorkoutResult(params) {
    const { workoutLog, currentProgression = {}, metaCatalog = {} } = params;
    const updated = { ...currentProgression };
    const recommendations = [];
    for (const session of workoutLog.exercises) {
        const existing = currentProgression[session.exerciseId];
        const meta = buildMetaFromInput({ exerciseId: session.exerciseId }, metaCatalog[session.exerciseId]);
        const rirTarget = getRirTarget(meta);
        const microIncrement = resolveMicroIncrement(meta, existing);
        // Considerar apenas work sets (se presentes); fallback para sets (compatibilidade)
        const workSets = session.workSets ?? session.sets ?? [];
        const topSet = getTopSet(workSets);
        const avgRir = computeAvgRir(workSets);
        const techniqueOkRate = computeTechniqueOkRate(workSets);
        const anyTechniqueBad = workSets.some((s) => s.technique === "bad");
        const belowMinCount = workSets.filter((s) => s.reps < meta.defaultRepRange.min).length;
        const majorityBelowMin = workSets.length > 0 && belowMinCount > workSets.length / 2;
        const allSetsAtOrAboveTop = workSets.length > 0 && workSets.every((s) => s.reps >= meta.defaultRepRange.max);
        const inDeload = existing?.deloadUntilDateISO &&
            new Date(workoutLog.dateISO).getTime() <= new Date(existing.deloadUntilDateISO).getTime();
        const sessionLoad = topSet?.loadKg ?? existing?.lastLoadKg ?? null;
        let action = "maintain";
        let recommendedLoadKg = sessionLoad;
        let stallCounter = existing?.stallCounter ?? 0;
        let reason = "Mantido para consolidar o range de reps.";
        const prevSummary = existing?.lastNWorkoutsSummary?.[0];
        const progressed = Boolean(prevSummary &&
            sessionLoad !== null &&
            ((topSet?.loadKg ?? 0) > prevSummary.topSetLoadKg ||
                ((topSet?.loadKg ?? 0) === prevSummary.topSetLoadKg &&
                    (topSet?.reps ?? 0) > prevSummary.topSetReps)));
        const rirTooLow = avgRir !== null && avgRir < rirTarget.min - 0.5;
        if (sessionLoad === null) {
            action = "maintain";
            recommendedLoadKg = null;
            stallCounter = 0;
            reason = "Defina a carga inicial para receber recomendacoes.";
        }
        else if (majorityBelowMin || rirTooLow || anyTechniqueBad) {
            action = "reduce";
            recommendedLoadKg = ensurePositive(sessionLoad - microIncrement);
            stallCounter += 1;
            reason = majorityBelowMin
                ? "Reps abaixo do minimo em mais da metade das series."
                : anyTechniqueBad
                    ? "Tecnica marcada como ruim."
                    : "Esforco muito alto (RIR muito baixo).";
        }
        else if (allSetsAtOrAboveTop &&
            !inDeload &&
            (avgRir === null || avgRir >= rirTarget.min - 0.5) &&
            !anyTechniqueBad) {
            action = "increase";
            recommendedLoadKg = ensurePositive(sessionLoad + microIncrement);
            stallCounter = 0;
            reason = "Top do range batido em todas as series com RIR adequado.";
        }
        else {
            action = "maintain";
            recommendedLoadKg = sessionLoad;
            if (!progressed) {
                stallCounter += 1;
                reason = "Ainda nao bateu o topo em todas as series.";
            }
            else {
                reason = "Progresso de reps/carga dentro do range. Mantendo.";
            }
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
            lastWasDeload: inDeload,
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

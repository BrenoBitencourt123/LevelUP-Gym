// Como testar rapidamente (Node puro):
// npx tsc scripts/engineHarness.ts src/engine/trainingEngine.ts src/engine/types.ts --module ESNext --moduleResolution Node --target ES2020 --outDir scripts/tmp
// node scripts/tmp/scripts/engineHarness.js

import { applyWorkoutResult, getWorkoutPrescription } from "../src/engine/trainingEngine.js";
import {
  ExerciseMeta,
  ProgressionState,
  SetLog,
  WorkoutSessionLog,
} from "../src/engine/types.js";

const baseMeta: ExerciseMeta = {
  id: "exemplo-composto",
  name: "Supino Exemplo",
  primaryMuscles: ["chest"],
  isCompound: true,
  defaultRepRange: { min: 6, max: 10 },
  defaultRestSec: 120,
  equipmentTags: ["barbell"],
  defaultSets: 3,
};

function buildSets(values: Array<{ reps: number; load: number; rir: number | null }>): SetLog[] {
  return values.map((v, idx) => ({
    setIndex: idx,
    reps: v.reps,
    loadKg: v.load,
    rir: v.rir,
    technique: null,
    createdAt: Date.now(),
  }));
}

function runScenario(
  label: string,
  setValues: Array<{ reps: number; load: number; rir: number | null }>,
  lastLoad: number | null
) {
  const log: WorkoutSessionLog = {
    workoutId: "w1",
    dateISO: new Date().toISOString(),
    exercises: [
      {
        exerciseId: baseMeta.id,
        sets: buildSets(setValues),
        createdAt: Date.now(),
      },
    ],
  };

  const progressionState: Record<string, ProgressionState> =
    lastLoad === null
      ? {}
      : {
          [baseMeta.id]: {
            exerciseId: baseMeta.id,
            lastLoadKg: lastLoad,
            lastCompletedAt: Date.now(),
            lastWasDeload: false,
            lastNWorkoutsSummary: [],
            recommendedLoadKg: lastLoad,
            microIncrementKg: 2.5,
            stallCounter: 0,
            deloadUntilDateISO: null,
          },
        };

  const prescription = getWorkoutPrescription({
    exercises: [{ exerciseId: baseMeta.id, setsPlanned: 3, repRange: baseMeta.defaultRepRange }],
    progressionByExerciseId: progressionState,
    metaCatalog: { [baseMeta.id]: baseMeta },
  });

  const result = applyWorkoutResult({
    workoutLog: log,
    currentProgression: progressionState,
    metaCatalog: { [baseMeta.id]: baseMeta },
  });

  const rec = result.recommendations[0];

  console.log(`\n=== ${label} ===`);
  console.log("Prescription:", prescription.prescriptions[0]);
  console.log("Sets logged:", setValues);
  console.log("Recommendation:", rec.action, "->", rec.recommendedLoadKg, "| reason:", rec.reason);
}

runScenario(
  "Cenario 1: 3x10 (sobe carga)",
  [
    { reps: 10, load: 80, rir: 1 },
    { reps: 10, load: 80, rir: 1 },
    { reps: 10, load: 80, rir: 2 },
  ],
  80
);

runScenario(
  "Cenario 2: 8/8/7 (mantem)",
  [
    { reps: 8, load: 80, rir: 1 },
    { reps: 8, load: 80, rir: 1 },
    { reps: 7, load: 80, rir: 2 },
  ],
  80
);

runScenario(
  "Cenario 3: 5/5/6 (reduz)",
  [
    { reps: 5, load: 80, rir: 0 },
    { reps: 5, load: 80, rir: 0 },
    { reps: 6, load: 80, rir: 0 },
  ],
  80
);

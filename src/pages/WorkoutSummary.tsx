import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy, ArrowRight, CheckCircle, Dumbbell, TrendingUp, MinusCircle } from "lucide-react";
import {
  getUserWorkout,
  completeTreinoDoDia,
  getWorkoutSummaryStats,
  getTreinoProgresso,
  saveExerciseSnapshot,
  saveWorkoutCompleted,
  ExerciseSetSnapshot,
  getProgressionByExercise,
  saveProgressionByExercise,
} from "@/lib/storage";
import { markWorkoutCompletedThisWeek, updateLocalState } from "@/lib/appState";
import { getWorkoutOfDay } from "@/lib/weekUtils";
import BottomNav from "@/components/BottomNav";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";
import { refreshActiveObjectiveProgress } from "@/lib/objectiveState";
import { applyWorkoutResult } from "@/engine/trainingEngine";
import type { ExerciseMeta, ExerciseSessionLog, SetLog } from "@/engine/types";
import { COPY } from "@/content/copyTreino";

const XP_PER_WORKOUT = 150;

const NON_MUSCLE_TAGS = new Set(["principal", "acessório", "acessorio", "accessory"]);

const parseRepRange = (text?: string): { min: number; max: number } => {
  if (!text) return { min: 6, max: 10 };
  const nums = text.match(/\d+/g)?.map((n) => Number(n)) ?? [];
  if (nums.length >= 2) return { min: nums[0], max: nums[1] };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: 6, max: 10 };
};

const inferPrimaryMusclesFromTags = (tags?: string[]) => {
  if (!tags || tags.length === 0) return ["unknown"];
  const muscles = tags
    .map((t) => t.toLowerCase())
    .filter((t) => !NON_MUSCLE_TAGS.has(t));
  return muscles.length > 0 ? muscles : ["unknown"];
};

const inferIsCompoundFromTags = (tags?: string[]) => {
  if (!tags || tags.length === 0) return true;
  const lower = tags.map((t) => t.toLowerCase());

  const hasKnownMarker =
    lower.includes("principal") ||
    lower.includes("acessório") ||
    lower.includes("acessorio") ||
    lower.includes("accessory");

  if (!hasKnownMarker) return true;
  return lower.includes("principal");
};

const formatLoad = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return COPY.chips.loadMissing;
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`;
};

const WorkoutSummary = () => {
  const { treinoId } = useParams();
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();

  const defaultWorkoutId = getWorkoutOfDay() || "upper-a";
  const workoutId = treinoId || defaultWorkoutId;
  const workout = getUserWorkout(workoutId);

  const snapshotSavedRef = useRef(false);
  const [showTechById, setShowTechById] = useState<Record<string, boolean>>({});

  const { completedSets, totalSets, totalVolume } = getWorkoutSummaryStats(workoutId);
  const progressionMap = useMemo(() => getProgressionByExercise(), []);

  const engineResult = useMemo(() => {
    if (!workout) return null;

    const progresso = getTreinoProgresso();
    const workoutProgress = progresso[workoutId] ?? {};
    const exercisesLog: ExerciseSessionLog[] = [];

    const now = Date.now();

    for (const exercise of workout.exercicios) {
      const prog = workoutProgress[exercise.id];
      const doneSets = prog?.workSets?.filter((s) => s.done) ?? [];
      if (doneSets.length === 0) continue;

      const workSets: SetLog[] = doneSets.map((set, idx) => ({
        setIndex: idx,
        reps: set.reps,
        loadKg: set.kg,
        rir: set.rir ?? null,
        technique: null,
        createdAt: now,
      }));

      exercisesLog.push({
        exerciseId: exercise.id,
        workSets,
        createdAt: now,
      });
    }

    if (exercisesLog.length === 0) return null;

    const metaCatalog: Record<string, ExerciseMeta> = Object.fromEntries(
      workout.exercicios.map((ex) => {
        const tags = ex.tags ?? [];
        return [
          ex.id,
          {
            id: ex.id,
            name: ex.nome,
            primaryMuscles: inferPrimaryMusclesFromTags(tags),
            isCompound: inferIsCompoundFromTags(tags),
            defaultRepRange: parseRepRange(ex.repsRange),
            defaultRestSec: ex.descansoSeg,
            defaultSets: ex.workSetsDefault?.length ?? 3,
          },
        ];
      })
    );

    return applyWorkoutResult({
      workoutLog: {
        workoutId: workout.id,
        dateISO: new Date().toISOString().slice(0, 10),
        exercises: exercisesLog,
      },
      currentProgression: progressionMap,
      metaCatalog,
    });
  }, [progressionMap, workout, workoutId]);

  useEffect(() => {
    if (snapshotSavedRef.current || !workout) return;
    snapshotSavedRef.current = true;

    const progresso = getTreinoProgresso();
    const workoutProgress = progresso[workoutId];

    if (workoutProgress) {
      for (const exercise of workout.exercicios) {
        const exerciseProgress = workoutProgress[exercise.id];
        if (exerciseProgress?.workSets?.length) {
          const completedSetsData: ExerciseSetSnapshot[] = exerciseProgress.workSets
            .filter((s) => s.done)
            .map((s) => ({ kg: s.kg, reps: s.reps }));

          if (completedSetsData.length > 0) {
            saveExerciseSnapshot(exercise.id, workout.id, exercise.repsRange, completedSetsData);
          }
        }
      }
    }

    saveWorkoutCompleted(workout.id, totalVolume);
    markWorkoutCompletedThisWeek(workout.id, XP_PER_WORKOUT, completedSets, totalVolume);
  }, [workout, workoutId, totalVolume, completedSets]);

  const handleConcluir = () => {
    const hasRecommendations = Boolean(engineResult?.recommendations?.length);

    if (engineResult?.progressionByExerciseId && hasRecommendations) {
      saveProgressionByExercise(engineResult.progressionByExerciseId);
      updateLocalState((state) => ({
        ...state,
        progressionByExerciseId: engineResult.progressionByExerciseId,
      }));
    }

    completeTreinoDoDia(XP_PER_WORKOUT);
    refreshActiveObjectiveProgress();
    triggerSync();
    navigate("/");
  };

  const recommendations = engineResult?.recommendations ?? [];
  const inc = recommendations.filter((r) => r.action === "increase");
  const keep = recommendations.filter((r) => r.action === "maintain");
  const dec = recommendations.filter((r) => r.action === "reduce");

  const renderGroup = (title: string, items: typeof recommendations) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{title}</p>

        {items.map((rec) => {
          const exerciseName =
            workout?.exercicios.find((e) => e.id === rec.exerciseId)?.nome || rec.exerciseId;

          const icon =
            rec.action === "increase" ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : rec.action === "reduce" ? (
              <MinusCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-primary" />
            );

          const showTech = showTechById[rec.exerciseId] ?? false;

          return (
            <div
              key={rec.exerciseId}
              className="flex flex-col gap-1 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {icon}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{exerciseName}</p>
                    <p className="text-xs text-muted-foreground">{COPY.actions[rec.action].micro}</p>
                  </div>
                </div>

                <div className="text-right text-sm text-foreground">
                  {COPY.actions[rec.action].label}
                  <div className="text-xs text-muted-foreground">{formatLoad(rec.recommendedLoadKg)}</div>
                </div>
              </div>

              <button
                type="button"
                className="text-xs text-primary hover:text-primary/80 text-left"
                onClick={() => setShowTechById((prev) => ({ ...prev, [rec.exerciseId]: !showTech }))}
              >
                {showTech ? COPY.summary.hideTech : COPY.summary.seeTech}
              </button>

              {showTech && <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-16 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Treino concluído!</h1>
        <p className="text-muted-foreground text-center mb-8">{workout?.titulo || "Treino"} finalizado com sucesso</p>

        <div className="w-full space-y-4 mb-8">
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">XP Ganho</p>
              <p className="text-2xl font-bold text-primary">+{XP_PER_WORKOUT} XP</p>
            </div>
          </div>

          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Séries Completadas</p>
              <p className="text-2xl font-bold text-foreground">
                {completedSets} <span className="text-lg text-muted-foreground font-normal">/ {totalSets}</span>
              </p>
            </div>
          </div>

          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Volume Total</p>
              <p className="text-2xl font-bold text-foreground">
                {totalVolume.toLocaleString()} <span className="text-lg text-muted-foreground font-normal">kg</span>
              </p>
            </div>
          </div>

          <div className="card-glass p-5 text-center">
            <p className="text-lg font-medium text-foreground">Bom trabalho!</p>
            <p className="text-muted-foreground text-sm mt-1">Continue assim para alcançar seus objetivos</p>
          </div>

          <div className="card-glass p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{COPY.summary.title}</h3>

            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {renderGroup(COPY.summary.sectionUp, inc)}
                {renderGroup(COPY.summary.sectionKeep, keep)}
                {renderGroup(COPY.summary.sectionDown, dec)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{COPY.summary.noData}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleConcluir}
          className="w-full cta-button flex items-center justify-center gap-3"
          type="button"
        >
          <span className="text-lg font-semibold">Concluir</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default WorkoutSummary;

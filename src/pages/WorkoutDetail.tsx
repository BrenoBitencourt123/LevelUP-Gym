import { ArrowLeft, Play, RotateCcw, HelpCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import ExerciseCard from "@/components/ExerciseCard";
import BottomNav from "@/components/BottomNav";
import {
  getUserWorkout,
  saveTreinoHoje,
  clearTreinoProgress,
  getProgressionByExercise,
  saveProgressionByExercise,
} from "@/lib/storage";
import EducationModal from "@/components/EducationModal";
import { getActiveObjective } from "@/lib/objectiveState";
import type { EducationKey } from "@/lib/objectives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getWorkoutPrescription } from "@/engine/trainingEngine";
import InitialLoadModal from "@/components/InitialLoadModal";
import type { ProgressionState } from "@/engine/types";
import { updateLocalState } from "@/lib/appState";

const WorkoutDetail = () => {
  const { treinoId } = useParams();
  const workout = getUserWorkout(treinoId || "");

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [educationKey, setEducationKey] = useState<EducationKey | null>(null);

  const objective = getActiveObjective();

  const [progressionMap, setProgressionMap] = useState<Record<string, ProgressionState>>(() =>
    getProgressionByExercise()
  );

  const [initialLoadTarget, setInitialLoadTarget] = useState<{
    exerciseId: string;
    name: string;
    repRangeText?: string;
    repRange?: { min: number; max: number };
    defaultLoadSuggestion: number;
    initialLoadKg: number | null;
    hasHistory: boolean;
  } | null>(null);

  const BARBELL_HINT_IDS = useMemo(
    () =>
      new Set([
        "supino-reto",
        "agachamento-livre",
        "levantamento-terra",
        "remada-curvada",
        "desenvolvimento",
        "desenvolvimento-arnold",
      ]),
    []
  );

  const parseRepRange = (text?: string): { min: number; max: number } | undefined => {
    if (!text) return undefined;
    const nums = text.match(/\d+/g)?.map((n) => Number(n)) ?? [];
    if (nums.length >= 2) return { min: nums[0], max: nums[1] };
    if (nums.length === 1) return { min: nums[0], max: nums[0] };
    return undefined;
  };

  const prescriptionsById = useMemo(() => {
    if (!workout) return {};

    const exercisesInput = workout.exercicios.map((ex) => ({
      exerciseId: ex.id,
      name: ex.nome,
      tags: ex.tags,
      repRangeText: ex.repsRange,
      restSec: ex.descansoSeg,
      setsPlanned: ex.workSetsDefault?.length ?? 3,
    }));

    const { prescriptions } = getWorkoutPrescription({
      exercises: exercisesInput,
      progressionByExerciseId: progressionMap,
    });

    return Object.fromEntries(prescriptions.map((p) => [p.exerciseId, p]));
  }, [progressionMap, workout]);

  const resolveMicroIncrement = (exerciseId: string) => (BARBELL_HINT_IDS.has(exerciseId) ? 2.5 : 1);

  const handleDefineInitialLoad = (exerciseId: string) => {
    const target = workout?.exercicios.find((ex) => ex.id === exerciseId);
    if (!target) return;

    const repRange = parseRepRange(target.repsRange);
    const progression = progressionMap[exerciseId];

    const initialLoadKg = progression?.lastLoadKg ?? progression?.recommendedLoadKg ?? null;

    const hasHistory =
      Boolean(progression?.lastCompletedAt) || (progression?.lastNWorkoutsSummary?.length ?? 0) > 0;

    setInitialLoadTarget({
      exerciseId,
      name: target.nome,
      repRangeText: target.repsRange,
      repRange,
      defaultLoadSuggestion: BARBELL_HINT_IDS.has(exerciseId) ? 20 : 10,
      initialLoadKg,
      hasHistory,
    });
  };

  const handleCloseInitialLoad = () => setInitialLoadTarget(null);

  const handleSaveInitialLoad = ({
    exerciseId,
    loadKg,
    feel,
  }: {
    exerciseId: string;
    loadKg: number;
    feel: "easy" | "ok" | "hard";
  }) => {
    const existing = progressionMap[exerciseId];

    const targetHasHistory =
      initialLoadTarget?.exerciseId === exerciseId
        ? initialLoadTarget?.hasHistory
        : Boolean(existing?.lastCompletedAt) || (existing?.lastNWorkoutsSummary?.length ?? 0) > 0;

    if (targetHasHistory) {
      const confirmed = window.confirm(
        "Você já tem treinos registrados neste exercício. Quer ajustar a carga mesmo assim?"
      );
      if (!confirmed) return;
    }

    const microIncrementKg = existing?.microIncrementKg ?? resolveMicroIncrement(exerciseId);

    const recommendedLoadKg =
      feel === "easy"
        ? loadKg + microIncrementKg
        : feel === "hard"
        ? Math.max(loadKg - microIncrementKg, 0)
        : loadKg;

    const updatedState: ProgressionState = {
      exerciseId,
      lastLoadKg: loadKg,
      recommendedLoadKg,
      microIncrementKg,
      stallCounter: 0,
      lastNWorkoutsSummary: existing?.lastNWorkoutsSummary ?? [],
      lastCompletedAt: existing?.lastCompletedAt,
      lastRepBest: existing?.lastRepBest,
      lastWasDeload: existing?.lastWasDeload,
      deloadUntilDateISO: existing?.deloadUntilDateISO ?? null,
    };

    const newMap = { ...progressionMap, [exerciseId]: updatedState };

    saveProgressionByExercise(newMap);
    updateLocalState((state) => ({
      ...state,
      progressionByExerciseId: newMap,
    }));

    setProgressionMap(newMap);
    setInitialLoadTarget(null);
  };

  if (!workout) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado</p>
        <BottomNav />
      </div>
    );
  }

  // ✅ Evita "/treino/undefined/..."
  const workoutSlug = treinoId || workout.id;
  const firstExercise = workout.exercicios[0];

  const handleStartWorkout = () => {
    saveTreinoHoje({
      treinoId: workout.id,
      startedAt: new Date().toISOString(),
    });
  };

  const handleResetWorkout = () => {
    clearTreinoProgress(workout.id);
    setResetKey((prev) => prev + 1);
    setShowResetDialog(false);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Link
              to="/treino"
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{workout.titulo}</h1>
              <p className="text-sm text-muted-foreground">{workout.exercicios.length} exercícios</p>

              {objective && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Foco: {objective.title}</span>
                  <button
                    onClick={() => setEducationKey("workout-why")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    type="button"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowResetDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/50 text-muted-foreground text-sm hover:bg-secondary hover:text-foreground transition-colors"
            type="button"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>

        {/* Exercise List */}
        <div className="space-y-3 mt-6" key={resetKey}>
          {workout.exercicios.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exerciseId={exercise.id}
              name={exercise.nome}
              sets={String(exercise.workSetsDefault.length)}
              reps={exercise.repsRange}
              rest={`${Math.floor(exercise.descansoSeg / 60)} min`}
              slug={exercise.id}
              workoutSlug={workoutSlug}
              prescription={prescriptionsById[exercise.id]}
              onDefineInitialLoad={handleDefineInitialLoad}
            />
          ))}
        </div>

        {/* Start Workout CTA */}
        {firstExercise && (
          <Link
            to={`/treino/${workoutSlug}/${firstExercise.id}`}
            onClick={handleStartWorkout}
            className="w-full mt-6 cta-button flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Iniciar treino
          </Link>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso apagará todas as séries registradas deste treino. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetWorkout}>Reiniciar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Initial Load Modal */}
      <InitialLoadModal
        open={Boolean(initialLoadTarget)}
        exerciseId={initialLoadTarget?.exerciseId ?? null}
        exerciseName={initialLoadTarget?.name}
        repRangeText={initialLoadTarget?.repRangeText}
        repRange={initialLoadTarget?.repRange}
        defaultLoadSuggestion={initialLoadTarget?.defaultLoadSuggestion}
        initialLoadKg={initialLoadTarget?.initialLoadKg}
        hasHistory={initialLoadTarget?.hasHistory}
        onClose={handleCloseInitialLoad}
        onSave={handleSaveInitialLoad}
      />

      {/* Education */}
      {educationKey && (
        <EducationModal open={Boolean(educationKey)} onClose={() => setEducationKey(null)} contentKey={educationKey} />
      )}
    </div>
  );
};

export default WorkoutDetail;

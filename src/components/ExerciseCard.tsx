import { Dumbbell, Play, CheckCircle, Clock3, Info, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { isExerciseComplete, getExerciseSetProgress } from "@/lib/storage";
import type { ExercisePrescription } from "@/engine/types";
import { COPY } from "@/content/copyTreino";

const formatRest = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

interface ExerciseCardProps {
  exerciseId: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  slug: string;
  workoutSlug: string;
  prescription?: ExercisePrescription;
  onDefineInitialLoad?: (exerciseId: string) => void;
}

const ExerciseCard = ({
  exerciseId,
  name,
  sets,
  reps,
  rest,
  slug,
  workoutSlug,
  prescription,
  onDefineInitialLoad,
}: ExerciseCardProps) => {
  // ✅ evita inconsistência (às vezes você passa exerciseId e slug iguais, mas isso deixa o componente robusto)
  const exerciseSlug = slug || exerciseId;

  const isComplete = isExerciseComplete(workoutSlug, exerciseSlug);
  const { done, total } = getExerciseSetProgress(workoutSlug, exerciseSlug);
  const hasProgress = total > 0 && done > 0;

  const hasLoad =
    prescription?.loadRecommendationKg !== null && prescription?.loadRecommendationKg !== undefined;

  const loadLabel = hasLoad
    ? `${prescription!.loadRecommendationKg!.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} kg`
    : COPY.chips.loadMissing;

  const restLabel = prescription ? formatRest(prescription.restSec) : rest;

  // ✅ evita rota quebrada se algum lugar passar workoutSlug vazio
  const canNavigate = Boolean(workoutSlug && exerciseSlug);

  return (
    <div className="card-glass p-4 flex items-center gap-4">
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isComplete ? "bg-primary/20" : "bg-secondary/50"
        }`}
      >
        {isComplete ? (
          <CheckCircle className="w-6 h-6 text-primary" />
        ) : (
          <Dumbbell className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-base ${isComplete ? "text-primary" : "text-foreground"}`}>
          {name}
        </h3>

        <p className="text-sm text-muted-foreground mt-0.5">
          {sets} séries · {reps} reps · {restLabel} descanso
          {hasProgress && !isComplete && <span className="ml-2 text-primary">({done}/{total})</span>}
        </p>

        {prescription && (
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[12px] text-muted-foreground">
            <span
              className="px-2 py-1 rounded-full bg-secondary/40 border border-border/50 inline-flex items-center gap-1"
              title={COPY.tooltips.target}
            >
              {COPY.chips.target}: {prescription.repRange.min}–{prescription.repRange.max} reps
              <Info className="w-3 h-3" />
            </span>

            <span
              className="px-2 py-1 rounded-full bg-secondary/40 border border-border/50 inline-flex items-center gap-1"
              title={COPY.tooltips.effort}
            >
              {COPY.chips.effort}: {prescription.rirTarget.min}–{prescription.rirTarget.max} (RIR)
              <Info className="w-3 h-3" />
            </span>

            <span
              className="px-2 py-1 rounded-full bg-secondary/40 border border-border/50 inline-flex items-center gap-1"
              title={COPY.tooltips.rest}
            >
              <Clock3 className="w-3.5 h-3.5" />
              {COPY.chips.rest}: {formatRest(prescription.restSec)}
            </span>

            <button
              type="button"
              disabled={!onDefineInitialLoad}
              aria-disabled={!onDefineInitialLoad}
              className={`px-2 py-1 rounded-full border inline-flex items-center gap-1 transition-colors ${
                !onDefineInitialLoad
                  ? "opacity-60 cursor-not-allowed bg-secondary/20 border-border/30"
                  : hasLoad
                  ? "bg-secondary/40 border-border/50 text-muted-foreground hover:border-border"
                  : "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
              }`}
              title={COPY.tooltips.load}
              onClick={() => {
                if (onDefineInitialLoad) onDefineInitialLoad(exerciseId);
              }}
            >
              {COPY.chips.load}: {loadLabel}
              {hasLoad && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary/80">
                  <Pencil className="w-3 h-3" /> Editar
                </span>
              )}
              <Info className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Start Button */}
      {canNavigate ? (
        <Link
          to={`/treino/${workoutSlug}/${exerciseSlug}`}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
            isComplete
              ? "bg-primary/10 text-primary/70 hover:bg-primary/20"
              : "bg-primary/20 text-primary hover:bg-primary/30"
          }`}
        >
          {isComplete ? "Editar" : "Iniciar"}
          <Play className="w-3.5 h-3.5 fill-current" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 bg-secondary/30 text-muted-foreground cursor-not-allowed"
        >
          {isComplete ? "Editar" : "Iniciar"}
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      )}
    </div>
  );
};

export default ExerciseCard;

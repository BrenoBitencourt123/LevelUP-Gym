import SetRow from "@/components/SetRow";

type SetType = "warmup" | "normal";

type ActiveSet = {
  kg: number;
  reps: number;
  done: boolean;
  rir?: number | null;
  type: SetType;
  previous?: { kg: number; reps: number } | null;
};

type ActiveExercise = {
  id: string;
  name: string;
  notes: string;
  restSeconds: number;
  repsRange: string;
  sets: ActiveSet[];
};

type ExerciseSectionProps = {
  exercise: ActiveExercise;
  exerciseIndex: number;
  timerLabel: string;
  timerActive: boolean;
  onTimerClick: () => void;
  onSetChange: (exerciseIndex: number, setIndex: number, field: "kg" | "reps", value: number) => void;
  onToggleDoneRequest: (exerciseIndex: number, setIndex: number) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onNotesChange: (exerciseIndex: number, notes: string) => void;
};

const formatRestLabel = (seconds: number) => {
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
};

const ExerciseSection = ({
  exercise,
  exerciseIndex,
  timerLabel,
  timerActive,
  onTimerClick,
  onSetChange,
  onToggleDoneRequest,
  onAddSet,
  onRemoveSet,
  onNotesChange,
}: ExerciseSectionProps) => {
  return (
    <div className="card-glass p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-foreground">{exercise.name}</p>
          <button
            type="button"
            onClick={() => onNotesChange(exerciseIndex, exercise.notes)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + Adicionar notas
          </button>
        </div>
        <button
          type="button"
          onClick={onTimerClick}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            timerActive
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-secondary/20 border-border/40 text-muted-foreground hover:bg-secondary/30"
          }`}
        >
          Descanso: {timerLabel || formatRestLabel(exercise.restSeconds)}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={`${exercise.id}-${setIndex}`}
            setNumber={setIndex + 1}
            kg={set.kg}
            reps={set.reps}
            done={set.done}
            rir={set.rir ?? null}
            disabled={set.done}
            canRemove={set.type === "normal"}
            onKgChange={(value) => onSetChange(exerciseIndex, setIndex, "kg", value)}
            onRepsChange={(value) => onSetChange(exerciseIndex, setIndex, "reps", value)}
            onToggleDone={() => onToggleDoneRequest(exerciseIndex, setIndex)}
            onRemove={() => onRemoveSet(exerciseIndex, setIndex)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddSet(exerciseIndex)}
        className="mt-3 w-full h-10 rounded-xl border border-border/50 bg-secondary/10 text-sm text-muted-foreground hover:bg-secondary/20 transition-colors"
      >
        + Adicionar serie
      </button>
    </div>
  );
};

export default ExerciseSection;

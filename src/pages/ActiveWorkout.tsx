import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import WorkoutMetrics from "@/components/workout/WorkoutMetrics";
import ExerciseSection from "@/components/workout/ExerciseSection";
import RestTimerModal from "@/components/workout/RestTimerModal";
import RirModal from "@/components/workout/RirModal";
import {
  clearTreinoProgress,
  getExerciseProgress,
  getTreinoHoje,
  getUserWorkout,
  saveExerciseProgress,
  saveTreinoHoje,
  type ExerciseProgress,
  type SetProgress,
} from "@/lib/storage";
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
import { toast } from "sonner";

export type SetType = "warmup" | "normal";

export interface ActiveSet extends SetProgress {
  type: SetType;
  previous?: { kg: number; reps: number } | null;
}

export interface ActiveExercise {
  id: string;
  name: string;
  notes: string;
  restSeconds: number;
  repsRange: string;
  sets: ActiveSet[];
}

type RestTimerState = {
  endsAt: number; // ms
  durationSec: number;
  exerciseId: string;
  startedAt: number; // ms
};

const REST_TIMER_KEY = "levelup.restTimer.v1";

function formatElapsed(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function safeLoadRestTimer(): RestTimerState | null {
  try {
    const raw = localStorage.getItem(REST_TIMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RestTimerState;
    if (!parsed?.endsAt || !parsed?.durationSec || !parsed?.exerciseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeSaveRestTimer(state: RestTimerState | null) {
  try {
    if (!state) localStorage.removeItem(REST_TIMER_KEY);
    else localStorage.setItem(REST_TIMER_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const ActiveWorkout = () => {
  const { treinoId } = useParams();
  const navigate = useNavigate();
  const workout = getUserWorkout(treinoId || "");

  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // RIR modal state
  const [rirOpen, setRirOpen] = useState(false);
  const [pendingDone, setPendingDone] = useState<{ exIndex: number; setIndex: number } | null>(null);

  // Rest timer state
  const [restOpen, setRestOpen] = useState(false);
  const [restState, setRestState] = useState<RestTimerState | null>(() => safeLoadRestTimer());
  const [restRemainingSec, setRestRemainingSec] = useState(0);

  const tickerRef = useRef<number | null>(null);

  // Initialize workout + exercises
  useEffect(() => {
    if (!workout || !treinoId) return;

    const treinoHoje = getTreinoHoje();

    // Start time
    if (treinoHoje?.treinoId === treinoId && treinoHoje.startedAt && !treinoHoje.completedAt) {
      setStartTime(new Date(treinoHoje.startedAt));
    } else {
      const now = new Date();
      setStartTime(now);
      saveTreinoHoje({ treinoId, startedAt: now.toISOString() });
    }

    const initial: ActiveExercise[] = workout.exercicios.map((ex) => {
      const saved = getExerciseProgress(treinoId, ex.id);

      // Build warmup + work defaults
      const warmupDefaults = ex.warmupEnabled ? ex.feederSetsDefault : [];
      const workDefaults = ex.workSetsDefault;

      const warmupSets: ActiveSet[] = warmupDefaults.map((s) => ({
        kg: s.kg,
        reps: s.reps,
        done: false,
        rir: null,
        type: "warmup",
        previous: null,
      }));

      const workSets: ActiveSet[] = workDefaults.map((s) => ({
        kg: s.kg,
        reps: s.reps,
        done: false,
        rir: null,
        type: "normal",
        previous: { kg: s.kg, reps: s.reps },
      }));

      if (saved) {
        const savedWarmups: ActiveSet[] = saved.feederSets.map((s, i) => ({
          kg: s.kg,
          reps: s.reps,
          done: s.done,
          rir: s.rir ?? null,
          type: "warmup",
          previous: warmupDefaults[i] ? { kg: warmupDefaults[i].kg, reps: warmupDefaults[i].reps } : null,
        }));

        const savedWorks: ActiveSet[] = saved.workSets.map((s, i) => ({
          kg: s.kg,
          reps: s.reps,
          done: s.done,
          rir: s.rir ?? null,
          type: "normal",
          previous: workDefaults[i] ? { kg: workDefaults[i].kg, reps: workDefaults[i].reps } : null,
        }));

        return {
          id: ex.id,
          name: ex.nome,
          notes: "",
          restSeconds: ex.descansoSeg,
          repsRange: ex.repsRange,
          sets: [...savedWarmups, ...savedWorks].length > 0 ? [...savedWarmups, ...savedWorks] : [...warmupSets, ...workSets],
        };
      }

      return {
        id: ex.id,
        name: ex.nome,
        notes: "",
        restSeconds: ex.descansoSeg,
        repsRange: ex.repsRange,
        sets: [...warmupSets, ...workSets],
      };
    });

    setExercises(initial);
  }, [workout, treinoId]);

  // Workout elapsed timer
  useEffect(() => {
    if (!startTime) return;
    const interval = window.setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedSeconds(diff);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [startTime]);

  // Save progress whenever exercises change (includes RIR)
  const saveAllProgress = useCallback(() => {
    if (!treinoId) return;

    exercises.forEach((ex) => {
      const warmups = ex.sets.filter((s) => s.type === "warmup");
      const works = ex.sets.filter((s) => s.type !== "warmup");

      const progress: ExerciseProgress = {
        warmupDone: warmups.length > 0 ? warmups.every((s) => s.done) : false,
        feederSets: warmups.map((s) => ({
          kg: s.kg,
          reps: s.reps,
          done: s.done,
          rir: s.rir ?? null,
        })),
        workSets: works.map((s) => ({
          kg: s.kg,
          reps: s.reps,
          done: s.done,
          rir: s.rir ?? null,
        })),
        updatedAt: new Date().toISOString(),
      };

      saveExerciseProgress(treinoId, ex.id, progress);
    });
  }, [treinoId, exercises]);

  useEffect(() => {
    if (exercises.length === 0) return;
    saveAllProgress();
  }, [exercises, saveAllProgress]);

  // Metrics
  const metrics = useMemo(() => {
    let completedSets = 0;
    let totalSets = 0;
    let totalVolume = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.type === "warmup") return; // não conta warmup nas métricas principais
        totalSets++;
        if (set.done) {
          completedSets++;
          totalVolume += (set.kg || 0) * (set.reps || 0);
        }
      });
    });

    return {
      completedSets,
      totalSets,
      totalVolume: Math.round(totalVolume),
    };
  }, [exercises]);

  // ========== REST TIMER ==========
  const syncRestTick = useCallback((state: RestTimerState | null) => {
    if (!state) {
      setRestRemainingSec(0);
      return;
    }
    const remaining = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
    setRestRemainingSec(remaining);

    if (remaining <= 0) {
      setRestState(null);
      safeSaveRestTimer(null);
      toast.success("Descanso finalizado!");
    }
  }, []);

  useEffect(() => {
    // start ticker (single)
    if (tickerRef.current) window.clearInterval(tickerRef.current);
    tickerRef.current = window.setInterval(() => syncRestTick(restState), 250);
    return () => {
      if (tickerRef.current) window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [restState, syncRestTick]);

  useEffect(() => {
    // initial sync on mount
    syncRestTick(restState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRestTimer = useCallback((exerciseId: string, durationSec: number, openModal = true) => {
    const now = Date.now();
    const next: RestTimerState = {
      exerciseId,
      durationSec,
      startedAt: now,
      endsAt: now + durationSec * 1000,
    };
    setRestState(next);
    safeSaveRestTimer(next);
    syncRestTick(next);
    if (openModal) setRestOpen(true);
  }, [syncRestTick]);

  const stopRestTimer = useCallback(() => {
    setRestState(null);
    safeSaveRestTimer(null);
    setRestRemainingSec(0);
  }, []);

  const addRestSeconds = useCallback((delta: number) => {
    setRestState((prev) => {
      if (!prev) return prev;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((prev.endsAt - now) / 1000));
      const nextRemaining = Math.max(0, remaining + delta);
      const next: RestTimerState = { ...prev, endsAt: now + nextRemaining * 1000 };
      safeSaveRestTimer(next);
      return next;
    });
  }, []);

  const getTimerLabelForExercise = useCallback((exerciseId: string) => {
    if (restState?.exerciseId === exerciseId && restRemainingSec > 0) {
      return formatCountdown(restRemainingSec);
    }
    return "Timer";
  }, [restRemainingSec, restState]);

  // ========== UI HANDLERS ==========
  const handleSetChange = (exerciseIndex: number, setIndex: number, field: "kg" | "reps", value: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exerciseIndex] };
      const sets = [...ex.sets];
      const current = { ...sets[setIndex] };

      // bloqueia edição se done
      if (current.done) return prev;

      current[field] = value;
      sets[setIndex] = current;
      ex.sets = sets;
      updated[exerciseIndex] = ex;
      return updated;
    });
  };

  const requestToggleDone = (exerciseIndex: number, setIndex: number) => {
    const set = exercises[exerciseIndex]?.sets[setIndex];
    if (!set) return;

    // Se já estava done -> desmarca direto (sem modal)
    if (set.done) {
      setExercises((prev) => {
        const updated = [...prev];
        const ex = { ...updated[exerciseIndex] };
        const sets = [...ex.sets];
        sets[setIndex] = { ...sets[setIndex], done: false, rir: null };
        ex.sets = sets;
        updated[exerciseIndex] = ex;
        return updated;
      });
      return;
    }

    // Se estava false -> abre modal p/ escolher reps sobrando (RIR)
    setPendingDone({ exIndex: exerciseIndex, setIndex });
    setRirOpen(true);
  };

  const applyRirAndCompleteSet = (rir: number | null) => {
    if (!pendingDone) return;

    const { exIndex, setIndex } = pendingDone;
    const ex = exercises[exIndex];
    if (!ex) return;

    setExercises((prev) => {
      const updated = [...prev];
      const ex2 = { ...updated[exIndex] };
      const sets = [...ex2.sets];
      sets[setIndex] = { ...sets[setIndex], done: true, rir };
      ex2.sets = sets;
      updated[exIndex] = ex2;
      return updated;
    });

    // inicia descanso do exercício e abre modal do timer
    startRestTimer(ex.id, ex.restSeconds, true);

    setRirOpen(false);
    setPendingDone(null);
  };

  const handleAddSet = (exerciseIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exerciseIndex] };
      const last = ex.sets[ex.sets.length - 1];

      ex.sets = [
        ...ex.sets,
        {
          kg: last?.kg ?? 0,
          reps: last?.reps ?? 8,
          done: false,
          rir: null,
          type: "normal",
          previous: last?.previous ?? null,
        },
      ];

      updated[exerciseIndex] = ex;
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exerciseIndex] };

      // não remove se ficar sem work set nenhum
      const total = ex.sets.length;
      if (total <= 1) {
        toast.error("Não é possível remover a última série");
        return prev;
      }

      ex.sets = ex.sets.filter((_, i) => i !== setIndex);
      updated[exerciseIndex] = ex;
      return updated;
    });
  };

  const handleNotesChange = (exerciseIndex: number, notes: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex] = { ...updated[exerciseIndex], notes };
      return updated;
    });
  };

  const handleFinish = () => {
    if (metrics.completedSets === 0) {
      toast.error("Complete pelo menos uma série antes de finalizar");
      return;
    }
    setShowFinishDialog(true);
  };

  const confirmFinish = () => {
    navigate(`/treino/${treinoId}/resumo`);
  };

  const confirmDiscard = () => {
    if (treinoId) clearTreinoProgress(treinoId);
    localStorage.removeItem("levelup.treinoHoje");
    stopRestTimer();
    navigate("/treino");
  };

  if (!workout) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDiscardDialog(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar treino"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <h1 className="text-lg font-semibold text-foreground">Treinamento</h1>

            <button
              onClick={handleFinish}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <WorkoutMetrics
        durationLabel={formatElapsed(elapsedSeconds)}
        volumeKg={metrics.totalVolume}
        setsLabel={`${metrics.completedSets}/${metrics.totalSets}`}
      />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {exercises.map((exercise, exerciseIndex) => (
          <ExerciseSection
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={exerciseIndex}
            timerLabel={getTimerLabelForExercise(exercise.id)}
            timerActive={restState?.exerciseId === exercise.id && restRemainingSec > 0}
            onTimerClick={() => {
              // abre timer (se já rodando, só abre modal; se não, inicia com descanso padrão)
              if (restState?.exerciseId === exercise.id && restRemainingSec > 0) {
                setRestOpen(true);
              } else {
                startRestTimer(exercise.id, exercise.restSeconds, true);
              }
            }}
            onSetChange={handleSetChange}
            onToggleDoneRequest={requestToggleDone}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            onNotesChange={handleNotesChange}
          />
        ))}
      </div>

      {/* RIR Modal */}
      <RirModal
        open={rirOpen}
        onOpenChange={(v) => {
          setRirOpen(v);
          if (!v) setPendingDone(null);
        }}
        onSelect={(rir) => applyRirAndCompleteSet(rir)}
      />

      {/* Rest Timer Modal */}
      <RestTimerModal
        open={restOpen}
        onOpenChange={setRestOpen}
        remainingSec={restRemainingSec}
        onAddSeconds={addRestSeconds}
        onStop={stopRestTimer}
        onSkip={() => {
          stopRestTimer();
          setRestOpen(false);
        }}
      />

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Você completou {metrics.completedSets} de {metrics.totalSets} séries.
              Deseja finalizar o treino agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar treinando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinish}>Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem {metrics.completedSets} séries completadas. Deseja descartar todo o progresso?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar treinando</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default ActiveWorkout;

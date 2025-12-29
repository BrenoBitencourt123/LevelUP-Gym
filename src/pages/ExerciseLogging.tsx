import { ArrowLeft, Check, Clock3, Play, Plus, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SetRow from "@/components/SetRow";
import {
  getUserWorkout,
  getUserExercise,
  getUserNextExercise,
  isUserLastExercise,
  getExerciseProgress,
  saveExerciseProgress,
  SetProgress,
  ExerciseProgress,
  getLastExercisePerformance,
  getProgressionSuggestion,
  saveProgressionSuggestion,
  getPreferredLoadKg,
  checkNutritionQuestStatus,
  isNutritionCompletedToday,
} from "@/lib/storage";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import EducationModal from "@/components/EducationModal";
import type { EducationKey } from "@/lib/objectives";
import { COPY } from "@/content/copyTreino";

type RestTimerState = {
  isRunning: boolean;
  endsAtTs: number;
  durationMs: number;
  exerciseName: string;
  setLabel: string;
  source: "feeder" | "work";
};

const formatRestTime = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatRestLabel = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m <= 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
};

const playRestBeep = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.12;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);

    oscillator.onended = () => {
      context.close();
    };
  } catch {
    // best-effort
  }
};

type PendingRir = {
  index: number;
  setLabel: string;
};

const ExerciseLogging = () => {
  const { treinoId, exercicioId } = useParams();
  const navigate = useNavigate();

  const workout = useMemo(() => getUserWorkout(treinoId || ""), [treinoId]);
  const exercise = useMemo(
    () => getUserExercise(treinoId || "", exercicioId || ""),
    [treinoId, exercicioId]
  );

  // State
  const [warmupDone, setWarmupDone] = useState(false);
  const [feederSets, setFeederSets] = useState<SetProgress[]>([]);
  const [workSets, setWorkSets] = useState<SetProgress[]>([]);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [educationKey, setEducationKey] = useState<EducationKey | null>(null);

  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [autoRestEnabled, setAutoRestEnabled] = useState(true);

  // RIR modal (somente work sets)
  const [pendingRir, setPendingRir] = useState<PendingRir | null>(null);
  const [showRirHelp, setShowRirHelp] = useState(false);

  const restStorageKey = useMemo(
    () => (treinoId ? `restTimer:${treinoId}` : null),
    [treinoId]
  );
  const autoRestStorageKey = "restTimer:autoStart";

  // Initialize from storage or defaults (✅ respeita progressionByExercise)
  useEffect(() => {
    if (!exercise) return;
    setIsReady(false);

    const savedProgress = getExerciseProgress(treinoId || "", exercicioId || "");

    if (savedProgress) {
      setWarmupDone(savedProgress.warmupDone);
      setFeederSets(savedProgress.feederSets.map((s) => ({ ...s, rir: s.rir ?? null })));
      setWorkSets(savedProgress.workSets.map((s) => ({ ...s, rir: s.rir ?? null })));
    } else {
      const preferredLoad = getPreferredLoadKg(exercicioId || "");

      setWarmupDone(false);
      setFeederSets(exercise.feederSetsDefault.map((s) => ({ ...s, done: false, rir: null })));
      setWorkSets(
        exercise.workSetsDefault.map((s) => ({
          ...s,
          kg: preferredLoad ?? s.kg,
          done: false,
          rir: null,
        }))
      );
    }

    setIsReady(true);
  }, [treinoId, exercicioId, exercise]);

  // Restore rest timer if active
  useEffect(() => {
    if (!restStorageKey) return;
    const savedTimer = localStorage.getItem(restStorageKey);
    if (!savedTimer) return;

    try {
      const parsed = JSON.parse(savedTimer) as RestTimerState;
      if (parsed?.endsAtTs && parsed.endsAtTs > Date.now()) {
        setRestTimer({ ...parsed, isRunning: true });
        setNowTs(Date.now());
      } else {
        localStorage.removeItem(restStorageKey);
      }
    } catch {
      localStorage.removeItem(restStorageKey);
    }
  }, [restStorageKey]);

  useEffect(() => {
    const savedAutoRest = localStorage.getItem(autoRestStorageKey);
    if (savedAutoRest === null) return;
    setAutoRestEnabled(savedAutoRest === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem(autoRestStorageKey, String(autoRestEnabled));
  }, [autoRestEnabled]);

  // Save progress whenever state changes
  const saveProgress = useCallback(() => {
    if (!treinoId || !exercicioId) return;

    const progress: ExerciseProgress = {
      warmupDone,
      feederSets,
      workSets,
      updatedAt: new Date().toISOString(),
    };

    saveExerciseProgress(treinoId, exercicioId, progress);
  }, [treinoId, exercicioId, warmupDone, feederSets, workSets]);

  useEffect(() => {
    if (!isReady) return;
    saveProgress();
  }, [saveProgress, isReady]);

  // Persist rest timer
  useEffect(() => {
    if (!restStorageKey) return;
    if (restTimer?.isRunning) {
      localStorage.setItem(restStorageKey, JSON.stringify(restTimer));
      return;
    }
    localStorage.removeItem(restStorageKey);
  }, [restTimer, restStorageKey]);

  // Drive rest timer UI by timestamp
  useEffect(() => {
    if (!restTimer?.isRunning) return;
    const interval = window.setInterval(() => setNowTs(Date.now()), 300);
    return () => window.clearInterval(interval);
  }, [restTimer?.isRunning]);

  const remainingMs = restTimer?.isRunning ? Math.max(0, restTimer.endsAtTs - nowTs) : 0;

  const finishRestTimer = useCallback(() => {
    setRestTimer(null);
    if ("vibrate" in navigator) navigator.vibrate(200);
    playRestBeep();
    toast("Descanso finalizado");

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Descanso acabou", { body: "Bora pra próxima série." });
    }
  }, []);

  const stopRestTimer = useCallback(() => {
    setRestTimer(null);
    setNowTs(Date.now());
  }, []);

  useEffect(() => {
    if (!restTimer?.isRunning) return;
    if (remainingMs > 0) return;
    finishRestTimer();
  }, [restTimer, remainingMs, finishRestTimer]);

  const startRestTimer = useCallback(
    (durationSeconds: number, setLabel: string, source: "feeder" | "work") => {
      if (!exercise) return;
      const startTs = Date.now();
      const durationMs = durationSeconds * 1000;

      setNowTs(startTs);
      setRestTimer({
        isRunning: true,
        endsAtTs: startTs + durationMs,
        durationMs,
        exerciseName: exercise.nome,
        setLabel,
        source,
      });
    },
    [exercise]
  );

  const adjustRestTimer = (deltaMs: number) => {
    setRestTimer((prev) => {
      if (!prev) return prev;
      const nextEndsAt = Math.max(Date.now(), prev.endsAtTs + deltaMs);
      return { ...prev, endsAtTs: nextEndsAt };
    });
  };

  const openRestModal = () => setIsRestModalOpen(true);

  const hasActiveRestTimer = restTimer?.isRunning && remainingMs > 0;
  const restTimerLabel = hasActiveRestTimer ? formatRestTime(remainingMs) : null;

  // ✅ Label do botão: "Timer" → vira "01:58" se o timer ativo for daquele card
  const getTimerButtonLabel = (source: "feeder" | "work") => {
    if (hasActiveRestTimer && restTimer?.source === source && restTimerLabel) {
      return restTimerLabel;
    }
    return "Timer";
  };

  const handleOpenRestFromCard = (source: "feeder" | "work") => {
    if (!exercise) return;

    if (hasActiveRestTimer) {
      openRestModal();
      return;
    }

    startRestTimer(exercise.descansoSeg, "Descanso", source);
    openRestModal();
  };

  // Handlers feeder/work sets
  const updateFeederSet = (index: number, field: keyof SetProgress, value: number | boolean | null) => {
    setFeederSets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateWorkSet = (index: number, field: keyof SetProgress, value: number | boolean | null) => {
    setWorkSets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSet = () => {
    const lastSet = workSets[workSets.length - 1];
    const newSet: SetProgress = {
      kg: lastSet?.kg || 0,
      reps: lastSet?.reps || 8,
      done: false,
      rir: null,
    };
    setWorkSets((prev) => [...prev, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    if (workSets.length <= 1) {
      toast.error("Não é possível remover a última série");
      return;
    }

    const removedSet = workSets[index];
    setWorkSets((prev) => prev.filter((_, i) => i !== index));

    toast("Série removida", {
      action: {
        label: "Desfazer",
        onClick: () => {
          setWorkSets((prev) => {
            const newSets = [...prev];
            newSets.splice(index, 0, removedSet);
            return newSets;
          });
        },
      },
      duration: 3000,
    });
  };

  // Feeder: toggle direto
  const handleFeederToggleDone = (index: number, newDone: boolean) => {
    updateFeederSet(index, "done", newDone);

    if (!newDone) {
      updateFeederSet(index, "rir", null);
      return;
    }

    if (exercise && autoRestEnabled) {
      startRestTimer(exercise.descansoSeg, `Feeder ${index + 1}`, "feeder");
      setIsRestModalOpen(true);
    }
  };

  // Work: ao marcar ✓ abre modal “reps a mais”
  const handleWorkToggleDone = (index: number, newDone: boolean) => {
    if (!newDone) {
      updateWorkSet(index, "done", false);
      updateWorkSet(index, "rir", null);
      return;
    }

    setShowRirHelp(false);
    setPendingRir({ index, setLabel: `Série ${index + 1}` });
  };

  const applyRirAndFinishSet = (value: number) => {
    if (!pendingRir) return;
    const idx = pendingRir.index;

    updateWorkSet(idx, "rir", value);
    updateWorkSet(idx, "done", true);

    const label = pendingRir.setLabel;
    setPendingRir(null);

    if (exercise && autoRestEnabled) {
      startRestTimer(exercise.descansoSeg, label, "work");
      setIsRestModalOpen(true);
    }
  };

  // suggestion banner
  useEffect(() => {
    if (!exercise) return;

    const repsRangeMatch = exercise.repsRange.match(/(\d+)\s*[–-]\s*(\d+)/);
    if (!repsRangeMatch) return;

    const upperLimit = parseInt(repsRangeMatch[2]);
    const allDoneAtLimit =
      workSets.length > 0 && workSets.every((s) => s.done && s.reps >= upperLimit);

    setShowSuggestion(allDoneAtLimit);
  }, [workSets, exercise]);

  // Navigation
  const handleNextExercise = () => {
    if (!treinoId || !exercicioId) return;

    const missingRir = workSets.some((s) => s.done && (s.rir === null || s.rir === undefined));
    if (missingRir) {
      toast.error(COPY.blocks.missingRir);
      return;
    }

    if (isUserLastExercise(treinoId, exercicioId)) {
      navigate(`/treino/${treinoId}/resumo`);
    } else {
      const nextExercise = getUserNextExercise(treinoId, exercicioId);
      if (nextExercise) {
        navigate(`/treino/${treinoId}/${nextExercise.id}`);
      }
    }
  };

  const isLast = isUserLastExercise(treinoId || "", exercicioId || "");

  if (!exercise || !workout) {
    return (
      <div className="min-h-screen bg-background pb-40 flex items-center justify-center">
        <p className="text-muted-foreground">Exercício não encontrado</p>
        <BottomNav />
      </div>
    );
  }

  const lastPerformance = getLastExercisePerformance(exercicioId || "");
  const progression = getProgressionSuggestion(exercicioId || "", exercise.repsRange);

  const handleApplySuggestion = () => {
    if (progression.suggestedNextLoad) {
      saveProgressionSuggestion(exercicioId || "", progression.suggestedNextLoad);

      setWorkSets((prev) =>
        prev.map((s) => (s.done ? s : { ...s, kg: progression.suggestedNextLoad! }))
      );

      toast.success(`Sugestão aplicada: ${progression.suggestedNextLoad} kg`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/treino/${treinoId}`}
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{exercise.nome}</h1>
          </div>
          <button
            onClick={() => setEducationKey("progressive-overload")}
            className="text-primary text-sm font-medium hover:underline"
            type="button"
          >
            Por quê?
          </button>
        </div>

        {/* Progression Card */}
        <div className="card-glass p-4 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Último treino:{" "}
                {lastPerformance ? (
                  <span className="text-foreground font-medium">
                    {lastPerformance.kg} kg × {lastPerformance.reps}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>

              <p className="text-sm text-muted-foreground">
                Meta hoje: <span className="text-foreground">{progression.metaHoje}</span>
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                progression.status === "ready"
                  ? "bg-primary/20 text-primary"
                  : progression.status === "maintain"
                  ? "bg-secondary text-muted-foreground"
                  : "bg-secondary/50 text-muted-foreground"
              }`}
            >
              <span>{progression.statusIcon}</span>
              <span>{progression.statusLabel}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">{progression.message}</p>
            {progression.status === "ready" && progression.suggestedNextLoad && (
              <button
                onClick={handleApplySuggestion}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                type="button"
              >
                <Sparkles className="w-3 h-3" />
                Aplicar
              </button>
            )}
          </div>
        </div>

        {/* Auto Rest Toggle */}
        <div className="card-glass p-4 mb-4">
          <button
            onClick={() => setAutoRestEnabled((prev) => !prev)}
            className="flex items-center gap-2"
            type="button"
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                autoRestEnabled
                  ? "bg-primary/20 border border-primary/40"
                  : "bg-secondary/50 border border-border/40"
              }`}
            >
              {autoRestEnabled && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <span className="text-muted-foreground text-sm">
              Iniciar descanso automaticamente ao marcar ✓
            </span>
          </button>
        </div>

        {/* Warmup Card */}
        {exercise.warmupEnabled && (
          <div className="card-glass p-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Série de Aquecimento</h2>
            <button
              onClick={() => setWarmupDone(!warmupDone)}
              className="flex items-center gap-2"
              type="button"
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  warmupDone
                    ? "bg-primary/20 border border-primary/40"
                    : "bg-secondary/50 border border-border/40"
                }`}
              >
                {warmupDone && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <span className="text-muted-foreground text-sm">
                <span className={warmupDone ? "text-foreground" : ""}>Aquecimento</span> Finalizado
              </span>
            </button>
          </div>
        )}

        {/* Feeder Set Card */}
        {feederSets.length > 0 && (
          <div className="card-glass p-4 mb-4">
            {/* ✅ Timer no canto direito (substitui “Descanso 2min”) */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-foreground">Série Feeder</h2>

              <button
                type="button"
                onClick={() => handleOpenRestFromCard("feeder")}
                className="inline-flex items-center gap-2 text-sm text-primary/90 hover:text-primary tabular-nums whitespace-nowrap"
                title="Abrir timer de descanso"
              >
                <Clock3 className="w-4 h-4" />
                <span className="font-medium">{getTimerButtonLabel("feeder")}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
              <div className="w-8">Conj.</div>
              <div className="w-8"></div>
              <div className="w-16 text-center">Kg</div>
              <div className="w-14 text-center">Reps</div>
              <div className="flex-1 text-right">Reps a mais</div>
              <div className="w-9"></div>
            </div>

            {feederSets.map((set, index) => (
              <SetRow
                key={index}
                setNumber={index + 1}
                kg={set.kg}
                reps={set.reps}
                done={set.done}
                rir={set.rir ?? null}
                disabled={set.done}
                onKgChange={(kg) => updateFeederSet(index, "kg", kg)}
                onRepsChange={(reps) => updateFeederSet(index, "reps", reps)}
                onDoneChange={(done) => handleFeederToggleDone(index, done)}
                onToggleDone={(done) => handleFeederToggleDone(index, done)}
              />
            ))}
          </div>
        )}

        {/* Valid Sets Card */}
        <div className="card-glass p-4 mb-4">
          {/* ✅ Timer no canto direito (substitui “Descanso 2min”) */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Séries Válidas</h2>

            <button
              type="button"
              onClick={() => handleOpenRestFromCard("work")}
              className="inline-flex items-center gap-2 text-sm text-primary/90 hover:text-primary tabular-nums whitespace-nowrap"
              title="Abrir timer de descanso"
            >
              <Clock3 className="w-4 h-4" />
              <span className="font-medium">{getTimerButtonLabel("work")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
            <div className="w-8">Conj.</div>
            <div className="w-8"></div>
            <div className="w-16 text-center">Kg</div>
            <div className="w-14 text-center">Reps</div>
            <div className="flex-1 text-right">Reps a mais</div>
            <div className="w-9"></div>
          </div>

          {workSets.map((set, index) => (
            <SetRow
              key={index}
              setNumber={index + 1}
              kg={set.kg}
              reps={set.reps}
              done={set.done}
              rir={set.rir ?? null}
              disabled={set.done}
              canRemove={workSets.length > 1}
              onKgChange={(kg) => updateWorkSet(index, "kg", kg)}
              onRepsChange={(reps) => updateWorkSet(index, "reps", reps)}
              onDoneChange={(done) => handleWorkToggleDone(index, done)}
              onToggleDone={(done) => handleWorkToggleDone(index, done)}
              onRemove={() => handleRemoveSet(index)}
            />
          ))}

          <button
            onClick={handleAddSet}
            className="w-full mt-4 bg-secondary/30 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Adicionar série</span>
          </button>

          {showSuggestion && (
            <div className="mt-4 bg-secondary/30 rounded-xl px-4 py-3 text-center">
              <span className="text-muted-foreground text-sm">
                Sugerimos <span className="text-primary font-medium">+2,5%</span> no próximo treino
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIR Modal (Reps a mais) */}
      <Sheet open={Boolean(pendingRir)} onOpenChange={(open) => !open && setPendingRir(null)}>
        <SheetContent
          side="bottom"
          className="card-glass border-t border-border/50 rounded-t-2xl px-6 pb-6 pt-5"
        >
          <SheetHeader className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle>Quão perto da falha?</SheetTitle>
                <SheetDescription>
                  {pendingRir?.setLabel} • Quantas repetições você conseguiria fazer a mais?
                </SheetDescription>
              </div>

              <button
                type="button"
                onClick={() => setShowRirHelp((p) => !p)}
                className="w-9 h-9 rounded-full bg-secondary/30 border border-border/40 hover:bg-secondary/50 flex items-center justify-center text-primary font-bold"
                aria-label="O que é RIR?"
                title="O que é RIR?"
              >
                ?
              </button>
            </div>
          </SheetHeader>

          {showRirHelp && (
            <div className="mb-4 p-3 rounded-xl bg-secondary/25 border border-border/40 text-sm text-muted-foreground">
              <span className="text-foreground font-medium">RIR</span> significa{" "}
              <span className="text-foreground font-medium">“repetições em reserva”</span>.
              <br />
              Ex.: <span className="text-foreground font-medium">2</span> = você conseguiria fazer{" "}
              <span className="text-foreground font-medium">mais 2 reps</span> com boa forma antes de falhar.
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => applyRirAndFinishSet(v)}
                className="h-14 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/45 transition-colors flex flex-col items-center justify-center"
              >
                <span className="text-lg font-semibold text-foreground tabular-nums">{v}</span>
                <span className="text-xs text-muted-foreground">reps a mais</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPendingRir(null)}
            className="w-full mt-4 h-12 rounded-xl bg-secondary/25 border border-border/40 hover:bg-secondary/40 text-muted-foreground"
          >
            Cancelar
          </button>
        </SheetContent>
      </Sheet>

      {/* Rest Timer Modal */}
      <Sheet open={isRestModalOpen} onOpenChange={setIsRestModalOpen}>
        <SheetContent
          side="bottom"
          className="card-glass border-t border-border/50 rounded-t-2xl px-6 pb-6 pt-5"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>Timer</SheetTitle>
            <SheetDescription>
              Descanso: {formatRestLabel(exercise.descansoSeg)} •{" "}
              {restTimer?.exerciseName || exercise?.nome || "Próxima série"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col items-center gap-6">
            <div className="text-5xl font-semibold text-foreground tabular-nums">
              {formatRestTime(remainingMs)}
            </div>

            {restTimer?.setLabel && (
              <p className="text-sm text-muted-foreground">{restTimer.setLabel}</p>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => adjustRestTimer(-15000)}
                className="px-3 py-2 rounded-lg bg-secondary/40 text-sm text-foreground hover:bg-secondary/60 transition-colors"
                type="button"
              >
                -15s
              </button>
              <button
                onClick={() => adjustRestTimer(15000)}
                className="px-3 py-2 rounded-lg bg-secondary/40 text-sm text-foreground hover:bg-secondary/60 transition-colors"
                type="button"
              >
                +15s
              </button>
              <button
                onClick={stopRestTimer}
                className="px-3 py-2 rounded-lg bg-secondary/60 text-sm text-foreground hover:bg-secondary/80 transition-colors"
                type="button"
              >
                Pular
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleNextExercise}
            className="w-full cta-button flex items-center justify-center gap-3"
            type="button"
          >
            <Play className="w-5 h-5 fill-primary-foreground" />
            <span className="text-lg font-semibold">
              {isLast ? "Finalizar treino" : "Próximo exercício"}
            </span>
          </button>
        </div>
      </div>

      <BottomNav />

      {educationKey && (
        <EducationModal
          open={Boolean(educationKey)}
          onClose={() => setEducationKey(null)}
          contentKey={educationKey}
        />
      )}
    </div>
  );
};

export default ExerciseLogging;

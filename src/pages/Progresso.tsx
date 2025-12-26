import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, Scale } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getActiveObjective, refreshActiveObjectiveProgress } from "@/lib/objectiveState";
import { updateLocalState } from "@/lib/appState";
import { saveWeight } from "@/lib/storage";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

type ObjectiveWeighIn = { weekIndex: number; dateISO: string; weightKg: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getWeekIndex = (startDateISO: string, durationWeeks: number, today: Date = new Date()) => {
  const start = new Date(startDateISO).getTime();
  const diffDays = Math.floor((today.getTime() - start) / (1000 * 60 * 60 * 24));
  const rawIndex = Math.floor(diffDays / 7);
  return clamp(rawIndex, 0, Math.max(0, durationWeeks - 1));
};

const Progresso = () => {
  const triggerSync = useSyncTrigger();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [objective, setObjective] = useState(getActiveObjective());

  const durationWeeks = objective?.durationWeeks ?? objective?.target.weeksTarget ?? objective?.suggestedWeeks ?? 8;
  const startDateISO = objective?.startDateISO ?? objective?.startAt ?? new Date().toISOString();
  const currentWeekIndex = objective ? getWeekIndex(startDateISO, durationWeeks) : 0;

  const weighIns = useMemo<ObjectiveWeighIn[]>(
    () => objective?.weighIns ?? [],
    [objective]
  );

  const weeks = useMemo(
    () =>
      Array.from({ length: durationWeeks }, (_, index) => {
        const entry = weighIns.find((weighIn) => weighIn.weekIndex === index);
        return {
          index,
          label: `Semana ${index + 1}`,
          entry,
        };
      }),
    [durationWeeks, weighIns]
  );

  const currentWeekEntry = weighIns.find((entry) => entry.weekIndex === currentWeekIndex);
  const checkInsCount = weighIns.length;

  const handleSaveWeight = () => {
    if (!objective) return;
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error("Digite um peso valido");
      return;
    }

    const dateISO = new Date().toISOString();
    updateLocalState((state) => {
      const activeObjective = state.objective?.active;
      if (!activeObjective) return state;

      const activeDuration =
        activeObjective.durationWeeks ??
        activeObjective.target.weeksTarget ??
        activeObjective.suggestedWeeks ??
        durationWeeks;
      const activeStart = activeObjective.startDateISO ?? activeObjective.startAt ?? dateISO;
      const weekIndex = getWeekIndex(activeStart, activeDuration);

      const existing = activeObjective.weighIns ?? [];
      const nextWeighIns = [
        { weekIndex, dateISO, weightKg: weight },
        ...existing.filter((entry) => entry.weekIndex !== weekIndex),
      ];

      return {
        ...state,
        objective: {
          ...state.objective,
          active: {
            ...activeObjective,
            weighIns: nextWeighIns,
          },
        },
      };
    });

    saveWeight(weight);
    refreshActiveObjectiveProgress();
    setShowWeightModal(false);
    setNewWeight("");
    setObjective(getActiveObjective());
    toast.success("Peso registrado!");
    triggerSync();
  };

  if (!objective) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Progresso do objetivo</h1>
          </div>

          <div className="card-glass p-5">
            <p className="text-sm text-muted-foreground">Sem objetivo ativo</p>
            <p className="text-lg font-semibold text-foreground mt-1">
              Escolha um objetivo para acompanhar.
            </p>
            <Link to="/objetivo" className="mt-4 inline-flex w-full cta-button cta-primary justify-center">
              <span className="text-primary-foreground">Escolher objetivo</span>
            </Link>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Progresso do objetivo</h1>
        </div>

        <div className="card-glass p-5 mb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Check-ins semanais
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-semibold text-foreground">
                  {checkInsCount}/{durationWeeks} registrados
                </p>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Como pesar"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Button
              onClick={() => setShowWeightModal(true)}
              className="cta-button cta-primary w-full sm:w-auto"
            >
              <Scale className="w-4 h-4 mr-2" />
              {currentWeekEntry ? "Editar peso" : "Registrar peso"}
            </Button>
          </div>
        </div>

        <div className="card-glass p-5">
          <div className="grid grid-cols-2 gap-3">
            {weeks.map((week) => {
              const isCurrent = week.index === currentWeekIndex;
              const hasEntry = Boolean(week.entry);
              return (
                <div
                  key={week.index}
                  className={`rounded-xl border p-3 ${
                    hasEntry
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/50 bg-muted/20"
                  } ${isCurrent ? "ring-1 ring-primary/30" : ""}`}
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {week.label}
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-2">
                    {week.entry ? `${week.entry.weightKg.toFixed(1)} kg` : "Pendente"}
                  </p>
                  {week.entry && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(week.entry.dateISO).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar peso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder={String(objective.currentMetrics.weightKg ?? objective.startWeightKg ?? 70)}
                className="w-28 text-center text-2xl font-bold mx-auto"
              />
              <Label className="text-sm text-muted-foreground">kg</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWeightModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWeight}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como registrar o peso</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm text-muted-foreground">
            <p>O peso inicial ja foi registrado no comeco do objetivo.</p>
            <p>Na Semana 1, registre o peso ao final da semana.</p>
            <p>Repita uma vez por semana para acompanhar a tendencia real.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInfoModal(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Progresso;

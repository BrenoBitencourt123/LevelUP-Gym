import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type FeelOption = "easy" | "ok" | "hard";

interface InitialLoadModalProps {
  open: boolean;
  exerciseId: string | null;
  exerciseName?: string;
  repRange?: { min: number; max: number };
  repRangeText?: string;
  defaultLoadSuggestion?: number;
  initialLoadKg?: number | null;
  hasHistory?: boolean;
  onClose: () => void;
  onSave: (payload: { exerciseId: string; loadKg: number; feel: FeelOption }) => void;
}

const feelCopy: Record<FeelOption, { label: string; help: string }> = {
  easy: { label: "Fácil", help: "Sobrou bastante" },
  ok: { label: "Ok", help: "No ponto" },
  hard: { label: "Pesado", help: "Quase no limite" },
};

const parseLoadInput = (input: string): number => {
  const normalized = input.replace(",", ".").trim();
  return Number(normalized);
};

const InitialLoadModal = ({
  open,
  exerciseId,
  exerciseName,
  repRange,
  repRangeText,
  defaultLoadSuggestion = 10,
  initialLoadKg = null,
  hasHistory = false,
  onClose,
  onSave,
}: InitialLoadModalProps) => {
  const [loadInput, setLoadInput] = useState("");
  const [feel, setFeel] = useState<FeelOption>("ok");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadInput(initialLoadKg !== null && initialLoadKg !== undefined ? String(initialLoadKg) : "");
      setFeel("ok");
      setShowHint(false);
    }
  }, [open, initialLoadKg]);

  const handleSave = () => {
    if (!exerciseId) return;
    const parsed = parseLoadInput(loadInput);
    if (!loadInput || Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Informe uma carga válida.");
      return;
    }
    onSave({ exerciseId, loadKg: parsed, feel });
    onClose();
  };

  const handleDontKnow = () => {
    const current = loadInput.trim();
    if (!current) {
      setLoadInput(String(defaultLoadSuggestion));
    }
    setFeel("ok");
    setShowHint(true);
  };

  const repRangeLabel = repRange ? `${repRange.min}–${repRange.max}` : repRangeText;

  const isEdit = initialLoadKg !== null && initialLoadKg !== undefined;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="bg-card border-border/50 max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Editar carga" : "Definir carga inicial"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground leading-relaxed">
            Escolha uma carga para ficar no alvo sem perder a execução. Em dúvida, comece leve.
          </div>

          {repRangeLabel && (
            <div className="text-sm font-medium text-foreground">
              Alvo: <span className="text-muted-foreground">{repRangeLabel} reps</span>
            </div>
          )}

          {exerciseName && (
            <div className="text-sm text-foreground font-medium">
              {exerciseName}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-foreground font-medium" htmlFor="initial-load">
              Carga (kg)
            </label>
            <input
              id="initial-load"
              type="text"
              inputMode="decimal"
              value={loadInput}
              onChange={(e) => setLoadInput(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ex: 20 ou 20,5"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-foreground font-medium">Como foi?</p>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "ok", "hard"] as FeelOption[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFeel(option)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    feel === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-secondary/40 text-foreground hover:border-border"
                  }`}
                >
                  <div className="font-semibold">{feelCopy[option].label}</div>
                  <div className="text-[11px] text-muted-foreground">{feelCopy[option].help}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-muted-foreground">
            Fácil = sobrou bastante • Ok = no ponto • Pesado = quase no limite
          </p>

          <div>
            <button
              type="button"
              onClick={handleDontKnow}
              className="text-sm text-primary hover:text-primary/80"
            >
              Não sei (começar leve)
            </button>
            {showHint && (
              <p className="text-xs text-muted-foreground mt-1">
                Comece leve. Se ficar fácil, o app sobe aos poucos.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              disabled={!exerciseId}
            >
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InitialLoadModal;

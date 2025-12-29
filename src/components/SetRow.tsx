import React from "react";
import { Check, Clock3, Trash2 } from "lucide-react";

type Props = {
  setNumber: number;
  kg: number;
  reps: number;

  // ✅ agora é opcional (se não mandar, não renderiza timer na linha)
  rest?: string;

  done: boolean;
  rir?: number | null;
  disabled?: boolean;

  canRemove?: boolean;

  onKgChange?: (kg: number) => void;
  onRepsChange?: (reps: number) => void;

  // compat
  onDoneChange?: (done: boolean) => void;
  onToggleDone?: (done: boolean) => void;

  // ✅ opcional
  onStartRest?: () => void;

  onRemove?: () => void;
};

function clampNumber(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

const SetRow = ({
  setNumber,
  kg,
  reps,
  rest,
  done,
  rir = null,
  disabled = false,
  canRemove = false,
  onKgChange,
  onRepsChange,
  onDoneChange,
  onToggleDone,
  onStartRest,
  onRemove,
}: Props) => {
  const emitDone = (next: boolean) => {
    if (onToggleDone) onToggleDone(next);
    else onDoneChange?.(next);
  };

  const handleRowToggle = () => {
    emitDone(!done);
  };

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const showRestInline = Boolean(rest && onStartRest);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowToggle();
        }
      }}
      className={`flex items-center gap-2 px-1 py-2 rounded-xl transition-colors ${
        done ? "bg-secondary/20" : "hover:bg-secondary/20"
      }`}
      aria-label={`Alternar série ${setNumber}`}
    >
      {/* Conj. */}
      <div className="w-8 text-sm text-muted-foreground tabular-nums">{setNumber}</div>

      {/* Done */}
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          emitDone(!done);
        }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
          done
            ? "bg-primary/20 border-primary/40"
            : "bg-secondary/40 border-border/40 hover:bg-secondary/60"
        }`}
        aria-label={done ? "Desmarcar série" : "Marcar série"}
      >
        {done && <Check className="w-4 h-4 text-primary" />}
      </button>

      {/* Kg */}
      <div className="w-16">
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={Number.isFinite(kg) ? kg : 0}
          disabled={disabled}
          onClick={stop}
          onChange={(e) => {
            const v = Number(String(e.target.value).replace(",", "."));
            onKgChange?.(Number.isFinite(v) ? v : 0);
          }}
          className={`w-full h-9 rounded-lg text-center text-sm tabular-nums outline-none border ${
            disabled
              ? "bg-secondary/30 text-muted-foreground border-border/30"
              : "bg-secondary/20 text-foreground border-border/40 focus:border-primary/40"
          }`}
        />
      </div>

      {/* Reps */}
      <div className="w-14">
        <input
          type="number"
          inputMode="numeric"
          step="1"
          value={Number.isFinite(reps) ? reps : 0}
          disabled={disabled}
          onClick={stop}
          onChange={(e) => {
            const v = Number(e.target.value);
            onRepsChange?.(Number.isFinite(v) ? clampNumber(v, 0, 99) : 0);
          }}
          className={`w-full h-9 rounded-lg text-center text-sm tabular-nums outline-none border ${
            disabled
              ? "bg-secondary/30 text-muted-foreground border-border/30"
              : "bg-secondary/20 text-foreground border-border/40 focus:border-primary/40"
          }`}
        />
      </div>

      {/* ✅ Descanso inline (só aparece se você realmente quiser usar em algum lugar) */}
      {showRestInline && (
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onStartRest?.();
            }}
            className="w-full h-9 rounded-lg px-3 flex items-center justify-between gap-2 bg-secondary/20 border border-border/40 hover:bg-secondary/30 transition-colors"
            title="Abrir timer de descanso"
          >
            <span className="text-xs text-muted-foreground truncate">{rest}</span>
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Clock3 className="w-4 h-4" />
              <span className="text-xs font-medium">Timer</span>
            </span>
          </button>
        </div>
      )}

      {/* Badge “Reps a mais” */}
      <div className={`flex ${showRestInline ? "w-[64px]" : "flex-1"} justify-end min-w-0`}>
        {done ? (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium tabular-nums ${
              rir !== null && rir !== undefined
                ? "bg-primary/10 text-primary"
                : "bg-secondary/20 text-muted-foreground"
            }`}
            title="Repetições que sobraram"
          >
            {rir !== null && rir !== undefined ? `+${rir}` : "+—"}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/70 tabular-nums" />
        )}
      </div>

      {/* Remove */}
      {canRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onRemove();
          }}
          className="w-9 h-9 rounded-lg bg-secondary/20 border border-border/40 hover:bg-secondary/30 flex items-center justify-center transition-colors"
          title="Remover série"
          aria-label="Remover série"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default SetRow;

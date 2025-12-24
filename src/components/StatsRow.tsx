import { useState } from "react";
import { Dumbbell, TrendingDown, Shield } from "lucide-react";

interface StatsRowProps {
  streak: number;
  multiplier: number;
  shields: number;
}

const StatsRow = ({ streak, multiplier, shields }: StatsRowProps) => {
  const [activeInfo, setActiveInfo] = useState<null | "streak" | "multiplier" | "shields">(null);

  const toggleInfo = (key: "streak" | "multiplier" | "shields") => {
    setActiveInfo((current) => (current === key ? null : key));
  };

  const info = {
    streak: {
      title: "Sequência",
      value: `${streak} dias`,
      description: "Mantenha dias seguidos para subir seu bônus.",
    },
    multiplier: {
      title: "Multiplicador",
      value: `x${multiplier.toFixed(1).replace(".", ",")}`,
      description: "Bônus de XP por consistência.",
    },
    shields: {
      title: "Escudos",
      value: `${shields}`,
      description: "Protege a sequência quando você falha um dia.",
    },
  } as const;

  const active = activeInfo ? info[activeInfo] : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => toggleInfo("streak")}
          aria-pressed={activeInfo === "streak"}
          className="stat-tile w-full flex items-center justify-center cursor-pointer"
        >
          <div className="relative z-10 w-8 h-8 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
            <Dumbbell className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleInfo("multiplier")}
          aria-pressed={activeInfo === "multiplier"}
          className="stat-tile w-full flex items-center justify-center cursor-pointer"
        >
          <div className="relative z-10 w-8 h-8 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleInfo("shields")}
          aria-pressed={activeInfo === "shields"}
          className="stat-tile w-full flex items-center justify-center cursor-pointer"
        >
          <div className="relative z-10 w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </button>
      </div>

      {active && (
        <div className="card-glass px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{active.title}</p>
              <p className="text-sm font-semibold text-foreground">{active.value}</p>
            </div>
            <span className="text-xs text-muted-foreground">Toque para alternar</span>
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">{active.description}</p>
        </div>
      )}
    </div>
  );
};

export default StatsRow;

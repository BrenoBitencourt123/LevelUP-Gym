import { Award, Mountain, Hourglass, Package } from "lucide-react";

interface AchievementsCardProps {
  current: number;
  total: number;
  nextRewardIn: number;
}

const AchievementsCard = ({ current, total, nextRewardIn }: AchievementsCardProps) => {
  const progressPercentage = Math.max(0, Math.min(100, ((3 - nextRewardIn) / 3) * 100));
  const rewardText = nextRewardIn === 1 ? "Falta 1 conquista" : `Faltam ${nextRewardIn} conquistas`;

  return (
    <div className="card-glass p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Conquistas</h3>
          <p className="text-xs text-muted-foreground">Colete medalhas e destrave bônus</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {current} / {total}
        </span>
      </div>

      {/* Achievement badges */}
      <div className="flex items-center gap-3 mb-4">
        <div className="achievement-badge bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30">
          <Award className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="achievement-badge bg-gradient-to-br from-sky-600/20 to-sky-800/20 border-sky-600/30 relative">
          <Mountain className="w-6 h-6 text-sky-300" />
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-sky-500 text-white px-1 rounded">5x</span>
        </div>
        <div className="achievement-badge bg-gradient-to-br from-slate-500/20 to-slate-700/20 border-slate-500/30">
          <Hourglass className="w-6 h-6 text-slate-400" />
        </div>
      </div>

      {/* Progress to next reward */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Próxima recompensa</span>
            <span>{rewardText}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-secondary border border-border flex items-center justify-center">
          <Package className="w-5 h-5 text-amber-500" />
        </div>
      </div>
    </div>
  );
};

export default AchievementsCard;

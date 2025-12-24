import { ChevronLeft } from "lucide-react";

interface XPBarProps {
  current: number;
  max: number;
  showChevron?: boolean;
  compact?: boolean;
}

const XPBar = ({ current, max, showChevron = true, compact = false }: XPBarProps) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const safePercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={compact ? "w-full" : "w-full px-4"}>
      <div className="flex items-center gap-2">
        {showChevron && <ChevronLeft className="w-5 h-5 text-muted-foreground" />}
        <div className="flex-1 xp-bar">
          <div
            className="xp-bar-fill"
            style={{ width: `${safePercentage}%` }}
          />
        </div>
      </div>
      <p
        className={`text-center ${compact ? "text-xs" : "text-sm"} text-muted-foreground mt-2 font-medium`}
      >
        {current.toLocaleString("pt-BR")} / {max.toLocaleString("pt-BR")} XP
      </p>
    </div>
  );
};

export default XPBar;

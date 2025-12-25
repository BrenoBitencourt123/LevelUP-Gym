import badgeSilver from "@/icones/icone prata.png";
import avatarFallback from "@/assets/avatar.png";
import { getBadgeVariant, type BadgeVariant } from "@/lib/badges";

type LevelBadgeProps = {
  level: number;
  avatarUrl?: string;
  size?: number;
  variant?: "silver" | "gold" | "bronze" | "diamond";
  showLevelPill?: boolean;
  className?: string;
};

const LevelBadge = ({
  level,
  avatarUrl,
  size = 112,
  variant,
  showLevelPill = true,
  className,
}: LevelBadgeProps) => {
  const activeVariant = variant ?? getBadgeVariant(level);
  const avatarSrc = avatarUrl || avatarFallback;
  const badgeSrc = badgeSilver;
  const ringBox = { top: "21%", left: "25%", right: "25%", bottom: "27%" };
  const avatarBox = { top: "27%", left: "31%", right: "31%", bottom: "33%" };


  return (
    <div
      className={`relative overflow-visible ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label={`N¡vel ${level}`}
      role="img"
    >
      <div className="absolute inset-0 z-0">
        <div
          className="absolute rounded-full bg-card/95 border border-white/20"
          style={{ ...ringBox, boxShadow: "0 10px 20px rgba(0,0,0,0.35)" }}
        />
        <img
          src={avatarSrc}
          alt="Avatar do usuario"
          className="absolute rounded-full object-cover"
          style={avatarBox}
        />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <img
          src={badgeSrc}
          alt=""
          className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 object-contain"
          aria-hidden="true"
        />
      </div>

      {showLevelPill && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-20">
          <div className="px-3 py-1 rounded-full border border-white/25 bg-black/45 backdrop-blur-sm">
            <span className="text-xs font-bold text-white">Lv {level}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelBadge;

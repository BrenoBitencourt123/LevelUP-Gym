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
  const ringBox = { top: "18%", left: "22%", right: "22%", bottom: "24%" };
  const avatarBox = { top: "24%", left: "28%", right: "28%", bottom: "30%" };

  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label={`Nível ${level}`}
      role="img"
    >
      <div className="absolute inset-0">
        <img
          src={badgeSrc}
          alt=""
          className="w-full h-full object-contain"
          aria-hidden="true"
        />
      </div>

      <div
        className="absolute rounded-full bg-card/95 border border-white/20"
        style={{ ...ringBox, boxShadow: "0 10px 20px rgba(0,0,0,0.35)" }}
      />
      <img
        src={avatarSrc}
        alt="Avatar do usuário"
        className="absolute rounded-full object-cover"
        style={avatarBox}
      />

      {showLevelPill && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2">
          <div className="px-3 py-1 rounded-full border border-white/25 bg-black/45 backdrop-blur-sm">
            <span className="text-xs font-bold text-white">Lv {level}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelBadge;

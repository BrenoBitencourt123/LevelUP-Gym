import avatarImg from "@/assets/avatar.png";

interface AvatarFrameProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

const AvatarFrame = ({ level, size = "lg" }: AvatarFrameProps) => {
  const sizeClasses = {
    sm: {
      frame: "w-20 h-20",
      wings: "w-28 h-20",
      badge: "text-[10px] px-2 py-0.5",
    },
    md: {
      frame: "w-24 h-24",
      wings: "w-36 h-24",
      badge: "text-xs px-3 py-0.5",
    },
    lg: {
      frame: "w-28 h-28",
      wings: "w-44 h-28",
      badge: "text-sm px-4 py-1",
    },
  };

  const clipPath = "polygon(50% 0%, 86% 8%, 100% 50%, 86% 92%, 50% 100%, 14% 92%, 0% 50%, 14% 8%)";

  return (
    <div className="relative flex flex-col items-center">
      {/* Crest wings */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size].wings} pointer-events-none`}
      >
        <svg viewBox="0 0 180 100" className="w-full h-full opacity-60">
          <path
            d="M90 50 L62 26 L46 30 L28 20 L22 38 L12 32 L18 50 L12 68 L22 62 L28 80 L46 70 L62 74 Z"
            fill="none"
            stroke="hsl(var(--primary) / 0.45)"
            strokeWidth="1.5"
          />
          <path
            d="M90 50 L118 26 L134 30 L152 20 L158 38 L168 32 L162 50 L168 68 L158 62 L152 80 L134 70 L118 74 Z"
            fill="none"
            stroke="hsl(var(--primary) / 0.45)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative">
        {/* Glow layers */}
        <div className="absolute -inset-6 rounded-full bg-primary/20 blur-2xl opacity-80" />
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-200/40 via-transparent to-primary/30 blur-lg" />

        {/* Crest frame */}
        <div
          className={`relative ${sizeClasses[size].frame}`}
          style={{
            clipPath,
            background: "linear-gradient(145deg, #e0c07a 0%, #8b6b2c 45%, #2a1c0a 100%)",
            boxShadow: "0 14px 32px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div
            className="absolute inset-[2px]"
            style={{
              clipPath,
              background: "linear-gradient(160deg, #3b2a12 0%, #1a1208 60%, #3b2a12 100%)",
            }}
          />
          <div className="absolute inset-[9px] rounded-full bg-card/95 border border-border/70" />
          <img
            src={avatarImg}
            alt="Avatar"
            className="absolute inset-[12px] rounded-full object-cover"
          />
        </div>

        {/* Level badge */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
          <div
            className={`flex items-center gap-1 rounded-md border border-border bg-secondary/80 shadow-lg ${sizeClasses[size].badge}`}
          >
            <span className="text-foreground font-bold">Lv {level}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarFrame;

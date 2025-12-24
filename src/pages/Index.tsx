import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LevelBadge from "@/components/profile/LevelBadge";
import XPBar from "@/components/XPBar";
import StatsRow from "@/components/StatsRow";
import GoalsSection from "@/components/GoalsSection";
import StartWorkoutButton from "@/components/StartWorkoutButton";
import AchievementsCard from "@/components/AchievementsCard";
import BottomNav from "@/components/BottomNav";
import { getProfile, getQuests, syncQuestsStatus, getAchievements } from "@/lib/storage";

const getRank = (level: number) => {
  if (level >= 25) {
    return {
      name: "Diamante",
      subtitle: "Elite",
      tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    };
  }
  if (level >= 20) {
    return {
      name: "Platina",
      subtitle: "Avançado",
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    };
  }
  if (level >= 15) {
    return {
      name: "Ouro",
      subtitle: "Veterano",
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    };
  }
  if (level >= 10) {
    return {
      name: "Prata",
      subtitle: "Consistente",
      tone: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    };
  }
  if (level >= 5) {
    return {
      name: "Bronze",
      subtitle: "Promessa",
      tone: "border-orange-500/30 bg-orange-500/10 text-orange-200",
    };
  }

  return {
    name: "Ferro",
    subtitle: "Início da jornada",
    tone: "border-border bg-secondary/60 text-muted-foreground",
  };
};

const Index = () => {
  const [profile, setProfile] = useState(getProfile());
  const [quests, setQuests] = useState(getQuests());
  const [achievements, setAchievements] = useState(getAchievements());
  const rank = getRank(profile.level);

  useEffect(() => {
    // Sync quests status on mount
    syncQuestsStatus();
    setQuests(getQuests());
    setAchievements(getAchievements());
  }, []);

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() > 0.85 ? 1 : 0.5,
      })),
    []
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const nextRewardIn = Math.max(1, 3 - (unlockedCount % 3)); // Every 3 achievements

  const goals = [
    {
      id: "1",
      icon: "workout" as const,
      label: "Fazer treino do dia",
      xp: 150,
      completed: quests.treinoDoDiaDone,
    },
    {
      id: "2",
      icon: "nutrition" as const,
      label: "Registrar alimentação",
      xp: 80,
      completed: quests.registrarAlimentacaoDone,
    },
    {
      id: "3",
      icon: "weight" as const,
      label: "Registrar peso (semanal)",
      xp: 120,
      completed: quests.registrarPesoDone,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Starfield background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 70% at 50% 0%, rgba(59,130,246,0.18) 0%, rgba(2,6,23,0.7) 55%, rgba(2,6,23,0.95) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -top-32 right-[-6rem] w-64 h-64 rounded-full bg-primary/15 blur-3xl float-slow" />
        <div className="absolute bottom-[-10rem] left-[-6rem] w-56 h-56 rounded-full bg-sky-400/10 blur-3xl float-slow" />
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-foreground/25 star-twinkle"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-7 pb-6">
        <div className="flex items-center justify-between mb-6 reveal-up">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Seu painel</p>
            <p className="text-lg font-semibold text-foreground">Resumo de hoje</p>
          </div>
          <Link
            to="/settings"
            className="w-10 h-10 rounded-2xl border border-border/60 bg-secondary/70 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Hero card */}
        <Link to="/perfil" className="block mb-6 reveal-up stagger-1">
          <div className="card-glass relative overflow-hidden p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-transparent" />
            <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="shrink-0">
                <LevelBadge level={profile.level} avatarUrl={profile.avatarUrl} size={96} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-foreground">
                      <span className="text-gradient">LevelUp</span>{" "}
                      <span className="text-muted-foreground font-medium">GYM</span>
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Nível {profile.level} • {rank.subtitle}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border ${rank.tone}`}
                  >
                    Elo {rank.name}
                  </span>
                </div>
                <div className="mt-4">
                  <XPBar current={profile.xpAtual} max={profile.xpMeta} showChevron={false} compact />
                </div>
                <div className="mt-4">
                  <StatsRow
                    streak={profile.streakDias}
                    multiplier={profile.multiplier}
                    shields={profile.shields}
                  />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Goals Section */}
        <div className="mb-4 reveal-up stagger-2">
          <GoalsSection goals={goals} />
        </div>

        {/* Start Workout CTA */}
        <div className="mb-4 reveal-up stagger-3">
          <StartWorkoutButton />
        </div>

        {/* Achievements Card - now clickable */}
        <Link to="/conquistas" className="block mb-6 reveal-up stagger-3">
          <AchievementsCard current={unlockedCount} total={totalCount} nextRewardIn={nextRewardIn} />
        </Link>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;

import { Link } from "react-router-dom";
import { Settings, HelpCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AvatarFrame from "@/components/AvatarFrame";
import XPBar from "@/components/XPBar";
import StatsRow from "@/components/StatsRow";
import GoalsSection from "@/components/GoalsSection";
import StartWorkoutButton from "@/components/StartWorkoutButton";
import AchievementsCard from "@/components/AchievementsCard";
import BottomNav from "@/components/BottomNav";
import {
  getProfile,
  syncQuestsStatus,
  getAchievements,
  getUserWorkoutPlan,
} from "@/lib/storage";
import EducationModal from "@/components/EducationModal";
import {
  getActiveObjective,
  getObjectiveMissionsForToday,
  refreshActiveObjectiveProgress,
  toggleObjectiveMission,
  getPendingWorkoutCheckIn,
  resolveWorkoutCheckInAsDone,
  resolveWorkoutCheckInAsMissed,
} from "@/lib/objectiveState";
import { getObjectiveRemainingLabel, type EducationKey } from "@/lib/objectives";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [achievements, setAchievements] = useState(getAchievements());
  const [objective, setObjective] = useState(getActiveObjective());
  const [missions, setMissions] = useState(getObjectiveMissionsForToday());
  const [educationKey, setEducationKey] = useState<EducationKey | null>(null);
  const [pendingCheckIn, setPendingCheckIn] = useState(getPendingWorkoutCheckIn());
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInWorkoutId, setCheckInWorkoutId] = useState(pendingCheckIn?.workoutId || "");
  const triggerSync = useSyncTrigger();
  const rank = getRank(profile.level);

  useEffect(() => {
    // Sync quests status on mount
    syncQuestsStatus();
    setAchievements(getAchievements());
    const refreshed = refreshActiveObjectiveProgress();
    setObjective(refreshed);
    setMissions(getObjectiveMissionsForToday());
    setPendingCheckIn(getPendingWorkoutCheckIn());
  }, []);

  useEffect(() => {
    if (pendingCheckIn?.workoutId) {
      setCheckInWorkoutId(pendingCheckIn.workoutId);
    }
  }, [pendingCheckIn]);

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

  const goals = missions.map((mission) => {
    const icon =
      mission.id === "peso" || mission.id.includes("peso")
        ? ("weight" as const)
        : mission.id.includes("nutricao") || mission.id.includes("alimentacao")
        ? ("nutrition" as const)
        : ("workout" as const);

    return {
      id: mission.id,
      icon,
      label: mission.title,
      xp: mission.xp,
      completed: mission.completed,
      explainKey: mission.educationKey,
      canToggle: mission.completionType === "manual",
    };
  });

  const objectiveRemaining = objective ? getObjectiveRemainingLabel(objective) : "";
  const userPlan = getUserWorkoutPlan();
  const XP_PER_WORKOUT = 150;

  const handleExplain = (key: EducationKey) => setEducationKey(key);

  const handleToggleMission = (missionId: string) => {
    toggleObjectiveMission(missionId);
    setMissions(getObjectiveMissionsForToday());
  };

  const handleCheckInDone = () => {
    if (!pendingCheckIn || !checkInWorkoutId) return;
    resolveWorkoutCheckInAsDone(pendingCheckIn.dateKey, checkInWorkoutId, XP_PER_WORKOUT);
    setPendingCheckIn(null);
    setProfile(getProfile());
    triggerSync();
    setShowCheckInModal(false);
  };

  const handleCheckInMissed = () => {
    if (!pendingCheckIn) return;
    resolveWorkoutCheckInAsMissed(pendingCheckIn.dateKey);
    setPendingCheckIn(null);
    triggerSync();
  };

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
                <AvatarFrame level={profile.level} avatarUrl={profile.avatarUrl} size="sm" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Objetivo ativo
                    </p>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold text-foreground text-gradient">
                        {objective?.title ?? "Objetivo"}
                      </h1>
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          setEducationKey("objective-realistic-goals");
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nivel do objetivo {objective?.objectiveLevel ?? 1} - {objective?.progressPercent ?? 0}%
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border ${rank.tone}`}
                  >
                    Elo {rank.name}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-muted/70 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${objective?.progressPercent ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{objectiveRemaining}</p>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] text-muted-foreground">
                    Conta: Lv {profile.level} ({profile.xpAtual}/{profile.xpMeta} XP)
                  </p>
                </div>
                <div className="mt-3">
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

        {pendingCheckIn && (
          <div className="card-glass p-4 mb-4 reveal-up stagger-2">
            <p className="text-sm text-foreground">
              Voce nao marcou o treino de ontem. Voce foi treinar?
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="px-3 py-2 rounded-xl bg-secondary/50 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                Fui
              </button>
              <button
                onClick={handleCheckInMissed}
                className="px-3 py-2 rounded-xl bg-secondary/50 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                Nao fui
              </button>
              <button
                onClick={() => setShowCheckInModal(true)}
                className="px-3 py-2 rounded-xl bg-secondary/50 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                Esqueci de registrar
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Ta tudo bem falhar um dia. O importante e voltar hoje.
            </p>
            <Link
              to="/treino"
              className="text-xs text-primary hover:text-primary/80 mt-2 inline-flex"
            >
              Comecar treino de hoje
            </Link>
          </div>
        )}

        {/* Goals Section */}
        <div className="mb-4 reveal-up stagger-2">
          <GoalsSection goals={goals} onExplain={handleExplain} onToggle={handleToggleMission} />
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

      {pendingCheckIn && (
        <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
          <DialogContent className="bg-card border-border/50 max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle>Registrar treino de ontem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Selecione o treino realizado</p>
                <Select value={checkInWorkoutId} onValueChange={setCheckInWorkoutId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Treino" />
                  </SelectTrigger>
                  <SelectContent>
                    {userPlan.workouts.map((workout) => (
                      <SelectItem key={workout.id} value={workout.id}>
                        {workout.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                XP sera aplicado ao registrar o treino.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCheckInModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCheckInDone} disabled={!checkInWorkoutId}>
                Registrar treino
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {educationKey && (
        <EducationModal
          open={Boolean(educationKey)}
          onClose={() => setEducationKey(null)}
          contentKey={educationKey}
        />
      )}
    </div>
  );
};

export default Index;

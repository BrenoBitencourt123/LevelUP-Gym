import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, CheckCircle, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import {
  claimObjectiveReward,
  getActiveObjective,
} from "@/lib/objectiveState";
import {
  getWorkoutsCompleted,
  getNutritionLogs,
  getWeightHistory,
} from "@/lib/storage";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

const ObjectiveCompletion = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();
  const objective = getActiveObjective();

  const stats = useMemo(() => {
    if (!objective) return null;
    const startTime = new Date(objective.startAt).getTime();
    const workouts = getWorkoutsCompleted().filter((w) => new Date(w.timestamp).getTime() >= startTime);
    const nutritionLogs = getNutritionLogs().filter((l) => new Date(l.dateKey).getTime() >= startTime);
    const weightLogs = getWeightHistory().filter((w) => new Date(w.timestamp).getTime() >= startTime);
    return {
      workouts: workouts.length,
      nutritionLogs: nutritionLogs.length,
      weightLogs: weightLogs.length,
    };
  }, [objective]);

  useEffect(() => {
    if (!objective) {
      navigate("/", { replace: true });
    }
  }, [objective, navigate]);

  if (!objective) {
    return null;
  }

  const handleClaim = () => {
    claimObjectiveReward();
    triggerSync();
    navigate("/objetivo", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-16 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Objetivo concluido!</h1>
        <p className="text-muted-foreground text-center mb-8">
          {objective.title} finalizado com sucesso
        </p>

        <div className="w-full space-y-4 mb-8">
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Progresso atingido</p>
              <p className="text-2xl font-bold text-primary">
                {objective.progressPercent}% (Lv {objective.objectiveLevel})
              </p>
            </div>
          </div>

          {stats && (
            <div className="card-glass p-5">
              <p className="text-sm text-muted-foreground mb-3">Principais habitos completados</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.workouts}</p>
                  <p className="text-xs text-muted-foreground">Treinos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.nutritionLogs}</p>
                  <p className="text-xs text-muted-foreground">Nutricao</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.weightLogs}</p>
                  <p className="text-xs text-muted-foreground">Pesagens</p>
                </div>
              </div>
            </div>
          )}

          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Recompensa</p>
              <p className="text-2xl font-bold text-primary">+{objective.rewardXp} XP</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClaim}
          className="w-full cta-button flex items-center justify-center gap-3"
        >
          <span className="text-lg font-semibold">Reivindicar recompensa</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ObjectiveCompletion;

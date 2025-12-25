import { Filter, CheckCircle, Calendar, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import WorkoutCard from "@/components/WorkoutCard";
import BottomNav from "@/components/BottomNav";
import { getUserWorkoutPlan } from "@/lib/storage";
import { getWorkoutOfDay, getWeekStart } from "@/lib/weekUtils";
import { getWeeklyCompletions } from "@/lib/appState";
import { getActiveObjective } from "@/lib/objectiveState";
import { getObjectiveTrainingProfile, type EducationKey } from "@/lib/objectives";
import EducationModal from "@/components/EducationModal";

const Treino = () => {
  const userPlan = getUserWorkoutPlan();
  const todayWorkoutId = getWorkoutOfDay();
  const weekStart = getWeekStart();
  const weeklyCompletions = getWeeklyCompletions(weekStart);
  const objective = getActiveObjective();
  const trainingProfile = objective ? getObjectiveTrainingProfile(objective.type) : null;
  const [educationKey, setEducationKey] = useState<EducationKey | null>(null);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Plano de Treino</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/treino/ajustar"
              className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              Ajustar plano
            </Link>
            <button className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {objective && trainingProfile && (
          <div className="card-glass p-4 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Foco atual</p>
                <p className="text-lg font-semibold text-foreground">{objective.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Volume {trainingProfile.volumeMultiplier.toFixed(2)}x • Cardio {trainingProfile.cardioSuggestionPerWeek}x/sem
                </p>
              </div>
              <button
                onClick={() => setEducationKey("workout-why")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Workout Cards */}
        <div className="space-y-4">
          {userPlan.workouts.map((workout) => {
            const isToday = workout.id === todayWorkoutId;
            const isCompletedThisWeek = !!weeklyCompletions[workout.id];

            return (
              <div key={workout.id} className="relative">
                {/* Badges */}
                <div className="absolute -top-2 right-2 flex gap-2 z-10">
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Hoje
                    </span>
                  )}
                  {isCompletedThisWeek && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Concluído
                    </span>
                  )}
                </div>

                <WorkoutCard
                  title={workout.titulo}
                  exercises={workout.exercicios.map(e => e.nome)}
                  slug={workout.id}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

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

export default Treino;

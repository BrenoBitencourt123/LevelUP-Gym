import { Dumbbell, Apple, Scale, Check, HelpCircle } from "lucide-react";
import type { EducationKey } from "@/lib/objectives";

interface Goal {
  id: string;
  icon: "workout" | "nutrition" | "weight";
  label: string;
  xp: number;
  completed?: boolean;
  explainKey?: EducationKey;
  canToggle?: boolean;
}

interface GoalsSectionProps {
  goals: Goal[];
  onExplain?: (key: EducationKey) => void;
  onToggle?: (goalId: string) => void;
}

const iconMap = {
  workout: Dumbbell,
  nutrition: Apple,
  weight: Scale,
};

const GoalsSection = ({ goals, onExplain, onToggle }: GoalsSectionProps) => {
  const completedCount = goals.filter((goal) => goal.completed).length;
  const progress = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Missoes de hoje</h2>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{goals.length} concluidas
          </p>
        </div>
        <span className="text-xs text-muted-foreground">+XP por objetivo</span>
      </div>
      <div className="card-glass overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted/70 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </div>
        {goals.map((goal) => {
          const Icon = iconMap[goal.icon];
          const canToggle = Boolean(goal.canToggle && onToggle);
          return (
            <div
              key={goal.id}
              className={`goal-item group ${
                goal.completed ? "opacity-60" : "hover:bg-muted/30"
              } ${canToggle ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (canToggle && onToggle) {
                  onToggle(goal.id);
                }
              }}
            >
              <div className="flex items-center gap-3">
                {goal.completed ? (
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-secondary/80 flex items-center justify-center group-hover:bg-secondary transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <span
                  className={`text-sm font-medium ${
                    goal.completed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {goal.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {goal.explainKey && onExplain && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onExplain(goal.explainKey!);
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                )}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    goal.completed
                      ? "text-muted-foreground border-border/60"
                      : "text-primary border-primary/40 bg-primary/10"
                  }`}
                >
                  +{goal.xp} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsSection;

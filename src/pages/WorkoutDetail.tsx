import { ArrowLeft, RotateCcw, Dumbbell, Clock, Play } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { getTreinoHoje, getUserWorkoutPlan, saveTreinoHoje } from "@/lib/storage";

const WorkoutDetails = () => {
  const { treinoId } = useParams();
  const navigate = useNavigate();

  const plan = getUserWorkoutPlan();
  const workout = plan.workouts.find((w) => w.id === (treinoId || ""));
  const treinoHoje = getTreinoHoje();

  const hasActive = !!treinoHoje?.treinoId && !treinoHoje?.completedAt;
  const isThisWorkoutActive = hasActive && treinoHoje?.treinoId === workout?.id;

  if (!workout) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-6">
          <p className="text-muted-foreground">Treino não encontrado.</p>
          <Link to="/treino" className="text-primary underline">Voltar</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleStartOrResume = () => {
    if (isThisWorkoutActive) {
      navigate(`/treino/${workout.id}/ativo`);
      return;
    }

    saveTreinoHoje({
      treinoId: workout.id,
      startedAt: new Date().toISOString(),
    });
    window.dispatchEvent(new Event("levelup:treinoHojeChanged"));
    navigate(`/treino/${workout.id}/ativo`);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <Link
            to="/treino"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>

          <button
            type="button"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            title="Reset (placeholder)"
          >
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">{workout.titulo}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4" />
              {workout.exercicios.length} exercícios
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" />~{workout.duracaoEstimada} min
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {workout.exercicios.map((ex, idx) => (
            <div key={ex.id} className="card-glass p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-sm text-muted-foreground">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{ex.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {ex.workSetsDefault.length} séries • {ex.repsRange} reps
                </p>
              </div>

              <span className="px-2 py-1 rounded-full bg-secondary/60 text-xs text-muted-foreground">
                Principal
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleStartOrResume}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Play className="w-5 h-5 fill-current" />
          {isThisWorkoutActive ? "Retomar treino" : "Iniciar treino"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default WorkoutDetails;

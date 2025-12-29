import { Play, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearTreinoProgress, getTreinoHoje, STORAGE_KEYS } from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const WorkoutInProgressBar = () => {
  const [treinoHoje, setTreinoHoje] = useState(getTreinoHoje());
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("0:00");

  useEffect(() => {
    const sync = () => setTreinoHoje(getTreinoHoje());

    // pega rápido em eventos “manuais”
    const onCustom = () => sync();
    window.addEventListener("levelup:treinoHojeChanged", onCustom);

    // fallback
    const interval = setInterval(sync, 3000);

    // quando volta pro app
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    sync();

    return () => {
      window.removeEventListener("levelup:treinoHojeChanged", onCustom);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!treinoHoje?.startedAt || treinoHoje.completedAt) return;

    const updateTime = () => {
      const start = new Date(treinoHoje.startedAt);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsedTime(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [treinoHoje]);

  const handleDiscard = () => {
    if (treinoHoje?.treinoId) {
      clearTreinoProgress(treinoHoje.treinoId);
      localStorage.removeItem(STORAGE_KEYS.TREINO_HOJE);
      setTreinoHoje(null);
      window.dispatchEvent(new Event("levelup:treinoHojeChanged"));
    }
    setShowDiscardDialog(false);
  };

  if (!treinoHoje || treinoHoje.completedAt) return null;

  return (
    <>
      <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-2">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Treino em progresso</p>
                <p className="text-xs text-muted-foreground">{elapsedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDiscardDialog(true)}
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <Link
                to={`/treino/${treinoHoje.treinoId}/ativo`}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Continuar
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja descartar o treino em andamento? Todo o progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorkoutInProgressBar;

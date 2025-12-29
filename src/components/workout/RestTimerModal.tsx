import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type RestTimerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingSec: number;
  onAddSeconds: (delta: number) => void;
  onStop: () => void;
  onSkip: () => void;
};

const formatCountdown = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const RestTimerModal = ({
  open,
  onOpenChange,
  remainingSec,
  onAddSeconds,
  onStop,
  onSkip,
}: RestTimerModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Timer de descanso</DialogTitle>
        </DialogHeader>

        <div className="py-4 text-center">
          <p className="text-4xl font-semibold text-foreground tabular-nums">
            {formatCountdown(remainingSec)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Tempo restante</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => onAddSeconds(15)}>
            +15s
          </Button>
          <Button variant="outline" onClick={() => onAddSeconds(30)}>
            +30s
          </Button>
          <Button variant="outline" onClick={() => onAddSeconds(60)}>
            +60s
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onStop}>
            Parar
          </Button>
          <Button onClick={onSkip}>
            Pular
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestTimerModal;

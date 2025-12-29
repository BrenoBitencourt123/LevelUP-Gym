import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (rir: number | null) => void; // null = não informar
};

const options = [0, 1, 2, 3, 4, 5];

const RirModal = ({ open, onOpenChange, onSelect }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="leading-tight">
              Quantas repetições sobraram?
            </DialogTitle>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="w-9 h-9 rounded-lg bg-secondary/30 hover:bg-secondary/40 border border-border/40 flex items-center justify-center transition-colors"
                  aria-label="O que é isso?"
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px]">
                <p className="text-xs">
                  Isso é o <b>RIR</b> (reps in reserve): quantas reps você ainda conseguiria fazer
                  mantendo a boa forma no final da série.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            Pense assim: na última repetição, você conseguiria fazer mais quantas com boa forma?
          </p>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {options.map((n) => (
            <Button
              key={n}
              variant="outline"
              className="h-12"
              onClick={() => onSelect(n)}
            >
              {n}
            </Button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={() => onSelect(null)}>
            Não sei
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RirModal;

import { X, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { educationContent } from "@/lib/education";
import type { EducationKey } from "@/lib/objectives";

interface EducationModalProps {
  open: boolean;
  onClose: () => void;
  contentKey: EducationKey;
}

const EducationModal = ({ open, onClose, contentKey }: EducationModalProps) => {
  const content = educationContent[contentKey];

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="bg-card border-border/50 max-w-sm mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-primary" />
              <DialogTitle className="text-foreground">{content.title}</DialogTitle>
            </div>
            <DialogClose asChild>
              <button className="p-2 hover:bg-muted/30 rounded-lg transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="card-glass p-3">
            <p className="text-sm text-muted-foreground">{content.micro}</p>
          </div>

          <div className="space-y-2">
            {content.medium.map((line) => (
              <p key={line} className="text-sm text-muted-foreground">
                {line}
              </p>
            ))}
          </div>

          <div className="border-t border-border/30 pt-3 space-y-2">
            {content.deep.map((line) => (
              <p key={line} className="text-xs text-muted-foreground">
                {line}
              </p>
            ))}
          </div>

          <div className="border-t border-border/30 pt-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
              Referencias
            </p>
            <div className="space-y-1">
              {content.references.map((ref) => (
                <p key={ref} className="text-xs text-muted-foreground">
                  {ref}
                </p>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EducationModal;

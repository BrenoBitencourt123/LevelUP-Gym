import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Dumbbell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAndActivateObjective } from "@/lib/objectiveState";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";
import type { ObjectiveType } from "@/lib/objectives";

const objectiveOptions: Array<{
  id: ObjectiveType;
  title: string;
  description: string;
  icon: JSX.Element;
}> = [
  {
    id: "perder_peso",
    title: "Perder peso",
    description: "Reducao gradual e sustentavel",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
  },
  {
    id: "ganhar_massa",
    title: "Ganhar massa",
    description: "Mais volume e recuperacao",
    icon: <Dumbbell className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: "manutencao",
    title: "Manutencao",
    description: "Manter resultados com consistencia",
    icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
  },
];

const ObjectiveOnboarding = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();

  const [step, setStep] = useState(0);
  const [objectiveType, setObjectiveType] = useState<ObjectiveType | "">("");
  const [weightCurrent, setWeightCurrent] = useState("");
  const [weightTarget, setWeightTarget] = useState("");
  const [waistTarget, setWaistTarget] = useState("");
  const [weeksTarget, setWeeksTarget] = useState("8");
  const [trainingDays, setTrainingDays] = useState("3");
  const [trainingLevel, setTrainingLevel] = useState<"iniciante" | "intermediario" | "">("");
  const [error, setError] = useState("");

  const weightCurrentValue = parseFloat(weightCurrent);
  const weightTargetValue = parseFloat(weightTarget);
  const waistTargetValue = parseFloat(waistTarget);
  const weeksTargetValue = parseInt(weeksTarget, 10);
  const trainingDaysValue = parseInt(trainingDays, 10);

  const needsTargetWeight = objectiveType !== "manutencao";
  const canContinue = Boolean(objectiveType);

  const canComplete = useMemo(() => {
    if (!objectiveType) return false;
    if (!weightCurrentValue || weightCurrentValue <= 0) return false;
    if (needsTargetWeight && (!weightTargetValue || weightTargetValue <= 0)) return false;
    if (!weeksTargetValue || weeksTargetValue <= 0) return false;
    if (!trainingDaysValue || trainingDaysValue <= 0) return false;
    if (!trainingLevel) return false;
    return true;
  }, [
    objectiveType,
    weightCurrentValue,
    weightTargetValue,
    weeksTargetValue,
    trainingDaysValue,
    trainingLevel,
    needsTargetWeight,
  ]);

  const handleSelectObjective = (type: ObjectiveType) => {
    setObjectiveType(type);
    setError("");
  };

  const handleNext = () => {
    if (!objectiveType) {
      setError("Selecione um objetivo.");
      return;
    }
    setStep(1);
  };

  const handleComplete = () => {
    if (!objectiveType) return;
    if (!canComplete) {
      setError("Preencha os campos obrigatorios.");
      return;
    }

    const startWeight = weightCurrentValue;
    const targetWeight = needsTargetWeight ? weightTargetValue : startWeight;
    const targetWaist = isNaN(waistTargetValue) ? undefined : waistTargetValue;

    createAndActivateObjective({
      type: objectiveType,
      startWeightKg: startWeight,
      targetWeightKg: targetWeight,
      targetWaistCm: targetWaist,
      weeksTarget: weeksTargetValue,
      trainingDays: trainingDaysValue,
      trainingLevel: trainingLevel === "iniciante" ? "iniciante" : "intermediario",
    });
    triggerSync();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-10 pb-16">
        {step === 0 && (
          <div className="card-glass p-6">
            <h1 className="text-xl font-bold text-foreground text-center">
              Escolha seu objetivo
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Ele vai guiar treino, missoes e nutricao.
            </p>

            <div className="mt-6 space-y-3">
              {objectiveOptions.map((option) => {
                const selected = objectiveType === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectObjective(option.id)}
                    className={`w-full card-glass p-4 flex items-center gap-4 text-left transition-colors ${
                      selected ? "border-primary/60 bg-primary/10" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{option.title}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <div className="text-sm text-destructive mt-3">{error}</div>}

            <Button onClick={handleNext} className="w-full h-12 text-base mt-6" disabled={!canContinue}>
              Continuar
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="card-glass p-6">
            <h1 className="text-xl font-bold text-foreground text-center">
              Defina sua meta
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Ajustes simples para um plano realista.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="weightCurrent">Peso atual (kg)</Label>
                <Input
                  id="weightCurrent"
                  type="number"
                  min="0"
                  value={weightCurrent}
                  onChange={(e) => setWeightCurrent(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="weightTarget">
                  {objectiveType === "manutencao" ? "Peso alvo (kg)" : "Peso alvo (kg)"}
                </Label>
                <Input
                  id="weightTarget"
                  type="number"
                  min="0"
                  value={weightTarget}
                  onChange={(e) => setWeightTarget(e.target.value)}
                  placeholder={objectiveType === "manutencao" ? weightCurrent : ""}
                />
              </div>

              {objectiveType === "perder_peso" && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="waistTarget">Cintura alvo (cm) - opcional</Label>
                  <Input
                    id="waistTarget"
                    type="number"
                    min="0"
                    value={waistTarget}
                    onChange={(e) => setWaistTarget(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2 col-span-1">
                <Label>Prazo sugerido (semanas)</Label>
                <Select value={weeksTarget} onValueChange={setWeeksTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 semanas</SelectItem>
                    <SelectItem value="8">8 semanas</SelectItem>
                    <SelectItem value="10">10 semanas</SelectItem>
                    <SelectItem value="12">12 semanas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label>Dias/semana</Label>
                <Select value={trainingDays} onValueChange={setTrainingDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 dias</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="4">4 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="6">6 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Nivel de treino</Label>
                <Select
                  value={trainingLevel}
                  onValueChange={(value) => setTrainingLevel(value as "iniciante" | "intermediario")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <div className="text-sm text-destructive mt-3">{error}</div>}

            <Button onClick={handleComplete} className="w-full h-12 text-base mt-6" disabled={!canComplete}>
              Criar objetivo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectiveOnboarding;

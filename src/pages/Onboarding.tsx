import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Dumbbell, Flame, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLocalState } from "@/lib/appState";
import type {
  OnboardingActivity,
  OnboardingEquipment,
  OnboardingGoal,
  OnboardingSex,
} from "@/lib/appState";
import {
  buildWorkoutPlan,
  buildWorkoutSchedule,
  calculateNutritionTargets,
  getAgeFromBirthDate,
} from "@/lib/onboarding";
import { createAndActivateObjective } from "@/lib/objectiveState";
import type { ObjectiveType } from "@/lib/objectives";

type GoalOption = {
  id: ObjectiveType;
  title: string;
  description: string;
  icon: ReactNode;
};

const objectiveOptions: GoalOption[] = [
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

const objectiveGoalMap: Record<ObjectiveType, OnboardingGoal> = {
  perder_peso: "fat_loss",
  ganhar_massa: "muscle_gain",
  manutencao: "maintenance",
};

const Onboarding = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();

  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const [sex, setSex] = useState<OnboardingSex | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState<OnboardingActivity | "">("");
  const [trainingDays, setTrainingDays] = useState("3");
  const [equipment, setEquipment] = useState<OnboardingEquipment | "">("");

  const [objectiveType, setObjectiveType] = useState<ObjectiveType | "">("");
  const [weightTarget, setWeightTarget] = useState("");
  const [waistTarget, setWaistTarget] = useState("");
  const [weeksTarget, setWeeksTarget] = useState("8");
  const [trainingLevel, setTrainingLevel] = useState<"iniciante" | "intermediario" | "">("");

  const [error, setError] = useState("");

  const age = useMemo(() => getAgeFromBirthDate(birthDate), [birthDate]);
  const heightValue = Number(heightCm);
  const weightValue = Number(weightKg);
  const daysValue = Number(trainingDays);
  const weightTargetValue = Number(weightTarget);
  const waistTargetValue = Number(waistTarget);
  const weeksTargetValue = Number(weeksTarget);

  const canContinueStep0 = Boolean(birthDate) && ageConfirmed && age >= 18;
  const canContinueStep1 =
    Boolean(sex) &&
    Boolean(activityLevel) &&
    Boolean(equipment) &&
    heightValue > 0 &&
    weightValue > 0 &&
    daysValue > 0;
  const canContinueStep2 = Boolean(objectiveType);

  const needsTargetWeight = objectiveType !== "manutencao";
  const canCompleteStep3 =
    Boolean(objectiveType) &&
    weeksTargetValue > 0 &&
    Boolean(trainingLevel) &&
    (!needsTargetWeight || weightTargetValue > 0);

  const targetFeedback = useMemo(() => {
    if (!weightValue || !weightTargetValue || !weeksTargetValue) return null;
    const delta = weightTargetValue - weightValue;
    if (delta === 0) return { tone: "ok", text: "Meta neutra. Ajuste pequeno e estavel." };
    const weeklyChange = Math.abs(delta) / weeksTargetValue;
    if (objectiveType === "perder_peso" && delta < 0) {
      if (weeklyChange > 1) return { tone: "danger", text: "Meta agressiva demais. Pode ser perigoso." };
      if (weeklyChange > 0.75) return { tone: "warn", text: "Meta bem agressiva. Pode ser prejudicial." };
      return { tone: "ok", text: "Meta realista e recomendada." };
    }
    if (objectiveType === "ganhar_massa" && delta > 0) {
      if (weeklyChange > 0.6) return { tone: "warn", text: "Ganho muito rapido. Pode ser prejudicial." };
      if (weeklyChange > 0.4) return { tone: "caution", text: "Ganho acelerado. Avalie com cuidado." };
      return { tone: "ok", text: "Meta realista e recomendada." };
    }
    if (objectiveType === "manutencao") {
      return { tone: "ok", text: "Meta de manutencao definida." };
    }
    return { tone: "caution", text: "Meta fora do objetivo escolhido." };
  }, [objectiveType, weightTargetValue, weightValue, weeksTargetValue]);

  const handleStep0 = () => {
    setError("");
    if (!birthDate) {
      setError("Informe sua data de nascimento.");
      return;
    }
    if (age < 18) {
      setError("Voce precisa ter 18 anos ou mais.");
      return;
    }
    if (!ageConfirmed) {
      setError("Confirme que voce tem 18 anos ou mais.");
      return;
    }
    setStep(1);
  };

  const handleStep1 = () => {
    setError("");
    if (!canContinueStep1) {
      setError("Preencha todos os campos.");
      return;
    }
    setStep(2);
  };

  const handleStep2 = () => {
    setError("");
    if (!objectiveType) {
      setError("Selecione um objetivo.");
      return;
    }
    setStep(3);
  };

  const handleComplete = () => {
    setError("");
    if (!objectiveType) {
      setError("Selecione um objetivo.");
      return;
    }
    if (needsTargetWeight && (!weightTargetValue || weightTargetValue <= 0)) {
      setError("Informe o peso alvo.");
      return;
    }
    if (!weeksTargetValue || weeksTargetValue <= 0) {
      setError("Informe o prazo.");
      return;
    }
    if (!trainingLevel) {
      setError("Selecione o nivel de treino.");
      return;
    }

    const goal = objectiveGoalMap[objectiveType];
    const input = {
      birthDate,
      goal,
      sex,
      age,
      heightCm: heightValue,
      weightKg: weightValue,
      activityLevel,
      trainingDays: daysValue,
      targetWeightKg: needsTargetWeight ? weightTargetValue : weightValue,
      weeksTarget: weeksTargetValue,
    };

    const targets = calculateNutritionTargets(input);
    const plan = buildWorkoutPlan(daysValue);
    const schedule = buildWorkoutSchedule(
      daysValue,
      plan.workouts.map((workout) => workout.id)
    );

    const targetWeight = needsTargetWeight ? weightTargetValue : weightValue;
    const targetWaist = Number.isNaN(waistTargetValue) ? undefined : waistTargetValue;

    createAndActivateObjective({
      type: objectiveType,
      startWeightKg: weightValue,
      targetWeightKg: targetWeight,
      targetWaistCm: targetWaist,
      weeksTarget: weeksTargetValue,
      trainingDays: daysValue,
      trainingLevel: trainingLevel === "iniciante" ? "iniciante" : "intermediario",
    });

    updateLocalState((state) => ({
      ...state,
      profile: {
        ...state.profile,
        goal,
        onboardingComplete: true,
        onboarding: {
          birthDate,
          isAdultConfirmed: ageConfirmed,
          goal,
          sex,
          age,
          heightCm: heightValue,
          weightKg: weightValue,
          activityLevel,
          trainingDays: daysValue,
          equipment,
        },
      },
      nutrition: {
        ...state.nutrition,
        targets: {
          kcal: targets.kcalTarget,
          protein: targets.pTarget,
          carbs: targets.cTarget,
          fats: targets.gTarget,
        },
      },
      plan,
      workoutSchedule: schedule,
    }));
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground text-center">
              Bem-vindo ao LevelUp
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Precisamos de alguns dados para personalizar seu plano.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ageConfirm"
                  checked={ageConfirmed}
                  onCheckedChange={(checked) => setAgeConfirmed(Boolean(checked))}
                />
                <Label htmlFor="ageConfirm" className="text-sm text-muted-foreground">
                  Confirmo que tenho 18 anos ou mais.
                </Label>
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <Button
                onClick={handleStep0}
                className="w-full h-12 text-base"
                disabled={!canContinueStep0}
              >
                Continuar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Este app oferece orientacao geral de fitness.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="card-glass p-6">
            <h1 className="text-xl font-bold text-foreground text-center">
              Seus dados basicos
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Usamos isso para calcular seu gasto calorico.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Sexo</Label>
                <Select value={sex} onValueChange={(value) => setSex(value as OnboardingSex)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label>Nivel de atividade</Label>
                <Select
                  value={activityLevel}
                  onValueChange={(value) => setActivityLevel(value as OnboardingActivity)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentario</SelectItem>
                    <SelectItem value="light">Leve</SelectItem>
                    <SelectItem value="moderate">Moderado</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="athlete">Atleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="weight">Peso atual (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label>Dias por semana</Label>
                <Select value={trainingDays} onValueChange={(value) => setTrainingDays(value)}>
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

              <div className="space-y-2 col-span-1">
                <Label>Equipamento</Label>
                <Select
                  value={equipment}
                  onValueChange={(value) => setEquipment(value as OnboardingEquipment)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">Academia</SelectItem>
                    <SelectItem value="home">Casa</SelectItem>
                    <SelectItem value="mixed">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <div className="text-sm text-destructive mt-3">{error}</div>}

            <Button
              onClick={handleStep1}
              className="w-full h-12 text-base mt-6"
              disabled={!canContinueStep1}
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="card-glass p-6">
            <h1 className="text-xl font-bold text-foreground text-center">
              Escolha seu objetivo
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Ele vai guiar seu plano e missoes.
            </p>

            <div className="mt-6 space-y-3">
              {objectiveOptions.map((option) => {
                const selected = objectiveType === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setObjectiveType(option.id)}
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

            <Button
              onClick={handleStep2}
              className="w-full h-12 text-base mt-6"
              disabled={!canContinueStep2}
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 3 && (
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
                  value={weightKg}
                  disabled
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="weightTarget">Peso alvo (kg)</Label>
                <Input
                  id="weightTarget"
                  type="number"
                  min="0"
                  value={weightTarget}
                  onChange={(e) => setWeightTarget(e.target.value)}
                  placeholder={objectiveType === "manutencao" ? weightKg : ""}
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
                  <SelectTrigger className="h-10">
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
                <Label>Nivel de treino</Label>
                <Select
                  value={trainingLevel}
                  onValueChange={(value) => setTrainingLevel(value as "iniciante" | "intermediario")}
                >
                  <SelectTrigger className="h-10">
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
            {targetFeedback && (
              <div
                className={`text-sm mt-3 ${
                  targetFeedback.tone === "danger"
                    ? "text-destructive"
                    : targetFeedback.tone === "warn"
                    ? "text-amber-500"
                    : targetFeedback.tone === "caution"
                    ? "text-yellow-500"
                    : "text-emerald-500"
                }`}
              >
                {targetFeedback.text}
              </div>
            )}

            <Button
              onClick={handleComplete}
              className="w-full h-12 text-base mt-6"
              disabled={!canCompleteStep3}
            >
              Concluir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Dumbbell,
  Flame,
  Medal,
  ShieldCheck,
} from "lucide-react";
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

type GoalOption = {
  id: OnboardingGoal;
  title: string;
  description: string;
  icon: ReactNode;
};

const goalOptions: GoalOption[] = [
  {
    id: "fat_loss",
    title: "Fat Loss",
    description: "Reduce body fat while keeping muscle",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
  },
  {
    id: "muscle_gain",
    title: "Muscle Building",
    description: "Build size and strength",
    icon: <Dumbbell className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: "recomp",
    title: "Recomposition",
    description: "Lose fat and gain muscle",
    icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: "performance",
    title: "Performance",
    description: "Improve strength and athletic output",
    icon: <Medal className="w-5 h-5 text-violet-500" />,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();

  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [goal, setGoal] = useState<OnboardingGoal | "">("");

  const [sex, setSex] = useState<OnboardingSex | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState<OnboardingActivity | "">("");
  const [trainingDays, setTrainingDays] = useState("3");
  const [equipment, setEquipment] = useState<OnboardingEquipment | "">("");

  const [error, setError] = useState("");

  const age = useMemo(() => getAgeFromBirthDate(birthDate), [birthDate]);

  const canContinueStep1 = birthDate && ageConfirmed && age >= 18;
  const canContinueStep2 = Boolean(goal);

  const heightValue = Number(heightCm);
  const weightValue = Number(weightKg);
  const daysValue = Number(trainingDays);
  const canCompleteStep3 =
    Boolean(sex) &&
    Boolean(activityLevel) &&
    Boolean(equipment) &&
    heightValue > 0 &&
    weightValue > 0 &&
    daysValue > 0;

  const handleStep1 = () => {
    setError("");
    if (!birthDate) {
      setError("Select your date of birth.");
      return;
    }
    if (age < 18) {
      setError("You must be 18+ to continue.");
      return;
    }
    if (!ageConfirmed) {
      setError("Confirm you are 18 or older.");
      return;
    }
    setStep(1);
  };

  const handleStep2 = () => {
    setError("");
    if (!goal) {
      setError("Select your main goal.");
      return;
    }
    setStep(2);
  };

  const handleComplete = () => {
    setError("");
    if (!canCompleteStep3 || !goal || !sex || !activityLevel || !equipment) {
      setError("Fill all fields to continue.");
      return;
    }

    const input = {
      birthDate,
      goal,
      sex,
      age,
      heightCm: heightValue,
      weightKg: weightValue,
      activityLevel,
      trainingDays: daysValue,
    };

    const targets = calculateNutritionTargets(input);
    const plan = buildWorkoutPlan(daysValue);
    const schedule = buildWorkoutSchedule(
      daysValue,
      plan.workouts.map((workout) => workout.id)
    );

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
              Welcome to LevelUp
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              We need a few details to personalize your plan.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date of birth</Label>
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
                  I confirm I am 18 years or older.
                </Label>
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <Button
                onClick={handleStep1}
                className="w-full h-12 text-base"
                disabled={!canContinueStep1}
              >
                Continue
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              This app provides general fitness guidance only.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="card-glass p-6">
            <h1 className="text-xl font-bold text-foreground text-center">
              Whats your goal?
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              We will customize your plan based on this.
            </p>

            <div className="mt-6 space-y-3">
              {goalOptions.map((option) => {
                const selected = goal === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setGoal(option.id)}
                    className={`w-full card-glass p-4 flex items-center gap-4 text-left transition-colors ${
                      selected ? "border-primary/60 bg-primary/10" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {option.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
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
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="card-glass p-6">
            <h1 className="text-xl font-bold text-foreground text-center">
              Your details
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Help us calculate your targets.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Sex</Label>
                <Select value={sex} onValueChange={(value) => setSex(value as OnboardingSex)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label>Activity level</Label>
                <Select
                  value={activityLevel}
                  onValueChange={(value) =>
                    setActivityLevel(value as OnboardingActivity)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label>Days per week</Label>
                <Select
                  value={trainingDays}
                  onValueChange={(value) => setTrainingDays(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="4">4 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="6">6 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label>Equipment</Label>
                <Select
                  value={equipment}
                  onValueChange={(value) =>
                    setEquipment(value as OnboardingEquipment)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <div className="text-sm text-destructive mt-3">{error}</div>}

            <Button
              onClick={handleComplete}
              className="w-full h-12 text-base mt-6"
              disabled={!canCompleteStep3}
            >
              Complete setup
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              This app provides general guidance. Consult a professional if needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

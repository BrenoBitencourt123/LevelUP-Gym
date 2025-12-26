import { getLocalState, updateLocalState } from "@/lib/appState";
import {
  addXP,
  getConsistency,
  getQuests,
  getWeightHistory,
  getWorkoutsCompleted,
  saveWorkoutCompletedAt,
} from "@/lib/storage";
import { getWorkoutOfDay } from "@/lib/weekUtils";
import {
  applyObjectiveProgress,
  buildObjectiveMissionDefinitions,
  createObjective,
  resolveObjectiveMissions,
  type ActiveObjective,
  type ObjectiveCampaignState,
  type ObjectiveMission,
  type ObjectiveMissionDefinition,
  type ObjectiveCreationInput,
  type WorkoutCheckIn,
} from "@/lib/objectives";
import { markWorkoutCompletedAtDate } from "@/lib/appState";

const DEFAULT_OBJECTIVE_STATE: ObjectiveCampaignState = {
  history: [],
  dailyMissions: {},
  workoutCheckIns: {},
};
const WORKOUT_MISSED_XP_PENALTY = 50;

export function getObjectiveCampaignState(): ObjectiveCampaignState {
  const state = getLocalState();
  return state.objective ?? DEFAULT_OBJECTIVE_STATE;
}

export function getActiveObjective(): ActiveObjective | null {
  return getObjectiveCampaignState().active ?? null;
}

export function hasActiveObjective(): boolean {
  return Boolean(getObjectiveCampaignState().active);
}

export function createAndActivateObjective(input: ObjectiveCreationInput): ActiveObjective {
  const objective = createObjective(input);
  updateLocalState((state) => ({
    ...state,
    objective: {
      ...DEFAULT_OBJECTIVE_STATE,
      ...state.objective,
      active: objective,
      dailyMissions: {},
      workoutCheckIns: {},
    },
  }));
  return objective;
}

export function refreshActiveObjectiveProgress(): ActiveObjective | null {
  const objective = getActiveObjective();
  if (!objective) return null;

  const updated = applyObjectiveProgress(objective, {
    weightHistory: getWeightHistory(),
    consistency: getConsistency(14),
    now: new Date(),
  });

  if (hasObjectiveChanged(objective, updated)) {
    updateLocalState((state) => ({
      ...state,
      objective: {
        ...DEFAULT_OBJECTIVE_STATE,
        ...state.objective,
        active: updated,
      },
    }));
  }

  return updated;
}

export function claimObjectiveReward(): { xpAwarded: number; objective?: ActiveObjective } {
  const objective = getActiveObjective();
  if (!objective || objective.status !== "concluido" || objective.rewardClaimed) {
    return { xpAwarded: 0 };
  }

  const profile = addXP(objective.rewardXp);

  updateLocalState((state) => {
    const history = [...(state.objective?.history ?? []), { ...objective, rewardClaimed: true }];
    const { active, ...restObjective } = state.objective ?? DEFAULT_OBJECTIVE_STATE;

    return {
      ...state,
      progression: {
        ...state.progression,
        accountLevel: profile.level,
        xp: profile.xpAtual,
        xpToNext: profile.xpMeta,
      },
      objective: {
        ...restObjective,
        active: undefined,
        history,
        dailyMissions: {},
        workoutCheckIns: {},
      },
    };
  });

  return { xpAwarded: objective.rewardXp, objective };
}

export function getObjectiveMissionsForToday(): ObjectiveMission[] {
  const objective = getActiveObjective();
  if (!objective) return [];

  const definitions = buildObjectiveMissionDefinitions(objective.type);
  return resolveObjectiveMissions(definitions, {
    ...getQuests(),
    manual: getMissionStatusForDate(getDateKey()),
  });
}

export function getObjectiveMissionDefinitions(): ObjectiveMissionDefinition[] {
  const objective = getActiveObjective();
  if (!objective) return [];
  return buildObjectiveMissionDefinitions(objective.type);
}

export function toggleObjectiveMission(missionId: string, dateKey: string = getDateKey()): void {
  updateLocalState((state) => {
    const objectiveState = state.objective ?? DEFAULT_OBJECTIVE_STATE;
    const daily = objectiveState.dailyMissions[dateKey] ?? {};
    const nextDaily = { ...daily, [missionId]: !daily[missionId] };
    return {
      ...state,
      objective: {
        ...DEFAULT_OBJECTIVE_STATE,
        ...objectiveState,
        dailyMissions: {
          ...objectiveState.dailyMissions,
          [dateKey]: nextDaily,
        },
      },
    };
  });
}

export function getPendingWorkoutCheckIn(): { dateKey: string; workoutId: string } | null {
  const state = getObjectiveCampaignState();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateKey = getDateKey(yesterday);

  if (state.workoutCheckIns[dateKey]) return null;

  const workoutId = getWorkoutOfDay(yesterday);
  if (!workoutId) return null;

  const completed = hasWorkoutCompletedOnDate(workoutId, dateKey);
  if (completed) return null;

  return { dateKey, workoutId };
}

export function resolveWorkoutCheckInAsDone(
  dateKey: string,
  workoutId: string,
  xpGained: number
): void {
  const resolvedAt = new Date().toISOString();
  const checkIn: WorkoutCheckIn = {
    dateKey,
    status: "done",
    workoutId,
    resolvedAt,
  };

  saveWorkoutCompletedAt(workoutId, 0, dateKey);
  addXP(xpGained);
  markWorkoutCompletedAtDate(workoutId, xpGained, 0, 0, new Date(dateKey));

  updateLocalState((state) => ({
    ...state,
    objective: {
      ...DEFAULT_OBJECTIVE_STATE,
      ...state.objective,
      workoutCheckIns: {
        ...(state.objective?.workoutCheckIns ?? {}),
        [dateKey]: checkIn,
      },
    },
  }));
}

export function resolveWorkoutCheckInAsMissed(dateKey: string): { xpLost: number } {
  const resolvedAt = new Date().toISOString();
  const checkIn: WorkoutCheckIn = {
    dateKey,
    status: "missed",
    resolvedAt,
  };

  let xpLost = 0;

  updateLocalState((state) => {
    const nextXp = Math.max(0, state.progression.xp - WORKOUT_MISSED_XP_PENALTY);
    xpLost = state.progression.xp - nextXp;

    return {
      ...state,
      progression: {
        ...state.progression,
        xp: nextXp,
      },
      objective: {
        ...DEFAULT_OBJECTIVE_STATE,
        ...state.objective,
        workoutCheckIns: {
          ...(state.objective?.workoutCheckIns ?? {}),
          [dateKey]: checkIn,
        },
      },
    };
  });

  return { xpLost };
}

function hasObjectiveChanged(previous: ActiveObjective, next: ActiveObjective): boolean {
  return (
    previous.progressPercent !== next.progressPercent ||
    previous.objectiveLevel !== next.objectiveLevel ||
    previous.status !== next.status ||
    previous.completedAt !== next.completedAt ||
    previous.currentMetrics.weightKg !== next.currentMetrics.weightKg ||
    previous.stableDays !== next.stableDays ||
    previous.weeksCompleted !== next.weeksCompleted
  );
}

function getMissionStatusForDate(dateKey: string): Record<string, boolean> {
  const state = getObjectiveCampaignState();
  return state.dailyMissions[dateKey] ?? {};
}

function hasWorkoutCompletedOnDate(workoutId: string, dateKey: string): boolean {
  const completed = getWorkoutsCompleted();
  return completed.some((entry) => {
    if (entry.workoutId !== workoutId) return false;
    const entryDateKey = entry.timestamp.split("T")[0];
    return entryDateKey === dateKey;
  });
}

function getDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

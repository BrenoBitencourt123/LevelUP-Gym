import { getWorkoutSchedule } from "@/lib/storage";

// Schedule is Monday-first (index 0 = Monday). JS Date.getDay(): 0 = Sunday.
function getMondayFirstIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export function getDayIndex(date: Date = new Date()): number {
  return getMondayFirstIndex(date);
}

export function getWeekStart(date: Date = new Date()): string {
  // Week starts on Sunday (YYYY-MM-DD) for weekly completions
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  start.setHours(0, 0, 0, 0);
  return start.toISOString().split("T")[0];
}

export function getWorkoutOfDay(date: Date = new Date()): string | null {
  const schedule = getWorkoutSchedule();
  const idx = getMondayFirstIndex(date);
  const id = schedule[idx];
  if (id) return id;

  const first = schedule.find(Boolean);
  return (first as string) || null;
}

export function getDayName(date: Date = new Date()): string {
  const days = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
  return days[date.getDay()];
}

export function isRestDay(date: Date = new Date()): boolean {
  return getWorkoutOfDay(date) === null;
}

export function getWeeklySchedule(): { dayName: string; workoutId: string | null }[] {
  const days = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"];
  const schedule = getWorkoutSchedule();
  return days.map((dayName, index) => ({
    dayName,
    workoutId: schedule[index] ?? null,
  }));
}

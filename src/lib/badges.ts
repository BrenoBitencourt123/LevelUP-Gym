export type BadgeVariant = "silver" | "gold" | "bronze" | "diamond";

export const getBadgeVariant = (level: number): BadgeVariant => {
  if (level >= 40) return "diamond";
  if (level >= 20) return "gold";
  if (level >= 10) return "silver";
  return "bronze";
};

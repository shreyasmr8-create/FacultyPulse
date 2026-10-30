import { BADGE_DEFINITIONS, BadgeMetricInput } from "@/config/badges";

export interface EvaluatedBadge {
  id: string;
  name: string;
  ruleText: string;
  earned: boolean;
}

export function evaluateBadges(metrics: BadgeMetricInput): {
  badges: EvaluatedBadge[];
  topBadge: EvaluatedBadge | null;
} {
  const evaluated = BADGE_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    ruleText: def.ruleText,
    earned: def.check(metrics),
  }));

  const earnedList = evaluated.filter((b) => b.earned);
  const topBadge =
    earnedList.length > 0 ? earnedList[earnedList.length - 1] : null;

  return { badges: evaluated, topBadge };
}

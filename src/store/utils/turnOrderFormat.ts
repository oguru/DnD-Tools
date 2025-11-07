import type { TurnOrderEntity } from '@models/ui/TurnOrderEntity';

interface GroupSummary {
  id: string;
  count: number;
  originalCount: number;
  currentHp: number;
  maxHp: number;
}

export type TurnOrderDisplayEntity =
  | TurnOrderEntity
  | (TurnOrderEntity & { type: 'group'; count: number; originalCount: number })
  | {
      id: string;
      name: string;
      initiative: number;
      type: 'groupCollection';
      totalCount: number;
      totalOriginalCount: number;
      groups: GroupSummary[];
    };

interface FormatHelpers {
  calculateHealthPercentage: (current: number, max: number) => number;
  getHealthColour: (percentage: number) => string;
}

export interface FormattedTurnOrderDetails {
  hpText: string | null;
  detailText: string | null;
  healthPercentage: number;
  healthColour: string;
  groupBadges?: GroupSummary[];
}

const clampPercentage = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const computeHealth = (
  current: number,
  max: number,
  helpers: FormatHelpers
): { percentage: number; colour: string } => {
  const percentage = clampPercentage(helpers.calculateHealthPercentage(current, max));
  return {
    percentage,
    colour: helpers.getHealthColour(percentage),
  };
};

export const formatTurnOrderEntry = (
  entry: TurnOrderDisplayEntity,
  helpers: FormatHelpers
): FormattedTurnOrderDetails => {
  if (entry.type === 'character' || entry.type === 'boss') {
    const current = entry.currentHp ?? 0;
    const max = entry.maxHp ?? 0;
    const { percentage, colour } = computeHealth(current, max, helpers);

    return {
      hpText: entry.maxHp !== undefined ? `${current}/${max} HP` : null,
      detailText: null,
      healthPercentage: percentage,
      healthColour: colour,
    };
  }

  if (entry.type === 'group') {
    const count = entry.count ?? 0;
    const original = entry.originalCount ?? count;
    const perCreatureMax = entry.maxHp ?? 0;
    const perCreatureCurrent = entry.currentHp ?? 0;
    const totalCurrent = count * perCreatureCurrent;
    const totalMax = original * perCreatureMax;
    const { percentage, colour } = computeHealth(totalCurrent, totalMax, helpers);

    return {
      hpText: `${count}/${original} (${totalCurrent}/${totalMax} HP)`,
      detailText: null,
      healthPercentage: percentage,
      healthColour: colour,
    };
  }

  if (entry.type === 'groupCollection') {
    const totalCurrent = entry.groups.reduce(
      (sum, group) => sum + group.count * group.currentHp,
      0
    );
    const totalMax = entry.groups.reduce(
      (sum, group) => sum + group.originalCount * group.maxHp,
      0
    );
    const { percentage, colour } = computeHealth(totalCurrent, totalMax, helpers);

    return {
      hpText: `${entry.totalCount}/${entry.totalOriginalCount} (${totalCurrent}/${totalMax} HP)`,
      detailText: null,
      healthPercentage: percentage,
      healthColour: colour,
      groupBadges: entry.groups,
    };
  }

  return {
    hpText: null,
    detailText: null,
    healthPercentage: 0,
    healthColour: helpers.getHealthColour(0),
  };
};



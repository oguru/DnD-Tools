import type { EnemyGroup } from '@models/entities/EnemyGroup';

interface CreatureLike {
  id: string;
  currentHp: number;
  maxHp?: number;
  isRemoved?: boolean;
}

export interface GroupWithCreatures extends EnemyGroup {
  creatures?: CreatureLike[];
}

export const calculateGroupTotals = (group: {
  count: number;
  originalCount: number;
  currentHp: number;
  maxHp: number;
}): { totalCurrentHp: number; totalMaxHp: number } => {
  const totalCurrentHp = group.count * group.currentHp;
  const totalMaxHp = group.originalCount * group.maxHp;
  return { totalCurrentHp, totalMaxHp };
};

export const calculateCollectionTotals = (groups: Array<{
  count: number;
  originalCount: number;
  currentHp: number;
  maxHp: number;
}>): { totalCurrentHp: number; totalMaxHp: number } => {
  return groups.reduce(
    (acc, group) => ({
      totalCurrentHp: acc.totalCurrentHp + group.count * group.currentHp,
      totalMaxHp: acc.totalMaxHp + group.originalCount * group.maxHp,
    }),
    { totalCurrentHp: 0, totalMaxHp: 0 }
  );
};

export const buildCreatureHpDetails = (
  group: GroupWithCreatures
): Array<{ id: string; hp: number; maxHp: number }> => {
  if (!Array.isArray(group.creatures) || group.creatures.length === 0) {
    return Array(group.count)
      .fill(null)
      .map((_, index) => ({
        id: `${group.id}-${index}`,
        hp: group.currentHp,
        maxHp: group.maxHp,
      }));
  }

  return group.creatures.map((creature, index) => ({
    id: creature.id ?? `${group.id}-creature-${index}`,
    hp: Math.max(0, creature.currentHp ?? 0),
    maxHp: group.maxHp,
  }));
};



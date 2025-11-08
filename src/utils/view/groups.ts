/**
 * View utilities for group display and creature HP visualization
 */

import type { EnemyGroup } from '@models/entities/EnemyGroup';

/**
 * Build creature HP details for display in group HP grids
 */
export const buildCreatureHpList = (group: EnemyGroup) => {
  if (!group.creatures || group.creatures.length === 0) {
    // Fallback for older group structures
    return Array(group.count || 0)
      .fill(null)
      .map((_, index) => ({
        id: `${group.id}-creature-${index}`,
        currentHp: group.currentHp,
        maxHp: group.maxHp,
        isRemoved: false,
        index,
      }));
  }

  return group.creatures.map((creature, index) => ({
    id: creature.id || `${group.id}-creature-${index}`,
    currentHp: creature.currentHp || 0,
    maxHp: group.maxHp,
    isRemoved: creature.isRemoved || false,
    index,
  }));
};

/**
 * Calculate health percentage for a creature
 */
export const calculateCreatureHealthPercentage = (
  currentHp: number,
  maxHp: number
): number => {
  if (maxHp <= 0) return 0;
  return Math.round((currentHp / maxHp) * 100);
};

/**
 * Format creature count display (e.g., "3/5 alive")
 */
export const formatCreatureCount = (current: number, original: number): string => {
  return `${current}/${original}`;
};

/**
 * Get aggregated HP totals for a group
 */
export const getGroupHpTotals = (group: EnemyGroup) => {
  if (!group.creatures || group.creatures.length === 0) {
    return {
      totalCurrentHp: group.count * group.currentHp,
      totalMaxHp: group.count * group.maxHp,
      averageHp: group.currentHp,
      aliveCount: group.count,
    };
  }

  const aliveCreatures = group.creatures.filter((c) => !c.isRemoved && c.currentHp > 0);
  const totalCurrentHp = aliveCreatures.reduce((sum, c) => sum + c.currentHp, 0);
  const totalMaxHp = group.originalCount * group.maxHp;
  const averageHp = aliveCreatures.length > 0 
    ? Math.round(totalCurrentHp / aliveCreatures.length) 
    : 0;

  return {
    totalCurrentHp,
    totalMaxHp,
    averageHp,
    aliveCount: aliveCreatures.length,
  };
};




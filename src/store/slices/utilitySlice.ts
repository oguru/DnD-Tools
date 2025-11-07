import { rollD20, rollDice } from '@utils/dice';
import type { EnemyGroup } from '@models/entities/EnemyGroup';

interface UtilityState {
  calculateHealthPercentage: (current: number, max: number) => number;
  calculateGroupTotalCurrentHP: (group: EnemyGroup) => number;
  getHealthColour: (percentage: number) => string;
  rollD20: (hasAdvantage?: boolean, hasDisadvantage?: boolean) => number;
  rollDice: (numDice: number, diceType: number) => number;
}

export const createUtilitySlice = (): UtilityState => ({
  calculateHealthPercentage: (current: number, max: number): number => {
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  },

  calculateGroupTotalCurrentHP: (group: EnemyGroup): number => {
    if (!group) return 0;

    if (group.creatures && Array.isArray(group.creatures) && group.creatures.length > 0) {
      return group.creatures.reduce((sum, creature) => sum + (creature.currentHp || 0), 0);
    }

    return group.count * group.currentHp;
  },

  getHealthColour: (percentage: number): string => {
    if (percentage > 50) {
      return '#38a169';
    } else if (percentage > 25) {
      return '#dd6b20';
    }
    return '#e53e3e';
  },

  // Re-export dice functions for backwards compatibility
  rollD20,
  rollDice,
});

export default createUtilitySlice;


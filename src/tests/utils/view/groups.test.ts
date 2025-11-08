import {
  buildCreatureHpList,
  calculateCreatureHealthPercentage,
  formatCreatureCount,
  getGroupHpTotals,
} from '@/utils/view/groups';
import { describe, expect, it } from 'vitest';

import type { EnemyGroup } from '@models/entities/EnemyGroup';

describe('groups view utils', () => {
  describe('buildCreatureHpList', () => {
    it('builds list from creatures array', () => {
      const group: Partial<EnemyGroup> = {
        id: 'group-1',
        maxHp: 20,
        creatures: [
          { id: 'c1', currentHp: 15, tempHp: 0, isRemoved: false },
          { id: 'c2', currentHp: 10, tempHp: 0, isRemoved: false },
          { id: 'c3', currentHp: 0, tempHp: 0, isRemoved: true },
        ],
      };

      const result = buildCreatureHpList(group as EnemyGroup);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'c1',
        currentHp: 15,
        maxHp: 20,
        isRemoved: false,
        index: 0,
      });
      expect(result[2].isRemoved).toBe(true);
    });

    it('falls back for groups without creatures array', () => {
      const group: Partial<EnemyGroup> = {
        id: 'group-1',
        maxHp: 20,
        currentHp: 15,
        count: 3,
        creatures: [],
      };

      const result = buildCreatureHpList(group as EnemyGroup);

      expect(result).toHaveLength(3);
      expect(result[0].currentHp).toBe(15);
      expect(result[0].maxHp).toBe(20);
    });
  });

  describe('calculateCreatureHealthPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculateCreatureHealthPercentage(10, 20)).toBe(50);
      expect(calculateCreatureHealthPercentage(15, 20)).toBe(75);
      expect(calculateCreatureHealthPercentage(20, 20)).toBe(100);
    });

    it('rounds to nearest integer', () => {
      expect(calculateCreatureHealthPercentage(7, 20)).toBe(35);
    });

    it('handles zero max HP', () => {
      expect(calculateCreatureHealthPercentage(10, 0)).toBe(0);
    });

    it('handles zero current HP', () => {
      expect(calculateCreatureHealthPercentage(0, 20)).toBe(0);
    });
  });

  describe('formatCreatureCount', () => {
    it('formats count as fraction', () => {
      expect(formatCreatureCount(3, 5)).toBe('3/5');
      expect(formatCreatureCount(0, 4)).toBe('0/4');
      expect(formatCreatureCount(10, 10)).toBe('10/10');
    });
  });

  describe('getGroupHpTotals', () => {
    it('calculates totals from creatures array', () => {
      const group: Partial<EnemyGroup> = {
        id: 'group-1',
        maxHp: 20,
        originalCount: 5,
        creatures: [
          { id: 'c1', currentHp: 15, tempHp: 0, isRemoved: false },
          { id: 'c2', currentHp: 10, tempHp: 0, isRemoved: false },
          { id: 'c3', currentHp: 8, tempHp: 0, isRemoved: false },
          { id: 'c4', currentHp: 0, tempHp: 0, isRemoved: true },
          { id: 'c5', currentHp: 0, tempHp: 0, isRemoved: false }, // Dead but not removed
        ],
      };

      const result = getGroupHpTotals(group as EnemyGroup);

      expect(result.totalCurrentHp).toBe(33); // 15 + 10 + 8
      expect(result.totalMaxHp).toBe(100); // 5 * 20
      expect(result.averageHp).toBe(11); // Round(33 / 3)
      expect(result.aliveCount).toBe(3); // Only creatures with HP > 0 and not removed
    });

    it('falls back for groups without creatures array', () => {
      const group: Partial<EnemyGroup> = {
        id: 'group-1',
        maxHp: 20,
        currentHp: 15,
        count: 3,
        creatures: [],
      };

      const result = getGroupHpTotals(group as EnemyGroup);

      expect(result.totalCurrentHp).toBe(45); // 3 * 15
      expect(result.totalMaxHp).toBe(60); // 3 * 20
      expect(result.averageHp).toBe(15);
      expect(result.aliveCount).toBe(3);
    });

    it('handles group with all dead creatures', () => {
      const group: Partial<EnemyGroup> = {
        id: 'group-1',
        maxHp: 20,
        originalCount: 2,
        creatures: [
          { id: 'c1', currentHp: 0, tempHp: 0, isRemoved: true },
          { id: 'c2', currentHp: 0, tempHp: 0, isRemoved: true },
        ],
      };

      const result = getGroupHpTotals(group as EnemyGroup);

      expect(result.totalCurrentHp).toBe(0);
      expect(result.averageHp).toBe(0);
      expect(result.aliveCount).toBe(0);
    });
  });
});




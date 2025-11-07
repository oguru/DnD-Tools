import {
  buildCreatureHpDetails,
  calculateCollectionTotals,
  calculateGroupTotals,
} from '@/store/utils/groups';
import { describe, expect, it } from 'vitest';

describe('groups utils', () => {
  it('calculates totals for a group', () => {
    const result = calculateGroupTotals({
      count: 3,
      originalCount: 5,
      currentHp: 7,
      maxHp: 10,
    });

    expect(result.totalCurrentHp).toBe(21);
    expect(result.totalMaxHp).toBe(50);
  });

  it('calculates totals for a collection', () => {
    const result = calculateCollectionTotals([
      { count: 2, originalCount: 3, currentHp: 5, maxHp: 8 },
      { count: 1, originalCount: 2, currentHp: 4, maxHp: 6 },
    ]);

    expect(result.totalCurrentHp).toBe(14);
    expect(result.totalMaxHp).toBe(36);
  });

  it('builds creature HP details with fallbacks', () => {
    const result = buildCreatureHpDetails({
      id: 'group-1',
      name: 'Goblins',
      maxHp: 10,
      currentHp: 8,
      count: 2,
      originalCount: 2,
      ac: 12,
      creatures: [],
    } as any);

    expect(result).toHaveLength(2);
    expect(result[0].hp).toBe(8);
  });
});



import { describe, expect, it } from 'vitest';

import { formatTurnOrderEntry } from '@/store/utils/turnOrderFormat';

const helpers = {
  calculateHealthPercentage: (current: number, max: number) =>
    max === 0 ? 0 : Math.round((current / max) * 100),
  getHealthColour: (percentage: number) => `colour-${percentage}`,
};

describe('turnOrderFormat', () => {
  it('formats character entries', () => {
    const result = formatTurnOrderEntry(
      {
        id: 'char-1',
        name: 'Alice',
        initiative: 15,
        type: 'character',
        currentHp: 12,
        maxHp: 20,
      },
      helpers
    );

    expect(result.hpText).toBe('12/20 HP');
    expect(result.healthPercentage).toBe(60);
    expect(result.healthColour).toBe('colour-60');
  });

  it('formats group entries with totals', () => {
    const result = formatTurnOrderEntry(
      {
        id: 'group-1',
        name: 'Goblins',
        initiative: 10,
        type: 'group',
        count: 3,
        originalCount: 5,
        currentHp: 8,
        maxHp: 10,
      },
      helpers
    );

    expect(result.hpText).toBe('3/5 (24/50 HP)');
    expect(result.healthPercentage).toBe(48);
  });

  it('formats group collections and exposes badges', () => {
    const result = formatTurnOrderEntry(
      {
        id: 'collection-1',
        name: 'Wolves',
        initiative: 9,
        type: 'groupCollection',
        totalCount: 4,
        totalOriginalCount: 6,
        groups: [
          { id: 'wolf-1', count: 2, originalCount: 3, currentHp: 6, maxHp: 8 },
          { id: 'wolf-2', count: 2, originalCount: 3, currentHp: 5, maxHp: 8 },
        ],
      },
      helpers
    );

    expect(result.hpText).toBe('4/6 (22/48 HP)');
    expect(result.groupBadges).toHaveLength(2);
  });
});



import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Boss } from '@models/entities/Boss';
import type { Character } from '@models/entities/Character';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import { createTurnOrderSlice } from '@/store/slices/turnOrderSlice';

vi.mock('@/store/utils/storage', () => ({
  loadFromStorage: vi.fn(() => []),
  saveToStorage: vi.fn(),
}));

vi.mock('@utils/dice', () => ({
  rollD20: vi.fn(() => 10),
}));

describe('turnOrderSlice updateTurnOrder', () => {
  let state: any;
  let set: any;
  let get: any;
  let slice: any;

  beforeEach(() => {
    state = {
      characters: [] as Character[],
      bosses: [] as Boss[],
      enemyGroups: [] as EnemyGroup[],
      turnOrder: [],
      currentTurnIndex: 0,
    };

    set = vi.fn((fn: any) => {
      const updates = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...updates };
      return updates;
    });

    get = vi.fn(() => state);

    slice = createTurnOrderSlice(set, get);
    state = { ...state, ...slice };

    state.characters = [
      {
        id: 'char-1',
        name: 'Hero',
        currentHp: 24,
        maxHp: 30,
        tempHp: 0,
        ac: 16,
        initiative: 15,
        inAoe: false,
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
      } as Character,
    ];

    state.enemyGroups = [
      {
        id: 'group-1',
        name: 'Goblins',
        count: 2,
        originalCount: 3,
        maxHp: 12,
        currentHp: 10,
        tempHp: 0,
        ac: 13,
        initiative: 10,
        inAoe: false,
        creatures: [
          { id: 'g1', currentHp: 8, tempHp: 0, isRemoved: false },
          { id: 'g2', currentHp: 5, tempHp: 0, isRemoved: false },
          { id: 'g3', currentHp: 0, tempHp: 0, isRemoved: true },
        ],
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
        savingThrows: undefined,
      } as EnemyGroup,
    ];
  });

  it('populates turn order entries with HP information', () => {
    slice.updateTurnOrder();

    expect(state.turnOrder).toHaveLength(2);

    const characterEntry = state.turnOrder.find((entry: any) => entry.type === 'character');
    expect(characterEntry?.currentHp).toBe(24);
    expect(characterEntry?.maxHp).toBe(30);

    const groupCollectionEntry = state.turnOrder.find((entry: any) => entry.type === 'groupCollection');
    expect(groupCollectionEntry).toBeDefined();
    expect(groupCollectionEntry?.totalCount).toBe(2);
    expect(groupCollectionEntry?.totalOriginalCount).toBe(3);
    const totalCurrentHp = groupCollectionEntry?.groups.reduce((sum: number, group: any) => sum + group.currentHp * group.count, 0) ?? 0;
    expect(totalCurrentHp).toBeGreaterThan(0);
  });
});


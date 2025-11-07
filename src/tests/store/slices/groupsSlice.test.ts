import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Creature } from '@models/entities/Creature';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import { createGroupsSlice } from '@/store/slices/groupsSlice';

vi.mock('@/store/utils/storage', () => ({
  loadFromStorage: vi.fn(() => []),
  saveToStorage: vi.fn(),
}));

vi.mock('@/store/utils/turnOrder', () => ({
  scheduleTurnOrderUpdate: vi.fn((callback?: () => void) => {
    if (callback) {
      callback();
    }
  }),
}));

describe('groupsSlice damage handling', () => {
  let state: any;
  let set: any;
  let get: any;
  let slice: any;

  beforeEach(() => {
    state = {
      enemyGroups: [],
      attackResults: [],
      characters: [],
      bosses: [],
    };

    set = vi.fn((fn: any) => {
      const updates = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...updates };
      return updates;
    });

    get = vi.fn(() => state);

    slice = createGroupsSlice(set, get);
    state = { ...state, ...slice };
  });

  it('updates per-creature and averaged HP when a single target is defeated', () => {
    const creatures: Creature[] = [
      { id: 'c1', currentHp: 12, tempHp: 3, isRemoved: false },
      { id: 'c2', currentHp: 12, tempHp: 0, isRemoved: false },
    ];

    state.enemyGroups = [
      {
        id: 'group-1',
        name: 'Goblins',
        count: 2,
        originalCount: 2,
        maxHp: 12,
        currentHp: 12,
        tempHp: 0,
        ac: 13,
        initiative: 10,
        inAoe: false,
        creatures,
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
        savingThrows: undefined,
      } as EnemyGroup,
    ];

    slice.applyDamageToGroup('group-1', 15, 'hit');

    const updatedGroup = state.enemyGroups[0];
    expect(updatedGroup.creatures[0].currentHp).toBe(0);
    expect(updatedGroup.creatures[0].isRemoved).toBe(true);
    expect(updatedGroup.creatures[1].currentHp).toBe(12);
    expect(updatedGroup.count).toBe(1);
    expect(updatedGroup.currentHp).toBe(12);
    expect(state.attackResults).toHaveLength(1);
  });

  it('applies AoE damage to a subset of creatures and recomputes averages', () => {
    const creatures: Creature[] = [
      { id: 'c1', currentHp: 10, tempHp: 0, isRemoved: false },
      { id: 'c2', currentHp: 10, tempHp: 0, isRemoved: false },
      { id: 'c3', currentHp: 10, tempHp: 0, isRemoved: false },
    ];

    state.enemyGroups = [
      {
        id: 'group-2',
        name: 'Bandits',
        count: 3,
        originalCount: 3,
        maxHp: 10,
        currentHp: 10,
        tempHp: 0,
        ac: 12,
        initiative: 8,
        inAoe: false,
        creatures,
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
        savingThrows: undefined,
      } as EnemyGroup,
    ];

    slice.applyDamageToAllInGroup('group-2', 5, 50);

    const updatedGroup = state.enemyGroups[0];
    const currentHps = updatedGroup.creatures.map((c) => c.currentHp).sort((a, b) => a - b);
    expect(currentHps).toEqual([5, 5, 10]);
    expect(updatedGroup.count).toBe(3);
    expect(updatedGroup.currentHp).toBe(7); // rounded average of 20 / 3
  });

  it('returns an AOE summary string and clears flags', () => {
    const creatures: Creature[] = [
      { id: 'c1', currentHp: 10, tempHp: 0, isRemoved: false },
    ];

    state.enemyGroups = [
      {
        id: 'group-3',
        name: 'Cultists',
        count: 1,
        originalCount: 1,
        maxHp: 10,
        currentHp: 10,
        tempHp: 0,
        ac: 13,
        initiative: 5,
        inAoe: true,
        creatures,
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
        savingThrows: undefined,
      } as EnemyGroup,
    ];

    const summary = slice.applyDamageToAllGroupsInAoeInternal({ damage: 6 });

    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(state.enemyGroups[0].inAoe).toBe(false);
  });
});


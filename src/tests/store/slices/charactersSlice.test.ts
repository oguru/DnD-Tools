import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Character } from '@models/entities/Character';
import { createCharactersSlice } from '@/store/slices/charactersSlice';

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

vi.mock('@utils/dice', () => ({
  rollD20: vi.fn(() => 10),
}));

describe('charactersSlice applyDamageToCharacter', () => {
  let state: any;
  let set: any;
  let get: any;
  let slice: any;

  beforeEach(() => {
    state = {
      characters: [],
      bosses: [],
      enemyGroups: [],
      attackResults: [],
    };

    set = vi.fn((fn: any) => {
      const updates = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...updates };
      return updates;
    });

    get = vi.fn(() => state);

    slice = createCharactersSlice(set, get);
    state = { ...state, ...slice, updateTurnOrder: vi.fn() };

    state.characters = [
      {
        id: 'char-1',
        name: 'Test Character',
        currentHp: 20,
        maxHp: 30,
        tempHp: 5,
        ac: 15,
        initiative: 10,
        inAoe: false,
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
      } as Character,
    ];
  });

  it('reduces current HP after applying damage, respecting temporary HP first', () => {
    slice.applyDamageToCharacter('char-1', 7, 'hit', '', true);

    const updatedCharacter = state.characters[0];
    expect(updatedCharacter.tempHp).toBe(0);
    expect(updatedCharacter.currentHp).toBe(18);
  });
});


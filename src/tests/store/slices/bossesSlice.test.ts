import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Boss } from '@models/entities/Boss';
import { createBossesSlice } from '@/store/slices/bossesSlice';

vi.mock('@/store/utils/storage', () => ({
  loadFromStorage: vi.fn(() => []),
  saveToStorage: vi.fn(),
  removeFromStorage: vi.fn(),
}));

vi.mock('@/store/utils/turnOrder', () => ({
  scheduleTurnOrderUpdate: vi.fn((callback?: () => void) => {
    if (callback) {
      callback();
    }
  }),
}));

describe('bossesSlice essentials', () => {
  let state: any;
  let set: any;
  let get: any;
  let slice: any;

  beforeEach(() => {
    state = {
      bosses: [],
      attackResults: [],
    };

    set = vi.fn((fn: any) => {
      const updates = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...updates };
      return updates;
    });

    get = vi.fn(() => state);

    slice = createBossesSlice(set, get);
    state = { ...state, ...slice };

    state.bosses = [
      {
        id: 'boss-1',
        name: 'Ancient Wyrm',
        currentHp: 40,
        maxHp: 50,
        tempHp: 5,
        ac: 19,
        initiative: 12,
        inAoe: false,
        attacks: [
          { id: 'bite', name: 'Bite', usesCharges: true, maxCharges: 3, chargesRemaining: 3 },
        ],
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
        savingThrows: undefined,
      } as Boss,
    ];
  });

  it('applies temporary hit points to a boss', () => {
    slice.setTemporaryHitPointsBoss('boss-1', 7, false);

    const updated = state.bosses[0];
    expect(updated.tempHp).toBe(12);
  });

  it('spends temporary hit points before current HP when damaged', () => {
    slice.applyDamageToBoss('boss-1', 8, 'hit');

    const updated = state.bosses[0];
    expect(updated.currentHp).toBe(37);
    expect(updated.tempHp).toBe(0);
    expect(state.attackResults).toHaveLength(1);
  });

  it('clamps boss attack charges within bounds', () => {
    slice.setBossAttackCharges('boss-1', 'bite', -3);
    expect(state.bosses[0].attacks[0].chargesRemaining).toBe(0);

    slice.setBossAttackCharges('boss-1', 'bite', 10);
    expect(state.bosses[0].attacks[0].chargesRemaining).toBe(3);
  });
});


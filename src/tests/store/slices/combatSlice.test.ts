import * as storage from '@/store/utils/storage';
import * as turnOrder from '@/store/utils/turnOrder';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AttackResult } from '@models/combat/AttackResult';
import type { Character } from '@models/entities/Character';
import { createCombatSlice } from '@/store/slices/combatSlice';

vi.mock('@/store/utils/storage');
vi.mock('@/store/utils/turnOrder');

describe('combatSlice', () => {
  let state: any;
  let set: any;
  let get: any;
  let slice: any;

  beforeEach(() => {
    state = {
      attackResults: [],
      characters: [],
      bosses: [],
      enemyGroups: [],
    };

    set = vi.fn((fn: any) => {
      const updates = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...updates };
    });

    get = vi.fn(() => state);

    slice = createCombatSlice(set, get);
    state = { ...state, ...slice, updateTurnOrder: vi.fn() };

    vi.clearAllMocks();
  });

  describe('clearAttackResults', () => {
    it('should clear all attack results', () => {
      state.attackResults = [
        { id: '1', message: 'Test', timestamp: 1000 },
        { id: '2', message: 'Test 2', timestamp: 2000 },
      ];

      slice.clearAttackResults();

      expect(set).toHaveBeenCalledWith(expect.any(Function));
      const result = set.mock.calls[0][0](state);
      expect(result.attackResults).toEqual([]);
    });

    it('should work when results already empty', () => {
      state.attackResults = [];

      slice.clearAttackResults();

      const result = set.mock.calls[0][0](state);
      expect(result.attackResults).toEqual([]);
    });
  });

  describe('removeAttackResult', () => {
    it('should remove specific result by id', () => {
      state.attackResults = [
        { id: '1', message: 'Test', timestamp: 1000 },
        { id: '2', message: 'Test 2', timestamp: 2000 },
        { id: '3', message: 'Test 3', timestamp: 3000 },
      ];

      slice.removeAttackResult('2');

      expect(set).toHaveBeenCalledWith(expect.any(Function));
      const result = set.mock.calls[0][0](state);
      expect(result.attackResults).toHaveLength(2);
      expect(result.attackResults.find((r: any) => r.id === '2')).toBeUndefined();
    });

    it('should handle removing nonexistent id', () => {
      state.attackResults = [{ id: '1', message: 'Test', timestamp: 1000 }];

      slice.removeAttackResult('999');

      const result = set.mock.calls[0][0](state);
      expect(result.attackResults).toHaveLength(1);
    });
  });

  describe('applyHealingToAllCharacters', () => {
    it('should heal all characters up to their max HP', () => {
      state.characters = [
        { id: 'char-1', name: 'Hero 1', currentHp: 50, maxHp: 100, tempHp: 0, ac: 15, initiative: 10, inAoe: false, defenses: { resistances: [], vulnerabilities: [], immunities: [] } },
        { id: 'char-2', name: 'Hero 2', currentHp: 80, maxHp: 100, tempHp: 0, ac: 16, initiative: 12, inAoe: false, defenses: { resistances: [], vulnerabilities: [], immunities: [] } },
      ];

      slice.applyHealingToAllCharacters(30);

      expect(storage.saveToStorage).toHaveBeenCalledWith(
        'dnd-characters',
        expect.arrayContaining([
          expect.objectContaining({ id: 'char-1', currentHp: 80 }),
          expect.objectContaining({ id: 'char-2', currentHp: 100 }),
        ])
      );

      expect(turnOrder.scheduleTurnOrderUpdate).toHaveBeenCalled();
    });

    it('should not exceed max HP', () => {
      state.characters = [
        { id: 'char-1', name: 'Hero', currentHp: 95, maxHp: 100, tempHp: 0, ac: 15, initiative: 10, inAoe: false, defenses: { resistances: [], vulnerabilities: [], immunities: [] } },
      ];

      slice.applyHealingToAllCharacters(20);

      const savedChars = (storage.saveToStorage as any).mock.calls.find(
        (call: any) => call[0] === 'dnd-characters'
      )?.[1];
      expect(savedChars[0].currentHp).toBe(100);
    });

    it('should skip characters at max HP', () => {
      state.characters = [
        { id: 'char-1', name: 'Full Health', currentHp: 100, maxHp: 100, tempHp: 0, ac: 15, initiative: 10, inAoe: false, defenses: { resistances: [], vulnerabilities: [], immunities: [] } },
      ];

      slice.applyHealingToAllCharacters(20);

      expect(set).toHaveBeenCalled();
      const result = set.mock.calls[0][0](state);
      expect(result.attackResults).toHaveLength(0);
    });

    it('should create healing results for healed characters', () => {
      state.characters = [
        { id: 'char-1', name: 'Wounded', currentHp: 50, maxHp: 100, tempHp: 0, ac: 15, initiative: 10, inAoe: false, defenses: { resistances: [], vulnerabilities: [], immunities: [] } },
      ];

      slice.applyHealingToAllCharacters(30);

      expect(set).toHaveBeenCalled();
      expect(state.attackResults).toHaveLength(1);
      expect(state.attackResults[0]).toMatchObject({
        characterId: 'char-1',
        healing: 30,
        isHealing: true,
      });
    });

    it('should handle zero or negative healing as no-op', () => {
      state.characters = [
        { id: 'char-1', name: 'Hero', currentHp: 50, maxHp: 100, tempHp: 0, ac: 15, initiative: 10, inAoe: false, defenses: { resistances: [], vulnerabilities: [], immunities: [] } },
      ];

      slice.applyHealingToAllCharacters(0);
      expect(set).not.toHaveBeenCalled();

      slice.applyHealingToAllCharacters(-10);
      expect(set).not.toHaveBeenCalled();
    });

    it('should use transaction ID when provided', () => {
      state.characters = [
        { id: 'char-1', name: 'Hero', currentHp: 50, maxHp: 100, tempHp: 0, ac: 15, initiative: 10, inAoe: false, defenses: { resistances: [], vulnerabilities: [], immunities: [] } },
      ];

      slice.applyHealingToAllCharacters(20, 'txn-123');

      const result = set.mock.calls[0][0](state);
      expect(result.attackResults[0].id).toContain('txn-123');
    });
  });

  describe('applyAoeDamageToAll', () => {
    beforeEach(() => {
      state.applyDamageToAllCharactersInAoeInternal = vi.fn(() => 'Characters took damage');
      state.applyDamageToAllGroupsInAoeInternal = vi.fn(() => 'Groups took damage');
      state.applyDamageToAllBossesInAoeInternal = vi.fn(() => 'Bosses took damage');

      state.characters = [
        {
          id: 'char-1',
          name: 'Hero',
          currentHp: 40,
          maxHp: 50,
          tempHp: 0,
          ac: 15,
          initiative: 12,
          inAoe: true,
          defenses: { resistances: [], vulnerabilities: [], immunities: [] },
        },
      ];

      state.bosses = [
        {
          id: 'boss-1',
          name: 'Dragon',
          currentHp: 200,
          maxHp: 220,
          tempHp: 0,
          ac: 18,
          initiative: 14,
          inAoe: true,
          defenses: { resistances: [], vulnerabilities: [], immunities: [] },
          attacks: [],
        },
      ];

      state.enemyGroups = [
        {
          id: 'group-1',
          name: 'Goblins',
          count: 3,
          originalCount: 3,
          maxHp: 12,
          currentHp: 10,
          tempHp: 0,
          ac: 13,
          initiative: 8,
          inAoe: true,
          creatures: [
            { id: 'g1', currentHp: 10, tempHp: 0, isRemoved: false },
            { id: 'g2', currentHp: 9, tempHp: 0, isRemoved: false },
            { id: 'g3', currentHp: 0, tempHp: 0, isRemoved: true },
          ],
          defenses: { resistances: [], vulnerabilities: [], immunities: [] },
          savingThrows: undefined,
        },
      ];

      state.attackResults = [];

      (storage.saveToStorage as any).mockClear();
      (turnOrder.scheduleTurnOrderUpdate as any).mockClear();
    });

    it('applies AoE damage across slices and records a result', () => {
      slice.applyAoeDamageToAll({ damage: 12, saveType: 'dex', saveDC: 15, halfOnSave: true });

      expect(state.applyDamageToAllCharactersInAoeInternal).toHaveBeenCalled();
      expect(state.applyDamageToAllGroupsInAoeInternal).toHaveBeenCalled();
      expect(state.applyDamageToAllBossesInAoeInternal).toHaveBeenCalled();

      expect(state.attackResults).toHaveLength(1);
      expect(state.attackResults[0]).toMatchObject({ isAoE: true, damage: 12 });

      expect(state.characters[0].inAoe).toBe(false);
      expect(state.bosses[0].inAoe).toBe(false);
      expect(state.enemyGroups[0].inAoe).toBe(false);

      expect(storage.saveToStorage).toHaveBeenCalledTimes(3);
      expect(turnOrder.scheduleTurnOrderUpdate).toHaveBeenCalled();
    });

    it('does nothing when damage is invalid', () => {
      slice.applyAoeDamageToAll({ damage: 0 });

      expect(state.attackResults).toHaveLength(0);
      expect(state.applyDamageToAllCharactersInAoeInternal).not.toHaveBeenCalled();
      expect(storage.saveToStorage).not.toHaveBeenCalled();
    });
  });
});


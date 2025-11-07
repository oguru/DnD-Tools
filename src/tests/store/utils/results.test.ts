import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDamageResult,
  createHealingResult,
  createAoeResult,
} from '@/store/utils/results';
import type { AttackResult } from '@models/combat/AttackResult';

describe('results utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createDamageResult', () => {
    it('should create hit result for character', () => {
      vi.setSystemTime(1000);

      const result = createDamageResult(20, 'Hero', 'char-1', 'character', 'hit');

      expect(result).toEqual({
        id: '1000',
        characterId: 'char-1',
        damage: 20,
        hitStatus: 'hit',
        message: 'Hit! 20 damage to Hero',
        timestamp: 1000,
      });
    });

    it('should create critical hit result', () => {
      vi.setSystemTime(2000);

      const result = createDamageResult(40, 'Villain', 'boss-1', 'boss', 'critical');

      expect(result).toEqual({
        id: '2000',
        bossId: 'boss-1',
        damage: 40,
        hitStatus: 'critical',
        message: 'Critical hit! 40 damage to Villain',
        timestamp: 2000,
      });
    });

    it('should create miss result with zero damage', () => {
      vi.setSystemTime(3000);

      const result = createDamageResult(15, 'Target', 'group-1', 'group', 'miss');

      expect(result).toEqual({
        id: '3000',
        groupId: 'group-1',
        damage: 0,
        hitStatus: 'miss',
        message: 'Miss!',
        timestamp: 3000,
      });
    });

    it('should include modifier text', () => {
      vi.setSystemTime(4000);

      const result = createDamageResult(
        25,
        'Enemy',
        'char-2',
        'character',
        'hit',
        ' (fire)'
      );

      expect(result.message).toBe('Hit! 25 damage to Enemy (fire)');
    });
  });

  describe('createHealingResult', () => {
    it('should create healing result for character', () => {
      vi.setSystemTime(5000);

      const result = createHealingResult(30, 'Healer', 'char-3', 'character');

      expect(result).toEqual({
        id: '5000',
        characterId: 'char-3',
        healing: 30,
        message: 'Healing! 30 healing to Healer',
        isHealing: true,
        timestamp: 5000,
      });
    });

    it('should create healing result for boss', () => {
      vi.setSystemTime(6000);

      const result = createHealingResult(50, 'BigBoss', 'boss-2', 'boss');

      expect(result).toEqual({
        id: '6000',
        bossId: 'boss-2',
        healing: 50,
        message: 'Healing! 50 healing to BigBoss',
        isHealing: true,
        timestamp: 6000,
      });
    });

    it('should create healing result for group', () => {
      vi.setSystemTime(7000);

      const result = createHealingResult(20, 'Minions', 'group-2', 'group');

      expect(result).toEqual({
        id: '7000',
        groupId: 'group-2',
        healing: 20,
        message: 'Healing! 20 healing to Minions',
        isHealing: true,
        timestamp: 7000,
      });
    });

    it('should use transaction ID if provided', () => {
      vi.setSystemTime(8000);

      const result = createHealingResult(
        15,
        'Patient',
        'char-4',
        'character',
        'txn-123'
      );

      expect(result.id).toBe('txn-123-char-4');
    });
  });

  describe('createAoeResult', () => {
    it('should create AoE result', () => {
      vi.setSystemTime(9000);

      const result = createAoeResult(
        35,
        'Fireball hits 3 targets for 35 damage each'
      );

      expect(result).toEqual({
        id: '9000',
        damage: 35,
        message: 'Fireball hits 3 targets for 35 damage each',
        isAoE: true,
        timestamp: 9000,
      });
    });
  });
});


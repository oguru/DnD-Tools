import { describe, it, expect, vi } from 'vitest';
import {
  applyDamageWithTempHp,
  applyHealing,
  setTempHp,
  rollSave,
  checkSave,
  calculateSaveDamage,
} from '@/store/utils/combat';

describe('combat utilities', () => {
  describe('applyDamageWithTempHp', () => {
    it('should apply damage to temp HP first', () => {
      const result = applyDamageWithTempHp(10, 50, 20);

      expect(result).toEqual({
        remainingDamage: 0,
        newCurrentHp: 50,
        newTempHp: 10,
      });
    });

    it('should overflow damage to current HP when temp HP depleted', () => {
      const result = applyDamageWithTempHp(30, 50, 20);

      expect(result).toEqual({
        remainingDamage: 10,
        newCurrentHp: 40,
        newTempHp: 0,
      });
    });

    it('should handle zero temp HP', () => {
      const result = applyDamageWithTempHp(20, 50, 0);

      expect(result).toEqual({
        remainingDamage: 20,
        newCurrentHp: 30,
        newTempHp: 0,
      });
    });

    it('should reduce current HP to 0 minimum', () => {
      const result = applyDamageWithTempHp(100, 50, 0);

      expect(result).toEqual({
        remainingDamage: 100,
        newCurrentHp: 0,
        newTempHp: 0,
      });
    });

    it('should handle zero damage', () => {
      const result = applyDamageWithTempHp(0, 50, 20);

      expect(result).toEqual({
        remainingDamage: 0,
        newCurrentHp: 50,
        newTempHp: 20,
      });
    });

    it('should handle negative damage as zero', () => {
      const result = applyDamageWithTempHp(-10, 50, 20);

      expect(result).toEqual({
        remainingDamage: 0,
        newCurrentHp: 50,
        newTempHp: 20,
      });
    });
  });

  describe('applyHealing', () => {
    it('should heal current HP up to max', () => {
      expect(applyHealing(20, 50, 100)).toBe(70);
    });

    it('should not exceed max HP', () => {
      expect(applyHealing(100, 50, 100)).toBe(100);
      expect(applyHealing(200, 50, 100)).toBe(100);
    });

    it('should handle zero healing', () => {
      expect(applyHealing(0, 50, 100)).toBe(50);
    });

    it('should handle negative healing as zero', () => {
      expect(applyHealing(-10, 50, 100)).toBe(50);
    });

    it('should handle healing at max HP', () => {
      expect(applyHealing(10, 100, 100)).toBe(100);
    });
  });

  describe('setTempHp', () => {
    it('should replace temp HP when replace is true', () => {
      expect(setTempHp(30, 20, true)).toBe(30);
    });

    it('should add to existing temp HP when replace is false', () => {
      expect(setTempHp(30, 20, false)).toBe(50);
    });

    it('should handle zero amount', () => {
      expect(setTempHp(0, 20, true)).toBe(0);
      expect(setTempHp(0, 20, false)).toBe(20);
    });

    it('should handle negative amount by returning existing', () => {
      expect(setTempHp(-10, 20, true)).toBe(20);
      expect(setTempHp(-10, 20, false)).toBe(20);
    });
  });

  describe('rollSave', () => {
    it('should roll saving throw with modifier', () => {
      const mockRoll = vi.fn(() => 15);
      const result = rollSave(3, mockRoll);

      expect(result).toEqual({
        succeeded: false,
        roll: 15,
        modifier: 3,
        total: 18,
      });
      expect(mockRoll).toHaveBeenCalledOnce();
    });

    it('should handle negative modifier', () => {
      const mockRoll = vi.fn(() => 10);
      const result = rollSave(-2, mockRoll);

      expect(result).toEqual({
        succeeded: false,
        roll: 10,
        modifier: -2,
        total: 8,
      });
    });

    it('should handle zero modifier', () => {
      const mockRoll = vi.fn(() => 12);
      const result = rollSave(0, mockRoll);

      expect(result).toEqual({
        succeeded: false,
        roll: 12,
        modifier: 0,
        total: 12,
      });
    });
  });

  describe('checkSave', () => {
    it('should return true when total meets or exceeds DC', () => {
      expect(checkSave({ succeeded: false, roll: 15, modifier: 3, total: 18 }, 15)).toBe(
        true
      );
      expect(checkSave({ succeeded: false, roll: 15, modifier: 0, total: 15 }, 15)).toBe(
        true
      );
    });

    it('should return false when total is below DC', () => {
      expect(checkSave({ succeeded: false, roll: 10, modifier: 2, total: 12 }, 15)).toBe(
        false
      );
    });
  });

  describe('calculateSaveDamage', () => {
    it('should return full damage on failed save', () => {
      expect(calculateSaveDamage(20, false, true)).toBe(20);
      expect(calculateSaveDamage(20, false, false)).toBe(20);
    });

    it('should return half damage on save with halfOnSave', () => {
      expect(calculateSaveDamage(20, true, true)).toBe(10);
      expect(calculateSaveDamage(21, true, true)).toBe(10);
    });

    it('should return zero damage on save without halfOnSave', () => {
      expect(calculateSaveDamage(20, true, false)).toBe(0);
    });

    it('should handle zero damage', () => {
      expect(calculateSaveDamage(0, true, true)).toBe(0);
      expect(calculateSaveDamage(0, false, true)).toBe(0);
    });
  });
});


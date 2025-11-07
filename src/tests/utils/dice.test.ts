import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  rollDie,
  rollDice,
  rollD20,
  rollDamage,
  rollSavingThrow,
} from '@/utils/dice';

describe('dice utilities', () => {
  describe('rollDie', () => {
    it('should return value between 1 and sides', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDie(6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });

    it('should return 1 for invalid sides', () => {
      expect(rollDie(0)).toBe(1);
      expect(rollDie(-5)).toBe(1);
    });

    it('should work with different die types', () => {
      const d20Result = rollDie(20);
      expect(d20Result).toBeGreaterThanOrEqual(1);
      expect(d20Result).toBeLessThanOrEqual(20);

      const d4Result = rollDie(4);
      expect(d4Result).toBeGreaterThanOrEqual(1);
      expect(d4Result).toBeLessThanOrEqual(4);
    });
  });

  describe('rollDice', () => {
    it('should sum multiple dice rolls', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDice(3, 6);
        expect(result).toBeGreaterThanOrEqual(3);
        expect(result).toBeLessThanOrEqual(18);
      }
    });

    it('should handle single die', () => {
      const result = rollDice(1, 6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should handle zero dice', () => {
      const result = rollDice(0, 6);
      expect(result).toBe(0);
    });
  });

  describe('rollD20', () => {
    it('should roll value between 1 and 20', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollD20();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      }
    });

    it('should roll with advantage (max of two rolls)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.9);

      const result = rollD20(true, false);

      expect(result).toBeGreaterThan(10);
    });

    it('should roll with disadvantage (min of two rolls)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9);

      const result = rollD20(false, true);

      expect(result).toBeLessThan(10);
    });

    it('should ignore advantage if both advantage and disadvantage', () => {
      const result = rollD20(true, true);

      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('rollDamage', () => {
    it('should add modifier to dice roll', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDamage(2, 6, 3);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThanOrEqual(15);
      }
    });

    it('should handle zero modifier', () => {
      const result = rollDamage(1, 6, 0);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should handle negative modifier', () => {
      const result = rollDamage(1, 6, -2);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(4);
    });
  });

  describe('rollSavingThrow', () => {
    it('should return object with roll, modifier, and total', () => {
      const result = rollSavingThrow(5);

      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('modifier', 5);
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(result.roll + 5);
    });

    it('should handle negative modifier', () => {
      const result = rollSavingThrow(-3);

      expect(result.modifier).toBe(-3);
      expect(result.total).toBe(result.roll - 3);
    });

    it('should respect advantage', () => {
      const result = rollSavingThrow(2, true, false);

      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(20);
      expect(result.total).toBe(result.roll + 2);
    });
  });
});


import { describe, it, expect } from 'vitest';
import {
  clamp,
  clampHp,
  clampCharges,
  ensurePositive,
} from '@/store/utils/numbers';

describe('numbers utilities', () => {
  describe('clamp', () => {
    it('should clamp value between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases at boundaries', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should throw error if min > max', () => {
      expect(() => clamp(5, 10, 0)).toThrow('clamp: min (10) must be <= max (0)');
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('should handle fractional numbers', () => {
      expect(clamp(5.7, 0, 10)).toBe(5.7);
      expect(clamp(-0.5, 0, 10)).toBe(0);
      expect(clamp(10.5, 0, 10)).toBe(10);
    });
  });

  describe('clampHp', () => {
    it('should clamp HP values correctly', () => {
      expect(clampHp(50, 0, 100)).toBe(50);
      expect(clampHp(-10, 0, 100)).toBe(0);
      expect(clampHp(150, 0, 100)).toBe(100);
    });

    it('should handle zero HP', () => {
      expect(clampHp(0, 0, 100)).toBe(0);
    });

    it('should handle max HP', () => {
      expect(clampHp(100, 0, 100)).toBe(100);
    });
  });

  describe('clampCharges', () => {
    it('should return maxCharges when value is undefined', () => {
      expect(clampCharges(undefined, 5)).toBe(5);
    });

    it('should clamp charges between 0 and maxCharges', () => {
      expect(clampCharges(3, 5)).toBe(3);
      expect(clampCharges(-1, 5)).toBe(0);
      expect(clampCharges(10, 5)).toBe(5);
    });

    it('should handle zero charges', () => {
      expect(clampCharges(0, 5)).toBe(0);
    });

    it('should handle maxCharges boundary', () => {
      expect(clampCharges(5, 5)).toBe(5);
    });
  });

  describe('ensurePositive', () => {
    it('should return value if positive', () => {
      expect(ensurePositive(5)).toBe(5);
      expect(ensurePositive(0)).toBe(0);
    });

    it('should return 0 if negative', () => {
      expect(ensurePositive(-5)).toBe(0);
      expect(ensurePositive(-0.01)).toBe(0);
    });

    it('should handle large numbers', () => {
      expect(ensurePositive(1000000)).toBe(1000000);
      expect(ensurePositive(-1000000)).toBe(0);
    });
  });
});


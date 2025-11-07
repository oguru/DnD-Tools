import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  generateIdWithOffset,
  generateUniqueId,
} from '@/store/utils/ids';

describe('ids utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateId', () => {
    it('should generate ID based on timestamp', () => {
      const mockTime = 1234567890;
      vi.setSystemTime(mockTime);

      expect(generateId()).toBe(mockTime.toString());
    });

    it('should generate different IDs at different times', () => {
      vi.setSystemTime(1000);
      const id1 = generateId();

      vi.setSystemTime(2000);
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toBe('1000');
      expect(id2).toBe('2000');
    });
  });

  describe('generateIdWithOffset', () => {
    it('should generate ID with offset', () => {
      const mockTime = 1000;
      vi.setSystemTime(mockTime);

      expect(generateIdWithOffset(0)).toBe('1000');
      expect(generateIdWithOffset(5)).toBe('1005');
      expect(generateIdWithOffset(100)).toBe('1100');
    });

    it('should handle negative offset', () => {
      const mockTime = 1000;
      vi.setSystemTime(mockTime);

      expect(generateIdWithOffset(-10)).toBe('990');
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs with timestamp and random component', () => {
      const mockTime = 1234567890;
      vi.setSystemTime(mockTime);

      const id = generateUniqueId();

      expect(id).toContain(mockTime.toString());
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate different IDs even at the same timestamp', () => {
      vi.setSystemTime(1000);

      const id1 = generateUniqueId();
      const id2 = generateUniqueId();

      expect(id1).not.toBe(id2);
      expect(id1).toContain('1000-');
      expect(id2).toContain('1000-');
    });
  });
});


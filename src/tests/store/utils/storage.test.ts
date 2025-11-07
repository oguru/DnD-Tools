import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
} from '@/store/utils/storage';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadFromStorage', () => {
    it('should load and parse JSON from localStorage', () => {
      const data = { name: 'Test', value: 42 };
      localStorage.setItem('test-key', JSON.stringify(data));

      const result = loadFromStorage('test-key', null);

      expect(result).toEqual(data);
    });

    it('should return default value if key does not exist', () => {
      const defaultValue = { default: true };

      const result = loadFromStorage('nonexistent-key', defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it('should return default value on parse error', () => {
      localStorage.setItem('test-key', 'invalid json');

      const result = loadFromStorage('test-key', { default: true });

      expect(result).toEqual({ default: true });
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];
      localStorage.setItem('test-key', JSON.stringify(data));

      const result = loadFromStorage('test-key', []);

      expect(result).toEqual(data);
    });

    it('should handle nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      };
      localStorage.setItem('test-key', JSON.stringify(data));

      const result = loadFromStorage('test-key', {});

      expect(result).toEqual(data);
    });
  });

  describe('saveToStorage', () => {
    it('should save data as JSON to localStorage', () => {
      const data = { name: 'Test', value: 42 };

      saveToStorage('test-key', data);

      const stored = localStorage.getItem('test-key');
      expect(stored).toBe(JSON.stringify(data));
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3];

      saveToStorage('test-key', data);

      const stored = localStorage.getItem('test-key');
      expect(stored).toBe(JSON.stringify(data));
    });

    it('should overwrite existing data', () => {
      saveToStorage('test-key', { old: true });
      saveToStorage('test-key', { new: true });

      const result = loadFromStorage('test-key', {});

      expect(result).toEqual({ new: true });
    });

    it('should handle storage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      saveToStorage('test-key', { data: 'test' });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('removeFromStorage', () => {
    it('should remove item from localStorage', () => {
      localStorage.setItem('test-key', 'value');

      removeFromStorage('test-key');

      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should handle removing nonexistent key', () => {
      removeFromStorage('nonexistent-key');

      expect(localStorage.getItem('nonexistent-key')).toBeNull();
    });

    it('should handle removal errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Cannot remove');
      });

      removeFromStorage('test-key');

      expect(console.error).toHaveBeenCalled();
    });
  });
});


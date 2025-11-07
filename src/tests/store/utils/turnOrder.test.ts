import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleTurnOrderUpdate } from '@/store/utils/turnOrder';

describe('turnOrder utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('scheduleTurnOrderUpdate', () => {
    it('should schedule callback with default delay', () => {
      const callback = vi.fn();

      scheduleTurnOrderUpdate(callback);

      expect(callback).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(callback).toHaveBeenCalledOnce();
    });

    it('should schedule callback with custom delay', () => {
      const callback = vi.fn();

      scheduleTurnOrderUpdate(callback, 1000);

      vi.advanceTimersByTime(500);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should handle zero delay', () => {
      const callback = vi.fn();

      scheduleTurnOrderUpdate(callback, 0);

      vi.runAllTimers();

      expect(callback).toHaveBeenCalledOnce();
    });

    it('should allow multiple scheduled callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      scheduleTurnOrderUpdate(callback1, 100);
      scheduleTurnOrderUpdate(callback2, 200);

      vi.advanceTimersByTime(100);
      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback2).toHaveBeenCalledOnce();
    });
  });
});


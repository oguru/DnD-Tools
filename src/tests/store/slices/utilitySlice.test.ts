import { describe, it, expect } from 'vitest';
import { createUtilitySlice } from '@/store/slices/utilitySlice';
import type { EnemyGroup } from '@models/entities/EnemyGroup';

describe('utilitySlice', () => {
  const utilities = createUtilitySlice();

  describe('calculateHealthPercentage', () => {
    it('should return 0 when max HP is 0', () => {
      expect(utilities.calculateHealthPercentage(10, 0)).toBe(0);
    });

    it('should return 0 when max HP is negative', () => {
      expect(utilities.calculateHealthPercentage(10, -5)).toBe(0);
    });

    it('should return 100 when current equals max', () => {
      expect(utilities.calculateHealthPercentage(100, 100)).toBe(100);
    });

    it('should return 50 when current is half of max', () => {
      expect(utilities.calculateHealthPercentage(50, 100)).toBe(50);
    });

    it('should return 0 when current is 0', () => {
      expect(utilities.calculateHealthPercentage(0, 100)).toBe(0);
    });

    it('should clamp negative current to 0', () => {
      expect(utilities.calculateHealthPercentage(-10, 100)).toBe(0);
    });

    it('should clamp over 100% to 100', () => {
      expect(utilities.calculateHealthPercentage(150, 100)).toBe(100);
    });

    it('should handle decimal values correctly', () => {
      expect(utilities.calculateHealthPercentage(33, 100)).toBe(33);
      expect(utilities.calculateHealthPercentage(66, 100)).toBe(66);
    });
  });

  describe('calculateGroupTotalCurrentHP', () => {
    it('should return 0 for null or undefined group', () => {
      expect(utilities.calculateGroupTotalCurrentHP(null as any)).toBe(0);
      expect(utilities.calculateGroupTotalCurrentHP(undefined as any)).toBe(0);
    });

    it('should calculate total from creatures array', () => {
      const group: EnemyGroup = {
        id: 'group-1',
        name: 'Goblins',
        count: 5,
        maxHp: 20,
        currentHp: 15,
        tempHp: 0,
        ac: 12,
        initiative: 10,
        inAoe: false,
        creatures: [
          { id: 'c1', currentHp: 10, tempHp: 0, isRemoved: false },
          { id: 'c2', currentHp: 15, tempHp: 0, isRemoved: false },
          { id: 'c3', currentHp: 20, tempHp: 0, isRemoved: false },
        ],
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
      };

      expect(utilities.calculateGroupTotalCurrentHP(group)).toBe(45);
    });

    it('should use count * currentHp when creatures array is empty', () => {
      const group: EnemyGroup = {
        id: 'group-1',
        name: 'Goblins',
        count: 5,
        maxHp: 20,
        currentHp: 15,
        tempHp: 0,
        ac: 12,
        initiative: 10,
        inAoe: false,
        creatures: [],
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
      };

      expect(utilities.calculateGroupTotalCurrentHP(group)).toBe(75);
    });

    it('should use count * currentHp when creatures array is missing', () => {
      const group: Partial<EnemyGroup> = {
        id: 'group-1',
        name: 'Goblins',
        count: 4,
        currentHp: 10,
      };

      expect(utilities.calculateGroupTotalCurrentHP(group as EnemyGroup)).toBe(40);
    });
  });

  describe('getHealthColour', () => {
    it('should return green for >50% health', () => {
      expect(utilities.getHealthColour(100)).toBe('#38a169');
      expect(utilities.getHealthColour(51)).toBe('#38a169');
      expect(utilities.getHealthColour(75)).toBe('#38a169');
    });

    it('should return orange for 26-50% health', () => {
      expect(utilities.getHealthColour(50)).toBe('#dd6b20');
      expect(utilities.getHealthColour(40)).toBe('#dd6b20');
      expect(utilities.getHealthColour(26)).toBe('#dd6b20');
    });

    it('should return red for ≤25% health', () => {
      expect(utilities.getHealthColour(25)).toBe('#e53e3e');
      expect(utilities.getHealthColour(10)).toBe('#e53e3e');
      expect(utilities.getHealthColour(0)).toBe('#e53e3e');
    });

    it('should return red for negative percentages', () => {
      expect(utilities.getHealthColour(-10)).toBe('#e53e3e');
    });
  });

  describe('rollD20', () => {
    it('should be a function', () => {
      expect(typeof utilities.rollD20).toBe('function');
    });

    it('should return a number between 1 and 20', () => {
      for (let i = 0; i < 100; i++) {
        const roll = utilities.rollD20();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('rollDice', () => {
    it('should be a function', () => {
      expect(typeof utilities.rollDice).toBe('function');
    });

    it('should return a number in valid range', () => {
      for (let i = 0; i < 50; i++) {
        const roll = utilities.rollDice(3, 6);
        expect(roll).toBeGreaterThanOrEqual(3);
        expect(roll).toBeLessThanOrEqual(18);
      }
    });
  });
});


import {
  DAMAGE_TYPES,
  DAMAGE_TYPE_LOOKUP,
  calculateModifiedDamage,
  formatAoeEntities,
  getSaveResultText,
} from '@/utils/view/aoe';
import { describe, expect, it } from 'vitest';

describe('aoe view utils', () => {
  describe('DAMAGE_TYPES and DAMAGE_TYPE_LOOKUP', () => {
    it('contains all standard D&D damage types', () => {
      expect(DAMAGE_TYPES.length).toBe(13);
      expect(DAMAGE_TYPE_LOOKUP.fire).toEqual({
        key: 'fire',
        label: 'Fire',
        icon: '🔥',
      });
    });
  });

  describe('formatAoeEntities', () => {
    it('filters and formats entities in AOE', () => {
      const entities = [
        { id: '1', name: 'Alice', inAoe: true },
        { id: '2', name: 'Bob', inAoe: false },
        { id: '3', name: 'Charlie', inAoe: true },
      ];

      const result = formatAoeEntities(entities, 'character');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Alice',
        type: 'character',
        key: 'character-1',
      });
      expect(result[1]).toEqual({
        id: '3',
        name: 'Charlie',
        type: 'character',
        key: 'character-3',
      });
    });

    it('returns empty array when no entities in AOE', () => {
      const entities = [{ id: '1', name: 'Alice', inAoe: false }];
      const result = formatAoeEntities(entities, 'boss');
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateModifiedDamage', () => {
    it('returns full damage for "full" modifier', () => {
      expect(calculateModifiedDamage(20, 'full')).toBe(20);
      expect(calculateModifiedDamage(20, 'full', 5)).toBe(25);
    });

    it('returns half damage for "half" modifier', () => {
      expect(calculateModifiedDamage(20, 'half')).toBe(10);
      expect(calculateModifiedDamage(21, 'half')).toBe(10); // Floors
      expect(calculateModifiedDamage(20, 'half', -3)).toBe(7);
    });

    it('returns quarter damage for "quarter" modifier', () => {
      expect(calculateModifiedDamage(20, 'quarter')).toBe(5);
      expect(calculateModifiedDamage(23, 'quarter')).toBe(5); // Floors
    });

    it('returns zero damage for "none" modifier', () => {
      expect(calculateModifiedDamage(20, 'none')).toBe(0);
      expect(calculateModifiedDamage(20, 'none', 5)).toBe(5); // Adjustment still applies
    });

    it('never returns negative damage', () => {
      expect(calculateModifiedDamage(10, 'full', -20)).toBe(0);
      expect(calculateModifiedDamage(5, 'half', -10)).toBe(0);
    });
  });

  describe('getSaveResultText', () => {
    it('formats successful save with half damage', () => {
      expect(getSaveResultText(true, true, 15, 3)).toBe('Save (18+3) (½ dmg)');
    });

    it('formats successful save with no damage', () => {
      expect(getSaveResultText(true, false, 15, 3)).toBe('Save (18+3) (no dmg)');
    });

    it('formats failed save', () => {
      expect(getSaveResultText(false, true, 8, 2)).toBe('Failed (10+2)');
      expect(getSaveResultText(false, false, 8, 2)).toBe('Failed (10+2)');
    });

    it('handles negative bonuses', () => {
      expect(getSaveResultText(true, true, 10, -2)).toBe('Save (8-2) (½ dmg)');
    });

    it('handles zero bonus', () => {
      expect(getSaveResultText(true, true, 12, 0)).toBe('Save (12) (½ dmg)');
    });

    it('works without roll/bonus information', () => {
      expect(getSaveResultText(true, true)).toBe('Save (½ dmg)');
      expect(getSaveResultText(false, false)).toBe('Failed');
    });
  });
});




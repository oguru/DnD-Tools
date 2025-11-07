import { describe, it, expect } from 'vitest';
import {
  normalizeDefenses,
  normalizeSavingThrows,
  normalizeBossAttack,
} from '@/store/utils/normalize';
import type { BossAttack } from '@models/combat/BossAttack';
import type { Defenses } from '@models/common/Defenses';
import type { SavingThrows } from '@models/common/SavingThrows';

describe('normalize utilities', () => {
  describe('normalizeDefenses', () => {
    it('should return default defenses for undefined', () => {
      const result = normalizeDefenses(undefined);

      expect(result).toEqual({
        resistances: [],
        vulnerabilities: [],
        immunities: [],
      });
    });

    it('should normalize partial defenses', () => {
      const input: Partial<Defenses> = {
        resistances: ['fire'],
      };

      const result = normalizeDefenses(input);

      expect(result).toEqual({
        resistances: ['fire'],
        vulnerabilities: [],
        immunities: [],
      });
    });

    it('should preserve all defense types', () => {
      const input: Defenses = {
        resistances: ['fire', 'cold'],
        vulnerabilities: ['lightning'],
        immunities: ['poison'],
      };

      const result = normalizeDefenses(input);

      expect(result).toEqual(input);
    });
  });

  describe('normalizeSavingThrows', () => {
    it('should return default saves for undefined', () => {
      const result = normalizeSavingThrows(undefined);

      expect(result).toEqual({
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0,
      });
    });

    it('should normalize partial saves', () => {
      const input: Partial<SavingThrows> = {
        str: 5,
        dex: 3,
      };

      const result = normalizeSavingThrows(input);

      expect(result).toEqual({
        str: 5,
        dex: 3,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0,
      });
    });

    it('should preserve all save values', () => {
      const input: SavingThrows = {
        str: 2,
        dex: 4,
        con: 3,
        int: -1,
        wis: 1,
        cha: 0,
      };

      const result = normalizeSavingThrows(input);

      expect(result).toEqual(input);
    });
  });

  describe('normalizeBossAttack', () => {
    it('should normalize attack without charges', () => {
      const attack: BossAttack = {
        id: 'atk-1',
        name: 'Sword',
        usesCharges: false,
      };

      const result = normalizeBossAttack(attack);

      expect(result).toEqual({
        id: 'atk-1',
        name: 'Sword',
        usesCharges: false,
        isRemoved: false,
      });
    });

    it('should normalize attack with charges', () => {
      const attack: BossAttack = {
        id: 'atk-2',
        name: 'Breath Weapon',
        usesCharges: true,
        maxCharges: 3,
        chargesRemaining: 2,
      };

      const result = normalizeBossAttack(attack);

      expect(result).toEqual({
        id: 'atk-2',
        name: 'Breath Weapon',
        usesCharges: true,
        maxCharges: 3,
        chargesRemaining: 2,
        isRemoved: false,
      });
    });

    it('should clamp maxCharges between 1 and 5', () => {
      const attack1: BossAttack = {
        id: 'atk-3',
        name: 'Ability',
        usesCharges: true,
        maxCharges: 10,
      };

      const result1 = normalizeBossAttack(attack1);
      expect(result1.maxCharges).toBe(5);

      const attack2: BossAttack = {
        id: 'atk-4',
        name: 'Ability2',
        usesCharges: true,
        maxCharges: 0,
      };

      const result2 = normalizeBossAttack(attack2);
      expect(result2.maxCharges).toBe(1);
    });

    it('should clamp chargesRemaining to maxCharges', () => {
      const attack: BossAttack = {
        id: 'atk-5',
        name: 'Recharge',
        usesCharges: true,
        maxCharges: 3,
        chargesRemaining: 10,
      };

      const result = normalizeBossAttack(attack);

      expect(result.chargesRemaining).toBe(3);
    });

    it('should set chargesRemaining to maxCharges if undefined', () => {
      const attack: BossAttack = {
        id: 'atk-6',
        name: 'Fresh',
        usesCharges: true,
        maxCharges: 4,
      };

      const result = normalizeBossAttack(attack);

      expect(result.chargesRemaining).toBe(4);
    });

    it('should preserve isRemoved flag', () => {
      const attack1: BossAttack = {
        id: 'atk-7',
        name: 'Removed',
        usesCharges: false,
        isRemoved: true,
      };

      const result1 = normalizeBossAttack(attack1);
      expect(result1.isRemoved).toBe(true);

      const attack2: BossAttack = {
        id: 'atk-8',
        name: 'Active',
        usesCharges: false,
        isRemoved: false,
      };

      const result2 = normalizeBossAttack(attack2);
      expect(result2.isRemoved).toBe(false);
    });

    it('should handle negative chargesRemaining', () => {
      const attack: BossAttack = {
        id: 'atk-9',
        name: 'Depleted',
        usesCharges: true,
        maxCharges: 3,
        chargesRemaining: -1,
      };

      const result = normalizeBossAttack(attack);

      expect(result.chargesRemaining).toBe(0);
    });
  });
});


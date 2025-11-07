import { describe, expect, it } from 'vitest';
import {
  formatCombatLogMessage,
  groupCombatResultsByTransaction,
} from '@/store/utils/resultsFormat';

describe('resultsFormat utilities', () => {
  describe('formatCombatLogMessage', () => {
    it('highlights damage patterns', () => {
      const input = 'Damage: 12 slashing';
      const output = formatCombatLogMessage(input);
      expect(output).toContain('<span class="damage-number">12</span>');
    });

    it('highlights healing patterns', () => {
      const input = 'Healing! 8 healing restored';
      const output = formatCombatLogMessage(input);
      expect(output).toContain('<span class="healing-number">8</span>');
    });

    it('adds AoE line breaks', () => {
      const input = 'AoE: 20 damage\nto groups - Goblins: 10 damage; Orcs: 5 damage';
      const output = formatCombatLogMessage(input);
      expect(output).toContain('<br />');
    });
  });

  describe('groupCombatResultsByTransaction', () => {
    it('returns results unchanged when no healing batches exist', () => {
      const input = [
        { id: 'result-1', message: 'Damage: 5 slashing', timestamp: 1 },
      ];

      expect(groupCombatResultsByTransaction(input)).toEqual(input);
    });

    it('groups related healing transactions into a single entry', () => {
      const input = [
        { id: 'healing-123-char-1', message: 'Healing! +5 HP for Alice', timestamp: 1 },
        { id: 'healing-123-char-2', message: 'Healing! +7 HP for Bob', timestamp: 1 },
      ];

      const grouped = groupCombatResultsByTransaction(input);
      expect(grouped).toHaveLength(1);
      expect(grouped[0].id).toBe('healing-123');
      expect(grouped[0].message).toContain('Alice');
      expect(grouped[0].message).toContain('Bob');
    });
  });
});



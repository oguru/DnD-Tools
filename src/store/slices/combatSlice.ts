import { loadFromStorage, saveToStorage } from '../utils/storage';
import { createHealingResult } from '../utils/results';
import { scheduleTurnOrderUpdate } from '../utils/turnOrder';
import { STORAGE_KEYS } from '@constants/storage';
import type { Character } from '@models/entities/Character';
import type { Boss } from '@models/entities/Boss';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import type { AttackResult } from '@models/combat/AttackResult';

interface CombatState {
  attackResults: AttackResult[];
}

interface CombatActions {
  clearAttackResults: () => void;
  removeAttackResult: (id: string) => void;
  applyHealingToAllCharacters: (amount: number, transactionId?: string) => void;
}

export const createCombatSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): CombatState & CombatActions => ({
  attackResults: [],

  clearAttackResults: () => {
    set((state: any) => ({ attackResults: [] }));
  },

  removeAttackResult: (id: string) => {
    set((state: any) => ({
      attackResults: state.attackResults.filter((result: AttackResult) => result.id !== id),
    }));
  },

  applyHealingToAllCharacters: (amount: number, transactionId?: string) => {
    if (amount <= 0) return;

    const state = get();
    const characters: Character[] = state.characters || [];
    const bosses: Boss[] = state.bosses || [];
    const enemyGroups: EnemyGroup[] = state.enemyGroups || [];

    const updatedCharacters = characters.map((char: Character) => {
      const healedAmount = Math.min(amount, char.maxHp - char.currentHp);
      if (healedAmount <= 0) return char;

      return {
        ...char,
        currentHp: Math.min(char.maxHp, char.currentHp + amount),
      };
    });

    const healingResults: AttackResult[] = characters
      .filter((char: Character) => {
        const healedAmount = Math.min(amount, char.maxHp - char.currentHp);
        return healedAmount > 0;
      })
      .map((char: Character) => {
        const healedAmount = Math.min(amount, char.maxHp - char.currentHp);
        return createHealingResult(healedAmount, char.name, char.id, 'character', transactionId);
      });

    saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
    saveToStorage(STORAGE_KEYS.BOSSES, bosses);
    saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, enemyGroups);

    set((state: any) => ({
      characters: updatedCharacters,
      attackResults: [...state.attackResults, ...healingResults],
    }));

    scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());
  },
});

export default createCombatSlice;


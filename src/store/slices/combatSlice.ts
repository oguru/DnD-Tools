import { createAoeResult, createHealingResult } from '../utils/results';
import { loadFromStorage, saveToStorage } from '../utils/storage';

import type { AttackResult } from '@models/combat/AttackResult';
import type { Boss } from '@models/entities/Boss';
import type { Character } from '@models/entities/Character';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import { STORAGE_KEYS } from '@constants/storage';
import { scheduleTurnOrderUpdate } from '../utils/turnOrder';

interface CombatState {
  attackResults: AttackResult[];
}

interface CombatActions {
  clearAttackResults: () => void;
  removeAttackResult: (id: string) => void;
  applyHealingToAllCharacters: (amount: number, transactionId?: string) => void;
  applyAoeDamageToAll: (aoeParams: any) => void;
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

  applyAoeDamageToAll: (aoeParams: any) => {
    if (!aoeParams || typeof aoeParams.damage !== 'number' || aoeParams.damage <= 0) {
      return;
    }

    const applyToAll = !!aoeParams.applyToAll;

    const bossResults = get().applyDamageToAllBossesInAoeInternal
      ? get().applyDamageToAllBossesInAoeInternal(aoeParams, applyToAll)
      : '';
    const groupResults = get().applyDamageToAllGroupsInAoeInternal
      ? get().applyDamageToAllGroupsInAoeInternal(aoeParams)
      : '';
    const characterResults = get().applyDamageToAllCharactersInAoeInternal
      ? get().applyDamageToAllCharactersInAoeInternal(aoeParams, applyToAll)
      : '';

    const segments: string[] = [];
    if (bossResults && bossResults.trim().length > 0) {
      segments.push(`to bosses - ${bossResults}`);
    }
    if (groupResults && groupResults.trim().length > 0) {
      segments.push(`to groups - ${groupResults}`);
    }
    if (characterResults && characterResults.trim().length > 0) {
      segments.push(`to characters - ${characterResults}`);
    }

    const baseMessage = `AoE: ${aoeParams.damage} ${
      aoeParams.saveType ? `${aoeParams.saveType.toUpperCase()} save DC ${aoeParams.saveDC}` : 'damage'
    }`;
    const message = segments.length > 0 ? `${baseMessage}\n${segments.join('\n')}` : baseMessage;

    set((state: any) => ({
      attackResults: [...state.attackResults, createAoeResult(aoeParams.damage, message)],
      characters: state.characters.map((char: Character) => ({ ...char, inAoe: false })),
      bosses: state.bosses.map((boss: Boss) => ({ ...boss, inAoe: false })),
      enemyGroups: state.enemyGroups.map((group: EnemyGroup) => ({ ...group, inAoe: false })),
    }));

    const latestState = get();
    saveToStorage(STORAGE_KEYS.CHARACTERS, latestState.characters);
    saveToStorage(STORAGE_KEYS.BOSSES, latestState.bosses);
    saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, latestState.enemyGroups);

    scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());
  },
});

export default createCombatSlice;


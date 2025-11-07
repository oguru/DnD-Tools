import { applyDamageWithTempHp, calculateSaveDamage, checkSave, rollSave, setTempHp } from '../utils/combat';
import { clampHp, ensurePositive } from '../utils/numbers';
import { createDamageResult, createHealingResult } from '../utils/results';
import { generateId, generateUniqueId } from '../utils/ids';
import { loadFromStorage, saveToStorage } from '../utils/storage';

import type { AttackResult } from '@models/combat/AttackResult';
import type { Character } from '@models/entities/Character';
import { STORAGE_KEYS } from '@constants/storage';
import type { SaveType } from '@models/common/SavingThrows';
import { normalizeDefenses } from '../utils/normalize';
import { rollD20 } from '@utils/dice';
import { scheduleTurnOrderUpdate } from '../utils/turnOrder';

interface AoeParams {
  damage: number;
  saveType: SaveType;
  saveDC: number;
  halfOnSave: boolean;
  characterDamageParams?: Record<string, {
    damage: number;
    saveRoll: number | null;
    succeeded: boolean;
  }>;
}

interface DamageDetail {
  characterId: string;
  sourceGroupId?: string;
  groupName?: string;
  damage: number;
  hitStatus?: string;
  hitCount?: number;
  acOverride?: number | null;
  attackRolls?: Array<{
    attackRoll: number;
    isNatural1: boolean;
    isNatural20: boolean;
  }>;
  adjustedHitCount?: number;
  damagePreCalculated?: boolean;
  modifier?: 'half' | 'quarter' | 'none' | 'full' | 'default';
  originalModifier?: string;
  manualAdjustment?: number;
}

interface CharactersState {
  characters: Character[];
}

interface CharactersActions {
  addCharacter: (character: Partial<Character>) => void;
  updateCharacter: (id: string, field: keyof Character, value: any) => void;
  removeCharacter: (id: string) => void;
  resetCharacters: () => void;
  clearTemporaryHitPoints: () => void;
  setTemporaryHitPoints: (characterId: string, amount: number, replace?: boolean) => void;
  toggleCharacterAoeTarget: (id: string) => void;
  applyDamageToCharacter: (
    characterId: string,
    damage: number,
    hitStatus: 'hit' | 'miss' | 'critical',
    modifierText?: string,
    skipCombatLog?: boolean
  ) => void;
  applyDamageToAllCharactersInAoe: (aoeParams: AoeParams, forceAll?: boolean) => string;
  applyDamageToAllCharactersInAoeInternal: (aoeParams: AoeParams, forceAll?: boolean) => string;
  applyDamageToMultipleCharacters: (damageDetails: DamageDetail[]) => void;
  applyHealingToCharacter: (characterId: string, amount: number, transactionId?: string | null) => void;
}

const initialCharacters = loadFromStorage<Character[]>(STORAGE_KEYS.CHARACTERS, []);

export const createCharactersSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): CharactersState & CharactersActions => ({
  characters: initialCharacters,

  addCharacter: (character: Partial<Character>) => {
    const newChar: Character = {
      id: generateId(),
      name: character.name || '',
      maxHp: character.maxHp || 0,
      currentHp: character.currentHp || 0,
      tempHp: character.tempHp || 0,
      ac: character.ac || 0,
      initiative: character.initiative || 0,
      inAoe: false,
      defenses: normalizeDefenses(character.defenses),
    };

    set((state: any) => {
      const updatedCharacters = [...state.characters, newChar];
      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
      return { characters: updatedCharacters };
    });

    scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());
  },

  updateCharacter: (id: string, field: keyof Character, value: any) => {
    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) =>
        char.id === id ? { ...char, [field]: value } : char
      );

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);

      if (field === 'initiative') {
        scheduleTurnOrderUpdate(() => get().updateTurnOrder?.(true));
      }

      return { characters: updatedCharacters };
    });
  },

  removeCharacter: (id: string) => {
    set((state: any) => {
      const newState: any = { 
        characters: state.characters.filter((char: Character) => char.id !== id) 
      };

      if (
        state.targetEntity &&
        state.targetEntity.type === 'character' &&
        state.targetEntity.id === id
      ) {
        newState.targetEntity = null;
      }

      saveToStorage(STORAGE_KEYS.CHARACTERS, newState.characters);
      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.(false, id, 'character'));

      return newState;
    });
  },

  resetCharacters: () => {
    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) => ({
        ...char,
        currentHp: char.maxHp,
      }));

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
      return { characters: updatedCharacters };
    });
  },

  clearTemporaryHitPoints: () => {
    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) => ({
        ...char,
        tempHp: 0,
      }));

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
      return { characters: updatedCharacters };
    });
  },

  setTemporaryHitPoints: (characterId: string, amount: number, replace = true) => {
    const safeAmount = ensurePositive(amount);

    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) => {
        if (char.id !== characterId) return char;

        const newTempHp = setTempHp(safeAmount, char.tempHp || 0, replace);

        return {
          ...char,
          tempHp: newTempHp,
        };
      });

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
      return { characters: updatedCharacters };
    });
  },

  toggleCharacterAoeTarget: (id: string) => {
    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) =>
        char.id === id ? { ...char, inAoe: !char.inAoe } : char
      );

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
      return { characters: updatedCharacters };
    });
  },

  applyDamageToCharacter: (
    characterId: string,
    damage: number,
    hitStatus: 'hit' | 'miss' | 'critical',
    modifierText = '',
    skipCombatLog = false
  ) => {
    if (damage <= 0) return;

    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) => {
        if (char.id !== characterId) return char;

        if (hitStatus === 'miss') {
          return char;
        }

        const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
          damage,
          char.currentHp,
          char.tempHp || 0
        );

        return {
          ...char,
          currentHp: newCurrentHp,
          tempHp: newTempHp,
        };
      });

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());

      if (skipCombatLog) {
        return {
          characters: updatedCharacters,
        };
      }

      const character = state.characters.find((c: Character) => c.id === characterId);
      const result = createDamageResult(
        damage,
        character?.name || 'Unknown',
        characterId,
        'character',
        hitStatus,
        modifierText
      );

      return {
        characters: updatedCharacters,
        attackResults: [...state.attackResults, result],
      };
    });
  },

  applyDamageToAllCharactersInAoe: (aoeParams: AoeParams, forceAll = false) => {
    const { damage, saveType, saveDC, halfOnSave, characterDamageParams } = aoeParams;
    if (damage <= 0) return '';

    let resultMessage = '';

    set((state: any) => {
      const aoeCharacters: Character[] = forceAll
        ? state.characters
        : state.characters.filter((char: Character) => char.inAoe);

      if (aoeCharacters.length === 0) return state;

      const updatedCharacters = state.characters.map((char: Character) => {
        if (!forceAll && !char.inAoe) return char;

        let damageToApply: number;

        if (characterDamageParams && characterDamageParams[char.id]) {
          damageToApply = characterDamageParams[char.id].damage;
        } else {
          const saveRoll = rollD20();
          const saved = checkSave(saveRoll, saveDC);
          damageToApply = calculateSaveDamage(damage, saved, halfOnSave);
        }

        if (damageToApply <= 0) {
          return char;
        }

        const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
          damageToApply,
          char.currentHp,
          char.tempHp || 0
        );

        return {
          ...char,
          currentHp: newCurrentHp,
          tempHp: newTempHp,
        };
      });

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);

      if (characterDamageParams) {
        const saveDetails: string[] = [];
        aoeCharacters.forEach((char) => {
          if (characterDamageParams[char.id]) {
            const params = characterDamageParams[char.id];
            const saveRoll = params.saveRoll === null ? 'Auto' : params.saveRoll;
            const saveStatus = params.succeeded ? 'Success' : 'Failure';
            saveDetails.push(`${char.name}: ${saveRoll} (${saveStatus}, ${params.damage} dmg)`);
          }
        });

        resultMessage =
          saveDetails.length > 0
            ? saveDetails.join('; ')
            : `${aoeCharacters.map((c) => c.name).join(', ')} - DC ${saveDC} ${saveType.toUpperCase()} save`;
      } else {
        resultMessage = `${aoeCharacters
          .map((c) => c.name)
          .join(', ')} - DC ${saveDC} ${saveType.toUpperCase()} save`;
      }

      return { characters: updatedCharacters };
    });

    return resultMessage;
  },

  applyDamageToAllCharactersInAoeInternal: (aoeParams: AoeParams, forceAll = false) => {
    return get().applyDamageToAllCharactersInAoe(aoeParams, forceAll);
  },

  applyDamageToMultipleCharacters: (damageDetails: DamageDetail[]) => {
    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) => {
        const charDamageInstances = damageDetails.filter((d) => d.characterId === char.id);

        if (charDamageInstances.length === 0) return char;

        let totalDamage = 0;
        let currentHp = char.currentHp;
        let currentTempHp = char.tempHp || 0;

        charDamageInstances.forEach((charDamage) => {
          let finalDamage = charDamage.damage;

          if (
            charDamage.acOverride !== null &&
            charDamage.acOverride !== undefined &&
            char.ac !== charDamage.acOverride &&
            charDamage.attackRolls &&
            charDamage.adjustedHitCount === undefined
          ) {
            const newHitCount = charDamage.attackRolls.filter((roll) =>
              roll.isNatural20 || (!roll.isNatural1 && roll.attackRoll >= charDamage.acOverride!)
            ).length;

            if (charDamage.hitCount) {
              const hitRatio = newHitCount / charDamage.hitCount;
              finalDamage = Math.floor(finalDamage * hitRatio);
            }
          }

          if (!charDamage.damagePreCalculated) {
            if (charDamage.modifier === 'half') {
              finalDamage = Math.floor(finalDamage / 2);
            } else if (charDamage.modifier === 'quarter') {
              finalDamage = Math.floor(finalDamage / 4);
            } else if (charDamage.modifier === 'none') {
              finalDamage = 0;
            }
          }

          if (finalDamage <= 0) return;

          const result = applyDamageWithTempHp(finalDamage, currentHp, currentTempHp);
          currentHp = result.newCurrentHp;
          currentTempHp = result.newTempHp;
          totalDamage += finalDamage;
        });

        if (totalDamage === 0) return char;

        return {
          ...char,
          currentHp,
          tempHp: currentTempHp,
        };
      });

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);

      const resultMessages: AttackResult[] = damageDetails
        .map((detail) => {
          if (!detail.characterId) return null;

          const character = state.characters.find((c: Character) => c.id === detail.characterId);
          if (!character) return null;

          let finalDamage = detail.damage;

          if (
            detail.acOverride !== null &&
            detail.acOverride !== undefined &&
            character.ac !== detail.acOverride &&
            detail.attackRolls &&
            detail.adjustedHitCount === undefined
          ) {
            const newHitCount = detail.attackRolls.filter((roll) =>
              roll.isNatural20 || (!roll.isNatural1 && roll.attackRoll >= detail.acOverride!)
            ).length;

            if (detail.hitCount) {
              const hitRatio = newHitCount / detail.hitCount;
              finalDamage = Math.floor(finalDamage * hitRatio);
            }
          }

          if (!detail.damagePreCalculated) {
            if (detail.modifier === 'half') {
              finalDamage = Math.floor(finalDamage / 2);
            } else if (detail.modifier === 'quarter') {
              finalDamage = Math.floor(finalDamage / 4);
            } else if (detail.modifier === 'none') {
              finalDamage = 0;
            }
          }

          let acText = '';
          if (
            detail.acOverride !== null &&
            detail.acOverride !== undefined &&
            character.ac !== detail.acOverride
          ) {
            acText = ` (AC override: ${detail.acOverride})`;
          }

          let adjustmentText = '';
          if (detail.manualAdjustment) {
            const sign = detail.manualAdjustment > 0 ? '+' : '';
            adjustmentText = ` (Adjustment: ${sign}${detail.manualAdjustment})`;
          }

          let modifierText = '';
          if (
            detail.originalModifier &&
            detail.originalModifier !== 'full' &&
            detail.originalModifier !== 'default'
          ) {
            modifierText = ` (${detail.originalModifier} damage)`;
          }

          return {
            id: generateUniqueId(),
            characterId: detail.characterId,
            sourceGroupId: detail.sourceGroupId,
            damage: finalDamage,
            hitStatus: detail.hitStatus || 'hit',
            message: `${detail.groupName || 'Group'} -> ${character.name}${acText}${adjustmentText}${modifierText}: ${finalDamage} damage`,
            timestamp: Date.now(),
          } as AttackResult;
        })
        .filter((result): result is AttackResult => result !== null);

      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());

      return {
        characters: updatedCharacters,
        attackResults: [...state.attackResults, ...resultMessages],
      };
    });
  },

  applyHealingToCharacter: (characterId: string, amount: number, transactionId: string | null = null) => {
    const character = get().characters.find((c: Character) => c.id === characterId);
    if (!character || amount <= 0) return;

    const currentHp = Math.max(0, character.currentHp);
    const newHp = clampHp(currentHp + amount, 0, character.maxHp);
    const actualHealing = newHp - currentHp;

    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) =>
        char.id === characterId ? { ...char, currentHp: newHp } : char
      );

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);

      const healingResult = createHealingResult(
        actualHealing,
        character.name,
        characterId,
        'character',
        transactionId || undefined
      );

      return {
        characters: updatedCharacters,
        attackResults: [...state.attackResults, healingResult],
      };
    });
  },
});

export default createCharactersSlice;


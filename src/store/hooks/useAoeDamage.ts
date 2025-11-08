import { useCallback, useState } from 'react';

import type { Boss } from '@models/entities/Boss';
import type { Character } from '@models/entities/Character';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import useDnDStore from '../dndStore';

export interface AoeDamageState {
  damageAmount: string;
  damageComponents: any[] | null;
  saveType: string;
  saveDC: number;
  halfOnSave: boolean;
  applyToAll: boolean;
  percentAffected: number;
}

export interface AoeSaveState {
  showAoeSaves: boolean;
  characterSaves: Record<string, any>;
  damageModifiers: Record<string, any>;
  manualDamageAdjustments: Record<string, any>;
  aoeComponentModifiers: Record<string, any>;
  aoeComponentAdjustments: Record<string, any>;
}

export const useAoeDamage = () => {
  // Select store functions individually (they're stable)
  const applyAoeDamageToAll = useDnDStore((state: any) => state.applyAoeDamageToAll);
  const characters = useDnDStore((state: any) => state.characters as Character[]);
  const bosses = useDnDStore((state: any) => state.bosses as Boss[]);
  const enemyGroups = useDnDStore((state: any) => state.enemyGroups as EnemyGroup[]);

  // AOE damage state
  const [aoeState, setAoeState] = useState<AoeDamageState>({
    damageAmount: '',
    damageComponents: null,
    saveType: 'dex',
    saveDC: 15,
    halfOnSave: true,
    applyToAll: false,
    percentAffected: 100,
  });

  // State for AoE manual saves
  const [aoeSaveState, setAoeSaveState] = useState<AoeSaveState>({
    showAoeSaves: false,
    characterSaves: {},
    damageModifiers: {},
    manualDamageAdjustments: {},
    aoeComponentModifiers: {},
    aoeComponentAdjustments: {},
  });

  // Update AOE state
  const updateAoeState = useCallback((updates: Partial<AoeDamageState>) => {
    setAoeState((prev: AoeDamageState) => ({ ...prev, ...updates }));
  }, []);

  // Update AOE save state
  const updateAoeSaveState = useCallback((updates: Partial<AoeSaveState>) => {
    setAoeSaveState?.((prev: AoeSaveState) => ({ ...prev, ...updates }));
  }, []);

  // Initialize character saves when showing manual save UI
  const initializeCharacterSaves = useCallback(() => {
    const initialSaves: Record<string, any> = {};
    
    characters.filter((c: Character) => (c as any).inAoe).forEach((char: Character) => {
      initialSaves[`character-${char.id}`] = {
        succeeded: false,
        roll: 10,
        bonus: 0,
      };
    });

    bosses.filter((b: Boss) => (b as any).inAoe).forEach((boss: Boss) => {
      const saveBonus = (boss.savingThrows as any)?.[aoeState.saveType] || 0;
      initialSaves[`boss-${boss.id}`] = {
        succeeded: false,
        roll: 10,
        bonus: saveBonus,
      };
    });

    enemyGroups.filter((g: EnemyGroup) => (g as any).inAoe).forEach((group: EnemyGroup) => {
      const saveBonus = (group.savingThrows as any)?.[aoeState.saveType] || 0;
      initialSaves[`group-${group.id}`] = {
        succeeded: false,
        roll: 10,
        bonus: saveBonus,
      };
    });

    setAoeSaveState?.((prev: AoeSaveState) => ({
      ...prev,
      characterSaves: initialSaves,
      showAoeSaves: true,
    }));
  }, [characters, bosses, enemyGroups, aoeState.saveType]);

  // Apply AOE damage without manual saves
  const applyAoeDamage = useCallback(() => {
    const damage = parseInt(aoeState.damageAmount);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return false;
    }

    const aoeParams = {
      damage,
      saveType: aoeState.saveType,
      saveDC: aoeState.saveDC,
      halfOnSave: aoeState.halfOnSave,
      percentAffected: aoeState.percentAffected,
      applyToAll: aoeState.applyToAll,
    };

    applyAoeDamageToAll(aoeParams);

    // Reset damage amount field
    setAoeState((prev) => ({
      ...prev,
      damageAmount: '',
    }));

    return true;
  }, [aoeState, applyAoeDamageToAll]);

  // Apply AOE damage with manual saves
  const applyAoeDamageWithManualSaves = useCallback(() => {
    const damage = parseInt(aoeState.damageAmount);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return false;
    }

    // Build entity damage modifiers from manual saves
    const entityDamageModifiers: Record<string, any> = {};

    Object.keys(aoeSaveState.characterSaves).forEach((entityKey) => {
      const saveResult = aoeSaveState.characterSaves[entityKey];
      const modifier = aoeSaveState.damageModifiers[entityKey];
      const adjustment = aoeSaveState.manualDamageAdjustments[entityKey];

      entityDamageModifiers[entityKey] = {
        succeeded: saveResult.succeeded,
        roll: saveResult.roll,
        totalRoll: saveResult.roll + saveResult.bonus,
        modifier: modifier || 'full',
        adjustment: adjustment ? parseInt(adjustment) : 0,
      };
    });

    const aoeParams = {
      damage,
      saveType: aoeState.saveType,
      saveDC: aoeState.saveDC,
      halfOnSave: aoeState.halfOnSave,
      entityDamageModifiers,
    };

    applyAoeDamageToAll(aoeParams);

    // Reset state
    setAoeState((prev) => ({
      ...prev,
      damageAmount: '',
    }));

    setAoeSaveState?.({
      showAoeSaves: false,
      characterSaves: {},
      damageModifiers: {},
      manualDamageAdjustments: {},
      aoeComponentModifiers: {},
      aoeComponentAdjustments: {},
    });

    return true;
  }, [aoeState, aoeSaveState, applyAoeDamageToAll]);

  // Cancel manual saves
  const cancelManualSaves = useCallback(() => {
    setAoeSaveState?.({
      showAoeSaves: false,
      characterSaves: {},
      damageModifiers: {},
      manualDamageAdjustments: {},
      aoeComponentModifiers: {},
      aoeComponentAdjustments: {},
    });
  }, []);

  return {
    aoeState,
    aoeSaveState,
    updateAoeState,
    updateAoeSaveState,
    initializeCharacterSaves,
    applyAoeDamage,
    applyAoeDamageWithManualSaves,
    cancelManualSaves,
  };
};




import { applyDamageWithTempHp, applyHealing, setTempHp } from '../utils/combat';
import { clampCharges, clampHp, ensurePositive } from '../utils/numbers';
import { createAoeResult, createDamageResult, createHealingResult } from '../utils/results';
import { loadFromStorage, removeFromStorage, saveToStorage } from '../utils/storage';
import { normalizeBossAttack, normalizeDefenses, normalizeSavingThrows } from '../utils/normalize';

import type { AttackResult } from '@models/combat/AttackResult';
import type { Boss } from '@models/entities/Boss';
import type { BossAttack } from '@models/combat/BossAttack';
import { COMBAT_DEFAULTS } from '@constants/combat';
import { STORAGE_KEYS } from '@constants/storage';
import type { SaveType } from '@models/common/SavingThrows';
import { generateId } from '../utils/ids';
import { rollD20 } from '@utils/dice';
import { scheduleTurnOrderUpdate } from '../utils/turnOrder';

interface AoeParams {
  damage: number;
  saveType?: SaveType;
  saveDC?: number;
  halfOnSave?: boolean;
  entityDamageModifiers?: Record<string, {
    succeeded: boolean;
    roll: number;
    totalRoll: number;
    customDamage?: number;
    modifier?: 'half' | 'quarter' | 'none';
    adjustment?: number;
  }>;
}

interface BossTemplate extends Partial<Boss> {
  showSavingThrows?: boolean;
  showDefenses?: boolean;
}

const defaultBossTemplate: BossTemplate = {
  name: '',
  maxHp: 100,
  currentHp: 100,
  ac: 15,
  initiative: 0,
  notes: '',
  attacks: [],
  showSavingThrows: false,
  showDefenses: false,
  savingThrows: normalizeSavingThrows(),
  defenses: normalizeDefenses(),
};

const sanitizeBosses = (bosses: any[]): Boss[] => {
  if (!Array.isArray(bosses)) return [];

  return bosses.map((boss) => {
    const sanitizedAttacks = Array.isArray(boss.attacks)
      ? boss.attacks.map((attack: any) => {
          if (!attack) return attack;
          return normalizeBossAttack(attack);
        })
      : [];

    return {
      ...boss,
      attacks: sanitizedAttacks,
      tempHp: boss.tempHp || 0,
      defenses: normalizeDefenses(boss.defenses),
      inAoe: false,
    };
  });
};

const initialBosses = sanitizeBosses(
  loadFromStorage<any[]>(STORAGE_KEYS.BOSSES, [])
);

if (initialBosses.length > 0) {
  saveToStorage(STORAGE_KEYS.BOSSES, initialBosses);
}

interface BossesState {
  bosses: Boss[];
  bossTemplate: BossTemplate;
}

interface BossesActions {
  addBoss: (boss: Partial<Boss>) => void;
  removeBoss: (id: string) => void;
  updateBoss: (id: string, field: keyof Boss, value: any) => void;
  setTemporaryHitPointsBoss: (bossId: string, amount: number, replace?: boolean) => void;
  updateBossHp: (id: string, change: number) => void;
  resetBossesHealth: () => void;
  clearAllBosses: () => void;
  setBossAttackCharges: (bossId: string, attackId: string, chargesRemaining: number) => void;
  setBossAttackRemoved: (bossId: string, attackId: string, isRemoved: boolean) => void;
  toggleBossAoeTarget: (id: string) => void;
  addBossAttackResult: (bossId: string, result: any) => void;
  updateBossAttackResult: (bossId: string, resultId: string, updates: any) => void;
  toggleBossSavingThrows: (bossId: string) => void;
  toggleBossTemplateSavingThrows: () => void;
  updateBossSavingThrow: (bossId: string, ability: SaveType, value: number) => void;
  applyDamageToBoss: (bossId: string, damage: number, hitStatus: 'hit' | 'miss' | 'critical') => void;
  applyDamageToAllBossesInAoe: (aoeParams: AoeParams, applyToAll?: boolean) => void;
  applyDamageToAllBossesInAoeInternal: (aoeParams: AoeParams, applyToAll?: boolean) => string;
  setBossTarget: (bossId: string) => void;
  setBossAoeTarget: (bossId: string, isTarget: boolean) => void;
  prepareBossAoeAttack: (bossId: string, attack: BossAttack) => void;
  applyHealingToBoss: (bossId: string, amount: number, transactionId?: string | null) => void;
}

export const createBossesSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): BossesState & BossesActions => ({
  bosses: initialBosses,
  bossTemplate: defaultBossTemplate,

  addBoss: (boss: Partial<Boss>) => {
    if (import.meta.env.DEV) {
      console.log('[Store.addBoss] incoming', boss);
    }

    const sanitizedAttacks = Array.isArray(boss.attacks)
      ? boss.attacks.map((attack) => {
          if (!attack) return attack;
          return normalizeBossAttack(attack);
        })
      : [];

    const newBoss: Boss = {
      id: boss.id || generateId(),
      name: boss.name || '',
      maxHp: boss.maxHp || 100,
      currentHp: boss.currentHp || 100,
      tempHp: boss.tempHp || 0,
      ac: boss.ac || 15,
      initiative: boss.initiative || 0,
      inAoe: false,
      attacks: sanitizedAttacks,
      defenses: normalizeDefenses(boss.defenses),
      savingThrows: boss.savingThrows ? normalizeSavingThrows(boss.savingThrows) : undefined,
    };

    set((state: any) => {
      const updatedBosses = [...state.bosses, newBoss];
      if (import.meta.env.DEV) {
        console.log('[Store.addBoss] saved', newBoss);
      }
      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      return { bosses: updatedBosses };
    });

    scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());
  },

  removeBoss: (id: string) => {
    set((state: any) => {
      const newState: any = { 
        bosses: state.bosses.filter((boss: Boss) => boss.id !== id) 
      };

      if (state.targetEntity && state.targetEntity.type === 'boss' && state.targetEntity.id === id) {
        newState.targetEntity = null;
      }

      saveToStorage(STORAGE_KEYS.BOSSES, newState.bosses);
      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.(false, id, 'boss'));

      return newState;
    });
  },

  updateBoss: (id: string, field: keyof Boss, value: any) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) =>
        boss.id === id ? { ...boss, [field]: value } : boss
      );

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);

      if (field === 'initiative') {
        scheduleTurnOrderUpdate(() => get().updateTurnOrder?.(true));
      }

      return { bosses: updatedBosses };
    });
  },

  setTemporaryHitPointsBoss: (bossId: string, amount: number, replace = true) => {
    const safeAmount = ensurePositive(amount);

    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id !== bossId) return boss;

        const newTempHp = setTempHp(safeAmount, boss.tempHp || 0, replace);

        return {
          ...boss,
          tempHp: newTempHp,
        };
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      return { bosses: updatedBosses };
    });
  },

  updateBossHp: (id: string, change: number) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id !== id) return boss;

        const newHp = clampHp(boss.currentHp + change, 0, boss.maxHp);
        return { ...boss, currentHp: newHp };
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.(false));

      return { bosses: updatedBosses };
    });
  },

  resetBossesHealth: () => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => ({
        ...boss,
        currentHp: boss.maxHp,
      }));

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      return { bosses: updatedBosses };
    });
  },

  clearAllBosses: () => {
    removeFromStorage(STORAGE_KEYS.BOSSES);
    set({ bosses: [] });
  },

  setBossAttackCharges: (bossId: string, attackId: string, chargesRemaining: number) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id !== bossId) return boss;

        const updatedAttacks = (boss.attacks || []).map((attack) => {
          if (!attack || attack.id !== attackId) return attack;

          if (!attack.usesCharges) {
            return attack;
          }

          const maxCharges = clampCharges(attack.maxCharges, COMBAT_DEFAULTS.MAX_CHARGES);
          const clamped = clampCharges(chargesRemaining, maxCharges);

          return {
            ...attack,
            maxCharges,
            chargesRemaining: clamped,
          };
        });

        return {
          ...boss,
          attacks: updatedAttacks,
        };
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      return { bosses: updatedBosses };
    });
  },

  setBossAttackRemoved: (bossId: string, attackId: string, isRemoved: boolean) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id !== bossId) return boss;

        const updatedAttacks = (boss.attacks || []).map((attack) =>
          attack && attack.id === attackId ? { ...attack, isRemoved: !!isRemoved } : attack
        );

        return {
          ...boss,
          attacks: updatedAttacks,
        };
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      return { bosses: updatedBosses };
    });
  },

  toggleBossAoeTarget: (id: string) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) =>
        boss.id === id ? { ...boss, inAoe: !boss.inAoe } : boss
      );
      return { bosses: updatedBosses };
    });
  },

  addBossAttackResult: (bossId: string, result: any) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id === bossId) {
          const attackResults = [...((boss as any).attackResults || []), result];
          return { ...boss, attackResults };
        }
        return boss;
      });

      return {
        bosses: updatedBosses,
        attackResults: [
          ...state.attackResults,
          { ...result, bossId, timestamp: Date.now() },
        ],
      };
    });
  },

  updateBossAttackResult: (bossId: string, resultId: string, updates: any) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id === bossId) {
          const attackResults = ((boss as any).attackResults || []).map((result: any) =>
            result.id === resultId ? { ...result, ...updates } : result
          );
          return { ...boss, attackResults };
        }
        return boss;
      });

      const updatedAttackResults = state.attackResults.map((result: any) =>
        result.id === resultId && result.bossId === bossId ? { ...result, ...updates } : result
      );

      return {
        bosses: updatedBosses,
        attackResults: updatedAttackResults,
      };
    });
  },

  toggleBossSavingThrows: (bossId: string) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) =>
        boss.id === bossId ? { ...boss, showSavingThrows: !(boss as any).showSavingThrows } : boss
      );
      return { bosses: updatedBosses };
    });
  },

  toggleBossTemplateSavingThrows: () => {
    set((state: any) => ({
      bossTemplate: {
        ...state.bossTemplate,
        showSavingThrows: !state.bossTemplate.showSavingThrows,
      },
    }));
  },

  updateBossSavingThrow: (bossId: string, ability: SaveType, value: number) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id === bossId) {
          return {
            ...boss,
            savingThrows: {
              ...(boss.savingThrows || normalizeSavingThrows()),
              [ability]: value,
            },
          };
        }
        return boss;
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      return { bosses: updatedBosses };
    });
  },

  applyDamageToBoss: (bossId: string, damage: number, hitStatus: 'hit' | 'miss' | 'critical') => {
    if (damage <= 0) return;

    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (boss.id !== bossId) return boss;

        if (hitStatus === 'miss') {
          return boss;
        }

        const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
          damage,
          boss.currentHp,
          boss.tempHp || 0
        );

        return { ...boss, currentHp: newCurrentHp, tempHp: newTempHp };
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);

      const boss = state.bosses.find((b: Boss) => b.id === bossId);
      const result = createDamageResult(
        damage,
        boss?.name || 'Unknown',
        bossId,
        'boss',
        hitStatus
      );

      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());

      return {
        bosses: updatedBosses,
        attackResults: [...state.attackResults, result],
      };
    });
  },

  applyDamageToAllBossesInAoe: (aoeParams: AoeParams, applyToAll = false) => {
    const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
    if (damage <= 0) return;

    set((state: any) => {
      const aoeBosses: Boss[] = applyToAll ? state.bosses : state.bosses.filter((boss: Boss) => boss.inAoe);
      if (aoeBosses.length === 0) return state;

      const bossResults: any[] = [];

      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (!applyToAll && !boss.inAoe) return boss;

        const entityKey = `boss-${boss.id}`;
        const customEntityInfo = entityDamageModifiers[entityKey];

        let saved = false;
        let damageToApply = damage;
        let saveRoll: number | null = null;
        let totalRoll: number | null = null;

        if (customEntityInfo) {
          saved = customEntityInfo.succeeded;
          saveRoll = customEntityInfo.roll;
          totalRoll = customEntityInfo.totalRoll;

          if (customEntityInfo.customDamage !== undefined) {
            damageToApply = customEntityInfo.customDamage;
          } else {
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }

            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          }
        } else if (saveType && saveDC) {
          const saveBonus = boss.savingThrows?.[saveType] || 0;
          saveRoll = rollD20();
          totalRoll = saveRoll + saveBonus;
          saved = totalRoll >= saveDC;

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        bossResults.push({
          name: boss.name,
          saved,
          damageToApply,
          saveRoll,
          totalRoll,
        });

        if (damageToApply <= 0) {
          return { ...boss, inAoe: false };
        }

        const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
          damageToApply,
          boss.currentHp,
          boss.tempHp || 0
        );

        return {
          ...boss,
          currentHp: newCurrentHp,
          tempHp: newTempHp,
          inAoe: false,
        };
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);

      const bossMessages = bossResults
        .map((result) => {
          let saveText = '';
          if (result.saveRoll !== null) {
            saveText =
              result.totalRoll !== result.saveRoll
                ? ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`
                : ` (${result.saveRoll})`;
          }

          return `${result.name}: ${result.saved ? (halfOnSave ? 'Save' + saveText + ' (½ dmg)' : 'Save' + saveText + ' (no dmg)') : 'Failed' + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'}`;
        })
        .join('; ');

      const resultMessage = `AoE: ${damage} ${saveType ? `${saveType.toUpperCase()} save DC ${saveDC}` : 'damage'} to bosses - ${bossMessages}`;

      return {
        bosses: updatedBosses,
        attackResults: [
          ...state.attackResults,
          createAoeResult(damage, resultMessage),
        ],
      };
    });
  },

  applyDamageToAllBossesInAoeInternal: (aoeParams: AoeParams, applyToAll = false) => {
    const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
    if (damage <= 0) return '';

    let resultMessage = '';

    set((state: any) => {
      const aoeBosses: Boss[] = applyToAll ? state.bosses : state.bosses.filter((boss: Boss) => boss.inAoe);
      if (aoeBosses.length === 0) return state;

      const bossResults: any[] = [];

      const updatedBosses = state.bosses.map((boss: Boss) => {
        if (!applyToAll && !boss.inAoe) return boss;

        const entityKey = `boss-${boss.id}`;
        const customEntityInfo = entityDamageModifiers[entityKey];

        let saved = false;
        let damageToApply = damage;
        let saveRoll: number | null = null;
        let totalRoll: number | null = null;

        if (customEntityInfo) {
          saved = customEntityInfo.succeeded;
          saveRoll = customEntityInfo.roll;
          totalRoll = customEntityInfo.totalRoll;

          if (customEntityInfo.customDamage !== undefined) {
            damageToApply = customEntityInfo.customDamage;
          } else {
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }

            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          }
        } else if (saveType && saveDC) {
          const saveBonus = boss.savingThrows?.[saveType] || 0;
          saveRoll = rollD20();
          totalRoll = saveRoll + saveBonus;
          saved = totalRoll >= saveDC;

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        bossResults.push({
          name: boss.name,
          saved,
          damageToApply,
          saveRoll,
          totalRoll,
        });

        if (damageToApply <= 0) {
          return { ...boss, inAoe: false };
        }

        const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
          damageToApply,
          boss.currentHp,
          boss.tempHp || 0
        );

        return {
          ...boss,
          currentHp: newCurrentHp,
          tempHp: newTempHp,
          inAoe: false,
        };
      });

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);

      resultMessage = bossResults
        .map((result) => {
          let saveText = '';
          if (result.saveRoll !== null) {
            saveText =
              result.totalRoll !== result.saveRoll
                ? ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`
                : ` (${result.saveRoll})`;
          }

          return `${result.name}: ${result.saved ? (halfOnSave ? 'Save' + saveText + ' (½ dmg)' : 'Save' + saveText + ' (no dmg)') : 'Failed' + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'}`;
        })
        .join('; ');

      return { bosses: updatedBosses };
    });

    return resultMessage;
  },

  setBossTarget: (bossId: string) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) => ({
        ...boss,
        isTargeted: (boss as any).id === bossId,
      }));

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);

      return {
        bosses: updatedBosses,
        targetEntity: { type: 'boss', id: bossId },
      };
    });
  },

  setBossAoeTarget: (bossId: string, isTarget: boolean) => {
    set((state: any) => {
      const updatedBosses = state.bosses.map((boss: Boss) =>
        boss.id === bossId ? { ...boss, inAoe: isTarget } : boss
      );

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);

      return { bosses: updatedBosses };
    });
  },

  prepareBossAoeAttack: (bossId: string, attack: BossAttack) => {
    const boss = get().bosses.find((b: Boss) => b.id === bossId);
    if (!boss || !attack) return;

    let totalDamage = 0;

    const componentsToRoll =
      attack.damageComponents && attack.damageComponents.length > 0
        ? attack.damageComponents
        : [
            {
              numDice: attack.numDice!,
              diceType: attack.diceType!,
              modifier: attack.modifier || 0,
              damageType: attack.damageType || 'slashing',
            },
          ];

    const rolledComponents = componentsToRoll.map((component) => {
      const damageRoll = get().rollDice(component.numDice, component.diceType);
      const componentTotal = damageRoll + component.modifier;
      totalDamage += componentTotal;

      return {
        damageType: component.damageType,
        damageRoll,
        modifier: component.modifier,
        total: componentTotal,
      };
    });

    get().setTargetEntity?.({ type: 'boss', id: bossId });

    const aoeParams = {
      damage: totalDamage.toString(),
      damageComponents: rolledComponents,
      saveType: attack.saveType,
      saveDC: attack.saveDC,
      halfOnSave: attack.halfOnSave,
    };

    get().prepareAoeDamage?.(aoeParams);
    get().scrollToDamageSection?.();

    const componentSummary = rolledComponents
      .map((component) => {
        const modifierPart = component.modifier
          ? `${component.modifier >= 0 ? '+' : ''}${component.modifier}`
          : '';
        const typePart = component.damageType ? ` ${component.damageType}` : '';
        return `${component.damageRoll}${modifierPart}${typePart}`;
      })
      .join(', ');

    const saveTypeLabel = attack.saveType ? attack.saveType.toUpperCase() : 'SAVE';
    const message = `AOE Attack: ${attack.name} - ${totalDamage} damage${
      componentSummary ? ` (${componentSummary})` : ''
    } - DC ${attack.saveDC} ${saveTypeLabel} save, ${attack.halfOnSave ? 'half' : 'no'} damage on save`;

    get().addBossAttackResult(bossId, {
      id: generateId(),
      attackName: attack.name,
      message,
      damage: totalDamage,
      isAoE: true,
      saveType: attack.saveType,
      saveDC: attack.saveDC,
      halfOnSave: attack.halfOnSave,
    });
  },

  applyHealingToBoss: (bossId: string, amount: number, transactionId: string | null = null) => {
    const boss = get().bosses.find((b: Boss) => b.id === bossId);
    if (!boss || amount <= 0) return;

    const newHp = applyHealing(amount, boss.currentHp, boss.maxHp);
    const actualHealing = newHp - boss.currentHp;

    set((state: any) => {
      const updatedBosses = state.bosses.map((b: Boss) =>
        b.id === bossId ? { ...b, currentHp: newHp } : b
      );

      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);

      const healingResult = createHealingResult(
        actualHealing,
        boss.name,
        bossId,
        'boss',
        transactionId || undefined
      );

      return {
        bosses: updatedBosses,
        attackResults: [...state.attackResults, healingResult],
      };
    });
  },
});

export default createBossesSlice;


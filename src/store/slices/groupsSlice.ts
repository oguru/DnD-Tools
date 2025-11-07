import { applyDamageWithTempHp, applyHealing, setTempHp } from '../utils/combat';
import { createAoeResult, createDamageResult, createHealingResult } from '../utils/results';
import { generateId, generateIdWithOffset, generateUniqueId } from '../utils/ids';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { normalizeDefenses, normalizeSavingThrows } from '../utils/normalize';
import { rollD20, rollDice } from '@utils/dice';

import type { AttackResult } from '@models/combat/AttackResult';
import type { Creature } from '@models/entities/Creature';
import type { DamageComponent } from '@models/combat/DamageComponent';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import { STORAGE_KEYS } from '@constants/storage';
import type { SaveType } from '@models/common/SavingThrows';
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

interface GroupTemplate extends Partial<EnemyGroup> {
  showDefenses?: boolean;
  showSavingThrows?: boolean;
  attackBonus?: number;
  damage?: DamageComponent;
}

interface GroupTarget {
  groupId: string;
  targets: Array<{
    creatureId: string;
    characterId: string;
  }>;
}

const defaultGroupTemplate: GroupTemplate = {
  name: '',
  maxHp: 10,
  currentHp: 10,
  ac: 12,
  count: 4,
  originalCount: 4,
  initiative: 0,
  showDefenses: false,
  showSavingThrows: false,
  savingThrows: normalizeSavingThrows(),
  defenses: normalizeDefenses(),
  creatures: [],
  attackBonus: 3,
  damage: {
    numDice: 1,
    diceType: 8,
    modifier: 2,
    damageType: 'slashing',
  },
  tempHp: 0,
};

const migrateGroupData = (groups: any[]): EnemyGroup[] => {
  if (!Array.isArray(groups)) return [];

  return groups.map((group) => {
    const originalCount = (group as any).originalCount || group.count;
    const defenses = normalizeDefenses(group.defenses);
    const tempHp = group.tempHp || 0;

    if (!group.creatures || !Array.isArray(group.creatures)) {
      const creatures: Creature[] = Array(group.count || 0)
        .fill(null)
        .map((_, index) => ({
          id: `${group.id}-creature-${index}`,
          currentHp: group.currentHp || 0,
          tempHp: 0,
          isRemoved: false,
        }));

      return {
        ...group,
        creatures,
        originalCount,
        defenses,
        tempHp,
        inAoe: false,
      };
    }

    return {
      ...group,
      originalCount,
      defenses,
      tempHp,
      inAoe: false,
    };
  });
};

const initialGroups = migrateGroupData(
  loadFromStorage<any[]>(STORAGE_KEYS.ENEMY_GROUPS, [])
);

if (initialGroups.length > 0) {
  saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, initialGroups);
}

interface GroupsState {
  enemyGroups: EnemyGroup[];
  groupTemplate: GroupTemplate;
}

interface GroupsActions {
  updateGroupTemplate: (field: string, value: any) => void;
  addEnemyGroup: () => void;
  addMultipleEnemyGroups: (count: number) => void;
  removeEnemyGroup: (id: string) => void;
  duplicateGroup: (group: EnemyGroup) => void;
  toggleGroupAoeTarget: (id: string) => void;
  toggleGroupSavingThrows: (groupId: string) => void;
  toggleGroupTemplateSavingThrows: () => void;
  toggleGroupTemplateDefenses: () => void;
  setTemporaryHitPointsGroup: (groupId: string, amount: number, replace?: boolean) => void;
  updateGroupSavingThrow: (groupId: string, ability: SaveType, value: number) => void;
  applyDamageToGroup: (groupId: string, damage: number, hitStatus: 'hit' | 'miss' | 'critical') => void;
  applyDamageToAllInGroup: (groupId: string, damage: number, percentAffected?: number) => void;
  applyDamageToAllGroups: (aoeParams: AoeParams) => void;
  applyDamageToAllGroupsInAoe: (aoeParams: AoeParams) => void;
  applyDamageToAllGroupsInAoeInternal: (aoeParams: AoeParams) => string;
  updateEnemyGroup: (id: string, field: keyof EnemyGroup, value: any) => void;
  rollGroupsAttacks: (groupTargets: GroupTarget[], characterAcOverrides?: Record<string, number>) => void;
  applyHealingToGroup: (groupId: string, amount: number, transactionId?: string | null) => void;
}

export const createGroupsSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): GroupsState & GroupsActions => ({
  enemyGroups: initialGroups,
  groupTemplate: defaultGroupTemplate,

  updateGroupTemplate: (field: string, value: any) => {
    set((state: any) => {
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        return {
          groupTemplate: {
            ...state.groupTemplate,
            [parentField]: {
              ...state.groupTemplate[parentField],
              [childField]: value,
            },
          },
        };
      }

      return {
        groupTemplate: {
          ...state.groupTemplate,
          [field]: value,
        },
      };
    });
  },

  addEnemyGroup: () => {
    const { groupTemplate } = get();
    if (import.meta.env.DEV) {
      console.log('[Store.addEnemyGroup] template before create', groupTemplate);
    }

    const creatures: Creature[] = Array(groupTemplate.count)
      .fill(null)
      .map(() => ({
        id: generateUniqueId(),
        currentHp: groupTemplate.maxHp || 0,
        tempHp: 0,
        isRemoved: false,
      }));

    const newGroup: EnemyGroup = {
      id: generateId(),
      name: groupTemplate.name || '',
      maxHp: groupTemplate.maxHp || 10,
      currentHp: groupTemplate.maxHp || 10,
      ac: groupTemplate.ac || 12,
      count: groupTemplate.count || 4,
      originalCount: groupTemplate.count || 4,
      initiative: groupTemplate.initiative || 0,
      inAoe: false,
      creatures,
      defenses: normalizeDefenses(groupTemplate.defenses),
      savingThrows: groupTemplate.savingThrows ? normalizeSavingThrows(groupTemplate.savingThrows) : undefined,
      tempHp: groupTemplate.tempHp || 0,
    };

    set((state: any) => {
      const updatedGroups = [...state.enemyGroups, newGroup];
      if (import.meta.env.DEV) {
        console.log('[Store.addEnemyGroup] saved', newGroup);
      }
      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);
      return { enemyGroups: updatedGroups };
    });

    scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());
  },

  addMultipleEnemyGroups: (count: number) => {
    const { groupTemplate } = get();
    if (import.meta.env.DEV) {
      console.log('[Store.addMultipleEnemyGroups] template before create', groupTemplate);
    }
    const newGroups: EnemyGroup[] = [];

    for (let i = 0; i < count; i++) {
      const creatures: Creature[] = Array(groupTemplate.count || 4)
        .fill(null)
        .map(() => ({
          id: generateUniqueId(),
          currentHp: groupTemplate.maxHp || 10,
          tempHp: 0,
          isRemoved: false,
        }));

      newGroups.push({
        id: generateIdWithOffset(i),
        name: `${groupTemplate.name} ${i + 1}`,
        maxHp: groupTemplate.maxHp || 10,
        currentHp: groupTemplate.maxHp || 10,
        ac: groupTemplate.ac || 12,
        count: groupTemplate.count || 4,
        originalCount: groupTemplate.count || 4,
        initiative: groupTemplate.initiative || 0,
        inAoe: false,
        creatures,
        defenses: normalizeDefenses(groupTemplate.defenses),
        savingThrows: groupTemplate.savingThrows ? normalizeSavingThrows(groupTemplate.savingThrows) : undefined,
        tempHp: groupTemplate.tempHp || 0,
      });
    }

    set((state: any) => {
      const updatedGroups = [...state.enemyGroups, ...newGroups];
      if (import.meta.env.DEV) {
        console.log('[Store.addMultipleEnemyGroups] saved', newGroups);
      }
      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);
      return { enemyGroups: updatedGroups };
    });

    scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());
  },

  removeEnemyGroup: (id: string) => {
    set((state: any) => {
      const newState: any = {
        enemyGroups: state.enemyGroups.filter((group: EnemyGroup) => group.id !== id),
      };

      if (state.targetEntity && state.targetEntity.type === 'group' && state.targetEntity.id === id) {
        newState.targetEntity = null;
      }

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, newState.enemyGroups);
      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.(false, id, 'group'));

      return newState;
    });
  },

  duplicateGroup: (group: EnemyGroup) => {
    const newGroup: EnemyGroup = {
      ...group,
      id: generateId(),
      name: `${group.name} (Copy)`,
      creatures: group.creatures
        ? group.creatures.map((c) => ({
            ...c,
            id: generateUniqueId(),
          }))
        : Array(group.count)
            .fill(null)
            .map(() => ({
              id: generateUniqueId(),
              currentHp: group.maxHp,
              tempHp: 0,
              isRemoved: false,
            })),
      defenses: normalizeDefenses(group.defenses),
      tempHp: group.tempHp || 0,
    };

    set((state: any) => {
      const updatedGroups = [...state.enemyGroups, newGroup];
      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);
      return { enemyGroups: updatedGroups };
    });

    scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());
  },

  toggleGroupAoeTarget: (id: string) => {
    set((state: any) => {
      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) =>
        group.id === id ? { ...group, inAoe: !group.inAoe } : group
      );
      return { enemyGroups: updatedGroups };
    });
  },

  toggleGroupSavingThrows: (groupId: string) => {
    set((state: any) => {
      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) =>
        group.id === groupId ? { ...group, showSavingThrows: !(group as any).showSavingThrows } : group
      );
      return { enemyGroups: updatedGroups };
    });
  },

  toggleGroupTemplateSavingThrows: () => {
    set((state: any) => ({
      groupTemplate: {
        ...state.groupTemplate,
        showSavingThrows: !state.groupTemplate.showSavingThrows,
      },
    }));
  },

  toggleGroupTemplateDefenses: () => {
    set((state: any) => ({
      groupTemplate: {
        ...state.groupTemplate,
        showDefenses: !state.groupTemplate.showDefenses,
      },
    }));
  },

  setTemporaryHitPointsGroup: (groupId: string, amount: number, replace = true) => {
    set((state: any) => {
      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) => {
        if (group.id !== groupId) return group;

        const newTempHp = setTempHp(amount, group.tempHp || 0, replace);

        return {
          ...group,
          tempHp: newTempHp,
        };
      });

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);
      return { enemyGroups: updatedGroups };
    });
  },

  updateGroupSavingThrow: (groupId: string, ability: SaveType, value: number) => {
    set((state: any) => {
      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) => {
        if (group.id === groupId) {
          return {
            ...group,
            savingThrows: {
              ...(group.savingThrows || normalizeSavingThrows()),
              [ability]: value,
            },
          };
        }
        return group;
      });

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);
      return { enemyGroups: updatedGroups };
    });
  },

  applyDamageToGroup: (groupId: string, damage: number, hitStatus: 'hit' | 'miss' | 'critical') => {
    if (damage <= 0) return;

    set((state: any) => {
      const group = state.enemyGroups.find((g: EnemyGroup) => g.id === groupId);
      if (!group) return state;

      if (hitStatus === 'miss') {
        return state;
      }

      const updatedGroups = state.enemyGroups.map((g: EnemyGroup) => {
        if (g.id !== groupId) return g;

        if (g.creatures && g.creatures.length > 0) {
          const aliveCreatures = g.creatures.filter((c) => !c.isRemoved && c.currentHp > 0);
          if (aliveCreatures.length === 0) return g;

          const targetCreature = aliveCreatures[0];
          const creatureIndex = g.creatures.findIndex((c) => c.id === targetCreature.id);

          const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
            damage,
            targetCreature.currentHp,
            targetCreature.tempHp || 0
          );

          const updatedCreatures = [...g.creatures];
          updatedCreatures[creatureIndex] = {
            ...targetCreature,
            currentHp: newCurrentHp,
            tempHp: newTempHp,
            isRemoved: newCurrentHp <= 0,
          };

          const aliveAfter = updatedCreatures.filter((c) => !c.isRemoved);
          const remainingCount = aliveAfter.filter((c) => c.currentHp > 0).length;
          const totalHp = aliveAfter.reduce((sum, c) => sum + Math.max(c.currentHp, 0), 0);
          const averageHp = aliveAfter.length > 0 ? Math.round(totalHp / aliveAfter.length) : 0;

          return {
            ...g,
            creatures: updatedCreatures,
            count: remainingCount,
            currentHp: averageHp,
          };
        }

        const newHp = Math.max(0, g.currentHp - damage);
        return { ...g, currentHp: newHp };
      });

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);

      const result = createDamageResult(
        damage,
        group.name,
        groupId,
        'group',
        hitStatus
      );

      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());

      return {
        enemyGroups: updatedGroups,
        attackResults: [...state.attackResults, result],
      };
    });
  },

  applyDamageToAllInGroup: (groupId: string, damage: number, percentAffected = 100) => {
    if (damage <= 0) return;

    set((state: any) => {
      const group = state.enemyGroups.find((g: EnemyGroup) => g.id === groupId);
      if (!group) return state;

      const updatedGroups = state.enemyGroups.map((g: EnemyGroup) => {
        if (g.id !== groupId) return g;

        if (g.creatures && g.creatures.length > 0) {
          const aliveCreatures = g.creatures.filter((c) => !c.isRemoved && c.currentHp > 0);
          const affectedCount = Math.ceil((aliveCreatures.length * percentAffected) / 100);

          const updatedCreatures = g.creatures.map((creature) => {
            if (creature.isRemoved || creature.currentHp <= 0) return creature;

            const aliveIndex = aliveCreatures.findIndex((c) => c.id === creature.id);
            if (aliveIndex >= affectedCount) return creature;

            const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
              damage,
              creature.currentHp,
              creature.tempHp || 0
            );

            return {
              ...creature,
              currentHp: newCurrentHp,
              tempHp: newTempHp,
              isRemoved: newCurrentHp <= 0,
            };
          });

          const aliveAfter = updatedCreatures.filter((c) => !c.isRemoved);
          const remainingCount = aliveAfter.filter((c) => c.currentHp > 0).length;
          const totalHp = aliveAfter.reduce((sum, c) => sum + Math.max(c.currentHp, 0), 0);
          const averageHp = aliveAfter.length > 0 ? Math.round(totalHp / aliveAfter.length) : 0;

          return {
            ...g,
            creatures: updatedCreatures,
            count: remainingCount,
            currentHp: averageHp,
          };
        }

        const newHp = Math.max(0, g.currentHp - damage);
        return { ...g, currentHp: newHp };
      });

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);
      scheduleTurnOrderUpdate(() => get().updateTurnOrder?.());

      const affectedText = percentAffected < 100 ? ` (${percentAffected}% affected)` : '';
      const result = createDamageResult(
        damage,
        `${group.name}${affectedText}`,
        groupId,
        'group'
      );

      return {
        enemyGroups: updatedGroups,
        attackResults: [...state.attackResults, result],
      };
    });
  },

  applyDamageToAllGroups: (aoeParams: AoeParams) => {
    const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
    if (damage <= 0) return;

    set((state: any) => {
      const aoeGroups: EnemyGroup[] = state.enemyGroups.filter((group: EnemyGroup) => group.inAoe);
      if (aoeGroups.length === 0) return state;

      const groupResults: any[] = [];

      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) => {
        if (!group.inAoe) return group;

        const entityKey = `group-${group.id}`;
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
          const saveBonus = group.savingThrows?.[saveType] || 0;
          saveRoll = rollD20();
          const computedTotal = saveRoll + saveBonus;
          totalRoll = computedTotal;
          saved = computedTotal >= saveDC;

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        groupResults.push({
          name: group.name,
          saved,
          damageToApply,
          saveRoll,
          totalRoll,
        });

        if (damageToApply <= 0) {
          return { ...group, inAoe: false };
        }

        if (group.creatures && group.creatures.length > 0) {
          const updatedCreatures = group.creatures.map((creature) => {
            if (creature.isRemoved || creature.currentHp <= 0) return creature;

            const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
              damageToApply,
              creature.currentHp,
              creature.tempHp || 0
            );

            return {
              ...creature,
              currentHp: newCurrentHp,
              tempHp: newTempHp,
              isRemoved: newCurrentHp <= 0,
            };
          });

          const aliveAfter = updatedCreatures.filter((c) => !c.isRemoved);
          const remainingCount = aliveAfter.filter((c) => c.currentHp > 0).length;
          const totalHp = aliveAfter.reduce((sum, c) => sum + Math.max(c.currentHp, 0), 0);
          const averageHp = aliveAfter.length > 0 ? Math.round(totalHp / aliveAfter.length) : 0;

          return {
            ...group,
            creatures: updatedCreatures,
            count: remainingCount,
            currentHp: averageHp,
            inAoe: false,
          };
        }

        const newHp = Math.max(0, group.currentHp - damageToApply);
        return {
          ...group,
          currentHp: newHp,
          inAoe: false,
        };
      });

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);

      const groupMessages = groupResults
        .map((result) => {
          let saveText = '';
          if (result.saveRoll !== null) {
            if (result.totalRoll !== null && result.totalRoll !== result.saveRoll) {
              saveText = ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`;
            } else {
              saveText = ` (${result.saveRoll})`;
            }
          }

          return `${result.name}: ${result.saved ? (halfOnSave ? 'Save' + saveText + ' (½ dmg)' : 'Save' + saveText + ' (no dmg)') : 'Failed' + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'}`;
        })
        .join('; ');

      const resultMessage = `AoE: ${damage} ${saveType ? `${saveType.toUpperCase()} save DC ${saveDC}` : 'damage'} to groups - ${groupMessages}`;

      return {
        enemyGroups: updatedGroups,
        attackResults: [
          ...state.attackResults,
          createAoeResult(damage, resultMessage),
        ],
      };
    });
  },

  applyDamageToAllGroupsInAoe: (aoeParams: AoeParams) => {
    get().applyDamageToAllGroups(aoeParams);
  },

  applyDamageToAllGroupsInAoeInternal: (aoeParams: AoeParams) => {
    const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
    if (damage <= 0) return '';

    let resultMessage = '';

    set((state: any) => {
      const aoeGroups: EnemyGroup[] = state.enemyGroups.filter((group: EnemyGroup) => group.inAoe);
      if (aoeGroups.length === 0) return state;

      const groupResults: any[] = [];

      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) => {
        if (!group.inAoe) return group;

        const entityKey = `group-${group.id}`;
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
          const saveBonus = group.savingThrows?.[saveType] || 0;
          saveRoll = rollD20();
          const computedTotal = saveRoll + saveBonus;
          totalRoll = computedTotal;
          saved = computedTotal >= saveDC;

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        groupResults.push({
          name: group.name,
          saved,
          damageToApply,
          saveRoll,
          totalRoll,
        });

        if (damageToApply <= 0) {
          return { ...group, inAoe: false };
        }

        if (group.creatures && group.creatures.length > 0) {
          const updatedCreatures = group.creatures.map((creature) => {
            if (creature.isRemoved || creature.currentHp <= 0) return creature;

            const { newCurrentHp, newTempHp } = applyDamageWithTempHp(
              damageToApply,
              creature.currentHp,
              creature.tempHp || 0
            );

            return {
              ...creature,
              currentHp: newCurrentHp,
              tempHp: newTempHp,
              isRemoved: newCurrentHp <= 0,
            };
          });

          const aliveAfter = updatedCreatures.filter((c) => !c.isRemoved);
          const remainingCount = aliveAfter.filter((c) => c.currentHp > 0).length;
          const totalHp = aliveAfter.reduce((sum, c) => sum + Math.max(c.currentHp, 0), 0);
          const averageHp = aliveAfter.length > 0 ? Math.round(totalHp / aliveAfter.length) : 0;

          return {
            ...group,
            creatures: updatedCreatures,
            count: remainingCount,
            currentHp: averageHp,
            inAoe: false,
          };
        }

        const newHp = Math.max(0, group.currentHp - damageToApply);
        return {
          ...group,
          currentHp: newHp,
          inAoe: false,
        };
      });

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);

      resultMessage = groupResults
        .map((result) => {
          let saveText = '';
          if (result.saveRoll !== null) {
            if (result.totalRoll !== null && result.totalRoll !== result.saveRoll) {
              saveText = ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`;
            } else {
              saveText = ` (${result.saveRoll})`;
            }
          }

          return `${result.name}: ${result.saved ? (halfOnSave ? 'Save' + saveText + ' (½ dmg)' : 'Save' + saveText + ' (no dmg)') : 'Failed' + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'}`;
        })
        .join('; ');

      return { enemyGroups: updatedGroups };
    });

    return resultMessage;
  },

  updateEnemyGroup: (id: string, field: keyof EnemyGroup, value: any) => {
    set((state: any) => {
      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) =>
        group.id === id ? { ...group, [field]: value } : group
      );

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);

      if (field === 'initiative') {
        scheduleTurnOrderUpdate(() => get().updateTurnOrder?.(true));
      }

      return { enemyGroups: updatedGroups };
    });
  },

  rollGroupsAttacks: (groupTargets: GroupTarget[], characterAcOverrides: Record<string, number> = {}) => {
    const state = get();
    const results: AttackResult[] = [];

    groupTargets.forEach((groupTarget) => {
      const group = state.enemyGroups.find((g: EnemyGroup) => g.id === groupTarget.groupId);
      if (!group) return;

      const attackBonus = (group as any).attackBonus || 3;
      const damage = (group as any).damage || { numDice: 1, diceType: 8, modifier: 2, damageType: 'slashing' };

      groupTarget.targets.forEach((target) => {
        const character = state.characters.find((c: any) => c.id === target.characterId);
        if (!character) return;

        const targetAc = characterAcOverrides[target.characterId] ?? character.ac;
        const attackRoll = rollD20();
        const totalAttack = attackRoll + attackBonus;
        const isHit = attackRoll === 20 || (attackRoll !== 1 && totalAttack >= targetAc);
        const isCritical = attackRoll === 20;

        if (isHit) {
          const damageRoll = rollDice(damage.numDice, damage.diceType);
          const totalDamage = isCritical ? (damageRoll + damage.modifier) * 2 : damageRoll + damage.modifier;

          results.push(
            createDamageResult(
              totalDamage,
              character.name,
              target.characterId,
              'character',
              isCritical ? 'critical' : 'hit',
              ` from ${group.name}`
            )
          );
        } else {
          results.push(
            createDamageResult(
              0,
              character.name,
              target.characterId,
              'character',
              'miss',
              ` from ${group.name}`
            )
          );
        }
      });
    });

    set((state: any) => ({
      attackResults: [...state.attackResults, ...results],
    }));
  },

  applyHealingToGroup: (groupId: string, amount: number, transactionId: string | null = null) => {
    const group = get().enemyGroups.find((g: EnemyGroup) => g.id === groupId);
    if (!group || amount <= 0) return;

    set((state: any) => {
      const updatedGroups = state.enemyGroups.map((g: EnemyGroup) => {
        if (g.id !== groupId) return g;

        if (g.creatures && g.creatures.length > 0) {
          const updatedCreatures = g.creatures.map((creature) => {
            if (creature.isRemoved || creature.currentHp >= group.maxHp) return creature;

            const newHp = applyHealing(amount, creature.currentHp, group.maxHp);

            return {
              ...creature,
              currentHp: newHp,
            };
          });

          return {
            ...g,
            creatures: updatedCreatures,
          };
        }

        const newHp = applyHealing(amount, g.currentHp, g.maxHp);
        return { ...g, currentHp: newHp };
      });

      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);

      const healingResult = createHealingResult(
        amount,
        group.name,
        groupId,
        'group',
        transactionId || undefined
      );

      return {
        enemyGroups: updatedGroups,
        attackResults: [...state.attackResults, healingResult],
      };
    });
  },
});

export default createGroupsSlice;


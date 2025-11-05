const savedEnemyGroups = localStorage.getItem('dnd-enemy-groups');

const migrateGroupData = (groups) => {
  if (!Array.isArray(groups)) return [];

  return groups.map((group) => {
    const originalCount = group.originalCount || group.count;

    if (!group.creatures || !Array.isArray(group.creatures)) {
      const creatures = Array(group.count || 0)
        .fill()
        .map(() => ({
          hp: group.currentHp || 0,
        }));

      return {
        ...group,
        creatures,
        originalCount,
      };
    }

    return {
      ...group,
      originalCount,
    };
  });
};

const parsedEnemyGroups = savedEnemyGroups ? JSON.parse(savedEnemyGroups) : [];
const migratedGroups = migrateGroupData(parsedEnemyGroups);

if (savedEnemyGroups) {
  localStorage.setItem('dnd-enemy-groups', JSON.stringify(migratedGroups));
}

const defaultGroupTemplate = {
  name: '',
  maxHp: 10,
  currentHp: 10,
  ac: 12,
  count: 4,
  initiative: 0,
  initiativeModifier: 0,
  showSavingThrows: false,
  savingThrows: {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  },
  creatures: [],
  attackBonus: 3,
  damage: {
    numDice: 1,
    diceType: 8,
    modifier: 2,
    damageType: 'slashing',
  },
};

export const createGroupsSlice = (set, get) => ({
  enemyGroups: migratedGroups,
  groupTemplate: defaultGroupTemplate,

  updateGroupTemplate: (field, value) => {
    set((state) => {
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
    console.log('[Store.addEnemyGroup] template before create', groupTemplate);

    const creatures = Array(groupTemplate.count)
      .fill()
      .map(() => ({
        hp: groupTemplate.maxHp,
      }));

    const newGroup = {
      id: Date.now().toString(),
      name: groupTemplate.name,
      maxHp: groupTemplate.maxHp,
      currentHp: groupTemplate.maxHp,
      ac: groupTemplate.ac,
      count: groupTemplate.count,
      originalCount: groupTemplate.count,
      initiative: groupTemplate.initiative || 0,
      inAoe: false,
      showSavingThrows: false,
      savingThrows: { ...groupTemplate.savingThrows },
      creatures,
      attackBonus: groupTemplate.attackBonus || 3,
      damage: { ...groupTemplate.damage },
    };

    set((state) => {
      const updatedGroups = [...state.enemyGroups, newGroup];
      console.log('[Store.addEnemyGroup] saved', newGroup);
      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
      return { enemyGroups: updatedGroups };
    });

    setTimeout(() => get().updateTurnOrder(), 0);
  },

  addMultipleEnemyGroups: (count) => {
    const { groupTemplate } = get();
    console.log('[Store.addMultipleEnemyGroups] template before create', groupTemplate);
    const newGroups = [];

    for (let i = 0; i < count; i++) {
      newGroups.push({
        id: (Date.now() + i).toString(),
        name: `${groupTemplate.name} ${i + 1}`,
        maxHp: groupTemplate.maxHp,
        currentHp: groupTemplate.maxHp,
        ac: groupTemplate.ac,
        count: groupTemplate.count,
        originalCount: groupTemplate.count,
        initiative: groupTemplate.initiative || 0,
        inAoe: false,
        showSavingThrows: false,
        savingThrows: { ...groupTemplate.savingThrows },
        creatures: Array(groupTemplate.count)
          .fill()
          .map(() => ({
            hp: groupTemplate.maxHp,
          })),
        attackBonus: groupTemplate.attackBonus || 3,
        damage: { ...groupTemplate.damage },
      });
    }

    set((state) => {
      const updatedGroups = [...state.enemyGroups, ...newGroups];
      console.log('[Store.addMultipleEnemyGroups] saved', newGroups);
      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
      return { enemyGroups: updatedGroups };
    });

    setTimeout(() => get().updateTurnOrder(), 0);
  },

  removeEnemyGroup: (id) => {
    set((state) => {
      const newState = { enemyGroups: state.enemyGroups.filter((group) => group.id !== id) };

      if (state.targetEntity && state.targetEntity.type === 'group' && state.targetEntity.id === id) {
        newState.targetEntity = null;
      }

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(newState.enemyGroups));

      setTimeout(() => get().updateTurnOrder(false, id, 'group'), 0);

      return newState;
    });
  },

  duplicateGroup: (group) => {
    const newGroup = {
      ...group,
      id: Date.now().toString(),
      name: `${group.name} (Copy)`,
      originalCount: group.count,
      creatures: group.creatures
        ? [...group.creatures]
        : Array(group.count)
            .fill()
            .map(() => ({
              hp: group.maxHp,
            })),
      attackBonus: group.attackBonus || 3,
      damage:
        group.damage || {
          numDice: 1,
          diceType: 8,
          modifier: 2,
        },
    };

    set((state) => {
      const updatedGroups = [...state.enemyGroups, newGroup];
      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
      return { enemyGroups: updatedGroups };
    });

    setTimeout(() => get().updateTurnOrder(), 0);
  },

  toggleGroupAoeTarget: (id) => {
    set((state) => {
      const updatedGroups = state.enemyGroups.map((group) =>
        group.id === id ? { ...group, inAoe: !group.inAoe } : group
      );
      return { enemyGroups: updatedGroups };
    });
  },

  toggleGroupSavingThrows: (groupId) => {
    set((state) => {
      const updatedGroups = state.enemyGroups.map((group) =>
        group.id === groupId ? { ...group, showSavingThrows: !group.showSavingThrows } : group
      );
      return { enemyGroups: updatedGroups };
    });
  },

  toggleGroupTemplateSavingThrows: () => {
    set((state) => ({
      groupTemplate: {
        ...state.groupTemplate,
        showSavingThrows: !state.groupTemplate.showSavingThrows,
      },
    }));
  },

  updateGroupSavingThrow: (groupId, ability, value) => {
    set((state) => {
      const updatedGroups = state.enemyGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            savingThrows: {
              ...group.savingThrows,
              [ability]: value,
            },
          };
        }
        return group;
      });

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
      return { enemyGroups: updatedGroups };
    });
  },

  applyDamageToGroup: (groupId, damage, hitStatus) => {
    if (damage <= 0) return;

    set((state) => {
      const group = state.enemyGroups.find((g) => g.id === groupId);
      if (!group) return state;

      if (hitStatus === 'miss') {
        return {
          attackResults: [
            ...state.attackResults,
            {
              id: Date.now().toString(),
              groupId,
              damage: 0,
              hitStatus,
              message: 'Miss!',
              timestamp: Date.now(),
            },
          ],
        };
      }

      let updatedGroup = { ...group };
      let killCount = 0;
      let remainingDamage = damage;

      if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
        updatedGroup.creatures = Array(updatedGroup.count)
          .fill()
          .map(() => ({
            hp: updatedGroup.currentHp,
          }));
      }

      updatedGroup.creatures.sort((a, b) => a.hp - b.hp);

      const survivingCreatures = [];
      const creaturesLeftToProcess = [...updatedGroup.creatures];

      while (remainingDamage > 0 && creaturesLeftToProcess.length > 0) {
        const currentCreature = creaturesLeftToProcess.shift();

        if (remainingDamage >= currentCreature.hp) {
          killCount++;
          remainingDamage -= currentCreature.hp;
        } else {
          currentCreature.hp -= remainingDamage;
          survivingCreatures.push(currentCreature);
          remainingDamage = 0;
        }
      }

      survivingCreatures.push(...creaturesLeftToProcess);

      updatedGroup.creatures = survivingCreatures;
      updatedGroup.count = survivingCreatures.length;

      if (updatedGroup.creatures.length > 0) {
        const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
        updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
      }

      const isGroupDefeated = updatedGroup.count === 0;

      let updatedGroups;
      if (isGroupDefeated) {
        updatedGroups = state.enemyGroups.filter((g) => g.id !== groupId);

        if (
          state.targetEntity &&
          state.targetEntity.type === 'group' &&
          state.targetEntity.id === groupId
        ) {
          state.targetEntity = null;
        }
      } else {
        updatedGroups = state.enemyGroups.map((g) => (g.id === groupId ? updatedGroup : g));
      }

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

      const resultMessage =
        hitStatus === 'critical'
          ? `Critical hit! ${damage} damage to ${group.name} (${killCount} killed)`
          : `Hit! ${damage} damage to ${group.name} (${killCount} killed)`;

      if (isGroupDefeated) {
        setTimeout(() => get().updateTurnOrder(false, groupId, 'group'), 0);
      } else {
        setTimeout(() => get().updateTurnOrder(), 0);
      }

      return {
        enemyGroups: updatedGroups,
        attackResults: [
          ...state.attackResults,
          {
            id: Date.now().toString(),
            groupId,
            damage,
            hitStatus,
            message: resultMessage,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  applyDamageToAllInGroup: (groupId, damage, percentAffected = 100) => {
    if (damage <= 0) return;

    set((state) => {
      const group = state.enemyGroups.find((g) => g.id === groupId);
      if (!group) return state;

      const affectedCount = Math.ceil(group.count * (percentAffected / 100));
      if (affectedCount <= 0) return state;

      let updatedGroup = { ...group };
      let killCount = 0;

      if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
        updatedGroup.creatures = Array(updatedGroup.count)
          .fill()
          .map(() => ({
            hp: updatedGroup.currentHp,
          }));
      }

      updatedGroup.creatures.sort((a, b) => a.hp - b.hp);

      const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
      const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);

      const survivingCreatures = affectedCreatures.filter((creature) => {
        if (damage >= creature.hp) {
          killCount++;
          return false;
        }
        creature.hp -= damage;
        return true;
      });

      updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
      updatedGroup.count = updatedGroup.creatures.length;

      if (updatedGroup.creatures.length > 0) {
        const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
        updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
      }

      const updatedGroups = state.enemyGroups.map((g) => (g.id === groupId ? updatedGroup : g));

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

      return {
        enemyGroups: updatedGroups,
        attackResults: [
          ...state.attackResults,
          {
            id: Date.now().toString(),
            groupId,
            damage: damage * affectedCount,
            message: `${damage} damage to ${affectedCount} creatures in ${group.name} (${killCount} killed)`,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  applyDamageToAllGroups: (aoeParams) => {
    const { damage, saveType, saveDC, halfOnSave, percentAffected = 100 } = aoeParams;
    if (damage <= 0) return;

    set((state) => {
      let globalKillCount = 0;

      const updatedGroups = state.enemyGroups.map((group) => {
        const saveBonus = group.savingThrows?.[saveType] || 0;
        const saveRoll = Math.floor(Math.random() * 20) + 1 + saveBonus;
        const saved = saveRoll >= saveDC;

        let damageToApply = damage;
        if (saved && halfOnSave) {
          damageToApply = Math.floor(damage / 2);
        } else if (saved && !halfOnSave) {
          damageToApply = 0;
        }

        const affectedCount = Math.ceil(group.count * (percentAffected / 100));
        if (affectedCount <= 0 || damageToApply <= 0) return group;

        let updatedGroup = { ...group };
        let totalKillCount = 0;

        if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
          updatedGroup.creatures = Array(updatedGroup.count)
            .fill()
            .map(() => ({
              hp: updatedGroup.currentHp,
            }));
        }

        updatedGroup.creatures.sort((a, b) => a.hp - b.hp);

        const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
        const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);

        const survivingCreatures = affectedCreatures.filter((creature) => {
          if (damageToApply >= creature.hp) {
            totalKillCount++;
            return false;
          }
          creature.hp -= damageToApply;
          return true;
        });

        updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
        updatedGroup.count = updatedGroup.creatures.length;

        if (updatedGroup.creatures.length > 0) {
          const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
          updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
        }

        globalKillCount += totalKillCount;

        return updatedGroup;
      });

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

      return {
        enemyGroups: updatedGroups,
        attackResults: [
          ...state.attackResults,
          {
            id: Date.now().toString(),
            damage,
            message: `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC} to all groups (${percentAffected}% affected)${globalKillCount > 0 ? ` - Total kills: ${globalKillCount}` : ''}`,
            isAoE: true,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  applyDamageToAllGroupsInAoe: (aoeParams) => {
    const {
      damage,
      saveType,
      saveDC,
      halfOnSave,
      percentAffected = 100,
      entityDamageModifiers = {},
    } = aoeParams;
    if (damage <= 0) return;

    set((state) => {
      const aoeGroups = state.enemyGroups.filter((group) => group.inAoe);
      console.log('Groups marked for AoE:', aoeGroups.map((g) => g.name));

      if (aoeGroups.length === 0) {
        console.log('No groups marked for AoE');
        return state;
      }

      let totalKillCount = 0;
      const groupResults = [];

      const updatedGroups = state.enemyGroups.map((group) => {
        if (!group.inAoe) return group;

        console.log(`Processing AoE damage for group: ${group.name}`);

        const entityKey = `group-${group.id}`;
        const customEntityInfo = entityDamageModifiers[entityKey];

        let saved = false;
        let damageToApply = damage;
        let saveRoll = null;
        let totalRoll = null;

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
        } else {
          const saveBonus = group.savingThrows?.[saveType] || 0;
          saveRoll = Math.floor(Math.random() * 20) + 1;
          totalRoll = saveRoll + saveBonus;
          saved = totalRoll >= saveDC;
          console.log(`${group.name} save roll: ${totalRoll} vs DC ${saveDC} - ${saved ? 'Saved' : 'Failed'}`);

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        const affectedCount = Math.ceil(group.count * (percentAffected / 100));
        console.log(`${group.name} affected count: ${affectedCount} out of ${group.count} (${percentAffected}%)`);

        if (affectedCount <= 0 || damageToApply <= 0) {
          groupResults.push({
            name: group.name,
            saved,
            damageToApply: 0,
            killCount: 0,
            saveRoll,
            totalRoll,
          });
          return group;
        }

        let updatedGroup = { ...group };
        let killCount = 0;

        if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
          updatedGroup.creatures = Array(updatedGroup.count)
            .fill()
            .map(() => ({
              hp: updatedGroup.currentHp,
            }));
        }

        updatedGroup.creatures.sort((a, b) => a.hp - b.hp);

        const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
        const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);

        const survivingCreatures = affectedCreatures.filter((creature) => {
          if (damageToApply >= creature.hp) {
            killCount++;
            return false;
          }
          creature.hp -= damageToApply;
          return true;
        });

        updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
        updatedGroup.count = updatedGroup.creatures.length;

        if (updatedGroup.creatures.length > 0) {
          const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
          updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
        }

        totalKillCount += killCount;

        groupResults.push({
          name: group.name,
          saved,
          damageToApply,
          killCount,
          saveRoll,
          totalRoll,
        });

        return updatedGroup;
      });

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

      const groupMessages = groupResults
        .map(
          (result) =>
            `${result.name}: ${result.saved ? (halfOnSave ? 'Save (½ dmg)' : 'Save (no dmg)') : 'Failed Save'}, ${
              result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'
            }${result.killCount > 0 ? `, ${result.killCount} killed` : ''}`
        )
        .join('; ');

      return {
        enemyGroups: updatedGroups,
        attackResults: [
          ...state.attackResults,
          {
            id: Date.now().toString(),
            damage,
            message: `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC} (${percentAffected}% affected) to groups - ${groupMessages}${
              totalKillCount > 0 ? ` - Total kills: ${totalKillCount}` : ''
            }`,
            isAoE: true,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  applyDamageToAllGroupsInAoeInternal: (aoeParams) => {
    const {
      damage,
      saveType,
      saveDC,
      halfOnSave,
      percentAffected = 100,
      entityDamageModifiers = {},
    } = aoeParams;
    if (damage <= 0) return '';

    let resultMessage = '';
    let totalKillCount = 0;

    set((state) => {
      const aoeGroups = aoeParams.applyToAll
        ? state.enemyGroups
        : state.enemyGroups.filter((group) => group.inAoe);

      if (aoeGroups.length === 0) {
        return state;
      }

      const groupResults = [];

      const updatedGroups = state.enemyGroups.map((group) => {
        if (!aoeParams.applyToAll && !group.inAoe) return group;

        const entityKey = `group-${group.id}`;
        const customEntityInfo = entityDamageModifiers[entityKey];

        let saved = false;
        let damageToApply = damage;
        let saveRoll = null;
        let totalRoll = null;

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
        } else {
          const saveBonus = group.savingThrows?.[saveType] || 0;
          saveRoll = Math.floor(Math.random() * 20) + 1;
          totalRoll = saveRoll + saveBonus;
          saved = totalRoll >= saveDC;

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        const affectedCount = Math.ceil(group.count * (percentAffected / 100));

        if (affectedCount <= 0 || damageToApply <= 0) {
          groupResults.push({
            name: group.name,
            saved,
            damageToApply: 0,
            killCount: 0,
            saveRoll,
            totalRoll,
          });
          return group;
        }

        let updatedGroup = { ...group };
        let killCount = 0;

        if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
          updatedGroup.creatures = Array(updatedGroup.count)
            .fill()
            .map(() => ({
              hp: updatedGroup.currentHp,
            }));
        }

        updatedGroup.creatures.sort((a, b) => a.hp - b.hp);

        const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
        const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);

        const survivingCreatures = affectedCreatures.filter((creature) => {
          if (damageToApply >= creature.hp) {
            killCount++;
            return false;
          }
          creature.hp -= damageToApply;
          return true;
        });

        updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
        updatedGroup.count = updatedGroup.creatures.length;

        if (updatedGroup.creatures.length > 0) {
          const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
          updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
        }

        totalKillCount += killCount;

        groupResults.push({
          name: group.name,
          saved,
          damageToApply,
          killCount,
          saveRoll,
          totalRoll,
        });

        return updatedGroup;
      });

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

      resultMessage = groupResults
        .map(
          (result) =>
            `${result.name}: ${result.saved ? (halfOnSave ? 'Save (½ dmg)' : 'Save (no dmg)') : 'Failed Save'}, ${
              result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'
            }${result.killCount > 0 ? `, ${result.killCount} killed` : ''}`
        )
        .join('; ');

      if (totalKillCount > 0) {
        resultMessage += `; Total kills: ${totalKillCount}`;
      }

      return { enemyGroups: updatedGroups };
    });

    return resultMessage;
  },

  updateEnemyGroup: (id, field, value) => {
    set((state) => {
      const updatedGroups = state.enemyGroups.map((group) => {
        if (group.id === id) {
          if (field === null && typeof value === 'object') {
            return value;
          }
          return { ...group, [field]: value };
        }
        return group;
      });

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

      if (field === 'initiative') {
        setTimeout(() => get().updateTurnOrder(true), 0);
      } else {
        setTimeout(() => get().updateTurnOrder(), 0);
      }

      return { enemyGroups: updatedGroups };
    });
  },

  rollGroupsAttacks: (groupTargets, characterAcOverrides = {}) => {
    const results = {};
    let allResults = [];

    if (!groupTargets || typeof groupTargets !== 'object') {
      console.error('Invalid groupTargets parameter:', groupTargets);
      return { results: {}, allResults: [] };
    }

    const groups = get().enemyGroups || [];
    const characters = get().characters || [];

    groups.forEach((group) => {
      if (!group || !group.id) return;

      const targetCharacterId = groupTargets[group.id];
      if (!targetCharacterId) return;

      const targetCharacter = characters.find((c) => c.id === targetCharacterId);
      if (!targetCharacter) return;

      const targetAc =
        characterAcOverrides && characterAcOverrides[targetCharacterId]
          ? characterAcOverrides[targetCharacterId]
          : targetCharacter.ac;

      const attackBonus = group.attackBonus || 3;
      const damageDetails = group.damage || { numDice: 1, diceType: 8, modifier: 2 };
      const { numDice, diceType, modifier } = damageDetails;

      const groupResults = [];
      let totalDamage = 0;

      const count = typeof group.count === 'number' ? group.count : 0;
      for (let i = 0; i < count; i++) {
        const attackRollBase = get().rollD20();
        const isNatural20 = attackRollBase === 20;
        const isNatural1 = attackRollBase === 1;
        const totalAttackRoll = attackRollBase + attackBonus;
        const hits = isNatural20 || (!isNatural1 && totalAttackRoll >= targetAc);

        let damage = 0;
        if (hits) {
          const diceDamage = get().rollDice(numDice, diceType);
          const criticalDiceDamage = isNatural20 ? get().rollDice(numDice, diceType) : 0;
          damage = diceDamage + criticalDiceDamage + modifier;
          totalDamage += damage;
        }

        groupResults.push({
          entityNumber: i + 1,
          attackRoll: totalAttackRoll,
          attackRollBase,
          isNatural20,
          isNatural1,
          hits,
          damage,
        });
      }

      if (groupResults.length > 0) {
        results[group.id] = {
          results: groupResults,
          totalDamage,
          targetName: targetCharacter.name || 'Unknown',
          targetAc,
          targetId: targetCharacterId,
          damageType: damageDetails.damageType || 'slashing',
        };

        allResults.push({
          characterId: targetCharacterId,
          sourceGroupId: group.id,
          groupName: group.name || 'Group',
          damage: totalDamage,
          damageType: damageDetails.damageType || 'slashing',
          hitStatus: groupResults.some((r) => r.isNatural20) ? 'critical' : 'hit',
          attackRolls: groupResults,
          hitCount: groupResults.filter((r) => r.hits).length,
        });
      }
    });

    return { results, allResults };
  },

  applyHealingToGroup: (groupId, amount, transactionId = null) => {
    const group = get().enemyGroups.find((g) => g.id === groupId);
    if (!group || !group.creatures || amount <= 0) return;

    const updatedGroup = { ...group };
    const updatedCreatures = [...group.creatures];

    updatedCreatures.sort((a, b) => {
      if (a.hp === 0) return 1;
      if (b.hp === 0) return -1;
      return a.hp - b.hp;
    });

    let remainingHealing = amount;
    let healedCreatureCount = 0;

    for (let i = 0; i < updatedCreatures.length && remainingHealing > 0; i++) {
      const creature = updatedCreatures[i];

      if (creature.hp === 0) continue;

      const missingHP = group.maxHp - creature.hp;

      if (missingHP > 0) {
        const healingToApply = Math.min(remainingHealing, missingHP);
        creature.hp += healingToApply;
        remainingHealing -= healingToApply;
        healedCreatureCount++;
      }
    }

    updatedGroup.creatures = updatedCreatures;

    const totalHP = updatedCreatures.reduce((sum, creature) => sum + creature.hp, 0);
    updatedGroup.currentHp = Math.round(totalHP / updatedCreatures.length);

    const healingId = transactionId || Date.now().toString();

    set((state) => {
      const updatedGroups = state.enemyGroups.map((g) => (g.id === groupId ? updatedGroup : g));

      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

      return {
        enemyGroups: updatedGroups,
        attackResults: [
          ...state.attackResults,
          {
            id: `${healingId}-${groupId}`,
            groupId,
            healing: amount,
            message: `Healing! ${amount} healing to ${healedCreatureCount} creatures in ${group.name}`,
            isHealing: true,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },
});

export default createGroupsSlice;


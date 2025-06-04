import { create } from 'zustand';

const useDnDStore = create((set, get) => {
  // Load data from localStorage or use defaults
  const savedCharacters = localStorage.getItem('dnd-characters');
  const savedBosses = localStorage.getItem('dnd-bosses');
  const savedEnemyGroups = localStorage.getItem('dnd-enemy-groups');
  const savedTurnOrder = localStorage.getItem('dnd-turn-order');

  // Function to ensure each group has a creatures array
  const migrateGroupData = (groups) => {
    if (!Array.isArray(groups)) return [];
    
    return groups.map(group => {
      // Add originalCount if not present
      const originalCount = group.originalCount || group.count;
      
      if (!group.creatures || !Array.isArray(group.creatures)) {
        // Create creatures array based on count and currentHp
        const creatures = Array(group.count || 0).fill().map(() => ({
          hp: group.currentHp || 0
        }));
        
        return {
          ...group,
          creatures,
          originalCount
        };
      }
      return {
        ...group,
        originalCount
      };
    });
  };
  
  // Migrate any existing group data
  const migratedGroups = migrateGroupData(savedEnemyGroups ? JSON.parse(savedEnemyGroups) : []);
  
  // Save migrated data back to localStorage
  if (savedEnemyGroups) {
    localStorage.setItem('dnd-enemy-groups', JSON.stringify(migratedGroups));
  }

  return {
    // State
    characters: savedCharacters ? JSON.parse(savedCharacters) : [],
    bosses: savedBosses ? JSON.parse(savedBosses) : [],
    enemyGroups: migratedGroups,
    attackResults: [],
    
    // Turn order tracking
    turnOrder: savedTurnOrder ? JSON.parse(savedTurnOrder) : [],
    currentTurnIndex: 0,
    
    targetEntity: null, // { type: 'group'|'boss'|'character', id: 'some-id' }
    
    expandedSections: {
      characters: true,
      bosses: true,
      groups: true,
      damage: true,
      results: true,
      turnOrder: true,
    },
    
    // Templates
    groupTemplate: {
      name: '',
      maxHp: 10,
      currentHp: 10,
      ac: 12,
      count: 4,
      initiative: 0,
      showSavingThrows: false,
      savingThrows: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0
      },
      creatures: [], // Will hold individual creature HPs
      attackBonus: 3, // Attack bonus for the group
      damage: {      // Damage configuration
        numDice: 1,
        diceType: 8,
        modifier: 2,
        damageType: 'slashing' // Default damage type
      }
    },
    
    bossTemplate: {
      name: '',
      maxHp: 100,
      currentHp: 100,
      ac: 15,
      initiative: 0,
      notes: '',
      attacks: [],
      showSavingThrows: false,
      savingThrows: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0
      }
    },
    
    // References for scrolling
    damageApplicationRef: null,
    charactersSectionRef: null,
    bossesSectionRef: null,
    groupsSectionRef: null,
    entityRefs: {}, // For individual entities (groups, bosses, characters)
    
    // Actions
    // Character actions
    addCharacter: (character) => {
      const newChar = {
        id: Date.now().toString(),
        name: character.name || '',
        maxHp: character.maxHp || 0,
        currentHp: character.currentHp || 0,
        ac: character.ac || 0,
        initiative: character.initiative || 0,
        inAoe: false
      };
      
      set(state => {
        const updatedCharacters = [...state.characters, newChar];
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        return { characters: updatedCharacters };
      });
      
      // Update turn order after adding a character
      setTimeout(() => get().updateTurnOrder(), 0);
    },
    
    updateCharacter: (id, field, value) => {
      set(state => {
        const updatedCharacters = state.characters.map(char => {
          if (char.id === id) {
            return { ...char, [field]: value };
          }
          return char;
        });
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        
        // If initiative was updated, update the turn order
        if (field === 'initiative') {
          setTimeout(() => get().updateTurnOrder(true), 0);
        }
        
        return { characters: updatedCharacters };
      });
    },
    
    removeCharacter: (id) => {
      set(state => {
        // Also remove target if this character was targeted
        const newState = { characters: state.characters.filter(char => char.id !== id) };
        
        if (state.targetEntity && state.targetEntity.type === 'character' && state.targetEntity.id === id) {
          newState.targetEntity = null;
        }
        
        localStorage.setItem('dnd-characters', JSON.stringify(newState.characters));
        
        // Update turn order after removing a character
        setTimeout(() => get().updateTurnOrder(false, id, 'character'), 0);
        
        return newState;
      });
    },
    
    resetCharacters: () => {
      set(state => {
        const updatedCharacters = state.characters.map(char => ({
          ...char,
          currentHp: char.maxHp
        }));
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        return { characters: updatedCharacters };
      });
    },
    
    // Boss actions
    addBoss: (boss) => {
      const newBoss = {
        ...boss,
        id: boss.id || Date.now().toString(),
        inAoe: false,
        showSavingThrows: boss.showSavingThrows || false,
        savingThrows: boss.savingThrows || {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          wis: 0,
          cha: 0
        },
        attackResults: []
      };
      
      set(state => {
        const updatedBosses = [...state.bosses, newBoss];
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        return { bosses: updatedBosses };
      });
      
      // Update turn order after adding a boss
      setTimeout(() => get().updateTurnOrder(), 0);
    },
    
    removeBoss: (id) => {
      set(state => {
        // Also remove target if this boss was targeted
        const newState = { bosses: state.bosses.filter(boss => boss.id !== id) };
        
        if (state.targetEntity && state.targetEntity.type === 'boss' && state.targetEntity.id === id) {
          newState.targetEntity = null;
        }
        
        localStorage.setItem('dnd-bosses', JSON.stringify(newState.bosses));
        
        // Update turn order after removing a boss
        setTimeout(() => get().updateTurnOrder(false, id, 'boss'), 0);
        
        return newState;
      });
    },
    
    updateBoss: (id, field, value) => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === id) {
            return { ...boss, [field]: value };
          }
          return boss;
        });
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        // If initiative was updated, update the turn order
        if (field === 'initiative') {
          setTimeout(() => get().updateTurnOrder(true), 0);
        }
        
        return { bosses: updatedBosses };
      });
    },
    
    updateBossHp: (id, change) => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === id) {
            const newHp = Math.max(0, Math.min(boss.currentHp + change, boss.maxHp));
            return { ...boss, currentHp: newHp };
          }
          return boss;
        });
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        // Update turn order to reflect HP changes
        setTimeout(() => get().updateTurnOrder(false), 0);
        
        return { bosses: updatedBosses };
      });
    },
    
    resetBossesHealth: () => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => ({
          ...boss,
          currentHp: boss.maxHp
        }));
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        return { bosses: updatedBosses };
      });
    },
    
    clearAllBosses: () => {
      localStorage.removeItem('dnd-bosses');
      set({ bosses: [] });
    },
    
    toggleBossAoeTarget: (id) => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === id) {
            return { ...boss, inAoe: !boss.inAoe };
          }
          return boss;
        });
        return { bosses: updatedBosses };
      });
    },
    
    addBossAttackResult: (bossId, result) => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === bossId) {
            const attackResults = [...(boss.attackResults || []), result];
            return { ...boss, attackResults };
          }
          return boss;
        });
        return { 
          bosses: updatedBosses, 
          attackResults: [...state.attackResults, { ...result, bossId, timestamp: Date.now() }]
        };
      });
    },
    
    toggleBossSavingThrows: (bossId) => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === bossId) {
            return { ...boss, showSavingThrows: !boss.showSavingThrows };
          }
          return boss;
        });
        return { bosses: updatedBosses };
      });
    },
    
    toggleBossTemplateSavingThrows: () => {
      set(state => ({
        bossTemplate: { 
          ...state.bossTemplate,
          showSavingThrows: !state.bossTemplate.showSavingThrows 
        }
      }));
    },
    
    updateBossSavingThrow: (bossId, ability, value) => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === bossId) {
            return { 
              ...boss,
              savingThrows: {
                ...boss.savingThrows,
                [ability]: value
              }
            };
          }
          return boss;
        });
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        return { bosses: updatedBosses };
      });
    },
    
    // Group actions
    updateGroupTemplate: (field, value) => {
      set(state => {
        // Handle nested fields like savingThrows.str
        if (field.includes('.')) {
          const [parentField, childField] = field.split('.');
          return {
            groupTemplate: {
              ...state.groupTemplate,
              [parentField]: {
                ...state.groupTemplate[parentField],
                [childField]: value
              }
            }
          };
        }
        
        return {
          groupTemplate: {
            ...state.groupTemplate,
            [field]: value
          }
        };
      });
    },
    
    addEnemyGroup: () => {
      const { groupTemplate } = get();
      
      // Initialize individual creature HPs
      const creatures = Array(groupTemplate.count).fill().map(() => ({
        hp: groupTemplate.maxHp
      }));
      
      const newGroup = {
        id: Date.now().toString(),
        name: groupTemplate.name,
        maxHp: groupTemplate.maxHp,
        currentHp: groupTemplate.maxHp,
        ac: groupTemplate.ac,
        count: groupTemplate.count,
        originalCount: groupTemplate.count, // Track original count
        initiative: groupTemplate.initiative || 0,
        inAoe: false,
        showSavingThrows: false,
        savingThrows: { ...groupTemplate.savingThrows },
        creatures: creatures,
        attackBonus: groupTemplate.attackBonus || 3,
        damage: { ...groupTemplate.damage }
      };
      
      set(state => {
        const updatedGroups = [...state.enemyGroups, newGroup];
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        return { enemyGroups: updatedGroups };
      });
      
      // Update turn order after adding a group
      setTimeout(() => get().updateTurnOrder(), 0);
    },
    
    addMultipleEnemyGroups: (count) => {
      const { groupTemplate } = get();
      const newGroups = [];
      
      for (let i = 0; i < count; i++) {
        newGroups.push({
          id: (Date.now() + i).toString(),
          name: `${groupTemplate.name} ${i + 1}`,
          maxHp: groupTemplate.maxHp,
          currentHp: groupTemplate.maxHp,
          ac: groupTemplate.ac,
          count: groupTemplate.count,
          originalCount: groupTemplate.count, // Track original count
          initiative: groupTemplate.initiative || 0,
          inAoe: false,
          showSavingThrows: false,
          savingThrows: { ...groupTemplate.savingThrows },
          creatures: Array(groupTemplate.count).fill().map(() => ({
            hp: groupTemplate.maxHp
          })),
          attackBonus: groupTemplate.attackBonus || 3,
          damage: { ...groupTemplate.damage }
        });
      }
      
      set(state => {
        const updatedGroups = [...state.enemyGroups, ...newGroups];
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        return { enemyGroups: updatedGroups };
      });
      
      // Update turn order after adding multiple groups
      setTimeout(() => get().updateTurnOrder(), 0);
    },
    
    removeEnemyGroup: (id) => {
      set(state => {
        // Also remove target if this group was targeted
        const newState = { enemyGroups: state.enemyGroups.filter(group => group.id !== id) };
        
        if (state.targetEntity && state.targetEntity.type === 'group' && state.targetEntity.id === id) {
          newState.targetEntity = null;
        }
        
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(newState.enemyGroups));
        
        // Update turn order after removing a group
        setTimeout(() => get().updateTurnOrder(false, id, 'group'), 0);
        
        return newState;
      });
    },
    
    duplicateGroup: (group) => {
      const newGroup = {
        ...group,
        id: Date.now().toString(),
        name: `${group.name} (Copy)`,
        originalCount: group.count, // Use current count as original for the copy
        creatures: group.creatures ? [...group.creatures] : Array(group.count).fill().map(() => ({
          hp: group.maxHp
        })),
        attackBonus: group.attackBonus || 3,
        damage: group.damage || {
          numDice: 1,
          diceType: 8,
          modifier: 2
        }
      };
      
      set(state => {
        const updatedGroups = [...state.enemyGroups, newGroup];
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        return { enemyGroups: updatedGroups };
      });
      
      // Update turn order after duplicating a group
      setTimeout(() => get().updateTurnOrder(), 0);
    },
    
    toggleGroupAoeTarget: (id) => {
      set(state => {
        const updatedGroups = state.enemyGroups.map(group => {
          if (group.id === id) {
            return { ...group, inAoe: !group.inAoe };
          }
          return group;
        });
        return { enemyGroups: updatedGroups };
      });
    },
    
    toggleGroupSavingThrows: (groupId) => {
      set(state => {
        const updatedGroups = state.enemyGroups.map(group => {
          if (group.id === groupId) {
            return { ...group, showSavingThrows: !group.showSavingThrows };
          }
          return group;
        });
        return { enemyGroups: updatedGroups };
      });
    },
    
    toggleGroupTemplateSavingThrows: () => {
      set(state => ({
        groupTemplate: { 
          ...state.groupTemplate,
          showSavingThrows: !state.groupTemplate.showSavingThrows 
        }
      }));
    },
    
    updateGroupSavingThrow: (groupId, ability, value) => {
      set(state => {
        const updatedGroups = state.enemyGroups.map(group => {
          if (group.id === groupId) {
            return { 
              ...group,
              savingThrows: {
                ...group.savingThrows,
                [ability]: value
              }
            };
          }
          return group;
        });
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        return { enemyGroups: updatedGroups };
      });
    },
    
    // Damage application
    applyDamageToGroup: (groupId, damage, hitStatus) => {
      if (damage <= 0) return;
      
      set(state => {
        // Get the group to be damaged
        const group = state.enemyGroups.find(g => g.id === groupId);
        if (!group) return state;
        
        // If missed, no damage
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
                timestamp: Date.now()
              }
            ]
          };
        }
        
        let updatedGroup = { ...group };
        let killCount = 0;
        let remainingDamage = damage;
        
        // Ensure creatures array exists
        if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
          // Initialize with current HP if no creatures array exists
          updatedGroup.creatures = Array(updatedGroup.count).fill().map(() => ({
            hp: updatedGroup.currentHp
          }));
        }
        
        // Sort creatures by HP (ascending) to damage lowest HP first
        updatedGroup.creatures.sort((a, b) => a.hp - b.hp);
        
        // Apply damage to creatures until all damage is used up or all creatures are dead
        const survivingCreatures = [];
        let creaturesLeftToProcess = [...updatedGroup.creatures];
        
        // Process creatures one by one, carrying over excess damage
        while (remainingDamage > 0 && creaturesLeftToProcess.length > 0) {
          const currentCreature = creaturesLeftToProcess.shift();
          
          // If remaining damage is enough to kill the creature
          if (remainingDamage >= currentCreature.hp) {
            killCount++;
            // Subtract creature's HP from remaining damage (the excess flows to the next creature)
            remainingDamage -= currentCreature.hp;
          } else {
            // Creature survives with reduced HP
            currentCreature.hp -= remainingDamage;
            survivingCreatures.push(currentCreature);
            remainingDamage = 0; // All damage has been applied
          }
        }
        
        // Add any unprocessed creatures to surviving creatures
        survivingCreatures.push(...creaturesLeftToProcess);
        
        // Update the group with the surviving creatures
        updatedGroup.creatures = survivingCreatures;
        updatedGroup.count = survivingCreatures.length;
        
        // Update currentHp to represent the average HP in the group
        if (updatedGroup.creatures.length > 0) {
          const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
          updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
        }
        
        // Check if the group is completely defeated
        const isGroupDefeated = updatedGroup.count === 0;
        
        // Create the updated groups array - remove the group if it's defeated
        let updatedGroups;
        if (isGroupDefeated) {
          updatedGroups = state.enemyGroups.filter(g => g.id !== groupId);
          
          // If this group was targeted, clear the target
          if (state.targetEntity && state.targetEntity.type === 'group' && state.targetEntity.id === groupId) {
            state.targetEntity = null;
          }
        } else {
          updatedGroups = state.enemyGroups.map(g => {
            if (g.id === groupId) {
              return updatedGroup;
            }
            return g;
          });
        }
        
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        
        // Generate appropriate message
        const resultMessage = hitStatus === 'critical'
          ? `Critical hit! ${damage} damage to ${group.name} (${killCount} killed)`
          : `Hit! ${damage} damage to ${group.name} (${killCount} killed)`;
        
        // If the group was defeated, update turn order after state update but don't reset
        if (isGroupDefeated) {
          setTimeout(() => get().updateTurnOrder(false, groupId, 'group'), 0);
        } else {
          // Update turn order to refresh HP information in initiative table
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
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    applyDamageToAllInGroup: (groupId, damage, percentAffected = 100) => {
      if (damage <= 0) return;
      
      set(state => {
        const group = state.enemyGroups.find(g => g.id === groupId);
        if (!group) return state;
        
        // Calculate number of affected creatures (rounded up)
        const affectedCount = Math.ceil(group.count * (percentAffected / 100));
        if (affectedCount <= 0) return state;
        
        let updatedGroup = { ...group };
        let killCount = 0;
        
        // Ensure creatures array exists
        if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
          // Initialize with current HP if no creatures array exists
          updatedGroup.creatures = Array(updatedGroup.count).fill().map(() => ({
            hp: updatedGroup.currentHp
          }));
        }
        
        // Sort creatures by HP (ascending) to damage lowest HP first
        updatedGroup.creatures.sort((a, b) => a.hp - b.hp);
        
        // Select the affected creatures (take the lowest HP ones first)
        const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
        const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);
        
        // Apply damage to each affected creature
        const survivingCreatures = affectedCreatures.filter(creature => {
          if (damage >= creature.hp) {
            killCount++;
            return false; // Remove killed creature
          } else {
            creature.hp -= damage;
            return true; // Keep damaged creature
          }
        });
        
        // Update the group with remaining creatures
        updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
        updatedGroup.count = updatedGroup.creatures.length;
        
        // Update currentHp to represent the average HP in the group
        if (updatedGroup.creatures.length > 0) {
          const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
          updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
        }
        
        const updatedGroups = state.enemyGroups.map(g => {
          if (g.id === groupId) {
            return updatedGroup;
          }
          return g;
        });
        
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
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    applyDamageToAllGroups: (aoeParams) => {
      const { damage, saveType, saveDC, halfOnSave, percentAffected = 100 } = aoeParams;
      if (damage <= 0) return;
      
      set(state => {
        let globalKillCount = 0; // Track total kills across all groups
        
        const updatedGroups = state.enemyGroups.map(group => {
          // Calculate save bonus for this group
          const saveBonus = group.savingThrows?.[saveType] || 0;
          
          // Roll save
          const saveRoll = Math.floor(Math.random() * 20) + 1 + saveBonus;
          const saved = saveRoll >= saveDC;
          
          // Calculate damage based on save
          let damageToApply = damage;
          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
          
          // Calculate number of affected creatures (rounded up)
          const affectedCount = Math.ceil(group.count * (percentAffected / 100));
          if (affectedCount <= 0 || damageToApply <= 0) return group;
          
          let updatedGroup = { ...group };
          let totalKillCount = 0;
          
          // Ensure creatures array exists
          if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
            // Initialize with current HP if no creatures array exists
            updatedGroup.creatures = Array(updatedGroup.count).fill().map(() => ({
              hp: updatedGroup.currentHp
            }));
          }
          
          // Sort creatures by HP (ascending) to damage lowest HP first
          updatedGroup.creatures.sort((a, b) => a.hp - b.hp);
          
          // Select the affected creatures (take the lowest HP ones first)
          const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
          const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);
          
          // Apply damage to each affected creature
          const survivingCreatures = affectedCreatures.filter(creature => {
            if (damageToApply >= creature.hp) {
              totalKillCount++;
              return false; // Remove killed creature
            } else {
              creature.hp -= damageToApply;
              return true; // Keep damaged creature
            }
          });
          
          // Update the group with remaining creatures
          updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
          updatedGroup.count = updatedGroup.creatures.length;
          
          // Update currentHp to represent the average HP in the group
          if (updatedGroup.creatures.length > 0) {
            const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
            updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
          }
          
          // Add to global kill count
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
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    applyDamageToAllGroupsInAoe: (aoeParams) => {
      const { damage, saveType, saveDC, halfOnSave, percentAffected = 100, entityDamageModifiers = {} } = aoeParams;
      if (damage <= 0) return;
      
      set(state => {
        // Find groups marked for AoE
        const aoeGroups = state.enemyGroups.filter(group => group.inAoe);
        console.log('Groups marked for AoE:', aoeGroups.map(g => g.name));
        
        if (aoeGroups.length === 0) {
          console.log('No groups marked for AoE');
          return state;
        }
        
        let totalKillCount = 0;
        const groupResults = [];
        
        const updatedGroups = state.enemyGroups.map(group => {
          // Skip if not in AoE
          if (!group.inAoe) return group;
          
          console.log(`Processing AoE damage for group: ${group.name}`);
          
          // Check if we have custom save/damage info for this group
          const entityKey = `group-${group.id}`;
          const customEntityInfo = entityDamageModifiers[entityKey];
          
          // Default values
          let saved = false;
          let damageToApply = damage;
          let saveRoll = null;
          let totalRoll = null;
          
          if (customEntityInfo) {
            // Use custom save result and damage modifier
            saved = customEntityInfo.succeeded;
            saveRoll = customEntityInfo.roll;
            totalRoll = customEntityInfo.totalRoll;
            
            // Apply damage modifier
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }
            
            // Apply manual adjustment
            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          } else {
            // Standard calculation
            // Calculate save bonus for this group
            const saveBonus = group.savingThrows?.[saveType] || 0;
            
            // Roll save
            saveRoll = Math.floor(Math.random() * 20) + 1;
            totalRoll = saveRoll + saveBonus;
            saved = totalRoll >= saveDC;
            console.log(`${group.name} save roll: ${totalRoll} vs DC ${saveDC} - ${saved ? 'Saved' : 'Failed'}`);
            
            // Calculate damage based on save
            if (saved && halfOnSave) {
              damageToApply = Math.floor(damage / 2);
            } else if (saved && !halfOnSave) {
              damageToApply = 0;
            }
          }
          
          // Calculate number of affected creatures (rounded up)
          const affectedCount = Math.ceil(group.count * (percentAffected / 100));
          console.log(`${group.name} affected count: ${affectedCount} out of ${group.count} (${percentAffected}%)`);
          
          if (affectedCount <= 0 || damageToApply <= 0) {
            // Still add to results even if no damage was taken
            groupResults.push({
              name: group.name,
              saved: saved,
              damageToApply: 0,
              killCount: 0,
              saveRoll: saveRoll,
              totalRoll: totalRoll
            });
            return group;
          }
          
          let updatedGroup = { ...group };
          let killCount = 0;
          
          // Ensure creatures array exists
          if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
            // Initialize with current HP if no creatures array exists
            updatedGroup.creatures = Array(updatedGroup.count).fill().map(() => ({
              hp: updatedGroup.currentHp
            }));
          }
          
          // Sort creatures by HP (ascending) to damage lowest HP first
          updatedGroup.creatures.sort((a, b) => a.hp - b.hp);
          
          // Select the affected creatures (take the lowest HP ones first)
          const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
          const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);
          
          // Apply damage to each affected creature
          const survivingCreatures = affectedCreatures.filter(creature => {
            if (damageToApply >= creature.hp) {
              killCount++;
              return false; // Remove killed creature
            } else {
              creature.hp -= damageToApply;
              return true; // Keep damaged creature
            }
          });
          
          // Update the group with remaining creatures
          updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
          updatedGroup.count = updatedGroup.creatures.length;
          
          // Update currentHp to represent the average HP in the group
          if (updatedGroup.creatures.length > 0) {
            const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
            updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
          }
          
          totalKillCount += killCount;
          
          // Store results for this group
          groupResults.push({
            name: group.name,
            saved: saved,
            damageToApply,
            killCount,
            saveRoll: saveRoll,
            totalRoll: totalRoll
          });
          
          return updatedGroup;
        });
        
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        
        // Create detailed message including each group's result
        const groupMessages = groupResults.map(result => 
          `${result.name}: ${result.saved ? (halfOnSave ? "Save (½ dmg)" : "Save (no dmg)") : "Failed Save"}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : "no damage"}${result.killCount > 0 ? `, ${result.killCount} killed` : ""}`
        ).join('; ');
        
        return { 
          enemyGroups: updatedGroups,
          attackResults: [
            ...state.attackResults,
            {
              id: Date.now().toString(),
              damage,
              message: `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC} (${percentAffected}% affected) to groups - ${groupMessages}${totalKillCount > 0 ? ` - Total kills: ${totalKillCount}` : ""}`,
              isAoE: true,
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    applyDamageToBoss: (bossId, damage, hitStatus) => {
      if (damage <= 0) return;
      
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === bossId) {
            // If missed, no damage
            if (hitStatus === 'miss') {
              return boss;
            }
            
            // Calculate new HP, ensuring it doesn't go below 0
            const newHp = Math.max(0, boss.currentHp - damage);
            return { ...boss, currentHp: newHp };
          }
          return boss;
        });
        
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        // Add to attack results
        const boss = state.bosses.find(b => b.id === bossId);
        const resultMessage = hitStatus === 'miss' 
          ? 'Miss!' 
          : hitStatus === 'critical'
            ? `Critical hit! ${damage} damage to ${boss?.name}`
            : `Hit! ${damage} damage to ${boss?.name}`;
            
        // Update turn order to refresh HP information
        setTimeout(() => get().updateTurnOrder(), 0);
        
        return { 
          bosses: updatedBosses,
          attackResults: [
            ...state.attackResults,
            {
              id: Date.now().toString(),
              bossId,
              damage,
              hitStatus,
              message: resultMessage,
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    applyDamageToAllBossesInAoe: (aoeParams, applyToAll = false) => {
      // Just destructure damage for now
      const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
      if (damage <= 0) return;
      
      set(state => {
        const aoeBosses = applyToAll 
          ? state.bosses 
          : state.bosses.filter(boss => boss.inAoe);
          
        if (aoeBosses.length === 0) return state;
        
        const bossResults = [];
        
        const updatedBosses = state.bosses.map(boss => {
          // Skip bosses not in AoE unless applyToAll is true
          if (!applyToAll && !boss.inAoe) return boss;
          
          // Check if we have custom save/damage info for this boss
          const entityKey = `boss-${boss.id}`;
          const customEntityInfo = entityDamageModifiers[entityKey];
          
          // Default values
          let saved = false;
          let damageToApply = damage;
          let saveRoll = null;
          let totalRoll = null;
          
          if (customEntityInfo) {
            // Use custom save result and damage modifier
            saved = customEntityInfo.succeeded;
            saveRoll = customEntityInfo.roll;
            totalRoll = customEntityInfo.totalRoll;
            
            // Apply damage modifier
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }
            
            // Apply manual adjustment
            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          } else if (saveType && saveDC) {
            // Standard calculation with saving throw
            const saveBonus = boss.savingThrows?.[saveType] || 0;
            
            // Roll save
            saveRoll = Math.floor(Math.random() * 20) + 1;
            totalRoll = saveRoll + saveBonus;
            saved = totalRoll >= saveDC;
            
            // Calculate damage based on save
            if (saved && halfOnSave) {
              damageToApply = Math.floor(damage / 2);
            } else if (saved && !halfOnSave) {
              damageToApply = 0;
            }
          }
          
          // Store result for this boss
          bossResults.push({
            name: boss.name,
            saved: saved,
            damageToApply,
            saveRoll: saveRoll,
            totalRoll: totalRoll
          });
          
          // Apply the damage if any
          if (damageToApply <= 0) {
            return {
              ...boss,
              inAoe: false // Clear AOE flag after applying damage
            };
          }
          
          // Calculate new HP, ensuring it doesn't go below 0
          const newHp = Math.max(0, boss.currentHp - damageToApply);
          
          return {
            ...boss,
            currentHp: newHp,
            inAoe: false // Clear AOE flag after applying damage
          };
        });
        
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        // Create detailed message including each boss's result
        const bossMessages = bossResults.map(result => {
          let saveText = '';
          if (result.saveRoll !== null) {
            saveText = result.totalRoll !== result.saveRoll 
              ? ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`
              : ` (${result.saveRoll})`;
          }
          
          return `${result.name}: ${result.saved ? (halfOnSave ? "Save" + saveText + " (½ dmg)" : "Save" + saveText + " (no dmg)") : "Failed" + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : "no damage"}`;
        }).join('; ');
        
        // Add to attack results
        const resultMessage = `AoE: ${damage} ${saveType ? `${saveType.toUpperCase()} save DC ${saveDC}` : 'damage'} to bosses - ${bossMessages}`;
        
        return { 
          bosses: updatedBosses,
          attackResults: [
            ...state.attackResults,
            {
              id: Date.now().toString(),
              damage,
              message: resultMessage,
              isAoE: true,
              timestamp: Date.now()
            }
          ]
        };
      });
      
      // Don't clear AOE targets here as it's now handled in the component
    },
    
    applyDamageToCharacter: (characterId, damage, hitStatus, modifierText = '') => {
      if (damage <= 0) return;
      
      set(state => {
        const updatedCharacters = state.characters.map(char => {
          if (char.id === characterId) {
            // If missed, no damage
            if (hitStatus === 'miss') {
              return char;
            }
            
            // Calculate new HP, ensuring it doesn't go below 0
            const newHp = Math.max(0, char.currentHp - damage);
            return { ...char, currentHp: newHp };
          }
          return char;
        });
        
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        
        // Add to attack results
        const character = state.characters.find(c => c.id === characterId);
        const resultMessage = hitStatus === 'miss' 
          ? 'Miss!' 
          : hitStatus === 'critical'
            ? `Critical hit! ${damage} damage to ${character?.name}${modifierText}`
            : `Hit! ${damage} damage to ${character?.name}${modifierText}`;
            
        // Update turn order to refresh HP information
        setTimeout(() => get().updateTurnOrder(), 0);
        
        return { 
          characters: updatedCharacters,
          attackResults: [
            ...state.attackResults,
            {
              id: Date.now().toString(),
              characterId,
              damage,
              hitStatus,
              message: resultMessage,
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    applyDamageToAllCharactersInAoe: (aoeParams, forceAll = false) => {
      const { damage, saveType, saveDC, halfOnSave, characterDamageParams } = aoeParams;
      if (damage <= 0) return;
      
      let resultMessage = "";
      
      set(state => {
        // Either all characters or those marked for AoE
        const aoeCharacters = forceAll 
          ? state.characters 
          : state.characters.filter(char => char.inAoe);
          
        if (aoeCharacters.length === 0) return state;
        
        const updatedCharacters = state.characters.map(char => {
          // Skip if not in AoE and not forcing all
          if (!forceAll && !char.inAoe) return char;
          
          // Check if we have custom parameters for this character
          if (characterDamageParams && characterDamageParams[char.id]) {
            const customParams = characterDamageParams[char.id];
            const customDamage = customParams.damage;
            
            // Apply damage
            if (customDamage > 0) {
              const newHp = Math.max(0, char.currentHp - customDamage);
              return { ...char, currentHp: newHp };
            }
            
            return char;
          }
          
          // Standard behavior (used for NPCs/monsters) if no custom params
          // For now, we don't track saving throw bonuses for characters,
          // so we just roll a straight d20
          const saveRoll = Math.floor(Math.random() * 20) + 1;
          const saved = saveRoll >= saveDC;
          
          // Calculate damage based on save
          let damageToApply = damage;
          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
          
          // Apply damage
          if (damageToApply > 0) {
            const newHp = Math.max(0, char.currentHp - damageToApply);
            return { ...char, currentHp: newHp };
          }
          
          return char;
        });
        
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        
        // Add save roll details for characters with custom parameters
        if (characterDamageParams) {
          const saveDetails = [];
          aoeCharacters.forEach(char => {
            if (characterDamageParams[char.id]) {
              const params = characterDamageParams[char.id];
              const saveRoll = params.saveRoll === null ? 'Auto' : params.saveRoll;
              const saveStatus = params.succeeded ? 'Success' : 'Failure';
              saveDetails.push(`${char.name}: ${saveRoll} (${saveStatus}, ${params.damage} dmg)`);
            }
          });
          
          if (saveDetails.length > 0) {
            resultMessage = saveDetails.join('; ');
          } else {
            resultMessage = aoeCharacters.map(c => c.name).join(', ') + ` - DC ${saveDC} ${saveType.toUpperCase()} save`;
          }
        } else {
          resultMessage = aoeCharacters.map(c => c.name).join(', ') + ` - DC ${saveDC} ${saveType.toUpperCase()} save`;
        }
        
        return { characters: updatedCharacters };
      });
      
      return resultMessage;
    },
    
    // Attack results
    clearAttackResults: () => {
      set({ attackResults: [] });
    },
    
    removeAttackResult: (resultId) => {
      set(state => ({
        attackResults: state.attackResults.filter(result => result.id !== resultId)
      }));
    },
    
    // Section toggling
    toggleSection: (section) => {
      set(state => ({
        expandedSections: {
          ...state.expandedSections,
          [section]: !state.expandedSections[section]
        }
      }));
    },
    
    // Targeting
    setTargetEntity: (entity) => {
      set({ targetEntity: entity });
    },
    
    // Scrolling
    setDamageApplicationRef: (ref) => {
      set({ damageApplicationRef: ref });
    },
    
    setCharactersSectionRef: (ref) => {
      set({ charactersSectionRef: ref });
    },
    
    setBossesSectionRef: (ref) => {
      set({ bossesSectionRef: ref });
    },
    
    setGroupsSectionRef: (ref) => {
      set({ groupsSectionRef: ref });
    },
    
    // Register a ref for an individual entity
    registerEntityRef: (type, id, ref) => {
      set(state => ({
        entityRefs: {
          ...state.entityRefs,
          [`${type}-${id}`]: ref
        }
      }));
    },
    
    scrollToEntity: (entity) => {
      if (!entity || !entity.type) return;
      
      const { 
        charactersSectionRef, 
        bossesSectionRef, 
        groupsSectionRef,
        expandedSections,
        entityRefs
      } = get();
      
      // First make sure the appropriate section is expanded
      let sectionRef = null;
      let sectionName = '';
      
      if (entity.type === 'character') {
        sectionRef = charactersSectionRef;
        sectionName = 'characters';
      } else if (entity.type === 'boss') {
        sectionRef = bossesSectionRef;
        sectionName = 'groups'; // Bosses are in the groups section
      } else if (entity.type === 'group' || entity.type === 'groupCollection') {
        sectionRef = groupsSectionRef;
        sectionName = 'groups';
      }
      
      // Expand section if it's not already expanded
      if (sectionRef && sectionName && !expandedSections[sectionName]) {
        set(state => ({
          expandedSections: {
            ...state.expandedSections,
            [sectionName]: true
          }
        }));
      }
      
      // If it's a group collection, get the first group ID
      let targetId = entity.id;
      if (entity.type === 'groupCollection' && entity.ids && entity.ids.length > 0) {
        entity.type = 'group'; // Convert to group type for scrolling
        targetId = entity.ids[0]; // Use first group in collection
      }
      
      // After a short delay to ensure section is expanded
      setTimeout(() => {
        // Try to find the specific entity ref first
        const entityRef = entityRefs[`${entity.type}-${targetId}`];
        
        if (entityRef && entityRef.current) {
          // Scroll to the specific entity
          entityRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        } else if (sectionRef && sectionRef.current) {
          // Fall back to scrolling to the section
          sectionRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    },
    
    scrollToDamageSection: () => {
      const { damageApplicationRef, expandedSections } = get();
      
      // Make sure damage section is expanded
      if (!expandedSections.damage) {
        set(state => ({
          expandedSections: {
            ...state.expandedSections,
            damage: true
          }
        }));
      }
      
      // Scroll to damage section
      if (damageApplicationRef && damageApplicationRef.current) {
        damageApplicationRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    },
    
    // Utility functions
    calculateHealthPercentage: (current, max) => {
      if (max <= 0) return 0;
      return Math.min(100, Math.max(0, (current / max) * 100));
    },
    
    calculateGroupTotalCurrentHP: (group) => {
      if (!group) return 0;
      
      if (group.creatures && Array.isArray(group.creatures)) {
        return group.creatures.reduce((sum, creature) => sum + creature.hp, 0);
      }
      
      // Fallback to old calculation method
      return group.count * group.currentHp;
    },
    
    getHealthColor: (percentage) => {
      if (percentage > 50) {
        return '#38a169'; // Green
      } else if (percentage > 25) {
        return '#dd6b20'; // Orange
      } else {
        return '#e53e3e'; // Red
      }
    },
    
    // Dice rolling functions
    rollD20: (hasAdvantage = false, hasDisadvantage = false) => {
      if (hasAdvantage && !hasDisadvantage) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        return Math.max(roll1, roll2);
      } else if (hasDisadvantage && !hasAdvantage) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        return Math.min(roll1, roll2);
      } else {
        return Math.floor(Math.random() * 20) + 1;
      }
    },
    
    rollDice: (numDice, diceType) => {
      let total = 0;
      for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * diceType) + 1;
      }
      return total;
    },
    
    // Export/Import
    exportState: () => {
      const { characters, bosses, enemyGroups } = get();
      const exportData = JSON.stringify({ characters, bosses, enemyGroups });
      
      // Create a blob with the data
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dnd-calculator-state.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    },
    
    // Enhanced exportState with selection options
    exportStateSelective: (options = {}) => {
      const { characters, bosses, enemyGroups } = get();
      
      // Filter data based on options
      const exportData = {};
      
      // Add characters based on selection
      if (options.includeCharacters) {
        if (options.selectedCharacters && options.selectedCharacters.length > 0) {
          // Export only selected characters
          exportData.characters = characters.filter(char => 
            options.selectedCharacters.includes(char.id)
          );
        } else {
          // Export all characters
          exportData.characters = characters;
        }
      }
      
      // Add bosses based on selection
      if (options.includeBosses) {
        if (options.selectedBosses && options.selectedBosses.length > 0) {
          // Export only selected bosses
          exportData.bosses = bosses.filter(boss => 
            options.selectedBosses.includes(boss.id)
          );
        } else {
          // Export all bosses
          exportData.bosses = bosses;
        }
      }
      
      // Add enemy groups based on selection
      if (options.includeGroups) {
        if (options.selectedGroups && options.selectedGroups.length > 0) {
          // Export only selected groups
          exportData.enemyGroups = enemyGroups.filter(group => 
            options.selectedGroups.includes(group.id)
          );
        } else {
          // Export all groups
          exportData.enemyGroups = enemyGroups;
        }
      }
      
      // Create a blob with the data
      const jsonData = JSON.stringify(exportData);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dnd-calculator-export.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    },
    
    importState: (stateJson) => {
      try {
        const importedState = JSON.parse(stateJson);
        
        // Validate minimal structure
        if (!importedState) throw new Error('Invalid state data');
        
        const characters = Array.isArray(importedState.characters) ? importedState.characters : [];
        const bosses = Array.isArray(importedState.bosses) ? importedState.bosses : [];
        const enemyGroups = Array.isArray(importedState.enemyGroups) ? importedState.enemyGroups : [];
        
        // Save to localStorage
        localStorage.setItem('dnd-characters', JSON.stringify(characters));
        localStorage.setItem('dnd-bosses', JSON.stringify(bosses));
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(enemyGroups));
        
        // Update state
        set({ characters, bosses, enemyGroups });
        
        // Update turn order based on imported entities
        get().updateTurnOrder();
        
        return true;
      } catch (err) {
        console.error('Error importing state:', err);
        return false;
      }
    },
    
    // Enhanced importState with selection and merge options
    importStateSelective: (stateJson, options = {}) => {
      try {
        const importedState = JSON.parse(stateJson);
        
        // Validate minimal structure
        if (!importedState) throw new Error('Invalid state data');
        
        // Current state
        const currentState = get();
        let newCharacters = [...currentState.characters];
        let newBosses = [...currentState.bosses];
        let newEnemyGroups = [...currentState.enemyGroups];
        
        // Process characters if included in import
        if (options.includeCharacters && Array.isArray(importedState.characters)) {
          // Generate new IDs for imported characters to avoid conflicts if merging
          const importedCharacters = importedState.characters.map(char => ({
            ...char,
            id: options.mergeCharacters ? `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : char.id
          }));
          
          if (options.mergeCharacters) {
            // Merge with existing characters
            newCharacters = [...newCharacters, ...importedCharacters];
          } else {
            // Replace existing characters
            newCharacters = importedCharacters;
          }
        } else if (options.clearMissingCharacters) {
          // Clear characters if they aren't in the file and clearMissingCharacters is true
          newCharacters = [];
        }
        
        // Process bosses if included in import
        if (options.includeBosses && Array.isArray(importedState.bosses)) {
          // Generate new IDs for imported bosses to avoid conflicts if merging
          const importedBosses = importedState.bosses.map(boss => ({
            ...boss,
            id: options.mergeBosses ? `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : boss.id
          }));
          
          if (options.mergeBosses) {
            // Merge with existing bosses
            newBosses = [...newBosses, ...importedBosses];
          } else {
            // Replace existing bosses
            newBosses = importedBosses;
          }
        } else if (options.clearMissingBosses) {
          // Clear bosses if they aren't in the file and clearMissingBosses is true
          newBosses = [];
        }
        
        // Process enemy groups if included in import
        if (options.includeGroups && Array.isArray(importedState.enemyGroups)) {
          // Generate new IDs for imported groups to avoid conflicts if merging
          const importedGroups = importedState.enemyGroups.map(group => ({
            ...group,
            id: options.mergeGroups ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : group.id
          }));
          
          if (options.mergeGroups) {
            // Merge with existing groups
            newEnemyGroups = [...newEnemyGroups, ...importedGroups];
          } else {
            // Replace existing groups
            newEnemyGroups = importedGroups;
          }
        } else if (options.clearMissingGroups) {
          // Clear groups if they aren't in the file and clearMissingGroups is true
          newEnemyGroups = [];
        }
        
        // Save to localStorage
        localStorage.setItem('dnd-characters', JSON.stringify(newCharacters));
        localStorage.setItem('dnd-bosses', JSON.stringify(newBosses));
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(newEnemyGroups));
        
        // Update state
        set({ 
          characters: newCharacters, 
          bosses: newBosses, 
          enemyGroups: newEnemyGroups 
        });
        
        // Update turn order based on imported entities
        get().updateTurnOrder();
        
        return true;
      } catch (err) {
        console.error('Error importing state:', err);
        return false;
      }
    },
    
    toggleCharacterAoeTarget: (id) => {
      set(state => {
        const updatedCharacters = state.characters.map(char => {
          if (char.id === id) {
            return { ...char, inAoe: !char.inAoe };
          }
          return char;
        });
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        return { characters: updatedCharacters };
      });
    },
    
    // Apply damage to multiple characters with different modifiers
    applyDamageToMultipleCharacters: (damageDetails) => {
      set(state => {
        const updatedCharacters = state.characters.map(char => {
          // Find if this character has any pending damage
          const charDamage = damageDetails.find(d => d.characterId === char.id);
          
          if (!charDamage) return char;
          
          // Apply the damage with the specified modifier
          let finalDamage = charDamage.damage;
          
          // Debug the starting point
          console.log(`Damage calculation for ${char.name} from ${charDamage.groupName}:`, {
            startingDamage: finalDamage,
            acOverride: charDamage.acOverride,
            characterAC: char.ac,
            adjustedHitCount: charDamage.adjustedHitCount,
            modifier: charDamage.modifier,
            damagePreCalculated: charDamage.damagePreCalculated
          });
          
          // Check if we need to recalculate hits based on AC override
          // ONLY if it hasn't already been adjusted in the UI (indicated by adjustedHitCount)
          if (charDamage.acOverride !== null && 
              charDamage.acOverride !== undefined && 
              char.ac !== charDamage.acOverride && 
              charDamage.attackRolls && 
              charDamage.adjustedHitCount === undefined) {
            
            const newHitCount = charDamage.attackRolls.filter(roll => 
              roll.isNatural20 || (!roll.isNatural1 && roll.attackRoll >= charDamage.acOverride)
            ).length;
            
            // If we have original hit count info, adjust damage proportionally
            if (charDamage.hitCount) {
              const hitRatio = newHitCount / charDamage.hitCount;
              const originalDamage = finalDamage;
              finalDamage = Math.floor(finalDamage * hitRatio);
              
              console.log(`AC override recalculation (store-side):`, {
                character: char.name,
                originalHits: charDamage.hitCount,
                newHits: newHitCount,
                originalDamage,
                newDamage: finalDamage
              });
            }
          }
          
          // Apply damage modifier ONLY if damage hasn't been pre-calculated
          if (!charDamage.damagePreCalculated) {
            const preModifierDamage = finalDamage;
            if (charDamage.modifier === 'half') {
              finalDamage = Math.floor(finalDamage / 2);
            } else if (charDamage.modifier === 'quarter') {
              finalDamage = Math.floor(finalDamage / 4);
            } else if (charDamage.modifier === 'none') {
              finalDamage = 0;
            }
            
            if (preModifierDamage !== finalDamage) {
              console.log(`Damage modifier applied: ${charDamage.modifier}`, {
                character: char.name,
                before: preModifierDamage,
                after: finalDamage
              });
            }
          } else {
            console.log(`Using pre-calculated damage for ${char.name}: ${finalDamage}`);
          }
          
          if (finalDamage <= 0) return char;
          
          // Calculate new HP
          const newHp = Math.max(0, char.currentHp - finalDamage);
          console.log(`Final damage applied to ${char.name}: ${finalDamage} (HP: ${char.currentHp} -> ${newHp})`);
          
          return { ...char, currentHp: newHp };
        });
        
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        
        // Create attack result messages
        const resultMessages = damageDetails.map(detail => {
          if (!detail.characterId) return null;
          
          const character = state.characters.find(c => c.id === detail.characterId);
          if (!character) return null;
          
          let modifierText = '';
          let finalDamage = detail.damage;
          
          // Apply AC override text if applicable
          let acText = '';
          if (detail.acOverride !== null && detail.acOverride !== undefined && detail.acOverride !== character.ac) {
            acText = ` (AC: ${detail.acOverride}`;
            // Add hit information if available
            if (detail.hitCount !== undefined && detail.adjustedHitCount !== undefined) {
              acText += `, Hits: ${detail.adjustedHitCount}/${detail.hitCount}`;
            }
            acText += ')';
          }
          
          // Apply manual adjustment text if applicable
          let adjustmentText = '';
          if (detail.manualAdjustment && detail.manualAdjustment !== 0) {
            adjustmentText = detail.manualAdjustment > 0 
              ? ` (+${detail.manualAdjustment} manual)`
              : ` (${detail.manualAdjustment} manual)`;
          }
          
          // Use originalModifier if available, otherwise use modifier
          const displayModifier = detail.originalModifier || detail.modifier;
          
          if (displayModifier === 'half') {
            modifierText = ' (half damage)';
          } else if (displayModifier === 'quarter') {
            modifierText = ' (quarter damage)';
          } else if (displayModifier === 'none') {
            modifierText = ' (no damage)';
          }
          
          return {
            id: `${Date.now()}-${detail.characterId}`,
            characterId: detail.characterId,
            sourceGroupId: detail.sourceGroupId,
            damage: finalDamage,
            hitStatus: detail.hitStatus || 'hit',
            message: `${detail.groupName || 'Group'} -> ${character.name}${acText}${adjustmentText}${modifierText}: ${finalDamage} damage`,
            timestamp: Date.now()
          };
        }).filter(Boolean);
        
        // Update turn order to refresh HP information
        setTimeout(() => get().updateTurnOrder(), 0);
        
        return { 
          characters: updatedCharacters,
          attackResults: [
            ...state.attackResults,
            ...resultMessages
          ]
        };
      });
    },
    
    // Roll attacks for all groups against their assigned targets
    rollGroupsAttacks: (groupTargets, characterAcOverrides = {}) => {
      const results = {};
      let allResults = [];
      
      // Validate inputs
      if (!groupTargets || typeof groupTargets !== 'object') {
        console.error('Invalid groupTargets parameter:', groupTargets);
        return { results: {}, allResults: [] };
      }

      const groups = get().enemyGroups || [];
      const characters = get().characters || [];
      
      // Only process groups that exist and have targets
      groups.forEach(group => {
        // Skip if group doesn't have an ID
        if (!group || !group.id) return;
        
        const targetCharacterId = groupTargets[group.id];
        // Skip if no target
        if (!targetCharacterId) return;
        
        const targetCharacter = characters.find(c => c.id === targetCharacterId);
        // Skip if target not found
        if (!targetCharacter) return;
        
        // Use override AC if provided, otherwise use character's AC
        const targetAc = characterAcOverrides && characterAcOverrides[targetCharacterId] ? 
          characterAcOverrides[targetCharacterId] : targetCharacter.ac;
        
        // Get attack bonus from group (with fallback to default 3)
        const attackBonus = group.attackBonus || 3;
        
        // Get damage details (with fallbacks to defaults)
        const damageDetails = group.damage || { numDice: 1, diceType: 8, modifier: 2 };
        const { numDice, diceType, modifier } = damageDetails;
        
        const groupResults = [];
        let totalDamage = 0;
        
        // Roll attack for each creature in the group
        const count = typeof group.count === 'number' ? group.count : 0;
        for (let i = 0; i < count; i++) {
          // Roll to hit
          const attackRollBase = get().rollD20();
          const isNatural20 = attackRollBase === 20;
          const isNatural1 = attackRollBase === 1;
          const totalAttackRoll = attackRollBase + attackBonus;
          const hits = isNatural20 || (!isNatural1 && totalAttackRoll >= targetAc);
          
          // Roll damage if hit
          let damage = 0;
          if (hits) {
            // Roll the configured damage dice
            const diceDamage = get().rollDice(numDice, diceType);
            // For critical hits, double the dice damage only, not the modifier
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
            damage
          });
        }
        
        // Only add results if we have any
        if (groupResults.length > 0) {
          results[group.id] = {
            results: groupResults,
            totalDamage,
            targetName: targetCharacter.name || 'Unknown',
            targetAc,
            targetId: targetCharacterId,
            damageType: damageDetails.damageType || 'slashing'
          };
          
          // Add to the all results array
          allResults.push({
            characterId: targetCharacterId,
            sourceGroupId: group.id,
            groupName: group.name || 'Group',
            damage: totalDamage,
            damageType: damageDetails.damageType || 'slashing',
            hitStatus: groupResults.some(r => r.isNatural20) ? 'critical' : 'hit',
            attackRolls: groupResults,
            hitCount: groupResults.filter(r => r.hits).length
          });
        }
      });
      
      return { results, allResults };
    },
    
    // Turn order functions
    updateTurnOrder: (resetToStart = false, removedId = null, removedType = null) => {
      set(state => {
        // First, collect all individual entities with their HP information
        const characters = state.characters.map(char => ({ 
          id: char.id, 
          name: char.name, 
          type: 'character', 
          initiative: char.initiative || 0,
          currentHp: char.currentHp,
          maxHp: char.maxHp
        }));
        
        const bosses = state.bosses.map(boss => ({ 
          id: boss.id, 
          name: boss.name, 
          type: 'boss', 
          initiative: boss.initiative || 0,
          currentHp: boss.currentHp,
          maxHp: boss.maxHp
        }));
        
        // For enemy groups, we need special handling to group them
        let enemyGroups = state.enemyGroups.map(group => ({ 
          id: group.id, 
          name: group.name, 
          type: 'group', 
          initiative: group.initiative || 0,
          currentHp: group.currentHp,
          maxHp: group.maxHp,
          count: group.count,
          originalCount: group.originalCount || group.count
        }));
        
        // Group enemy groups with the same initiative
        const groupedEnemies = {};
        enemyGroups.forEach(group => {
          const initiative = group.initiative;
          
          // Extract base name (remove numbers at the end)
          // For example: "Goblins 1" -> "Goblins"
          const baseNameMatch = group.name.match(/^(.*?)(?:\s+\d+)?$/);
          const baseName = baseNameMatch ? baseNameMatch[1].trim() : group.name;
          
          // Create a key combining initiative and base name
          const key = `${initiative}-${baseName}`;
          
          if (!groupedEnemies[key]) {
            groupedEnemies[key] = {
              ids: [group.id],
              name: baseName,
              type: 'groupCollection',
              initiative: initiative,
              baseNamePattern: baseName,
              // For group collections, track total count and HP
              totalCount: group.count,
              totalOriginalCount: group.originalCount || group.count,
              groups: [{ 
                id: group.id, 
                count: group.count,
                originalCount: group.originalCount || group.count,
                currentHp: group.currentHp,
                maxHp: group.maxHp
              }]
            };
          } else {
            groupedEnemies[key].ids.push(group.id);
            groupedEnemies[key].totalCount += group.count;
            groupedEnemies[key].totalOriginalCount += (group.originalCount || group.count);
            groupedEnemies[key].groups.push({ 
              id: group.id, 
              count: group.count,
              originalCount: group.originalCount || group.count,
              currentHp: group.currentHp,
              maxHp: group.maxHp
            });
          }
        });
        
        // Convert the grouped enemies back to an array, but only include groups that have members
        const groupedEnemyArray = Object.values(groupedEnemies)
          .filter(group => group.ids && group.ids.length > 0);
        
        // Combine all entities and sort by initiative
        const entities = [
          ...characters,
          ...bosses,
          ...groupedEnemyArray
        ].sort((a, b) => b.initiative - a.initiative);
        
        // Save to localStorage
        localStorage.setItem('dnd-turn-order', JSON.stringify(entities));
        
        // Determine new current turn index
        let newCurrentTurnIndex = state.currentTurnIndex;
        
        // If we need to reset to the start of combat (only when initiative changes)
        if (resetToStart) {
          newCurrentTurnIndex = 0;
        } 
        // If an entity was removed, check if it affects the current turn
        else if (removedId && removedType) {
          // Get the current entity
          const currentEntity = state.turnOrder[state.currentTurnIndex];
          
          // If the removed entity was the current turn
          if (currentEntity) {
            if (
              // If a direct match (character or boss)
              (currentEntity.type === removedType && currentEntity.id === removedId) ||
              // Or if it was part of a group collection
              (currentEntity.type === 'groupCollection' && 
               removedType === 'group' && 
               currentEntity.ids && 
               currentEntity.ids.includes(removedId))
            ) {
              // Keep the same index, which will now point to the next entity
              // But ensure it's within bounds
              newCurrentTurnIndex = Math.min(state.currentTurnIndex, entities.length - 1);
            }
          }
        }
        // Check if we need to adjust due to group collection changes
        else if (!resetToStart && !removedId) {
          // Get the current entity
          const currentEntity = state.turnOrder[state.currentTurnIndex];
          
          // If the current entity was a group collection, try to find it in the new entities
          if (currentEntity && currentEntity.type === 'groupCollection') {
            const newEntityIndex = entities.findIndex(e => 
              e.type === 'groupCollection' && 
              e.baseNamePattern === currentEntity.baseNamePattern &&
              e.initiative === currentEntity.initiative
            );
            
            if (newEntityIndex >= 0) {
              newCurrentTurnIndex = newEntityIndex;
            } else {
              // Group collection no longer exists, move to next entity
              newCurrentTurnIndex = Math.min(state.currentTurnIndex, entities.length - 1);
            }
          }
        }
        
        // Ensure the index is valid
        if (entities.length === 0) {
          newCurrentTurnIndex = 0;
        } else {
          newCurrentTurnIndex = Math.min(newCurrentTurnIndex, entities.length - 1);
        }
        
        return { 
          turnOrder: entities,
          currentTurnIndex: newCurrentTurnIndex
        };
      });
    },
    
    nextTurn: () => {
      set(state => {
        if (state.turnOrder.length === 0) return state;
        
        const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
        
        // When moving to a new turn, if it's a groupCollection type,
        // update the targetEntity to the first group in the collection
        const nextEntity = state.turnOrder[nextIndex];
        let newTargetEntity = state.targetEntity;
        
        if (nextEntity.type === 'groupCollection' && nextEntity.ids && nextEntity.ids.length > 0) {
          // Set the first group in the collection as the target
          newTargetEntity = { type: 'group', id: nextEntity.ids[0] };
        }
        
        return { 
          currentTurnIndex: nextIndex,
          targetEntity: newTargetEntity
        };
      });
    },
    
    previousTurn: () => {
      set(state => {
        if (state.turnOrder.length === 0) return state;
        
        const prevIndex = (state.currentTurnIndex - 1 + state.turnOrder.length) % state.turnOrder.length;
        
        // When moving to a new turn, if it's a groupCollection type,
        // update the targetEntity to the first group in the collection
        const prevEntity = state.turnOrder[prevIndex];
        let newTargetEntity = state.targetEntity;
        
        if (prevEntity.type === 'groupCollection' && prevEntity.ids && prevEntity.ids.length > 0) {
          // Set the first group in the collection as the target
          newTargetEntity = { type: 'group', id: prevEntity.ids[0] };
        }
        
        return { 
          currentTurnIndex: prevIndex,
          targetEntity: newTargetEntity
        };
      });
    },
    
    moveTurnOrderUp: (index) => {
      set(state => {
        if (index <= 0 || index >= state.turnOrder.length) return state;
        
        const newTurnOrder = [...state.turnOrder];
        const temp = newTurnOrder[index];
        newTurnOrder[index] = newTurnOrder[index - 1];
        newTurnOrder[index - 1] = temp;
        
        localStorage.setItem('dnd-turn-order', JSON.stringify(newTurnOrder));
        
        // Adjust currentTurnIndex if needed
        let newCurrentTurnIndex = state.currentTurnIndex;
        if (state.currentTurnIndex === index) {
          newCurrentTurnIndex = index - 1;
        } else if (state.currentTurnIndex === index - 1) {
          newCurrentTurnIndex = index;
        }
        
        return { 
          turnOrder: newTurnOrder,
          currentTurnIndex: newCurrentTurnIndex
        };
      });
    },
    
    moveTurnOrderDown: (index) => {
      set(state => {
        if (index < 0 || index >= state.turnOrder.length - 1) return state;
        
        const newTurnOrder = [...state.turnOrder];
        const temp = newTurnOrder[index];
        newTurnOrder[index] = newTurnOrder[index + 1];
        newTurnOrder[index + 1] = temp;
        
        localStorage.setItem('dnd-turn-order', JSON.stringify(newTurnOrder));
        
        // Adjust currentTurnIndex if needed
        let newCurrentTurnIndex = state.currentTurnIndex;
        if (state.currentTurnIndex === index) {
          newCurrentTurnIndex = index + 1;
        } else if (state.currentTurnIndex === index + 1) {
          newCurrentTurnIndex = index;
        }
        
        return { 
          turnOrder: newTurnOrder,
          currentTurnIndex: newCurrentTurnIndex
        };
      });
    },
    
    rollInitiative: () => {
      set(state => {
        // Roll initiative for characters
        const updatedCharacters = state.characters.map(char => {
          // Simple d20 roll for now
          const initiativeRoll = Math.floor(Math.random() * 20) + 1;
          return { ...char, initiative: initiativeRoll };
        });
        
        // Roll for bosses
        const updatedBosses = state.bosses.map(boss => {
          const initiativeRoll = Math.floor(Math.random() * 20) + 1;
          return { ...boss, initiative: initiativeRoll };
        });
        
        // Roll for groups (all with same value for now)
        const groupInitiativeRoll = Math.floor(Math.random() * 20) + 1;
        const updatedGroups = state.enemyGroups.map(group => {
          return { ...group, initiative: groupInitiativeRoll };
        });
        
        // Save to localStorage
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        
        return { 
          characters: updatedCharacters,
          bosses: updatedBosses,
          enemyGroups: updatedGroups
        };
      });
      
      // Update turn order with new initiative values and reset to start
      get().updateTurnOrder(true);
    },
    
    updateEnemyGroup: (id, field, value) => {
      set(state => {
        const updatedGroups = state.enemyGroups.map(group => {
          if (group.id === id) {
            // If a complete group object is provided as the third parameter, use that
            if (field === null && typeof value === 'object') {
              return value;
            }
            // Otherwise update just the specified field
            return { ...group, [field]: value };
          }
          return group;
        });
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        
        // If initiative was updated, update the turn order
        if (field === 'initiative') {
          setTimeout(() => get().updateTurnOrder(true), 0);
        } else {
          // For other updates, just refresh the UI
          setTimeout(() => get().updateTurnOrder(), 0);
        }
        
        return { enemyGroups: updatedGroups };
      });
    },
    
    // Add a function to set a single boss as target for attacks
    setBossTarget: (bossId) => {
      set(state => {
        // First clear any previous AOE targets for bosses
        const updatedBosses = state.bosses.map(boss => ({
          ...boss,
          isTargeted: boss.id === bossId
        }));
        
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        return { 
          bosses: updatedBosses,
          targetEntity: { type: 'boss', id: bossId }
        };
      });
    },
    
    // Add a function to set a boss as AOE target
    setBossAoeTarget: (bossId, isTarget) => {
      set(state => {
        const updatedBosses = state.bosses.map(boss => {
          if (boss.id === bossId) {
            return { ...boss, inAoe: isTarget };
          }
          return boss;
        });
        
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        return { bosses: updatedBosses };
      });
    },
    
    // Prepare an AOE attack for a boss that will populate the AOE section
    prepareBossAoeAttack: (bossId, attack) => {
      const boss = get().bosses.find(b => b.id === bossId);
      if (!boss || !attack) return;
      
      // Roll the damage dice
      const damageRoll = get().rollDice(attack.numDice, attack.diceType);
      const totalDamage = damageRoll + attack.modifier;
      
      // Set this boss as the target entity
      get().setTargetEntity({ type: 'boss', id: bossId });
      
      // Prepare the AOE fields
      const aoeParams = {
        damage: totalDamage.toString(), // Use the actual rolled damage
        saveType: attack.saveType,
        saveDC: attack.saveDC,
        halfOnSave: attack.halfOnSave
      };
      
      // Set the AOE parameters in the damage application component
      get().prepareAoeDamage(aoeParams);
      
      // Scroll to damage section
      get().scrollToDamageSection();
      
      // Add attack result
      get().addBossAttackResult(bossId, {
        id: Date.now().toString(),
        attackName: attack.name,
        message: `AOE Attack: ${attack.name} - ${totalDamage} damage (${damageRoll} + ${attack.modifier}) - DC ${attack.saveDC} ${attack.saveType.toUpperCase()} save, ${attack.halfOnSave ? "half" : "no"} damage on save`,
        damage: totalDamage,
        isAoE: true,
        saveType: attack.saveType,
        saveDC: attack.saveDC,
        halfOnSave: attack.halfOnSave
      });
    },
    
    // Clear all AOE targets after applying AOE damage
    clearAllAoeTargets: () => {
      set(state => {
        // Clear AOE flags from all entities
        const updatedBosses = state.bosses.map(boss => ({
          ...boss,
          inAoe: false
        }));
        
        const updatedGroups = state.enemyGroups.map(group => ({
          ...group,
          inAoe: false
        }));
        
        const updatedCharacters = state.characters.map(char => ({
          ...char,
          inAoe: false
        }));
        
        // Update localStorage
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        
        return { 
          bosses: updatedBosses,
          enemyGroups: updatedGroups,
          characters: updatedCharacters
        };
      });
    },
    
    // Add parameters for AOE damage application
    prepareAoeDamage: (params) => {
      // This will be used by the damage application component
      set({ aoeDamageParams: params });
    },
    
    // A new function to consolidate AOE attack results
    applyAoeDamageToAll: (aoeParams) => {
      const { damage, saveType, saveDC } = aoeParams;
      if (damage <= 0) return;
      
      // First, collect all AOE targets
      const state = get();
      const aoeBosses = aoeParams.applyToAll ? state.bosses : state.bosses.filter(boss => boss.inAoe);
      const aoeGroups = aoeParams.applyToAll ? state.enemyGroups : state.enemyGroups.filter(group => group.inAoe);
      const aoeCharacters = aoeParams.applyToAll ? state.characters : state.characters.filter(char => char.inAoe);
      
      // If no targets, don't do anything
      if (aoeBosses.length === 0 && aoeGroups.length === 0 && aoeCharacters.length === 0) {
        return;
      }
      
      // Apply damage to bosses and get results
      const bossResults = get().applyDamageToAllBossesInAoeInternal(aoeParams, aoeParams.applyToAll);
      
      // Apply damage to groups and get results
      const groupResults = get().applyDamageToAllGroupsInAoeInternal(aoeParams);
      
      // Apply damage to characters and get results
      const charResults = get().applyDamageToAllCharactersInAoeInternal(aoeParams, aoeParams.applyToAll);
      
      // Combine all results into one attack result entry
      let finalMessage = `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC}`;
      
      // Add boss results if any
      if (bossResults && bossResults.trim() !== "") {
        finalMessage += `\nto bosses - ${bossResults}`;
      }
      
      // Add group results if any
      if (groupResults && groupResults.trim() !== "") {
        finalMessage += `\nto groups - ${groupResults}`;
      }
      
      // Add character results if any
      if (charResults && charResults.trim() !== "") {
        finalMessage += `\nto characters - ${charResults}`;
      }
      
      // Add the single consolidated attack result
      set(state => ({
        attackResults: [
          ...state.attackResults,
          {
            id: Date.now().toString(),
            damage,
            message: finalMessage,
            isAoE: true,
            timestamp: Date.now()
          }
        ]
      }));
      
      // Clear AOE targets
      get().clearAllAoeTargets();
    },
    
    // Internal version of applyDamageToAllBossesInAoe that returns a message instead of adding to attackResults
    applyDamageToAllBossesInAoeInternal: (aoeParams, applyToAll = false) => {
      const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
      if (damage <= 0) return "";
      
      let resultMessage = "";
      
      set(state => {
        const aoeBosses = applyToAll 
          ? state.bosses 
          : state.bosses.filter(boss => boss.inAoe);
          
        if (aoeBosses.length === 0) return state;
        
        const bossResults = [];
        
        const updatedBosses = state.bosses.map(boss => {
          // Skip bosses not in AoE unless applyToAll is true
          if (!applyToAll && !boss.inAoe) return boss;
          
          // Check if we have custom save/damage info for this boss
          const entityKey = `boss-${boss.id}`;
          const customEntityInfo = entityDamageModifiers[entityKey];
          
          // Default values
          let saved = false;
          let damageToApply = damage;
          let saveRoll = null;
          let totalRoll = null;
          
          if (customEntityInfo) {
            // Use custom save result and damage modifier
            saved = customEntityInfo.succeeded;
            saveRoll = customEntityInfo.roll;
            totalRoll = customEntityInfo.totalRoll;
            
            // Apply damage modifier
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }
            
            // Apply manual adjustment
            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          } else if (saveType && saveDC) {
            // Standard calculation with saving throw
            const saveBonus = boss.savingThrows?.[saveType] || 0;
            
            // Roll save
            saveRoll = Math.floor(Math.random() * 20) + 1;
            totalRoll = saveRoll + saveBonus;
            saved = totalRoll >= saveDC;
            
            // Calculate damage based on save
            if (saved && halfOnSave) {
              damageToApply = Math.floor(damage / 2);
            } else if (saved && !halfOnSave) {
              damageToApply = 0;
            }
          }
          
          // Store result for this boss
          bossResults.push({
            name: boss.name,
            saved: saved,
            damageToApply,
            saveRoll: saveRoll,
            totalRoll: totalRoll
          });
          
          // Apply the damage if any
          if (damageToApply <= 0) {
            return {
              ...boss,
              inAoe: false // Clear AOE flag after applying damage
            };
          }
          
          // Calculate new HP, ensuring it doesn't go below 0
          const newHp = Math.max(0, boss.currentHp - damageToApply);
          
          return {
            ...boss,
            currentHp: newHp,
            inAoe: false // Clear AOE flag after applying damage
          };
        });
        
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        // Create detailed message including each boss's result
        resultMessage = bossResults.map(result => {
          let saveText = '';
          if (result.saveRoll !== null) {
            saveText = result.totalRoll !== result.saveRoll 
              ? ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`
              : ` (${result.saveRoll})`;
          }
          
          return `${result.name}: ${result.saved ? (halfOnSave ? "Save" + saveText + " (½ dmg)" : "Save" + saveText + " (no dmg)") : "Failed" + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : "no damage"}`;
        }).join('; ');
        
        return { bosses: updatedBosses };
      });
      
      return resultMessage;
    },
    
    // Internal version of applyDamageToAllGroupsInAoe that returns a message instead of adding to attackResults
    applyDamageToAllGroupsInAoeInternal: (aoeParams) => {
      const { damage, saveType, saveDC, halfOnSave, percentAffected = 100, entityDamageModifiers = {} } = aoeParams;
      if (damage <= 0) return "";
      
      let resultMessage = "";
      let totalKillCount = 0;
      
      set(state => {
        // Find groups marked for AoE
        const aoeGroups = aoeParams.applyToAll 
          ? state.enemyGroups 
          : state.enemyGroups.filter(group => group.inAoe);
        
        if (aoeGroups.length === 0) {
          return state;
        }
        
        const groupResults = [];
        
        const updatedGroups = state.enemyGroups.map(group => {
          // Skip if not in AoE and not applying to all
          if (!aoeParams.applyToAll && !group.inAoe) return group;
          
          // Check if we have custom save/damage info for this group
          const entityKey = `group-${group.id}`;
          const customEntityInfo = entityDamageModifiers[entityKey];
          
          // Default values
          let saved = false;
          let damageToApply = damage;
          let saveRoll = null;
          let totalRoll = null;
          
          if (customEntityInfo) {
            // Use custom save result and damage modifier
            saved = customEntityInfo.succeeded;
            saveRoll = customEntityInfo.roll;
            totalRoll = customEntityInfo.totalRoll;
            
            // Apply damage modifier
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }
            
            // Apply manual adjustment
            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          } else {
            // Standard calculation
            // Calculate save bonus for this group
            const saveBonus = group.savingThrows?.[saveType] || 0;
            
            // Roll save
            saveRoll = Math.floor(Math.random() * 20) + 1;
            totalRoll = saveRoll + saveBonus;
            saved = totalRoll >= saveDC;
            
            // Calculate damage based on save
            if (saved && halfOnSave) {
              damageToApply = Math.floor(damage / 2);
            } else if (saved && !halfOnSave) {
              damageToApply = 0;
            }
          }
          
          // Calculate number of affected creatures (rounded up)
          const affectedCount = Math.ceil(group.count * (percentAffected / 100));
          
          if (affectedCount <= 0 || damageToApply <= 0) {
            // Still add to results even if no damage was taken
            groupResults.push({
              name: group.name,
              saved: saved,
              damageToApply: 0,
              killCount: 0,
              saveRoll: saveRoll,
              totalRoll: totalRoll
            });
            return group;
          }
          
          let updatedGroup = { ...group };
          let killCount = 0;
          
          // Ensure creatures array exists
          if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
            // Initialize with current HP if no creatures array exists
            updatedGroup.creatures = Array(updatedGroup.count).fill().map(() => ({
              hp: updatedGroup.currentHp
            }));
          }
          
          // Sort creatures by HP (ascending) to damage lowest HP first
          updatedGroup.creatures.sort((a, b) => a.hp - b.hp);
          
          // Select the affected creatures (take the lowest HP ones first)
          const affectedCreatures = updatedGroup.creatures.slice(0, affectedCount);
          const unaffectedCreatures = updatedGroup.creatures.slice(affectedCount);
          
          // Apply damage to each affected creature
          const survivingCreatures = affectedCreatures.filter(creature => {
            if (damageToApply >= creature.hp) {
              killCount++;
              return false; // Remove killed creature
            } else {
              creature.hp -= damageToApply;
              return true; // Keep damaged creature
            }
          });
          
          // Update the group with remaining creatures
          updatedGroup.creatures = [...survivingCreatures, ...unaffectedCreatures];
          updatedGroup.count = updatedGroup.creatures.length;
          
          // Update currentHp to represent the average HP in the group
          if (updatedGroup.creatures.length > 0) {
            const totalHP = updatedGroup.creatures.reduce((sum, creature) => sum + creature.hp, 0);
            updatedGroup.currentHp = Math.round(totalHP / updatedGroup.creatures.length);
          }
          
          totalKillCount += killCount;
          
          // Store results for this group
          groupResults.push({
            name: group.name,
            saved: saved,
            damageToApply,
            killCount,
            saveRoll: saveRoll,
            totalRoll: totalRoll
          });
          
          return updatedGroup;
        });
        
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        
        // Create detailed message including each group's result
        resultMessage = groupResults.map(result => 
          `${result.name}: ${result.saved ? (halfOnSave ? "Save (½ dmg)" : "Save (no dmg)") : "Failed Save"}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : "no damage"}${result.killCount > 0 ? `, ${result.killCount} killed` : ""}`
        ).join('; ');
        
        // Also add total kill count to resultMessage if any
        if (totalKillCount > 0) {
          resultMessage += `; Total kills: ${totalKillCount}`;
        }
        
        return { enemyGroups: updatedGroups };
      });
      
      return resultMessage;
    },
    
    // Internal version of applyDamageToAllCharactersInAoe that returns a message instead of adding to attackResults
    applyDamageToAllCharactersInAoeInternal: (aoeParams, forceAll = false) => {
      const { damage, saveType, saveDC, halfOnSave, characterDamageParams } = aoeParams;
      if (damage <= 0) return "";
      
      let resultMessage = "";
      
      set(state => {
        // Either all characters or those marked for AoE
        const aoeCharacters = forceAll 
          ? state.characters 
          : state.characters.filter(char => char.inAoe);
          
        if (aoeCharacters.length === 0) return state;
        
        const updatedCharacters = state.characters.map(char => {
          // Skip if not in AoE and not forcing all
          if (!forceAll && !char.inAoe) return char;
          
          // Check if we have custom parameters for this character
          if (characterDamageParams && characterDamageParams[char.id]) {
            const customParams = characterDamageParams[char.id];
            const customDamage = customParams.damage;
            
            // Apply damage
            if (customDamage > 0) {
              const newHp = Math.max(0, char.currentHp - customDamage);
              return { ...char, currentHp: newHp };
            }
            
            return char;
          }
          
          // Standard behavior (used for NPCs/monsters) if no custom params
          // For now, we don't track saving throw bonuses for characters,
          // so we just roll a straight d20
          const saveRoll = Math.floor(Math.random() * 20) + 1;
          const saved = saveRoll >= saveDC;
          
          // Calculate damage based on save
          let damageToApply = damage;
          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
          
          // Apply damage
          if (damageToApply > 0) {
            const newHp = Math.max(0, char.currentHp - damageToApply);
            return { ...char, currentHp: newHp };
          }
          
          return char;
        });
        
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        
        // Add save roll details for characters with custom parameters
        if (characterDamageParams) {
          const saveDetails = [];
          aoeCharacters.forEach(char => {
            if (characterDamageParams[char.id]) {
              const params = characterDamageParams[char.id];
              const saveRoll = params.saveRoll === null ? 'Auto' : params.saveRoll;
              const saveStatus = params.succeeded ? 'Success' : 'Failure';
              saveDetails.push(`${char.name}: ${saveRoll} (${saveStatus}, ${params.damage} dmg)`);
            }
          });
          
          if (saveDetails.length > 0) {
            resultMessage = saveDetails.join('; ');
          } else {
            resultMessage = aoeCharacters.map(c => c.name).join(', ') + ` - DC ${saveDC} ${saveType.toUpperCase()} save`;
          }
        } else {
          resultMessage = aoeCharacters.map(c => c.name).join(', ') + ` - DC ${saveDC} ${saveType.toUpperCase()} save`;
        }
        
        return { characters: updatedCharacters };
      });
      
      return resultMessage;
    },
    
    // Helper function to apply healing to a character
    applyHealingToCharacter: (characterId, amount, transactionId = null) => {
      const character = get().characters.find(c => c.id === characterId);
      if (!character || amount <= 0) return;
      
      // For characters, allow healing from 0 HP
      // Get current character HP, making sure we don't go negative
      const currentHp = Math.max(0, character.currentHp);
      const newHp = Math.min(character.maxHp, currentHp + amount);
      
      // Generate transaction ID if not provided
      const healingId = transactionId || Date.now().toString();
      
      // Use the updateCharacter function to update the HP
      set(state => {
        const updatedCharacters = state.characters.map(char => {
          if (char.id === characterId) {
            return { ...char, currentHp: newHp };
          }
          return char;
        });
        
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        
        // Add to attack results
        return { 
          characters: updatedCharacters,
          attackResults: [
            ...state.attackResults,
            {
              id: healingId + '-' + characterId,
              characterId,
              healing: amount,
              message: `Healing! ${amount} healing to ${character.name}`,
              isHealing: true,
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    // Helper function to apply healing to a boss
    applyHealingToBoss: (bossId, amount, transactionId = null) => {
      const boss = get().bosses.find(b => b.id === bossId);
      if (!boss || amount <= 0) return;
      
      // Calculate new HP
      const newHP = Math.min(boss.maxHp, boss.currentHp + amount);
      
      // Generate transaction ID if not provided
      const healingId = transactionId || Date.now().toString();
      
      // Update the boss HP
      set(state => {
        const updatedBosses = state.bosses.map(b => {
          if (b.id === bossId) {
            return { ...b, currentHp: newHP };
          }
          return b;
        });
        
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        // Add to attack results
        return { 
          bosses: updatedBosses,
          attackResults: [
            ...state.attackResults,
            {
              id: healingId + '-' + bossId,
              bossId,
              healing: amount,
              message: `Healing! ${amount} healing to ${boss.name}`,
              isHealing: true,
              timestamp: Date.now()
            }
          ]
        };
      });
    },
    
    // Helper function to apply healing to a group
    applyHealingToGroup: (groupId, amount, transactionId = null) => {
      const group = get().enemyGroups.find(g => g.id === groupId);
      if (!group || !group.creatures || amount <= 0) return;
      
      // Create a copy of the group
      const updatedGroup = { ...group };
      const updatedCreatures = [...group.creatures];
      
      // Sort creatures by current HP (lowest first, but exclude those with 0 HP)
      updatedCreatures.sort((a, b) => {
        // Dead creatures (0 HP) go last
        if (a.hp === 0) return 1;
        if (b.hp === 0) return -1;
        
        // Otherwise sort by current HP, lowest first
        return a.hp - b.hp;
      });
      
      let remainingHealing = amount;
      let healedCreatureCount = 0;
      
      // Apply healing to each creature that isn't dead, starting with lowest HP
      for (let i = 0; i < updatedCreatures.length && remainingHealing > 0; i++) {
        const creature = updatedCreatures[i];
        
        // Skip dead creatures
        if (creature.hp === 0) continue;
        
        const missingHP = group.maxHp - creature.hp;
        
        if (missingHP > 0) {
          // Apply healing up to max HP
          const healingToApply = Math.min(remainingHealing, missingHP);
          creature.hp += healingToApply;
          remainingHealing -= healingToApply;
          healedCreatureCount++;
        }
      }
      
      // Update the group with healed creatures
      updatedGroup.creatures = updatedCreatures;
      
      // Calculate new current HP for the group as the average of all creatures
      const totalHP = updatedCreatures.reduce((sum, creature) => sum + creature.hp, 0);
      updatedGroup.currentHp = Math.round(totalHP / updatedCreatures.length);
      
      // Generate transaction ID if not provided
      const healingId = transactionId || Date.now().toString();
      
      // Update the group in the store
      set(state => {
        const updatedGroups = state.enemyGroups.map(g => {
          if (g.id === groupId) {
            return updatedGroup;
          }
          return g;
        });
        
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        
        // Add to attack results
        return { 
          enemyGroups: updatedGroups,
          attackResults: [
            ...state.attackResults,
            {
              id: healingId + '-' + groupId,
              groupId,
              healing: amount,
              message: `Healing! ${amount} healing to ${healedCreatureCount} creatures in ${group.name}`,
              isHealing: true,
              timestamp: Date.now()
            }
          ]
        };
      });
    },
  };
});

export default useDnDStore; 
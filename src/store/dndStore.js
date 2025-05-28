import { create } from 'zustand';

const useDnDStore = create((set, get) => {
  // Load data from localStorage or use defaults
  const savedCharacters = localStorage.getItem('dnd-characters');
  const savedBosses = localStorage.getItem('dnd-bosses');
  const savedEnemyGroups = localStorage.getItem('dnd-enemy-groups');

  // Function to ensure each group has a creatures array
  const migrateGroupData = (groups) => {
    if (!Array.isArray(groups)) return [];
    
    return groups.map(group => {
      if (!group.creatures || !Array.isArray(group.creatures)) {
        // Create creatures array based on count and currentHp
        const creatures = Array(group.count || 0).fill().map(() => ({
          hp: group.currentHp || 0
        }));
        
        return {
          ...group,
          creatures
        };
      }
      return group;
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
    
    targetEntity: null, // { type: 'group'|'boss'|'character', id: 'some-id' }
    
    expandedSections: {
      characters: true,
      bosses: true,
      groups: true,
      damage: true,
      results: true,
    },
    
    // Templates
    groupTemplate: {
      name: '',
      maxHp: 10,
      currentHp: 10,
      ac: 12,
      count: 4,
      showSavingThrows: false,
      savingThrows: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0
      },
      creatures: [] // Will hold individual creature HPs
    },
    
    bossTemplate: {
      name: '',
      maxHp: 100,
      currentHp: 100,
      ac: 15,
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
    
    // Actions
    // Character actions
    addCharacter: (character) => {
      const newChar = {
        id: Date.now().toString(),
        name: character.name || '',
        maxHp: character.maxHp || 0,
        currentHp: character.currentHp || 0,
        ac: character.ac || 0,
        inAoe: false
      };
      
      set(state => {
        const updatedCharacters = [...state.characters, newChar];
        localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
        return { characters: updatedCharacters };
      });
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
    },
    
    removeBoss: (id) => {
      set(state => {
        // Also remove target if this boss was targeted
        const newState = { bosses: state.bosses.filter(boss => boss.id !== id) };
        
        if (state.targetEntity && state.targetEntity.type === 'boss' && state.targetEntity.id === id) {
          newState.targetEntity = null;
        }
        
        localStorage.setItem('dnd-bosses', JSON.stringify(newState.bosses));
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
        inAoe: false,
        showSavingThrows: false,
        savingThrows: { ...groupTemplate.savingThrows },
        creatures: creatures
      };
      
      set(state => {
        const updatedGroups = [...state.enemyGroups, newGroup];
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        return { enemyGroups: updatedGroups };
      });
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
          inAoe: false,
          showSavingThrows: false,
          savingThrows: { ...groupTemplate.savingThrows }
        });
      }
      
      set(state => {
        const updatedGroups = [...state.enemyGroups, ...newGroups];
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        return { enemyGroups: updatedGroups };
      });
    },
    
    removeEnemyGroup: (id) => {
      set(state => {
        // Also remove target if this group was targeted
        const newState = { enemyGroups: state.enemyGroups.filter(group => group.id !== id) };
        
        if (state.targetEntity && state.targetEntity.type === 'group' && state.targetEntity.id === id) {
          newState.targetEntity = null;
        }
        
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(newState.enemyGroups));
        return newState;
      });
    },
    
    duplicateGroup: (group) => {
      const newGroup = {
        ...group,
        id: Date.now().toString(),
        name: `${group.name} (Copy)`,
        creatures: group.creatures ? [...group.creatures] : Array(group.count).fill().map(() => ({
          hp: group.maxHp
        }))
      };
      
      set(state => {
        const updatedGroups = [...state.enemyGroups, newGroup];
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        return { enemyGroups: updatedGroups };
      });
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
        
        // Ensure creatures array exists
        if (!updatedGroup.creatures || !Array.isArray(updatedGroup.creatures)) {
          // Initialize with current HP if no creatures array exists
          updatedGroup.creatures = Array(updatedGroup.count).fill().map(() => ({
            hp: updatedGroup.currentHp
          }));
        }
        
        // Sort creatures by HP (ascending) to damage lowest HP first
        updatedGroup.creatures.sort((a, b) => a.hp - b.hp);
        
        // Apply damage to the creature with lowest HP
        if (updatedGroup.creatures.length > 0) {
          const lowestHpCreature = updatedGroup.creatures[0];
          
          // If damage would kill the creature
          if (damage >= lowestHpCreature.hp) {
            killCount = 1;
            updatedGroup.creatures.shift(); // Remove the killed creature
            updatedGroup.count = updatedGroup.creatures.length;
          } else {
            // Just reduce HP
            lowestHpCreature.hp -= damage;
          }
          
          // Update currentHp to represent the lowest HP in the group
          if (updatedGroup.creatures.length > 0) {
            updatedGroup.currentHp = Math.min(...updatedGroup.creatures.map(c => c.hp));
          }
        }
        
        // Create the updated groups array
        const updatedGroups = state.enemyGroups.map(g => {
          if (g.id === groupId) {
            return updatedGroup;
          }
          return g;
        });
        
        localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
        
        // Generate appropriate message
        const resultMessage = hitStatus === 'critical'
          ? `Critical hit! ${damage} damage to ${group.name} (${killCount} killed)`
          : `Hit! ${damage} damage to ${group.name} (${killCount} killed)`;
            
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
        
        // Update currentHp to represent the lowest HP in the group
        if (updatedGroup.creatures.length > 0) {
          updatedGroup.currentHp = Math.min(...updatedGroup.creatures.map(c => c.hp));
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
          
          // Update currentHp to represent the lowest HP in the group
          if (updatedGroup.creatures.length > 0) {
            updatedGroup.currentHp = Math.min(...updatedGroup.creatures.map(c => c.hp));
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
      const { damage, saveType, saveDC, halfOnSave, percentAffected = 100 } = aoeParams;
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
          
          // Calculate save bonus for this group
          const saveBonus = group.savingThrows?.[saveType] || 0;
          
          // Roll save
          const saveRoll = Math.floor(Math.random() * 20) + 1 + saveBonus;
          const saved = saveRoll >= saveDC;
          console.log(`${group.name} save roll: ${saveRoll} vs DC ${saveDC} - ${saved ? 'Saved' : 'Failed'}`);
          
          // Calculate damage based on save
          let damageToApply = damage;
          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
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
              killCount: 0
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
          
          // Update currentHp to represent the lowest HP in the group
          if (updatedGroup.creatures.length > 0) {
            updatedGroup.currentHp = Math.min(...updatedGroup.creatures.map(c => c.hp));
          }
          
          totalKillCount += killCount;
          
          // Store results for this group
          groupResults.push({
            name: group.name,
            saved: saved,
            damageToApply,
            killCount
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
              message: `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC} (${percentAffected}% affected) - ${groupMessages}${totalKillCount > 0 ? ` - Total kills: ${totalKillCount}` : ""}`,
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
    
    applyDamageToAllBossesInAoe: (aoeParams, forceAll = false) => {
      const { damage, saveType, saveDC, halfOnSave } = aoeParams;
      if (damage <= 0) return;
      
      set(state => {
        // Find bosses marked for AoE or use all if forceAll is true
        const aoeBosses = forceAll 
          ? state.bosses 
          : state.bosses.filter(boss => boss.inAoe);
          
        if (aoeBosses.length === 0) return state;
        
        const updatedBosses = state.bosses.map(boss => {
          // Skip if not in AoE and not forcing all
          if (!forceAll && !boss.inAoe) return boss;
          
          // Calculate save bonus for this boss
          const saveBonus = boss.savingThrows?.[saveType] || 0;
          
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
          
          // Apply damage
          if (damageToApply > 0) {
            const newHp = Math.max(0, boss.currentHp - damageToApply);
            return { ...boss, currentHp: newHp };
          }
          
          return boss;
        });
        
        localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
        
        const bossNames = aoeBosses.map(b => b.name).join(', ');
        const targetText = forceAll ? "all bosses" : bossNames;
        
        return { 
          bosses: updatedBosses,
          attackResults: [
            ...state.attackResults,
            {
              id: Date.now().toString(),
              damage,
              message: `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC} to: ${targetText}`,
              isAoE: true,
              timestamp: Date.now()
            }
          ]
        };
      });
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
      const { damage, saveType, saveDC, halfOnSave } = aoeParams;
      if (damage <= 0) return;
      
      set(state => {
        // Either all characters or those marked for AoE
        const aoeCharacters = forceAll 
          ? state.characters 
          : state.characters.filter(char => char.inAoe);
          
        if (aoeCharacters.length === 0) return state;
        
        const updatedCharacters = state.characters.map(char => {
          // Skip if not in AoE and not forcing all
          if (!forceAll && !char.inAoe) return char;
          
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
        
        const charNames = aoeCharacters.map(c => c.name).join(', ');
        const targetText = forceAll ? "all characters" : charNames;
        
        return { 
          characters: updatedCharacters,
          attackResults: [
            ...state.attackResults,
            {
              id: Date.now().toString(),
              damage,
              message: `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC} to: ${targetText}`,
              isAoE: true,
              timestamp: Date.now()
            }
          ]
        };
      });
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
    
    // Import/Export
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
            modifier: charDamage.modifier
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
          
          // Apply damage modifier
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
          
          if (detail.modifier === 'half') {
            modifierText = ' (half damage)';
            finalDamage = Math.floor(finalDamage / 2);
          } else if (detail.modifier === 'quarter') {
            modifierText = ' (quarter damage)';
            finalDamage = Math.floor(finalDamage / 4);
          } else if (detail.modifier === 'none') {
            modifierText = ' (no damage)';
            finalDamage = 0;
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
    rollGroupsAttacks: (groupTargets, characterAcOverrides = {}, attackBonus = 3) => {
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
            // Roll 1d8+2 for damage
            const damageRoll = get().rollDice(1, 8) + 2;
            damage = isNatural20 ? damageRoll * 2 : damageRoll; // Double damage on crit
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
            targetId: targetCharacterId
          };
          
          // Add to the all results array
          allResults.push({
            characterId: targetCharacterId,
            sourceGroupId: group.id,
            groupName: group.name || 'Group',
            damage: totalDamage,
            hitStatus: groupResults.some(r => r.isNatural20) ? 'critical' : 'hit',
            attackRolls: groupResults,
            hitCount: groupResults.filter(r => r.hits).length
          });
        }
      });
      
      return { results, allResults };
    }
  };
});

export default useDnDStore; 
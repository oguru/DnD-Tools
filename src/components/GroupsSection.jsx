import '../styles/GroupsSection.css';
import '../styles/BossTracker.css';

import useDnDStore from '../store/dndStore';
import { useState } from 'react';

const GroupsSection = () => {
  const {
    enemyGroups,
    bosses,
    characters,
    groupTemplate,
    targetEntity,
    expandedSections,
    toggleSection,
    updateGroupTemplate,
    addEnemyGroup,
    addMultipleEnemyGroups,
    removeEnemyGroup,
    duplicateGroup,
    setTargetEntity,
    toggleGroupAoeTarget,
    toggleGroupSavingThrows,
    toggleGroupTemplateSavingThrows,
    updateGroupSavingThrow,
    getHealthColor,
    calculateHealthPercentage,
    calculateGroupTotalCurrentHP,
    scrollToDamageSection,
    rollD20,
    applyDamageToCharacter,
    rollDice,
    rollGroupsAttacks,
    applyDamageToMultipleCharacters,
    updateEnemyGroup,
    removeBoss,
    updateBoss,
    updateBossHp,
    toggleBossSavingThrows,
    updateBossSavingThrow,
    setBossTarget,
    setBossAoeTarget,
    prepareBossAoeAttack,
    addBossAttackResult
  } = useDnDStore();

  // State for number of groups to add
  const [groupCount, setGroupCount] = useState(5);
  
  // State to track which group is attacking which character
  const [groupTargets, setGroupTargets] = useState({});
  
  // State to track attack results before applying
  const [attackResults, setAttackResults] = useState({});

  // State for global attacks
  const [globalAttackResults, setGlobalAttackResults] = useState(null);
  const [characterAcOverrides, setCharacterAcOverrides] = useState({});
  const [damageModifiers, setDamageModifiers] = useState({});
  const [damageAdjustments, setDamageAdjustments] = useState({});
  const [showGlobalAttacks, setShowGlobalAttacks] = useState(true);

  // State for showing/hiding notes and attacks for bosses
  const [showNotes, setShowNotes] = useState({});
  const [showAttacks, setShowAttacks] = useState({});
  
  // State for boss targets and pending attacks
  const [bossTargets, setBossTargets] = useState({});
  const [pendingAttacks, setPendingAttacks] = useState({});

  // Toggle visibility of boss notes
  const toggleNotes = (bossId) => {
    setShowNotes(prev => ({
      ...prev,
      [bossId]: !prev[bossId]
    }));
  };

  // Toggle visibility of boss attacks
  const toggleAttacks = (bossId) => {
    setShowAttacks(prev => ({
      ...prev,
      [bossId]: !prev[bossId]
    }));
  };

  // Handle boss target selection
  const handleBossTargetChange = (bossId, targetId) => {
    setBossTargets(prev => ({
      ...prev,
      [bossId]: targetId
    }));
  };

  // Roll attack for a boss
  const handleRollAttack = (boss, attack) => {
    // For AOE attacks, populate the AOE section instead
    if (attack.isAoE) {
      prepareBossAoeAttack(boss.id, attack);
      return;
    }

    // Roll to hit
    const rollResult = rollD20();
    const criticalHit = rollResult === 20;
    const criticalMiss = rollResult === 1;
    const totalHit = rollResult + attack.hitBonus;
    
    // Roll damage
    let damageRoll = rollDice(attack.numDice, attack.diceType);
    let totalDamage = damageRoll + attack.modifier;
    
    // Double damage dice on critical hit
    if (criticalHit) {
      const critDamageRoll = rollDice(attack.numDice, attack.diceType);
      totalDamage += critDamageRoll;
    }
    
    // Generate result message
    let resultMessage;
    if (criticalMiss) {
      resultMessage = `Critical Miss!`;
    } else if (criticalHit) {
      resultMessage = `Critical Hit! ${totalDamage} damage (${damageRoll} + ${damageRoll} + ${attack.modifier})`;
    } else {
      resultMessage = `Attack roll: ${totalHit} (${rollResult} + ${attack.hitBonus})
Damage: ${totalDamage} (${damageRoll} + ${attack.modifier})`;
    }
    
    // Add attack result
    addBossAttackResult(boss.id, {
      id: Date.now().toString(),
      attackName: attack.name,
      message: resultMessage,
      damage: totalDamage,
      rollToHit: totalHit,
      criticalHit,
      criticalMiss,
      isAoE: false,
      saveType: attack.saveType,
      saveDC: attack.saveDC,
      halfOnSave: attack.halfOnSave
    });

    // Set the boss as the target and scroll to damage section
    setBossTarget(boss.id);
    scrollToDamageSection();
  };

  // Roll an attack against a targeted player
  const handleRollAttackAgainstPlayer = (boss, attack, targetId) => {
    if (!targetId) return;
    
    // Find the target character
    const targetCharacter = characters.find(c => c.id === targetId);
    if (!targetCharacter) return;
    
    // Roll to hit
    const rollResult = rollD20();
    const criticalHit = rollResult === 20;
    const criticalMiss = rollResult === 1;
    const totalHit = rollResult + attack.hitBonus;
    
    // Determine if the attack hits
    const hits = criticalHit || (!criticalMiss && totalHit >= targetCharacter.ac);
    
    // Roll damage
    let damageRoll = rollDice(attack.numDice, attack.diceType);
    let totalDamage = damageRoll + attack.modifier;
    
    // Double damage dice on critical hit
    if (criticalHit) {
      const critDamageRoll = rollDice(attack.numDice, attack.diceType);
      totalDamage += critDamageRoll;
    }
    
    // Generate result message
    let resultMessage;
    let hitStatus;
    
    if (criticalMiss) {
      resultMessage = `Critical Miss against ${targetCharacter.name} (AC ${targetCharacter.ac})!`;
      hitStatus = 'miss';
    } else if (criticalHit) {
      resultMessage = `Critical Hit against ${targetCharacter.name}! ${totalDamage} damage (${damageRoll} + ${damageRoll} + ${attack.modifier})`;
      hitStatus = 'critical';
    } else if (hits) {
      resultMessage = `Hit ${targetCharacter.name} (AC ${targetCharacter.ac}) with ${totalHit} (${rollResult} + ${attack.hitBonus})! Damage: ${totalDamage} (${damageRoll} + ${attack.modifier})`;
      hitStatus = 'hit';
    } else {
      resultMessage = `Miss against ${targetCharacter.name} (AC ${targetCharacter.ac}) with ${totalHit} (${rollResult} + ${attack.hitBonus})`;
      hitStatus = 'miss';
    }
    
    // Create attack result object
    const attackResult = {
      id: Date.now().toString(),
      attackName: attack.name,
      message: resultMessage,
      damage: totalDamage,
      rollToHit: totalHit,
      criticalHit,
      criticalMiss,
      isAoE: false,
      targetId: targetId,
      targetName: targetCharacter.name,
      hitStatus,
      timestamp: Date.now()
    };
    
    // Store in pending attacks if it hit
    if (hits) {
      setPendingAttacks(prev => ({
        ...prev,
        [attackResult.id]: {
          ...attackResult,
          modifier: 'full'  // Default to full damage
        }
      }));
    } else {
      // If it's a miss, just add the result
      addBossAttackResult(boss.id, attackResult);
    }
  };

  // Handle applying damage with modifier
  const handleApplyDamage = (bossId, attackResultId, modifier) => {
    const pendingAttack = pendingAttacks[attackResultId];
    if (!pendingAttack) return;
    
    // Calculate damage based on modifier
    let finalDamage = pendingAttack.damage;
    let modifierText = '';
    
    if (modifier === 'half') {
      finalDamage = Math.floor(finalDamage / 2);
      modifierText = ' (half damage)';
    } else if (modifier === 'quarter') {
      finalDamage = Math.floor(finalDamage / 4);
      modifierText = ' (quarter damage)';
    } else if (modifier === 'none') {
      finalDamage = 0;
      modifierText = ' (no damage)';
    }
    
    // Update result message with modifier info
    const updatedMessage = pendingAttack.message + modifierText;
    
    // Add the attack result to the boss's history
    addBossAttackResult(bossId, {
      ...pendingAttack,
      message: updatedMessage,
      appliedDamage: finalDamage
    });
    
    // Apply damage to character if not "none"
    if (modifier !== 'none' && finalDamage > 0) {
      applyDamageToCharacter(pendingAttack.targetId, finalDamage, pendingAttack.hitStatus, modifierText);
    }
    
    // Remove from pending attacks
    setPendingAttacks(prev => {
      const newPending = { ...prev };
      delete newPending[attackResultId];
      return newPending;
    });
  };

  // Handle changes to the group template
  const handleGroupTemplateChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'maxHp' || name === 'currentHp' || name === 'ac' || name === 'count'
      ? parseInt(value) || 0
      : value;
    
    updateGroupTemplate(name, parsedValue);
  };

  // Handle changes to saving throws in template
  const handleSavingThrowChange = (ability, value) => {
    updateGroupTemplate(`savingThrows.${ability}`, parseInt(value) || 0);
  };

  // Handle changes to saving throws in groups
  const handleGroupSavingThrowChange = (groupId, ability, value) => {
    updateGroupSavingThrow(groupId, ability, parseInt(value) || 0);
  };

  // Set a group as the target
  const handleSetGroupAsTarget = (group) => {
    const isTargeted = targetEntity && 
                      targetEntity.type === 'group' && 
                      targetEntity.id === group.id;
                      
    if (isTargeted) {
      // If already targeted, just scroll to damage section
      scrollToDamageSection();
    } else {
      // Target this group and scroll
      setTargetEntity({ type: 'group', id: group.id });
    }
  };

  // Handle adding a single group
  const handleAddGroup = () => {
    if (!groupTemplate.name || groupTemplate.count <= 0 || groupTemplate.maxHp <= 0) {
      alert('Please fill in all group fields correctly');
      return;
    }
    addEnemyGroup();
  };

  // Handle adding multiple groups
  const handleAddMultipleGroups = () => {
    if (!groupTemplate.name || groupTemplate.count <= 0 || groupTemplate.maxHp <= 0) {
      alert('Please fill in all group fields correctly');
      return;
    }
    addMultipleEnemyGroups(groupCount);
  };

  // Toggle AOE for a group and update button text
  const handleToggleGroupAoe = (e, groupId) => {
    e.stopPropagation(); // Prevent targeting
    toggleGroupAoeTarget(groupId);
  };

  // Toggle AOE for a boss
  const handleToggleBossAoe = (e, bossId) => {
    if (e) e.stopPropagation(); // Prevent targeting
    setBossAoeTarget(bossId, !bosses.find(b => b.id === bossId)?.inAoe);
  };
  
  // Handle selecting a character target for a group
  const handleSelectTarget = (e, groupId) => {
    e.stopPropagation(); // Prevent group targeting
    const characterId = e.target.value;
    
    setGroupTargets(prev => ({
      ...prev,
      [groupId]: characterId === "" ? null : characterId
    }));
    
    // Clear attack results for this group when target changes
    setAttackResults(prev => {
      const newResults = { ...prev };
      delete newResults[groupId];
      return newResults;
    });
  };
  
  // Roll attacks for a group against its target character
  const handleRollGroupAttack = (e, group) => {
    e.stopPropagation(); // Prevent group targeting
    
    const targetCharacterId = groupTargets[group.id];
    if (!targetCharacterId) {
      alert('Please select a target character first');
      return;
    }
    
    const targetCharacter = characters.find(c => c.id === targetCharacterId);
    if (!targetCharacter) {
      alert('Target character not found');
      return;
    }
    
    // Roll attack for each creature in the group
    const results = [];
    let totalDamage = 0;
    
    // Use an attack bonus of +3 by default
    const attackBonus = 3;
    
    for (let i = 0; i < group.count; i++) {
      // Roll to hit
      const attackRollBase = rollD20();
      const isNatural20 = attackRollBase === 20;
      const isNatural1 = attackRollBase === 1;
      const totalAttackRoll = attackRollBase + attackBonus;
      const hits = isNatural20 || (!isNatural1 && totalAttackRoll >= targetCharacter.ac);
      
      // Roll damage if hit
      let damage = 0;
      if (hits) {
        // Roll 1d8+2 for damage
        const damageRoll = rollDice(1, 8) + 2;
        damage = isNatural20 ? damageRoll * 2 : damageRoll; // Double damage on crit
        totalDamage += damage;
      }
      
      results.push({
        entityNumber: i + 1,
        attackRoll: totalAttackRoll,
        attackRollBase,
        isNatural20,
        isNatural1,
        hits,
        damage
      });
    }
    
    // Store the results
    setAttackResults(prev => ({
      ...prev,
      [group.id]: {
        results,
        totalDamage,
        targetName: targetCharacter.name,
        targetAc: targetCharacter.ac,
        targetId: targetCharacterId
      }
    }));
  };
  
  // Apply damage from a group attack to a character
  const handleApplyDamageGroup = (e, groupId, damageModifier = 'full') => {
    e.stopPropagation(); // Prevent group targeting
    
    const attackResult = attackResults[groupId];
    if (!attackResult) return;
    
    // Calculate the final damage based on the modifier
    let finalDamage = attackResult.totalDamage;
    if (damageModifier === 'half') {
      finalDamage = Math.floor(finalDamage / 2);
    } else if (damageModifier === 'quarter') {
      finalDamage = Math.floor(finalDamage / 4);
    }
    
    // Apply the damage to the character
    applyDamageToCharacter(
      attackResult.targetId, 
      finalDamage, 
      attackResult.results.some(r => r.isNatural20) ? 'critical' : 'hit',
      damageModifier !== 'full' ? `(${damageModifier} damage)` : ''
    );
    
    // Clear the attack results for this group
    setAttackResults(prev => {
      const newResults = { ...prev };
      delete newResults[groupId];
      return newResults;
    });
  };

  // Roll attacks for all groups
  const handleRollAllGroupAttacks = () => {
    // Check if we have any valid group targets
    if (!hasValidGroupTargets) {
      alert('No valid targets selected for any groups');
      return;
    }

    try {
      // Pass the current AC overrides to the roll function
      const { results, allResults } = rollGroupsAttacks(groupTargets, characterAcOverrides);
      console.log('Roll all attacks results:', results, allResults);
      
      // Reset any existing damage adjustments when rolling new attacks
      setDamageAdjustments({});
      
      // Initialize damage modifiers if not set
      const initialDamageModifiers = {};
      
      // Make sure allResults exist and is an array
      if (allResults && Array.isArray(allResults)) {
        allResults.forEach(result => {
          if (result && result.characterId) {
            // Initialize the character entry if it doesn't exist
            if (!initialDamageModifiers[result.characterId]) {
              initialDamageModifiers[result.characterId] = {};
            }
            
            // Only set if the sourceGroupId exists
            if (result.sourceGroupId) {
              initialDamageModifiers[result.characterId][result.sourceGroupId] = 'full';
            }
          }
        });
        
        if (Object.keys(initialDamageModifiers).length > 0) {
          setDamageModifiers(prev => {
            const newDamageModifiers = { ...prev };
            
            // Safely merge the initialDamageModifiers
            Object.keys(initialDamageModifiers).forEach(characterId => {
              if (!newDamageModifiers[characterId]) {
                newDamageModifiers[characterId] = {};
              }
              
              Object.keys(initialDamageModifiers[characterId]).forEach(groupId => {
                newDamageModifiers[characterId][groupId] = initialDamageModifiers[characterId][groupId];
              });
            });
            
            return newDamageModifiers;
          });
        }
      }
      
      // Set global results
      setGlobalAttackResults({ results, allResults });
      
      // Also set individual group attack results so they show up in the group cards
      if (results) {
        setAttackResults(results);
      }
    } catch (error) {
      console.error('Error rolling group attacks:', error);
      alert('An error occurred while rolling attacks. Please try again.');
    }
  };
  
  // Handle changing AC override for a character
  const handleAcOverrideChange = (characterId, value) => {
    const newAcValue = value ? parseInt(value) : null;
    const character = characters.find(c => c.id === characterId);
    
    console.log(`AC Override change for ${character?.name}: from ${characterAcOverrides[characterId]} to ${newAcValue}`);
    
    // Update the AC override state
    setCharacterAcOverrides(prev => ({
      ...prev,
      [characterId]: newAcValue
    }));
    
    // If we have attack results, recalculate damage based on the new AC
    if (globalAttackResults && globalAttackResults.allResults) {
      setGlobalAttackResults(prev => {
        if (!prev || !prev.allResults) return prev;
        
        const newAllResults = prev.allResults.map(result => {
          if (result.characterId === characterId && result.attackRolls) {
            // Get the character's original AC
            if (!character) return result;
            
            // Store the original damage if not already stored
            const originalDamage = result.originalDamage || result.damage;
            
            // If AC override is null or same as character's AC, restore original damage
            if (newAcValue === null || newAcValue === character.ac) {
              console.log(`Restoring original damage for ${character.name} from ${result.groupName}: ${originalDamage}`);
              return {
                ...result,
                damage: originalDamage,
                originalDamage
              };
            }
            
            // Count hits with new AC
            const originalHitCount = result.hitCount || 0;
            if (originalHitCount === 0) return result; // No hits to begin with
            
            // Recalculate hits with new AC
            const newHitCount = result.attackRolls.filter(roll => 
              roll.isNatural20 || (!roll.isNatural1 && roll.attackRoll >= newAcValue)
            ).length;
            
            // Calculate new damage based on hit ratio
            let newDamage = originalDamage;
            if (originalHitCount > 0) {
              const hitRatio = newHitCount / originalHitCount;
              newDamage = Math.floor(originalDamage * hitRatio);
            }
            
            console.log(`AC override for ${character.name} from ${result.groupName}:`, {
              originalAC: character.ac,
              newAC: newAcValue,
              originalDamage,
              newDamage,
              originalHits: originalHitCount,
              newHits: newHitCount,
              attackRolls: result.attackRolls.map(r => ({ roll: r.attackRoll, hit: r.isNatural20 || (!r.isNatural1 && r.attackRoll >= newAcValue) }))
            });
            
            return {
              ...result,
              damage: newDamage,
              originalDamage,
              adjustedHitCount: newHitCount
            };
          }
          return result;
        });
        
        return {
          ...prev,
          allResults: newAllResults
        };
      });
    }
  };
  
  // Handle changing damage modifier for a character-group pair
  const handleDamageModifierChange = (characterId, groupId, value) => {
    setDamageModifiers(prev => ({
      ...prev,
      [characterId]: {
        ...(prev[characterId] || {}),
        [groupId]: value
      }
    }));
  };
  
  // Handle adjusting damage amount for a character-group pair
  const handleAdjustDamage = (characterId, groupId, amount) => {
    // Update global attack results with adjusted damage
    setGlobalAttackResults(prev => {
      if (!prev || !prev.allResults) return prev;
      
      const newAllResults = prev.allResults.map(result => {
        if (result.characterId === characterId && result.sourceGroupId === groupId) {
          // Use current damage (which may already be adjusted by AC override)
          const currentDamage = result.damage;
          
          // Track the adjustment separately for display purposes
          const currentAdjustment = damageAdjustments[characterId]?.[groupId] || 0;
          const newAdjustment = currentAdjustment + amount;
          
          setDamageAdjustments(prev => ({
            ...prev,
            [characterId]: {
              ...(prev[characterId] || {}),
              [groupId]: newAdjustment
            }
          }));
          
          // Calculate new damage - ensure it doesn't go below 0
          // Store originalDamage if not already stored (before any manual adjustments)
          const originalDamage = result.originalDamage !== undefined ? result.originalDamage : result.damage;
          
          return {
            ...result,
            damage: Math.max(0, currentDamage + amount),
            originalDamage,
            manualAdjustment: (result.manualAdjustment || 0) + amount
          };
        }
        return result;
      });
      
      return {
        ...prev,
        allResults: newAllResults
      };
    });
  };
  
  // Apply all rolled damage to characters
  const handleApplyAllDamage = () => {
    if (!globalAttackResults || !globalAttackResults.allResults) return;
    
    // Prepare damage details with modifiers - use the current damage value 
    // which already includes AC override and manual adjustments
    const damageDetails = globalAttackResults.allResults.map(result => ({
      ...result,
      modifier: damageModifiers[result.characterId]?.[result.sourceGroupId] || 'full',
      acOverride: characterAcOverrides[result.characterId] || null,
      // The damage field already includes both AC override and manual adjustments
      // Pass hitCount and adjustedHitCount for logging
      hitCount: result.hitCount,
      adjustedHitCount: result.adjustedHitCount,
      manualAdjustment: result.manualAdjustment
    }));
    
    // Debug logging
    console.log('Applying damage with details:', damageDetails.map(detail => ({
      character: characters.find(c => c.id === detail.characterId)?.name,
      group: detail.groupName,
      originalDamage: detail.originalDamage,
      adjustedDamage: detail.damage,
      modifier: detail.modifier,
      acOverride: detail.acOverride,
      hitCount: detail.hitCount,
      adjustedHitCount: detail.adjustedHitCount,
      manualAdjustment: detail.manualAdjustment
    })));
    
    // Apply the damage
    applyDamageToMultipleCharacters(damageDetails);
    
    // Clear the results and adjustments
    setGlobalAttackResults(null);
    setDamageAdjustments({});
  };

  // Render saving throws fields
  const renderSavingThrows = (savingThrows, onChange = null, groupId = null) => {
    const abilities = [
      { key: 'str', label: 'STR' },
      { key: 'dex', label: 'DEX' },
      { key: 'con', label: 'CON' },
      { key: 'int', label: 'INT' },
      { key: 'wis', label: 'WIS' },
      { key: 'cha', label: 'CHA' }
    ];

    return (
      <div className="saving-throws-grid">
        {abilities.map(ability => (
          <div key={ability.key} className="saving-throw-field">
            <label>{ability.label}:</label>
            <input
              type="number"
              value={savingThrows[ability.key]}
              onChange={(e) => {
                if (onChange) {
                  onChange(groupId, ability.key, e.target.value);
                } else {
                  handleSavingThrowChange(ability.key, e.target.value);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    );
  };

  // Check if we have any valid group targets
  const hasValidGroupTargets = Object.keys(groupTargets).some(
    groupId => groupTargets[groupId] && characters.some(c => c.id === groupTargets[groupId])
  );

  // Add this function to the component:
  const handleUpdateGroupInitiative = (groupId, value) => {
    updateEnemyGroup(groupId, 'initiative', value);
  };

  // Handle changes to boss saving throws
  const handleBossSavingThrowChange = (bossId, ability, value) => {
    updateBossSavingThrow(bossId, ability, parseInt(value) || 0);
  };

  return (
    <div className="groups-section">
      <div className="section-header">
        <h3>Enemy Groups & Bosses</h3>
        <button
          className="toggle-section-button"
          onClick={() => toggleSection('groups')}
        >
          {expandedSections.groups ? 'Hide Groups' : 'Show Groups'}
        </button>
      </div>

      {expandedSections.groups && (
        <>
          <div className="group-template">
            <h4>Add New Enemy Group</h4>
            <div className="group-template-fields">
              <div className="group-field">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={groupTemplate.name}
                  onChange={handleGroupTemplateChange}
                />
              </div>
              <div className="group-field">
                <label>Max HP:</label>
                <input
                  type="number"
                  name="maxHp"
                  value={groupTemplate.maxHp}
                  onChange={handleGroupTemplateChange}
                  min="0"
                />
              </div>
              <div className="group-field">
                <label>AC:</label>
                <input
                  type="number"
                  name="ac"
                  value={groupTemplate.ac}
                  onChange={handleGroupTemplateChange}
                  min="0"
                />
              </div>
              <div className="group-field">
                <label>Count:</label>
                <input
                  type="number"
                  name="count"
                  value={groupTemplate.count}
                  onChange={handleGroupTemplateChange}
                  min="1"
                />
              </div>
              <div className="template-field">
                <label>Initiative:</label>
                <input
                  type="number"
                  name="initiative"
                  value={groupTemplate.initiative || 0}
                  onChange={handleGroupTemplateChange}
                  min="0"
                  placeholder="Initiative"
                />
              </div>
            </div>
            
            <div className="saving-throws-container">
              <div className="saving-throws-header" onClick={toggleGroupTemplateSavingThrows}>
                <h5>Saving Throws {groupTemplate.showSavingThrows ? '▼' : '►'}</h5>
              </div>
              
              {groupTemplate.showSavingThrows && renderSavingThrows(groupTemplate.savingThrows)}
            </div>
            
            <div className="group-template-actions">
              <button
                className="add-group-button"
                onClick={handleAddGroup}
                disabled={!groupTemplate.name || groupTemplate.count <= 0 || groupTemplate.maxHp <= 0}
              >
                Add Group
              </button>
              
              <div className="multiple-groups-input">
                <input
                  type="number"
                  value={groupCount}
                  onChange={(e) => setGroupCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className="group-count-input"
                />
                <button
                  className="add-multiple-button"
                  onClick={handleAddMultipleGroups}
                  disabled={!groupTemplate.name || groupTemplate.count <= 0 || groupTemplate.maxHp <= 0}
                >
                  Add {groupCount} Groups
                </button>
              </div>
            </div>
          </div>

          {/* Global Attack System */}
          {enemyGroups && enemyGroups.length > 0 && characters && characters.length > 0 && (
            <div className="global-attack-section">
              <div className="section-header">
                <h4>Group Attack System</h4>
                <button
                  className="toggle-section-button small"
                  onClick={() => setShowGlobalAttacks(!showGlobalAttacks)}
                >
                  {showGlobalAttacks ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showGlobalAttacks && (
                <>
                  <div className="global-attack-controls">
                    <button
                      className="roll-all-attacks-button"
                      onClick={handleRollAllGroupAttacks}
                      disabled={!hasValidGroupTargets}
                    >
                      Roll All Group Attacks
                    </button>
                    
                    {globalAttackResults && (
                      <button
                        className="apply-all-damage-button"
                        onClick={handleApplyAllDamage}
                      >
                        Apply All Damage
                      </button>
                    )}
                  </div>
                  
                  {globalAttackResults && (
                    <div className="global-attack-results">
                      <h5>Attack Results</h5>
                      
                      <div className="character-damage-table">
                        <div className="character-damage-header">
                          <div>Character</div>
                          <div>Current AC</div>
                          <div>Override AC</div>
                          <div>Attacker</div>
                          <div>Damage</div>
                          <div>Adjust</div>
                          <div>Modifier</div>
                        </div>
                        
                        {globalAttackResults.allResults.map(result => {
                          const character = characters.find(c => c.id === result.characterId);
                          if (!character) return null;
                          
                          return (
                            <div key={`${result.characterId}-${result.sourceGroupId}`} className="character-damage-row">
                              <div>{character.name}</div>
                              <div>{character.ac}</div>
                              <div>
                                <input
                                  type="number"
                                  value={characterAcOverrides[character.id] || ''}
                                  onChange={(e) => handleAcOverrideChange(character.id, e.target.value)}
                                  placeholder="AC"
                                  min="0"
                                  className="ac-override-input"
                                />
                              </div>
                              <div>{result.groupName}</div>
                              <div>
                                {damageAdjustments[character.id]?.[result.sourceGroupId] ? 
                                  <>
                                    <span className="adjusted-damage">{result.damage}</span>
                                    <span className="original-damage">
                                      ({(result.originalDamage || result.damage)}
                                      {damageAdjustments[character.id][result.sourceGroupId] > 0 ? 
                                        ` +${damageAdjustments[character.id][result.sourceGroupId]}` :
                                        ` ${damageAdjustments[character.id][result.sourceGroupId]}`}
                                      )
                                    </span>
                                  </> :
                                  <>
                                    <span className={characterAcOverrides[character.id] && result.originalDamage !== result.damage ? "adjusted-damage" : ""}>{result.damage}</span>
                                    {characterAcOverrides[character.id] && result.originalDamage && result.originalDamage !== result.damage && (
                                      <span className="original-damage">
                                        ({result.originalDamage})
                                        {result.hitCount && result.adjustedHitCount !== undefined && (
                                          <> Hits: {result.adjustedHitCount}/{result.hitCount}</>
                                        )}
                                      </span>
                                    )}
                                  </>
                                }
                              </div>
                              <div className="damage-adjustment">
                                <button
                                  onClick={() => handleAdjustDamage(character.id, result.sourceGroupId, -5)}
                                  className="damage-adjust-button"
                                  title="Reduce damage by 5"
                                >
                                  -5
                                </button>
                                <button
                                  onClick={() => handleAdjustDamage(character.id, result.sourceGroupId, -1)}
                                  className="damage-adjust-button"
                                  title="Reduce damage by 1"
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleAdjustDamage(character.id, result.sourceGroupId, 1)}
                                  className="damage-adjust-button"
                                  title="Increase damage by 1"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => handleAdjustDamage(character.id, result.sourceGroupId, 5)}
                                  className="damage-adjust-button"
                                  title="Increase damage by 5"
                                >
                                  +5
                                </button>
                              </div>
                              <div>
                                <select
                                  value={damageModifiers[character.id]?.[result.sourceGroupId] || 'full'}
                                  onChange={(e) => handleDamageModifierChange(character.id, result.sourceGroupId, e.target.value)}
                                  className="damage-modifier-select"
                                >
                                  <option value="full">Full Damage</option>
                                  <option value="half">Half Damage</option>
                                  <option value="quarter">Quarter Damage</option>
                                  <option value="none">No Damage</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="entities-container">
            {/* Display Bosses */}
            {bosses && bosses.length > 0 && (
              <>
                <h4>Bosses</h4>
                <div className="bosses-list">
                  {bosses.map(boss => {
                    const healthPercentage = calculateHealthPercentage(boss.currentHp, boss.maxHp);
                    const healthColor = getHealthColor(healthPercentage);
                    const isTargeted = targetEntity && 
                                      targetEntity.type === 'boss' && 
                                      targetEntity.id === boss.id;
                    
                    return (
                      <div 
                        key={boss.id} 
                        className={`boss-card ${isTargeted ? 'targeted' : ''} ${boss.inAoe ? 'in-aoe' : ''}`}
                      >
                        <div className="boss-header">
                          <h4>{boss.name}</h4>
                          <div className="boss-actions">
                            <button 
                              className="remove-boss-button"
                              onClick={() => removeBoss(boss.id)}
                              title="Remove Boss"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        
                        <div className="boss-stats">
                          <div className="boss-stat">
                            <span>HP:</span>
                            <div className="boss-hp-controls">
                              <button 
                                onClick={() => updateBossHp(boss.id, -5)}
                                className="hp-button"
                              >
                                -5
                              </button>
                              <button 
                                onClick={() => updateBossHp(boss.id, -1)}
                                className="hp-button"
                              >
                                -1
                              </button>
                              <input
                                type="number"
                                value={boss.currentHp}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  updateBoss(boss.id, 'currentHp', Math.max(0, Math.min(value, boss.maxHp)));
                                }}
                                min="0"
                                max={boss.maxHp}
                              />
                              <span>/ {boss.maxHp}</span>
                              <button 
                                onClick={() => updateBossHp(boss.id, 1)}
                                className="hp-button"
                              >
                                +1
                              </button>
                              <button 
                                onClick={() => updateBossHp(boss.id, 5)}
                                className="hp-button"
                              >
                                +5
                              </button>
                            </div>
                          </div>
                          <div className="boss-stat">
                            <span>AC:</span>
                            <input
                              type="number"
                              value={boss.ac}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                updateBoss(boss.id, 'ac', Math.max(0, value));
                              }}
                              min="0"
                            />
                          </div>
                          <div className="boss-stat">
                            <span>Init:</span>
                            <input
                              type="number"
                              value={boss.initiative || 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                updateBoss(boss.id, 'initiative', Math.max(0, value));
                              }}
                              min="0"
                            />
                          </div>
                        </div>
                        
                        <div className="boss-health-bar-container">
                          <div 
                            className="boss-health-bar"
                            style={{
                              width: `${healthPercentage}%`,
                              backgroundColor: healthColor
                            }}
                          ></div>
                        </div>
                        
                        {/* Saving Throws Toggle */}
                        <div className="saving-throws-container">
                          <div 
                            className="saving-throws-header" 
                            onClick={() => toggleBossSavingThrows(boss.id)}
                          >
                            <h5>Saving Throws {boss.showSavingThrows ? '▼' : '►'}</h5>
                          </div>
                          
                          {boss.showSavingThrows && renderSavingThrows(boss.savingThrows, handleBossSavingThrowChange, boss.id)}
                        </div>
                        
                        {/* Target buttons - updated to match the group UI */}
                        <div className="boss-targeting">
                          <button 
                            className={`target-button ${isTargeted ? 'active' : ''}`}
                            onClick={() => setBossTarget(boss.id)}
                            title={isTargeted ? "Already targeted" : "Set as target for single attack"}
                          >
                            Target
                          </button>
                          <button 
                            className={`aoe-button ${boss.inAoe ? 'active' : ''}`}
                            onClick={() => handleToggleBossAoe(null, boss.id)}
                            title={boss.inAoe ? "Remove from AoE" : "Add to AoE"}
                          >
                            {boss.inAoe ? "In AoE" : "Add to AoE"}
                          </button>
                        </div>
                        
                        {boss.notes && (
                          <div className="boss-notes-section">
                            <div 
                              className="notes-header"
                              onClick={() => toggleNotes(boss.id)}
                            >
                              <h5>Notes {showNotes[boss.id] ? '▼' : '►'}</h5>
                            </div>
                            {showNotes[boss.id] && (
                              <div className="boss-notes">
                                <pre>{boss.notes}</pre>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {boss.attacks && boss.attacks.length > 0 && (
                          <div className="boss-attacks-section">
                            <div 
                              className="attacks-header"
                              onClick={() => toggleAttacks(boss.id)}
                            >
                              <h5>Attacks {showAttacks[boss.id] ? '▼' : '►'}</h5>
                            </div>
                            {showAttacks[boss.id] && (
                              <div className="boss-attacks">
                                <ul>
                                  {boss.attacks.map(attack => (
                                    <li key={attack.id} className="boss-attack-item">
                                      <div className="attack-info">
                                        <span className="attack-name">{attack.name}</span>
                                        <span className="attack-details">
                                          {attack.isAoE ? 'AoE - ' : ''}
                                          {attack.numDice}d{attack.diceType}+{attack.modifier}
                                          {!attack.isAoE && ` (${attack.hitBonus >= 0 ? '+' : ''}${attack.hitBonus} to hit)`}
                                          {attack.isAoE && ` (DC ${attack.saveDC} ${attack.saveType.toUpperCase()}, ${attack.halfOnSave ? 'half' : 'no'} damage on save)`}
                                        </span>
                                      </div>
                                      
                                      <div className="attack-controls">
                                        {attack.isAoE ? (
                                          <button 
                                            className="roll-attack-button aoe-attack"
                                            onClick={() => handleRollAttack(boss, attack)}
                                          >
                                            Use AoE
                                          </button>
                                        ) : (
                                          <div className="target-attack-container">
                                            <select 
                                              className="player-target-select"
                                              value={bossTargets[boss.id] || ''}
                                              onChange={(e) => handleBossTargetChange(boss.id, e.target.value)}
                                            >
                                              <option value="">Select Target</option>
                                              {characters.map(character => (
                                                <option key={character.id} value={character.id}>
                                                  {character.name} (AC: {character.ac})
                                                </option>
                                              ))}
                                            </select>
                                            <button 
                                              className="roll-attack-button"
                                              onClick={() => handleRollAttackAgainstPlayer(boss, attack, bossTargets[boss.id])}
                                              disabled={!bossTargets[boss.id]}
                                            >
                                              Roll
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Display pending attack results with damage options */}
                                      {Object.values(pendingAttacks)
                                        .filter(pendingAttack => 
                                          pendingAttack.targetId === bossTargets[boss.id] && 
                                          pendingAttack.attackName === attack.name
                                        )
                                        .map(attackResult => (
                                          <div key={attackResult.id} className="pending-attack-result">
                                            <div className="attack-result-message">
                                              {attackResult.message}
                                            </div>
                                            <div className="damage-modifier-controls">
                                              <button 
                                                className="damage-button full-damage"
                                                onClick={() => handleApplyDamage(boss.id, attackResult.id, 'full')}
                                              >
                                                Full
                                              </button>
                                              <button 
                                                className="damage-button half-damage"
                                                onClick={() => handleApplyDamage(boss.id, attackResult.id, 'half')}
                                              >
                                                Half
                                              </button>
                                              <button 
                                                className="damage-button quarter-damage"
                                                onClick={() => handleApplyDamage(boss.id, attackResult.id, 'quarter')}
                                              >
                                                Quarter
                                              </button>
                                              <button 
                                                className="damage-button no-damage"
                                                onClick={() => handleApplyDamage(boss.id, attackResult.id, 'none')}
                                              >
                                                None
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Display Enemy Groups */}
            {enemyGroups && enemyGroups.length > 0 && (
              <div className="groups-list">
                <h4>Enemy Groups</h4>
                <div className="entities-grid">
                  {enemyGroups.map(group => {
                    // Calculate health percentage based on total remaining HP vs total max HP
                    const totalCurrentHP = calculateGroupTotalCurrentHP(group);
                    // Calculate original max HP based on original count (stored in maxCount if available, or use current count)
                    const originalCount = group.originalCount || group.count;
                    const totalOriginalMaxHP = originalCount * group.maxHp;
                    // Calculate health percentage as current total HP vs original total max HP
                    const healthPercentage = calculateHealthPercentage(totalCurrentHP, totalOriginalMaxHP);
                    const healthColor = getHealthColor(healthPercentage);
                    const isTargeted = targetEntity && 
                                      targetEntity.type === 'group' && 
                                      targetEntity.id === group.id;
                    const attackResult = attackResults[group.id];
                    
                    return (
                      <div 
                        key={group.id} 
                        className={`entity-card ${isTargeted ? 'targeted' : ''} ${group.inAoe ? 'in-aoe' : ''}`}
                        onClick={() => handleSetGroupAsTarget(group)}
                      >
                        <div className="entity-header">
                          <h5>{group.name} ({group.count}/{group.originalCount || group.count})</h5>
                          <div className="entity-actions-top">
                            <button 
                              className="duplicate-entity-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateGroup(group);
                              }}
                              title="Duplicate Group"
                            >
                              <span>+</span>
                            </button>
                            <button 
                              className="remove-entity-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeEnemyGroup(group.id);
                              }}
                              title="Remove Group"
                            >
                              <span>×</span>
                            </button>
                          </div>
                        </div>
                        <div className="entity-details">
                          <div className="entity-field">
                            <span>HP:</span>
                            <span>{group.currentHp}/{group.maxHp}</span>
                          </div>
                          <div className="entity-field">
                            <span>AC:</span>
                            <span>{group.ac}</span>
                          </div>
                          <div className="entity-field">
                            <span>Init:</span>
                            <input
                              type="number"
                              value={group.initiative || 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                // Use your existing method to update a group
                                // This might need to be adjusted based on your actual API
                                // For example:
                                // updateGroup(group.id, 'initiative', value);
                                // or:
                                handleUpdateGroupInitiative(group.id, value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              min="0"
                              className="initiative-input"
                            />
                          </div>
                        </div>
                        
                        {/* Individual Creature HP Display */}
                        <div className="creature-hp-grid" onClick={(e) => e.stopPropagation()}>
                          {group.creatures && Array.isArray(group.creatures) ? (
                            group.creatures.map((creature, index) => {
                              const creatureHealthPercentage = calculateHealthPercentage(creature.hp, group.maxHp);
                              const creatureHealthColor = getHealthColor(creatureHealthPercentage);
                              
                              return (
                                <div key={index} className="creature-hp" title={`Creature ${index + 1}: ${creature.hp}/${group.maxHp} HP`}>
                                  <div className="creature-hp-bar-container">
                                    <div 
                                      className="creature-hp-bar"
                                      style={{
                                        width: `${creatureHealthPercentage}%`,
                                        backgroundColor: creatureHealthColor
                                      }}
                                    ></div>
                                  </div>
                                  <span className="creature-hp-text">{creature.hp}</span>
                                </div>
                              );
                            })
                          ) : (
                            // Fallback if creatures array is not available
                            Array(group.count).fill().map((_, index) => (
                              <div key={index} className="creature-hp" title={`Creature ${index + 1}: ${group.currentHp}/${group.maxHp} HP`}>
                                <div className="creature-hp-bar-container">
                                  <div 
                                    className="creature-hp-bar"
                                    style={{
                                      width: `${calculateHealthPercentage(group.currentHp, group.maxHp)}%`,
                                      backgroundColor: getHealthColor(calculateHealthPercentage(group.currentHp, group.maxHp))
                                    }}
                                  ></div>
                                </div>
                                <span className="creature-hp-text">{group.currentHp}</span>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Target character selection */}
                        <div className="entity-target-selection" onClick={(e) => e.stopPropagation()}>
                          <label>Target:</label>
                          <select 
                            value={groupTargets[group.id] || ""}
                            onChange={(e) => handleSelectTarget(e, group.id)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Select target</option>
                            {characters.map(char => (
                              <option key={char.id} value={char.id}>{char.name} (AC: {char.ac})</option>
                            ))}
                          </select>
                          
                          <button
                            className="roll-attack-button"
                            onClick={(e) => handleRollGroupAttack(e, group)}
                            disabled={!groupTargets[group.id]}
                          >
                            Roll Attacks
                          </button>
                        </div>
                        
                        {/* Attack results */}
                        {attackResult && (
                          <div className="entity-attack-results" onClick={(e) => e.stopPropagation()}>
                            <h6>Attack Results vs {attackResult.targetName} (AC: {attackResult.targetAc})</h6>
                            <div className="attack-summary">
                              <div>Hits: {attackResult.results.filter(r => r.hits).length} / {group.count}</div>
                              <div>Total Damage: {attackResult.totalDamage}</div>
                            </div>
                            <div className="attack-rolls">
                              {attackResult.results.map((result, index) => (
                                <div 
                                  key={index} 
                                  className={`attack-roll ${result.hits ? 'hit' : 'miss'} ${result.isNatural20 ? 'crit' : ''} ${result.isNatural1 ? 'fumble' : ''}`}
                                  title={
                                    result.isNatural20 ? 'Critical Hit!' : 
                                    result.isNatural1 ? 'Critical Miss!' :
                                    result.hits ? `Hit (rolled ${result.attackRoll})` : 
                                    `Miss (rolled ${result.attackRoll}, needed ${attackResult.targetAc})`
                                  }
                                >
                                  {result.hits ? 
                                    (result.isNatural20 ? `Crit! ${result.damage}` : result.damage) : 
                                    'Miss'
                                  }
                                </div>
                              ))}
                            </div>
                            <div className="damage-modifier-buttons">
                              <button
                                className="damage-modifier-button"
                                onClick={(e) => handleApplyDamageGroup(e, group.id, 'full')}
                              >
                                Full Damage
                              </button>
                              <button
                                className="damage-modifier-button"
                                onClick={(e) => handleApplyDamageGroup(e, group.id, 'half')}
                              >
                                Half Damage
                              </button>
                              <button
                                className="damage-modifier-button"
                                onClick={(e) => handleApplyDamageGroup(e, group.id, 'quarter')}
                              >
                                Quarter Damage
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Saving Throws Toggle */}
                        {group.savingThrows && (
                          <div className="saving-throws-container">
                            <div 
                              className="saving-throws-header" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupSavingThrows(group.id);
                              }}
                            >
                              <h5>Saving Throws {group.showSavingThrows ? '▼' : '►'}</h5>
                            </div>
                            
                            {group.showSavingThrows && renderSavingThrows(group.savingThrows, handleGroupSavingThrowChange, group.id)}
                          </div>
                        )}
                        
                        <div className="entity-health-bar-container">
                          <div 
                            className="entity-health-bar"
                            style={{
                              width: `${healthPercentage}%`,
                              backgroundColor: healthColor
                            }}
                          ></div>
                        </div>
                        
                        <div className="entity-actions">
                          <button 
                            className={`target-button ${isTargeted ? 'active' : ''}`}
                            onClick={() => handleSetGroupAsTarget(group)}
                            title={isTargeted ? "Scroll to damage application" : "Set as target"}
                          >
                            {isTargeted ? "Scroll to Damage" : "Target"}
                          </button>
                          <button 
                            className={`aoe-button ${group.inAoe ? 'active' : ''}`}
                            onClick={(e) => handleToggleGroupAoe(e, group.id)}
                            title={group.inAoe ? "Remove from AoE" : "Add to AoE"}
                          >
                            {group.inAoe ? "In AoE" : "Add to AoE"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show message if no entities */}
            {(!bosses || bosses.length === 0) && (!enemyGroups || enemyGroups.length === 0) && (
              <div className="no-entities-message">
                <p>No bosses or enemy groups added yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GroupsSection; 
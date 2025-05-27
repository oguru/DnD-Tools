import '../styles/GroupsSection.css';

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
    toggleBossAoeTarget,
    toggleGroupSavingThrows,
    toggleGroupTemplateSavingThrows,
    updateGroupSavingThrow,
    getHealthColor,
    calculateHealthPercentage,
    scrollToDamageSection,
    rollD20,
    applyDamageToCharacter,
    rollDice,
    rollGroupsAttacks,
    applyDamageToMultipleCharacters
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
  const [showGlobalAttacks, setShowGlobalAttacks] = useState(false);

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

  // Set a boss as the target
  const handleSetBossAsTarget = (boss) => {
    const isTargeted = targetEntity && 
                      targetEntity.type === 'boss' && 
                      targetEntity.id === boss.id;
                      
    if (isTargeted) {
      // If already targeted, just scroll to damage section
      scrollToDamageSection();
    } else {
      // Target this boss and scroll
      setTargetEntity({ type: 'boss', id: boss.id });
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
    e.stopPropagation(); // Prevent targeting
    toggleBossAoeTarget(bossId);
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
  const handleApplyDamage = (e, groupId, damageModifier = 'full') => {
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
              <div className="bosses-list">
                <h4>Bosses</h4>
                <div className="entities-grid">
                  {bosses.map(boss => {
                    const healthPercentage = calculateHealthPercentage(boss.currentHp, boss.maxHp);
                    const healthColor = getHealthColor(healthPercentage);
                    const isTargeted = targetEntity && 
                                      targetEntity.type === 'boss' && 
                                      targetEntity.id === boss.id;
                    
                    return (
                      <div 
                        key={boss.id} 
                        className={`entity-card ${isTargeted ? 'targeted' : ''} ${boss.inAoe ? 'in-aoe' : ''}`}
                        onClick={() => handleSetBossAsTarget(boss)}
                      >
                        <div className="entity-header">
                          <h5>{boss.name}</h5>
                        </div>
                        <div className="entity-stats">
                          <div className="entity-stat">
                            <span>HP:</span>
                            <span>{boss.currentHp} / {boss.maxHp}</span>
                          </div>
                          <div className="entity-stat">
                            <span>AC:</span>
                            <span>{boss.ac}</span>
                          </div>
                        </div>
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
                            onClick={() => handleSetBossAsTarget(boss)}
                            title={isTargeted ? "Scroll to damage application" : "Set as target"}
                          >
                            {isTargeted ? "Scroll to Damage" : "Target"}
                          </button>
                          <button 
                            className={`aoe-button ${boss.inAoe ? 'active' : ''}`}
                            onClick={(e) => handleToggleBossAoe(e, boss.id)}
                            title={boss.inAoe ? "Remove from AoE" : "Add to AoE"}
                          >
                            {boss.inAoe ? "In AoE" : "Add to AoE"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Display Enemy Groups */}
            {enemyGroups && enemyGroups.length > 0 && (
              <div className="groups-list">
                <h4>Enemy Groups</h4>
                <div className="entities-grid">
                  {enemyGroups.map(group => {
                    // Calculate health percentage based on total group HP rather than individual HP
                    const totalCurrentHP = group.count * group.currentHp;
                    const totalMaxHP = group.count * group.maxHp;
                    const healthPercentage = calculateHealthPercentage(totalCurrentHP, totalMaxHP);
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
                          <h5>{group.name} (x{group.count})</h5>
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
                        <div className="entity-stats">
                          <div className="entity-stat">
                            <span>HP:</span>
                            <span>{group.currentHp} / {group.maxHp}</span>
                          </div>
                          <div className="entity-stat">
                            <span>AC:</span>
                            <span>{group.ac}</span>
                          </div>
                          <div className="entity-stat">
                            <span>Total:</span>
                            <span>{group.count * group.currentHp} / {group.count * group.maxHp}</span>
                          </div>
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
                                onClick={(e) => handleApplyDamage(e, group.id, 'full')}
                              >
                                Full Damage
                              </button>
                              <button
                                className="damage-modifier-button"
                                onClick={(e) => handleApplyDamage(e, group.id, 'half')}
                              >
                                Half Damage
                              </button>
                              <button
                                className="damage-modifier-button"
                                onClick={(e) => handleApplyDamage(e, group.id, 'quarter')}
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
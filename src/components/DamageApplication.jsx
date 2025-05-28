import '../styles/DamageApplication.css';

import { useEffect, useRef, useState } from 'react';

import useDnDStore from '../store/dndStore';

const DamageApplication = () => {
  const {
    enemyGroups,
    bosses,
    characters,
    targetEntity,
    expandedSections,
    toggleSection,
    applyDamageToGroup,
    applyDamageToAllGroups,
    applyDamageToAllGroupsInAoe,
    applyDamageToCharacter,
    applyDamageToAllCharactersInAoe,
    applyDamageToBoss,
    applyDamageToAllBossesInAoe,
    setDamageApplicationRef,
    aoeDamageParams,
    clearAllAoeTargets,
    updateEnemyGroup,
    updateBoss,
    updateCharacter
  } = useDnDStore();

  // Local state for single target damage
  const [singleTargetState, setSingleTargetState] = useState({
    attackRoll: '',
    damageAmount: '',
    criticalHit: false,
    advantage: false,
    disadvantage: false
  });

  // Healing state
  const [healingState, setHealingState] = useState({
    healingAmount: '',
    selectedEntities: []
  });

  // AOE damage state
  const [aoeState, setAoeState] = useState({
    damageAmount: '',
    saveType: 'dex',
    saveDC: 15,
    halfOnSave: true,
    applyToAll: false,
    percentAffected: 100
  });

  // State for AoE manual saves
  const [showAoeSaves, setShowAoeSaves] = useState(false);
  const [characterSaves, setCharacterSaves] = useState({});
  const [damageModifiers, setDamageModifiers] = useState({});
  const [manualDamageAdjustments, setManualDamageAdjustments] = useState({});

  // Refs
  const sectionRef = useRef(null);
  
  // Register the ref with the store for scrolling
  useEffect(() => {
    if (sectionRef.current) {
      setDamageApplicationRef(sectionRef);
    }
  }, [sectionRef, setDamageApplicationRef]);

  // Initialize character saves when AoE save UI is shown
  useEffect(() => {
    if (showAoeSaves) {
      const initialSaves = {};
      const initialModifiers = {};
      
      // Only include characters marked for AoE or all if applyToAll is true
      const affectedCharacters = aoeState.applyToAll
        ? characters
        : characters.filter(char => char.inAoe);
      
      affectedCharacters.forEach(character => {
        initialSaves[character.id] = {
          roll: '',
          autoRoll: true, // Default to auto-roll
          succeeded: false
        };
        initialModifiers[character.id] = 'default'; // Default, half, none
      });
      
      setCharacterSaves(initialSaves);
      setDamageModifiers(initialModifiers);
      setManualDamageAdjustments({});
    }
  }, [showAoeSaves, characters, aoeState.applyToAll]);

  // Get lists of entities marked for AoE
  const getAoeTargets = () => {
    const groupsInAoe = aoeState.applyToAll 
      ? enemyGroups 
      : enemyGroups.filter(group => group.inAoe);
    
    const bossesInAoe = aoeState.applyToAll
      ? bosses
      : bosses.filter(boss => boss.inAoe);

    const charactersInAoe = aoeState.applyToAll
      ? characters
      : characters.filter(char => char.inAoe);
    
    return {
      groups: groupsInAoe,
      bosses: bossesInAoe,
      characters: charactersInAoe,
      hasTargets: groupsInAoe.length > 0 || bossesInAoe.length > 0 || charactersInAoe.length > 0
    };
  };

  // Get targets for display
  const aoeTargets = getAoeTargets();

  // Add useEffect to handle AOE parameters when they are set
  useEffect(() => {
    if (aoeDamageParams) {
      // Set the AOE state from the parameters
      setAoeState(prev => ({
        ...prev,
        damageAmount: aoeDamageParams.damage || '',
        saveType: aoeDamageParams.saveType || 'dex',
        saveDC: aoeDamageParams.saveDC || 15,
        halfOnSave: aoeDamageParams.halfOnSave !== undefined ? aoeDamageParams.halfOnSave : true,
        // Set applyToAll to false by default when using a boss AOE attack
        applyToAll: false
      }));
      
      // Auto-scroll to the AOE section
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth' });
        
        // Focus on the damage input to make it clear where we are
        setTimeout(() => {
          const damageInput = sectionRef.current.querySelector('input[name="damageAmount"]');
          if (damageInput) damageInput.focus();
        }, 500);
      }
    }
  }, [aoeDamageParams]);

  // Get the currently targeted entity details
  const getTargetDetails = () => {
    if (!targetEntity) return null;
    
    if (targetEntity.type === 'group') {
      const group = enemyGroups.find(g => g.id === targetEntity.id);
      if (group) {
        return {
          name: `${group.name} (x${group.count})`,
          type: 'group',
          ac: group.ac
        };
      }
    } else if (targetEntity.type === 'boss') {
      const boss = bosses.find(b => b.id === targetEntity.id);
      if (boss) {
        return {
          name: boss.name,
          type: 'boss',
          ac: boss.ac
        };
      }
    } else if (targetEntity.type === 'character') {
      const character = characters.find(c => c.id === targetEntity.id);
      if (character) {
        return {
          name: character.name,
          type: 'character',
          ac: character.ac
        };
      }
    }
    
    return null;
  };
  
  // Get the target's AC for attack roll comparison
  const targetDetails = getTargetDetails();
  
  // Handle single target damage application
  const handleApplySingleTargetDamage = () => {
    if (!targetEntity) {
      alert('Please select a target first');
      return;
    }
    
    // Parse damage amount
    const damage = parseInt(singleTargetState.damageAmount);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return;
    }
    
    // Get hit status based on attack roll and AC
    let hitStatus = 'hit'; // Default to hit if no attack roll
    if (singleTargetState.attackRoll) {
      const attackRoll = parseInt(singleTargetState.attackRoll);
      
      if (singleTargetState.criticalHit || attackRoll === 20) {
        hitStatus = 'critical';
      } else if (attackRoll === 1) {
        hitStatus = 'miss';
      } else if (targetDetails && attackRoll < targetDetails.ac) {
        hitStatus = 'miss';
      }
    }
    
    // Calculate final damage
    let finalDamage = damage;
    if (hitStatus === 'critical') {
      finalDamage = damage * 2;
    } else if (hitStatus === 'miss') {
      finalDamage = 0;
    }
    
    // Apply damage based on target type
    if (targetEntity.type === 'group') {
      applyDamageToGroup(targetEntity.id, finalDamage, hitStatus);
    } else if (targetEntity.type === 'boss') {
      applyDamageToBoss(targetEntity.id, finalDamage, hitStatus);
    } else if (targetEntity.type === 'character') {
      applyDamageToCharacter(targetEntity.id, finalDamage, hitStatus);
    }
    
    // Reset attack roll field
    setSingleTargetState(prev => ({
      ...prev,
      attackRoll: '',
      criticalHit: false,
      advantage: false,
      disadvantage: false
    }));
  };
  
  // Prepare AoE damage data - shows save UI
  const prepareAoeDamage = () => {
    // Parse damage amount
    const damage = parseInt(aoeState.damageAmount);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return;
    }
    
    // Show the AoE saves UI
    setShowAoeSaves(true);
  };
  
  // Auto-roll saves for a character
  const autoRollSave = (characterId) => {
    // Simple d20 roll
    const roll = Math.floor(Math.random() * 20) + 1;
    
    // Check if save succeeds
    const succeeded = roll >= aoeState.saveDC;
    
    setCharacterSaves(prev => ({
      ...prev,
      [characterId]: {
        ...prev[characterId],
        roll: roll,
        autoRoll: true,
        succeeded
      }
    }));
    
    // Set default damage modifier based on save result
    setDamageModifiers(prev => ({
      ...prev,
      [characterId]: succeeded && aoeState.halfOnSave ? 'half' : 'default'
    }));
  };
  
  // Auto-roll saves for all characters
  const autoRollAllSaves = () => {
    Object.keys(characterSaves).forEach(characterId => {
      autoRollSave(characterId);
    });
  };
  
  // Handle manual save roll input
  const handleSaveRollChange = (characterId, value) => {
    const roll = value === '' ? '' : parseInt(value);
    const succeeded = roll !== '' ? roll >= aoeState.saveDC : false;
    
    setCharacterSaves(prev => ({
      ...prev,
      [characterId]: {
        ...prev[characterId],
        roll: value,
        autoRoll: false,
        succeeded
      }
    }));
    
    // Set default damage modifier based on save result
    if (roll !== '') {
      setDamageModifiers(prev => ({
        ...prev,
        [characterId]: succeeded && aoeState.halfOnSave ? 'half' : 'default'
      }));
    }
  };
  
  // Handle damage modifier change
  const handleDamageModifierChange = (characterId, value) => {
    setDamageModifiers(prev => ({
      ...prev,
      [characterId]: value
    }));
  };
  
  // Handle manual damage adjustment
  const handleDamageAdjustment = (characterId, amount) => {
    setManualDamageAdjustments(prev => ({
      ...prev,
      [characterId]: (prev[characterId] || 0) + amount
    }));
  };
  
  // Apply the AoE damage with manual saves
  const handleApplyAoeDamageWithSaves = () => {
    // Parse damage amount
    const damage = parseInt(aoeState.damageAmount);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return;
    }
    
    // Create custom damage parameters for each character
    const characterDamageParams = {};
    
    Object.keys(characterSaves).forEach(characterId => {
      const saveInfo = characterSaves[characterId];
      const modifier = damageModifiers[characterId];
      const adjustment = manualDamageAdjustments[characterId] || 0;
      
      let damageToApply = damage;
      
      // Apply modifier
      if (modifier === 'half') {
        damageToApply = Math.floor(damage / 2);
      } else if (modifier === 'quarter') {
        damageToApply = Math.floor(damage / 4);
      } else if (modifier === 'none') {
        damageToApply = 0;
      }
      
      // Apply manual adjustment
      damageToApply = Math.max(0, damageToApply + adjustment);
      
      characterDamageParams[characterId] = {
        damage: damageToApply,
        saveRoll: saveInfo.roll === '' ? null : parseInt(saveInfo.roll),
        succeeded: saveInfo.succeeded,
        originalDamage: damage
      };
    });
    
    // Apply AoE damage with custom parameters
    const aoeParams = {
      damage,
      saveType: aoeState.saveType,
      saveDC: aoeState.saveDC,
      halfOnSave: aoeState.halfOnSave,
      percentAffected: aoeState.percentAffected,
      characterDamageParams
    };
    
    // Apply to monsters/bosses as normal
    if (aoeState.applyToAll) {
      applyDamageToAllGroups(aoeParams);
      applyDamageToAllBossesInAoe(aoeParams, true);
    } else {
      applyDamageToAllGroupsInAoe(aoeParams);
      applyDamageToAllBossesInAoe(aoeParams);
    }
    
    // Apply to characters with custom parameters
    applyDamageToAllCharactersInAoe(aoeParams, aoeState.applyToAll);
    
    // Clear all AOE targets
    clearAllAoeTargets();
    
    // Reset state
    setShowAoeSaves(false);
    setAoeState(prev => ({
      ...prev,
      damageAmount: ''
    }));
  };
  
  // Cancel AoE save UI
  const handleCancelAoeSaves = () => {
    setShowAoeSaves(false);
  };
  
  // Handle changes to single target state
  const handleSingleTargetChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSingleTargetState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // If setting critical hit, reset advantage/disadvantage
      ...(name === 'criticalHit' && checked ? { advantage: false, disadvantage: false } : {}),
      // If setting advantage, reset critical and disadvantage
      ...(name === 'advantage' && checked ? { criticalHit: false, disadvantage: false } : {}),
      // If setting disadvantage, reset critical and advantage
      ...(name === 'disadvantage' && checked ? { criticalHit: false, advantage: false } : {})
    }));
  };
  
  // Handle changes to AoE state
  const handleAoeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAoeState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add a variable to check if AOE damage is coming from a boss attack
  const isAoeFromBossAttack = !!aoeDamageParams;

  // Handle changes to healing state
  const handleHealingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHealingState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Toggle entity selection for multi-healing
  const toggleEntityForHealing = (entityType, entityId) => {
    setHealingState(prev => {
      // Check if entity is already selected
      const isSelected = prev.selectedEntities.some(
        item => item.type === entityType && item.id === entityId
      );
      
      // Create new array - either adding or removing the entity
      const newSelectedEntities = isSelected
        ? prev.selectedEntities.filter(
            item => !(item.type === entityType && item.id === entityId)
          )
        : [...prev.selectedEntities, { type: entityType, id: entityId }];
      
      return {
        ...prev,
        selectedEntities: newSelectedEntities
      };
    });
  };
  
  // Check if an entity is selected for healing
  const isEntitySelectedForHealing = (entityType, entityId) => {
    return healingState.selectedEntities.some(
      entity => entity.type === entityType && entity.id === entityId
    );
  };
  
  // Helper function to apply healing to a group
  const applyHealingToGroup = (groupId, amount) => {
    const group = enemyGroups.find(g => g.id === groupId);
    if (!group || !group.creatures || amount <= 0) return;
    
    // Create a copy of the group
    const updatedGroup = { ...group };
    const updatedCreatures = [...group.creatures];
    
    // Sort creatures by current HP (highest first, but exclude those with 0 HP)
    updatedCreatures.sort((a, b) => {
      // Dead creatures (0 HP) go last
      if (a.hp === 0) return 1;
      if (b.hp === 0) return -1;
      
      // Otherwise sort by current HP, highest first
      return b.hp - a.hp;
    });
    
    let remainingHealing = amount;
    
    // Apply healing to each creature that isn't dead, starting with highest HP
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
      }
    }
    
    // Update the group with healed creatures
    updatedGroup.creatures = updatedCreatures;
    
    // Calculate new current HP for the group
    const totalCurrentHP = updatedCreatures.reduce((sum, creature) => sum + creature.hp, 0);
    updatedGroup.currentHp = Math.floor(totalCurrentHP / updatedCreatures.length);
    
    // Update the group in the store
    updateEnemyGroup(groupId, null, updatedGroup);
  };
  
  // Get detailed group information including individual creature HP
  const getGroupDetails = (group) => {
    if (!group || !group.creatures) return null;
    
    return {
      ...group,
      creatureDetails: group.creatures.map((creature, index) => ({
        id: index,
        hp: creature.hp,
        maxHp: group.maxHp,
        percent: Math.floor((creature.hp / group.maxHp) * 100)
      }))
    };
  };
  
  // Helper function to apply healing to a boss
  const applyHealingToBoss = (bossId, amount) => {
    const boss = bosses.find(b => b.id === bossId);
    if (!boss || amount <= 0) return;
    
    // Calculate new HP
    const newHP = Math.min(boss.maxHp, boss.currentHp + amount);
    
    // Update the boss HP
    updateBoss(bossId, 'currentHp', newHP);
  };

  // Get healable entities
  const getHealableEntities = () => {
    return {
      characters: characters,
      // Filter out groups where all creatures have 0 HP
      groups: enemyGroups.filter(group => 
        group.creatures && group.creatures.some(creature => creature.hp > 0)
      ),
      bosses: bosses
    };
  };
  
  // Get healable entities
  const healableEntities = getHealableEntities();

  // Helper function to apply healing to a character
  const applyHealingToCharacter = (characterId, amount) => {
    const character = characters.find(c => c.id === characterId);
    if (!character || amount <= 0) return;
    
    // For characters, allow healing from 0 HP
    // Get current character HP, making sure we don't go negative
    const currentHp = Math.max(0, character.currentHp);
    const newHp = Math.min(character.maxHp, currentHp + amount);
    
    // Use the updateCharacter function from the store
    updateCharacter(characterId, 'currentHp', newHp);
  };

  // Apply healing to multiple entities
  const handleApplyMultiHealing = () => {
    // Parse healing amount
    const healing = parseInt(healingState.healingAmount);
    if (isNaN(healing) || healing <= 0) {
      alert('Please enter a valid healing amount');
      return;
    }
    
    if (healingState.selectedEntities.length === 0) {
      alert('Please select at least one entity to heal');
      return;
    }
    
    // Apply healing to each selected entity
    healingState.selectedEntities.forEach(entity => {
      if (entity.type === 'group') {
        applyHealingToGroup(entity.id, healing);
      } else if (entity.type === 'boss') {
        applyHealingToBoss(entity.id, healing);
      } else if (entity.type === 'character') {
        applyHealingToCharacter(entity.id, healing);
      }
    });
    
    // Reset healing amount AND clear selected entities
    setHealingState(prev => ({
      ...prev,
      healingAmount: '',
      selectedEntities: []
    }));
  };

  return (
    <div className="damage-application" ref={sectionRef}>
      <div className="section-header">
        <h3>Damage Application</h3>
        <button
          className="toggle-section-button"
          onClick={() => toggleSection('damage')}
        >
          {expandedSections.damage ? 'Hide Damage' : 'Show Damage'}
        </button>
      </div>

      {expandedSections.damage && (
        <>
          <div className="damage-sections">
            {/* Single Target Damage */}
            <div className="damage-section single-target-section">
              <h4>Single Target Damage</h4>
              
              {targetDetails ? (
                <div className="current-target">
                  <div className="target-info">
                    <span>Target:</span> 
                    <span className="target-name">{targetDetails.name}</span>
                    <span className="target-type">{targetDetails.type}</span>
                    {targetDetails.ac && (
                      <span className="target-ac">AC: {targetDetails.ac}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-target-message">
                  <p>No target selected. Select a target from the Groups, Bosses, or Characters section.</p>
                </div>
              )}
              
              <div className="damage-controls">
                <div className="control-row">
                  <div className="control-field">
                    <label>Attack Roll:</label>
                    <input
                      type="number"
                      name="attackRoll"
                      value={singleTargetState.attackRoll}
                      onChange={handleSingleTargetChange}
                      placeholder="Attack roll (optional)"
                      min="1"
                    />
                  </div>
                  
                  <div className="control-field">
                    <label>Damage:</label>
                    <input
                      type="number"
                      name="damageAmount"
                      value={singleTargetState.damageAmount}
                      onChange={handleSingleTargetChange}
                      placeholder="Damage amount"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="control-row checkbox-row">
                  <div className="control-checkbox">
                    <input
                      type="checkbox"
                      id="criticalHit"
                      name="criticalHit"
                      checked={singleTargetState.criticalHit}
                      onChange={handleSingleTargetChange}
                    />
                    <label htmlFor="criticalHit">Critical Hit</label>
                  </div>
                  
                  <div className="control-checkbox">
                    <input
                      type="checkbox"
                      id="advantage"
                      name="advantage"
                      checked={singleTargetState.advantage}
                      onChange={handleSingleTargetChange}
                    />
                    <label htmlFor="advantage">Advantage</label>
                  </div>
                  
                  <div className="control-checkbox">
                    <input
                      type="checkbox"
                      id="disadvantage"
                      name="disadvantage"
                      checked={singleTargetState.disadvantage}
                      onChange={handleSingleTargetChange}
                    />
                    <label htmlFor="disadvantage">Disadvantage</label>
                  </div>
                </div>
                
                <button
                  className="apply-damage-button"
                  onClick={handleApplySingleTargetDamage}
                  disabled={!targetEntity || !singleTargetState.damageAmount}
                >
                  Apply Damage
                </button>
              </div>
              
              {targetDetails && singleTargetState.attackRoll && (
                <div className="hit-status">
                  {(() => {
                    const attackRoll = parseInt(singleTargetState.attackRoll);
                    if (singleTargetState.criticalHit || attackRoll === 20) {
                      return <span className="critical-hit">Critical Hit!</span>;
                    } else if (attackRoll === 1) {
                      return <span className="critical-miss">Critical Miss!</span>;
                    } else if (targetDetails.ac && attackRoll < targetDetails.ac) {
                      return <span className="miss">Miss! (AC {targetDetails.ac})</span>;
                    } else {
                      return <span className="hit">Hit! (AC {targetDetails.ac})</span>;
                    }
                  })()}
                </div>
              )}
            </div>
            
            {/* AoE Damage */}
            <div className={`damage-section aoe-section ${isAoeFromBossAttack ? 'aoe-from-boss' : ''}`}>
              <h4>Area Effect Damage</h4>
              
              {!showAoeSaves ? (
                // AoE Damage Input Form
                <div className="damage-controls">
                  <div className="control-row">
                    <div className="control-field">
                      <label>Damage:</label>
                      <input
                        type="number"
                        name="damageAmount"
                        value={aoeState.damageAmount}
                        onChange={handleAoeChange}
                        placeholder="Damage amount"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div className="control-field">
                      <label>Save Type:</label>
                      <select
                        name="saveType"
                        value={aoeState.saveType}
                        onChange={handleAoeChange}
                      >
                        <option value="str">STR</option>
                        <option value="dex">DEX</option>
                        <option value="con">CON</option>
                        <option value="int">INT</option>
                        <option value="wis">WIS</option>
                        <option value="cha">CHA</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="control-row">
                    <div className="control-field">
                      <label>Save DC:</label>
                      <input
                        type="number"
                        name="saveDC"
                        value={aoeState.saveDC}
                        onChange={handleAoeChange}
                        min="1"
                      />
                    </div>
                    
                    <div className="control-checkbox wide">
                      <input
                        type="checkbox"
                        id="halfOnSave"
                        name="halfOnSave"
                        checked={aoeState.halfOnSave}
                        onChange={handleAoeChange}
                      />
                      <label htmlFor="halfOnSave">Half damage on successful save</label>
                    </div>
                  </div>
                  
                  <div className="control-checkbox wide">
                    <input
                      type="checkbox"
                      id="applyToAll"
                      name="applyToAll"
                      checked={aoeState.applyToAll}
                      onChange={handleAoeChange}
                    />
                    <label htmlFor="applyToAll">Apply to ALL entities (ignore AoE markers)</label>
                  </div>
                  
                  <div className="percent-affected">
                    <label htmlFor="percentAffected">% Affected:</label>
                    <input
                      type="number"
                      id="percentAffected"
                      name="percentAffected"
                      value={aoeState.percentAffected}
                      onChange={handleAoeChange}
                      min="1"
                      max="100"
                    />
                  </div>
                  
                  <button
                    className="apply-damage-button"
                    onClick={prepareAoeDamage}
                    disabled={!aoeState.damageAmount}
                  >
                    Next: Configure Saves
                  </button>
                </div>
              ) : (
                // AoE Saves Configuration UI
                <div className="aoe-saves-container">
                  <div className="aoe-saves-header">
                    <h5>{aoeState.saveType.toUpperCase()} Save DC {aoeState.saveDC} - {aoeState.damageAmount} Damage</h5>
                    <div className="aoe-saves-actions">
                      <button
                        className="auto-roll-button"
                        onClick={autoRollAllSaves}
                      >
                        Auto-Roll All Saves
                      </button>
                    </div>
                  </div>
                  
                  {Object.keys(characterSaves).length > 0 ? (
                    <div className="character-saves-table">
                      <div className="character-saves-header">
                        <div>Character</div>
                        <div>Save Roll</div>
                        <div>Result</div>
                        <div>Damage</div>
                        <div>Adjust</div>
                        <div>Modifier</div>
                      </div>
                      
                      {Object.keys(characterSaves).map(characterId => {
                        const character = characters.find(c => c.id === characterId);
                        if (!character) return null;
                        
                        const saveInfo = characterSaves[characterId];
                        const modifier = damageModifiers[characterId];
                        const adjustment = manualDamageAdjustments[characterId] || 0;
                        
                        // Calculate damage
                        let baseDamage = aoeState.damageAmount;
                        let finalDamage = parseInt(baseDamage);
                        
                        if (modifier === 'half') {
                          finalDamage = Math.floor(finalDamage / 2);
                        } else if (modifier === 'quarter') {
                          finalDamage = Math.floor(finalDamage / 4);
                        } else if (modifier === 'none') {
                          finalDamage = 0;
                        }
                        
                        // Apply manual adjustment
                        finalDamage = Math.max(0, finalDamage + adjustment);
                        
                        return (
                          <div key={characterId} className="character-saves-row">
                            <div>{character.name}</div>
                            <div className="save-roll-cell">
                              <input
                                type="number"
                                value={saveInfo.roll}
                                onChange={(e) => handleSaveRollChange(characterId, e.target.value)}
                                placeholder="Roll"
                                min="1"
                                max="20"
                              />
                              <button
                                className="auto-roll-single"
                                onClick={() => autoRollSave(characterId)}
                                title="Auto-roll save"
                              >
                                🎲
                              </button>
                            </div>
                            <div className={`save-result ${saveInfo.roll === '' ? '' : (saveInfo.succeeded ? 'success' : 'failure')}`}>
                              {saveInfo.roll === '' ? '' : (saveInfo.succeeded ? 'Success' : 'Failure')}
                            </div>
                            <div className="damage-value">
                              {finalDamage}
                              {adjustment !== 0 && (
                                <span className="damage-adjustment">
                                  {adjustment > 0 ? ` (+${adjustment})` : ` (${adjustment})`}
                                </span>
                              )}
                            </div>
                            <div className="damage-adjustment-controls">
                              <button onClick={() => handleDamageAdjustment(characterId, -5)}>-5</button>
                              <button onClick={() => handleDamageAdjustment(characterId, -1)}>-1</button>
                              <button onClick={() => handleDamageAdjustment(characterId, 1)}>+1</button>
                              <button onClick={() => handleDamageAdjustment(characterId, 5)}>+5</button>
                            </div>
                            <div>
                              <select
                                value={modifier}
                                onChange={(e) => handleDamageModifierChange(characterId, e.target.value)}
                              >
                                <option value="default">Default Damage</option>
                                <option value="half">Half Damage</option>
                                <option value="quarter">Quarter Damage</option>
                                <option value="none">No Damage</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-characters-message">
                      <p>No characters marked for AoE damage.</p>
                    </div>
                  )}
                  
                  {/* Display Enemy Groups in AoE */}
                  {aoeTargets.groups.length > 0 && (
                    <div className="aoe-entity-section">
                      <h5>Enemy Groups in AoE:</h5>
                      <div className="aoe-entity-list">
                        {aoeTargets.groups.map(group => (
                          <div key={group.id} className="aoe-entity-item">
                            <span className="entity-name">{group.name}</span>
                            <span className="entity-count">x{group.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display Bosses in AoE */}
                  {aoeTargets.bosses.length > 0 && (
                    <div className="aoe-entity-section">
                      <h5>Bosses in AoE:</h5>
                      <div className="aoe-entity-list">
                        {aoeTargets.bosses.map(boss => (
                          <div key={boss.id} className="aoe-entity-item">
                            <span className="entity-name">{boss.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No targets message if nothing is selected */}
                  {!aoeTargets.hasTargets && (
                    <div className="no-targets-message">
                      <p>No entities are marked for AoE damage. Use &quot;Add to AoE&quot; buttons on enemy groups and bosses to select targets.</p>
                    </div>
                  )}
                  
                  <div className="aoe-saves-footer">
                    <button
                      className="cancel-button"
                      onClick={handleCancelAoeSaves}
                    >
                      Cancel
                    </button>
                    <button
                      className="apply-damage-button"
                      onClick={handleApplyAoeDamageWithSaves}
                    >
                      Apply AoE Damage
                    </button>
                  </div>
                </div>
              )}
              
              <div className="aoe-help">
                <p>
                  <strong>To use AoE:</strong> First mark targets with &quot;Add to AoE&quot; in their respective sections, then apply damage here.
                </p>
              </div>
            </div>

            {/* Healing Section */}
            <div className="damage-section healing-section">
              <h4>Healing</h4>
              
              <div className="healing-controls">
                <div className="control-row">
                  <div className="control-field">
                    <label>Healing Amount:</label>
                    <input
                      type="number"
                      name="healingAmount"
                      value={healingState.healingAmount}
                      onChange={handleHealingChange}
                      placeholder="Healing amount"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="multi-select-container compact">
                  <h5>Select Entities to Heal</h5>
                  
                  {/* Characters section */}
                  {healableEntities.characters.length > 0 && (
                    <div className="entity-select-section">
                      <h6>Characters</h6>
                      <div className="entity-select-grid">
                        {healableEntities.characters.map(character => (
                          <div 
                            key={`character-${character.id}`}
                            className={`entity-select-item ${isEntitySelectedForHealing('character', character.id) ? 'selected' : ''}`}
                            onClick={() => toggleEntityForHealing('character', character.id)}
                          >
                            <span className="entity-name">{character.name}</span>
                            <span className="entity-hp">{character.currentHp}/{character.maxHp} HP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Enemy Groups section */}
                  {healableEntities.groups.length > 0 && (
                    <div className="entity-select-section">
                      <h6>Enemy Groups</h6>
                      <div className="entity-select-grid">
                        {healableEntities.groups.map(group => {
                          const groupDetails = getGroupDetails(group);
                          return (
                            <div 
                              key={`group-${group.id}`}
                              className={`entity-select-item ${isEntitySelectedForHealing('group', group.id) ? 'selected' : ''}`}
                              onClick={() => toggleEntityForHealing('group', group.id)}
                            >
                              <div className="entity-header">
                                <span className="entity-name">{group.name}</span>
                                <span className="entity-count">x{group.count}</span>
                              </div>
                              <span className="entity-hp">{group.currentHp}/{group.maxHp} HP</span>
                              
                              {groupDetails && groupDetails.creatureDetails && (
                                <div className="creature-hp-list">
                                  {groupDetails.creatureDetails.map((creature, idx) => (
                                    <div 
                                      key={idx} 
                                      className={`creature-hp-indicator ${creature.hp === 0 ? 'dead' : ''}`}
                                      title={`Creature ${idx+1}: ${creature.hp}/${creature.maxHp} HP`}
                                    >
                                      <div 
                                        className="creature-hp-bar" 
                                        style={{width: `${creature.percent}%`}}
                                      ></div>
                                      <span className="creature-hp-text">{creature.hp}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Bosses section */}
                  {healableEntities.bosses.length > 0 && (
                    <div className="entity-select-section">
                      <h6>Bosses</h6>
                      <div className="entity-select-grid">
                        {healableEntities.bosses.map(boss => (
                          <div 
                            key={`boss-${boss.id}`}
                            className={`entity-select-item ${isEntitySelectedForHealing('boss', boss.id) ? 'selected' : ''}`}
                            onClick={() => toggleEntityForHealing('boss', boss.id)}
                          >
                            <span className="entity-name">{boss.name}</span>
                            <span className="entity-hp">{boss.currentHp}/{boss.maxHp} HP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected entities summary */}
                  <div className="selected-entities-summary">
                    <span>Selected: {healingState.selectedEntities.length} entities</span>
                    {healingState.selectedEntities.length > 0 && (
                      <button 
                        className="clear-selections-button"
                        onClick={() => setHealingState(prev => ({...prev, selectedEntities: []}))}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                
                <button
                  className="apply-healing-button"
                  onClick={handleApplyMultiHealing}
                  disabled={!healingState.healingAmount || healingState.selectedEntities.length === 0}
                >
                  Apply Healing to {healingState.selectedEntities.length} {healingState.selectedEntities.length === 1 ? 'Entity' : 'Entities'}
                </button>
              </div>
              
              <div className="healing-help">
                <p>
                  <strong>Note:</strong> Healing is applied to the most damaged creatures first. For groups, 
                  multi-target healing will distribute healing among all damaged creatures.
                </p>
              </div>
            </div>
          </div>

          {/* Add AOE attack details if populated from a boss */}
          {aoeDamageParams && (
            <div className="aoe-source-info">
              <p>
                <strong>AOE Attack:</strong> {aoeDamageParams.saveType?.toUpperCase()} Save DC {aoeDamageParams.saveDC} 
                {aoeDamageParams.halfOnSave !== undefined && ` (${aoeDamageParams.halfOnSave ? 'Half' : 'No'} damage on save)`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DamageApplication; 
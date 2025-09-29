import '../styles/DamageApplication.css';

import { useEffect, useRef, useState } from 'react';

import useDnDStore from '../store/dndStore';

const DamageApplication = () => {
  const {
    characters,
    bosses,
    enemyGroups,
    targetEntity,
    expandedSections,
    toggleSection,
    applyDamageToGroup,
    applyDamageToCharacter,
    applyDamageToBoss,
    applyAoeDamageToAll,
    setDamageApplicationRef,
    aoeDamageParams,
    applyHealingToGroup,
    applyHealingToBoss,
    applyHealingToCharacter,
    calculateHealthPercentage,
    getHealthColor
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
      
      // Clear previous state and only add currently affected characters
      affectedCharacters.forEach(character => {
        initialSaves[`character-${character.id}`] = {
          roll: '',
          autoRoll: true,
          succeeded: false,
          entityType: 'character'
        };
        initialModifiers[`character-${character.id}`] = 'default';
      });
      
      // Add bosses to the saves state and auto-roll their saves
      const affectedBosses = aoeState.applyToAll
        ? bosses
        : bosses.filter(boss => boss.inAoe);
        
      affectedBosses.forEach(boss => {
        // Calculate save bonus for this boss
        const saveBonus = boss.savingThrows?.[aoeState.saveType] || 0;
        
        // Auto-roll save
        const roll = Math.floor(Math.random() * 20) + 1;
        const totalRoll = roll + saveBonus;
        const succeeded = totalRoll >= aoeState.saveDC;
        
        initialSaves[`boss-${boss.id}`] = {
          roll: roll,
          totalRoll: totalRoll,
          saveBonus: saveBonus,
          autoRoll: true,
          succeeded: succeeded,
          entityType: 'boss'
        };
        
        // Set damage modifier based on save result
        initialModifiers[`boss-${boss.id}`] = succeeded && aoeState.halfOnSave ? 'half' : 'default';
      });
      
      // Add enemy groups to the saves state and auto-roll their saves
      const affectedGroups = aoeState.applyToAll
        ? enemyGroups
        : enemyGroups.filter(group => group.inAoe);
        
      affectedGroups.forEach(group => {
        // Calculate save bonus for this group
        const saveBonus = group.savingThrows?.[aoeState.saveType] || 0;
        
        // Auto-roll save
        const roll = Math.floor(Math.random() * 20) + 1;
        const totalRoll = roll + saveBonus;
        const succeeded = totalRoll >= aoeState.saveDC;
        
        initialSaves[`group-${group.id}`] = {
          roll: roll,
          totalRoll: totalRoll,
          saveBonus: saveBonus,
          autoRoll: true,
          succeeded: succeeded,
          entityType: 'group'
        };
        
        // Set damage modifier based on save result
        initialModifiers[`group-${group.id}`] = succeeded && aoeState.halfOnSave ? 'half' : 'default';
      });
      
      setCharacterSaves(initialSaves);
      setDamageModifiers(initialModifiers);
      setManualDamageAdjustments({});
    }
  }, [showAoeSaves, characters, bosses, enemyGroups, aoeState.applyToAll, aoeState.saveDC, aoeState.damageAmount, aoeState.saveType, aoeState.halfOnSave]);

  // Add an effect to reset character saves when AoE targets change
  useEffect(() => {
    // When not in the saves UI, we don't need to do anything
    if (!showAoeSaves) return;
    
    // Get the current affected characters
    const affectedCharacters = aoeState.applyToAll
      ? characters
      : characters.filter(char => char.inAoe);
      
    // Get the current affected bosses
    const affectedBosses = aoeState.applyToAll
      ? bosses
      : bosses.filter(boss => boss.inAoe);
      
    // Get the current affected groups
    const affectedGroups = aoeState.applyToAll
      ? enemyGroups
      : enemyGroups.filter(group => group.inAoe);
    
    // Get current entity IDs in the saves state
    const currentSaveIds = Object.keys(characterSaves);
    
    // Get the affected entity IDs
    const affectedIds = [
      ...affectedCharacters.map(char => `character-${char.id}`),
      ...affectedBosses.map(boss => `boss-${boss.id}`),
      ...affectedGroups.map(group => `group-${group.id}`)
    ];
    
    // Check if there are any entities in saves that aren't in the affected list
    const hasStaleEntities = currentSaveIds.some(id => !affectedIds.includes(id));
    
    // Check if there are any affected entities not in the saves
    const hasMissingEntities = affectedIds.some(id => !currentSaveIds.includes(id));
    
    // If there's a mismatch, reset the saves
    if (hasStaleEntities || hasMissingEntities) {
      const initialSaves = {};
      const initialModifiers = {};
      
      affectedCharacters.forEach(character => {
        initialSaves[`character-${character.id}`] = {
          roll: '',
          autoRoll: true,
          succeeded: false,
          entityType: 'character'
        };
        initialModifiers[`character-${character.id}`] = 'default';
      });
      
      affectedBosses.forEach(boss => {
        // Calculate save bonus for this boss
        const saveBonus = boss.savingThrows?.[aoeState.saveType] || 0;
        
        // Auto-roll save
        const roll = Math.floor(Math.random() * 20) + 1;
        const totalRoll = roll + saveBonus;
        const succeeded = totalRoll >= aoeState.saveDC;
        
        initialSaves[`boss-${boss.id}`] = {
          roll: roll,
          totalRoll: totalRoll,
          saveBonus: saveBonus,
          autoRoll: true,
          succeeded: succeeded,
          entityType: 'boss'
        };
        
        // Set damage modifier based on save result
        initialModifiers[`boss-${boss.id}`] = succeeded && aoeState.halfOnSave ? 'half' : 'default';
      });
      
      affectedGroups.forEach(group => {
        // Calculate save bonus for this group
        const saveBonus = group.savingThrows?.[aoeState.saveType] || 0;
        
        // Auto-roll save
        const roll = Math.floor(Math.random() * 20) + 1;
        const totalRoll = roll + saveBonus;
        const succeeded = totalRoll >= aoeState.saveDC;
        
        initialSaves[`group-${group.id}`] = {
          roll: roll,
          totalRoll: totalRoll,
          saveBonus: saveBonus,
          autoRoll: true,
          succeeded: succeeded,
          entityType: 'group'
        };
        
        // Set damage modifier based on save result
        initialModifiers[`group-${group.id}`] = succeeded && aoeState.halfOnSave ? 'half' : 'default';
      });
      
      setCharacterSaves(initialSaves);
      setDamageModifiers(initialModifiers);
      setManualDamageAdjustments({});
    }
  }, [characters, bosses, enemyGroups, showAoeSaves, aoeState.applyToAll, characterSaves, aoeState.saveType, aoeState.saveDC, aoeState.halfOnSave]);

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
      
      // Clear aoeDamageParams from the store after using it
      setTimeout(() => {
        useDnDStore.getState().prepareAoeDamage(null);
      }, 100);
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
      // On a critical hit, we should only double the dice portion, not the modifier
      // Since we don't have the dice and modifier separately here, we can't properly implement this
      // For simplicity, we'll keep doubling the damage, but add a comment explaining this isn't ideal
      // In a real implementation, we'd need to track dice and modifier separately
      finalDamage = damage * 2;
      // TODO: Critical hits should only double dice damage, not modifiers
    } else if (hitStatus === 'miss') {
      finalDamage = 0;
    }
    
    // Apply damage based on target type
    if (targetEntity.type === 'group') {
      applyDamageToGroup(targetEntity.id, finalDamage, hitStatus);
    } else if (targetEntity.type === 'boss') {
      applyDamageToBoss(targetEntity.id, finalDamage, hitStatus);
    } else if (targetEntity.type === 'character') {
      applyDamageToCharacter(targetEntity.id, finalDamage, hitStatus, '');
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
  
  // Auto-roll saves for an entity
  const autoRollSave = (entityId) => {
    // Parse entity type and ID from the composite key
    const [entityType, id] = entityId.split('-');
    
    // Get the current save DC and save type
    const currentSaveDC = aoeState.saveDC;
    const currentSaveType = aoeState.saveType;
    
    // Calculate save bonus based on entity type
    let saveBonus = 0;
    
    if (entityType === 'boss') {
      const boss = bosses.find(b => b.id === id);
      if (boss && boss.savingThrows && currentSaveType) {
        saveBonus = boss.savingThrows[currentSaveType] || 0;
      }
    } else if (entityType === 'group') {
      const group = enemyGroups.find(g => g.id === id);
      if (group && group.savingThrows && currentSaveType) {
        saveBonus = group.savingThrows[currentSaveType] || 0;
      }
    }
    // Characters don't have saving throw bonuses in this system
    
    // Simple d20 roll
    const roll = Math.floor(Math.random() * 20) + 1;
    const totalRoll = roll + saveBonus;
    
    // Check if save succeeds against the current DC
    const succeeded = totalRoll >= currentSaveDC;
    
    setCharacterSaves(prev => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        roll: roll,
        totalRoll: totalRoll,
        saveBonus: saveBonus,
        autoRoll: true,
        succeeded
      }
    }));
    
    // Set default damage modifier based on save result
    setDamageModifiers(prev => ({
      ...prev,
      [entityId]: succeeded && aoeState.halfOnSave ? 'half' : 'default'
    }));
  };
  
  // Auto-roll saves for all entities
  const autoRollAllSaves = () => {
    // First roll for bosses and groups to ensure they always have values
    Object.keys(characterSaves).forEach(entityId => {
      const [entityType] = entityId.split('-');
      if (entityType === 'boss' || entityType === 'group') {
        autoRollSave(entityId);
      }
    });
    
    // Then roll for characters if needed
    Object.keys(characterSaves).forEach(entityId => {
      const [entityType] = entityId.split('-');
      if (entityType === 'character') {
        autoRollSave(entityId);
      }
    });
  };
  
  // Handle manual save roll input
  const handleSaveRollChange = (entityId, value) => {
    // Parse entity type and ID from the composite key
    const [entityType, id] = entityId.split('-');
    
    // For bosses and groups, we're directly inputting the total roll
    // For characters, we're inputting the base roll
    let roll, totalRoll, saveBonus = 0;
    
    if (entityType === 'boss' || entityType === 'group') {
      // For bosses and groups, the input is the total roll
      totalRoll = value === '' ? '' : parseInt(value);
      
      // Get the current save type
      const currentSaveType = aoeState.saveType;
      
      // Calculate save bonus based on entity type
      if (entityType === 'boss') {
        const boss = bosses.find(b => b.id === id);
        if (boss && boss.savingThrows && currentSaveType) {
          saveBonus = boss.savingThrows[currentSaveType] || 0;
        }
      } else if (entityType === 'group') {
        const group = enemyGroups.find(g => g.id === id);
        if (group && group.savingThrows && currentSaveType) {
          saveBonus = group.savingThrows[currentSaveType] || 0;
        }
      }
      
      // Calculate the base roll by subtracting the bonus
      roll = totalRoll !== '' ? Math.max(1, totalRoll - saveBonus) : '';
    } else {
      // For characters, the input is the base roll
      roll = value === '' ? '' : parseInt(value);
      totalRoll = roll; // Characters don't have save bonuses in this system
    }
    
    // Get the current save DC
    const currentSaveDC = aoeState.saveDC;
    
    // Check if save succeeds
    const succeeded = totalRoll !== '' ? totalRoll >= currentSaveDC : false;
    
    setCharacterSaves(prev => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        roll: roll,
        totalRoll: totalRoll,
        saveBonus: saveBonus,
        autoRoll: false,
        succeeded
      }
    }));
    
    // Set default damage modifier based on save result
    if (roll !== '') {
      setDamageModifiers(prev => ({
        ...prev,
        [entityId]: succeeded && aoeState.halfOnSave ? 'half' : 'default'
      }));
    }
  };
  
  // Handle damage modifier change
  const handleDamageModifierChange = (entityId, value) => {
    setDamageModifiers(prev => ({
      ...prev,
      [entityId]: value
    }));
  };
  
  // Handle manual damage adjustment
  const handleDamageAdjustment = (entityId, amount) => {
    setManualDamageAdjustments(prev => ({
      ...prev,
      [entityId]: (prev[entityId] || 0) + amount
    }));
  };
  
  // Prepare AOE damage inputs from the boss attack or user input
  const prepareAoeDamage = () => {
    // If AOE damage is from a boss attack, populate the form
    if (aoeDamageParams) {
      setAoeState(prev => ({
        ...prev,
        damageAmount: aoeDamageParams.damage || '',
        saveType: aoeDamageParams.saveType || 'dex',
        saveDC: aoeDamageParams.saveDC || 15,
        halfOnSave: aoeDamageParams.halfOnSave !== undefined ? aoeDamageParams.halfOnSave : true
      }));
      
      // Clear aoeDamageParams from the store after using it
      setTimeout(() => {
        useDnDStore.getState().prepareAoeDamage(null);
      }, 100);
    }
    
    // Show the AOE saves UI
    setShowAoeSaves(true);
    
    // Delay auto-roll to ensure it uses updated state values
    setTimeout(() => {
      // Auto-roll all saves (this will roll for characters, bosses, and groups)
      autoRollAllSaves();
    }, 100);
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
    
    // Clear any stale aoeDamageParams when user manually changes values
    useDnDStore.getState().prepareAoeDamage(null);
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
  
  // Get detailed group information including individual creature HP
  const getGroupDetails = (group) => {
    if (!group || !group.creatures) return null;
    
    const creatureDetails = group.creatures.map((creature, index) => ({
      id: index,
      hp: creature.hp,
      maxHp: group.maxHp,
      percent: Math.floor((creature.hp / group.maxHp) * 100)
    }));
    
    // Calculate total current HP and total max HP
    const totalCurrentHP = creatureDetails.reduce((sum, creature) => sum + creature.hp, 0);
    const totalMaxHP = group.count * group.maxHp;
    
    return {
      ...group,
      creatureDetails,
      totalCurrentHP,
      totalMaxHP
    };
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
    
    // Generate a single transaction ID for all healing operations in this batch
    const batchTransactionId = `healing-${Date.now()}`;
    
    // Apply healing to each selected entity
    healingState.selectedEntities.forEach(entity => {
      if (entity.type === 'group') {
        applyHealingToGroup(entity.id, healing, batchTransactionId);
      } else if (entity.type === 'boss') {
        applyHealingToBoss(entity.id, healing, batchTransactionId);
      } else if (entity.type === 'character') {
        applyHealingToCharacter(entity.id, healing, batchTransactionId);
      }
    });
    
    // Reset healing amount AND clear selected entities
    setHealingState(prev => ({
      ...prev,
      healingAmount: '',
      selectedEntities: []
    }));
  };

  // Handle applying AOE damage with saves
  const handleApplyAoeDamageWithSaves = () => {
    // Collect data from entity save states
    const characterDamageParams = {};
    const entityDamageModifiers = {};
    
    // Ensure we have current values
    const currentDamage = parseInt(aoeState.damageAmount);
    const currentSaveType = aoeState.saveType;
    const currentSaveDC = aoeState.saveDC;
    const currentHalfOnSave = aoeState.halfOnSave;
    const currentPercentAffected = aoeState.percentAffected;
    const currentApplyToAll = aoeState.applyToAll;
    
    Object.entries(characterSaves).forEach(([entityId, saveInfo]) => {
      // Get modifier (half, quarter, none)
      const modifier = damageModifiers[entityId] || 'none';
      
      // Get manual adjustment amount
      const adjustment = manualDamageAdjustments[entityId] || 0;
      
      // Calculate damage with modifier applied
      let damageToApply = currentDamage;
      
      // Apply modifier
      if (modifier === 'double') {
        damageToApply = damageToApply * 2;
      } else if (modifier === 'half') {
        damageToApply = Math.floor(damageToApply / 2);
      } else if (modifier === 'quarter') {
        damageToApply = Math.floor(damageToApply / 4);
      } else if (modifier === 'none') {
        damageToApply = 0;
      }
      
      // Apply manual adjustment
      damageToApply = Math.max(0, damageToApply + adjustment);
      
      // Parse entity type and ID
      const [entityType, id] = entityId.split('-');
      
      if (entityType === 'character') {
        characterDamageParams[id] = {
          damage: damageToApply,
          saveRoll: saveInfo.roll === '' ? null : parseInt(saveInfo.roll),
          succeeded: saveInfo.succeeded,
          originalDamage: currentDamage
        };
      } else {
        // For bosses and groups, use the entityDamageModifiers format
        entityDamageModifiers[entityId] = {
          modifier,
          adjustment,
          roll: saveInfo.roll === '' ? null : parseInt(saveInfo.roll),
          totalRoll: saveInfo.totalRoll,
          succeeded: saveInfo.succeeded
        };
      }
    });
    
    // Apply AoE damage with custom parameters
    const aoeParams = {
      damage: currentDamage,
      saveType: currentSaveType,
      saveDC: currentSaveDC,
      halfOnSave: currentHalfOnSave,
      percentAffected: currentPercentAffected,
      characterDamageParams,
      entityDamageModifiers,
      applyToAll: currentApplyToAll
    };
    
    // Apply AOE damage to all entities in one go
    applyAoeDamageToAll(aoeParams);
    
    // Reset state
    setShowAoeSaves(false);
    setAoeState(prev => ({
      ...prev,
      damageAmount: ''
    }));
    
    // Ensure aoeDamageParams is cleared
    useDnDStore.getState().prepareAoeDamage(null);
  };

  // Apply AOE damage without showing manual saves UI
  const handleApplyAoeDamage = () => {
    // Parse damage amount
    const damage = parseInt(aoeState.damageAmount);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return;
    }
    
    // Apply AoE damage with standard parameters
    const aoeParams = {
      damage,
      saveType: aoeState.saveType,
      saveDC: aoeState.saveDC,
      halfOnSave: aoeState.halfOnSave,
      percentAffected: aoeState.percentAffected,
      applyToAll: aoeState.applyToAll
    };
    
    // Apply AOE damage to all entities
    applyAoeDamageToAll(aoeParams);
    
    // Reset damage amount field
    setAoeState(prev => ({
      ...prev,
      damageAmount: ''
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
                  
                  <div className="button-row">
                    <button
                      className="apply-damage-button"
                      onClick={prepareAoeDamage}
                      disabled={!aoeState.damageAmount}
                    >
                      Next: Configure Saves
                    </button>
                    <button
                      className="apply-damage-button quick-apply"
                      onClick={handleApplyAoeDamage}
                      disabled={!aoeState.damageAmount}
                    >
                      Apply Directly
                    </button>
                  </div>
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
                  
                  {/* Filter entities by type */}
                  {(() => {
                    const playerEntities = Object.entries(characterSaves)
                      .filter(([entityId]) => entityId.startsWith('character-'));
                      
                    const nonPlayerEntities = Object.entries(characterSaves)
                      .filter(([entityId]) => entityId.startsWith('boss-') || entityId.startsWith('group-'));
                    
                    return (
                      <>
                        {/* Players Table */}
                        {playerEntities.length > 0 && (
                          <>
                            <h5 className="entity-table-header">Player Characters</h5>
                            <div className="character-saves-table">
                              <div className="character-saves-header">
                                <div>Character</div>
                                <div>Save Roll</div>
                                <div>Result</div>
                                <div>Damage</div>
                                <div>Adjust</div>
                                <div>Modifier</div>
                              </div>
                              
                              {playerEntities.map(([entityId, saveInfo]) => {
                                // Parse entity type and ID
                                const [_, id] = entityId.split('-');
                                
                                // Get the entity
                                const entity = characters.find(c => c.id === id);
                                if (!entity) return null;
                                
                                const modifier = damageModifiers[entityId];
                                const adjustment = manualDamageAdjustments[entityId] || 0;
                                
                                return (
                                  <div key={entityId} className="character-saves-row">
                                    <div>{entity.name}</div>
                                    <div className="save-roll-cell">
                                      <input
                                        type="number"
                                        value={saveInfo.roll}
                                        onChange={(e) => handleSaveRollChange(entityId, e.target.value)}
                                        placeholder="Roll"
                                        min="1"
                                        max="20"
                                      />
                                      <button
                                        className="auto-roll-single"
                                        onClick={() => autoRollSave(entityId)}
                                        title="Auto-roll save"
                                      >
                                        🎲
                                      </button>
                                    </div>
                                    <div className={`save-result ${saveInfo.roll === '' ? '' : (saveInfo.succeeded ? 'success' : 'failure')}`}>
                                      {saveInfo.roll === '' ? '' : (saveInfo.succeeded ? 'Success' : 'Failure')}
                                    </div>
                                    <div>
                                      {(() => {
                                        // Calculate damage - ensure we're using current values
                                        const currentDamage = parseInt(aoeState.damageAmount);
                                        let finalDamage = isNaN(currentDamage) ? 0 : currentDamage;
                                        
                                        if (modifier === 'double') {
                                          finalDamage = finalDamage * 2;
                                        } else if (modifier === 'half') {
                                          finalDamage = Math.floor(finalDamage / 2);
                                        } else if (modifier === 'quarter') {
                                          finalDamage = Math.floor(finalDamage / 4);
                                        } else if (modifier === 'none') {
                                          finalDamage = 0;
                                        }
                                        
                                        // Apply manual adjustment
                                        finalDamage = Math.max(0, finalDamage + adjustment);
                                        
                                        return (
                                          <>
                                            <span className="damage-value">{finalDamage}</span>
                                            {(modifier !== 'default' || adjustment !== 0) && (
                                              <small className="damage-details">
                                                {' '}(Base: {aoeState.damageAmount}
                                                {modifier !== 'default' && `, ${modifier}`}
                                                {adjustment !== 0 && `, ${adjustment > 0 ? '+' : ''}${adjustment}`})
                                              </small>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <div className="damage-adjustment-controls">
                                      <button onClick={() => handleDamageAdjustment(entityId, -5)}>-5</button>
                                      <button onClick={() => handleDamageAdjustment(entityId, -1)}>-1</button>
                                      <button onClick={() => handleDamageAdjustment(entityId, 1)}>+1</button>
                                      <button onClick={() => handleDamageAdjustment(entityId, 5)}>+5</button>
                                    </div>
                                    <div>
                                      <select
                                        value={modifier}
                                        onChange={(e) => handleDamageModifierChange(entityId, e.target.value)}
                                      >
                                        <option value="default">Default Damage</option>
                                        <option value="double">Double Damage</option>
                                        <option value="half">Half Damage</option>
                                        <option value="quarter">Quarter Damage</option>
                                        <option value="none">No Damage</option>
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                        
                        {/* Bosses and Groups Table */}
                        {nonPlayerEntities.length > 0 && (
                          <>
                            <h5 className="entity-table-header">Bosses & Enemy Groups</h5>
                            <div className="character-saves-table">
                              <div className="character-saves-header">
                                <div>Name</div>
                                <div>Save Roll</div>
                                <div>Result</div>
                                <div>Damage</div>
                                <div>Adjust</div>
                                <div>Modifier</div>
                              </div>
                              
                              {nonPlayerEntities.map(([entityId, saveInfo]) => {
                                // Parse entity type and ID
                                const [entityType, id] = entityId.split('-');
                                
                                // Get the entity based on its type
                                let entity;
                                if (entityType === 'boss') {
                                  entity = bosses.find(b => b.id === id);
                                } else if (entityType === 'group') {
                                  entity = enemyGroups.find(g => g.id === id);
                                }
                                
                                if (!entity) return null;
                                
                                const modifier = damageModifiers[entityId];
                                const adjustment = manualDamageAdjustments[entityId] || 0;
                                
                                // Get save bonus for display
                                const saveBonus = saveInfo.saveBonus || 0;
                                
                                return (
                                  <div key={entityId} className="character-saves-row">
                                    <div>{entity.name}</div>
                                    <div className="save-roll-cell">
                                      <input
                                        type="number"
                                        value={saveInfo.totalRoll || saveInfo.roll}
                                        onChange={(e) => handleSaveRollChange(entityId, e.target.value)}
                                        placeholder="Roll"
                                        min="1"
                                      />
                                      <button
                                        className="auto-roll-single"
                                        onClick={() => autoRollSave(entityId)}
                                        title="Auto-roll save"
                                      >
                                        🎲
                                      </button>
                                    </div>
                                    <div className={`save-result ${saveInfo.roll === '' ? '' : (saveInfo.succeeded ? 'success' : 'failure')}`}>
                                      {saveInfo.roll === '' ? '' : (
                                        <>
                                          {saveInfo.succeeded ? 'Success' : 'Failure'}
                                          {saveBonus !== 0 && (
                                            <small> ({saveInfo.roll}+{saveBonus})</small>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <div>
                                      {(() => {
                                        // Calculate damage - ensure we're using current values
                                        const currentDamage = parseInt(aoeState.damageAmount);
                                        let finalDamage = isNaN(currentDamage) ? 0 : currentDamage;
                                        
                                        if (modifier === 'double') {
                                          finalDamage = finalDamage * 2;
                                        } else if (modifier === 'half') {
                                          finalDamage = Math.floor(finalDamage / 2);
                                        } else if (modifier === 'quarter') {
                                          finalDamage = Math.floor(finalDamage / 4);
                                        } else if (modifier === 'none') {
                                          finalDamage = 0;
                                        }
                                        
                                        // Apply manual adjustment
                                        finalDamage = Math.max(0, finalDamage + adjustment);
                                        
                                        return (
                                          <>
                                            <span className="damage-value">{finalDamage}</span>
                                            {(modifier !== 'default' || adjustment !== 0) && (
                                              <small className="damage-details">
                                                {' '}(Base: {aoeState.damageAmount}
                                                {modifier !== 'default' && `, ${modifier}`}
                                                {adjustment !== 0 && `, ${adjustment > 0 ? '+' : ''}${adjustment}`})
                                              </small>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <div className="damage-adjustment-controls">
                                      <button onClick={() => handleDamageAdjustment(entityId, -5)}>-5</button>
                                      <button onClick={() => handleDamageAdjustment(entityId, -1)}>-1</button>
                                      <button onClick={() => handleDamageAdjustment(entityId, 1)}>+1</button>
                                      <button onClick={() => handleDamageAdjustment(entityId, 5)}>+5</button>
                                    </div>
                                    <div>
                                      <select
                                        value={modifier}
                                        onChange={(e) => handleDamageModifierChange(entityId, e.target.value)}
                                      >
                                        <option value="default">Default Damage</option>
                                        <option value="double">Double Damage</option>
                                        <option value="half">Half Damage</option>
                                        <option value="quarter">Quarter Damage</option>
                                        <option value="none">No Damage</option>
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                        
                        {/* No entities message */}
                        {playerEntities.length === 0 && nonPlayerEntities.length === 0 && (
                          <div className="no-characters-message">
                            <p>No entities marked for AoE damage.</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  {/* No targets message if nothing is selected */}
                  {!aoeTargets.hasTargets && (
                    <div className="no-targets-message">
                      <p>No entities are marked for AoE damage. Use &quot;Add to AoE&quot; buttons on enemy groups and bosses to select targets.</p>
                    </div>
                  )}
                  
                  <div className="aoe-saves-footer">
                    <button
                      className="cancel-button"
                      onClick={() => setShowAoeSaves(false)}
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
                        {healableEntities.characters.map(character => {
                          const healthPercentage = calculateHealthPercentage(character.currentHp, character.maxHp);
                          const healthColor = getHealthColor(healthPercentage);
                          return (
                            <div 
                              key={`character-${character.id}`}
                              className={`entity-select-item ${isEntitySelectedForHealing('character', character.id) ? 'selected' : ''}`}
                              onClick={() => toggleEntityForHealing('character', character.id)}
                            >
                              <div className="entity-header">
                                <span className="entity-name">{character.name}</span>
                              </div>
                              <span className="entity-hp">{character.currentHp}/{character.maxHp} HP</span>
                              <div className="health-bar-container">
                                <div 
                                  className="health-bar" 
                                  style={{
                                    width: `${healthPercentage}%`,
                                    backgroundColor: healthColor
                                  }}
                                ></div>
                              </div>
                              {/* Add detailed health status text */}
                              <div className="health-status">
                                {character.currentHp === character.maxHp ? (
                                  <span className="full-health">Full Health</span>
                                ) : character.currentHp === 0 ? (
                                  <span className="no-health">Unconscious</span>
                                ) : healthPercentage < 25 ? (
                                  <span className="critical-health">Critically Wounded</span>
                                ) : healthPercentage < 50 ? (
                                  <span className="wounded">Wounded</span>
                                ) : (
                                  <span className="injured">Lightly Injured</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                              {groupDetails && groupDetails.creatureDetails ? (
                                <>
                                  {/* Show total HP of all creatures */}
                                  <span className="entity-hp">
                                    {groupDetails.totalCurrentHP}/{groupDetails.totalMaxHP} HP (Total)
                                  </span>
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
                                </>
                              ) : (
                                <span className="entity-hp">{group.currentHp}/{group.maxHp} HP</span>
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
                        {healableEntities.bosses.map(boss => {
                          const healthPercentage = calculateHealthPercentage(boss.currentHp, boss.maxHp);
                          const healthColor = getHealthColor(healthPercentage);
                          return (
                            <div 
                              key={`boss-${boss.id}`}
                              className={`entity-select-item ${isEntitySelectedForHealing('boss', boss.id) ? 'selected' : ''}`}
                              onClick={() => toggleEntityForHealing('boss', boss.id)}
                            >
                              <div className="entity-header">
                                <span className="entity-name">{boss.name}</span>
                              </div>
                              <span className="entity-hp">{boss.currentHp}/{boss.maxHp} HP</span>
                              <div className="health-bar-container">
                                <div 
                                  className="health-bar" 
                                  style={{
                                    width: `${healthPercentage}%`,
                                    backgroundColor: healthColor
                                  }}
                                ></div>
                              </div>
                              {/* Add detailed health status text */}
                              <div className="health-status">
                                {boss.currentHp === boss.maxHp ? (
                                  <span className="full-health">Unharmed</span>
                                ) : boss.currentHp === 0 ? (
                                  <span className="no-health">Defeated</span>
                                ) : healthPercentage < 25 ? (
                                  <span className="critical-health">Near Death</span>
                                ) : healthPercentage < 50 ? (
                                  <span className="wounded">Badly Wounded</span>
                                ) : (
                                  <span className="injured">Wounded</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
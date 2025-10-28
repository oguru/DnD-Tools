import '../styles/GroupsSection.css';
import '../styles/BossTracker.css';

import { useEffect, useRef, useState } from 'react';

import ImportExportModal from './ImportExportModal';
import useDnDStore from '../store/dndStore';

// Damage types and compact icon mapping for defenses
const DAMAGE_TYPES = [
  { key: 'slashing', label: 'Slashing', icon: '🪓' },
  { key: 'piercing', label: 'Piercing', icon: '🗡️' },
  { key: 'bludgeoning', label: 'Bludgeoning', icon: '🔨' },
  { key: 'fire', label: 'Fire', icon: '🔥' },
  { key: 'cold', label: 'Cold', icon: '❄️' },
  { key: 'lightning', label: 'Lightning', icon: '⚡' },
  { key: 'thunder', label: 'Thunder', icon: '🌩️' },
  { key: 'acid', label: 'Acid', icon: '🧪' },
  { key: 'poison', label: 'Poison', icon: '☠️' },
  { key: 'psychic', label: 'Psychic', icon: '🧠' },
  { key: 'necrotic', label: 'Necrotic', icon: '💀' },
  { key: 'radiant', label: 'Radiant', icon: '✨' },
  { key: 'force', label: 'Force', icon: '💥' }
];

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
    addBossAttackResult,
    updateBossAttackResult,
    addBoss,
    resetBossesHealth,
    clearAllBosses,
    toggleBossTemplateSavingThrows,
    setGroupsSectionRef,
    registerEntityRef
  } = useDnDStore();

  // Toggle between adding a group or a boss
  const [addEntityType, setAddEntityType] = useState('group'); // 'group' or 'boss'
  
  // State for import/export modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Boss template state
  const [bossTemplate, setBossTemplate] = useState({
    name: '',
    maxHp: 100,
    currentHp: 100,
    ac: 15,
    notes: '',
    attacks: [],
    defenses: {
      resistances: [],
      vulnerabilities: [],
      immunities: []
    },
    savingThrows: {
      str: 0,
      dex: 0,
      con: 0,
      wis: 0,
      int: 0,
      cha: 0
    },
    showSavingThrows: false,
    showDefenses: false,
    initiative: 0,
    initiativeModifier: 0
  });

  // Attack/spell template for bosses
  const [attackTemplate, setAttackTemplate] = useState({
    id: Date.now().toString(),
    name: '',
    type: 'melee',
    hitBonus: 5,
    attackMethod: 'attackRoll', // 'attackRoll', 'save', or 'auto'
    saveType: 'dex',
    saveDC: 13,
    halfOnSave: true,
    isAoE: false,
    damageComponents: [{
      id: Date.now().toString(),
      numDice: 2,
      diceType: 6,
      modifier: 3,
      damageType: 'slashing'
    }]
  });
  
  // State for temporary damage component when adding
  const [tempDamageComponent, setTempDamageComponent] = useState({
    numDice: 2,
    diceType: 6,
    modifier: 0,
    damageType: 'slashing'
  });

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
  const [showAddGroupOrBoss, setShowAddGroupOrBoss] = useState(true);

  // State for showing/hiding notes and attacks for bosses
  const [showNotes, setShowNotes] = useState({});
  const [showAttacks, setShowAttacks] = useState({});
  
  // State for boss targets and pending attacks
  const [bossTargets, setBossTargets] = useState({});
  const [pendingAttacks, setPendingAttacks] = useState({});
  
  // State to track per-component damage modifiers for each pending attack
  // Format: { attackId: { componentIndex: 'full'|'half'|'quarter'|'none' } }
  const [componentModifiers, setComponentModifiers] = useState({});
  
  // State to track manual damage adjustments per component
  // Format: { attackId: { componentIndex: adjustmentAmount } }
  const [componentAdjustments, setComponentAdjustments] = useState({});

  // Add a new state to track pending processing
  const [attackProcessing, setAttackProcessing] = useState(false);

  // Refs for the sections and entities
  const sectionRef = useRef(null);
  const bossRefs = useRef({});
  const groupRefs = useRef({});
  
  // Register the section ref
  useEffect(() => {
    if (sectionRef.current) {
      setGroupsSectionRef(sectionRef);
    }
  }, [setGroupsSectionRef]);
  
  // Register refs for individual bosses
  useEffect(() => {
    bosses.forEach(boss => {
      if (boss.id && bossRefs.current[boss.id]) {
        registerEntityRef('boss', boss.id, bossRefs.current[boss.id]);
      }
    });
  }, [bosses, registerEntityRef]);
  
  // Register refs for individual groups
  useEffect(() => {
    enemyGroups.forEach(group => {
      if (group.id && groupRefs.current[group.id]) {
        registerEntityRef('group', group.id, groupRefs.current[group.id]);
      }
    });
  }, [enemyGroups, registerEntityRef]);

  // Handle changes to the boss template
  const handleBossTemplateChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ['maxHp', 'currentHp', 'ac', 'initiative', 'initiativeModifier'].includes(name) 
      ? parseInt(value) || 0
      : value;
    setBossTemplate(prev => ({ ...prev, [name]: parsedValue }));
  };

  // Handle changes to saving throws in boss template
  const handleBossTemplateSavingThrowChange = (ability, value) => {
    setBossTemplate(prev => ({
      ...prev,
      savingThrows: {
        ...prev.savingThrows,
        [ability]: parseInt(value) || 0
      }
    }));
  };

  // Toggle a damage type inside defenses for the boss template
  const toggleBossTemplateDefense = (category, typeKey) => {
    setBossTemplate(prev => {
      const currentList = prev.defenses?.[category] || [];
      const alreadySelected = currentList.includes(typeKey);

      // Start from existing lists
      let resistances = [...(prev.defenses?.resistances || [])];
      let vulnerabilities = [...(prev.defenses?.vulnerabilities || [])];
      let immunities = [...(prev.defenses?.immunities || [])];

      // If selecting in one category, ensure exclusivity by removing from the others
      if (!alreadySelected) {
        if (category !== 'resistances') {
          resistances = resistances.filter(t => t !== typeKey);
        }
        if (category !== 'vulnerabilities') {
          vulnerabilities = vulnerabilities.filter(t => t !== typeKey);
        }
        if (category !== 'immunities') {
          immunities = immunities.filter(t => t !== typeKey);
        }
      }

      // Toggle in the chosen category
      if (category === 'resistances') {
        resistances = alreadySelected
          ? resistances.filter(t => t !== typeKey)
          : [...resistances, typeKey];
      } else if (category === 'vulnerabilities') {
        vulnerabilities = alreadySelected
          ? vulnerabilities.filter(t => t !== typeKey)
          : [...vulnerabilities, typeKey];
      } else if (category === 'immunities') {
        immunities = alreadySelected
          ? immunities.filter(t => t !== typeKey)
          : [...immunities, typeKey];
      }

      return {
        ...prev,
        defenses: { resistances, vulnerabilities, immunities }
      };
    });
  };

  // Create a wrapper for the renderSavingThrows function to handle the different parameter pattern
  const handleBossTemplateSavingThrowWrapper = (_, ability, value) => {
    handleBossTemplateSavingThrowChange(ability, value);
  };

  // Add this new function to toggle saving throws in both local state and store
  const handleToggleBossTemplateSavingThrows = () => {
    setBossTemplate(prev => ({
      ...prev,
      showSavingThrows: !prev.showSavingThrows
    }));
    toggleBossTemplateSavingThrows();
  };

  // Toggle defenses section in template
  const handleToggleBossTemplateDefenses = () => {
    setBossTemplate(prev => ({
      ...prev,
      showDefenses: !prev.showDefenses
    }));
  };

  // Roll initiative for boss template
  const rollBossInitiative = () => {
    const roll = rollD20();
    console.log('[Boss Initiative Roll]', { roll, modifier: bossTemplate.initiativeModifier || 0, note: 'UI shows raw d20 roll only' });
    // Set raw d20 roll (1-20). Modifier is applied at creation time only.
    setBossTemplate(prev => ({ ...prev, initiative: roll }));
  };

  // Helper to compute a default initiative with modifier when needed
  const getInitiativeRollWithMod = (modifier = 0) => {
    const roll = rollD20();
    return roll + (parseInt(modifier) || 0);
  };

  // Roll initiative for group template  
  const rollGroupInitiative = () => {
    const roll = rollD20();
    const modifier = parseInt(groupTemplate.initiativeModifier) || 0;
    console.log('[Group Initiative Roll]', { roll, modifier, note: 'UI shows raw d20 roll only' });
    // Set raw d20 roll (1-20). Modifier is applied at creation time only.
    updateGroupTemplate('initiative', roll);
  };

  // Add a new boss
  const handleAddBoss = () => {
    if (!bossTemplate.name || bossTemplate.maxHp <= 0 || bossTemplate.ac <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    // Ensure initiative includes modifier if not manually set/rolled
    const initiativeInput = parseInt(bossTemplate.initiative) || 0;
    const initiativeMod = parseInt(bossTemplate.initiativeModifier) || 0;
    const initiativeFinal = initiativeInput > 0 
      ? (initiativeInput + initiativeMod) 
      : (getInitiativeRollWithMod(initiativeMod));
    console.log('[Add Boss] before add', { name: bossTemplate.name, initiativeInput, initiativeMod, initiativeFinal });
    addBoss({ 
      ...bossTemplate, 
      id: Date.now().toString(), 
      currentHp: bossTemplate.maxHp,
      initiative: initiativeFinal,
      // Do not persist initiativeModifier on the created boss
      initiativeModifier: undefined
    });
    
    // Optionally reset form or clear some fields
    setBossTemplate(prev => ({
      ...prev,
      name: '',
      notes: '',
      defenses: { resistances: [], vulnerabilities: [], immunities: [] },
      showDefenses: false,
    }));
  };

  // Add attack to boss template
  const handleAddAttack = () => {
    if (!attackTemplate.name) {
      alert('Please enter an attack name');
      return;
    }
    
    if (!attackTemplate.damageComponents || attackTemplate.damageComponents.length === 0) {
      alert('Please add at least one damage component');
      return;
    }
    
    const newAttack = { ...attackTemplate, id: Date.now().toString() };
    
    setBossTemplate(prev => ({
      ...prev,
      attacks: [...prev.attacks, newAttack]
    }));
    
    // Reset attack template with fresh damage component
    setAttackTemplate(prev => ({ 
      ...prev, 
      name: '',
      id: Date.now().toString(),
      damageComponents: [{
        id: Date.now().toString() + '-1',
        numDice: 2,
        diceType: 6,
        modifier: 3,
        damageType: 'slashing'
      }]
    }));
  };

  // Remove attack from boss template
  const handleRemoveAttack = (attackId) => {
    setBossTemplate(prev => ({
      ...prev,
      attacks: prev.attacks.filter(attack => attack.id !== attackId)
    }));
  };

  // Add damage component to attack template
  const handleAddDamageComponent = () => {
    if (!tempDamageComponent.numDice || !tempDamageComponent.diceType) {
      alert('Please enter valid damage dice');
      return;
    }
    
    const newComponent = {
      ...tempDamageComponent,
      id: Date.now().toString()
    };
    
    setAttackTemplate(prev => ({
      ...prev,
      damageComponents: [...prev.damageComponents, newComponent]
    }));
    
    // Reset temp component with modifier 0
    setTempDamageComponent({
      numDice: 2,
      diceType: 6,
      modifier: 0,
      damageType: 'slashing'
    });
  };

  // Remove damage component from attack template
  const handleRemoveDamageComponent = (componentId) => {
    setAttackTemplate(prev => ({
      ...prev,
      damageComponents: prev.damageComponents.filter(comp => comp.id !== componentId)
    }));
  };

  // Update specific damage component in attack template
  const handleUpdateDamageComponent = (componentId, field, value) => {
    setAttackTemplate(prev => ({
      ...prev,
      damageComponents: prev.damageComponents.map(comp =>
        comp.id === componentId
          ? { ...comp, [field]: field === 'damageType' ? value : (parseInt(value) || 0) }
          : comp
      )
    }));
  };

  // Handle changes to temp damage component
  const handleTempDamageComponentChange = (e) => {
    const { name, value } = e.target;
    setTempDamageComponent(prev => ({
      ...prev,
      [name]: name === 'damageType' ? value : (parseInt(value) || 0)
    }));
  };

  // Handle changes to the attack template
  const handleAttackTemplateChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    let parsedValue;
    if (type === 'checkbox') {
      parsedValue = checked;
    } else if (['numDice', 'diceType', 'modifier', 'hitBonus', 'saveDC'].includes(name)) {
      parsedValue = parseInt(value) || 0;
    } else {
      parsedValue = value;
    }
    
    setAttackTemplate(prev => ({ ...prev, [name]: parsedValue }));
  };

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

    // Set default hit status
    let criticalHit = false;
    let criticalMiss = false;
    let rollResult = 0;
    let totalHit = 0;
    
    // Handle different attack methods
    if (attack.attackMethod === 'attackRoll') {
      // Roll to hit
      rollResult = rollD20();
      criticalHit = rollResult === 20;
      criticalMiss = rollResult === 1;
      totalHit = rollResult + attack.hitBonus;
    } else if (attack.attackMethod === 'save') {
      // For saving throws, we just prepare the attack result
      // Actual saves will be rolled when applied to a target
      resultMessage = `${attack.saveType.toUpperCase()} save DC ${attack.saveDC} required.
On failure: ${totalDamage} ${attack.damageType || 'slashing'} damage (${damageRoll} + ${attack.modifier})
${attack.halfOnSave ? `On success: ${Math.floor(totalDamage/2)} damage (half damage)` : 'On success: No damage'}`;
    } else if (attack.attackMethod === 'auto') {
      // Auto hit, no roll needed
    }
    
    // Roll damage
    let damageRoll = rollDice(attack.numDice, attack.diceType);
    let critDamageRoll = 0;
    let totalDamage = damageRoll + attack.modifier;
    
    // Double damage dice on critical hit
    if (criticalHit) {
      critDamageRoll = rollDice(attack.numDice, attack.diceType);
      totalDamage = damageRoll + critDamageRoll + attack.modifier;
    }
    
    // Generate result message
    let resultMessage;
    
    if (attack.attackMethod === 'attackRoll') {
      if (criticalMiss) {
        resultMessage = `Critical Miss!`;
      } else if (criticalHit) {
        resultMessage = `Critical Hit! ${totalDamage} ${attack.damageType || 'slashing'} damage (${damageRoll} + ${criticalHit ? damageRoll : 0} + ${attack.modifier})`;
      } else {
        resultMessage = `Attack roll: ${totalHit} (${rollResult} + ${attack.hitBonus})
Damage: ${totalDamage} ${attack.damageType || 'slashing'} damage (${damageRoll} + ${attack.modifier})`;
      }
    } else if (attack.attackMethod === 'save') {
      resultMessage = `${attack.saveType.toUpperCase()} save DC ${attack.saveDC} required.
On failure: ${totalDamage} ${attack.damageType || 'slashing'} damage (${damageRoll} + ${attack.modifier})
${attack.halfOnSave ? `On success: ${Math.floor(totalDamage/2)} damage (half damage)` : 'On success: No damage'}`;
    } else { // auto hit
      if (attack.saveType && attack.saveDC) {
        resultMessage = `Automatic hit! ${attack.saveType.toUpperCase()} save DC ${attack.saveDC} required.
On failure: ${totalDamage} ${attack.damageType || 'slashing'} damage (${damageRoll} + ${attack.modifier})
${attack.halfOnSave ? `On success: ${Math.floor(totalDamage/2)} damage (half damage)` : 'On success: No damage'}`;
      } else {
        resultMessage = `Automatic hit! ${totalDamage} ${attack.damageType || 'slashing'} damage (${damageRoll} + ${attack.modifier})`;
      }
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
      attackMethod: attack.attackMethod,
      saveType: attack.saveType,
      saveDC: attack.saveDC,
      halfOnSave: attack.halfOnSave,
      damageType: attack.damageType || 'slashing'
    });

    // Set the boss as the target and scroll to damage section
    setBossTarget(boss.id);
    scrollToDamageSection();
  };

  // Roll an attack against a targeted player
  const handleRollAttackAgainstPlayer = (boss, attack, targetId, event) => {
    // Make sure event propagation doesn't interfere with the button click
    event?.stopPropagation();
    
    // Set processing state to show visual feedback
    setAttackProcessing(true);
    
    try {
    
    // Add visible feedback if no target is selected
    if (!targetId) {
      // Flash the select box to draw attention
      const selectElement = document.querySelector(`select[value="${targetId}"]`);
      if (selectElement) {
        selectElement.classList.add('select-flash');
        setTimeout(() => selectElement.classList.remove('select-flash'), 500);
      }
      alert('Please select a target character first');
      setAttackProcessing(false);
      return;
    }
    
    // Find the target character
    const targetCharacter = characters.find(c => c.id === targetId);
    if (!targetCharacter) {
      alert('Target character not found. Please select a different target.');
      setAttackProcessing(false);
      return;
    }
    
    console.log(`Rolling attack: ${attack.name} against ${targetCharacter.name}`);
    
    let criticalHit = false;
    let criticalMiss = false;
    let rollResult = 0;
    let totalHit = 0;
    let hits = false;
    let hitStatus = 'miss';
    let saveRoll = 0;
    let savePassed = false;
    
    // Handle different attack methods
    if (attack.attackMethod === 'attackRoll') {
      // Roll to hit
      rollResult = rollD20();
      criticalHit = rollResult === 20;
      criticalMiss = rollResult === 1;
      totalHit = rollResult + attack.hitBonus;
      
      // Determine if the attack hits
      hits = criticalHit || (!criticalMiss && totalHit >= targetCharacter.ac);
      hitStatus = criticalHit ? 'critical' : (hits ? 'hit' : 'miss');
    } else if (attack.attackMethod === 'save') {
      // For save-based attacks, we'll let the DM input the save result
      // For now, just set it as a pending save that requires input
      hits = true; // Assume hit initially, will be adjusted based on save
      hitStatus = 'save-pending';
    } else if (attack.attackMethod === 'auto') {
      // Auto hit, no roll needed
      hits = true;
      hitStatus = 'auto';
      
      // Check if there's a saving throw component
      if (attack.isAoE || (attack.saveType && attack.saveDC)) {
        // For auto with save, also mark as pending save
        hitStatus = 'auto-save-pending';
      }
    }
    
    // Roll damage for each component
    let damageComponents = [];
    let totalDamage = 0;
    
    // Support both new damageComponents array and old single damage structure
    const componentsToRoll = attack.damageComponents && attack.damageComponents.length > 0
      ? attack.damageComponents
      : [{
          numDice: attack.numDice,
          diceType: attack.diceType,
          modifier: attack.modifier,
          damageType: attack.damageType || 'slashing'
        }];
    
    componentsToRoll.forEach(component => {
      let damageRoll = rollDice(component.numDice, component.diceType);
      let critDamageRoll = 0;
      let componentTotal = damageRoll + component.modifier;
      
      // Adjust damage based on attack method and results
      if (attack.attackMethod === 'attackRoll' && criticalHit) {
        // Double damage dice on critical hit
        critDamageRoll = rollDice(component.numDice, component.diceType);
        componentTotal = damageRoll + critDamageRoll + component.modifier;
      }
      
      damageComponents.push({
        damageType: component.damageType,
        numDice: component.numDice,
        diceType: component.diceType,
        modifier: component.modifier,
        damageRoll: damageRoll,
        critDamageRoll: critDamageRoll,
        total: componentTotal
      });
      
      totalDamage += componentTotal;
    });
    
    // Generate result message
    let resultMessage;
    
    // Helper to format damage component details
    const formatDamageDetails = (isCrit = false) => {
      return damageComponents.map(comp => {
        let detail = isCrit && comp.critDamageRoll > 0
          ? `${comp.damageRoll} + ${comp.critDamageRoll}${comp.modifier !== 0 ? ` + ${comp.modifier}` : ''} = ${comp.total} ${comp.damageType}`
          : `${comp.damageRoll}${comp.modifier !== 0 ? ` + ${comp.modifier}` : ''} = ${comp.total} ${comp.damageType}`;
        return detail;
      }).join(', ');
    };
    
    if (attack.attackMethod === 'attackRoll') {
      if (criticalMiss) {
        resultMessage = `Critical Miss against ${targetCharacter.name} (AC ${targetCharacter.ac})!`;
      } else if (criticalHit) {
        resultMessage = `Critical Hit against ${targetCharacter.name}! Total: <span class="damage-number">${totalDamage}</span> damage (${formatDamageDetails(true)})`;
      } else if (hits) {
        resultMessage = `Hit ${targetCharacter.name} (AC ${targetCharacter.ac}) with ${totalHit} (${rollResult} + ${attack.hitBonus})! Total: <span class="damage-number">${totalDamage}</span> damage (${formatDamageDetails()})`;
      } else {
        resultMessage = `Miss against ${targetCharacter.name} (AC ${targetCharacter.ac}) with ${totalHit} (${rollResult} + ${attack.hitBonus})`;
      }
    } else if (attack.attackMethod === 'save') {
      resultMessage = `${targetCharacter.name} needs to make a ${attack.saveType.toUpperCase()} save (DC ${attack.saveDC}). 
Potential damage: <span class="damage-number">${totalDamage}</span> total (${formatDamageDetails()})
${attack.halfOnSave ? 'Half damage on successful save' : 'No damage on successful save'}`;
    } else { // auto hit
      if (attack.saveType && attack.saveDC) {
        resultMessage = `Automatic hit on ${targetCharacter.name}! 
${targetCharacter.name} needs to make a ${attack.saveType.toUpperCase()} save (DC ${attack.saveDC}).
Potential damage: <span class="damage-number">${totalDamage}</span> total (${formatDamageDetails()})
${attack.halfOnSave ? 'Half damage on successful save' : 'No damage on successful save'}`;
      } else {
        resultMessage = `Automatic hit on ${targetCharacter.name}! <span class="damage-number">${totalDamage}</span> total damage (${formatDamageDetails()})`;
      }
    }
    
    // Create attack result object with a unique ID
    const uniqueId = Date.now().toString() + '-' + Math.floor(Math.random() * 1000);
    const attackResult = {
      id: uniqueId,
      attackName: attack.name,
      message: resultMessage,
      damage: totalDamage,
      damageComponents: damageComponents, // Add damage components array
      rollToHit: totalHit,
      criticalHit,
      criticalMiss,
      isAoE: false,
      attackMethod: attack.attackMethod,
      saveRoll,
      savePassed,
      saveType: attack.saveType,
      saveDC: attack.saveDC,
      halfOnSave: attack.halfOnSave,
      targetId: targetId,
      targetName: targetCharacter.name,
      hitStatus,
      timestamp: Date.now(),
      damageType: attack.damageType || 'slashing' // Keep for backwards compatibility
    };
    
    // Add the initial attack result to the combat log
    addBossAttackResult(boss.id, attackResult);
    
    // Force update in next microtask to ensure React processes the state update
    setTimeout(() => {
      setPendingAttacks(prev => {
        const newPending = {
          ...prev,
          [uniqueId]: {
            ...attackResult,
            modifier: 'full'  // Default to full damage
          }
        };
        console.log(`Updated pending attacks, count: ${Object.keys(newPending).length}`);
        setAttackProcessing(false);
        return newPending;
      });
      
      // Initialize component modifiers for multi-damage attacks
      if (damageComponents && damageComponents.length > 0) {
        const initialModifiers = {};
        const initialAdjustments = {};
        damageComponents.forEach((comp, idx) => {
          initialModifiers[idx] = 'full';
          initialAdjustments[idx] = 0;
        });
        setComponentModifiers(prev => ({
          ...prev,
          [uniqueId]: initialModifiers
        }));
        setComponentAdjustments(prev => ({
          ...prev,
          [uniqueId]: initialAdjustments
        }));
      }
    }, 0);
    } catch (error) {
      console.error('Error in handleRollAttackAgainstPlayer:', error);
      setAttackProcessing(false);
    }
  };

  // Handle applying damage with modifier
  const handleApplyDamage = (bossId, attackResultId, modifier) => {
    const pendingAttack = pendingAttacks[attackResultId];
    if (!pendingAttack) return;
    
    let finalDamage = 0;
    let modifierText = '';
    let saveResultText = '';
    let damageByType = [];
    
    // Check if this is a multi-component attack
    if (pendingAttack.damageComponents && pendingAttack.damageComponents.length > 0) {
      // Multi-damage component system
      const attackComponentModifiers = componentModifiers[attackResultId] || {};
      const attackComponentAdjustments = componentAdjustments[attackResultId] || {};
      
      // Apply modifiers to each component
      pendingAttack.damageComponents.forEach((comp, idx) => {
        let componentDamage = comp.total;
        const compModifier = attackComponentModifiers[idx] || 'full';
        const compAdjustment = attackComponentAdjustments[idx] || 0;
        
        // Apply damage modifier for this component
        if (compModifier === 'double') {
          componentDamage = componentDamage * 2;
        } else if (compModifier === 'half') {
          componentDamage = Math.floor(componentDamage / 2);
        } else if (compModifier === 'quarter') {
          componentDamage = Math.floor(componentDamage / 4);
        } else if (compModifier === 'none') {
          componentDamage = 0;
        }
        
        // Apply manual adjustment
        componentDamage = Math.max(0, componentDamage + compAdjustment);
        
        if (componentDamage > 0) {
          damageByType.push({
            type: comp.damageType,
            amount: componentDamage
          });
        }
        
        finalDamage += componentDamage;
      });
      
      // Create damage type text
      if (damageByType.length > 0) {
        modifierText = ' (' + damageByType.map(d => `${d.amount} ${d.type}`).join(' + ') + ')';
      }
    } else {
      // Legacy single-damage system
      finalDamage = pendingAttack.damage;
      
      // Apply damage modifier based on attack type and save status
      if (pendingAttack.hitStatus === 'save-pending' || pendingAttack.hitStatus === 'auto-save-pending') {
        // For saving throw attacks, modifier represents save result
        if (modifier === 'full') {
          saveResultText = ` (Failed ${pendingAttack.saveType.toUpperCase()} save)`;
        } else if (modifier === 'half') {
          finalDamage = Math.floor(finalDamage / 2);
          saveResultText = ` (Passed ${pendingAttack.saveType.toUpperCase()} save, half damage)`;
        } else if (modifier === 'none') {
          finalDamage = 0;
          saveResultText = ` (Passed ${pendingAttack.saveType.toUpperCase()} save, no damage)`;
        }
      } else {
        // Normal damage modifiers for non-save attacks
        if (modifier === 'double') {
          finalDamage = finalDamage * 2;
          modifierText = ' (double damage)';
        } else if (modifier === 'half') {
          finalDamage = Math.floor(finalDamage / 2);
          modifierText = ' (half damage)';
        } else if (modifier === 'quarter') {
          finalDamage = Math.floor(finalDamage / 4);
          modifierText = ' (quarter damage)';
        } else if (modifier === 'none') {
          finalDamage = 0;
          modifierText = ' (no damage)';
        }
      }
    }
    
    // Update result message with final damage and modifier info
    let updatedMessage = pendingAttack.message;
    
    // Replace the original damage number with the final damage in the message
    if (finalDamage !== pendingAttack.damage) {
      updatedMessage = updatedMessage.replace(
        new RegExp(`<span class="damage-number">${pendingAttack.damage}</span>`), 
        `<span class="damage-number">${finalDamage}</span>`
      );
    }
    
    // Add modifier info to the message
    updatedMessage += saveResultText + modifierText;
    
    // Update the existing attack result in the boss's history and combat log
    updateBossAttackResult(bossId, pendingAttack.id, {
      message: updatedMessage,
      appliedDamage: finalDamage,
      savePassed: modifier === 'half' || modifier === 'none'
    });
    
    // Apply damage to character if not "none"
    if (finalDamage > 0) {
      // Use the appropriate damage type info
      const damageTypeText = pendingAttack.damageType ? 
        ` ${pendingAttack.damageType}${saveResultText || modifierText}` : 
        saveResultText || modifierText;
      
      // Skip creating a new combat log entry since we updated the existing one
      applyDamageToCharacter(pendingAttack.targetId, finalDamage, pendingAttack.hitStatus, damageTypeText, true);
    }
    
    // Remove from pending attacks and cleanup component modifiers
    setPendingAttacks(prev => {
      const newPending = { ...prev };
      delete newPending[attackResultId];
      return newPending;
    });
    
    setComponentModifiers(prev => {
      const newModifiers = { ...prev };
      delete newModifiers[attackResultId];
      return newModifiers;
    });
    
    setComponentAdjustments(prev => {
      const newAdjustments = { ...prev };
      delete newAdjustments[attackResultId];
      return newAdjustments;
    });
  };

  // Small helper to render a compact, colored defense badge for a given damage type
  const renderDefenseBadge = (defenses, damageTypeKey) => {
    if (!defenses || !damageTypeKey) return null;
    const dt = DAMAGE_TYPES.find(d => d.key === damageTypeKey);
    if (!dt) return null;
    const isImmune = (defenses.immunities || []).includes(damageTypeKey);
    const isResist = (defenses.resistances || []).includes(damageTypeKey);
    const isVuln = (defenses.vulnerabilities || []).includes(damageTypeKey);
    if (!isImmune && !isResist && !isVuln) return null;
    const styleBase = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '3px', fontSize: '14px', lineHeight: 1 };
    const style = isImmune
      ? { ...styleBase, backgroundColor: '#c6f6d5', color: '#22543d' }
      : isResist
      ? { ...styleBase, backgroundColor: '#81e6d9', color: '#1a365d' }
      : { ...styleBase, backgroundColor: '#fed7d7', color: '#742a2a' };
    const title = isImmune ? `Immune: ${dt.label}` : isResist ? `Resistant: ${dt.label}` : `Vulnerable: ${dt.label}`;
    return <span title={title} style={style}>{dt.icon}</span>;
  };

  // Handle changes to the group template
  const handleGroupTemplateChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields like damage.numDice
    if (name.includes('.')) {
      const [, childField] = name.split('.');
      
      // Parse number fields
      const parsedValue = ['numDice', 'diceType', 'modifier'].includes(childField)
        ? parseInt(value) || 0
        : value;
      
      // Use the existing updateGroupTemplate function which already handles nested fields
      updateGroupTemplate(name, parsedValue);
      return;
    }
    
    // Handle non-nested fields
    const parsedValue = ['maxHp', 'currentHp', 'ac', 'count', 'attackBonus', 'initiative', 'initiativeModifier'].includes(name)
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
    // If initiative is 0/empty, auto-roll with modifier so modifier is applied
    const init = parseInt(groupTemplate.initiative) || 0;
    const mod = parseInt(groupTemplate.initiativeModifier) || 0;
    let finalInit = init;
    if (init > 0) {
      finalInit = init + mod;
      console.log('[Add Group] manual initiative + modifier', { init, mod, finalInit });
      updateGroupTemplate('initiative', finalInit);
    } else if (mod !== 0) {
      const total = (rollD20() + mod);
      console.log('[Add Group] auto roll initiative with modifier', { mod, total });
      updateGroupTemplate('initiative', total);
    } else {
      console.log('[Add Group] using initiative as-is', { init });
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
    
    // Use attack bonus from group, with fallback to default +3
    const attackBonus = group.attackBonus || 3;
    
    // Get damage details from group, with fallback to defaults
    const damageDetails = group.damage || { numDice: 1, diceType: 8, modifier: 2, damageType: 'slashing' };
    const { numDice, diceType, modifier, damageType } = damageDetails;
    
    // Roll attack for each creature in the group
    const results = [];
    let totalDamage = 0;
    
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
        // Roll the configured damage dice
        const diceDamage = rollDice(numDice, diceType);
        // For critical hits, double the dice damage only, not the modifier
        const criticalDiceDamage = isNatural20 ? rollDice(numDice, diceType) : 0;
        damage = diceDamage + criticalDiceDamage + modifier;
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
        targetId: targetCharacterId,
        damageType: damageType || 'slashing'
      }
    }));
  };
  
  // Apply damage from a group attack to a character
  const handleApplyDamageGroup = (e, groupId, damageModifier = 'full') => {
    e.stopPropagation(); // Prevent group targeting
    
    const attackResult = attackResults[groupId];
    if (!attackResult) return;
    
    // Get the damage type from the attack result
    const damageType = attackResult.damageType || 'slashing';
    
    // Calculate the final damage based on the modifier
    let finalDamage = attackResult.totalDamage;
    if (damageModifier === 'double') {
      finalDamage = finalDamage * 2;
    } else if (damageModifier === 'half') {
      finalDamage = Math.floor(finalDamage / 2);
    } else if (damageModifier === 'quarter') {
      finalDamage = Math.floor(finalDamage / 4);
    }
    
    // Apply the damage to the character
    applyDamageToCharacter(
      attackResult.targetId, 
      finalDamage, 
      attackResult.results.some(r => r.isNatural20) ? 'critical' : 'hit',
      damageModifier !== 'full' ? ` (${damageModifier} ${damageType} damage)` : ` (${damageType})`
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
  
  // Handle damage modifier change
  const handleDamageModifierChange = (characterId, groupId, value) => {
    console.log(`Changing damage modifier for character ${characterId}, group ${groupId} to ${value}`);
    
    setDamageModifiers(prev => {
      // Ensure we have an object for this character
      const characterModifiers = prev[characterId] || {};
      
      return {
        ...prev,
        [characterId]: {
          ...characterModifiers,
          [groupId]: value
        }
      };
    });
  };
  
  // Handle adjusting damage amount for a character-group pair
  const handleAdjustDamage = (characterId, groupId, amount) => {
    // Track the adjustment separately for display purposes
    const currentAdjustment = damageAdjustments[characterId]?.[groupId] || 0;
    const newAdjustment = currentAdjustment + amount;
    
    // Get the current result
    const result = globalAttackResults?.allResults?.find(
      r => r.characterId === characterId && r.sourceGroupId === groupId
    );
    
    if (!result) return;
    
    // Calculate the current modified damage
    const modifier = damageModifiers[characterId]?.[groupId] || 'full';
    let modifiedDamage = result.damage;
    
    if (modifier === 'double') {
      modifiedDamage = modifiedDamage * 2;
    } else if (modifier === 'half') {
      modifiedDamage = Math.floor(modifiedDamage / 2);
    } else if (modifier === 'quarter') {
      modifiedDamage = Math.floor(modifiedDamage / 4);
    } else if (modifier === 'none') {
      modifiedDamage = 0;
    }
    
    // Ensure we don't create a negative adjustment that would make final damage below 0
    const cappedAdjustment = Math.max(newAdjustment, -modifiedDamage);
    
    // Update the tracked adjustments
    setDamageAdjustments(prev => ({
      ...prev,
      [characterId]: {
        ...(prev[characterId] || {}),
        [groupId]: cappedAdjustment
      }
    }));
  };
  
  // Apply all rolled damage to characters
  const handleApplyAllDamage = () => {
    if (!globalAttackResults || !globalAttackResults.allResults) return;
    
    // Prepare damage details with modifiers and adjustments
    const damageDetails = globalAttackResults.allResults.map(result => {
      // Get the current damage modifier for this character/group combination
      const modifier = damageModifiers[result.characterId]?.[result.sourceGroupId] || 'full';
      
      // Get manual adjustment if any
      const adjustment = damageAdjustments[result.characterId]?.[result.sourceGroupId] || 0;
      
      // Get original damage before any adjustments
      const originalDamage = result.originalDamage !== undefined ? result.originalDamage : result.damage;
      
      // Get base damage (after AC adjustments)
      const baseDamage = result.damage;
      
      // Calculate modified damage based on selected modifier
      let modifiedDamage = baseDamage;
      if (modifier === 'double') {
        modifiedDamage = baseDamage * 2;
      } else if (modifier === 'half') {
        modifiedDamage = Math.floor(baseDamage / 2);
      } else if (modifier === 'quarter') {
        modifiedDamage = Math.floor(baseDamage / 4);
      } else if (modifier === 'none') {
        modifiedDamage = 0;
      }
      
      // Apply manual adjustments to the modified damage
      const finalDamage = Math.max(0, modifiedDamage + adjustment);
      
      // Create detail object with all required information
      return {
        ...result,
        // Set the modifier to 'full' to prevent double-application in the store
        // but keep the original modifier for display purposes
        originalModifier: modifier,
        modifier: 'full',  // This prevents the store from re-applying the modifier
        acOverride: characterAcOverrides[result.characterId] || null,
        hitCount: result.hitCount,
        adjustedHitCount: result.adjustedHitCount,
        manualAdjustment: adjustment,
        // Pass the final calculated damage that includes both modifier and adjustments
        damage: finalDamage,
        originalDamage,
        // Add a flag to indicate that damage has been pre-calculated
        damagePreCalculated: true
      };
    });
    
    // Debug logging
    console.log('Applying damage with details:', damageDetails.map(detail => ({
      character: characters.find(c => c.id === detail.characterId)?.name,
      group: detail.groupName,
      originalDamage: detail.originalDamage,
      baseDamage: globalAttackResults.allResults.find(r => 
        r.characterId === detail.characterId && r.sourceGroupId === detail.sourceGroupId
      )?.damage,
      finalDamage: detail.damage,
      originalModifier: detail.originalModifier,
      modifier: detail.modifier,
      adjustment: detail.manualAdjustment,
      acOverride: detail.acOverride
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

  // Toggle import/export modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Set a boss as the target and handle scroll behavior
  const handleSetBossAsTarget = (bossId) => {
    const isAlreadyTargeted = targetEntity && 
                            targetEntity.type === 'boss' && 
                            targetEntity.id === bossId;
                            
    if (isAlreadyTargeted) {
      // If already targeted, just scroll to damage section
      scrollToDamageSection();
    } else {
      // Set as target but don't scroll yet
      setBossTarget(bossId);
      
      // Remove the auto-scroll behavior from setBossTarget
      // The user will need to click the button again to scroll
    }
  };

  return (
    <div className="groups-section" ref={sectionRef}>
      <div className="section-header">
        <h3>Enemy Groups & Bosses</h3>
        <div className="groups-buttons">
          <button
            className="import-export-button"
            onClick={toggleModal}
            title="Import/Export Data"
          >
            Import/Export
          </button>
          <button
            className="toggle-section-button"
            onClick={() => toggleSection('groups')}
          >
            {expandedSections.groups ? 'Hide Groups' : 'Show Groups'}
          </button>
        </div>
      </div>

      {expandedSections.groups && (
        <>
          <div className="entity-type-toggle">
            <button 
              className={`entity-toggle-button ${addEntityType === 'group' ? 'active' : ''}`}
              onClick={() => setAddEntityType('group')}
            >
              Add Enemy Group
            </button>
            <button 
              className={`entity-toggle-button ${addEntityType === 'boss' ? 'active' : ''}`}
              onClick={() => setAddEntityType('boss')}
            >
              Add Boss
            </button>
            <div className='grow' />
            <button
                  className="toggle-section-button small hide-group-boss-button"
                  onClick={() => setShowAddGroupOrBoss(!showAddGroupOrBoss)}
                >
                  {showAddGroupOrBoss ? 'Hide' : 'Show'}
                </button>
          </div>

          {showAddGroupOrBoss && (addEntityType === 'group' ? (
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
                <div className="template-field initiative-field">
                  <label>Initiative:</label>
                  <div className="initiative-controls">
                    <input
                      type="number"
                      name="initiative"
                      value={groupTemplate.initiative || 0}
                      onChange={handleGroupTemplateChange}
                      min="0"
                      placeholder="Roll result"
                    />
                    <span className="initiative-separator">+</span>
                    <input
                      type="number"
                      name="initiativeModifier"
                      value={groupTemplate.initiativeModifier || 0}
                      onChange={handleGroupTemplateChange}
                      placeholder="Mod"
                      className="initiative-modifier"
                      title="Initiative Modifier"
                    />
                    <button
                      type="button"
                      className="roll-initiative-button"
                      onClick={rollGroupInitiative}
                      title="Roll Initiative (1d20 + modifier)"
                    >
                      🎲
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="group-damage-config">
                <h5>Attack Configuration</h5>
                <div className="attack-config-fields">
                  <div className="attack-field">
                    <label>Attack Bonus:</label>
                    <input
                      type="number"
                      name="attackBonus"
                      value={groupTemplate.attackBonus || 3}
                      onChange={handleGroupTemplateChange}
                      min="0"
                    />
                  </div>
                  <div className="attack-field dice-field">
                    <label>Damage:</label>
                    <div className="dice-inputs">
                      <input
                        type="number"
                        name="damage.numDice"
                        value={groupTemplate.damage?.numDice || 1}
                        onChange={handleGroupTemplateChange}
                        min="1"
                        className="num-dice"
                      />
                      <span>d</span>
                      <input
                        type="number"
                        name="damage.diceType"
                        value={groupTemplate.damage?.diceType || 8}
                        onChange={handleGroupTemplateChange}
                        min="1"
                        className="dice-type"
                      />
                      <span>+</span>
                      <input
                        type="number"
                        name="damage.modifier"
                        value={groupTemplate.damage?.modifier || 2}
                        onChange={handleGroupTemplateChange}
                        className="modifier"
                      />
                    </div>
                  </div>
                  <div className="attack-field">
                    <label>Damage Type:</label>
                    <select
                      name="damage.damageType"
                      value={groupTemplate.damage?.damageType || 'slashing'}
                      onChange={handleGroupTemplateChange}
                    >
                      <option value="slashing">Slashing</option>
                      <option value="piercing">Piercing</option>
                      <option value="bludgeoning">Bludgeoning</option>
                      <option value="acid">Acid</option>
                      <option value="cold">Cold</option>
                      <option value="fire">Fire</option>
                      <option value="force">Force</option>
                      <option value="lightning">Lightning</option>
                      <option value="necrotic">Necrotic</option>
                      <option value="poison">Poison</option>
                      <option value="psychic">Psychic</option>
                      <option value="radiant">Radiant</option>
                      <option value="thunder">Thunder</option>
                    </select>
                  </div>
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
          ) : (
            <div className="add-boss-section">
              <h4>Add New Boss</h4>
              <div className="boss-template-fields">
                <div className="boss-field">
                  <label>Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={bossTemplate.name}
                    onChange={handleBossTemplateChange}
                    placeholder="Boss Name"
                  />
                </div>
                <div className="boss-field">
                  <label>Max HP:</label>
                  <input
                    type="number"
                    name="maxHp"
                    value={bossTemplate.maxHp}
                    onChange={handleBossTemplateChange}
                    min="1"
                  />
                </div>
                <div className="boss-field">
                  <label>AC:</label>
                  <input
                    type="number"
                    name="ac"
                    value={bossTemplate.ac}
                    onChange={handleBossTemplateChange}
                    min="1"
                  />
                </div>
                <div className="boss-field initiative-field">
                  <label>Initiative:</label>
                  <div className="initiative-controls">
                    <input
                      type="number"
                      name="initiative"
                      value={bossTemplate.initiative}
                      onChange={handleBossTemplateChange}
                      min="0"
                      placeholder="Roll result"
                    />
                    <span className="initiative-separator">+</span>
                    <input
                      type="number"
                      name="initiativeModifier"
                      value={bossTemplate.initiativeModifier}
                      onChange={handleBossTemplateChange}
                      placeholder="Mod"
                      className="initiative-modifier"
                      title="Initiative Modifier"
                    />
                    <button
                      type="button"
                      className="roll-initiative-button"
                      onClick={rollBossInitiative}
                      title="Roll Initiative (1d20 + modifier)"
                    >
                      🎲
                    </button>
                  </div>
                </div>
                <div className="boss-field wide">
                  <label>Notes:</label>
                  <textarea
                    name="notes"
                    value={bossTemplate.notes}
                    onChange={handleBossTemplateChange}
                    placeholder="Boss notes, abilities, etc."
                  />
                </div>
              </div>
              
              {/* Saving Throws Toggle */}
              <div className="saving-throws-container">
                <div 
                  className="saving-throws-header" 
                  onClick={handleToggleBossTemplateSavingThrows}
                >
                  <h5>Saving Throws {bossTemplate.showSavingThrows ? '▼' : '►'}</h5>
                </div>
                
                {bossTemplate.showSavingThrows && renderSavingThrows(bossTemplate.savingThrows, handleBossTemplateSavingThrowWrapper)}
              </div>

              {/* Defenses (Resistances, Vulnerabilities, Immunities) */}
              <div className="defenses-container">
                <div 
                  className="defenses-header" 
                  onClick={handleToggleBossTemplateDefenses}
                >
                  <h5>Defenses {bossTemplate.showDefenses ? '▼' : '►'}</h5>
                </div>

                {bossTemplate.showDefenses && (
                  <div className="defenses-grid">
                    {/* Resistances */}
                    <div className="defense-column">
                      <div className="defense-title">Resistances</div>
                      <div className="defense-chips-select">
                        {DAMAGE_TYPES.map(dt => {
                          const selected = bossTemplate.defenses?.resistances?.includes(dt.key);
                          return (
                            <button
                              key={`res-${dt.key}`}
                              type="button"
                              className={`defense-chip ${selected ? 'selected' : ''}`}
                              title={`${dt.label} (Resistance)`}
                              onClick={() => toggleBossTemplateDefense('resistances', dt.key)}
                            >
                              <span className="chip-icon" aria-hidden>{dt.icon}</span>
                              <span className="chip-label">{dt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vulnerabilities */}
                    <div className="defense-column">
                      <div className="defense-title">Vulnerabilities</div>
                      <div className="defense-chips-select">
                        {DAMAGE_TYPES.map(dt => {
                          const selected = bossTemplate.defenses?.vulnerabilities?.includes(dt.key);
                          return (
                            <button
                              key={`vuln-${dt.key}`}
                              type="button"
                              className={`defense-chip vuln ${selected ? 'selected' : ''}`}
                              title={`${dt.label} (Vulnerability)`}
                              onClick={() => toggleBossTemplateDefense('vulnerabilities', dt.key)}
                            >
                              <span className="chip-icon" aria-hidden>{dt.icon}</span>
                              <span className="chip-label">{dt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Immunities */}
                    <div className="defense-column">
                      <div className="defense-title">Immunities</div>
                      <div className="defense-chips-select">
                        {DAMAGE_TYPES.map(dt => {
                          const selected = bossTemplate.defenses?.immunities?.includes(dt.key);
                          return (
                            <button
                              key={`imm-${dt.key}`}
                              type="button"
                              className={`defense-chip imm ${selected ? 'selected' : ''}`}
                              title={`${dt.label} (Immunity)`}
                              onClick={() => toggleBossTemplateDefense('immunities', dt.key)}
                            >
                              <span className="chip-icon" aria-hidden>{dt.icon}</span>
                              <span className="chip-label">{dt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="add-attack-section">
                <h5>Add Attack</h5>
                <div className="attack-template-fields">
                  <div className="attack-field">
                    <label>Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={attackTemplate.name}
                      onChange={handleAttackTemplateChange}
                      placeholder="Attack Name"
                    />
                  </div>
                  <div className="attack-method-info">
                    <p className="attack-info-note">
                      <strong>Attack Methods:</strong> 
                      <span className="attack-method-description">Attack Roll (needs to-hit bonus), Saving Throw (needs DC), or Automatic Hit</span>
                    </p>
                  </div>
                  <div className="attack-field">
                    <label>Type:</label>
                    <select
                      name="type"
                      value={attackTemplate.type}
                      onChange={handleAttackTemplateChange}
                    >
                      <option value="melee">Melee</option>
                      <option value="ranged">Ranged</option>
                      <option value="spell">Spell</option>
                    </select>
                  </div>
                  <div className="attack-field">
                    <label>Attack Method:</label>
                    <select
                      name="attackMethod"
                      value={attackTemplate.attackMethod}
                      onChange={handleAttackTemplateChange}
                    >
                      <option value="attackRoll">Attack Roll</option>
                      <option value="save">Saving Throw</option>
                      <option value="auto">Automatic Hit</option>
                    </select>
                  </div>
                  {attackTemplate.attackMethod === 'attackRoll' && (
                    <div className="attack-field">
                      <label>Hit Bonus:</label>
                      <input
                        type="number"
                        name="hitBonus"
                        value={attackTemplate.hitBonus}
                        onChange={handleAttackTemplateChange}
                      />
                    </div>
                  )}
                  <div className="attack-field">
                    <label>AoE:</label>
                    <input
                      type="checkbox"
                      name="isAoE"
                      checked={attackTemplate.isAoE}
                      onChange={handleAttackTemplateChange}
                    />
                  </div>
                  {(attackTemplate.attackMethod === 'save' || attackTemplate.isAoE || attackTemplate.attackMethod === 'auto') && (
                    <>
                      <div className="attack-field">
                        <label>Save Type:</label>
                        <select
                          name="saveType"
                          value={attackTemplate.saveType}
                          onChange={handleAttackTemplateChange}
                        >
                          <option value="str">STR</option>
                          <option value="dex">DEX</option>
                          <option value="con">CON</option>
                          <option value="int">INT</option>
                          <option value="wis">WIS</option>
                          <option value="cha">CHA</option>
                        </select>
                      </div>
                      <div className="attack-field">
                        <label>Save DC:</label>
                        <input
                          type="number"
                          name="saveDC"
                          value={attackTemplate.saveDC}
                          onChange={handleAttackTemplateChange}
                          min="1"
                        />
                      </div>
                      <div className="attack-field">
                        <label>On Save:</label>
                        <select
                          name="halfOnSave"
                          value={attackTemplate.halfOnSave ? "half" : "none"}
                          onChange={(e) => {
                            handleAttackTemplateChange({
                              target: {
                                name: "halfOnSave",
                                value: e.target.value === "half",
                                type: "select"
                              }
                            });
                          }}
                        >
                          <option value="half">Half Damage</option>
                          <option value="none">No Damage</option>
                        </select>
                      </div>
                    </>
                  )}
                  
                  {/* Damage Components Section */}
                  <div className="damage-components-section">
                    <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Damage Components:</h5>
                    
                    {/* Existing damage components */}
                    {attackTemplate.damageComponents && attackTemplate.damageComponents.length > 0 && (
                      <div className="damage-components-list">
                        {attackTemplate.damageComponents.map((component, index) => (
                          <div key={component.id} className="damage-component-item">
                            <div className="damage-component-inputs">
                              <input
                                type="number"
                                value={component.numDice}
                                onChange={(e) => handleUpdateDamageComponent(component.id, 'numDice', e.target.value)}
                                min="1"
                                className="num-dice-small"
                                style={{width: '50px'}}
                              />
                              <span>d</span>
                              <input
                                type="number"
                                value={component.diceType}
                                onChange={(e) => handleUpdateDamageComponent(component.id, 'diceType', e.target.value)}
                                min="1"
                                className="dice-type-small"
                                style={{width: '50px'}}
                              />
                              <span>+</span>
                              <input
                                type="number"
                                value={component.modifier}
                                onChange={(e) => handleUpdateDamageComponent(component.id, 'modifier', e.target.value)}
                                className="modifier-small"
                                style={{width: '50px'}}
                              />
                              <select
                                value={component.damageType}
                                onChange={(e) => handleUpdateDamageComponent(component.id, 'damageType', e.target.value)}
                                className="damage-type-select"
                                style={{marginLeft: '8px', width: '120px'}}
                              >
                                <option value="slashing">Slashing</option>
                                <option value="piercing">Piercing</option>
                                <option value="bludgeoning">Bludgeoning</option>
                                <option value="acid">Acid</option>
                                <option value="cold">Cold</option>
                                <option value="fire">Fire</option>
                                <option value="force">Force</option>
                                <option value="lightning">Lightning</option>
                                <option value="necrotic">Necrotic</option>
                                <option value="poison">Poison</option>
                                <option value="psychic">Psychic</option>
                                <option value="radiant">Radiant</option>
                                <option value="thunder">Thunder</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveDamageComponent(component.id)}
                                className="remove-damage-component-btn"
                                style={{marginLeft: '8px', padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                                disabled={attackTemplate.damageComponents.length === 1}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add new damage component form */}
                    <div className="add-damage-component-form" style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
                      <div style={{marginBottom: '8px', fontWeight: 'bold', fontSize: '14px'}}>Add Another Damage Type:</div>
                      <div className="damage-component-inputs">
                        <input
                          type="number"
                          name="numDice"
                          value={tempDamageComponent.numDice}
                          onChange={handleTempDamageComponentChange}
                          min="1"
                          placeholder="Dice"
                          className="num-dice-small"
                          style={{width: '50px'}}
                        />
                        <span>d</span>
                        <input
                          type="number"
                          name="diceType"
                          value={tempDamageComponent.diceType}
                          onChange={handleTempDamageComponentChange}
                          min="1"
                          placeholder="Type"
                          className="dice-type-small"
                          style={{width: '50px'}}
                        />
                        <span>+</span>
                        <input
                          type="number"
                          name="modifier"
                          value={tempDamageComponent.modifier}
                          onChange={handleTempDamageComponentChange}
                          placeholder="Mod"
                          className="modifier-small"
                          style={{width: '50px'}}
                        />
                        <select
                          name="damageType"
                          value={tempDamageComponent.damageType}
                          onChange={handleTempDamageComponentChange}
                          className="damage-type-select"
                          style={{marginLeft: '8px', width: '120px'}}
                        >
                          <option value="slashing">Slashing</option>
                          <option value="piercing">Piercing</option>
                          <option value="bludgeoning">Bludgeoning</option>
                          <option value="acid">Acid</option>
                          <option value="cold">Cold</option>
                          <option value="fire">Fire</option>
                          <option value="force">Force</option>
                          <option value="lightning">Lightning</option>
                          <option value="necrotic">Necrotic</option>
                          <option value="poison">Poison</option>
                          <option value="psychic">Psychic</option>
                          <option value="radiant">Radiant</option>
                          <option value="thunder">Thunder</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddDamageComponent}
                          className="add-component-btn"
                          style={{marginLeft: '8px', padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  className="add-attack-button"
                  onClick={handleAddAttack}
                  disabled={!attackTemplate.name}
                >
                  Add Attack
                </button>
              </div>

              {bossTemplate.attacks.length > 0 && (
                <div className="template-attacks-list">
                  <h5>Attacks:</h5>
                  <ul>
                    {bossTemplate.attacks.map(attack => {
                      // Helper function to format damage components
                      const formatDamageComponents = (components) => {
                        if (!components || components.length === 0) {
                          // Fallback for old format attacks
                          return `${attack.numDice}d${attack.diceType}+${attack.modifier} ${attack.damageType || 'slashing'}`;
                        }
                        return components.map((comp, idx) => 
                          `${comp.numDice}d${comp.diceType}${comp.modifier > 0 ? '+' + comp.modifier : comp.modifier < 0 ? comp.modifier : ''} ${comp.damageType}`
                        ).join(' + ');
                      };
                      
                      return (
                        <li key={attack.id} className="template-attack-item">
                          <span className="attack-name">{attack.name}</span>
                          <span className="attack-details">
                            {attack.isAoE ? 'AoE - ' : ''}
                            {formatDamageComponents(attack.damageComponents)}
                            {attack.attackMethod === 'attackRoll' && !attack.isAoE && ` (${attack.hitBonus >= 0 ? '+' : ''}${attack.hitBonus} to hit)`}
                            {(attack.attackMethod === 'save' || attack.isAoE || 
                              (attack.attackMethod === 'auto' && attack.saveType && attack.saveDC)) && 
                              ` (DC ${attack.saveDC} ${attack.saveType.toUpperCase()}, ${attack.halfOnSave ? 'half' : 'no'} damage on save)`}
                            {attack.attackMethod === 'auto' && !attack.isAoE && 
                              !(attack.saveType && attack.saveDC) && ' (auto hit)'}
                          </span>
                          <button 
                            className="remove-attack-button"
                            onClick={() => handleRemoveAttack(attack.id)}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              <button 
                className="add-boss-button"
                onClick={handleAddBoss}
                disabled={!bossTemplate.name || bossTemplate.maxHp <= 0 || bossTemplate.ac <= 0}
              >
                Add Boss
              </button>
            </div>
          ))}

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
                                {(() => {
                                  // Get the base damage (after AC adjustments)
                                  const baseDamage = result.damage;
                                  
                                  // Get the modifier and calculate the modified damage
                                  const modifier = damageModifiers[character.id]?.[result.sourceGroupId] || 'full';
                                  
                                  // Calculate the modified damage based on the selected modifier
                                  let modifiedDamage = baseDamage;
                                  if (modifier === 'double') {
                                    modifiedDamage = baseDamage * 2;
                                  } else if (modifier === 'half') {
                                    modifiedDamage = Math.floor(baseDamage / 2);
                                  } else if (modifier === 'quarter') {
                                    modifiedDamage = Math.floor(baseDamage / 4);
                                  } else if (modifier === 'none') {
                                    modifiedDamage = 0;
                                  }
                                  
                                  // Apply manual adjustments to the MODIFIED damage, not the base damage
                                  const adjustment = damageAdjustments[character.id]?.[result.sourceGroupId] || 0;
                                  const finalDamage = Math.max(0, modifiedDamage + adjustment);
                                  
                                  // Display the modified damage
                                  return (
                                    <>
                                      <span className={modifier !== 'full' || adjustment !== 0 ? "modified-damage" : ""}>
                                        {finalDamage} {result.damageType || 'slashing'}
                                      </span>
                                      
                                      {/* Show original damage if different from modified */}
                                      {(modifier !== 'full' || adjustment !== 0) && (
                                        <span className="original-damage">
                                          ({baseDamage} {result.damageType || 'slashing'})
                                        </span>
                                      )}
                                      
                                      {/* Show manual adjustments if any */}
                                      {adjustment !== 0 && (
                                        <span className="damage-adjustment">
                                          {adjustment > 0 ? 
                                            ` +${adjustment}` :
                                            ` ${adjustment}`}
                                        </span>
                                      )}
                                      
                                      {/* Show AC override effects if any */}
                                      {characterAcOverrides[character.id] && result.originalDamage && result.originalDamage !== baseDamage && (
                                        <span className="ac-adjustment">
                                          (AC: {result.hitCount && result.adjustedHitCount !== undefined && 
                                            `${result.adjustedHitCount}/${result.hitCount} hits`})
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
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
                                  <option value="double">Double Damage</option>
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
                <div className="boss-controls">
                  <button className="reset-boss-health" onClick={resetBossesHealth}>
                    Reset Boss Health
                  </button>
                  <button className="clear-all-bosses" onClick={clearAllBosses}>
                    Clear All Bosses
                  </button>
                </div>
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
                        ref={el => {
                          bossRefs.current[boss.id] = { current: el };
                        }}
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
                          {/* Compact defenses display */}
                          {(boss.defenses?.resistances?.length || boss.defenses?.vulnerabilities?.length || boss.defenses?.immunities?.length) ? (
                            <div className="boss-defenses-display">
                              {boss.defenses?.resistances?.length > 0 && (
                                <div className="defense-row">
                                  <span className="defense-label res">RES</span>
                                  <div className="defense-icons">
                                    {boss.defenses.resistances.map(key => {
                                      const dt = DAMAGE_TYPES.find(d => d.key === key);
                                      if (!dt) return null;
                                      return (
                                        <span key={`res-icon-${key}`} className="defense-icon" title={`Resistant: ${dt.label}`}>{dt.icon}</span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {boss.defenses?.vulnerabilities?.length > 0 && (
                                <div className="defense-row">
                                  <span className="defense-label vuln">VULN</span>
                                  <div className="defense-icons">
                                    {boss.defenses.vulnerabilities.map(key => {
                                      const dt = DAMAGE_TYPES.find(d => d.key === key);
                                      if (!dt) return null;
                                      return (
                                        <span key={`vuln-icon-${key}`} className="defense-icon" title={`Vulnerable: ${dt.label}`}>{dt.icon}</span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {boss.defenses?.immunities?.length > 0 && (
                                <div className="defense-row">
                                  <span className="defense-label imm">IMM</span>
                                  <div className="defense-icons">
                                    {boss.defenses.immunities.map(key => {
                                      const dt = DAMAGE_TYPES.find(d => d.key === key);
                                      if (!dt) return null;
                                      return (
                                        <span key={`imm-icon-${key}`} className="defense-icon" title={`Immune: ${dt.label}`}>{dt.icon}</span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
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
                            onClick={() => handleSetBossAsTarget(boss.id)}
                            title={isTargeted ? "Scroll to damage section" : "Set as target for single attack"}
                          >
                            {isTargeted ? "Scroll to Damage" : "Target"}
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
                                  {boss.attacks.map(attack => {
                                    // Helper function to format damage components
                                    const formatDamageComponents = (components) => {
                                      if (!components || components.length === 0) {
                                        // Fallback for old format attacks
                                        return `${attack.numDice}d${attack.diceType}+${attack.modifier} ${attack.damageType || 'slashing'}`;
                                      }
                                      return components.map((comp, idx) => 
                                        `${comp.numDice}d${comp.diceType}${comp.modifier > 0 ? '+' + comp.modifier : comp.modifier < 0 ? comp.modifier : ''} ${comp.damageType}`
                                      ).join(' + ');
                                    };
                                    
                                    return (
                                      <li key={attack.id} className="boss-attack-item">
                                        <div className="attack-info">
                                          <span className="attack-name">{attack.name}</span>
                                          <span className="attack-details">
                                            {attack.isAoE ? 'AoE - ' : ''}
                                            {formatDamageComponents(attack.damageComponents)}
                                            {attack.attackMethod === 'attackRoll' && !attack.isAoE && ` (${attack.hitBonus >= 0 ? '+' : ''}${attack.hitBonus} to hit)`}
                                            {(attack.attackMethod === 'save' || attack.isAoE || 
                                              (attack.attackMethod === 'auto' && attack.saveType && attack.saveDC)) && 
                                              ` (DC ${attack.saveDC} ${attack.saveType.toUpperCase()}, ${attack.halfOnSave ? 'half' : 'no'} damage on save)`}
                                            {attack.attackMethod === 'auto' && !attack.isAoE && 
                                              !(attack.saveType && attack.saveDC) && ' (auto hit)'}
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
                                              className={`roll-attack-button ${attackProcessing ? 'processing' : ''}`}
                                              onClick={(e) => {
                                                // Stop event from bubbling to parent containers
                                                e.stopPropagation();
                                                e.preventDefault();
                                                handleRollAttackAgainstPlayer(boss, attack, bossTargets[boss.id], e);
                                              }}
                                              disabled={!bossTargets[boss.id] || attackProcessing}
                                            >
                                              {attackProcessing ? 'Rolling...' : 'Roll'}
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
                                            <div className="attack-result-header">
                                              <div className="attack-result-message" dangerouslySetInnerHTML={{ __html: attackResult.message }} />
                                              <button 
                                                className="dismiss-attack-button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Remove from pending attacks
                                                  setPendingAttacks(prev => {
                                                    const newPending = { ...prev };
                                                    delete newPending[attackResult.id];
                                                    return newPending;
                                                  });
                                                }}
                                                title="Dismiss"
                                              >
                                                ×
                                              </button>
                                            </div>
                                            
                                            {/* Only show damage buttons for hits or save-based attacks */}
                                            {(attackResult.hitStatus !== 'miss' && attackResult.hitStatus !== 'critical-miss') && (
                                              <>
                                                {/* Multi-component damage controls */}
                                                {attackResult.damageComponents && attackResult.damageComponents.length > 1 ? (
                                                  <div className="damage-components-controls" style={{padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginTop: '10px'}}>
                                                    <div style={{marginBottom: '10px', fontWeight: 'bold'}}>Damage by Type (adjust for resistances/vulnerabilities):</div>
                                                    {attackResult.damageComponents.map((comp, idx) => {
                                                      const modifier = componentModifiers[attackResult.id]?.[idx] || 'full';
                                                      const adjustment = componentAdjustments[attackResult.id]?.[idx] || 0;
                                                      const targetChar = characters.find(c => c.id === attackResult.targetId);
                                                      
                                                      // Calculate preview damage
                                                      let previewDamage = comp.total;
                                                      if (modifier === 'double') previewDamage *= 2;
                                                      else if (modifier === 'half') previewDamage = Math.floor(previewDamage / 2);
                                                      else if (modifier === 'quarter') previewDamage = Math.floor(previewDamage / 4);
                                                      else if (modifier === 'none') previewDamage = 0;
                                                      previewDamage = Math.max(0, previewDamage + adjustment);
                                                      
                                                      return (
                                                        <div key={idx} style={{marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd'}}>
                                                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                                                            <span style={{fontWeight: 'bold', minWidth: '80px'}}>{comp.total} {comp.damageType}:</span>
                                                            {renderDefenseBadge(targetChar?.defenses, comp.damageType)}
                                                            <select
                                                              value={modifier}
                                                              onChange={(e) => {
                                                                setComponentModifiers(prev => ({
                                                                  ...prev,
                                                                  [attackResult.id]: {
                                                                    ...prev[attackResult.id],
                                                                    [idx]: e.target.value
                                                                  }
                                                                }));
                                                              }}
                                                              style={{padding: '4px', borderRadius: '4px'}}
                                                            >
                                                              <option value="full">Full</option>
                                                              <option value="half">Half (Resist)</option>
                                                              <option value="quarter">Quarter</option>
                                                              <option value="double">Double (Vuln)</option>
                                                              <option value="none">None (Immune)</option>
                                                            </select>
                                                            <div style={{display: 'flex', gap: '4px'}}>
                                                              <button
                                                                onClick={() => {
                                                                  setComponentAdjustments(prev => ({
                                                                    ...prev,
                                                                    [attackResult.id]: {
                                                                      ...prev[attackResult.id],
                                                                      [idx]: (prev[attackResult.id]?.[idx] || 0) - 1
                                                                    }
                                                                  }));
                                                                }}
                                                                style={{padding: '2px 6px', fontSize: '12px'}}
                                                              >
                                                                -1
                                                              </button>
                                                              <button
                                                                onClick={() => {
                                                                  setComponentAdjustments(prev => ({
                                                                    ...prev,
                                                                    [attackResult.id]: {
                                                                      ...prev[attackResult.id],
                                                                      [idx]: (prev[attackResult.id]?.[idx] || 0) + 1
                                                                    }
                                                                  }));
                                                                }}
                                                                style={{padding: '2px 6px', fontSize: '12px'}}
                                                              >
                                                                +1
                                                              </button>
                                                            </div>
                                                            <span style={{marginLeft: 'auto', fontWeight: 'bold', color: '#28a745'}}>
                                                              → {previewDamage}
                                                            </span>
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                    <button
                                                      className="damage-button full-damage"
                                                      onClick={() => handleApplyDamage(boss.id, attackResult.id, 'full')}
                                                      style={{marginTop: '10px', width: '100%'}}
                                                    >
                                                      Apply Damage
                                                    </button>
                                                  </div>
                                                ) : (
                                                  /* Single damage type - use simple buttons */
                                                  <div className="damage-modifier-controls">
                                                    {(() => {
                                                      const targetChar = characters.find(c => c.id === attackResult.targetId);
                                                      const dtKey = (attackResult.damageComponents && attackResult.damageComponents.length === 1)
                                                        ? attackResult.damageComponents[0]?.damageType
                                                        : attackResult.damageType;
                                                      if (!dtKey) return null;
                                                      return (
                                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                                                          <span style={{fontWeight: 600}}>Target Defense:</span>
                                                          {renderDefenseBadge(targetChar?.defenses, dtKey) || <span style={{fontSize: '0.9rem', color: '#718096'}}>None</span>}
                                                        </div>
                                                      );
                                                    })()}
                                                    {attackResult.hitStatus === 'save-pending' || attackResult.hitStatus === 'auto-save-pending' ? (
                                                      <>
                                                        <span className="save-result-label">Apply based on save result:</span>
                                                        <button 
                                                          className="damage-button full-damage"
                                                          onClick={() => handleApplyDamage(boss.id, attackResult.id, 'full')}
                                                          title="Apply full damage (failed save)"
                                                        >
                                                          Failed Save (Full)
                                                        </button>
                                                        <button 
                                                          className="damage-button half-damage"
                                                          onClick={() => handleApplyDamage(boss.id, attackResult.id, 'half')}
                                                          title="Apply half damage (passed save with half damage)"
                                                        >
                                                          Passed Save (Half)
                                                        </button>
                                                        <button 
                                                          className="damage-button no-damage"
                                                          onClick={() => handleApplyDamage(boss.id, attackResult.id, 'none')}
                                                          title="Apply no damage (passed save with no damage)"
                                                        >
                                                          Passed Save (None)
                                                        </button>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <button 
                                                          className="damage-button double-damage"
                                                          onClick={() => handleApplyDamage(boss.id, attackResult.id, 'double')}
                                                        >
                                                          Double
                                                        </button>
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
                                                      </>
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        ))}
                                      </li>
                                    );
                                  })}
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
                        ref={el => {
                          groupRefs.current[group.id] = { current: el };
                        }}
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
                            <span>{totalCurrentHP}/{totalOriginalMaxHP} (Total)</span>
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
                          <div className="entity-field">
                            <span>Damage:</span>
                            <span>
                              {group.damage 
                                ? `${group.damage.numDice}d${group.damage.diceType}+${group.damage.modifier} ${group.damage.damageType || 'slashing'}` 
                                : '1d8+2 slashing'}
                            </span>
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
                              <div>Total Damage: <span className="damage-value">{attackResult.totalDamage}</span> {attackResult.damageType || 'slashing'}</div>
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
                                    (result.isNatural20 ? 
                                      <>Crit! <span className="damage-value">{result.damage}</span></> : 
                                      <><span className="damage-value">{result.damage}</span></>
                                    ) : 
                                    'Miss'
                                  }
                                </div>
                              ))}
                            </div>
                            <div className="damage-modifier-buttons">
                              <button
                                className="damage-modifier-button"
                                onClick={(e) => handleApplyDamageGroup(e, group.id, 'double')}
                              >
                                Double Damage
                              </button>
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

      {/* Import/Export Modal */}
      <ImportExportModal 
        isOpen={isModalOpen} 
        onClose={toggleModal}
        initialMode="export"
      />
    </div>
  );
};

export default GroupsSection; 
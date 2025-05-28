import '../styles/BossTracker.css';

import { useEffect, useState } from 'react';

import useDnDStore from '../store/dndStore';

const BOSS_STORAGE_KEY = 'group-attack-calculator-bosses';

const BossTracker = () => {
  const {
    bosses,
    addBoss,
    removeBoss,
    updateBossHp,
    updateBoss,
    resetBossesHealth,
    clearAllBosses,
    addBossAttackResult,
    calculateHealthPercentage,
    getHealthColor,
    expandedSections,
    toggleSection,
    rollD20,
    rollDice,
    toggleBossSavingThrows,
    updateBossSavingThrow,
    toggleBossTemplateSavingThrows,
    targetEntity,
    scrollToDamageSection,
    setBossTarget,
    setBossAoeTarget,
    prepareBossAoeAttack,
    characters,
    applyDamageToCharacter
  } = useDnDStore();
  
  // Boss template
  const [bossTemplate, setBossTemplate] = useState({
    name: '',
    maxHp: 100,
    currentHp: 100,
    ac: 15,
    notes: '',
    attacks: [],
    savingThrows: {
      str: 0,
      dex: 0,
      con: 0,
      wis: 0,
      int: 0,
      cha: 0
    },
    showSavingThrows: false,
    initiative: 0
  });

  // Attack/spell template for bosses
  const [attackTemplate, setAttackTemplate] = useState({
    id: Date.now().toString(),
    name: '',
    type: 'melee',
    numDice: 2,
    diceType: 6,
    modifier: 3,
    hitBonus: 5,
    saveType: 'dex',
    saveDC: 13,
    halfOnSave: true,
    isAoE: false,
  });

  // State for showing/hiding notes and attacks
  const [showNotes, setShowNotes] = useState({});
  const [showAttacks, setShowAttacks] = useState({});

  // Add state for storing player targets for each boss
  const [bossTargets, setBossTargets] = useState({});

  // Add state for attack results with pending damage
  const [pendingAttacks, setPendingAttacks] = useState({});

  // Save bosses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(BOSS_STORAGE_KEY, JSON.stringify(bosses));
  }, [bosses]);

  // Handle changes to the boss template
  const handleBossTemplateChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ['maxHp', 'currentHp', 'ac', 'initiative'].includes(name) 
      ? parseInt(value) || 0
      : value;
    setBossTemplate(prev => ({ ...prev, [name]: parsedValue }));
  };

  // Handle changes to saving throws in template
  const handleSavingThrowChange = (ability, value) => {
    setBossTemplate(prev => ({
      ...prev,
      savingThrows: {
        ...prev.savingThrows,
        [ability]: parseInt(value) || 0
      }
    }));
  };

  // Handle changes to boss saving throws
  const handleBossSavingThrowChange = (bossId, ability, value) => {
    updateBossSavingThrow(bossId, ability, parseInt(value) || 0);
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

  // Add a new boss
  const handleAddBoss = () => {
    if (!bossTemplate.name || bossTemplate.maxHp <= 0 || bossTemplate.ac <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    addBoss({ ...bossTemplate, id: Date.now().toString(), currentHp: bossTemplate.maxHp });
    
    // Optionally reset form or clear some fields
    setBossTemplate(prev => ({
      ...prev,
      name: '',
      notes: '',
    }));
  };

  // Add attack to boss template
  const handleAddAttack = () => {
    if (!attackTemplate.name) {
      alert('Please enter an attack name');
      return;
    }
    
    const newAttack = { ...attackTemplate, id: Date.now().toString() };
    
    setBossTemplate(prev => ({
      ...prev,
      attacks: [...prev.attacks, newAttack]
    }));
    
    // Reset attack name but keep other values
    setAttackTemplate(prev => ({ 
      ...prev, 
      name: '',
      id: Date.now().toString()
    }));
  };

  // Remove attack from boss template
  const handleRemoveAttack = (attackId) => {
    setBossTemplate(prev => ({
      ...prev,
      attacks: prev.attacks.filter(attack => attack.id !== attackId)
    }));
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

  // Add function to handle boss target selection
  const handleBossTargetChange = (bossId, targetId) => {
    setBossTargets(prev => ({
      ...prev,
      [bossId]: targetId
    }));
  };

  // Add function to roll an attack against a targeted player
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

  // Render saving throws fields
  const renderSavingThrows = (savingThrows, onChange = null, bossId = null) => {
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
                  onChange(bossId, ability.key, e.target.value);
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

  return (
    <div className="boss-tracker">
      <div className="section-header">
        <h3>Boss Tracker</h3>
        <button
          className="toggle-section-button"
          onClick={() => toggleSection('bosses')}
        >
          {expandedSections.bosses ? 'Hide Bosses' : 'Show Bosses'}
        </button>
      </div>

      {expandedSections.bosses && (
        <>
          <div className="boss-controls">
            <button className="reset-boss-health" onClick={resetBossesHealth}>
              Reset Boss Health
            </button>
            <button className="clear-all-bosses" onClick={clearAllBosses}>
              Clear All Bosses
            </button>
          </div>

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
              <div className="boss-field">
                <label>Initiative:</label>
                <input
                  type="number"
                  name="initiative"
                  value={bossTemplate.initiative}
                  onChange={handleBossTemplateChange}
                  min="0"
                />
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
                onClick={() => toggleBossTemplateSavingThrows()}
              >
                <h5>Saving Throws {bossTemplate.showSavingThrows ? '▼' : '►'}</h5>
              </div>
              
              {bossTemplate.showSavingThrows && renderSavingThrows(bossTemplate.savingThrows)}
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
                  <label>Hit Bonus:</label>
                  <input
                    type="number"
                    name="hitBonus"
                    value={attackTemplate.hitBonus}
                    onChange={handleAttackTemplateChange}
                  />
                </div>
                <div className="attack-field dice-field">
                  <label>Damage:</label>
                  <div className="dice-inputs">
                    <input
                      type="number"
                      name="numDice"
                      value={attackTemplate.numDice}
                      onChange={handleAttackTemplateChange}
                      min="1"
                      className="num-dice"
                    />
                    <span>d</span>
                    <input
                      type="number"
                      name="diceType"
                      value={attackTemplate.diceType}
                      onChange={handleAttackTemplateChange}
                      min="1"
                      className="dice-type"
                    />
                    <span>+</span>
                    <input
                      type="number"
                      name="modifier"
                      value={attackTemplate.modifier}
                      onChange={handleAttackTemplateChange}
                      className="modifier"
                    />
                  </div>
                </div>
                <div className="attack-field">
                  <label>AoE:</label>
                  <input
                    type="checkbox"
                    name="isAoE"
                    checked={attackTemplate.isAoE}
                    onChange={handleAttackTemplateChange}
                  />
                </div>
                
                {attackTemplate.isAoE && (
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
                      <label>Half on Save:</label>
                      <input
                        type="checkbox"
                        name="halfOnSave"
                        checked={attackTemplate.halfOnSave}
                        onChange={handleAttackTemplateChange}
                      />
                    </div>
                  </>
                )}
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
                  {bossTemplate.attacks.map(attack => (
                    <li key={attack.id} className="template-attack-item">
                      <span className="attack-name">{attack.name}</span>
                      <span className="attack-details">
                        {attack.isAoE ? 'AoE - ' : ''}
                        {attack.numDice}d{attack.diceType}+{attack.modifier}
                        {!attack.isAoE && ` (${attack.hitBonus >= 0 ? '+' : ''}${attack.hitBonus} to hit)`}
                        {attack.isAoE && ` (DC ${attack.saveDC} ${attack.saveType.toUpperCase()}, ${attack.halfOnSave ? 'half' : 'no'} damage on save)`}
                      </span>
                      <button 
                        className="remove-attack-button"
                        onClick={() => handleRemoveAttack(attack.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
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

          <div className="bosses-list">
            {bosses.length > 0 ? (
              bosses.map(boss => {
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
                        onClick={() => setBossAoeTarget(boss.id, !boss.inAoe)}
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
              })
            ) : (
              <div className="no-bosses-message">
                <p>No bosses added yet. Add a boss above to get started.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BossTracker; 
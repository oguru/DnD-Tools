import '../styles/SwarmAttackCalculator.css';

import { useEffect, useState } from 'react';

const CHARACTERS_STORAGE_KEY = 'swarmAttackCharacters';

const SwarmAttackCalculator = () => {
  // Attack stats state - initialize with numbers for required fields, empty for optional
  const [attackStats, setAttackStats] = useState({
    numDice: 1,
    diceType: 8,
    modifier: '',
    hitBonus: ''
  });

  // Swarm state - track the swarm's properties
  const [swarm, setSwarm] = useState({
    totalCount: 20,
    hpPerEntity: 5,
    remainingEntities: 20,
    // Track entities with reduced HP (from partial damage)
    damagedEntities: []
  });

  // Track remaining available attacks
  const [availableAttacks, setAvailableAttacks] = useState(20);

  // Damage application state
  const [damageInput, setDamageInput] = useState({
    amount: '',
    isAoe: false,
    percentAffected: 50,
    spellSaveDc: '',
    spellSaveType: 'dex',
    halfOnSave: true
  });

  // Swarm spell save modifiers
  const [swarmSaves, setSwarmSaves] = useState({
    str: 0,
    dex: 0,
    con: 0,
    int: -4,
    wis: -2,
    cha: -4
  });

  // Player characters state - initialize with 5 empty character slots
  const [characters, setCharacters] = useState(() => {
    // Load characters from localStorage on initial render
    try {
      const savedCharacters = localStorage.getItem(CHARACTERS_STORAGE_KEY);
      if (savedCharacters) {
        const parsedCharacters = JSON.parse(savedCharacters);
        
        // Create an array with the saved names and ACs
        return Array(5).fill().map((_, index) => ({
          name: parsedCharacters[index]?.name || '',
          ac: parsedCharacters[index]?.ac || '',
          attacks: ''
        }));
      }
    } catch (error) {
      console.error('Error loading saved characters:', error);
    }
    
    // Default empty characters if no saved data or error
    return Array(5).fill().map(() => ({ name: '', ac: '', attacks: '' }));
  });

  // Results state
  const [attackRolls, setAttackRolls] = useState([]);
  const [results, setResults] = useState([]);

  // Save results state
  const [saveResults, setSaveResults] = useState(null);

  // Calculate total allocated attacks
  const calculateAllocatedAttacks = (chars) => {
    return chars.reduce((total, char) => {
      const attacks = parseInt(char.attacks) || 0;
      return total + attacks;
    }, 0);
  };

  // Effect to update available attacks when swarm count or character attacks change
  useEffect(() => {
    const allocatedAttacks = calculateAllocatedAttacks(characters);
    setAvailableAttacks(swarm.remainingEntities - allocatedAttacks);
  }, [swarm.remainingEntities, characters]);

  // Effect to validate and update character attacks when swarm count changes
  useEffect(() => {
    // Update character attacks if they exceed remaining entities
    const updatedCharacters = characters.map(char => {
      if (!char.attacks) return char;
      
      const attacks = parseInt(char.attacks);
      if (isNaN(attacks) || attacks <= swarm.remainingEntities) {
        return char;
      }
      
      return {
        ...char,
        attacks: swarm.remainingEntities.toString()
      };
    });
    
    // Only update if there were changes
    if (JSON.stringify(updatedCharacters) !== JSON.stringify(characters)) {
      setCharacters(updatedCharacters);
      saveToLocalStorage(updatedCharacters);
    }
  }, [swarm.remainingEntities]);

  // Handle attack stats changes
  const handleAttackStatsChange = (e) => {
    const { name, value } = e.target;
    setAttackStats({
      ...attackStats,
      [name]: value === '' ? '' : parseInt(value) || 0
    });
  };

  // Handle swarm state changes
  const handleSwarmChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseInt(value) || 0;
    
    if (name === 'totalCount') {
      setSwarm({
        ...swarm,
        [name]: numValue,
        remainingEntities: numValue
      });
    } else {
      setSwarm({
        ...swarm,
        [name]: numValue
      });
    }
  };

  // Handle damage input changes
  const handleDamageInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setDamageInput({
        ...damageInput,
        [name]: checked
      });
    } else if (name === 'percentAffected' || name === 'amount' || name === 'spellSaveDc') {
      setDamageInput({
        ...damageInput,
        [name]: value === '' ? '' : parseInt(value) || 0
      });
    } else {
      setDamageInput({
        ...damageInput,
        [name]: value
      });
    }
  };

  // Handle swarm saves changes
  const handleSwarmSavesChange = (e) => {
    const { name, value } = e.target;
    setSwarmSaves({
      ...swarmSaves,
      [name]: value === '' ? 0 : parseInt(value)
    });
  };

  // Save character data to localStorage
  const saveToLocalStorage = (updatedCharacters) => {
    const charactersToSave = updatedCharacters.map(char => ({
      name: char.name || '',
      ac: char.ac || ''
    }));
    
    localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(charactersToSave));
  };

  // Handle character stats changes
  const handleCharacterChange = (index, field, value) => {
    const updatedCharacters = [...characters];
    
    // If updating attacks, calculate the remaining available attacks
    if (field === 'attacks') {
      const currentValue = parseInt(updatedCharacters[index].attacks) || 0;
      const newValue = value === '' ? 0 : parseInt(value);
      
      // Calculate the difference in attacks
      const diff = newValue - currentValue;
      
      // Check if new value would exceed available attacks
      if (diff > availableAttacks) {
        // If exceeding, set to max available attacks
        value = (currentValue + availableAttacks).toString();
      }
      
      // If it's still over the remaining entities, cap it
      if (parseInt(value) > swarm.remainingEntities) {
        value = swarm.remainingEntities.toString();
      }
    }
    
    updatedCharacters[index] = {
      ...updatedCharacters[index],
      [field]: value
    };
    
    // Update state and save to localStorage in one go
    setCharacters(updatedCharacters);
    saveToLocalStorage(updatedCharacters);
    
    // If we have previous attack results and attackRolls stats, recalculate with new character data
    if (results.length > 0 && attackRolls.length > 0) {
      calculateResults(attackRolls[0], updatedCharacters);
    }
  };

  // Roll a d20
  const rollD20 = () => Math.floor(Math.random() * 20) + 1;

  // Roll damage based on attack stats
  const rollDamage = () => {
    const numDice = attackStats.numDice || 1;
    const diceType = attackStats.diceType || 6;
    const modifier = attackStats.modifier === '' ? 0 : parseInt(attackStats.modifier);
    
    let damage = 0;
    for (let i = 0; i < numDice; i++) {
      damage += Math.floor(Math.random() * diceType) + 1;
    }
    return damage + modifier;
  };

  // Roll a saving throw for the swarm
  const rollSavingThrow = (saveType) => {
    const baseRoll = rollD20();
    const modifier = swarmSaves[saveType];
    return {
      roll: baseRoll,
      modifier,
      total: baseRoll + modifier
    };
  };

  // Apply damage to the swarm (single target attack)
  const applyDamageToSwarm = () => {
    if (!damageInput.amount) return;
    
    let damage = parseInt(damageInput.amount);
    if (isNaN(damage) || damage <= 0) return;

    if (damageInput.isAoe) {
      applyAoeDamageToSwarm();
      return;
    }

    // Process regular (single target) damage
    const { remainingEntities, hpPerEntity, damagedEntities } = swarm;
    let newDamagedEntities = [...damagedEntities];
    let entitiesToRemove = 0;
    let remainingDamage = damage;

    // Process damaged entities first
    if (newDamagedEntities.length > 0) {
      // Sort damaged entities by HP (highest first)
      newDamagedEntities.sort((a, b) => b.hp - a.hp);
      
      while (newDamagedEntities.length > 0 && remainingDamage > 0) {
        const entity = newDamagedEntities[0];
        
        if (remainingDamage >= entity.hp) {
          // Entity is killed
          remainingDamage -= entity.hp;
          entitiesToRemove++;
          newDamagedEntities.shift();
        } else {
          // Entity is damaged but survives
          entity.hp -= remainingDamage;
          remainingDamage = 0;
        }
      }
    }

    // Process full-health entities
    const fullHealthEntitiesKilled = Math.floor(remainingDamage / hpPerEntity);
    const leftoverDamage = remainingDamage % hpPerEntity;
    
    entitiesToRemove += fullHealthEntitiesKilled;
    
    if (leftoverDamage > 0 && (remainingEntities - entitiesToRemove) > 0) {
      // Add partially damaged entity
      newDamagedEntities.push({
        hp: hpPerEntity - leftoverDamage
      });
    }

    // Update swarm state
    setSwarm({
      ...swarm,
      remainingEntities: Math.max(0, remainingEntities - entitiesToRemove),
      damagedEntities: newDamagedEntities
    });
    
    // Clear damage input after processing
    setDamageInput({
      ...damageInput,
      amount: ''
    });
  };

  // Apply AoE damage to swarm
  const applyAoeDamageToSwarm = () => {
    if (!damageInput.amount) return;
    
    let damage = parseInt(damageInput.amount);
    if (isNaN(damage) || damage <= 0) return;

    const { remainingEntities, hpPerEntity, damagedEntities } = swarm;
    const percentAffected = damageInput.percentAffected / 100;
    
    // Calculate number of entities affected (rounded down)
    const entitiesAffected = Math.floor(remainingEntities * percentAffected);
    if (entitiesAffected <= 0) return;

    // Create array of all entities (damaged + full health)
    let allEntities = [
      ...damagedEntities.map(entity => ({ ...entity })),
      ...Array(remainingEntities - damagedEntities.length).fill().map(() => ({ hp: hpPerEntity }))
    ];
    
    // Randomly select entities to be affected (instead of sorting by HP)
    const shuffledEntities = [...allEntities];
    for (let i = shuffledEntities.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledEntities[i], shuffledEntities[j]] = [shuffledEntities[j], shuffledEntities[i]];
    }
    
    const affectedEntities = shuffledEntities.slice(0, entitiesAffected);
    const unaffectedEntities = shuffledEntities.slice(entitiesAffected);
    
    let entitiesToRemove = 0;
    let newDamagedEntities = [];
    let savingThrowResults = {
      success: 0,
      fail: 0,
      total: 0,
      dcUsed: damageInput.spellSaveDc || 0,
      saveType: damageInput.spellSaveType,
      halfOnSave: damageInput.halfOnSave
    };

    // Process each affected entity with individual saving throws
    affectedEntities.forEach(entity => {
      let actualDamage = damage;
      
      // Roll save if DC is provided
      if (damageInput.spellSaveDc) {
        savingThrowResults.total++;
        
        const saveResult = rollSavingThrow(damageInput.spellSaveType);
        const saveSucceeded = saveResult.total >= damageInput.spellSaveDc;
        
        if (saveSucceeded) {
          savingThrowResults.success++;
          if (damageInput.halfOnSave) {
            actualDamage = Math.floor(damage / 2);
          } else {
            actualDamage = 0; // No damage on successful save if not "half on save"
          }
        } else {
          savingThrowResults.fail++;
        }
      }
      
      if (actualDamage >= entity.hp) {
        // Entity is killed
        entitiesToRemove++;
      } else if (actualDamage > 0) {
        // Entity is damaged but survives
        newDamagedEntities.push({
          hp: entity.hp - actualDamage
        });
      } else {
        // Entity takes no damage (successful save with no half damage)
        newDamagedEntities.push(entity);
      }
    });

    // Add unaffected entities back to the list
    newDamagedEntities = [
      ...newDamagedEntities,
      ...unaffectedEntities.filter(e => e.hp < hpPerEntity)
    ];

    // Calculate total remaining entities
    const newRemainingEntities = Math.max(0, remainingEntities - entitiesToRemove);
    
    // Update swarm state
    setSwarm({
      ...swarm,
      remainingEntities: newRemainingEntities,
      damagedEntities: newDamagedEntities
    });
    
    // Update save results if a DC was used
    if (damageInput.spellSaveDc) {
      setSaveResults(savingThrowResults);
    } else {
      setSaveResults(null);
    }
    
    // Clear damage input after processing
    setDamageInput({
      ...damageInput,
      amount: ''
    });
  };

  // Generate attack rolls once and store them
  const generateAttackRolls = () => {
    // Get valid characters (with name, AC, and attacks)
    const validCharacters = characters.filter(c => c.name && c.ac && c.attacks);
    
    if (validCharacters.length === 0) {
      setResults([]);
      return;
    }
    
    const newResults = [];
    
    // For each valid character, generate unique attack rolls
    validCharacters.forEach(character => {
      const ac = parseInt(character.ac);
      const numAttacks = parseInt(character.attacks) || 0;
      
      if (numAttacks <= 0) {
        return; // Skip if no attacks
      }
      
      // Generate unique rolls for this character
      const characterRolls = [];
      let totalDamage = 0;
      let hitsCount = 0;
      
      // Generate each attack roll separately
      for (let i = 0; i < numAttacks; i++) {
        const roll = rollD20();
        const hitBonus = attackStats.hitBonus === '' ? 0 : parseInt(attackStats.hitBonus);
        const totalRoll = roll + hitBonus;
        const damage = rollDamage();
        const hit = totalRoll >= ac;
        
        if (hit) {
          totalDamage += damage;
          hitsCount++;
        }
        
        characterRolls.push({
          roll,
          hitBonus,
          totalRoll,
          damage,
          hit
        });
      }
      
      newResults.push({
        character: character.name,
        ac,
        attackRolls: characterRolls,
        hitsCount,
        totalDamage
      });
    });
    
    // Set the results directly - no need for separate attackRolls state
    setResults(newResults);
    
    // Keep track of the attack stats used for these rolls (for tooltips)
    setAttackRolls([{
      numDice: attackStats.numDice,
      diceType: attackStats.diceType,
      modifier: attackStats.modifier,
      hitBonus: attackStats.hitBonus
    }]);
  };

  // Calculate results based on current ACs and stored rolls
  // This function is no longer needed as we generate results directly
  // but we'll keep a simplified version in case we need to recalculate
  const calculateResults = (attackStatsUsed, chars) => {
    // Get valid characters (with name, AC, and attacks)
    const validCharacters = chars.filter(c => c.name && c.ac && c.attacks);
    
    if (validCharacters.length === 0) {
      setResults([]);
      return;
    }
    
    const newResults = [];
    
    // For each valid character, generate unique attack rolls
    validCharacters.forEach(character => {
      const ac = parseInt(character.ac);
      const numAttacks = parseInt(character.attacks) || 0;
      
      if (numAttacks <= 0) {
        return; // Skip if no attacks
      }
      
      // Generate unique rolls for this character
      const characterRolls = [];
      let totalDamage = 0;
      let hitsCount = 0;
      
      // Generate each attack roll separately
      for (let i = 0; i < numAttacks; i++) {
        const roll = rollD20();
        const hitBonus = attackStatsUsed.hitBonus === '' ? 0 : parseInt(attackStatsUsed.hitBonus);
        const totalRoll = roll + hitBonus;
        const damage = rollDamage();
        const hit = totalRoll >= ac;
        
        if (hit) {
          totalDamage += damage;
          hitsCount++;
        }
        
        characterRolls.push({
          roll,
          hitBonus,
          totalRoll,
          damage,
          hit
        });
      }
      
      newResults.push({
        character: character.name,
        ac,
        attackRolls: characterRolls,
        hitsCount,
        totalDamage
      });
    });
    
    setResults(newResults);
  };

  // Clear all character data
  const clearCharacterData = () => {
    const emptyCharacters = Array(5).fill().map(() => ({ name: '', ac: '', attacks: '' }));
    setCharacters(emptyCharacters);
    setResults([]);
    setAttackRolls([]);
    localStorage.removeItem(CHARACTERS_STORAGE_KEY);
  };

  // Reset swarm to initial state
  const resetSwarm = () => {
    const totalCount = swarm.totalCount;
    setSwarm({
      ...swarm,
      remainingEntities: totalCount,
      damagedEntities: []
    });
    setSaveResults(null);
  };

  return (
    <div className="swarm-attack-calculator">
      <h2>Swarm Attack Calculator</h2>
      
      {/* Reorganized layout - group swarm management together */}
      <div className="swarm-management-container">
        <div className="swarm-stats-section">
          <h3>Swarm Stats</h3>
          <div className="swarm-stats-grid">
            <div className="swarm-stat">
              <label htmlFor="totalCount">Total Swarm Size:</label>
              <input
                type="number"
                id="totalCount"
                name="totalCount"
                value={swarm.totalCount}
                onChange={handleSwarmChange}
                min="1"
              />
            </div>
            
            <div className="swarm-stat">
              <label htmlFor="hpPerEntity">HP per Entity:</label>
              <input
                type="number"
                id="hpPerEntity"
                name="hpPerEntity"
                value={swarm.hpPerEntity}
                onChange={handleSwarmChange}
                min="1"
              />
            </div>
            
            <div className="swarm-status">
              <span><strong>Remaining:</strong> {swarm.remainingEntities} of {swarm.totalCount}</span>
              <button className="reset-swarm-button" onClick={resetSwarm}>
                Reset Swarm
              </button>
            </div>
          </div>
        </div>
        
        <div className="swarm-saves-section">
          <h3>Swarm Saving Throws</h3>
          <div className="swarm-saves-grid">
            <div className="swarm-save">
              <label htmlFor="str">STR:</label>
              <input
                type="number"
                id="str"
                name="str"
                value={swarmSaves.str}
                onChange={handleSwarmSavesChange}
              />
            </div>
            
            <div className="swarm-save">
              <label htmlFor="dex">DEX:</label>
              <input
                type="number"
                id="dex"
                name="dex"
                value={swarmSaves.dex}
                onChange={handleSwarmSavesChange}
              />
            </div>
            
            <div className="swarm-save">
              <label htmlFor="con">CON:</label>
              <input
                type="number"
                id="con"
                name="con"
                value={swarmSaves.con}
                onChange={handleSwarmSavesChange}
              />
            </div>
            
            <div className="swarm-save">
              <label htmlFor="int">INT:</label>
              <input
                type="number"
                id="int"
                name="int"
                value={swarmSaves.int}
                onChange={handleSwarmSavesChange}
              />
            </div>
            
            <div className="swarm-save">
              <label htmlFor="wis">WIS:</label>
              <input
                type="number"
                id="wis"
                name="wis"
                value={swarmSaves.wis}
                onChange={handleSwarmSavesChange}
              />
            </div>
            
            <div className="swarm-save">
              <label htmlFor="cha">CHA:</label>
              <input
                type="number"
                id="cha"
                name="cha"
                value={swarmSaves.cha}
                onChange={handleSwarmSavesChange}
              />
            </div>
          </div>
        </div>
        
        <div className="damage-application-section">
          <h3>Apply Damage to Swarm</h3>
          <div className="damage-application-grid">
            <div className="damage-input">
              <label htmlFor="damageAmount">Damage Amount:</label>
              <input
                type="number"
                id="damageAmount"
                name="amount"
                value={damageInput.amount}
                onChange={handleDamageInputChange}
                min="0"
              />
            </div>
            
            <div className="damage-type">
              <label>
                <input
                  type="checkbox"
                  name="isAoe"
                  checked={damageInput.isAoe}
                  onChange={handleDamageInputChange}
                />
                AoE Attack
              </label>
            </div>
            
            {damageInput.isAoe && (
              <>
                <div className="percent-affected">
                  <label htmlFor="percentAffected">% Affected:</label>
                  <input
                    type="number"
                    id="percentAffected"
                    name="percentAffected"
                    value={damageInput.percentAffected}
                    onChange={handleDamageInputChange}
                    min="1"
                    max="100"
                  />
                </div>
                
                <div className="spell-save">
                  <label htmlFor="spellSaveDc">Spell Save DC:</label>
                  <input
                    type="number"
                    id="spellSaveDc"
                    name="spellSaveDc"
                    value={damageInput.spellSaveDc}
                    onChange={handleDamageInputChange}
                    placeholder="Optional"
                  />
                </div>
                
                {damageInput.spellSaveDc && (
                  <>
                    <div className="save-type">
                      <label htmlFor="spellSaveType">Save Type:</label>
                      <select
                        id="spellSaveType"
                        name="spellSaveType"
                        value={damageInput.spellSaveType}
                        onChange={handleDamageInputChange}
                      >
                        <option value="str">STR</option>
                        <option value="dex">DEX</option>
                        <option value="con">CON</option>
                        <option value="int">INT</option>
                        <option value="wis">WIS</option>
                        <option value="cha">CHA</option>
                      </select>
                    </div>
                    
                    <div className="half-on-save">
                      <label>
                        <input
                          type="checkbox"
                          name="halfOnSave"
                          checked={damageInput.halfOnSave}
                          onChange={handleDamageInputChange}
                        />
                        Half Damage on Save
                      </label>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          
          <button 
            className="apply-damage-button" 
            onClick={applyDamageToSwarm}
            disabled={!damageInput.amount || swarm.remainingEntities === 0}
          >
            {damageInput.isAoe ? "Cast AoE Spell" : "Attack Swarm"}
          </button>
          
          {/* Display save results */}
          {saveResults && (
            <div className="save-results">
              <div className="save-results-header">
                Saving Throw Results ({saveResults.saveType.toUpperCase()} DC {saveResults.dcUsed})
              </div>
              <div className="save-results-summary">
                <div className="save-success">
                  <span className="save-label">Success:</span> 
                  <span className="save-count">{saveResults.success}</span>
                </div>
                <div className="save-fail">
                  <span className="save-label">Failed:</span> 
                  <span className="save-count">{saveResults.fail}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Show swarm health status immediately after damage application */}
        {swarm.damagedEntities.length > 0 && (
          <div className="swarm-health-section">
            <h3>Swarm Health Status</h3>
            <div className="swarm-health-summary">
              <div><strong>Full Health:</strong> {swarm.remainingEntities - swarm.damagedEntities.length}</div>
              <div><strong>Damaged:</strong> {swarm.damagedEntities.length}</div>
            </div>
            <div className="damaged-entities-table">
              <h4>Damaged Entities HP</h4>
              <div className="damaged-entities-grid">
                {swarm.damagedEntities.slice(0, 30).map((entity, index) => (
                  <div key={index} className="damaged-entity">
                    {entity.hp}/{swarm.hpPerEntity}
                  </div>
                ))}
                {swarm.damagedEntities.length > 30 && (
                  <div className="more-entities">
                    +{swarm.damagedEntities.length - 30} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="attack-stats-section">
        <h3>Attack Stats</h3>
        <div className="attack-stats-grid">
          <div className="attack-stat">
            <label htmlFor="numDice">Number of Dice:</label>
            <input
              type="number"
              id="numDice"
              name="numDice"
              value={attackStats.numDice}
              onChange={handleAttackStatsChange}
              min="1"
            />
          </div>
          
          <div className="attack-stat">
            <label htmlFor="diceType">Dice Type (d?):</label>
            <input
              type="number"
              id="diceType"
              name="diceType"
              value={attackStats.diceType}
              onChange={handleAttackStatsChange}
              min="1"
            />
          </div>
          
          <div className="attack-stat">
            <label htmlFor="modifier">Damage Modifier:</label>
            <input
              type="number"
              id="modifier"
              name="modifier"
              value={attackStats.modifier}
              onChange={handleAttackStatsChange}
              placeholder="0"
            />
          </div>
          
          <div className="attack-stat">
            <label htmlFor="hitBonus">To Hit Bonus:</label>
            <input
              type="number"
              id="hitBonus"
              name="hitBonus"
              value={attackStats.hitBonus}
              onChange={handleAttackStatsChange}
              placeholder="0"
            />
          </div>
        </div>
        
        <div className="damage-preview">
          Attack Damage: {attackStats.numDice}d{attackStats.diceType}{attackStats.modifier ? ` + ${attackStats.modifier}` : ''}
        </div>
        <div className="hit-preview">
          To Hit: d20{attackStats.hitBonus ? ` + ${attackStats.hitBonus}` : ''}
        </div>
      </div>
      
      <div className="characters-section">
        <div className="characters-header-row">
          <h3>Characters</h3>
          <div className="available-attacks-counter">
            Available Attacks: <span className={availableAttacks > 0 ? "attacks-available" : "no-attacks-available"}>{availableAttacks}</span>
          </div>
          <button 
            className="clear-characters-button" 
            onClick={clearCharacterData}
            title="Clear all character data"
          >
            Clear All
          </button>
        </div>
        
        <div className="characters-table">
          <div className="characters-header">
            <div className="character-field">Name</div>
            <div className="character-field">AC</div>
            <div className="character-field">Attacks</div>
          </div>
          
          {characters.map((character, index) => (
            <div key={index} className="character-row">
              <div className="character-field">
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                  placeholder="Character Name"
                />
              </div>
              
              <div className="character-field">
                <input
                  type="number"
                  value={character.ac}
                  onChange={(e) => handleCharacterChange(index, 'ac', e.target.value)}
                  placeholder="AC"
                  min="1"
                />
              </div>
              
              <div className="character-field attack-field">
                <input
                  type="number"
                  value={character.attacks}
                  onChange={(e) => handleCharacterChange(index, 'attacks', e.target.value)}
                  placeholder="# of Attacks"
                  min="0"
                  max={parseInt(character.attacks) + availableAttacks}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="calculate-button-container">
        <button 
          className="calculate-button" 
          onClick={generateAttackRolls}
          disabled={swarm.remainingEntities === 0}
        >
          Roll Attacks
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="results-section">
          <h3>Attack Results</h3>
          
          {results.map((result, index) => (
            <div key={index} className="character-result">
              <h4>{result.character} (AC {result.ac})</h4>
              <div className="result-summary">
                <div><strong>{result.hitsCount} hits</strong> out of {result.attackRolls.length} attacks</div>
                <div><strong>Total Damage: {result.totalDamage}dmg</strong></div>
              </div>
              <div className="attack-rolls-compact">
                {result.attackRolls.map((roll, rollIndex) => (
                  <div 
                    key={rollIndex} 
                    className={`attack-roll ${roll.hit ? 'hit' : 'miss'}`}
                    title={roll.hit ? `Hit: ${roll.roll} + ${attackStats.hitBonus === '' ? 0 : attackStats.hitBonus} = ${roll.totalRoll}, ${roll.damage}dmg` : `Miss: ${roll.roll} + ${attackStats.hitBonus === '' ? 0 : attackStats.hitBonus} = ${roll.totalRoll}`}
                  >
                    {roll.hit ? `${roll.damage}dmg (${roll.totalRoll})` : `(${roll.totalRoll})`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwarmAttackCalculator; 
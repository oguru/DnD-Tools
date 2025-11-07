import '../styles/CharacterSection.css';

import React, { useEffect, useRef, useState } from 'react';

import ImportExportModal from './ImportExportModal';
import { toggleExclusiveDefense } from '../store/utils/defense';
import { useCharactersSectionState } from '../store/hooks/useCharacters';

// Damage types and icons for defenses (same as boss system)
const DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'thunder', 
  'acid', 'poison', 'psychic', 'necrotic', 'radiant', 'force'
];

const DAMAGE_TYPE_ICONS = {
  slashing: '🗡️',
  piercing: '🏹', 
  bludgeoning: '🔨',
  fire: '🔥',
  cold: '❄️',
  lightning: '⚡',
  thunder: '💥',
  acid: '🧪',
  poison: '☠️',
  psychic: '🧠',
  necrotic: '💀',
  radiant: '✨',
  force: '🌟'
};

const CharacterSection = () => {
  const {
    characters,
    updateCharacter,
    removeCharacter,
    expandedSections,
    toggleSection,
    addCharacter,
    resetCharacters,
    clearTemporaryHitPoints,
    calculateHealthPercentage,
    getHealthColour,
    setTargetEntity,
    targetEntity,
    scrollToDamageSection,
    toggleCharacterAoeTarget,
    setCharactersSectionRef,
    registerEntityRef
  } = useCharactersSectionState();

  // Local state to track if we want to show empty slot
  const [showEmptySlot, setShowEmptySlot] = useState(true);
  
  // State for import/export modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Ref for the character section
  const sectionRef = useRef(null);
  
  // Refs for individual characters
  const characterRefs = useRef({});

  // Register section ref with store (only once on mount)
  useEffect(() => {
    if (sectionRef.current) {
      setCharactersSectionRef(sectionRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Register refs for individual characters (only when characters array changes)
  useEffect(() => {
    characters.forEach(character => {
      if (character.id && characterRefs.current[character.id] && !character.id.startsWith("empty-")) {
        registerEntityRef('character', character.id, characterRefs.current[character.id]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters]);

  // On mount or when characters change, check if we should show empty slot
  useEffect(() => {
    // If there are no characters, always show empty slot
    if (characters.length === 0) {
      setShowEmptySlot(true);
      return;
    }
    
    // If the last character has a name, show an empty slot
    const lastCharacter = characters[characters.length - 1];
    if (lastCharacter && lastCharacter.name) {
      setShowEmptySlot(true);
    } else {
      setShowEmptySlot(false);
    }
  }, [characters]);

  // Toggle import/export modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Handle changes to character fields
  const handleCharacterChange = (charId, field, value) => {
    // Parse number fields
    if (field === 'maxHp' || field === 'currentHp' || field === 'ac') {
      const numValue = parseInt(value) || 0;
      
      // If updating maxHp and it's less than currentHp, adjust currentHp
      if (field === 'maxHp') {
        const character = characters.find(c => c.id === charId);
        if (character && numValue < character.currentHp) {
          updateCharacter(charId, 'currentHp', numValue);
        }
      }
      
      updateCharacter(charId, field, numValue);
    } else {
      updateCharacter(charId, field, value);
    }
    
    // If this is the empty slot and user added a name, show a new empty slot
    if (field === 'name' && value && showEmptySlot) {
      const lastCharacter = characters[characters.length - 1];
      if (lastCharacter && lastCharacter.id === charId) {
        setShowEmptySlot(true);
      }
    }
  };

  // Character defense state - only one can be open at a time
  const [characterDefenseMenus, setCharacterDefenseMenus] = useState({});

  // Toggle defense editor with exclusive behavior
  const toggleDefenseEditor = (charId) => {
    const key = `${charId}-editor`;
    setCharacterDefenseMenus(prev => {
      const isCurrentlyOpen = prev[key];
      
      if (isCurrentlyOpen) {
        // Close the current editor
        return { ...prev, [key]: false };
      } else {
        // Close all other editors and open this one
        const newState = {};
        Object.keys(prev).forEach(k => {
          newState[k] = false;
        });
        newState[key] = true;
        return newState;
      }
    });
  };

  // Close defense editors when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if any defense editor is open
      const hasOpenEditor = Object.values(characterDefenseMenus).some(isOpen => isOpen);
      if (!hasOpenEditor) return;

      // Check if the click was outside all defense sections
      const defensesSections = document.querySelectorAll('.defenses-section');
      let clickedInside = false;
      
      defensesSections.forEach(section => {
        if (section.contains(event.target)) {
          clickedInside = true;
        }
      });

      if (!clickedInside) {
        // Close all defense editors
        setCharacterDefenseMenus(prev => {
          const newState = {};
          Object.keys(prev).forEach(k => {
            newState[k] = false;
          });
          return newState;
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [characterDefenseMenus]);

  // Toggle character defense with exclusive logic (same as boss system)
  const handleToggleDefense = (charId, category, damageType) => {
    const character = characters.find(c => c.id === charId);
    if (!character) return;

    const updatedDefenses = toggleExclusiveDefense(character.defenses, category, damageType);
    updateCharacter(charId, 'defenses', updatedDefenses);
  };
  
  // Handle removing a character
  const handleRemoveCharacter = (charId) => {
    removeCharacter(charId);
  };

  // Handle toggling a character for AoE
  const handleToggleCharacterAoe = (e, charId) => {
    e.stopPropagation(); // Prevent targeting
    toggleCharacterAoeTarget(charId);
  };

  // Get the first available empty slot index (1-6)
  const getEmptySlotIndex = () => {
    const existingIndexes = characters
      .filter(c => c.name)
      .map(c => parseInt(c.name.match(/Player (\d+)/)?.[1] || 0))
      .filter(n => !isNaN(n));
    
    for (let i = 1; i <= 6; i++) {
      if (!existingIndexes.includes(i)) {
        return i;
      }
    }
    return characters.length + 1;
  };

  // Add a new character with a default name
  const handleAddNewCharacter = () => {
    const index = getEmptySlotIndex();
    addCharacter({
      name: `Player ${index}`,
      maxHp: 50,
      currentHp: 50,
      tempHp: 0,
      ac: 15
    });
  };

  // Set a character as the target
  const handleSetCharacterAsTarget = (character) => {
    const isTargeted = targetEntity && 
                      targetEntity.type === 'character' && 
                      targetEntity.id === character.id;
                      
    if (isTargeted) {
      // If already targeted, just scroll to damage section
      scrollToDamageSection();
    } else {
      // Target this character and scroll
      setTargetEntity({ type: 'character', id: character.id });
    }
  };

  // Display the characters that should be visible
  // - All characters (not just named ones)
  // - One empty slot if showEmptySlot is true
  const visibleCharacters = () => {
    // Include all characters, even those without names
    const allCharacters = [...characters];
    
    // If we should show an empty slot and there isn't already one
    if (showEmptySlot && !characters.some(char => !char.name)) {
      // Add empty character
      const emptyChar = {
        id: `empty-${Date.now()}`, // Ensure unique key
        name: '',
        maxHp: 0,
        currentHp: 0,
        tempHp: 0,
        ac: 0
      };
      return [...allCharacters, emptyChar];
    }
    
    return allCharacters;
  };

  return (
    <div className="character-section" ref={sectionRef}>
      <div className="section-header">
        <h3>Player Characters</h3>
        <div className="character-buttons">
          <button
            className="btn import-export-button"
            onClick={toggleModal}
            title="Import/Export Data"
          >
            Import/Export
          </button>
          <button
            className="btn toggle-section-button"
            onClick={() => toggleSection('characters')}
          >
            {expandedSections.characters ? 'Hide Characters' : 'Show Characters'}
          </button>
          {characters.length > 0 && (
            <>
              <button
                className="btn reset-characters-button"
                onClick={resetCharacters}
                title="Reset all character HP to max"
              >
                Reset HP
              </button>
              <button
                className="btn clear-temp-hp-button"
                onClick={clearTemporaryHitPoints}
                title="Clear all temporary hit points"
              >
                Clear Temp HP
              </button>
            </>
          )}
        </div>
      </div>
      
      {expandedSections.characters && (
        <>
          <div className="characters-table">
            <div className="characters-header">
              <div>Name</div>
              <div>HP</div>
              <div>Temp HP</div>
              <div>Max HP</div>
              <div>AC</div>
              <div>Initiative</div>
              <div>Health</div>
              <div>Actions</div>
            </div>
            
            {visibleCharacters().map((character) => {
              const isEmpty = character.id.startsWith("empty-"); // Only consider placeholder slots as empty
              const healthPercentage = calculateHealthPercentage(character.currentHp, character.maxHp);
              const healthColor = getHealthColour(healthPercentage);
              const isTargeted = targetEntity && 
                                 targetEntity.type === 'character' && 
                                 targetEntity.id === character.id;
              
              return (
                <div 
                  key={character.id} 
                  className={`character-row ${isEmpty ? 'empty-character' : ''} ${isTargeted ? 'targeted' : ''} ${character.inAoe ? 'in-aoe' : ''}`}
                  ref={el => {
                    if (!isEmpty) {
                      characterRefs.current[character.id] = { current: el };
                    }
                  }}
                >
                  <div className="character-field">
                    <input
                      type="text"
                      value={character.name}
                      onChange={(e) => handleCharacterChange(character.id, 'name', e.target.value)}
                      placeholder="Character Name"
                      className={isEmpty ? 'empty-field' : ''}
                    />
                  </div>
                  <div className="character-field">
                    <input
                      type="number"
                      value={character.currentHp || ''}
                      onChange={(e) => handleCharacterChange(character.id, 'currentHp', e.target.value)}
                      min="0"
                      max={character.maxHp}
                      placeholder="HP"
                      className={isEmpty ? 'empty-field' : ''}
                    />
                  </div>
                  <div className="character-field">
                    <input
                      type="number"
                      value={character.tempHp || ''}
                      onChange={(e) => handleCharacterChange(character.id, 'tempHp', e.target.value)}
                      min="0"
                      placeholder="Temp"
                      className={isEmpty ? 'empty-field' : ''}
                    />
                  </div>
                  <div className="character-field">
                    <input
                      type="number"
                      value={character.maxHp || ''}
                      onChange={(e) => handleCharacterChange(character.id, 'maxHp', e.target.value)}
                      min="0"
                      placeholder="Max"
                      className={isEmpty ? 'empty-field' : ''}
                    />
                  </div>
                  <div className="character-field">
                    <input
                      type="number"
                      value={character.ac || ''}
                      onChange={(e) => handleCharacterChange(character.id, 'ac', e.target.value)}
                      min="0"
                      placeholder="AC"
                      className={isEmpty ? 'empty-field' : ''}
                    />
                  </div>
                  <div className="character-field">
                    <input
                      type="number"
                      value={character.initiative || ''}
                      onChange={(e) => handleCharacterChange(character.id, 'initiative', e.target.value)}
                      min="0"
                      placeholder="Init"
                      className={isEmpty ? 'empty-field' : ''}
                    />
                  </div>
                  <div className="character-health-bar-container">
                    {!isEmpty && character.maxHp > 0 && (
                      <div 
                        className="character-health-bar"
                        style={{
                          width: `${healthPercentage}%`,
                          backgroundColor: healthColor
                        }}
                      ></div>
                    )}
                  </div>
                  <div className="character-actions">
                    {!isEmpty && (
                      <>
                        {isTargeted ? (
                          <div className="target-buttons-container">
                            <button
                              className="btn cancel-target-button"
                              onClick={() => setTargetEntity(null)}
                              title="Cancel targeting"
                            >
                              ×
                            </button>
                            <button
                              className="btn scroll-to-damage-button"
                              onClick={() => scrollToDamageSection()}
                              title="Scroll to damage section"
                            >
                              ↓
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn target-button"
                            onClick={() => handleSetCharacterAsTarget(character)}
                            title="Set as target"
                          >
                            Target
                          </button>
                        )}
                        <button 
                          className={`btn aoe-button ${character.inAoe ? 'active' : ''}`}
                          onClick={(e) => handleToggleCharacterAoe(e, character.id)}
                          title={character.inAoe ? "Remove from AoE" : "Add to AoE"}
                        >
                          {character.inAoe ? "-AOE" : "+AOE"}
                        </button>
                        <button
                          className="btn remove-character-button"
                          onClick={() => handleRemoveCharacter(character.id)}
                          title="Remove Character"
                        >
                          ×
                        </button>
                      </>
                    )}
                    {isEmpty && (
                      <button
                        className="btn add-character-button"
                        onClick={handleAddNewCharacter}
                        title="Add New Character"
                      >
                        Add
                      </button>
                    )}
                  </div>
                  
                  {/* Character defenses row for non-empty characters */}
                  {!isEmpty && (
                    <div className="character-defenses-row">
                      <div className="defenses-section">
                        {/* Inline defenses display with headers */}
                        <div className="defenses-inline">
                          <div className="defense-content">
                            <div className="defense-group">
                              <button
                                type="button"
                                className="defense-header-button resistance"
                                onClick={() => toggleDefenseEditor(character.id)}
                                title="Edit defenses"
                              >
                                RES
                              </button>
                              <div className="defense-chips-inline">
                                {(character.defenses?.resistances || []).map(type => (
                                  <span
                                    key={`res-${type}`}
                                    className="defense-chip resistance"
                                    title={`Resistance: ${type}`}
                                  >
                                    {DAMAGE_TYPE_ICONS[type] || type.slice(0, 3)}
                                  </span>
                                ))}
                                {(character.defenses?.resistances || []).length === 0 && (
                                  <span className="no-defenses">—</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="defense-group">
                              <button
                                type="button"
                                className="defense-header-button vulnerability"
                                onClick={() => toggleDefenseEditor(character.id)}
                                title="Edit defenses"
                              >
                                VULN
                              </button>
                              <div className="defense-chips-inline">
                                {(character.defenses?.vulnerabilities || []).map(type => (
                                  <span
                                    key={`vuln-${type}`}
                                    className="defense-chip vulnerability"
                                    title={`Vulnerability: ${type}`}
                                  >
                                    {DAMAGE_TYPE_ICONS[type] || type.slice(0, 3)}
                                  </span>
                                ))}
                                {(character.defenses?.vulnerabilities || []).length === 0 && (
                                  <span className="no-defenses">—</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="defense-group">
                              <button
                                type="button"
                                className="defense-header-button immunity"
                                onClick={() => toggleDefenseEditor(character.id)}
                                title="Edit defenses"
                              >
                                IMM
                              </button>
                              <div className="defense-chips-inline">
                                {(character.defenses?.immunities || []).map(type => (
                                  <span
                                    key={`imm-${type}`}
                                    className="defense-chip immunity"
                                    title={`Immunity: ${type}`}
                                  >
                                    {DAMAGE_TYPE_ICONS[type] || type.slice(0, 3)}
                                  </span>
                                ))}
                                {(character.defenses?.immunities || []).length === 0 && (
                                  <span className="no-defenses">—</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            className="defenses-toggle-button"
                            onClick={() => toggleDefenseEditor(character.id)}
                            title="Toggle defenses editor"
                          >
                            <span className="chevron">
                              {characterDefenseMenus[`${character.id}-editor`] ? '▲' : '▼'}
                            </span>
                          </button>
                        </div>
                        
                        {/* Defenses editor */}
                        {characterDefenseMenus[`${character.id}-editor`] && (
                          <div className="defenses-editor">
                            <div className="defense-category-header">
                              <span>Resistances</span>
                            </div>
                            <div className="defense-grid">
                              {DAMAGE_TYPES.map(type => {
                                const selected = (character.defenses?.resistances || []).includes(type);
                                return (
                                  <div
                                    key={`res-${type}`}
                                    className={`defense-chip ${selected ? 'selected' : ''}`}
                                    onClick={() => handleToggleDefense(character.id, 'resistances', type)}
                                    title={`${selected ? 'Remove' : 'Add'} ${type} resistance`}
                                  >
                                    <span className="defense-icon">{DAMAGE_TYPE_ICONS[type]}</span>
                                    <span className="defense-label">{type}</span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="defense-category-header">
                              <span>Vulnerabilities</span>
                            </div>
                            <div className="defense-grid">
                              {DAMAGE_TYPES.map(type => {
                                const selected = (character.defenses?.vulnerabilities || []).includes(type);
                                return (
                                  <div
                                    key={`vuln-${type}`}
                                    className={`defense-chip ${selected ? 'selected' : ''}`}
                                    onClick={() => handleToggleDefense(character.id, 'vulnerabilities', type)}
                                    title={`${selected ? 'Remove' : 'Add'} ${type} vulnerability`}
                                  >
                                    <span className="defense-icon">{DAMAGE_TYPE_ICONS[type]}</span>
                                    <span className="defense-label">{type}</span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="defense-category-header">
                              <span>Immunities</span>
                            </div>
                            <div className="defense-grid">
                              {DAMAGE_TYPES.map(type => {
                                const selected = (character.defenses?.immunities || []).includes(type);
                                return (
                                  <div
                                    key={`imm-${type}`}
                                    className={`defense-chip ${selected ? 'selected' : ''}`}
                                    onClick={() => handleToggleDefense(character.id, 'immunities', type)}
                                    title={`${selected ? 'Remove' : 'Add'} ${type} immunity`}
                                  >
                                    <span className="defense-icon">{DAMAGE_TYPE_ICONS[type]}</span>
                                    <span className="defense-label">{type}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {!visibleCharacters().some(char => !char.name) && (
            <button 
              className="btn add-character-button-large"
              onClick={handleAddNewCharacter}
            >
              Add New Character
            </button>
          )}
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

export default CharacterSection; 
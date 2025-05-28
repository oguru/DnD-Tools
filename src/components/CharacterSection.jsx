import '../styles/CharacterSection.css';

import { useEffect, useRef, useState } from 'react';

import useDnDStore from '../store/dndStore';

const CharacterSection = () => {
  const {
    characters,
    updateCharacter,
    removeCharacter,
    expandedSections,
    toggleSection,
    addCharacter,
    resetCharacters,
    calculateHealthPercentage,
    getHealthColor,
    setTargetEntity,
    targetEntity,
    scrollToDamageSection,
    toggleCharacterAoeTarget,
    setCharactersSectionRef,
    registerEntityRef
  } = useDnDStore();

  // Local state to track if we want to show empty slot
  const [showEmptySlot, setShowEmptySlot] = useState(true);
  
  // Ref for the character section
  const sectionRef = useRef(null);
  
  // Refs for individual characters
  const characterRefs = useRef({});

  // Register section ref with store
  useEffect(() => {
    if (sectionRef.current) {
      setCharactersSectionRef(sectionRef);
    }
  }, [setCharactersSectionRef]);
  
  // Register refs for individual characters
  useEffect(() => {
    characters.forEach(character => {
      if (character.id && characterRefs.current[character.id] && !character.id.startsWith("empty-")) {
        registerEntityRef('character', character.id, characterRefs.current[character.id]);
      }
    });
  }, [characters, registerEntityRef]);

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
            className="toggle-section-button"
            onClick={() => toggleSection('characters')}
          >
            {expandedSections.characters ? 'Hide Characters' : 'Show Characters'}
          </button>
          {characters.length > 0 && (
            <button
              className="reset-characters-button"
              onClick={resetCharacters}
              title="Reset all character HP to max"
            >
              Reset HP
            </button>
          )}
        </div>
      </div>
      
      {expandedSections.characters && (
        <>
          <div className="characters-table">
            <div className="characters-header">
              <div>Name</div>
              <div>HP</div>
              <div>Max HP</div>
              <div>AC</div>
              <div>Initiative</div>
              <div>Health</div>
              <div>Actions</div>
            </div>
            
            {visibleCharacters().map((character) => {
              const isEmpty = character.id.startsWith("empty-"); // Only consider placeholder slots as empty
              const healthPercentage = calculateHealthPercentage(character.currentHp, character.maxHp);
              const healthColor = getHealthColor(healthPercentage);
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
                        <button
                          className={`target-button ${isTargeted ? 'active' : ''}`}
                          onClick={() => handleSetCharacterAsTarget(character)}
                          title={isTargeted ? "Scroll to damage application" : "Set as target"}
                        >
                          {isTargeted ? "Scroll to Damage" : "Target"}
                        </button>
                        <button 
                          className={`aoe-button ${character.inAoe ? 'active' : ''}`}
                          onClick={(e) => handleToggleCharacterAoe(e, character.id)}
                          title={character.inAoe ? "Remove from AoE" : "Add to AoE"}
                        >
                          {character.inAoe ? "In AoE" : "Add to AoE"}
                        </button>
                        <button
                          className="remove-character-button"
                          onClick={() => handleRemoveCharacter(character.id)}
                          title="Remove Character"
                        >
                          ×
                        </button>
                      </>
                    )}
                    {isEmpty && (
                      <button
                        className="add-character-button"
                        onClick={handleAddNewCharacter}
                        title="Add New Character"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {!visibleCharacters().some(char => !char.name) && (
            <button 
              className="add-character-button-large"
              onClick={handleAddNewCharacter}
            >
              Add New Character
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CharacterSection; 
const savedCharacters = localStorage.getItem('dnd-characters');
const initialCharacters = savedCharacters ? JSON.parse(savedCharacters) : [];

export const createCharactersSlice = (set, get) => ({
  characters: initialCharacters,

  addCharacter: (character) => {
    const newChar = {
      id: Date.now().toString(),
      name: character.name || '',
      maxHp: character.maxHp || 0,
      currentHp: character.currentHp || 0,
      tempHp: character.tempHp || 0,
      ac: character.ac || 0,
      initiative: character.initiative || 0,
      inAoe: false,
      defenses: character.defenses || {
        resistances: [],
        vulnerabilities: [],
        immunities: [],
      },
    };

    set((state) => {
      const updatedCharacters = [...state.characters, newChar];
      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
      return { characters: updatedCharacters };
    });

    setTimeout(() => get().updateTurnOrder(), 0);
  },

  updateCharacter: (id, field, value) => {
    set((state) => {
      const updatedCharacters = state.characters.map((char) =>
        char.id === id ? { ...char, [field]: value } : char
      );

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));

      if (field === 'initiative') {
        setTimeout(() => get().updateTurnOrder(true), 0);
      }

      return { characters: updatedCharacters };
    });
  },

  removeCharacter: (id) => {
    set((state) => {
      const newState = { characters: state.characters.filter((char) => char.id !== id) };

      if (
        state.targetEntity &&
        state.targetEntity.type === 'character' &&
        state.targetEntity.id === id
      ) {
        newState.targetEntity = null;
      }

      localStorage.setItem('dnd-characters', JSON.stringify(newState.characters));

      setTimeout(() => get().updateTurnOrder(false, id, 'character'), 0);

      return newState;
    });
  },

  resetCharacters: () => {
    set((state) => {
      const updatedCharacters = state.characters.map((char) => ({
        ...char,
        currentHp: char.maxHp,
      }));

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
      return { characters: updatedCharacters };
    });
  },

  clearTemporaryHitPoints: () => {
    set((state) => {
      const updatedCharacters = state.characters.map((char) => ({
        ...char,
        tempHp: 0,
      }));

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
      return { characters: updatedCharacters };
    });
  },

  setTemporaryHitPoints: (characterId, amount, replace = true) => {
    if (amount < 0) amount = 0;

    set((state) => {
      const updatedCharacters = state.characters.map((char) => {
        if (char.id !== characterId) return char;

        const existingTempHp = char.tempHp || 0;
        const newTempHp = replace ? amount : existingTempHp + amount;

        return {
          ...char,
          tempHp: Math.max(0, newTempHp),
        };
      });

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
      return { characters: updatedCharacters };
    });
  },

  toggleCharacterAoeTarget: (id) => {
    set((state) => {
      const updatedCharacters = state.characters.map((char) =>
        char.id === id ? { ...char, inAoe: !char.inAoe } : char
      );

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
      return { characters: updatedCharacters };
    });
  },

  applyDamageToCharacter: (
    characterId,
    damage,
    hitStatus,
    modifierText = '',
    skipCombatLog = false
  ) => {
    if (damage <= 0) return;

    set((state) => {
      const updatedCharacters = state.characters.map((char) => {
        if (char.id !== characterId) return char;

        if (hitStatus === 'miss') {
          return char;
        }

        let remainingDamage = damage;
        let newTempHp = char.tempHp || 0;

        if (newTempHp > 0) {
          if (newTempHp >= remainingDamage) {
            newTempHp -= remainingDamage;
            remainingDamage = 0;
          } else {
            remainingDamage -= newTempHp;
            newTempHp = 0;
          }
        }

        const newHp = Math.max(0, char.currentHp - remainingDamage);

        return {
          ...char,
          currentHp: newHp,
          tempHp: newTempHp,
        };
      });

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
      setTimeout(() => get().updateTurnOrder(), 0);

      if (skipCombatLog) {
        return {
          characters: updatedCharacters,
        };
      }

      const character = state.characters.find((c) => c.id === characterId);
      const resultMessage =
        hitStatus === 'miss'
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
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  applyDamageToAllCharactersInAoe: (aoeParams, forceAll = false) => {
    const { damage, saveType, saveDC, halfOnSave, characterDamageParams } = aoeParams;
    if (damage <= 0) return;

    let resultMessage = '';

    set((state) => {
      const aoeCharacters = forceAll
        ? state.characters
        : state.characters.filter((char) => char.inAoe);

      if (aoeCharacters.length === 0) return state;

      const updatedCharacters = state.characters.map((char) => {
        if (!forceAll && !char.inAoe) return char;

        if (characterDamageParams && characterDamageParams[char.id]) {
          const customParams = characterDamageParams[char.id];
          const customDamage = customParams.damage;

          if (customDamage > 0) {
            let remainingDamage = customDamage;
            let newTempHp = char.tempHp || 0;

            if (newTempHp > 0) {
              if (newTempHp >= remainingDamage) {
                newTempHp -= remainingDamage;
                remainingDamage = 0;
              } else {
                remainingDamage -= newTempHp;
                newTempHp = 0;
              }
            }

            const newHp = Math.max(0, char.currentHp - remainingDamage);

            return {
              ...char,
              currentHp: newHp,
              tempHp: newTempHp,
            };
          }

          return char;
        }

        const saveRoll = Math.floor(Math.random() * 20) + 1;
        const saved = saveRoll >= saveDC;

        let damageToApply = damage;
        if (saved && halfOnSave) {
          damageToApply = Math.floor(damage / 2);
        } else if (saved && !halfOnSave) {
          damageToApply = 0;
        }

        if (damageToApply <= 0) {
          return char;
        }

        let remainingDamage = damageToApply;
        let newTempHp = char.tempHp || 0;

        if (newTempHp > 0) {
          if (newTempHp >= remainingDamage) {
            newTempHp -= remainingDamage;
            remainingDamage = 0;
          } else {
            remainingDamage -= newTempHp;
            newTempHp = 0;
          }
        }

        const newHp = Math.max(0, char.currentHp - remainingDamage);

        return {
          ...char,
          currentHp: newHp,
          tempHp: newTempHp,
        };
      });

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));

      if (characterDamageParams) {
        const saveDetails = [];
        aoeCharacters.forEach((char) => {
          if (characterDamageParams[char.id]) {
            const params = characterDamageParams[char.id];
            const saveRoll = params.saveRoll === null ? 'Auto' : params.saveRoll;
            const saveStatus = params.succeeded ? 'Success' : 'Failure';
            saveDetails.push(`${char.name}: ${saveRoll} (${saveStatus}, ${params.damage} dmg)`);
          }
        });

        resultMessage =
          saveDetails.length > 0
            ? saveDetails.join('; ')
            : `${aoeCharacters.map((c) => c.name).join(', ')} - DC ${saveDC} ${saveType.toUpperCase()} save`;
      } else {
        resultMessage = `${aoeCharacters
          .map((c) => c.name)
          .join(', ')} - DC ${saveDC} ${saveType.toUpperCase()} save`;
      }

      return { characters: updatedCharacters };
    });

    return resultMessage;
  },

  applyDamageToAllCharactersInAoeInternal: (aoeParams, forceAll = false) => {
    const { damage, saveType, saveDC, halfOnSave, characterDamageParams } = aoeParams;
    if (damage <= 0) return '';

    let resultMessage = '';

    set((state) => {
      const aoeCharacters = forceAll
        ? state.characters
        : state.characters.filter((char) => char.inAoe);

      if (aoeCharacters.length === 0) return state;

      const updatedCharacters = state.characters.map((char) => {
        if (!forceAll && !char.inAoe) return char;

        if (characterDamageParams && characterDamageParams[char.id]) {
          const customParams = characterDamageParams[char.id];
          const customDamage = customParams.damage;

          if (customDamage > 0) {
            let remainingDamage = customDamage;
            let newTempHp = char.tempHp || 0;

            if (newTempHp > 0) {
              if (newTempHp >= remainingDamage) {
                newTempHp -= remainingDamage;
                remainingDamage = 0;
              } else {
                remainingDamage -= newTempHp;
                newTempHp = 0;
              }
            }

            const newHp = Math.max(0, char.currentHp - remainingDamage);

            return {
              ...char,
              currentHp: newHp,
              tempHp: newTempHp,
            };
          }

          return char;
        }

        const saveRoll = Math.floor(Math.random() * 20) + 1;
        const saved = saveRoll >= saveDC;

        let damageToApply = damage;
        if (saved && halfOnSave) {
          damageToApply = Math.floor(damage / 2);
        } else if (saved && !halfOnSave) {
          damageToApply = 0;
        }

        if (damageToApply <= 0) {
          return char;
        }

        let remainingDamage = damageToApply;
        let newTempHp = char.tempHp || 0;

        if (newTempHp > 0) {
          if (newTempHp >= remainingDamage) {
            newTempHp -= remainingDamage;
            remainingDamage = 0;
          } else {
            remainingDamage -= newTempHp;
            newTempHp = 0;
          }
        }

        const newHp = Math.max(0, char.currentHp - remainingDamage);

        return {
          ...char,
          currentHp: newHp,
          tempHp: newTempHp,
        };
      });

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));

      if (characterDamageParams) {
        const saveDetails = [];
        aoeCharacters.forEach((char) => {
          if (characterDamageParams[char.id]) {
            const params = characterDamageParams[char.id];
            const saveRoll = params.saveRoll === null ? 'Auto' : params.saveRoll;
            const saveStatus = params.succeeded ? 'Success' : 'Failure';
            saveDetails.push(`${char.name}: ${saveRoll} (${saveStatus}, ${params.damage} dmg)`);
          }
        });

        resultMessage =
          saveDetails.length > 0
            ? saveDetails.join('; ')
            : `${aoeCharacters.map((c) => c.name).join(', ')} - DC ${saveDC} ${saveType.toUpperCase()} save`;
      } else {
        resultMessage = `${aoeCharacters
          .map((c) => c.name)
          .join(', ')} - DC ${saveDC} ${saveType.toUpperCase()} save`;
      }

      return { characters: updatedCharacters };
    });

    return resultMessage;
  },

  applyDamageToMultipleCharacters: (damageDetails) => {
    set((state) => {
      const updatedCharacters = state.characters.map((char) => {
        const charDamageInstances = damageDetails.filter((d) => d.characterId === char.id);

        if (charDamageInstances.length === 0) return char;

        let totalDamage = 0;
        let currentHp = char.currentHp;
        let currentTempHp = char.tempHp || 0;

        charDamageInstances.forEach((charDamage) => {
          let finalDamage = charDamage.damage;

          if (
            charDamage.acOverride !== null &&
            charDamage.acOverride !== undefined &&
            char.ac !== charDamage.acOverride &&
            charDamage.attackRolls &&
            charDamage.adjustedHitCount === undefined
          ) {
            const newHitCount = charDamage.attackRolls.filter((roll) =>
              roll.isNatural20 || (!roll.isNatural1 && roll.attackRoll >= charDamage.acOverride)
            ).length;

            if (charDamage.hitCount) {
              const hitRatio = newHitCount / charDamage.hitCount;
              finalDamage = Math.floor(finalDamage * hitRatio);
            }
          }

          if (!charDamage.damagePreCalculated) {
            if (charDamage.modifier === 'half') {
              finalDamage = Math.floor(finalDamage / 2);
            } else if (charDamage.modifier === 'quarter') {
              finalDamage = Math.floor(finalDamage / 4);
            } else if (charDamage.modifier === 'none') {
              finalDamage = 0;
            }
          }

          if (finalDamage <= 0) return;

          let remainingDamage = finalDamage;

          if (currentTempHp > 0) {
            if (currentTempHp >= remainingDamage) {
              currentTempHp -= remainingDamage;
              remainingDamage = 0;
            } else {
              remainingDamage -= currentTempHp;
              currentTempHp = 0;
            }
          }

          currentHp = Math.max(0, currentHp - remainingDamage);
          totalDamage += finalDamage;
        });

        if (totalDamage === 0) return char;

        return {
          ...char,
          currentHp,
          tempHp: currentTempHp,
        };
      });

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));

      const resultMessages = damageDetails
        .map((detail) => {
          if (!detail.characterId) return null;

          const character = state.characters.find((c) => c.id === detail.characterId);
          if (!character) return null;

          let finalDamage = detail.damage;

          if (
            detail.acOverride !== null &&
            detail.acOverride !== undefined &&
            character.ac !== detail.acOverride &&
            detail.attackRolls &&
            detail.adjustedHitCount === undefined
          ) {
            const newHitCount = detail.attackRolls.filter((roll) =>
              roll.isNatural20 || (!roll.isNatural1 && roll.attackRoll >= detail.acOverride)
            ).length;

            if (detail.hitCount) {
              const hitRatio = newHitCount / detail.hitCount;
              finalDamage = Math.floor(finalDamage * hitRatio);
            }
          }

          if (!detail.damagePreCalculated) {
            if (detail.modifier === 'half') {
              finalDamage = Math.floor(finalDamage / 2);
            } else if (detail.modifier === 'quarter') {
              finalDamage = Math.floor(finalDamage / 4);
            } else if (detail.modifier === 'none') {
              finalDamage = 0;
            }
          }

          let acText = '';
          if (
            detail.acOverride !== null &&
            detail.acOverride !== undefined &&
            character.ac !== detail.acOverride
          ) {
            acText = ` (AC override: ${detail.acOverride})`;
          }

          let adjustmentText = '';
          if (detail.manualAdjustment) {
            const sign = detail.manualAdjustment > 0 ? '+' : '';
            adjustmentText = ` (Adjustment: ${sign}${detail.manualAdjustment})`;
          }

          let modifierText = '';
          if (
            detail.originalModifier &&
            detail.originalModifier !== 'full' &&
            detail.originalModifier !== 'default'
          ) {
            modifierText = ` (${detail.originalModifier} damage)`;
          }

          return {
            id: `${Date.now()}-${Math.random()}-${detail.characterId}-${detail.sourceGroupId}`,
            characterId: detail.characterId,
            sourceGroupId: detail.sourceGroupId,
            damage: finalDamage,
            hitStatus: detail.hitStatus || 'hit',
            message: `${detail.groupName || 'Group'} -> ${character.name}${acText}${adjustmentText}${modifierText}: ${finalDamage} damage`,
            timestamp: Date.now(),
          };
        })
        .filter(Boolean);

      setTimeout(() => get().updateTurnOrder(), 0);

      return {
        characters: updatedCharacters,
        attackResults: [...state.attackResults, ...resultMessages],
      };
    });
  },

  applyHealingToCharacter: (characterId, amount, transactionId = null) => {
    const character = get().characters.find((c) => c.id === characterId);
    if (!character || amount <= 0) return;

    const currentHp = Math.max(0, character.currentHp);
    const newHp = Math.min(character.maxHp, currentHp + amount);
    const healingId = transactionId || Date.now().toString();

    set((state) => {
      const updatedCharacters = state.characters.map((char) =>
        char.id === characterId ? { ...char, currentHp: newHp } : char
      );

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));

      return {
        characters: updatedCharacters,
        attackResults: [
          ...state.attackResults,
          {
            id: `${healingId}-${characterId}`,
            characterId,
            healing: amount,
            message: `Healing! ${amount} healing to ${character.name}`,
            isHealing: true,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },
});

export default createCharactersSlice;


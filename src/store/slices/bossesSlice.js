const savedBosses = localStorage.getItem('dnd-bosses');

const sanitizeBosses = (bosses) => {
  if (!Array.isArray(bosses)) return [];

  return bosses.map((boss) => {
    const sanitizedAttacks = Array.isArray(boss.attacks)
      ? boss.attacks.map((attack) => {
          if (!attack) return attack;

          if (attack.usesCharges) {
            const maxCharges = Math.min(5, Math.max(1, attack.maxCharges || 1));
            const remaining =
              typeof attack.chargesRemaining === 'number'
                ? Math.max(0, Math.min(maxCharges, attack.chargesRemaining))
                : maxCharges;

            return {
              ...attack,
              maxCharges,
              chargesRemaining: remaining,
              isRemoved: !!attack.isRemoved,
            };
          }

          return {
            ...attack,
            isRemoved: !!attack?.isRemoved,
          };
        })
      : [];

    return {
      ...boss,
      attacks: sanitizedAttacks,
      tempHp: boss.tempHp || 0,
      defenses:
        boss.defenses || {
          resistances: [],
          vulnerabilities: [],
          immunities: [],
        },
      showDefenses: boss.showDefenses || false,
    };
  });
};

const initialBosses = sanitizeBosses(savedBosses ? JSON.parse(savedBosses) : []);

if (savedBosses) {
  localStorage.setItem('dnd-bosses', JSON.stringify(initialBosses));
}

const defaultBossTemplate = {
  name: '',
  maxHp: 100,
  currentHp: 100,
  ac: 15,
  initiative: 0,
  initiativeModifier: 0,
  notes: '',
  attacks: [],
  showSavingThrows: false,
  showDefenses: false,
  savingThrows: {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  },
  defenses: {
    resistances: [],
    vulnerabilities: [],
    immunities: [],
  },
};

export const createBossesSlice = (set, get) => ({
  bosses: initialBosses,
  bossTemplate: defaultBossTemplate,

  addBoss: (boss) => {
    console.log('[Store.addBoss] incoming', boss);
    const sanitizedAttacks = Array.isArray(boss.attacks)
      ? boss.attacks.map((attack) => {
          if (!attack) return attack;
          if (attack.usesCharges) {
            const maxCharges = Math.min(5, Math.max(1, attack.maxCharges || 1));
            const remaining =
              typeof attack.chargesRemaining === 'number'
                ? Math.max(0, Math.min(maxCharges, attack.chargesRemaining))
                : maxCharges;
            return {
              ...attack,
              maxCharges,
              chargesRemaining: remaining,
              isRemoved: !!attack.isRemoved,
            };
          }

          return {
            ...attack,
            isRemoved: !!attack.isRemoved,
          };
        })
      : [];

    const newBoss = {
      ...boss,
      id: boss.id || Date.now().toString(),
      inAoe: false,
      showSavingThrows: boss.showSavingThrows || false,
      savingThrows:
        boss.savingThrows || {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          wis: 0,
          cha: 0,
        },
      showDefenses: boss.showDefenses || false,
      defenses: boss.defenses || {
        resistances: [],
        vulnerabilities: [],
        immunities: [],
      },
      tempHp: boss.tempHp || 0,
      attacks: sanitizedAttacks,
      attackResults: [],
    };

    set((state) => {
      const updatedBosses = [...state.bosses, newBoss];
      console.log('[Store.addBoss] saved', newBoss);
      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      return { bosses: updatedBosses };
    });

    setTimeout(() => get().updateTurnOrder(), 0);
  },

  removeBoss: (id) => {
    set((state) => {
      const newState = { bosses: state.bosses.filter((boss) => boss.id !== id) };

      if (state.targetEntity && state.targetEntity.type === 'boss' && state.targetEntity.id === id) {
        newState.targetEntity = null;
      }

      localStorage.setItem('dnd-bosses', JSON.stringify(newState.bosses));

      setTimeout(() => get().updateTurnOrder(false, id, 'boss'), 0);

      return newState;
    });
  },

  updateBoss: (id, field, value) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) =>
        boss.id === id ? { ...boss, [field]: value } : boss
      );

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));

      if (field === 'initiative') {
        setTimeout(() => get().updateTurnOrder(true), 0);
      }

      return { bosses: updatedBosses };
    });
  },

  setTemporaryHitPointsBoss: (bossId, amount, replace = true) => {
    if (amount < 0) amount = 0;

    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id !== bossId) return boss;

        const existingTempHp = boss.tempHp || 0;
        const newTempHp = replace ? amount : existingTempHp + amount;

        return {
          ...boss,
          tempHp: Math.max(0, newTempHp),
        };
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      return { bosses: updatedBosses };
    });
  },

  updateBossHp: (id, change) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id !== id) return boss;

        const newHp = Math.max(0, Math.min(boss.currentHp + change, boss.maxHp));
        return { ...boss, currentHp: newHp };
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      setTimeout(() => get().updateTurnOrder(false), 0);

      return { bosses: updatedBosses };
    });
  },

  resetBossesHealth: () => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => ({
        ...boss,
        currentHp: boss.maxHp,
      }));

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      return { bosses: updatedBosses };
    });
  },

  clearAllBosses: () => {
    localStorage.removeItem('dnd-bosses');
    set({ bosses: [] });
  },

  setBossAttackCharges: (bossId, attackId, chargesRemaining) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id !== bossId) return boss;

        const updatedAttacks = (boss.attacks || []).map((attack) => {
          if (!attack || attack.id !== attackId) return attack;

          if (!attack.usesCharges) {
            return attack;
          }

          const maxCharges = Math.min(5, Math.max(0, attack.maxCharges || 0));
          const clamped = Math.max(
            0,
            Math.min(
              maxCharges,
              typeof chargesRemaining === 'number' ? chargesRemaining : maxCharges
            )
          );

          return {
            ...attack,
            maxCharges,
            chargesRemaining: clamped,
          };
        });

        return {
          ...boss,
          attacks: updatedAttacks,
        };
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      return { bosses: updatedBosses };
    });
  },

  setBossAttackRemoved: (bossId, attackId, isRemoved) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id !== bossId) return boss;

        const updatedAttacks = (boss.attacks || []).map((attack) =>
          attack && attack.id === attackId ? { ...attack, isRemoved: !!isRemoved } : attack
        );

        return {
          ...boss,
          attacks: updatedAttacks,
        };
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      return { bosses: updatedBosses };
    });
  },

  toggleBossAoeTarget: (id) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) =>
        boss.id === id ? { ...boss, inAoe: !boss.inAoe } : boss
      );
      return { bosses: updatedBosses };
    });
  },

  addBossAttackResult: (bossId, result) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id === bossId) {
          const attackResults = [...(boss.attackResults || []), result];
          return { ...boss, attackResults };
        }
        return boss;
      });

      return {
        bosses: updatedBosses,
        attackResults: [
          ...state.attackResults,
          { ...result, bossId, timestamp: Date.now() },
        ],
      };
    });
  },

  updateBossAttackResult: (bossId, resultId, updates) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id === bossId) {
          const attackResults = (boss.attackResults || []).map((result) =>
            result.id === resultId ? { ...result, ...updates } : result
          );
          return { ...boss, attackResults };
        }
        return boss;
      });

      const updatedAttackResults = state.attackResults.map((result) =>
        result.id === resultId && result.bossId === bossId ? { ...result, ...updates } : result
      );

      return {
        bosses: updatedBosses,
        attackResults: updatedAttackResults,
      };
    });
  },

  toggleBossSavingThrows: (bossId) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) =>
        boss.id === bossId ? { ...boss, showSavingThrows: !boss.showSavingThrows } : boss
      );
      return { bosses: updatedBosses };
    });
  },

  toggleBossTemplateSavingThrows: () => {
    set((state) => ({
      bossTemplate: {
        ...state.bossTemplate,
        showSavingThrows: !state.bossTemplate.showSavingThrows,
      },
    }));
  },

  updateBossSavingThrow: (bossId, ability, value) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id === bossId) {
          return {
            ...boss,
            savingThrows: {
              ...boss.savingThrows,
              [ability]: value,
            },
          };
        }
        return boss;
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      return { bosses: updatedBosses };
    });
  },

  applyDamageToBoss: (bossId, damage, hitStatus) => {
    if (damage <= 0) return;

    set((state) => {
      const updatedBosses = state.bosses.map((boss) => {
        if (boss.id !== bossId) return boss;

        if (hitStatus === 'miss') {
          return boss;
        }

        const newHp = Math.max(0, boss.currentHp - damage);
        return { ...boss, currentHp: newHp };
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));

      const boss = state.bosses.find((b) => b.id === bossId);
      const resultMessage =
        hitStatus === 'miss'
          ? 'Miss!'
          : hitStatus === 'critical'
          ? `Critical hit! ${damage} damage to ${boss?.name}`
          : `Hit! ${damage} damage to ${boss?.name}`;

      setTimeout(() => get().updateTurnOrder(), 0);

      return {
        bosses: updatedBosses,
        attackResults: [
          ...state.attackResults,
          {
            id: Date.now().toString(),
            bossId,
            damage,
            hitStatus,
            message: resultMessage,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  applyDamageToAllBossesInAoe: (aoeParams, applyToAll = false) => {
    const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
    if (damage <= 0) return;

    set((state) => {
      const aoeBosses = applyToAll ? state.bosses : state.bosses.filter((boss) => boss.inAoe);
      if (aoeBosses.length === 0) return state;

      const bossResults = [];

      const updatedBosses = state.bosses.map((boss) => {
        if (!applyToAll && !boss.inAoe) return boss;

        const entityKey = `boss-${boss.id}`;
        const customEntityInfo = entityDamageModifiers[entityKey];

        let saved = false;
        let damageToApply = damage;
        let saveRoll = null;
        let totalRoll = null;

        if (customEntityInfo) {
          saved = customEntityInfo.succeeded;
          saveRoll = customEntityInfo.roll;
          totalRoll = customEntityInfo.totalRoll;

          if (customEntityInfo.customDamage !== undefined) {
            damageToApply = customEntityInfo.customDamage;
          } else {
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }

            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          }
        } else if (saveType && saveDC) {
          const saveBonus = boss.savingThrows?.[saveType] || 0;
          saveRoll = Math.floor(Math.random() * 20) + 1;
          totalRoll = saveRoll + saveBonus;
          saved = totalRoll >= saveDC;

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        bossResults.push({
          name: boss.name,
          saved,
          damageToApply,
          saveRoll,
          totalRoll,
        });

        if (damageToApply <= 0) {
          return { ...boss, inAoe: false };
        }

        const newHp = Math.max(0, boss.currentHp - damageToApply);
        return {
          ...boss,
          currentHp: newHp,
          inAoe: false,
        };
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));

      const bossMessages = bossResults
        .map((result) => {
          let saveText = '';
          if (result.saveRoll !== null) {
            saveText =
              result.totalRoll !== result.saveRoll
                ? ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`
                : ` (${result.saveRoll})`;
          }

          return `${result.name}: ${result.saved ? (halfOnSave ? 'Save' + saveText + ' (½ dmg)' : 'Save' + saveText + ' (no dmg)') : 'Failed' + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'}`;
        })
        .join('; ');

      const resultMessage = `AoE: ${damage} ${saveType ? `${saveType.toUpperCase()} save DC ${saveDC}` : 'damage'} to bosses - ${bossMessages}`;

      return {
        bosses: updatedBosses,
        attackResults: [
          ...state.attackResults,
          {
            id: Date.now().toString(),
            damage,
            message: resultMessage,
            isAoE: true,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  applyDamageToAllBossesInAoeInternal: (aoeParams, applyToAll = false) => {
    const { damage, saveType, saveDC, halfOnSave, entityDamageModifiers = {} } = aoeParams;
    if (damage <= 0) return '';

    let resultMessage = '';

    set((state) => {
      const aoeBosses = applyToAll ? state.bosses : state.bosses.filter((boss) => boss.inAoe);
      if (aoeBosses.length === 0) return state;

      const bossResults = [];

      const updatedBosses = state.bosses.map((boss) => {
        if (!applyToAll && !boss.inAoe) return boss;

        const entityKey = `boss-${boss.id}`;
        const customEntityInfo = entityDamageModifiers[entityKey];

        let saved = false;
        let damageToApply = damage;
        let saveRoll = null;
        let totalRoll = null;

        if (customEntityInfo) {
          saved = customEntityInfo.succeeded;
          saveRoll = customEntityInfo.roll;
          totalRoll = customEntityInfo.totalRoll;

          if (customEntityInfo.customDamage !== undefined) {
            damageToApply = customEntityInfo.customDamage;
          } else {
            if (customEntityInfo.modifier === 'half') {
              damageToApply = Math.floor(damage / 2);
            } else if (customEntityInfo.modifier === 'quarter') {
              damageToApply = Math.floor(damage / 4);
            } else if (customEntityInfo.modifier === 'none') {
              damageToApply = 0;
            }

            if (customEntityInfo.adjustment) {
              damageToApply = Math.max(0, damageToApply + customEntityInfo.adjustment);
            }
          }
        } else if (saveType && saveDC) {
          const saveBonus = boss.savingThrows?.[saveType] || 0;
          saveRoll = Math.floor(Math.random() * 20) + 1;
          totalRoll = saveRoll + saveBonus;
          saved = totalRoll >= saveDC;

          if (saved && halfOnSave) {
            damageToApply = Math.floor(damage / 2);
          } else if (saved && !halfOnSave) {
            damageToApply = 0;
          }
        }

        bossResults.push({
          name: boss.name,
          saved,
          damageToApply,
          saveRoll,
          totalRoll,
        });

        if (damageToApply <= 0) {
          return { ...boss, inAoe: false };
        }

        const newHp = Math.max(0, boss.currentHp - damageToApply);
        return {
          ...boss,
          currentHp: newHp,
          inAoe: false,
        };
      });

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));

      resultMessage = bossResults
        .map((result) => {
          let saveText = '';
          if (result.saveRoll !== null) {
            saveText =
              result.totalRoll !== result.saveRoll
                ? ` (${result.totalRoll}: ${result.saveRoll}+${result.totalRoll - result.saveRoll})`
                : ` (${result.saveRoll})`;
          }

          return `${result.name}: ${result.saved ? (halfOnSave ? 'Save' + saveText + ' (½ dmg)' : 'Save' + saveText + ' (no dmg)') : 'Failed' + saveText}, ${result.damageToApply > 0 ? `${result.damageToApply} damage` : 'no damage'}`;
        })
        .join('; ');

      return { bosses: updatedBosses };
    });

    return resultMessage;
  },

  setBossTarget: (bossId) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => ({
        ...boss,
        isTargeted: boss.id === bossId,
      }));

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));

      return {
        bosses: updatedBosses,
        targetEntity: { type: 'boss', id: bossId },
      };
    });
  },

  setBossAoeTarget: (bossId, isTarget) => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) =>
        boss.id === bossId ? { ...boss, inAoe: isTarget } : boss
      );

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));

      return { bosses: updatedBosses };
    });
  },

  prepareBossAoeAttack: (bossId, attack) => {
    const boss = get().bosses.find((b) => b.id === bossId);
    if (!boss || !attack) return;

    let totalDamage = 0;

    const componentsToRoll =
      attack.damageComponents && attack.damageComponents.length > 0
        ? attack.damageComponents
        : [
            {
              numDice: attack.numDice,
              diceType: attack.diceType,
              modifier: attack.modifier,
              damageType: attack.damageType || 'slashing',
            },
          ];

    const rolledComponents = componentsToRoll.map((component) => {
      const damageRoll = get().rollDice(component.numDice, component.diceType);
      const componentTotal = damageRoll + component.modifier;
      totalDamage += componentTotal;

      return {
        damageType: component.damageType,
        damageRoll,
        modifier: component.modifier,
        total: componentTotal,
      };
    });

    get().setTargetEntity({ type: 'boss', id: bossId });

    const aoeParams = {
      damage: totalDamage.toString(),
      damageComponents: rolledComponents,
      saveType: attack.saveType,
      saveDC: attack.saveDC,
      halfOnSave: attack.halfOnSave,
    };

    get().prepareAoeDamage(aoeParams);
    get().scrollToDamageSection();

    const componentSummary = rolledComponents
      .map((component) => {
        const modifierPart = component.modifier
          ? `${component.modifier >= 0 ? '+' : ''}${component.modifier}`
          : '';
        const typePart = component.damageType ? ` ${component.damageType}` : '';
        return `${component.damageRoll}${modifierPart}${typePart}`;
      })
      .join(', ');

    const saveTypeLabel = attack.saveType ? attack.saveType.toUpperCase() : 'SAVE';
    const message = `AOE Attack: ${attack.name} - ${totalDamage} damage${
      componentSummary ? ` (${componentSummary})` : ''
    } - DC ${attack.saveDC} ${saveTypeLabel} save, ${attack.halfOnSave ? 'half' : 'no'} damage on save`;

    get().addBossAttackResult(bossId, {
      id: Date.now().toString(),
      attackName: attack.name,
      message,
      damage: totalDamage,
      isAoE: true,
      saveType: attack.saveType,
      saveDC: attack.saveDC,
      halfOnSave: attack.halfOnSave,
    });
  },

  applyHealingToBoss: (bossId, amount, transactionId = null) => {
    const boss = get().bosses.find((b) => b.id === bossId);
    if (!boss || amount <= 0) return;

    const newHP = Math.min(boss.maxHp, boss.currentHp + amount);
    const healingId = transactionId || Date.now().toString();

    set((state) => {
      const updatedBosses = state.bosses.map((b) =>
        b.id === bossId ? { ...b, currentHp: newHP } : b
      );

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));

      return {
        bosses: updatedBosses,
        attackResults: [
          ...state.attackResults,
          {
            id: `${healingId}-${bossId}`,
            bossId,
            healing: amount,
            message: `Healing! ${amount} healing to ${boss.name}`,
            isHealing: true,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },
});

export default createBossesSlice;


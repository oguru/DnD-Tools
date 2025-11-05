export const createCombatSlice = (set, get) => ({
  attackResults: [],
  aoeDamageParams: null,

  clearAttackResults: () => {
    set({ attackResults: [] });
  },

  removeAttackResult: (resultId) => {
    set((state) => ({
      attackResults: state.attackResults.filter((result) => result.id !== resultId),
    }));
  },

  prepareAoeDamage: (params) => {
    set({ aoeDamageParams: params });
  },

  applyAoeDamageToAll: (aoeParams) => {
    const { damage, saveType, saveDC } = aoeParams;
    if (damage <= 0) return;

    const state = get();
    const aoeBosses = aoeParams.applyToAll ? state.bosses : state.bosses.filter((boss) => boss.inAoe);
    const aoeGroups = aoeParams.applyToAll
      ? state.enemyGroups
      : state.enemyGroups.filter((group) => group.inAoe);
    const aoeCharacters = aoeParams.applyToAll
      ? state.characters
      : state.characters.filter((char) => char.inAoe);

    if (aoeBosses.length === 0 && aoeGroups.length === 0 && aoeCharacters.length === 0) {
      return;
    }

    const bossResults = get().applyDamageToAllBossesInAoeInternal(aoeParams, aoeParams.applyToAll);
    const groupResults = get().applyDamageToAllGroupsInAoeInternal(aoeParams);
    const charResults = get().applyDamageToAllCharactersInAoeInternal(
      aoeParams,
      aoeParams.applyToAll
    );

    let finalMessage = `AoE: ${damage} ${saveType.toUpperCase()} save DC ${saveDC}`;

    if (bossResults && bossResults.trim() !== '') {
      finalMessage += `\nto bosses - ${bossResults}`;
    }

    if (groupResults && groupResults.trim() !== '') {
      finalMessage += `\nto groups - ${groupResults}`;
    }

    if (charResults && charResults.trim() !== '') {
      finalMessage += `\nto characters - ${charResults}`;
    }

    set((state) => ({
      attackResults: [
        ...state.attackResults,
        {
          id: Date.now().toString(),
          damage,
          message: finalMessage,
          isAoE: true,
          timestamp: Date.now(),
        },
      ],
    }));

    get().clearAllAoeTargets();
  },

  clearAllAoeTargets: () => {
    set((state) => {
      const updatedBosses = state.bosses.map((boss) => ({
        ...boss,
        inAoe: false,
      }));

      const updatedGroups = state.enemyGroups.map((group) => ({
        ...group,
        inAoe: false,
      }));

      const updatedCharacters = state.characters.map((char) => ({
        ...char,
        inAoe: false,
      }));

      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));
      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));

      return {
        bosses: updatedBosses,
        enemyGroups: updatedGroups,
        characters: updatedCharacters,
      };
    });
  },
});

export default createCombatSlice;


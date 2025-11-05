export const createPersistenceSlice = (set, get) => ({
  exportState: () => {
    const { characters, bosses, enemyGroups } = get();
    const exportData = JSON.stringify({ characters, bosses, enemyGroups }, null, 2);

    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'dnd-calculator-state.json';
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  },

  exportStateSelective: (options = {}) => {
    const { characters, bosses, enemyGroups } = get();
    const exportData = {};

    if (options.includeCharacters) {
      exportData.characters = options.selectedCharacters && options.selectedCharacters.length > 0
        ? characters.filter((char) => options.selectedCharacters.includes(char.id))
        : characters;
    }

    if (options.includeBosses) {
      exportData.bosses = options.selectedBosses && options.selectedBosses.length > 0
        ? bosses.filter((boss) => options.selectedBosses.includes(boss.id))
        : bosses;
    }

    if (options.includeGroups) {
      exportData.enemyGroups = options.selectedGroups && options.selectedGroups.length > 0
        ? enemyGroups.filter((group) => options.selectedGroups.includes(group.id))
        : enemyGroups;
    }

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'dnd-calculator-export.json';
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  },

  importState: (stateJson) => {
    try {
      const importedState = JSON.parse(stateJson);
      if (!importedState) throw new Error('Invalid state data');

      const characters = Array.isArray(importedState.characters) ? importedState.characters : [];
      const bosses = Array.isArray(importedState.bosses) ? importedState.bosses : [];
      const enemyGroups = Array.isArray(importedState.enemyGroups) ? importedState.enemyGroups : [];

      localStorage.setItem('dnd-characters', JSON.stringify(characters));
      localStorage.setItem('dnd-bosses', JSON.stringify(bosses));
      localStorage.setItem('dnd-enemy-groups', JSON.stringify(enemyGroups));

      set({ characters, bosses, enemyGroups });
      get().updateTurnOrder();

      return true;
    } catch (err) {
      console.error('Error importing state:', err);
      return false;
    }
  },

  importStateSelective: (stateJson, options = {}) => {
    try {
      const importedState = JSON.parse(stateJson);
      if (!importedState) throw new Error('Invalid state data');

      const currentState = get();
      let newCharacters = [...currentState.characters];
      let newBosses = [...currentState.bosses];
      let newEnemyGroups = [...currentState.enemyGroups];

      if (options.includeCharacters && Array.isArray(importedState.characters)) {
        const importedCharacters = importedState.characters.map((char) => ({
          ...char,
          id: options.mergeCharacters
            ? `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            : char.id,
        }));

        newCharacters = options.mergeCharacters
          ? [...newCharacters, ...importedCharacters]
          : importedCharacters;
      } else if (options.clearMissingCharacters) {
        newCharacters = [];
      }

      if (options.includeBosses && Array.isArray(importedState.bosses)) {
        const importedBosses = importedState.bosses.map((boss) => ({
          ...boss,
          id: options.mergeBosses
            ? `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            : boss.id,
        }));

        newBosses = options.mergeBosses ? [...newBosses, ...importedBosses] : importedBosses;
      } else if (options.clearMissingBosses) {
        newBosses = [];
      }

      if (options.includeGroups && Array.isArray(importedState.enemyGroups)) {
        const importedGroups = importedState.enemyGroups.map((group) => ({
          ...group,
          id: options.mergeGroups
            ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            : group.id,
        }));

        newEnemyGroups = options.mergeGroups
          ? [...newEnemyGroups, ...importedGroups]
          : importedGroups;
      } else if (options.clearMissingGroups) {
        newEnemyGroups = [];
      }

      localStorage.setItem('dnd-characters', JSON.stringify(newCharacters));
      localStorage.setItem('dnd-bosses', JSON.stringify(newBosses));
      localStorage.setItem('dnd-enemy-groups', JSON.stringify(newEnemyGroups));

      set({
        characters: newCharacters,
        bosses: newBosses,
        enemyGroups: newEnemyGroups,
      });

      get().updateTurnOrder();

      return true;
    } catch (err) {
      console.error('Error importing state:', err);
      return false;
    }
  },
});

export default createPersistenceSlice;


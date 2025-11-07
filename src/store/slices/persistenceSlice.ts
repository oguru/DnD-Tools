import type { Character } from '@models/entities/Character';
import type { Boss } from '@models/entities/Boss';
import type { EnemyGroup } from '@models/entities/EnemyGroup';

interface ExportOptions {
  includeCharacters?: boolean;
  includeBosses?: boolean;
  includeGroups?: boolean;
  selectedCharacters?: string[];
  selectedBosses?: string[];
  selectedGroups?: string[];
}

interface ImportOptions {
  mergeMode?: boolean;
  clearMissingCharacters?: boolean;
  clearMissingBosses?: boolean;
  clearMissingGroups?: boolean;
}

interface PersistenceActions {
  exportState: () => boolean;
  exportStateSelective: (options?: ExportOptions) => boolean;
  importState: (jsonString: string) => boolean;
  importStateSelective: (jsonString: string, options?: ImportOptions) => boolean;
}

export const createPersistenceSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): PersistenceActions => ({
  exportState: (): boolean => {
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

  exportStateSelective: (options: ExportOptions = {}): boolean => {
    const { characters, bosses, enemyGroups } = get();
    const exportData: Partial<{
      characters: Character[];
      bosses: Boss[];
      enemyGroups: EnemyGroup[];
    }> = {};

    if (options.includeCharacters) {
      exportData.characters = options.selectedCharacters && options.selectedCharacters.length > 0
        ? characters.filter((char: Character) => options.selectedCharacters!.includes(char.id))
        : characters;
    }

    if (options.includeBosses) {
      exportData.bosses = options.selectedBosses && options.selectedBosses.length > 0
        ? bosses.filter((boss: Boss) => options.selectedBosses!.includes(boss.id))
        : bosses;
    }

    if (options.includeGroups) {
      exportData.enemyGroups = options.selectedGroups && options.selectedGroups.length > 0
        ? enemyGroups.filter((group: EnemyGroup) => options.selectedGroups!.includes(group.id))
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

  importState: (jsonString: string): boolean => {
    try {
      const importedData = JSON.parse(jsonString);

      if (!importedData || typeof importedData !== 'object') {
        return false;
      }

      set((state: any) => {
        const newState: any = { ...state };

        if (Array.isArray(importedData.characters)) {
          newState.characters = importedData.characters;
          localStorage.setItem('dnd-characters', JSON.stringify(importedData.characters));
        }

        if (Array.isArray(importedData.bosses)) {
          newState.bosses = importedData.bosses;
          localStorage.setItem('dnd-bosses', JSON.stringify(importedData.bosses));
        }

        if (Array.isArray(importedData.enemyGroups)) {
          newState.enemyGroups = importedData.enemyGroups;
          localStorage.setItem('dnd-enemy-groups', JSON.stringify(importedData.enemyGroups));
        }

        return newState;
      });

      setTimeout(() => get().updateTurnOrder?.(true), 0);

      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to import state:', error);
      }
      return false;
    }
  },

  importStateSelective: (jsonString: string, options: ImportOptions = {}): boolean => {
    try {
      const importedData = JSON.parse(jsonString);

      if (!importedData || typeof importedData !== 'object') {
        return false;
      }

      set((state: any) => {
        const newState: any = { ...state };

        if (Array.isArray(importedData.characters)) {
          if (options.mergeMode) {
            const existingIds = new Set(state.characters.map((c: Character) => c.id));
            const newCharacters = importedData.characters.filter(
              (c: Character) => !existingIds.has(c.id)
            );
            newState.characters = [...state.characters, ...newCharacters];
          } else {
            newState.characters = options.clearMissingCharacters
              ? importedData.characters
              : state.characters;
          }
          localStorage.setItem('dnd-characters', JSON.stringify(newState.characters));
        }

        if (Array.isArray(importedData.bosses)) {
          if (options.mergeMode) {
            const existingIds = new Set(state.bosses.map((b: Boss) => b.id));
            const newBosses = importedData.bosses.filter(
              (b: Boss) => !existingIds.has(b.id)
            );
            newState.bosses = [...state.bosses, ...newBosses];
          } else {
            newState.bosses = options.clearMissingBosses
              ? importedData.bosses
              : state.bosses;
          }
          localStorage.setItem('dnd-bosses', JSON.stringify(newState.bosses));
        }

        if (Array.isArray(importedData.enemyGroups)) {
          if (options.mergeMode) {
            const existingIds = new Set(state.enemyGroups.map((g: EnemyGroup) => g.id));
            const newGroups = importedData.enemyGroups.filter(
              (g: EnemyGroup) => !existingIds.has(g.id)
            );
            newState.enemyGroups = [...state.enemyGroups, ...newGroups];
          } else {
            newState.enemyGroups = options.clearMissingGroups
              ? importedData.enemyGroups
              : state.enemyGroups;
          }
          localStorage.setItem('dnd-enemy-groups', JSON.stringify(newState.enemyGroups));
        }

        return newState;
      });

      setTimeout(() => get().updateTurnOrder?.(true), 0);

      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to import selective state:', error);
      }
      return false;
    }
  },
});

export default createPersistenceSlice;


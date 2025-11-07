import { loadFromStorage, saveToStorage } from '../utils/storage';
import { STORAGE_KEYS } from '@constants/storage';
import { rollD20 } from '@utils/dice';
import type { Character } from '@models/entities/Character';
import type { Boss } from '@models/entities/Boss';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import type { TurnOrderEntity } from '@models/ui/TurnOrderEntity';

interface GroupCollectionEntity {
  ids: string[];
  name: string;
  type: 'groupCollection';
  initiative: number;
  baseNamePattern: string;
  totalCount: number;
  totalOriginalCount: number;
  groups: Array<{
    id: string;
    count: number;
    originalCount: number;
    currentHp: number;
    maxHp: number;
  }>;
}

type TurnOrderItem = TurnOrderEntity | GroupCollectionEntity;

interface TurnOrderState {
  turnOrder: TurnOrderItem[];
  currentTurnIndex: number;
}

interface TurnOrderActions {
  updateTurnOrder: (resetToStart?: boolean, removedId?: string | null, removedType?: string | null) => void;
  nextTurn: () => void;
  previousTurn: () => void;
  moveTurnOrderUp: (index: number) => void;
  moveTurnOrderDown: (index: number) => void;
  rollInitiative: () => void;
}

const initialTurnOrder = loadFromStorage<TurnOrderItem[]>(STORAGE_KEYS.TURN_ORDER, []);

export const createTurnOrderSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): TurnOrderState & TurnOrderActions => ({
  turnOrder: initialTurnOrder,
  currentTurnIndex: 0,

  updateTurnOrder: (resetToStart = false, removedId: string | null = null, removedType: string | null = null) => {
    set((state: any) => {
      const characters: TurnOrderEntity[] = state.characters.map((char: Character) => ({
        id: char.id,
        name: char.name,
        type: 'character' as const,
        initiative: char.initiative || 0,
      }));

      const bosses: TurnOrderEntity[] = state.bosses.map((boss: Boss) => ({
        id: boss.id,
        name: boss.name,
        type: 'boss' as const,
        initiative: boss.initiative || 0,
      }));

      const enemyGroups = state.enemyGroups.map((group: EnemyGroup) => ({
        id: group.id,
        name: group.name,
        type: 'group' as const,
        initiative: group.initiative || 0,
        currentHp: group.currentHp,
        maxHp: group.maxHp,
        count: group.count,
        originalCount: (group as any).originalCount || group.count,
      }));

      const groupedEnemies: Record<string, GroupCollectionEntity> = {};
      enemyGroups.forEach((group: any) => {
        const initiative = group.initiative;
        const baseNameMatch = group.name.match(/^(.*?)(?:\s+\d+)?$/);
        const baseName = baseNameMatch ? baseNameMatch[1].trim() : group.name;
        const key = `${initiative}-${baseName}`;

        if (!groupedEnemies[key]) {
          groupedEnemies[key] = {
            ids: [group.id],
            name: baseName,
            type: 'groupCollection',
            initiative,
            baseNamePattern: baseName,
            totalCount: group.count,
            totalOriginalCount: group.originalCount || group.count,
            groups: [
              {
                id: group.id,
                count: group.count,
                originalCount: group.originalCount || group.count,
                currentHp: group.currentHp,
                maxHp: group.maxHp,
              },
            ],
          };
        } else {
          groupedEnemies[key].ids.push(group.id);
          groupedEnemies[key].totalCount += group.count;
          groupedEnemies[key].totalOriginalCount += group.originalCount || group.count;
          groupedEnemies[key].groups.push({
            id: group.id,
            count: group.count,
            originalCount: group.originalCount || group.count,
            currentHp: group.currentHp,
            maxHp: group.maxHp,
          });
        }
      });

      const groupedEnemyArray = Object.values(groupedEnemies).filter(
        (group) => group.ids && group.ids.length > 0
      );

      const entities: TurnOrderItem[] = [...characters, ...bosses, ...groupedEnemyArray].sort(
        (a, b) => b.initiative - a.initiative
      );

      saveToStorage(STORAGE_KEYS.TURN_ORDER, entities);

      let newCurrentTurnIndex = state.currentTurnIndex;

      if (resetToStart) {
        newCurrentTurnIndex = 0;
      } else if (removedId && removedType) {
        const currentEntity = state.turnOrder[state.currentTurnIndex];
        if (currentEntity) {
          const isRemoved =
            (currentEntity.type === removedType && currentEntity.id === removedId) ||
            (currentEntity.type === 'groupCollection' &&
              removedType === 'group' &&
              currentEntity.ids &&
              currentEntity.ids.includes(removedId));

          if (isRemoved) {
            newCurrentTurnIndex = Math.min(state.currentTurnIndex, entities.length - 1);
          }
        }
      } else {
        const currentEntity = state.turnOrder[state.currentTurnIndex];
        if (currentEntity && currentEntity.type === 'groupCollection') {
          const newEntityIndex = entities.findIndex(
            (e: any) =>
              e.type === 'groupCollection' &&
              e.baseNamePattern === (currentEntity as GroupCollectionEntity).baseNamePattern &&
              e.initiative === currentEntity.initiative
          );

          if (newEntityIndex >= 0) {
            newCurrentTurnIndex = newEntityIndex;
          } else {
            newCurrentTurnIndex = Math.min(state.currentTurnIndex, entities.length - 1);
          }
        }
      }

      if (entities.length === 0) {
        newCurrentTurnIndex = 0;
      } else {
        newCurrentTurnIndex = Math.min(newCurrentTurnIndex, entities.length - 1);
      }

      return {
        turnOrder: entities,
        currentTurnIndex: newCurrentTurnIndex,
      };
    });
  },

  nextTurn: () => {
    set((state: any) => {
      if (state.turnOrder.length === 0) return state;

      const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
      const nextEntity: any = state.turnOrder[nextIndex];
      let newTargetEntity = state.targetEntity;

      if (nextEntity.type === 'groupCollection' && nextEntity.ids && nextEntity.ids.length > 0) {
        newTargetEntity = { type: 'group', id: nextEntity.ids[0] };
      }

      return {
        currentTurnIndex: nextIndex,
        targetEntity: newTargetEntity,
      };
    });
  },

  previousTurn: () => {
    set((state: any) => {
      if (state.turnOrder.length === 0) return state;

      const prevIndex = (state.currentTurnIndex - 1 + state.turnOrder.length) % state.turnOrder.length;
      const prevEntity: any = state.turnOrder[prevIndex];
      let newTargetEntity = state.targetEntity;

      if (prevEntity.type === 'groupCollection' && prevEntity.ids && prevEntity.ids.length > 0) {
        newTargetEntity = { type: 'group', id: prevEntity.ids[0] };
      }

      return {
        currentTurnIndex: prevIndex,
        targetEntity: newTargetEntity,
      };
    });
  },

  moveTurnOrderUp: (index: number) => {
    set((state: any) => {
      if (index <= 0 || index >= state.turnOrder.length) return state;

      const newTurnOrder = [...state.turnOrder];
      const temp = newTurnOrder[index];
      newTurnOrder[index] = newTurnOrder[index - 1];
      newTurnOrder[index - 1] = temp;

      saveToStorage(STORAGE_KEYS.TURN_ORDER, newTurnOrder);

      let newCurrentTurnIndex = state.currentTurnIndex;
      if (state.currentTurnIndex === index) {
        newCurrentTurnIndex = index - 1;
      } else if (state.currentTurnIndex === index - 1) {
        newCurrentTurnIndex = index;
      }

      return {
        turnOrder: newTurnOrder,
        currentTurnIndex: newCurrentTurnIndex,
      };
    });
  },

  moveTurnOrderDown: (index: number) => {
    set((state: any) => {
      if (index < 0 || index >= state.turnOrder.length - 1) return state;

      const newTurnOrder = [...state.turnOrder];
      const temp = newTurnOrder[index];
      newTurnOrder[index] = newTurnOrder[index + 1];
      newTurnOrder[index + 1] = temp;

      saveToStorage(STORAGE_KEYS.TURN_ORDER, newTurnOrder);

      let newCurrentTurnIndex = state.currentTurnIndex;
      if (state.currentTurnIndex === index) {
        newCurrentTurnIndex = index + 1;
      } else if (state.currentTurnIndex === index + 1) {
        newCurrentTurnIndex = index;
      }

      return {
        turnOrder: newTurnOrder,
        currentTurnIndex: newCurrentTurnIndex,
      };
    });
  },

  rollInitiative: () => {
    set((state: any) => {
      const updatedCharacters = state.characters.map((char: Character) => ({
        ...char,
        initiative: rollD20(),
      }));

      const updatedBosses = state.bosses.map((boss: Boss) => ({
        ...boss,
        initiative: rollD20(),
      }));

      const groupInitiativeRoll = rollD20();
      const updatedGroups = state.enemyGroups.map((group: EnemyGroup) => ({
        ...group,
        initiative: groupInitiativeRoll,
      }));

      saveToStorage(STORAGE_KEYS.CHARACTERS, updatedCharacters);
      saveToStorage(STORAGE_KEYS.BOSSES, updatedBosses);
      saveToStorage(STORAGE_KEYS.ENEMY_GROUPS, updatedGroups);

      return {
        characters: updatedCharacters,
        bosses: updatedBosses,
        enemyGroups: updatedGroups,
      };
    });

    get().updateTurnOrder(true);
  },
});

export default createTurnOrderSlice;


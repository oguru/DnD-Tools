const savedTurnOrder = localStorage.getItem('dnd-turn-order');
const initialTurnOrder = savedTurnOrder ? JSON.parse(savedTurnOrder) : [];

export const createTurnOrderSlice = (set, get) => ({
  turnOrder: initialTurnOrder,
  currentTurnIndex: 0,

  updateTurnOrder: (resetToStart = false, removedId = null, removedType = null) => {
    set((state) => {
      const characters = state.characters.map((char) => ({
        id: char.id,
        name: char.name,
        type: 'character',
        initiative: char.initiative || 0,
        currentHp: char.currentHp,
        maxHp: char.maxHp,
      }));

      const bosses = state.bosses.map((boss) => ({
        id: boss.id,
        name: boss.name,
        type: 'boss',
        initiative: boss.initiative || 0,
        currentHp: boss.currentHp,
        maxHp: boss.maxHp,
      }));

      const enemyGroups = state.enemyGroups.map((group) => ({
        id: group.id,
        name: group.name,
        type: 'group',
        initiative: group.initiative || 0,
        currentHp: group.currentHp,
        maxHp: group.maxHp,
        count: group.count,
        originalCount: group.originalCount || group.count,
      }));

      const groupedEnemies = {};
      enemyGroups.forEach((group) => {
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

      const entities = [...characters, ...bosses, ...groupedEnemyArray].sort(
        (a, b) => b.initiative - a.initiative
      );

      localStorage.setItem('dnd-turn-order', JSON.stringify(entities));

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
            (e) =>
              e.type === 'groupCollection' &&
              e.baseNamePattern === currentEntity.baseNamePattern &&
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
    set((state) => {
      if (state.turnOrder.length === 0) return state;

      const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
      const nextEntity = state.turnOrder[nextIndex];
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
    set((state) => {
      if (state.turnOrder.length === 0) return state;

      const prevIndex = (state.currentTurnIndex - 1 + state.turnOrder.length) % state.turnOrder.length;
      const prevEntity = state.turnOrder[prevIndex];
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

  moveTurnOrderUp: (index) => {
    set((state) => {
      if (index <= 0 || index >= state.turnOrder.length) return state;

      const newTurnOrder = [...state.turnOrder];
      const temp = newTurnOrder[index];
      newTurnOrder[index] = newTurnOrder[index - 1];
      newTurnOrder[index - 1] = temp;

      localStorage.setItem('dnd-turn-order', JSON.stringify(newTurnOrder));

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

  moveTurnOrderDown: (index) => {
    set((state) => {
      if (index < 0 || index >= state.turnOrder.length - 1) return state;

      const newTurnOrder = [...state.turnOrder];
      const temp = newTurnOrder[index];
      newTurnOrder[index] = newTurnOrder[index + 1];
      newTurnOrder[index + 1] = temp;

      localStorage.setItem('dnd-turn-order', JSON.stringify(newTurnOrder));

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
    set((state) => {
      const updatedCharacters = state.characters.map((char) => ({
        ...char,
        initiative: Math.floor(Math.random() * 20) + 1,
      }));

      const updatedBosses = state.bosses.map((boss) => ({
        ...boss,
        initiative: Math.floor(Math.random() * 20) + 1,
      }));

      const groupInitiativeRoll = Math.floor(Math.random() * 20) + 1;
      const updatedGroups = state.enemyGroups.map((group) => ({
        ...group,
        initiative: groupInitiativeRoll,
      }));

      localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
      localStorage.setItem('dnd-bosses', JSON.stringify(updatedBosses));
      localStorage.setItem('dnd-enemy-groups', JSON.stringify(updatedGroups));

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


import { create } from 'zustand';
import { createBossesSlice } from './slices/bossesSlice';
import { createCharactersSlice } from './slices/charactersSlice';
import { createCombatSlice } from './slices/combatSlice';
import { createGroupsSlice } from './slices/groupsSlice';
import { createPersistenceSlice } from './slices/persistenceSlice';
import { createTurnOrderSlice } from './slices/turnOrderSlice';
import { createUiSlice } from './slices/uiSlice';
import { createUtilitySlice } from './slices/utilitySlice';

const useDnDStore = create((set, get) => ({
  ...createCharactersSlice(set, get),
  ...createBossesSlice(set, get),
  ...createGroupsSlice(set, get),
  ...createTurnOrderSlice(set, get),
  ...createUiSlice(set, get),
  ...createCombatSlice(set, get),
  ...createPersistenceSlice(set, get),
  ...createUtilitySlice(set, get),
}));

export default useDnDStore; 


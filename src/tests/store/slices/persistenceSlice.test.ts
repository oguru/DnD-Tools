import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Boss } from '@models/entities/Boss';
import type { Character } from '@models/entities/Character';
import type { EnemyGroup } from '@models/entities/EnemyGroup';
import type { SpyInstance } from 'vitest';
import { createPersistenceSlice } from '@/store/slices/persistenceSlice';

describe('persistenceSlice', () => {
  let state: any;
  let set: any;
  let get: any;
  let slice: any;

  beforeEach(() => {
    vi.useFakeTimers();
    state = {
      characters: [
        { id: 'char-1', name: 'Hero', currentHp: 20, maxHp: 25 } as Character,
      ],
      bosses: [
        { id: 'boss-1', name: 'Dragon', currentHp: 200, maxHp: 220 } as Boss,
      ],
      enemyGroups: [
        { id: 'group-1', name: 'Goblins', count: 3, originalCount: 3 } as EnemyGroup,
      ],
      updateTurnOrder: vi.fn(),
    };

    set = vi.fn((fn: any) => {
      const updates = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...updates };
      return updates;
    });

    get = vi.fn(() => state);

    slice = createPersistenceSlice(set, get);

    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('exports the full state as a downloadable JSON file', () => {
    const realCreateElement = document.createElement.bind(document);
    let clickSpy: SpyInstance | undefined;

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = realCreateElement(tagName);
      if (tagName === 'a') {
        clickSpy = vi.spyOn(element, 'click').mockImplementation(() => {});
      }
      return element;
    });

    const exported = slice.exportState();

    expect(exported).toBe(true);
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(clickSpy).toBeDefined();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('imports full state and schedules a turn order refresh', () => {
    const newState = {
      characters: [{ id: 'char-2', name: 'Wizard', currentHp: 18, maxHp: 18 }],
      bosses: [{ id: 'boss-2', name: 'Lich', currentHp: 120, maxHp: 120 }],
      enemyGroups: [{ id: 'group-2', name: 'Skeletons', count: 4, originalCount: 4 }],
    };

    const success = slice.importState(JSON.stringify(newState));

    expect(success).toBe(true);
    expect(state.characters).toEqual(newState.characters);
    expect(state.bosses).toEqual(newState.bosses);
    expect(state.enemyGroups).toEqual(newState.enemyGroups);
    expect(localStorage.getItem('dnd-characters')).not.toBeNull();

    vi.runAllTimers();
    expect(state.updateTurnOrder).toHaveBeenCalledWith(true);
  });

  it('merges selective imports without duplicating existing entities', () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

    const importPayload = {
      characters: [
        { id: 'char-1', name: 'Hero', currentHp: 20, maxHp: 25 },
        { id: 'char-3', name: 'Cleric', currentHp: 16, maxHp: 16 },
      ],
      bosses: [
        { id: 'boss-3', name: 'Hydra', currentHp: 300, maxHp: 300 },
      ],
    };

    const merged = slice.importStateSelective(JSON.stringify(importPayload), {
      mergeMode: true,
    });

    expect(merged).toBe(true);
    expect(state.characters).toHaveLength(2);
    expect(state.characters.some((c: Character) => c.id === 'char-3')).toBe(true);
    expect(state.bosses.some((b: Boss) => b.id === 'boss-3')).toBe(true);
    expect(setItemSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();

    vi.runAllTimers();
    expect(state.updateTurnOrder).toHaveBeenCalledWith(true);
  });
});


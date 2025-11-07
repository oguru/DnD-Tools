import '@testing-library/jest-dom';

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import CharacterSection from '@/components/CharacterSection';
import useDnDStore from '@/store/dndStore';

vi.mock('@/store/dndStore', () => {
  const { create } = require('zustand');
  return {
    __esModule: true,
    default: create((set: any) => ({
      characters: [],
      expandedSections: {
        characters: true,
        bosses: false,
        groups: false,
        damage: false,
        results: false,
        turnOrder: false,
      },
      updateCharacter: (id: string, field: string, value: any) =>
        set((state: any) => ({
          characters: state.characters.map((char: any) =>
            char.id === id ? { ...char, [field]: value } : char
          ),
        })),
      removeCharacter: () => {},
      addCharacter: () => {},
      resetCharacters: () => {},
      clearTemporaryHitPoints: () => {},
      calculateHealthPercentage: (current: number, max: number) =>
        max ? Math.round((current / max) * 100) : 0,
      getHealthColour: () => '#00ff00',
      setTargetEntity: () => {},
      targetEntity: null,
      scrollToDamageSection: () => {},
      toggleCharacterAoeTarget: () => {},
      setCharactersSectionRef: () => {},
      registerEntityRef: () => {},
      setGroupsSectionRef: () => {},
      bosses: [],
      enemyGroups: [],
    })),
  };
});




beforeEach(() => {
  useDnDStore.setState({
    characters: [
      {
        id: 'char-1',
        name: 'Alice',
        currentHp: 10,
        tempHp: 0,
        maxHp: 12,
        ac: 15,
        initiative: 0,
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
      },
    ],
  });
});

describe('CharacterSection component', () => {
  it('allows toggling resistances exclusively', () => {
    render(<CharacterSection />);

    fireEvent.click(screen.getByTitle('Toggle defenses editor'));
    fireEvent.click(screen.getByTitle('Add fire resistance'));

    let state = useDnDStore.getState();
    expect(state.characters[0].defenses?.resistances).toContain('fire');

    fireEvent.click(screen.getByTitle('Remove fire resistance'));

    state = useDnDStore.getState();
    expect(state.characters[0].defenses?.resistances).not.toContain('fire');
  });
});



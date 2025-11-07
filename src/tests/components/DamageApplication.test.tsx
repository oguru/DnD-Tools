import '@testing-library/jest-dom';

import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import DamageApplication from '../../components/DamageApplication';
import useDnDStore from '../../store/dndStore';

const resetStore = () => {
  act(() => {
    useDnDStore.setState({
      characters: [],
      bosses: [],
      enemyGroups: [],
      attackResults: [],
      aoeDamageParams: null,
      expandedSections: {
        characters: true,
        bosses: true,
        groups: true,
        damage: true,
        results: true,
        turnOrder: true,
      },
    });
  });
};

describe('DamageApplication enemy groups display', () => {
  beforeEach(() => {
    resetStore();
  });

  it('shows groups for healing when creatures have currentHp remaining', () => {
    const group = {
      id: 'group-1',
      name: 'Orc Squad',
      maxHp: 15,
      currentHp: 15,
      ac: 13,
      count: 1,
      originalCount: 1,
      initiative: 0,
      inAoe: false,
      tempHp: 0,
      defenses: {
        resistances: [],
        vulnerabilities: [],
        immunities: [],
      },
      savingThrows: undefined,
      creatures: [
        {
          id: 'group-1-creature-0',
          currentHp: 5,
          tempHp: 0,
          isRemoved: false,
        },
      ],
    };

    act(() => {
      useDnDStore.setState({ enemyGroups: [group] });
    });

    render(<DamageApplication />);

    expect(screen.getByText('Orc Squad')).toBeInTheDocument();
    expect(screen.getByText('5/15 HP (Total)')).toBeInTheDocument();

    const creatureIndicator = screen.getByTitle('Creature 1: 5/15 HP');
    expect(creatureIndicator).toBeInTheDocument();
    const bar = creatureIndicator.querySelector('.creature-hp-bar') as HTMLElement;
    expect(bar).not.toBeNull();
    const width = parseFloat(bar.style.width);
    expect(width).toBeCloseTo(Math.floor((5 / 15) * 100), 1);
  });
});



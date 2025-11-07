import '@testing-library/jest-dom';

import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import TurnOrder from '@/components/TurnOrder';
import useDnDStore from '@/store/dndStore';

vi.mock('@/store/dndStore', () => {
  const { create } = require('zustand');
  return {
    __esModule: true,
    default: create(() => ({
      turnOrder: [] as any[],
      currentTurnIndex: 0,
      expandedSections: {
        characters: true,
        bosses: true,
        groups: true,
        damage: true,
        results: true,
        turnOrder: true,
      },
      toggleSection: () => {},
      nextTurn: () => {},
      previousTurn: () => {},
      moveTurnOrderUp: () => {},
      moveTurnOrderDown: () => {},
      updateTurnOrder: () => {},
      rollInitiative: () => {},
      scrollToEntity: () => {},
      calculateHealthPercentage: (current: number, max: number) =>
        max ? Math.round((current / max) * 100) : 0,
      getHealthColour: () => '#00ff00',
      registerEntityRef: () => {},
      setCharactersSectionRef: () => {},
      setGroupsSectionRef: () => {},
    })),
  };
});




beforeEach(() => {
  useDnDStore.setState({
    turnOrder: [],
    currentTurnIndex: 0,
  });
});

describe('TurnOrder component', () => {
  it('renders HP information for characters', () => {
    useDnDStore.setState({
      turnOrder: [
        {
          id: 'char-1',
          name: 'Alice',
          type: 'character',
          initiative: 12,
          currentHp: 8,
          maxHp: 12,
        },
      ],
    });

    render(<TurnOrder />);

    // HP is displayed twice: once in current turn section and once in turn order list
    const hpElements = screen.getAllByText('8/12 HP');
    expect(hpElements.length).toBe(2);
    expect(hpElements[0]).toBeInTheDocument();
  });

  it('renders group collection badges', () => {
    useDnDStore.setState({
      turnOrder: [
        {
          id: 'collection-1',
          name: 'Wolves',
          type: 'groupCollection',
          initiative: 10,
          totalCount: 3,
          totalOriginalCount: 5,
          baseNamePattern: 'Wolves',
          ids: ['wolf-1', 'wolf-2'],
          groups: [
            { id: 'wolf-1', count: 2, originalCount: 3, currentHp: 5, maxHp: 7 },
            { id: 'wolf-2', count: 1, originalCount: 2, currentHp: 4, maxHp: 7 },
          ],
        },
      ],
    });

    render(<TurnOrder />);

    // Group badges are displayed twice: once in current turn section and once in turn order list
    const groupBadges = screen.getAllByText('2');
    expect(groupBadges.length).toBeGreaterThanOrEqual(2);
    const oneBadges = screen.getAllByText('1');
    expect(oneBadges.length).toBeGreaterThanOrEqual(2); // Displayed twice + turn number
  });
});



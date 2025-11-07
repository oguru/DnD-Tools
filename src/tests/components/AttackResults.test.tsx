import '@testing-library/jest-dom';

import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import AttackResults from '@/components/AttackResults';
import useDnDStore from '@/store/dndStore';

describe('AttackResults', () => {
  beforeEach(() => {
    useDnDStore.setState({
      attackResults: [],
      expandedSections: { results: true },
    });
  });

  it('renders formatted combat damage messages', () => {
    useDnDStore.setState({
      attackResults: [
        {
          id: 'result-1',
          message: 'Damage: 12 slashing',
          timestamp: Date.now(),
        },
      ],
    });

    render(<AttackResults />);

    const damageElement = screen.getByText(/Damage:/i);
    expect(damageElement.innerHTML).toContain('damage-number');
  });

  it('groups healing results by transaction prefix', () => {
    const timestamp = Date.now();
    useDnDStore.setState({
      attackResults: [
        { id: 'healing-123-a', message: 'Healing! +5 HP for Alice', timestamp },
        { id: 'healing-123-b', message: 'Healing! +6 HP for Bob', timestamp },
      ],
    });

    render(<AttackResults />);

    expect(screen.getByText(/Healing applied to multiple entities/)).toBeInTheDocument();
  });
});



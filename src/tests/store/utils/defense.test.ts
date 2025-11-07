import { describe, expect, it } from 'vitest';

import { toggleExclusiveDefense } from '@/store/utils/defense';

describe('defense utils', () => {
  it('adds a defense to an empty set', () => {
    const result = toggleExclusiveDefense(undefined, 'resistances', 'fire');
    expect(result.resistances).toContain('fire');
  });

  it('removes an existing defense when toggled again', () => {
    const result = toggleExclusiveDefense(
      { resistances: ['cold'] },
      'resistances',
      'cold'
    );
    expect(result.resistances).not.toContain('cold');
  });

  it('enforces exclusivity across categories', () => {
    const result = toggleExclusiveDefense(
      {
        resistances: ['lightning'],
        vulnerabilities: ['cold'],
        immunities: [],
      },
      'immunities',
      'lightning'
    );

    expect(result.resistances).not.toContain('lightning');
    expect(result.immunities).toContain('lightning');
  });
});



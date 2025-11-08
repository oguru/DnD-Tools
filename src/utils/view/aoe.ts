/**
 * View utilities for AOE damage application UI
 */

export const DAMAGE_TYPES = [
  { key: 'slashing', label: 'Slashing', icon: '🪓' },
  { key: 'piercing', label: 'Piercing', icon: '🗡️' },
  { key: 'bludgeoning', label: 'Bludgeoning', icon: '🔨' },
  { key: 'fire', label: 'Fire', icon: '🔥' },
  { key: 'cold', label: 'Cold', icon: '❄️' },
  { key: 'lightning', label: 'Lightning', icon: '⚡' },
  { key: 'thunder', label: 'Thunder', icon: '🌩️' },
  { key: 'acid', label: 'Acid', icon: '🧪' },
  { key: 'poison', label: 'Poison', icon: '☠️' },
  { key: 'psychic', label: 'Psychic', icon: '🧠' },
  { key: 'necrotic', label: 'Necrotic', icon: '💀' },
  { key: 'radiant', label: 'Radiant', icon: '✨' },
  { key: 'force', label: 'Force', icon: '💥' },
];

export const DAMAGE_TYPE_LOOKUP = DAMAGE_TYPES.reduce((acc, dt) => {
  acc[dt.key] = dt;
  return acc;
}, {} as Record<string, { key: string; label: string; icon: string }>);

/**
 * Format a list of entities for display in AOE target selection
 */
export const formatAoeEntities = (entities: any[], type: string) => {
  return entities
    .filter((e) => e.inAoe)
    .map((e) => ({
      id: e.id,
      name: e.name,
      type,
      key: `${type}-${e.id}`,
    }));
};

/**
 * Calculate total damage for an entity based on modifiers
 */
export const calculateModifiedDamage = (
  baseDamage: number,
  modifier: 'full' | 'half' | 'quarter' | 'none',
  adjustment: number = 0
): number => {
  let damage = baseDamage;

  switch (modifier) {
    case 'half':
      damage = Math.floor(baseDamage / 2);
      break;
    case 'quarter':
      damage = Math.floor(baseDamage / 4);
      break;
    case 'none':
      damage = 0;
      break;
    case 'full':
    default:
      damage = baseDamage;
  }

  return Math.max(0, damage + adjustment);
};

/**
 * Get save result text for display
 */
export const getSaveResultText = (
  saved: boolean,
  halfOnSave: boolean,
  roll?: number,
  bonus?: number
): string => {
  const rollText = roll !== undefined && bonus !== undefined 
    ? ` (${roll + bonus}${bonus > 0 ? `+${bonus}` : bonus < 0 ? bonus : ''})` 
    : '';

  if (saved) {
    return halfOnSave ? `Save${rollText} (½ dmg)` : `Save${rollText} (no dmg)`;
  }
  return `Failed${rollText}`;
};




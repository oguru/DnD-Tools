interface DamageApplication {
  remainingDamage: number;
  newCurrentHp: number;
  newTempHp: number;
}

export const applyDamageWithTempHp = (
  damage: number,
  currentHp: number,
  tempHp: number
): DamageApplication => {
  if (damage <= 0) {
    return { remainingDamage: 0, newCurrentHp: currentHp, newTempHp: tempHp };
  }

  let remainingDamage = damage;
  let newTempHp = tempHp;

  if (newTempHp > 0) {
    if (newTempHp >= remainingDamage) {
      newTempHp -= remainingDamage;
      remainingDamage = 0;
    } else {
      remainingDamage -= newTempHp;
      newTempHp = 0;
    }
  }

  const newCurrentHp = Math.max(0, currentHp - remainingDamage);

  return { remainingDamage, newCurrentHp, newTempHp };
};

export const applyHealing = (
  healing: number,
  currentHp: number,
  maxHp: number
): number => {
  if (healing <= 0) return currentHp;
  return Math.min(maxHp, currentHp + healing);
};

export const setTempHp = (
  amount: number,
  existingTempHp: number,
  replace: boolean
): number => {
  if (amount < 0) return existingTempHp;
  if (replace) return amount;
  return existingTempHp + amount;
};

interface SaveResult {
  succeeded: boolean;
  roll: number;
  modifier: number;
  total: number;
}

export const rollSave = (
  saveModifier: number,
  rollFn: () => number = () => Math.floor(Math.random() * 20) + 1
): SaveResult => {
  const roll = rollFn();
  const total = roll + saveModifier;
  return {
    succeeded: false,
    roll,
    modifier: saveModifier,
    total,
  };
};

export const checkSave = (saveResult: SaveResult, dc: number): boolean => {
  return saveResult.total >= dc;
};

export const calculateSaveDamage = (
  baseDamage: number,
  saved: boolean,
  halfOnSave: boolean
): number => {
  if (!saved) return baseDamage;
  if (halfOnSave) return Math.floor(baseDamage / 2);
  return 0;
};


export const rollDie = (sides: number = 6): number => {
  if (sides < 1) return 1;
  return Math.floor(Math.random() * sides) + 1;
};

export const rollDice = (numDice: number = 1, sides: number = 6): number => {
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += rollDie(sides);
  }
  return total;
};

export const rollD20 = (
  hasAdvantage: boolean = false,
  hasDisadvantage: boolean = false
): number => {
  if (hasAdvantage && !hasDisadvantage) {
    const roll1 = rollDie(20);
    const roll2 = rollDie(20);
    return Math.max(roll1, roll2);
  }

  if (hasDisadvantage && !hasAdvantage) {
    const roll1 = rollDie(20);
    const roll2 = rollDie(20);
    return Math.min(roll1, roll2);
  }

  return rollDie(20);
};

export const rollDamage = (
  numDice: number,
  diceType: number,
  modifier: number = 0
): number => {
  const diceResult = rollDice(numDice, diceType);
  return diceResult + modifier;
};

interface SavingThrowResult {
  roll: number;
  modifier: number;
  total: number;
}

export const rollSavingThrow = (
  modifier: number,
  hasAdvantage: boolean = false,
  hasDisadvantage: boolean = false
): SavingThrowResult => {
  const baseRoll = rollD20(hasAdvantage, hasDisadvantage);
  return {
    roll: baseRoll,
    modifier,
    total: baseRoll + modifier,
  };
};

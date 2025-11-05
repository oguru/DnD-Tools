export const createUtilitySlice = () => ({
  calculateHealthPercentage: (current, max) => {
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  },

  calculateGroupTotalCurrentHP: (group) => {
    if (!group) return 0;

    if (group.creatures && Array.isArray(group.creatures)) {
      return group.creatures.reduce((sum, creature) => sum + creature.hp, 0);
    }

    return group.count * group.currentHp;
  },

  getHealthColor: (percentage) => {
    if (percentage > 50) {
      return '#38a169';
    } else if (percentage > 25) {
      return '#dd6b20';
    }
    return '#e53e3e';
  },

  rollD20: (hasAdvantage = false, hasDisadvantage = false) => {
    if (hasAdvantage && !hasDisadvantage) {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      return Math.max(roll1, roll2);
    }

    if (hasDisadvantage && !hasAdvantage) {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      return Math.min(roll1, roll2);
    }

    return Math.floor(Math.random() * 20) + 1;
  },

  rollDice: (numDice, diceType) => {
    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * diceType) + 1;
    }
    return total;
  },
});

export default createUtilitySlice;


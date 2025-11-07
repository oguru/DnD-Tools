import { clamp } from './numbers';
import type { Defenses } from '@models/common/Defenses';
import type { SavingThrows } from '@models/common/SavingThrows';
import type { BossAttack } from '@models/combat/BossAttack';
import { COMBAT_DEFAULTS } from '@constants/combat';

const DEFAULT_DEFENSES: Defenses = {
  resistances: [],
  vulnerabilities: [],
  immunities: [],
};

const DEFAULT_SAVING_THROWS: SavingThrows = {
  str: 0,
  dex: 0,
  con: 0,
  int: 0,
  wis: 0,
  cha: 0,
};

export const normalizeDefenses = (
  defenses?: Partial<Defenses>
): Defenses => {
  return {
    resistances: defenses?.resistances || [],
    vulnerabilities: defenses?.vulnerabilities || [],
    immunities: defenses?.immunities || [],
  };
};

export const normalizeSavingThrows = (
  saves?: Partial<SavingThrows>
): SavingThrows => {
  return {
    str: saves?.str ?? 0,
    dex: saves?.dex ?? 0,
    con: saves?.con ?? 0,
    int: saves?.int ?? 0,
    wis: saves?.wis ?? 0,
    cha: saves?.cha ?? 0,
  };
};

export const normalizeBossAttack = (attack: BossAttack): BossAttack => {
  if (!attack.usesCharges) {
    return {
      ...attack,
      isRemoved: !!attack.isRemoved,
    };
  }

  const maxCharges = clamp(
    attack.maxCharges || COMBAT_DEFAULTS.MIN_CHARGES,
    COMBAT_DEFAULTS.MIN_CHARGES,
    COMBAT_DEFAULTS.MAX_CHARGES
  );

  const chargesRemaining =
    typeof attack.chargesRemaining === 'number'
      ? clamp(attack.chargesRemaining, 0, maxCharges)
      : maxCharges;

  return {
    ...attack,
    maxCharges,
    chargesRemaining,
    isRemoved: !!attack.isRemoved,
  };
};


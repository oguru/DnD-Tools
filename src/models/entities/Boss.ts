import type { Defenses, SavingThrows } from '../common';
import type { BossAttack } from '../combat';

export interface Boss {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  ac: number;
  initiative: number;
  inAoe: boolean;
  attacks: BossAttack[];
  defenses: Defenses;
  savingThrows?: SavingThrows;
}


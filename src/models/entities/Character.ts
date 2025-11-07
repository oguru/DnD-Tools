import type { Defenses, SavingThrows } from '../common';

export interface Character {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  ac: number;
  initiative: number;
  inAoe: boolean;
  defenses: Defenses;
  savingThrows?: SavingThrows;
}


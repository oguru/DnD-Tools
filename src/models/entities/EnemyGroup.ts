import type { Defenses, SavingThrows } from '../common';
import type { Creature } from './Creature';

export interface EnemyGroup {
  id: string;
  name: string;
  count: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  ac: number;
  initiative: number;
  inAoe: boolean;
  creatures: Creature[];
  defenses: Defenses;
  savingThrows?: SavingThrows;
}


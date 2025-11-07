import type { DamageComponent } from './DamageComponent';
import type { SaveType } from '../common/SavingThrows';

export interface BossAttack {
  id: string;
  name: string;
  bonus: number;
  damageComponents: DamageComponent[];
  maxCharges?: number;
  chargesRemaining?: number;
  isRemoved?: boolean;
  usesCharges?: boolean;
  numDice?: number;
  diceType?: number;
  modifier?: number;
  damageType?: string;
  saveType?: SaveType;
  saveDC?: number;
  halfOnSave?: boolean;
}


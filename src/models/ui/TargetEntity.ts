export interface TargetEntity {
  id: string;
  name: string;
  type: 'character' | 'boss' | 'group';
  ac: number;
  currentHp: number;
  maxHp: number;
}


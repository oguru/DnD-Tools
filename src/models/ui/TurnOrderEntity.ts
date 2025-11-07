export interface TurnOrderEntity {
  id: string;
  name: string;
  initiative: number;
  type: 'character' | 'boss' | 'group';
  currentHp?: number;
  maxHp?: number;
  count?: number;
  originalCount?: number;
}


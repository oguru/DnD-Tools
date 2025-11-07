export interface AttackResult {
  id: string;
  timestamp: number;
  message: string;
  damage?: number;
  healing?: number;
  targetName?: string;
  targetId?: string;
  targetType?: 'character' | 'boss' | 'group';
  characterId?: string;
  bossId?: string;
  groupId?: string;
  isHealing?: boolean;
  isAoE?: boolean;
  isCritical?: boolean;
  isMiss?: boolean;
}


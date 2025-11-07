import { generateId } from './ids';
import type { AttackResult } from '@models/combat/AttackResult';

export const createDamageResult = (
  damage: number,
  targetName: string,
  targetId: string,
  targetType: 'character' | 'boss' | 'group',
  hitStatus: 'hit' | 'miss' | 'critical' = 'hit',
  modifierText: string = ''
): AttackResult => {
  const messages: Record<typeof hitStatus, string> = {
    miss: 'Miss!',
    critical: `Critical hit! ${damage} damage to ${targetName}${modifierText}`,
    hit: `Hit! ${damage} damage to ${targetName}${modifierText}`,
  };

  const result: AttackResult = {
    id: generateId(),
    damage: hitStatus === 'miss' ? 0 : damage,
    hitStatus,
    message: messages[hitStatus],
    timestamp: Date.now(),
  };

  if (targetType === 'character') result.characterId = targetId;
  else if (targetType === 'boss') result.bossId = targetId;
  else if (targetType === 'group') result.groupId = targetId;

  return result;
};

export const createHealingResult = (
  healing: number,
  targetName: string,
  targetId: string,
  targetType: 'character' | 'boss' | 'group',
  transactionId?: string
): AttackResult => {
  const id = transactionId ? `${transactionId}-${targetId}` : generateId();

  const result: AttackResult = {
    id,
    healing,
    message: `Healing! ${healing} healing to ${targetName}`,
    isHealing: true,
    timestamp: Date.now(),
  };

  if (targetType === 'character') result.characterId = targetId;
  else if (targetType === 'boss') result.bossId = targetId;
  else if (targetType === 'group') result.groupId = targetId;

  return result;
};

export const createAoeResult = (
  damage: number,
  message: string
): AttackResult => {
  return {
    id: generateId(),
    damage,
    message,
    isAoE: true,
    timestamp: Date.now(),
  };
};


export interface FormatMessageOptions {
  isHealing?: boolean;
}

const damagePattern = /(Damage: )(\d+)( \w+)/g;
const totalDamagePattern = /(Total Damage: )(\d+)( \w+)/g;

const injectLineBreaksForAoe = (message: string): string =>
  message
    .replace(/\n/g, '<br />')
    .replace(/; /g, ';<br />')
    .replace(/(to bosses - |to groups - |to characters - )/g, '$1<br />');

const highlightDamageNumbers = (message: string): string =>
  message
    .replace(/(\d+)( damage)/g, '<span class="damage-number">$1</span>$2')
    .replace(/(damage: )(\d+)/gi, '$1<span class="damage-number">$2</span>')
    .replace(/(\d+)( dmg)/g, '<span class="damage-number">$1</span>$2');

const highlightHealingNumbers = (message: string): string =>
  message.replace(/(\d+)( healing)/g, '<span class="healing-number">$1</span>$2');

const highlightPrimaryDamageBlocks = (message: string): string =>
  message
    .replace(damagePattern, '$1<span class="damage-number">$2</span>$3')
    .replace(totalDamagePattern, '$1<span class="damage-number">$2</span>$3');

/**
 * Formats a combat log message with consistent highlighting and AoE formatting.
 * @param input Original message string
 * @param options Additional formatting flags
 */
export const formatCombatLogMessage = (
  input: string,
  options: FormatMessageOptions = {}
): string => {
  if (!input) return '';

  const isHealing = options.isHealing ?? input.includes('Healing!');

  let formatted = highlightPrimaryDamageBlocks(input);

  formatted = isHealing ? highlightHealingNumbers(formatted) : highlightDamageNumbers(formatted);

  if (formatted.toLowerCase().includes('aoe')) {
    formatted = injectLineBreaksForAoe(formatted);
  }

  return formatted;
};

export interface CombatResultLike {
  id: string;
  message: string;
  timestamp?: number;
}

/**
 * Groups results by a “healing-<timestamp>” prefix and creates a combined entry for batch transactions.
 */
export const groupCombatResultsByTransaction = <T extends CombatResultLike>(
  results: T[]
): T[] => {
  const grouped: T[] = [];
  const processed = new Set<string>();

  results.forEach((result) => {
    if (processed.has(result.id)) return;

    const idParts = result.id.split('-');
    const isHealingTransaction = idParts.length >= 2 && idParts[0] === 'healing';

    if (!isHealingTransaction) {
      grouped.push(result);
      processed.add(result.id);
      return;
    }

    const transactionPrefix = `${idParts[0]}-${idParts[1]}`;
    const relatedResults = results.filter(
      (entry) => entry.id.startsWith(transactionPrefix) && !processed.has(entry.id)
    );

    if (relatedResults.length > 1) {
      const combined: T = {
        ...result,
        id: transactionPrefix,
        message: `Healing applied to multiple entities: \n${relatedResults
          .map((entry) => entry.message.replace('Healing! ', ''))
          .join('\n')}`,
        timestamp: result.timestamp,
      };

      relatedResults.forEach((entry) => processed.add(entry.id));
      grouped.push(combined);
    } else {
      processed.add(result.id);
      grouped.push(result);
    }
  });

  return grouped;
};



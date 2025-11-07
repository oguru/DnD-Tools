export type DefenseCategory = 'resistances' | 'vulnerabilities' | 'immunities';

export interface DefensesMap {
  resistances?: string[];
  vulnerabilities?: string[];
  immunities?: string[];
}

const removeFromList = (list: string[] = [], value: string) =>
  list.filter((item) => item !== value);

export const toggleExclusiveDefense = (
  defenses: DefensesMap | undefined,
  category: DefenseCategory,
  damageType: string
): DefensesMap => {
  const safeDefenses: Required<DefensesMap> = {
    resistances: [...(defenses?.resistances ?? [])],
    vulnerabilities: [...(defenses?.vulnerabilities ?? [])],
    immunities: [...(defenses?.immunities ?? [])],
  };

  switch (category) {
    case 'resistances':
      safeDefenses.vulnerabilities = removeFromList(safeDefenses.vulnerabilities, damageType);
      safeDefenses.immunities = removeFromList(safeDefenses.immunities, damageType);
      safeDefenses.resistances = safeDefenses.resistances.includes(damageType)
        ? removeFromList(safeDefenses.resistances, damageType)
        : [...safeDefenses.resistances, damageType];
      break;
    case 'vulnerabilities':
      safeDefenses.resistances = removeFromList(safeDefenses.resistances, damageType);
      safeDefenses.immunities = removeFromList(safeDefenses.immunities, damageType);
      safeDefenses.vulnerabilities = safeDefenses.vulnerabilities.includes(damageType)
        ? removeFromList(safeDefenses.vulnerabilities, damageType)
        : [...safeDefenses.vulnerabilities, damageType];
      break;
    case 'immunities':
      safeDefenses.resistances = removeFromList(safeDefenses.resistances, damageType);
      safeDefenses.vulnerabilities = removeFromList(safeDefenses.vulnerabilities, damageType);
      safeDefenses.immunities = safeDefenses.immunities.includes(damageType)
        ? removeFromList(safeDefenses.immunities, damageType)
        : [...safeDefenses.immunities, damageType];
      break;
    default:
      return defenses ?? {};
  }

  return safeDefenses;
};



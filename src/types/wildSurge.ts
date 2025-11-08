export interface WildSurgeEntry {
  effect: string;
  description: string;
  duration: string | number;
  permanent?: boolean;
}

export interface DiseaseEntry {
  label: string;
  description: string;
  link?: string;
  linkText?: string;
}

export type WildSurgeTable = Record<number, WildSurgeEntry>;
export type DiseaseTable = Record<number, DiseaseEntry>;


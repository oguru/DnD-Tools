import React from 'react';

type DamageType = 'slashing' | 'piercing' | 'bludgeoning' | 'fire' | 'cold' | 'lightning' | 
                  'thunder' | 'acid' | 'poison' | 'psychic' | 'necrotic' | 'radiant' | 'force';

interface DamageTypeInfo {
  label: string;
  icon: string;
}

// Damage types and icons mapping
const DAMAGE_TYPES: Record<DamageType, DamageTypeInfo> = {
  slashing: { label: 'Slashing', icon: '🪓' },
  piercing: { label: 'Piercing', icon: '🗡️' },
  bludgeoning: { label: 'Bludgeoning', icon: '🔨' },
  fire: { label: 'Fire', icon: '🔥' },
  cold: { label: 'Cold', icon: '❄️' },
  lightning: { label: 'Lightning', icon: '⚡' },
  thunder: { label: 'Thunder', icon: '🌩️' },
  acid: { label: 'Acid', icon: '🧪' },
  poison: { label: 'Poison', icon: '☠️' },
  psychic: { label: 'Psychic', icon: '🧠' },
  necrotic: { label: 'Necrotic', icon: '💀' },
  radiant: { label: 'Radiant', icon: '✨' },
  force: { label: 'Force', icon: '💥' }
};

interface Defenses {
  immunities?: string[];
  resistances?: string[];
  vulnerabilities?: string[];
}

interface DefenseIconsProps {
  defenses?: Defenses | null;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Renders defense icons for immunities, resistances, and vulnerabilities
 */
const DefenseIcons: React.FC<DefenseIconsProps> = ({ defenses, style, className }) => {
  if (!defenses) return null;
  
  const { immunities = [], resistances = [], vulnerabilities = [] } = defenses;
  
  if (immunities.length === 0 && resistances.length === 0 && vulnerabilities.length === 0) {
    return null;
  }
  
  return (
    <div 
      className={`defense-icons ${className || ''}`} 
      style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px', ...style }}
    >
      {immunities.map((key) => {
        const dt = DAMAGE_TYPES[key as DamageType];
        if (!dt) return null;
        return (
          <span 
            key={`imm-${key}`} 
            className="defense-icon immunity" 
            title={`Immune: ${dt.label}`}
            style={{ fontSize: '1rem' }}
          >
            {dt.icon}
          </span>
        );
      })}
      {resistances.map((key) => {
        const dt = DAMAGE_TYPES[key as DamageType];
        if (!dt) return null;
        return (
          <span 
            key={`res-${key}`} 
            className="defense-icon resistance" 
            title={`Resistant: ${dt.label}`}
            style={{ fontSize: '1rem' }}
          >
            {dt.icon}
          </span>
        );
      })}
      {vulnerabilities.map((key) => {
        const dt = DAMAGE_TYPES[key as DamageType];
        if (!dt) return null;
        return (
          <span 
            key={`vuln-${key}`} 
            className="defense-icon vulnerability" 
            title={`Vulnerable: ${dt.label}`}
            style={{ fontSize: '1rem' }}
          >
            {dt.icon}
          </span>
        );
      })}
    </div>
  );
};

export default DefenseIcons;
export { DAMAGE_TYPES };
export type { DamageType, DamageTypeInfo, Defenses, DefenseIconsProps };


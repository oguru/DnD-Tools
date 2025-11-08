import React, { useState } from 'react';
import DefenseIcons from '../shared/DefenseIcons';
import type { Character } from '../../models/entities/Character';
import type { Boss } from '../../models/entities/Boss';
import type { EnemyGroup } from '../../models/entities/EnemyGroup';
import type { TargetEntity } from '../../models/ui/TargetEntity';
import type { Defenses } from '../../models/common/Defenses';

interface SingleTargetState {
  attackRoll: string;
  damageAmount: string;
  criticalHit: boolean;
  advantage: boolean;
  disadvantage: boolean;
}

interface TargetDetails {
  name: string;
  type: 'character' | 'boss' | 'group';
  ac?: number;
  defenses?: Defenses;
}

type HitStatus = 'hit' | 'miss' | 'critical';

interface SingleTargetDamageProps {
  targetEntity: TargetEntity | null;
  characters: Character[];
  bosses: Boss[];
  enemyGroups: EnemyGroup[];
  applyDamageToGroup: (id: string, damage: number, hitStatus: HitStatus) => void;
  applyDamageToCharacter: (id: string, damage: number, hitStatus: HitStatus, damageType: string) => void;
  applyDamageToBoss: (id: string, damage: number, hitStatus: HitStatus) => void;
}

const SingleTargetDamage: React.FC<SingleTargetDamageProps> = ({ 
  targetEntity, 
  characters, 
  bosses, 
  enemyGroups,
  applyDamageToGroup,
  applyDamageToCharacter,
  applyDamageToBoss
}) => {
  const [singleTargetState, setSingleTargetState] = useState<SingleTargetState>({
    attackRoll: '',
    damageAmount: '',
    criticalHit: false,
    advantage: false,
    disadvantage: false
  });

  // Get the currently targeted entity details
  const getTargetDetails = (): TargetDetails | null => {
    if (!targetEntity) return null;
    
    if (targetEntity.type === 'group') {
      const group = enemyGroups.find(g => g.id === targetEntity.id);
      if (group) {
        return {
          name: `${group.name} (x${group.count})`,
          type: 'group',
          ac: group.ac,
          defenses: group.defenses
        };
      }
    } else if (targetEntity.type === 'boss') {
      const boss = bosses.find(b => b.id === targetEntity.id);
      if (boss) {
        return {
          name: boss.name,
          type: 'boss',
          ac: boss.ac,
          defenses: boss.defenses
        };
      }
    } else if (targetEntity.type === 'character') {
      const character = characters.find(c => c.id === targetEntity.id);
      if (character) {
        return {
          name: character.name,
          type: 'character',
          ac: character.ac,
          defenses: character.defenses
        };
      }
    }
    
    return null;
  };

  const targetDetails = getTargetDetails();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSingleTargetState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // If setting critical hit, reset advantage/disadvantage
      ...(name === 'criticalHit' && checked ? { advantage: false, disadvantage: false } : {}),
      // If setting advantage, reset critical and disadvantage
      ...(name === 'advantage' && checked ? { criticalHit: false, disadvantage: false } : {}),
      // If setting disadvantage, reset critical and advantage
      ...(name === 'disadvantage' && checked ? { criticalHit: false, advantage: false } : {})
    }));
  };

  const handleApplyDamage = () => {
    if (!targetEntity) {
      alert('Please select a target first');
      return;
    }
    
    const damage = parseInt(singleTargetState.damageAmount);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return;
    }
    
    // Get hit status based on attack roll and AC
    let hitStatus: HitStatus = 'hit';
    if (singleTargetState.attackRoll) {
      const attackRoll = parseInt(singleTargetState.attackRoll);
      
      if (singleTargetState.criticalHit || attackRoll === 20) {
        hitStatus = 'critical';
      } else if (attackRoll === 1) {
        hitStatus = 'miss';
      } else if (targetDetails?.ac && attackRoll < targetDetails.ac) {
        hitStatus = 'miss';
      }
    }
    
    // Calculate final damage
    let finalDamage = damage;
    if (hitStatus === 'critical') {
      finalDamage = damage * 2;
    } else if (hitStatus === 'miss') {
      finalDamage = 0;
    }
    
    // Apply damage based on target type
    if (targetEntity.type === 'group') {
      applyDamageToGroup(targetEntity.id, finalDamage, hitStatus);
    } else if (targetEntity.type === 'boss') {
      applyDamageToBoss(targetEntity.id, finalDamage, hitStatus);
    } else if (targetEntity.type === 'character') {
      applyDamageToCharacter(targetEntity.id, finalDamage, hitStatus, '');
    }
    
    // Reset attack roll field
    setSingleTargetState(prev => ({
      ...prev,
      attackRoll: '',
      criticalHit: false,
      advantage: false,
      disadvantage: false
    }));
  };

  return (
    <div className="damage-section single-target-section">
      <h4>Single Target Damage</h4>
      
      {targetDetails ? (
        <div className="current-target">
          <div className="target-info">
            <span>Target:</span> 
            <span className="target-name">{targetDetails.name}</span>
            <span className="target-type">{targetDetails.type}</span>
            {targetDetails.ac && (
              <span className="target-ac">AC: {targetDetails.ac}</span>
            )}
          </div>
          {(targetDetails.defenses && (
            (targetDetails.defenses.immunities && targetDetails.defenses.immunities.length) ||
            (targetDetails.defenses.resistances && targetDetails.defenses.resistances.length) ||
            (targetDetails.defenses.vulnerabilities && targetDetails.defenses.vulnerabilities.length)
          )) && (
            <div className="target-defenses">
              <span className="defense-label-inline">Defenses:</span>
              <DefenseIcons defenses={targetDetails.defenses} />
            </div>
          )}
        </div>
      ) : (
        <div className="no-target-message">
          <p>No target selected. Select a target from the Groups, Bosses, or Characters section.</p>
        </div>
      )}
      
      <div className="damage-controls">
        <div className="control-row">
          <div className="control-field">
            <label>Attack Roll:</label>
            <input
              type="number"
              name="attackRoll"
              value={singleTargetState.attackRoll}
              onChange={handleChange}
              placeholder="Attack roll (optional)"
              min="1"
            />
          </div>
          
          <div className="control-field">
            <label>Damage:</label>
            <input
              type="number"
              name="damageAmount"
              value={singleTargetState.damageAmount}
              onChange={handleChange}
              placeholder="Damage amount"
              min="0"
              required
            />
          </div>
        </div>
        
        <div className="control-row checkbox-row">
          <div className="control-checkbox">
            <input
              type="checkbox"
              id="criticalHit"
              name="criticalHit"
              checked={singleTargetState.criticalHit}
              onChange={handleChange}
            />
            <label htmlFor="criticalHit">Critical Hit</label>
          </div>
          
          <div className="control-checkbox">
            <input
              type="checkbox"
              id="advantage"
              name="advantage"
              checked={singleTargetState.advantage}
              onChange={handleChange}
            />
            <label htmlFor="advantage">Advantage</label>
          </div>
          
          <div className="control-checkbox">
            <input
              type="checkbox"
              id="disadvantage"
              name="disadvantage"
              checked={singleTargetState.disadvantage}
              onChange={handleChange}
            />
            <label htmlFor="disadvantage">Disadvantage</label>
          </div>
        </div>
        
        <button
          className="apply-damage-button"
          onClick={handleApplyDamage}
          disabled={!targetEntity || !singleTargetState.damageAmount}
        >
          Apply Damage
        </button>
      </div>
      
      {targetDetails && singleTargetState.attackRoll && (
        <div className="hit-status">
          {(() => {
            const attackRoll = parseInt(singleTargetState.attackRoll);
            if (singleTargetState.criticalHit || attackRoll === 20) {
              return <span className="critical-hit">Critical Hit!</span>;
            } else if (attackRoll === 1) {
              return <span className="critical-miss">Critical Miss!</span>;
            } else if (targetDetails.ac && attackRoll < targetDetails.ac) {
              return <span className="miss">Miss! (AC {targetDetails.ac})</span>;
            } else {
              return <span className="hit">Hit! (AC {targetDetails.ac})</span>;
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default SingleTargetDamage;
export type { SingleTargetDamageProps, HitStatus };


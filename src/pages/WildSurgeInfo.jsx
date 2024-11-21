import '../styles/WildSurgeInfo.css';

import React, { useState } from 'react';

import PageLayout from '../components/PageLayout';
import WildSurgeRoller from '../components/WildSurgeRoller';
import { aspectWildSurges } from '../assets/aspectWildSurges';
import { weaponWildSurges } from '../assets/weaponWildSurges.js';

const SURGE_TYPES = {
  ASPECT: 'Aspect Wild Surge',
  STANDARD: 'Standard Wild Surge',
  WEAPON: "Weapon Wild Surge"
};

const WildSurgeInfo = () => {
  const [selectedType, setSelectedType] = useState(SURGE_TYPES.WEAPON);


  return (
    <PageLayout title="Wild Surge Information">
      <div className="wild-surge-info">
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="surge-type-select"
        >
          {Object.values(SURGE_TYPES).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <div className="surge-description">
          {selectedType === SURGE_TYPES.ASPECT && (
            <>
              <p>When selecting an aspect, roll for a wild surge. A wild surge happens when the roll is 1-5.</p>
              <WildSurgeRoller surgeTable={aspectWildSurges} />
            </>
          )}
          {selectedType === SURGE_TYPES.STANDARD && (
            <>
              <p>Standard wild magic surge table.</p>
              <WildSurgeRoller surgeTable={aspectWildSurges} />
            </>
          )}
          {selectedType === SURGE_TYPES.WEAPON && (
            <>
              <p>Wild surges from a wild magic weapon attack.</p>
              <WildSurgeRoller surgeTable={weaponWildSurges} />
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default WildSurgeInfo;
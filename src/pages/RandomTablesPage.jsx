import '../styles/WildSurgeInfo.css';

import PageLayout from '../components/PageLayout.jsx';
import TableRoller from '../components/TableRoller.jsx';
import { aspectWildSurges } from '../assets/aspectWildSurges.js';
import { standardWildSurges } from '../assets/standardWildSurges.js';
import { useState } from 'react';
import { weaponWildSurges } from '../assets/weaponWildSurges.js';
import { diseases } from '../assets/diseases.js';

const SURGE_TYPES = {
  ASPECT: 'Aspect Wild Surge',
  STANDARD: 'Standard Wild Surge',
  WEAPON: "Weapon Wild Surge",
  DISEASES: 'Diseases'
};

const RandomTables = () => {
  const [selectedType, setSelectedType] = useState(SURGE_TYPES.WEAPON);


  return (
    <PageLayout title="Random Tables">
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
              <p>Aspect-related surge table. Roll to determine a surge effect; on your system, a surge occurs on a roll of 1–5.</p>
              <TableRoller table={aspectWildSurges} placeholder="Select a Wild Surge" />
            </>
          )}
          {selectedType === SURGE_TYPES.STANDARD && (
            <>
              <p>Standard wild magic surge table for spellcasting.</p>
              <TableRoller table={standardWildSurges} placeholder="Select a Wild Surge" />
            </>
          )}
          {selectedType === SURGE_TYPES.WEAPON && (
            <>
              <p>Wild surges originating from a wild magic weapon attack.</p>
              <TableRoller table={weaponWildSurges} placeholder="Select a Wild Surge" />
            </>
          )}
          {selectedType === SURGE_TYPES.DISEASES && (
            <>
              <p>Diseases table: roll to inflict a combat-impacting disease. Entries adapted from the 5e SRD Diseases list.</p>
              <TableRoller table={diseases} placeholder="Select a Disease" />
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default RandomTables;
import '../styles/GroupAttackCalculator.css';

import AttackResults from './AttackResults';
import CharacterSection from './CharacterSection';
import DamageApplication from './DamageApplication';
import GroupsSection from './GroupsSection';
import TurnOrder from './TurnOrder';
import useDnDStore from '../store/dndStore';
import { createFileImportHandler } from '../utils/fileImport';

const GroupAttackCalculator = () => {
  const {
    exportState,
    importState
  } = useDnDStore();

  const handleImportState = createFileImportHandler(
    (validatedState) => {
      const success = importState(JSON.stringify(validatedState));
      if (!success) {
        alert('Failed to import state. Invalid file format.');
      }
    },
    (errorMessage) => {
      alert(errorMessage);
    }
  );

  return (
    <div className="group-attack-calculator">
      <h2>D&D Group Attack Calculator</h2>
      
      <div className="import-export-buttons">
        <button className="export-button" onClick={exportState}>
          Export All
        </button>
        <label className="import-button">
          Import All
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportState}
          />
        </label>
      </div>
      
      {/* Turn Order */}
      <TurnOrder />
      
      {/* Character Section */}
      <CharacterSection />
      
      {/* Groups Section - Now includes boss management */}
      <GroupsSection />
      
      {/* Damage Application */}
      <DamageApplication />
      
      {/* Attack Results */}
      <AttackResults />
    </div>
  );
};

export default GroupAttackCalculator; 
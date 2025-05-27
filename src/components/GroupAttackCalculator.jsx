import '../styles/GroupAttackCalculator.css';

import AttackResults from './AttackResults';
import BossTracker from './BossTracker';
import CharacterSection from './CharacterSection';
import DamageApplication from './DamageApplication';
import GroupsSection from './GroupsSection';
import useDnDStore from '../store/dndStore';

const GroupAttackCalculator = () => {
  const {
    exportState,
    importState
  } = useDnDStore();

  const handleImportState = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const success = importState(e.target.result);
      if (!success) {
        alert('Failed to import state. Invalid file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="group-attack-calculator">
      <h2>D&D Group Attack Calculator</h2>
      
      <div className="import-export-buttons">
        <button className="export-button" onClick={exportState}>
          Export State
        </button>
        <label className="import-button">
          Import State
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportState}
          />
        </label>
      </div>
      
      {/* Character Section */}
      <CharacterSection />
      
      {/* Boss Tracker */}
      <BossTracker />
      
      {/* Groups Section */}
      <GroupsSection />
      
      {/* Damage Application */}
      <DamageApplication />
      
      {/* Attack Results */}
      <AttackResults />
    </div>
  );
};

export default GroupAttackCalculator; 
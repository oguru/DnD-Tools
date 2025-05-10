import '../styles/WildSurgeRoller.css';

import PropTypes from 'prop-types';
import { useState } from 'react';

const WildSurgeRoller = ({ surgeTable, onActivate, showActivateButton = false }) => {
  const [selectedSurge, setSelectedSurge] = useState(null);
  const [surgeRoll, setSurgeRoll] = useState('');

  const handleSurgeRollChange = (newRoll) => {
    if (!newRoll) {
      setSurgeRoll('');
      setSelectedSurge(null);
      return;
    }

    newRoll = Math.max(1, Math.min(100, newRoll));
    setSurgeRoll(newRoll);
    
    if (surgeTable[newRoll]) {
      setSelectedSurge(surgeTable[newRoll]);
    } else {
      setSelectedSurge(null);
    }
  };

  const rollNewSurge = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setSurgeRoll(roll);
    setSelectedSurge(surgeTable[roll]);
  };

  return (
    <div className="wild-surge-section">
      <div className="wild-surge-controls">
        <select
          value={selectedSurge ? JSON.stringify(selectedSurge) : ''}
          onChange={(e) => setSelectedSurge(e.target.value ? JSON.parse(e.target.value) : null)}
          className="wild-surge-select"
        >
          <option value="">Select a Wild Surge</option>
          {Object.entries(surgeTable).map(([roll, surge]) => (
            <option key={roll} value={JSON.stringify(surge)}>
              {roll}: {surge.effect}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={surgeRoll}
          onChange={(e) => handleSurgeRollChange(parseInt(e.target.value))}
          min="1"
          max="100"
          className="wild-surge-input"
        />
        <button
          onClick={rollNewSurge}
          className="wild-surge-roll-button"
        >
          Roll Wild Surge
        </button>
        {showActivateButton && (
          <button
            onClick={() => onActivate(selectedSurge)}
            className="wild-surge-activate-button"
          >
            Activate Surge
          </button>
        )}
      </div>
      {selectedSurge && (
        <div className="wild-surge-description">
          <h4>{selectedSurge.effect}</h4>
          <p>{selectedSurge.description}</p>
          {selectedSurge.link && (
            <a href={selectedSurge.link} target="_blank" rel="noopener noreferrer">{selectedSurge.linkText}</a>
          )}
        </div>
      )}
    </div>
  );
};

WildSurgeRoller.propTypes = {
  surgeTable: PropTypes.object.isRequired,
  onActivate: PropTypes.func,
  showActivateButton: PropTypes.bool
};

export default WildSurgeRoller;
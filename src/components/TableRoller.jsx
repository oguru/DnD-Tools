import '../styles/WildSurgeRoller.css';

import PropTypes from 'prop-types';
import { useState } from 'react';

// Generic table roller that can roll on any numbered table (1..N)
// Backwards-compatible with previous WildSurgeRoller shape: entries use { effect, description, link, linkText }
// New generic shape: { label, description, link, linkText }
const TableRoller = ({ table, surgeTable, onActivate, showActivateButton = false, placeholder = 'Select an Entry' }) => {
  // Prefer generic `table`, but accept legacy `surgeTable`
  const activeTable = table || surgeTable || {};

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rollValue, setRollValue] = useState('');

  const normalizeEntry = (entry) => {
    if (!entry) return null;
    return {
      label: entry.label || entry.effect || '',
      description: entry.description || '',
      link: entry.link,
      linkText: entry.linkText
    };
  };

  const handleRollChange = (newRoll) => {
    if (!newRoll) {
      setRollValue('');
      setSelectedEntry(null);
      return;
    }

    newRoll = Math.max(1, Math.min(100, newRoll));
    setRollValue(newRoll);
    if (activeTable[newRoll]) {
      setSelectedEntry(normalizeEntry(activeTable[newRoll]));
    } else {
      setSelectedEntry(null);
    }
  };

  const rollRandom = () => {
    const keys = Object.keys(activeTable).map(k => parseInt(k, 10)).filter(Number.isFinite);
    if (keys.length === 0) return;
    const idx = Math.floor(Math.random() * keys.length);
    const roll = keys[idx];
    setRollValue(roll);
    setSelectedEntry(normalizeEntry(activeTable[roll]));
  };

  return (
    <div className="wild-surge-section">
      <div className="wild-surge-controls">
        <select
          value={selectedEntry ? JSON.stringify(selectedEntry) : ''}
          onChange={(e) => setSelectedEntry(e.target.value ? JSON.parse(e.target.value) : null)}
          className="wild-surge-select"
        >
          <option value="">{placeholder}</option>
          {Object.entries(activeTable).map(([roll, entry]) => {
            const e = normalizeEntry(entry);
            return (
              <option key={roll} value={JSON.stringify(e)}>
                {roll}: {e.label}
              </option>
            );
          })}
        </select>
        <input
          type="number"
          value={rollValue}
          onChange={(e) => handleRollChange(parseInt(e.target.value))}
          min="1"
          max="100"
          className="wild-surge-input"
        />
        <button
          onClick={rollRandom}
          className="wild-surge-roll-button"
        >
          Roll
        </button>
        {showActivateButton && (
          <button
            onClick={() => onActivate && onActivate(selectedEntry)}
            className="wild-surge-activate-button"
            disabled={!selectedEntry}
          >
            Activate
          </button>
        )}
      </div>
      {selectedEntry && (
        <div className="wild-surge-description">
          <h4>{selectedEntry.label}</h4>
          <p>{selectedEntry.description}</p>
          {selectedEntry.link && (
            <a href={selectedEntry.link} target="_blank" rel="noopener noreferrer">{selectedEntry.linkText || selectedEntry.link}</a>
          )}
        </div>
      )}
    </div>
  );
};

TableRoller.propTypes = {
  table: PropTypes.object,
  surgeTable: PropTypes.object,
  onActivate: PropTypes.func,
  showActivateButton: PropTypes.bool,
  placeholder: PropTypes.string
};

export default TableRoller;



import '../styles/DamageStatsRoller.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getFromStorage, setInStorage } from '../utils/localStorage';

// Functional React component to calculate min / average / max from multiple NdS + B entries
const DamageStatsRoller = () => {
  const [rows, setRows] = useState([
    { id: Date.now(), numberOfDiceInput: 1, dieSidesInput: 6, flatBonusInput: 0 }
  ]);
  const [calculationName, setCalculationName] = useState('');
  const [savedCalculations, setSavedCalculations] = useState([]);
  const isInitialMount = useRef(true);

  // Load saved calculations from localStorage on mount
  useEffect(() => {
    const savedCalcs = getFromStorage('damage-stats-saved-calcs', null);
    if (savedCalcs) setSavedCalculations(savedCalcs);

    const currentRaw = getFromStorage('damage-stats-current', null);
    if (currentRaw) {
      const { rows: savedRows, calculationName: savedName } = currentRaw;
      if (Array.isArray(savedRows) && savedRows.length > 0) {
        // Validate/normalize rows
        const normalized = savedRows.map(r => ({
          id: r.id || Date.now() + Math.random(),
          numberOfDiceInput: Number.isFinite(r.numberOfDiceInput) ? r.numberOfDiceInput : 1,
          dieSidesInput: Number.isFinite(r.dieSidesInput) ? r.dieSidesInput : 6,
          flatBonusInput: Number.isFinite(r.flatBonusInput) ? r.flatBonusInput : 0
        }));
        setRows(normalized);
      }
      if (typeof savedName === 'string') setCalculationName(savedName);
    }
  }, []);

  // Persist whenever savedCalculations changes (but skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setInStorage('damage-stats-saved-calcs', savedCalculations);
  }, [savedCalculations]);

  // Persist current working calculation (rows + name)
  useEffect(() => {
    const payload = { rows, calculationName };
    setInStorage('damage-stats-current', payload);
  }, [rows, calculationName]);

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: Date.now() + Math.random(), numberOfDiceInput: 1, dieSidesInput: 6, flatBonusInput: 0 }]);
  };

  const removeRow = (id) => {
    setRows(prev => prev.length === 1 ? prev : prev.filter(r => r.id !== id));
  };

  const computedRows = useMemo(() => {
    return rows.map(r => {
      const numberOfDice = Math.max(0, Number.isFinite(r.numberOfDiceInput) ? Math.floor(r.numberOfDiceInput) : 0);
      const sidesPerDie = Math.max(1, Number.isFinite(r.dieSidesInput) ? Math.floor(r.dieSidesInput) : 1);
      const flatBonus = Number.isFinite(r.flatBonusInput) ? Math.floor(r.flatBonusInput) : 0;

      const singleDieMinimum = 1;
      const singleDieMaximum = sidesPerDie;
      const singleDieAverage = (1 + sidesPerDie) / 2;

      const min = (numberOfDice * singleDieMinimum) + flatBonus;
      const max = (numberOfDice * singleDieMaximum) + flatBonus;
      const avg = (numberOfDice * singleDieAverage) + flatBonus;

      return {
        id: r.id,
        numberOfDice, sidesPerDie, flatBonus,
        min, avg, max,
        expr: `${numberOfDice}d${sidesPerDie}${flatBonus >= 0 ? `+${flatBonus}` : flatBonus}`
      };
    });
  }, [rows]);

  const totals = useMemo(() => {
    return computedRows.reduce((acc, r) => {
      acc.min += r.min;
      acc.avg += r.avg;
      acc.max += r.max;
      return acc;
    }, { min: 0, avg: 0, max: 0 });
  }, [computedRows]);

  const saveCurrentCalculation = () => {
    const id = Date.now() + Math.random();
    const name = calculationName?.trim() || `Calculation ${savedCalculations.length + 1}`;
    const snapshot = {
      id,
      name,
      expressions: computedRows.map(r => r.expr),
      totals: {
        min: totals.min,
        avg: Math.round(totals.avg * 100) / 100,
        max: totals.max
      }
    };
    const nextList = [snapshot, ...savedCalculations];
    setSavedCalculations(nextList);
    setCalculationName('');
  };

  const deleteSavedCalculation = (id) => {
    setSavedCalculations(prev => prev.filter(c => c.id !== id));
  };

  return (
    <>
    <div className="damage-stats-section">
      {/* Save controls at the top */}
      <div className="save-controls top" style={{display: 'flex', flexDirection: 'row', gap: '8px', marginBottom: '20px'}}>
        <input
          type="text"
          className="calc-name-input"
          placeholder="Calculation name"
          value={calculationName}
          style={{boxSizing: 'border-box', flexGrow: 1}}
          onChange={(e) => setCalculationName(e.target.value)}
        />
        <button style={{boxSizing: 'border-box'}} className="save-calc-button" onClick={saveCurrentCalculation} title="Save calculation snapshot">Save</button>
      </div>

      <div className="rows">
        {rows.map(row => (
          <div key={row.id} className="damage-stats-controls row">
            <div className="field">
              <label>Number of Dice</label>
              <input
                type="number"
                value={row.numberOfDiceInput}
                onChange={(e) => updateRow(row.id, 'numberOfDiceInput', parseInt(e.target.value))}
                min="0"
              />
            </div>
            <div className="field">
              <label>Die Sides</label>
              <input
                type="number"
                value={row.dieSidesInput}
                onChange={(e) => updateRow(row.id, 'dieSidesInput', parseInt(e.target.value))}
                min="1"
              />
            </div>
            <div className="field">
              <label>Flat Bonus</label>
              <input
                type="number"
                value={row.flatBonusInput}
                onChange={(e) => updateRow(row.id, 'flatBonusInput', parseInt(e.target.value))}
              />
            </div>
            <div className="row-actions">
              <button className="remove-row" onClick={() => removeRow(row.id)} title="Remove">✕</button>
            </div>
            <div className="row-expression">Expr: <strong>{computedRows.find(r => r.id === row.id)?.expr}</strong></div>
          </div>
        ))}
        <div className="add-row-container" style={{display: 'flex', justifyContent: 'end'}}>
          <button className="add-row" style={{marginBottom: '20px'}} onClick={addRow}>+ Add Expression</button>
        </div>
      </div>

      <div className="damage-stats-summary">
        <div className="tiles">
          <div className="tile">
            <div className="label">Total Minimum</div>
            <div className="value">{totals.min}</div>
          </div>
          <div className="tile">
            <div className="label">Total Average</div>
            <div className="value">{(Math.round(totals.avg * 100) / 100).toFixed(2)}</div>
          </div>
          <div className="tile">
            <div className="label">Total Maximum</div>
            <div className="value">{totals.max}</div>
          </div>
        </div>
      </div>
      </div>

    {savedCalculations?.length > 0 && <div className="damage-stats-section" style={{marginTop: '20px'}}>
      {savedCalculations.length > 0 && (
        <div className="saved-calcs">
          <h4>Saved Calculations</h4>
          <div className="saved-list">
            {savedCalculations.map(calc => (
              <div key={calc.id} className="damage-stats-summary saved-card">
                <div className="saved-header">
                  <div className="saved-title">{calc.name}</div>
                  <button className="remove-row" onClick={() => deleteSavedCalculation(calc.id)} title="Delete">✕</button>
                </div>
                <div className="saved-exprs">{calc.expressions.join('  +  ')}</div>
                <div className="tiles">
                  <div className="tile">
                    <div className="label">Minimum</div>
                    <div className="value">{calc.totals.min}</div>
                  </div>
                  <div className="tile">
                    <div className="label">Average</div>
                    <div className="value">{calc.totals.avg.toFixed ? calc.totals.avg.toFixed(2) : calc.totals.avg}</div>
                  </div>
                  <div className="tile">
                    <div className="label">Maximum</div>
                    <div className="value">{calc.totals.max}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
}
    </>
  );
};

export default DamageStatsRoller;



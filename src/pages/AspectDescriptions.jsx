import '../styles/AspectDescriptions.css';

import React, { useEffect, useState } from 'react';
import { aspectDescriptions, aspects } from '../assets/aspects';
import { onValue, ref, remove, set } from 'firebase/database';
import { rollWildSurge, wildSurges } from '../assets/wildSurges';

import database from '../firebaseConfig';

const XIcon = () => (
  <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5L15 15" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AspectDescriptions = () => {
  const [aspect1, setAspect1] = useState('');
  const [aspect2, setAspect2] = useState('');
  const [activeEffects, setActiveEffects] = useState([]);
  const [selectedWildSurge, setSelectedWildSurge] = useState(null);
  const [manualRoll, setManualRoll] = useState('');
  const [activeWildSurges, setActiveWildSurges] = useState([]);

  useEffect(() => {
    const activeEffectsRef = ref(database, 'activeEffects');
    onValue(activeEffectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const effects = Object.values(data);
        setActiveEffects(effects.filter(effect => !effect.isWildSurge));
        setActiveWildSurges(effects.filter(effect => effect.isWildSurge));
      } else {
        setActiveEffects([]);
        setActiveWildSurges([]);
      }
    });
  }, []);

  const getDescription = () => {
    if (aspect1 && aspect2) {
      if (aspect1 === aspect2) {
        return aspectDescriptions[aspect1];
      }
      const key = [aspect1, aspect2].sort().join(' + ');
      return aspectDescriptions[key] || aspectDescriptions[[aspect1, aspect2].sort((a, b) => a < b ? 1 : -1).join(' + ')] || { effect: "No combination available", description: "This combination does not have a specific effect." };
    } else if (aspect1) {
      return aspectDescriptions[aspect1];
    } else if (aspect2) {
      return aspectDescriptions[aspect2];
    }
    return null;
  };

  const renderDescription = (desc) => {
    if (!desc) return <p className="description-text">Select an aspect to see its description.</p>;

    return (
      <div className="description-card">
        <h3 className="description-title">{desc.effect}</h3>
        <p className="description-text">{desc.description}</p>
        {desc.mechanics && (
          <>
            <h4 className="mechanics-title">Mechanics:</h4>
            <ul className="mechanics-list">
              {Array.isArray(desc.mechanics) ? (
                desc.mechanics.map((mechanic, index) => (
                  <li key={index} className="mechanics-item">
                    <span className="mechanics-item-title">{mechanic.title}:</span> {mechanic.content}
                  </li>
                ))
              ) : (
                Object.entries(desc.mechanics).map(([title, content], index) => (
                  <li key={index} className="mechanics-item">
                    <span className="mechanics-item-title">{title}:</span> {content}
                  </li>
                ))
              )}
            </ul>
          </>
        )}
        {desc.effect !== "No combination available" && (
          <button
            onClick={() => activateEffect(desc)}
            className="activate-button"
          >
            Activate Effect
          </button>
        )}
      </div>
    );
  };

  const activateEffect = (desc) => {
    const newEffect = {
      name: desc.effect,
      description: desc.description,
      duration: desc.duration,
      mechanics: desc.mechanics,
      isWildSurge: false
    };
    
    const effectRef = ref(database, `activeEffects/${newEffect.name}`);
    set(effectRef, newEffect);
  };

  const removeEffect = (effectName) => {
    const effectRef = ref(database, `activeEffects/${effectName}`);
    remove(effectRef);
  };

  const passRound = () => {
    [...activeEffects, ...activeWildSurges].forEach(effect => {
      if (effect.duration && effect.duration > 0) {
        const newDuration = effect.duration - 1;
        if (newDuration > 0) {
          const effectRef = ref(database, `activeEffects/${effect.name}`);
          set(effectRef, { ...effect, duration: newDuration });
        } else {
          removeEffect(effect.name);
        }
      }
    });
  };

  const populateDropdowns = (effectName) => {
    const aspectPair = Object.entries(aspectDescriptions).find(([key, value]) => value.effect === effectName);
    if (aspectPair) {
      const [key, _] = aspectPair;
      const [first, second] = key.split(' + ');
      console.log('second:', second)
      console.log('first:', first)
      setAspect1(first);
      setAspect2(second || '');
    }
  };

  const renderActiveEffects = () => (
    <div className="active-effects">
      <h3 className="active-effects-title">Active Effects:</h3>
      {activeEffects.length === 0 && activeWildSurges.length === 0 ? (
        <p className="description-text">No active effects</p>
      ) : (
        <>
          <ul className="active-effects-list">
            {activeEffects.map((effect, index) => (
              <li key={`${effect.name}-${index}`} className="active-effect-item">
                <div className="effect-left-column">
                  <span className="active-effect-name">{effect.name}</span>
                  <span className="effect-duration">
                    {effect.duration ? `${effect.duration} rounds` : 'Permanent'}
                  </span>
                  <button
                    onClick={() => removeEffect(effect.name)}
                    className="remove-effect-button"
                  >
                    <XIcon />
                  </button>
                </div>
                <div className="effect-right-column">
                  <p className="effect-description">{effect.description}</p>
                  {effect.mechanics && (
                    <ul className="effect-mechanics-list">
                      {Array.isArray(effect.mechanics) ? (
                        effect.mechanics.map((mechanic, mechIndex) => (
                          <li key={mechIndex} className="effect-mechanics-item">
                            <span className="effect-mechanics-title">{mechanic.title}:</span> {mechanic.content}
                          </li>
                        ))
                      ) : (
                        Object.entries(effect.mechanics).map(([title, content], mechIndex) => (
                          <li key={mechIndex} className="effect-mechanics-item">
                            <span className="effect-mechanics-title">{title}:</span> {content}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <h4 className="wild-surge-effects-title">Active Wild Surge Effects:</h4>
          <ul className="wild-surge-effects-list">
            {activeWildSurges.map((effect, index) => (
              <li key={`${effect.name}-${index}`} className="active-effect-item wild-surge-effect">
                <div className="effect-left-column">
                  <span className="active-effect-name">{effect.name}</span>
                  <span className="effect-duration">
                    {effect.duration ? `${effect.duration} rounds` : 'Permanent'}
                  </span>
                  <button
                    onClick={() => removeEffect(effect.name)}
                    className="remove-effect-button"
                  >
                    <XIcon />
                  </button>
                </div>
                <div className="effect-right-column">
                  <p className="effect-description">{effect.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <button
        onClick={passRound}
        className="pass-round-button"
      >
        Pass 1 Round
      </button>
    </div>
  );

  const handleWildSurgeSelect = (event) => {
    const surgeNumber = parseInt(event.target.value);
    if (surgeNumber) {
      const { surge } = rollWildSurge(surgeNumber);
      setSelectedWildSurge(surge);
      setManualRoll(surgeNumber.toString());
    } else {
      setSelectedWildSurge(null);
      setManualRoll('');
    }
  };

  const handleWildSurgeRoll = () => {
    const rollNumber = manualRoll ? parseInt(manualRoll) : null;
    const { roll, surge } = rollWildSurge(rollNumber);
    setSelectedWildSurge(surge);
    setManualRoll("");
    activateWildSurge(surge);
  };

  const handleManualRollChange = (event) => {
    setManualRoll(event.target.value);
  };

  const renderWildSurgeSection = () => (
    <div className="wild-surge-section">
      <h3 className="wild-surge-title">Wild Surge Effects</h3>
      <div className="wild-surge-controls">
        <select 
          value={selectedWildSurge ? manualRoll : ''} 
          onChange={handleWildSurgeSelect} 
          className="wild-surge-select"
        >
          <option value="">Select a Wild Surge</option>
          {Object.entries(wildSurges).map(([number, surge]) => (
            <option key={number} value={number}>
              {number}: {surge.effect}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          max="100"
          value={manualRoll}
          onChange={handleManualRollChange}
          className="wild-surge-input"
          placeholder="Enter roll (1-100)"
        />
        <button onClick={handleWildSurgeRoll} className="wild-surge-roll-button">
          Roll Wild Surge
        </button>
      </div>
      {selectedWildSurge && (
        <div className="wild-surge-description">
          <h4>{selectedWildSurge.effect}</h4>
          <p>{selectedWildSurge.description}</p>
        </div>
      )}
    </div>
  );

  const activateWildSurge = (surge) => {
    const duration = surge.duration ? rollDuration(surge.duration) : null;
    const newEffect = {
      name: surge.effect,
      description: surge.description,
      duration: duration,
      isWildSurge: true
    };
    
    const effectRef = ref(database, `activeEffects/${newEffect.name}`);
    set(effectRef, newEffect);
  };

  const rollDuration = (durationString) => {
    const [count, sides] = durationString.split('d').map(Number);
    if (sides === 1) return count;
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  };

  return (
    <div className="aspect-descriptions">
      <h2 className="aspect-title">Aspect Description Selector</h2>
      <div className="aspect-selectors">
        <div className="aspect-select-container">
          <select
            className="aspect-select"
            value={aspect1}
            onChange={(e) => setAspect1(e.target.value)}
          >
            <option value="">Select first aspect</option>
            {aspects.map((aspect) => (
              <option key={aspect} value={aspect}>
                {aspect}
              </option>
            ))}
          </select>
        </div>
        <div className="aspect-select-container">
          <select
            className="aspect-select"
            value={aspect2}
            onChange={(e) => setAspect2(e.target.value)}
          >
            <option value="">Select second aspect (optional)</option>
            {aspects.map((aspect) => (
              <option key={aspect} value={aspect}>
                {aspect}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        {renderDescription(getDescription())}
      </div>
      {renderActiveEffects()}
      {renderWildSurgeSection()}
    </div>
  );
};

export default AspectDescriptions;

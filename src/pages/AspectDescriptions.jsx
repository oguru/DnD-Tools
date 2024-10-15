import '../styles/AspectDescriptions.css';

import React, { useEffect, useState } from 'react';
import { aspectDescriptions, aspects } from '../assets/aspects';
import { onValue, ref, remove, set } from 'firebase/database';

import database from '../firebaseConfig';

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AspectDescriptions = () => {
  const [aspect1, setAspect1] = useState('');
  const [aspect2, setAspect2] = useState('');
  const [activeEffects, setActiveEffects] = useState([]);

  useEffect(() => {
    const activeEffectsRef = ref(database, 'activeEffects');
    onValue(activeEffectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setActiveEffects(Object.values(data));
      } else {
        setActiveEffects([]);
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
      duration: desc.duration,
    };
    
    const effectRef = ref(database, `activeEffects/${newEffect.name}`);
    set(effectRef, newEffect);
  };

  const removeEffect = (effectName) => {
    const effectRef = ref(database, `activeEffects/${effectName}`);
    remove(effectRef);
  };

  const passRound = () => {
    activeEffects.forEach(effect => {
      const newDuration = effect.duration - 1;
      if (newDuration > 0) {
        const effectRef = ref(database, `activeEffects/${effect.name}`);
        set(effectRef, { ...effect, duration: newDuration });
      } else {
        removeEffect(effect.name);
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
      {activeEffects.length === 0 ? (
        <p className="description-text">No active effects</p>
      ) : (
        <ul className="active-effects-list">
          {activeEffects.map((effect, index) => (
            <li key={`${effect.name}-${index}`} className="active-effect-item">
              <div>
                <button 
                  className="remove-effect-button"
                  onClick={() => setActiveEffects(prevEffects => 
                    prevEffects.filter((_, currIndex) => currIndex !== index)
                  )}
                >
                  <XIcon />
                </button>
                <span 
                  className="active-effect-name"
                  onClick={() => populateDropdowns(effect.name)}
                >
                  {effect.name}
                </span>
              </div>
              <span>Rounds remaining: {effect.duration}</span>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={passRound}
        className="pass-round-button"
      >
        Pass 1 Round
      </button>
    </div>
  );

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
    </div>
  );
};

export default AspectDescriptions;

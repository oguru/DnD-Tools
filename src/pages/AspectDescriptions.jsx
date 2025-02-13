import '../styles/AspectDescriptions.css';

import React, { useEffect, useState } from 'react';
import { aspectDescriptions, aspects } from '../assets/aspects';
import { onValue, ref, remove, set } from 'firebase/database';

import ActiveEffectCard from '../components/ActiveEffectCard';
import AspectEffectCard from '../components/AspectEffectCard';
import WildSurgeRoller from '../components/WildSurgeRoller';
import { aspectWildSurges } from '../assets/aspectWildSurges';
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
  const [wildSurgeRoll, setWildSurgeRoll] = useState(1);
  const [discoveredEffects, setDiscoveredEffects] = useState([]);

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

    // Add listener for discovered effects
    const activatedEffectsRef = ref(database, 'activatedEffects');
    onValue(activatedEffectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDiscoveredEffects(Object.values(data));
      } else {
        setDiscoveredEffects([]);
      }
    });
  }, []);

  useEffect(() => {
    // Check for stored aspects
    const storedAspects = localStorage.getItem('selectedAspects');
    if (storedAspects) {
      if (storedAspects.includes(' + ')) {
        const [first, second] = storedAspects.split(' + ');
        setAspect1(first);
        setAspect2(second);
      } else {
        setAspect1(storedAspects);
        setAspect2('');
      }
      // Clear the stored aspects
      localStorage.removeItem('selectedAspects');
    }
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

  const renderAspectDetails = (desc) => {
    if (!desc) return null;
    
    const isEffectDiscovered = discoveredEffects.some(effect => effect.name === desc.effect);

    return (
      <AspectEffectCard
        effect={{
          name: desc.effect,
          description: desc.description,
          mechanics: desc.mechanics || [],
          duration: desc.duration || 0
        }}
        showActivateButton={desc.effect !== "No combination available"}
        onActivate={activateEffect}
        isDiscovered={isEffectDiscovered}
      />
    );
  };

  const activateEffect = (desc) => {
    // Safety check and logging
    console.log('Activating effect:', desc);
    
    if (!desc || !desc.name) {
      console.error('Invalid effect data:', desc);
      return;
    }

    // Find the aspect combination that produced this effect
    const aspectKey = aspect1 && aspect2 ? 
      [aspect1, aspect2].sort().join(' + ') : 
      aspect1 || aspect2;

    const newEffect = {
      name: desc.name,
      description: desc.description || '',
      duration: desc.duration || 0,
      mechanics: desc.mechanics || [],
      isWildSurge: false,
      aspectCombination: aspectKey
    };

    // Safety check for required fields
    if (!newEffect.name) {
      console.error('Effect must have a name:', newEffect);
      return;
    }

    // Save to activeEffects only if there's a duration
    if (newEffect.duration) {
      const effectRef = ref(database, `activeEffects/${newEffect.name}`);
      set(effectRef, newEffect);
    }
    
    // Always save to activatedEffects
    const activatedEffectRef = ref(database, `activatedEffects/${newEffect.name}`);
    set(activatedEffectRef, newEffect);
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
      if (key.includes(' + ')) {
        const [first, second] = key.split(' + ');
        setAspect1(first);
        setAspect2(second);
      } else {
        setAspect1(key);
        setAspect2('');
      }
    }
  };

  const renderActiveEffects = () => (
    <div className="active-effects">
      {activeEffects.length > 0 && (
        <>
          <h3 className="active-effects-title">Active Effects:</h3>
          <ul className="active-effects-list">
            {activeEffects.map((effect, index) => (
              <ActiveEffectCard
                key={`${effect.name}-${index}`}
                effect={effect}
                onRemove={removeEffect}
                onClick={() => populateDropdowns(effect.name)}
              />
            ))}
          </ul>
        </>
      )}
      {activeEffects.length > 0 && activeWildSurges.length > 0 && (
        <div className="effects-separator"></div>
      )}
      {activeWildSurges.length > 0 && (
        <>
          <h3 className="wild-surge-effects-title">Active Wild Surge Effects:</h3>
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
      {(activeEffects.length > 0 || activeWildSurges.length > 0) && (
        <button
          onClick={passRound}
          className="pass-round-button"
        >
          Pass 1 Round
        </button>
      )}
    </div>
  );

  // const handleWildSurgeSelect = (event) => {
  //   const surgeNumber = parseInt(event.target.value);
  //   if (surgeNumber) {
  //     const { surge } = rollWildSurge(surgeNumber);
  //     setSelectedWildSurge(surge);
  //     setManualRoll(surgeNumber.toString());
  //   } else {
  //     setSelectedWildSurge(null);
  //     setManualRoll('');
  //   }
  // };

  // const handleWildSurgeRollChange = (newRoll) => {
  //   // Handle empty or invalid input
  //   if (!newRoll) {
  //     setWildSurgeRoll('');
  //     setSelectedWildSurge(null);
  //     return;
  //   }

  //   // Ensure roll is between 1 and 100
  //   newRoll = Math.max(1, Math.min(100, newRoll));
  //   setWildSurgeRoll(newRoll);
    
  //   // Automatically select the corresponding surge
  //   if (wildSurges[newRoll]) {
  //     setSelectedWildSurge(wildSurges[newRoll]);
  //   } else {
  //     setSelectedWildSurge(null);
  //   }
  // };

  // const handleManualRollChange = (event) => {
  //   setManualRoll(event.target.value);
  // };

  const renderWildSurgeSection = () => (
    <WildSurgeRoller 
      surgeTable={aspectWildSurges} 
      onActivate={activateWildSurge}
      showActivateButton={true}
    />
  );

  const activateWildSurge = (surge) => {
    if (!surge) return;
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
      <hr></hr>
      <p className="aspect-list">{aspects.join(' - ')}</p>
      <p className="mt-4 p-4 bg-gray-100 rounded-md">When selecting an aspect, roll for a wild surge. A wild surge happens when the roll is 1-5.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        {renderAspectDetails(getDescription())}
      </div>
      {renderActiveEffects()}
      {renderWildSurgeSection()}
    </div>
  );
};

export default AspectDescriptions;

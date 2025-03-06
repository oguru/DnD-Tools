import '../styles/AspectDescriptions.css';

import { onValue, ref, remove, set } from 'firebase/database';
import { useEffect, useState } from 'react';

import AspectEffectCard from '../components/AspectEffectCard';
import PageLayout from '../components/PageLayout';
import { aspectDescriptions } from '../assets/aspects';
import database from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const DiscoveredAspects = () => {
  const [discoveredEffects, setDiscoveredEffects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const activatedEffectsRef = ref(database, 'activatedEffects');
    onValue(activatedEffectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const effects = Object.values(data);
        setDiscoveredEffects(effects.filter(effect => !effect.isWildSurge));
      } else {
        setDiscoveredEffects([]);
      }
    });
  }, []);

  const handleEffectClick = (effect) => {
    // Save the selected aspects to localStorage
    if (effect.aspectCombination) {
      localStorage.setItem('selectedAspects', effect.aspectCombination);
    }
    // Navigate to the limbo page
    navigate('/limbo');
  };

  // One-time function to save current effects with their aspect combinations
  const saveCurrentEffectsWithAspects = () => {
    discoveredEffects.forEach(effect => {
      // Find the matching aspect key by comparing effect names
      const aspectKey = Object.entries(aspectDescriptions).find(([, value]) => 
        value.effect === effect.name
      )?.[0];
      
      if (aspectKey) {
        const updatedEffect = {
          ...effect,
          aspectCombination: aspectKey
        };
        const effectRef = ref(database, `activatedEffects/${effect.name}`);
        set(effectRef, updatedEffect);
      }
    });
  };

  const removeEffect = (effectName) => {
    const effectRef = ref(database, `activatedEffects/${effectName}`);
    remove(effectRef);
  };

  return (
    <PageLayout title="Discovered Aspects">
      {/* Temporary button for one-time update */}
      <button 
        onClick={saveCurrentEffectsWithAspects}
        style={{ marginBottom: '1rem' }}
      >
        Update Existing Effects
      </button>

      <div className="discovered-effects">
        {discoveredEffects.map((effect, index) => (
          <div 
            key={index} 
            onClick={() => handleEffectClick(effect)}
            style={{ cursor: 'pointer' }}
          >
            <AspectEffectCard
              effect={effect}
              showActivateButton={false}
              isDiscoveredPage={true}
              onRemove={removeEffect}
            />
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default DiscoveredAspects; 
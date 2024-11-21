import '../styles/AspectDescriptions.css';

import React, { useEffect, useState } from 'react';
import { onValue, ref, remove } from 'firebase/database';

import ActiveEffectCard from '../components/ActiveEffectCard';
import PageLayout from '../components/PageLayout';
import database from '../firebaseConfig';

const DiscoveredAspects = () => {
  const [discoveredEffects, setDiscoveredEffects] = useState([]);

  useEffect(() => {
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

  const removeEffect = (effectName) => {
    const effectRef = ref(database, `activatedEffects/${effectName}`);
    remove(effectRef);
  };

  return (
    <PageLayout title="Discovered Aspect Effects">
      <ul className="active-effects-list">
        {discoveredEffects.map((effect, index) => (
          <ActiveEffectCard
            key={`${effect.name}-${index}`}
            effect={effect}
            onRemove={removeEffect}
          />
        ))}
      </ul>
    </PageLayout>
  );
};

export default DiscoveredAspects; 
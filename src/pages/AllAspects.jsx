import '../styles/AspectDescriptions.css';

import AspectEffectCard from '../components/AspectEffectCard';
import PageLayout from '../components/PageLayout';
import React from 'react';
import { aspectDescriptions } from '../assets/aspects';
import { useNavigate } from 'react-router-dom';

const AllAspects = () => {
  const navigate = useNavigate();

  // Convert aspect descriptions to a format similar to effects
  const allAspects = Object.entries(aspectDescriptions).map(([key, aspect]) => ({
    name: aspect.effect,
    description: aspect.description,
    duration: aspect.duration || "Permanent",
    mechanics: aspect.mechanics || [],
    aspectCombination: key,
    isWildSurge: false
  }));

  const handleEffectClick = (effect) => {
    // Save the selected aspects to localStorage
    if (effect.aspectCombination) {
      localStorage.setItem('selectedAspects', effect.aspectCombination);
    }
    // Navigate to the limbo page
    navigate('/limbo');
  };

  return (
    <PageLayout title="All Aspects">
      <div className="discovered-effects">
        {allAspects.map((aspect, index) => (
          <div 
            key={index} 
            onClick={() => handleEffectClick(aspect)}
            style={{ cursor: 'pointer' }}
          >
            <AspectEffectCard
              effect={aspect}
              showActivateButton={false}
              isDiscoveredPage={true}
              showRemoveButton={false}
            />
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default AllAspects; 
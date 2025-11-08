import '../styles/AspectDescriptions.css';

import React from 'react';

const XIcon = () => (
  <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5L15 15" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AspectEffectCard = ({ effect, onRemove, showActivateButton = false, onActivate, isDiscoveredPage, isDiscovered = isDiscoveredPage }) => {
  const handleRemove = (effectName, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this from your known aspects?')) {
      onRemove(effectName);
    }
  };

  return (
    <div className="description-card">
      <div className="effect-header">
        <h3 className="description-title">{effect.name}{isDiscoveredPage ? `: ${effect.aspectCombination}` : ""}</h3>
        {onRemove && (
          <button onClick={(e) => handleRemove(effect.name, e)} className="remove-effect-button">
            <XIcon />
          </button>
        )}
      </div>
      <p className="description-text">{effect.description}</p>
      {effect.mechanics && (
        <>
          <h4 className="mechanics-title">Mechanics:</h4>
          <ul className="mechanics-list">
            {Array.isArray(effect.mechanics) ? (
              effect.mechanics.map((mechanic, index) => (
                <li key={index} className="mechanics-item">
                  <span className="mechanics-item-title">{mechanic.title}:</span> {mechanic.content}
                </li>
              ))
            ) : (
              Object.entries(effect.mechanics).map(([title, content], index) => (
                <li key={index} className="mechanics-item">
                  <span className="mechanics-item-title">{title}:</span> {content}
                </li>
              ))
            )}
          </ul>
        </>
      )}
      <div className="button-container">
        {showActivateButton && effect.duration !== 0 && (
          <button className="activate-button" onClick={() => onActivate(effect)}>
            Activate Effect
          </button>
        )}
        {showActivateButton && !isDiscovered && effect.duration === 0 && (
          <button className="activate-button" onClick={() => onActivate(effect)}>
            Add to Discovered
          </button>
        )}
      </div>
    </div>
  );
};

export default AspectEffectCard; 
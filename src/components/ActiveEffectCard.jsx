import '../styles/AspectDescriptions.css';

import React from 'react';

const XIcon = () => (
  <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5L15 15" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ActiveEffectCard = ({ effect, onRemove, onClick }) => {
  return (
    <li 
        onClick={onClick}
        className="active-effect-item"
    >
      <div className="effect-left-column">
        <span className="active-effect-name">{effect.name}</span>
        <span className="effect-duration">
          {effect.duration ? `${effect.duration} rounds` : 'Permanent'}
        </span>
        <button
          onClick={() => onRemove(effect.name)}
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
  );
};

export default ActiveEffectCard; 
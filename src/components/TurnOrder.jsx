import '../styles/TurnOrder.css';

import useDnDStore from '../store/dndStore';
import { useEffect } from 'react';

const TurnOrder = () => {
  const {
    turnOrder,
    currentTurnIndex,
    expandedSections,
    toggleSection,
    nextTurn,
    previousTurn,
    moveTurnOrderUp,
    moveTurnOrderDown,
    updateTurnOrder,
    rollInitiative
  } = useDnDStore();

  // Update turn order when component mounts
  useEffect(() => {
    updateTurnOrder();
  }, [updateTurnOrder]);

  // No entities with initiative
  if (turnOrder.length === 0) {
    return (
      <div className="turn-order-section">
        <div className="section-header">
          <h3>Turn Order</h3>
          <button
            className="toggle-section-button"
            onClick={() => toggleSection('turnOrder')}
          >
            {expandedSections.turnOrder ? 'Hide Turn Order' : 'Show Turn Order'}
          </button>
        </div>
        
        {expandedSections.turnOrder && (
          <div className="turn-order-content">
            <p className="no-turn-order">No entities added to initiative order.</p>
            <div className="turn-order-controls">
              <button
                className="roll-initiative-button"
                onClick={rollInitiative}
              >
                Roll Initiative
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentEntity = turnOrder[currentTurnIndex];

  return (
    <div className="turn-order-section">
      <div className="section-header">
        <h3>Turn Order</h3>
        <button
          className="toggle-section-button"
          onClick={() => toggleSection('turnOrder')}
        >
          {expandedSections.turnOrder ? 'Hide Turn Order' : 'Show Turn Order'}
        </button>
      </div>
      
      {expandedSections.turnOrder && (
        <>
          <div className="current-turn">
            <span className="current-turn-label">Current Turn:</span>
            <span className={`current-turn-entity ${currentEntity.type}`}>
              {currentEntity.name}
              <span className="entity-type">
                {currentEntity.type === 'groupCollection' 
                  ? `(${currentEntity.ids?.length || 0} groups)` 
                  : `(${currentEntity.type})`}
              </span>
              <span className="initiative-value">Initiative: {currentEntity.initiative}</span>
            </span>
          </div>
          
          <div className="turn-order-controls">
            <button
              className="prev-turn-button"
              onClick={previousTurn}
              title="Previous Turn"
            >
              ← Previous
            </button>
            <button
              className="next-turn-button"
              onClick={nextTurn}
              title="Next Turn"
            >
              Next →
            </button>
            <button
              className="roll-initiative-button"
              onClick={rollInitiative}
              title="Roll initiative for all entities"
            >
              Roll Initiative
            </button>
          </div>
          
          <div className="turn-order-list">
            {turnOrder.map((entity, index) => (
              <div 
                key={entity.type === 'groupCollection' ? `collection-${entity.baseNamePattern}` : `${entity.type}-${entity.id}`}
                className={`turn-order-item ${index === currentTurnIndex ? 'current' : ''} ${entity.type}`}
              >
                <span className="turn-number">{index + 1}</span>
                <span className="entity-name">{entity.name}</span>
                <span className="entity-type">
                  {entity.type === 'groupCollection' 
                    ? `${entity.ids?.length || 0} groups` 
                    : entity.type}
                </span>
                <span className="initiative-value">{entity.initiative}</span>
                <div className="turn-order-actions">
                  <button
                    className="move-up-button"
                    onClick={() => moveTurnOrderUp(index)}
                    disabled={index === 0}
                    title="Move up in initiative order"
                  >
                    ↑
                  </button>
                  <button
                    className="move-down-button"
                    onClick={() => moveTurnOrderDown(index)}
                    disabled={index === turnOrder.length - 1}
                    title="Move down in initiative order"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TurnOrder; 
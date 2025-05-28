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
    rollInitiative,
    calculateHealthPercentage,
    getHealthColor
  } = useDnDStore();

  // Update turn order when component mounts
  useEffect(() => {
    updateTurnOrder();
  }, [updateTurnOrder]);

  // Helper function to render HP information
  const renderHpInfo = (entity) => {
    if (entity.type === 'character' || entity.type === 'boss') {
      // For individual characters and bosses
      if (entity.maxHp) {
        const healthPercentage = calculateHealthPercentage(entity.currentHp, entity.maxHp);
        const healthColor = getHealthColor(healthPercentage);
        
        return (
          <div className="entity-hp-info">
            <span className="hp-text">{entity.currentHp}/{entity.maxHp}</span>
            <div className="mini-health-bar-container">
              <div 
                className="mini-health-bar"
                style={{
                  width: `${healthPercentage}%`,
                  backgroundColor: healthColor
                }}
              ></div>
            </div>
          </div>
        );
      }
    } else if (entity.type === 'group') {
      // For individual groups
      if (entity.maxHp) {
        return (
          <div className="entity-hp-info">
            <span className="hp-text">{entity.count}/{entity.originalCount}</span>
            <div className="mini-health-bar-container">
              <div 
                className="mini-health-bar"
                style={{
                  width: `${calculateHealthPercentage(entity.count, entity.originalCount)}%`,
                  backgroundColor: getHealthColor(calculateHealthPercentage(entity.count, entity.originalCount))
                }}
              ></div>
            </div>
          </div>
        );
      }
    } else if (entity.type === 'groupCollection') {
      // For group collections
      return (
        <div className="entity-hp-info">
          <span className="hp-text">{entity.totalCount}/{entity.totalOriginalCount}</span>
          <div className="mini-health-bar-container">
            <div 
              className="mini-health-bar"
              style={{
                width: `${calculateHealthPercentage(entity.totalCount, entity.totalOriginalCount)}%`,
                backgroundColor: getHealthColor(calculateHealthPercentage(entity.totalCount, entity.totalOriginalCount))
              }}
            ></div>
          </div>
          <div className="group-members">
            {entity.groups && entity.groups.map((group) => (
              <div key={group.id} className="group-member-hp" title={`${group.count}/${group.originalCount} creatures - HP: ${group.currentHp}/${group.maxHp}`}>
                <span>{group.count}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

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
              {renderHpInfo(currentEntity)}
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
                <div className="entity-info">
                  <span className="entity-name">{entity.name}</span>
                  <span className="entity-type">
                    {entity.type === 'groupCollection' 
                      ? `${entity.ids?.length || 0} groups` 
                      : entity.type}
                  </span>
                </div>
                <span className="initiative-value">{entity.initiative}</span>
                {renderHpInfo(entity)}
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
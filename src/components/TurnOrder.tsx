import '../styles/TurnOrder.css';

import React, { useEffect } from 'react';
import HealthBar from './shared/HealthBar';
import { useTurnOrderProjection } from '../store/hooks/useTurnOrderProjection';

const TurnOrder: React.FC = () => {
  const {
    projectedTurnOrder,
    currentEntity,
    currentTurnIndex,
    expandedSections,
    toggleSection,
    nextTurn,
    previousTurn,
    moveTurnOrderUp,
    moveTurnOrderDown,
    updateTurnOrder,
    rollInitiative,
    scrollToEntity,
  } = useTurnOrderProjection();

  // Update turn order when component mounts (only once)
  useEffect(() => {
    updateTurnOrder();
  }, [updateTurnOrder]);

  // Handler for clicking on an entity in the initiative order
  const handleEntityClick = (entity: typeof currentEntity, e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent click if the event came from a button inside the row
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    scrollToEntity(entity);
  };

  const renderHpDisplay = (entity: typeof currentEntity) => {
    if (!entity?.display?.hpText) return null;

    const { healthPercentage, healthColour, groupBadges } = entity.display;
    
    // Extract HP values from hpText (format: "XX/YY HP")
    const hpMatch = entity.display.hpText.match(/(\d+)\/(\d+)/);
    const currentHp = hpMatch ? parseInt(hpMatch[1]) : 0;
    const maxHp = hpMatch ? parseInt(hpMatch[2]) : 1;

    return (
      <div className="entity-hp-info">
        <HealthBar 
          currentHp={currentHp}
          maxHp={maxHp}
          healthPercentage={healthPercentage}
          healthColor={healthColour}
          variant="mini"
          showText={true}
        />
        {groupBadges && (
          <div className="group-members">
            {groupBadges.map((group) => (
              <div
                key={group.id}
                className="group-member-hp"
                title={`${group.count}/${group.originalCount} creatures - HP: ${group.currentHp}/${group.maxHp}`}
              >
                <span>{group.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // No entities with initiative
  if (projectedTurnOrder.length === 0) {
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
              {renderHpDisplay(currentEntity)}
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
            {projectedTurnOrder.map((entity, index) => (
              <div 
                key={entity.type === 'groupCollection' ? `collection-${entity.baseNamePattern}` : `${entity.type}-${entity.id}`}
                className={`turn-order-item ${index === currentTurnIndex ? 'current' : ''} ${entity.type}`}
                onClick={(e) => handleEntityClick(entity, e)}
              >
                <span className="turn-number">{index + 1}</span>
                
                <div className="entity-info">
                  <div className="entity-name-row">
                    <span className="entity-name">{entity.name}</span>
                    <span className="entity-type">
                      {entity.type === 'groupCollection' 
                        ? `${entity.ids?.length || 0} groups` 
                        : entity.type}
                    </span>
                  </div>
                  {renderHpDisplay(entity)}
                </div>
                
                <span className="initiative-value">{entity.initiative}</span>
                
                <div className="turn-order-actions">
                  <button
                    className="move-up-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTurnOrderUp(index);
                    }}
                    disabled={index === 0}
                    title="Move up in initiative order"
                  >
                    ↑
                  </button>
                  <button
                    className="move-down-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTurnOrderDown(index);
                    }}
                    disabled={index === projectedTurnOrder.length - 1}
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


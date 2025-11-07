import '../styles/TurnOrder.css';

import { useEffect, useMemo } from 'react';

import { formatTurnOrderEntry } from '../store/utils/turnOrderFormat';
import { shallow } from 'zustand/shallow';
import useDnDStore from '../store/dndStore';

const TurnOrder = () => {
  // Select primitive values and arrays separately
  const turnOrder = useDnDStore((state) => state.turnOrder);
  const currentTurnIndex = useDnDStore((state) => state.currentTurnIndex);
  const expandedSections = useDnDStore((state) => state.expandedSections);
  
  // Select functions separately (they should be stable)
  const toggleSection = useDnDStore((state) => state.toggleSection);
  const nextTurn = useDnDStore((state) => state.nextTurn);
  const previousTurn = useDnDStore((state) => state.previousTurn);
  const moveTurnOrderUp = useDnDStore((state) => state.moveTurnOrderUp);
  const moveTurnOrderDown = useDnDStore((state) => state.moveTurnOrderDown);
  const updateTurnOrder = useDnDStore((state) => state.updateTurnOrder);
  const rollInitiative = useDnDStore((state) => state.rollInitiative);
  const scrollToEntity = useDnDStore((state) => state.scrollToEntity);
  const calculateHealthPercentage = useDnDStore((state) => state.calculateHealthPercentage);
  const getHealthColour = useDnDStore((state) => state.getHealthColour);

  const projectedTurnOrder = useMemo(
    () =>
      turnOrder.map((entry) => ({
        ...entry,
        display: formatTurnOrderEntry(entry, {
          calculateHealthPercentage,
          getHealthColour,
        }),
      })),
    [turnOrder, calculateHealthPercentage, getHealthColour]
  );

  // Update turn order when component mounts (only once)
  useEffect(() => {
    updateTurnOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for clicking on an entity in the initiative order
  const handleEntityClick = (entity, e) => {
    // Prevent click if the event came from a button inside the row
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    
    scrollToEntity(entity);
  };

  const renderHpDisplay = (entity) => {
    if (!entity?.display?.hpText) return null;

    const { hpText, healthPercentage, healthColour, groupBadges } = entity.display;

    return (
      <div className="entity-hp-info">
        <span className="hp-text">{hpText}</span>
        <div className="mini-health-bar-container">
          <div
            className="mini-health-bar"
            style={{
              width: `${healthPercentage}%`,
              backgroundColor: healthColour,
            }}
          ></div>
        </div>
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

  const currentEntity = projectedTurnOrder[currentTurnIndex];

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
                    disabled={index === turnOrder.length - 1}
                    title="Move down in initiative order"
                  >
                    ↓
                  </button>
                </div>
                
                {renderHpDisplay(entity)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TurnOrder; 
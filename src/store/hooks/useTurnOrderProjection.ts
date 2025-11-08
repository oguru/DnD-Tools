import { useMemo } from 'react';
import useDnDStore from '../dndStore';
import { formatTurnOrderEntry } from '../utils/turnOrderFormat';

export const useTurnOrderProjection = () => {
  // Select state values separately
  const turnOrder = useDnDStore((state) => state.turnOrder);
  const currentTurnIndex = useDnDStore((state) => state.currentTurnIndex);
  const expandedSections = useDnDStore((state) => state.expandedSections);
  
  // Select utility functions
  const calculateHealthPercentage = useDnDStore((state) => state.calculateHealthPercentage);
  const getHealthColour = useDnDStore((state) => state.getHealthColour);
  
  // Select action functions
  const toggleSection = useDnDStore((state) => state.toggleSection);
  const nextTurn = useDnDStore((state) => state.nextTurn);
  const previousTurn = useDnDStore((state) => state.previousTurn);
  const moveTurnOrderUp = useDnDStore((state) => state.moveTurnOrderUp);
  const moveTurnOrderDown = useDnDStore((state) => state.moveTurnOrderDown);
  const updateTurnOrder = useDnDStore((state) => state.updateTurnOrder);
  const rollInitiative = useDnDStore((state) => state.rollInitiative);
  const scrollToEntity = useDnDStore((state) => state.scrollToEntity);

  // Project turn order with formatted display information
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

  // Get current entity
  const currentEntity = projectedTurnOrder[currentTurnIndex];

  return {
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
  };
};


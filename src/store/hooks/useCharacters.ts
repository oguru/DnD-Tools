import useDnDStore from '../dndStore';

export const useCharactersSectionState = () => {
  // Select state values separately
  const characters = useDnDStore((state) => state.characters);
  const expandedSections = useDnDStore((state) => state.expandedSections);
  const targetEntity = useDnDStore((state) => state.targetEntity);
  
  // Select action functions separately (they should be stable)
  const updateCharacter = useDnDStore((state) => state.updateCharacter);
  const removeCharacter = useDnDStore((state) => state.removeCharacter);
  const toggleSection = useDnDStore((state) => state.toggleSection);
  const addCharacter = useDnDStore((state) => state.addCharacter);
  const resetCharacters = useDnDStore((state) => state.resetCharacters);
  const clearTemporaryHitPoints = useDnDStore((state) => state.clearTemporaryHitPoints);
  const calculateHealthPercentage = useDnDStore((state) => state.calculateHealthPercentage);
  const getHealthColour = useDnDStore((state) => state.getHealthColour);
  const setTargetEntity = useDnDStore((state) => state.setTargetEntity);
  const scrollToDamageSection = useDnDStore((state) => state.scrollToDamageSection);
  const toggleCharacterAoeTarget = useDnDStore((state) => state.toggleCharacterAoeTarget);
  const setCharactersSectionRef = useDnDStore((state) => state.setCharactersSectionRef);
  const registerEntityRef = useDnDStore((state) => state.registerEntityRef);

  return {
    characters,
    expandedSections,
    targetEntity,
    updateCharacter,
    removeCharacter,
    toggleSection,
    addCharacter,
    resetCharacters,
    clearTemporaryHitPoints,
    calculateHealthPercentage,
    getHealthColour,
    setTargetEntity,
    scrollToDamageSection,
    toggleCharacterAoeTarget,
    setCharactersSectionRef,
    registerEntityRef,
  };
};



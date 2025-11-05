const defaultExpandedSections = {
  characters: true,
  bosses: true,
  groups: true,
  damage: true,
  results: true,
  turnOrder: true,
};

export const createUiSlice = (set, get) => ({
  targetEntity: null,
  expandedSections: defaultExpandedSections,
  damageApplicationRef: null,
  charactersSectionRef: null,
  bossesSectionRef: null,
  groupsSectionRef: null,
  entityRefs: {},

  toggleSection: (section) => {
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    }));
  },

  setTargetEntity: (entity) => {
    set({ targetEntity: entity });
  },

  setDamageApplicationRef: (ref) => {
    set({ damageApplicationRef: ref });
  },

  setCharactersSectionRef: (ref) => {
    set({ charactersSectionRef: ref });
  },

  setBossesSectionRef: (ref) => {
    set({ bossesSectionRef: ref });
  },

  setGroupsSectionRef: (ref) => {
    set({ groupsSectionRef: ref });
  },

  registerEntityRef: (type, id, ref) => {
    set((state) => ({
      entityRefs: {
        ...state.entityRefs,
        [`${type}-${id}`]: ref,
      },
    }));
  },

  scrollToEntity: (entity) => {
    if (!entity || !entity.type) return;

    const {
      charactersSectionRef,
      bossesSectionRef,
      groupsSectionRef,
      expandedSections,
      entityRefs,
    } = get();

    let sectionRef = null;
    let sectionName = '';

    if (entity.type === 'character') {
      sectionRef = charactersSectionRef;
      sectionName = 'characters';
    } else if (entity.type === 'boss') {
      sectionRef = bossesSectionRef;
      sectionName = 'groups';
    } else if (entity.type === 'group' || entity.type === 'groupCollection') {
      sectionRef = groupsSectionRef;
      sectionName = 'groups';
    }

    if (sectionRef && sectionName && !expandedSections[sectionName]) {
      set((state) => ({
        expandedSections: {
          ...state.expandedSections,
          [sectionName]: true,
        },
      }));
    }

    let targetId = entity.id;
    if (entity.type === 'groupCollection' && entity.ids && entity.ids.length > 0) {
      entity.type = 'group';
      targetId = entity.ids[0];
    }

    setTimeout(() => {
      const entityRef = entityRefs[`${entity.type}-${targetId}`];

      if (entityRef && entityRef.current) {
        entityRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } else if (sectionRef && sectionRef.current) {
        sectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  },

  scrollToDamageSection: () => {
    const { damageApplicationRef, expandedSections } = get();

    if (!expandedSections.damage) {
      set((state) => ({
        expandedSections: {
          ...state.expandedSections,
          damage: true,
        },
      }));
    }

    if (damageApplicationRef && damageApplicationRef.current) {
      damageApplicationRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  },
});

export default createUiSlice;


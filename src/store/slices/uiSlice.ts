import type { TargetEntity } from '@models/ui/TargetEntity';

type SectionName = 'characters' | 'bosses' | 'groups' | 'damage' | 'results' | 'turnOrder';
type ExpandedSections = Record<SectionName, boolean>;
type EntityRefs = Record<string, React.RefObject<HTMLElement>>;

interface Entity {
  id: string;
  type: 'character' | 'boss' | 'group' | 'groupCollection';
  ids?: string[];
}

interface UiState {
  targetEntity: TargetEntity | null;
  expandedSections: ExpandedSections;
  damageApplicationRef: React.RefObject<HTMLElement> | null;
  charactersSectionRef: React.RefObject<HTMLElement> | null;
  bossesSectionRef: React.RefObject<HTMLElement> | null;
  groupsSectionRef: React.RefObject<HTMLElement> | null;
  entityRefs: EntityRefs;
}

interface UiActions {
  toggleSection: (section: SectionName) => void;
  setTargetEntity: (entity: TargetEntity | null) => void;
  setDamageApplicationRef: (ref: React.RefObject<HTMLElement> | null) => void;
  setCharactersSectionRef: (ref: React.RefObject<HTMLElement> | null) => void;
  setBossesSectionRef: (ref: React.RefObject<HTMLElement> | null) => void;
  setGroupsSectionRef: (ref: React.RefObject<HTMLElement> | null) => void;
  registerEntityRef: (type: string, id: string, ref: React.RefObject<HTMLElement>) => void;
  scrollToEntity: (entity: Entity) => void;
  scrollToDamageSection: () => void;
}

const defaultExpandedSections: ExpandedSections = {
  characters: true,
  bosses: true,
  groups: true,
  damage: true,
  results: true,
  turnOrder: true,
};

export const createUiSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): UiState & UiActions => ({
  targetEntity: null,
  expandedSections: defaultExpandedSections,
  damageApplicationRef: null,
  charactersSectionRef: null,
  bossesSectionRef: null,
  groupsSectionRef: null,
  entityRefs: {},

  toggleSection: (section: SectionName) => {
    set((state: any) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    }));
  },

  setTargetEntity: (entity: TargetEntity | null) => {
    set({ targetEntity: entity });
  },

  setDamageApplicationRef: (ref: React.RefObject<HTMLElement> | null) => {
    set({ damageApplicationRef: ref });
  },

  setCharactersSectionRef: (ref: React.RefObject<HTMLElement> | null) => {
    set({ charactersSectionRef: ref });
  },

  setBossesSectionRef: (ref: React.RefObject<HTMLElement> | null) => {
    set({ bossesSectionRef: ref });
  },

  setGroupsSectionRef: (ref: React.RefObject<HTMLElement> | null) => {
    set({ groupsSectionRef: ref });
  },

  registerEntityRef: (type: string, id: string, ref: React.RefObject<HTMLElement>) => {
    set((state: any) => ({
      entityRefs: {
        ...state.entityRefs,
        [`${type}-${id}`]: ref,
      },
    }));
  },

  scrollToEntity: (entity: Entity) => {
    if (!entity || !entity.type) return;

    const {
      charactersSectionRef,
      bossesSectionRef,
      groupsSectionRef,
      expandedSections,
      entityRefs,
    } = get();

    let sectionRef: React.RefObject<HTMLElement> | null = null;
    let sectionName: SectionName | '' = '';

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
      set((state: any) => ({
        expandedSections: {
          ...state.expandedSections,
          [sectionName]: true,
        },
      }));
    }

    let targetId = entity.id;
    let targetType = entity.type;
    if (entity.type === 'groupCollection' && entity.ids && entity.ids.length > 0) {
      targetType = 'group';
      targetId = entity.ids[0];
    }

    setTimeout(() => {
      const entityRef = entityRefs[`${targetType}-${targetId}`];

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
      set((state: any) => ({
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


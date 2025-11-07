import '@testing-library/jest-dom';

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import GroupsSection from '@/components/GroupsSection';
import useDnDStore from '@/store/dndStore';

vi.mock('@/store/dndStore', () => {
  const { create } = require('zustand');
  return {
    __esModule: true,
    default: create((set: any) => ({
      groupTemplate: {
        name: 'Goblins',
        maxHp: 10,
        currentHp: 10,
        ac: 12,
        count: 3,
        originalCount: 3,
        initiative: 0,
        initiativeModifier: 0,
        showDefenses: true,
        showSavingThrows: false,
        defenses: { resistances: [], vulnerabilities: [], immunities: [] },
        savingThrows: {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          wis: 0,
          cha: 0,
        },
        tempHp: 0,
        damage: { numDice: 1, diceType: 6, modifier: 0, damageType: 'slashing' },
      },
      expandedSections: {
        characters: false,
        bosses: false,
        groups: true,
        damage: false,
        results: false,
        turnOrder: false,
      },
      updateGroupTemplate: (field: string, value: any) =>
        set((state: any) => {
          if (field === 'defenses') {
            return { groupTemplate: { ...state.groupTemplate, defenses: value } };
          }

          const [parent, child] = field.split('.');
          if (child) {
            return {
              groupTemplate: {
                ...state.groupTemplate,
                [parent]: {
                  ...(state.groupTemplate as any)[parent],
                  [child]: value,
                },
              },
            };
          }

          return {
            groupTemplate: { ...state.groupTemplate, [field]: value },
          };
        }),
      enemyGroups: [],
      bosses: [],
      characters: [],
      toggleSection: () => {},
      addEnemyGroup: () => {},
      addMultipleEnemyGroups: () => {},
      removeEnemyGroup: () => {},
      duplicateGroup: () => {},
      toggleGroupAoeTarget: () => {},
      toggleGroupSavingThrows: () => {},
      toggleGroupTemplateSavingThrows: () => {},
      toggleGroupTemplateDefenses: () => {},
      setTemporaryHitPointsGroup: () => {},
      updateGroupSavingThrow: () => {},
      applyDamageToGroup: () => {},
      applyDamageToAllInGroup: () => {},
      applyDamageToAllGroups: () => {},
      applyDamageToAllGroupsInAoe: () => {},
      applyDamageToAllGroupsInAoeInternal: () => '',
      updateEnemyGroup: () => {},
      rollGroupsAttacks: () => {},
      applyDamageToMultipleCharacters: () => {},
      applyHealingToGroup: () => {},
      addBoss: () => {},
      resetBossesHealth: () => {},
      clearAllBosses: () => {},
      toggleBossTemplateSavingThrows: () => {},
      setBossTarget: () => {},
      setBossAoeTarget: () => {},
      prepareBossAoeAttack: () => {},
      addBossAttackResult: () => {},
      updateBossAttackResult: () => {},
      setBossAttackCharges: () => {},
      setBossAttackRemoved: () => {},
      setGroupsSectionRef: () => {},
      registerEntityRef: () => {},
      setCharactersSectionRef: () => {},
    })),
  };
});




beforeEach(() => {
  useDnDStore.setState({
    groupTemplate: {
      ...useDnDStore.getState().groupTemplate,
      defenses: { resistances: [], vulnerabilities: [], immunities: [] },
    },
  });
});

describe('GroupsSection component', () => {
  it('toggles template defenses exclusively', () => {
    render(<GroupsSection />);

    const resistanceButton = document.querySelector('[title="Fire (Resistance)"]');
    const vulnerabilityButton = document.querySelector('[title="Fire (Vulnerability)"]');
    const immunityButton = document.querySelector('[title="Fire (Immunity)"]');

    expect(resistanceButton).not.toBeNull();
    expect(vulnerabilityButton).not.toBeNull();
    expect(immunityButton).not.toBeNull();

    fireEvent.click(resistanceButton!);
    let state = useDnDStore.getState();
    expect(state.groupTemplate.defenses?.resistances).toContain('fire');

    fireEvent.click(vulnerabilityButton!);
    state = useDnDStore.getState();
    expect(state.groupTemplate.defenses?.resistances).not.toContain('fire');
    expect(state.groupTemplate.defenses?.vulnerabilities).toContain('fire');

    fireEvent.click(immunityButton!);
    state = useDnDStore.getState();
    expect(state.groupTemplate.defenses?.vulnerabilities).not.toContain('fire');
    expect(state.groupTemplate.defenses?.immunities).toContain('fire');
  });
});
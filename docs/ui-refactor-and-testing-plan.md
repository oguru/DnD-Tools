## UI Refactor and Testing Plan

This document outlines the refactor and testing plan for the key UI components to align with the sliced store, reduce duplication, and improve testability and performance.

### Global Principles
- Keep components declarative; push derived state into hooks or utilities.
- Keep store interactions via selectors; avoid selecting entire state.
- Co-locate small, pure UI helpers under `src/utils/view/`.
- Standardise message formatting via `src/store/utils/resultsFormat.ts`.

---

### DamageApplication.jsx

Refactor
- Extract orchestration into a new hook `useAoeDamage()` (in `src/store/hooks/useAoeDamage.ts`):
  - Build/save AoE parameters (damage, types, DC, halfOnSave, percentAffected, applyToAll).
  - Manage save state (character/boss/group) with consistent keys.
  - Compute per-component damage (multi-type) with modifiers/adjustments.
  - Bridge to store `applyAoeDamageToAll` and clean up flags after apply.
- Move formatting helpers to `utils/view/aoe.ts`.
- Ensure scroll/refs go through the UI slice only.

Testing
- Render with mocked store and JSDOM.
- Cover:
  - Single target: hit/miss/crit; correct temp HP behaviour.
  - AoE manual saves: modifier/adjustment application; entity inclusion/exclusion.
  - Apply-to-all and percent-affected, state clearing, and flag reset.
  - Multi-type damage component pre-views and finalisation.

---

### TurnOrder.jsx

Refactor
- Extract `useTurnOrderProjection()` to compute formatted entries with all HP totals/percentages.
- Extract `formatTurnOrderEntry(entry)` to pure util in `src/store/utils/turnOrderFormat.ts` for text/bars.
- Keep scroll handlers from UI slice (refs) in the component.

Testing
- Verify character and boss entries show current/max HP and bars/colours.
- For group and groupCollection:
  - Validate totals, averages and bar percentages.
- Verify next/previous/move up/down update selection (mock store actions).

---

### CharacterSection.jsx

Refactor
- Create `useCharacters()` selector to memoise visible rows and avoid re-renders.
- Extract defence exclusivity toggles into `store/utils/defense.ts`.
- Extract “empty slot” logic into a tiny helper for readability.

Testing
- Field edits propagate to store (hp/temp/max/ac/init).
- Empty-slot behaviour works (autofill and add).
- Defence exclusivity correctly toggles chips across categories.
- Target/AoE toggle dispatches expected actions.

---

### GroupsSection.jsx

Refactor
- Create `useGroupAttacks()`:
  - Target selection mapping and validation.
  - Multi-creature attack roll aggregation; crit and fumble handling.
  - AC override recomputation; damage ratio adjustment; final application to characters.
- Extract creature HP list builder into `utils/view/groups.ts`.
- Ensure saving throws editor wiring is clean and side-effect free.

Testing
- Add/duplicate/remove groups; confirm creatures arrays and defaults.
- Creature HP grid renders from `creatures[].currentHp` and updates after damage.
- Attack roll aggregation shows correct totals; AC override recompute changes damage as expected.
- Apply-all damage composes details and dispatches to store.

---

### AttackResults.jsx

Refactor
- Extract `formatMessage()` into `store/utils/resultsFormat.ts`.
- Group batch healing results by `healing-<timestamp>` prefix (already done); make grouping util pure.

Testing
- Damage/healing/AoE message highlighting renders as HTML safely.
- Clearing and dismissing results update state accordingly.
- Batch healing results grouped and rendered compactly.

---

### Hooks and Utilities to Introduce
- `src/store/hooks/useAoeDamage.ts`
- `src/store/hooks/useGroupAttacks.ts`
- `src/store/hooks/useTurnOrderProjection.ts`
- `src/store/utils/resultsFormat.ts`
- `src/store/utils/turnOrderFormat.ts`
- `src/store/utils/groups.ts` (averaging/aggregation)
- `src/store/utils/defense.ts` (exclusive-toggles)
- `src/utils/view/aoe.ts`, `src/utils/view/groups.ts` (UI-only helpers)

---

### Test Coverage Targets
- Unit: 100% for utilities; high coverage for hooks (no DOM). 
- Component (RTL): critical paths for all five components above.
- Snapshot testing limited to simple formatters (avoid brittle snapshots for large components).



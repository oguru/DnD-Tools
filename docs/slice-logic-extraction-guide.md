## Slice Logic Extraction Guide

This guide documents what to move out of slices and where to put it, to enforce a clear separation between state mutation (slices) and derived/formatting logic (utils/hooks).

### Principles
- Slices should primarily define state shape and mutation actions.
- Any function that does not mutate slice state or only computes a derived value belongs in a utility or hook.
- Prefer pure utilities in `src/store/utils/` for stateless transforms.
- Prefer hooks in `src/store/hooks/` when you need to read store state reactively or compose selectors.

### Candidate Categories
1) Pure formatting/aggregation
   - Example: AoE result string joiners, turn order entry text/badge builders.
   - Location: `src/store/utils/*`, e.g., `resultsFormat.ts`, `turnOrderFormat.ts`, `groups.ts`.

2) Derived state builders
   - Example: project turn order entities with computed totals; compute AoE parameters from UI.
   - Location: `src/store/hooks/*`, e.g., `useTurnOrderProjection.ts`, `useAoeDamage.ts`.

3) Reusable maths/logic
   - Example: average HP across creatures; component-damage calculators; exclusivity toggles for defenses.
   - Location: `src/store/utils/*`, e.g., `groups.ts`, `defense.ts`.

### Specific Move List (Initial)
- charactersSlice
  - Keep: actions that mutate characters, AoE application coordination.
  - Move: any result-string construction or damage text formatting → `store/utils/resultsFormat.ts`.

- bossesSlice
  - Keep: actions mutating bosses and charges.
  - Move: AoE summary text builders → `store/utils/resultsFormat.ts` (unify with groups/characters).

- groupsSlice
  - Keep: state migrations, damage application mutations.
  - Move: group average HP and total calculators → `store/utils/groups.ts`.
  - Move: AoE result message composition → `store/utils/resultsFormat.ts`.

- turnOrderSlice
  - Keep: mutation that builds the flat turn order state (IDs/types/initiative).
  - Move: projections/formatters (HP text and bars) → `store/hooks/useTurnOrderProjection.ts`, `store/utils/turnOrderFormat.ts`.

- uiSlice, utilitySlice, persistenceSlice, combatSlice
  - ui: keep refs and UI toggles; move selector-heavy derived views into hooks.
  - utility: remains a utility slice; public API minimal and tested.
  - persistence: keep import/export; any JSON formatting helpers → `store/utils/storage` or `resultsFormat`.
  - combat: keep orchestration; result string creation moves to `resultsFormat` to ensure consistency.

### Coding Guidelines
- Utilities must be pure; accept inputs and return outputs. No side effects.
- Hooks can read from `useDnDStore` and memoise expensive selectors with shallow equality.
- Never import components from utils/hooks; keep direction one-way.
- Use UK spelling consistently (e.g., `getHealthColour`), but keep external data keys as-is.

### Testing
- Utilities: unit test with exhaustive cases, 100% coverage target.
- Hooks: test with a small fake store or mock the selector outputs.

### File Structure (Proposed)
```
src/
  store/
    hooks/
      useAoeDamage.ts
      useGroupAttacks.ts
      useTurnOrderProjection.ts
    utils/
      groups.ts            // group averaging/aggregation
      defense.ts           // exclusive toggles
      resultsFormat.ts     // unified result message formatting
      turnOrderFormat.ts   // turn order entry formatting helpers
```



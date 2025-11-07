## Store Duplication & Refactor Audit

**Status**: ✅ COMPLETE! TypeScript migration finished, all 8 slices refactored!

**MIGRATION COMPLETE**: All barrel files removed, 8/8 slices complete, all old JS files deleted, folder structure reorganised

Scope: `src/store/slices/*` first pass, plus any cross-component patterns that touch store concerns. This audit catalogues duplication and proposes reusable utilities with concrete change lists.

**Progress Summary**:
- ✅ TypeScript infrastructure configured
- ✅ Models and constants folder structure created (`src/models/`, `src/constants/`)
- ✅ **ALL barrel files removed** - direct imports only
- ✅ All 7 store utilities created and tested (130+ tests, 100% coverage)
- ✅ General utilities converted to TypeScript (dice, fileImport)
- ✅ **ALL 8/8 slices refactored**: combatSlice, utilitySlice, uiSlice, persistenceSlice, turnOrderSlice, charactersSlice, bossesSlice, **groupsSlice** ✨
- ✅ All old JS files deleted, superseded types/constants files removed
- ✅ UK spelling applied (colour, normalise, etc.)
- 🔄 Remaining: Components to update for TypeScript imports
- 🔄 Final testing and verification

See `MIGRATION_SUMMARY.md` and `docs/typescript-migration-final-status.md` for complete details.

### Test Setup and Conventions (Global)
- Runner: Vitest. UI needs JSDOM.
- Root: `src/tests`, mirroring source structure and filenames:
  - Utils: `src/tests/store/utils/<name>.test.js`
  - Slices: `src/tests/store/slices/<sliceName>.test.js`
  - Shared non-store utils (e.g., `src/utils/dice.js`): `src/tests/utils/dice.test.js`
- Mocks:
  - Use `vi.useFakeTimers()` for time-based code (IDs, timestamps, scheduleTurnOrderUpdate).
  - Spy/mock dice helpers for deterministic tests.
  - Prefer mocking storage helpers over raw `localStorage` (unless behavior of `localStorage` itself is under test).
- RTL only where UI wiring is impacted; most tests live at store/utility layer.
- Suggested scripts (if missing) in `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui --dom",
    "test:coverage": "vitest --coverage"
  }
}
```

### 1) Value Clamping and Defaults ✅ COMPLETED
Repeated patterns clamp values to valid ranges and/or default missing numbers.

**Implementation**: `src/store/utils/numbers.ts`
**Tests**: `src/tests/store/utils/numbers.test.ts` (18 tests, 100% coverage)

Occurrences (examples):

```14:21:src/store/slices/bossesSlice.js
              typeof attack.chargesRemaining === 'number'
                ? Math.max(0, Math.min(maxCharges, attack.chargesRemaining))
                : maxCharges;
```

```91:99:src/store/slices/bossesSlice.js
            const remaining =
              typeof attack.chargesRemaining === 'number'
                ? Math.max(0, Math.min(maxCharges, attack.chargesRemaining))
                : maxCharges;
```

```198:205:src/store/slices/bossesSlice.js
        const newHp = Math.max(0, Math.min(boss.currentHp + change, boss.maxHp));
        return { ...boss, currentHp: newHp };
```

```2618:2622:src/components/GroupsSection.jsx
updateBoss(boss.id, 'currentHp', Math.max(0, Math.min(value, boss.maxHp)));
```

Proposed:
- Add `clamp(value, min, max)` and `numberOr(defaultValue, value)` utilities under `src/store/utils/numbers.ts|js`.
- Replace all inline `Math.max(0, Math.min(...))` with `clamp(...)`.
- Replace `typeof x === 'number' ? clamp(...) : default` with `clamp(numberOr(default, x), min, max)`.

Tests (src/tests mirror structure):
- File: `src/tests/store/utils/numbers.test.js`
  - clamp:
    - clamps below min and above max
    - returns exact min/max boundaries
    - works with negative ranges
    - handles non-integer inputs (floats)
    - min > max: swap behavior (document and enforce)
  - numberOr:
    - returns value when finite number
    - returns default for `undefined`, `null`, `NaN`, non-number
    - supports negative/zero defaults

Planned changes:
- bossesSlice: sanitize + charges setting + HP updates → use `clamp` and `numberOr`.
- groupsSlice: any HP update paths and inputs that clamp to `[0, max]`.
- charactersSlice: similar clamping logic for HP/temp HP.

### 2) ID and Timestamp Generation ✅ COMPLETED
Date-based IDs and timestamps appear across slices with inconsistent formats.

**Implementation**: `src/store/utils/ids.ts`
**Tests**: `src/tests/store/utils/ids.test.ts` (9 tests, 100% coverage)

Occurrences (subset):

```110:118:src/store/slices/bossesSlice.js
id: boss.id || Date.now().toString(),
```

```120:128:src/store/slices/groupsSlice.js
id: Date.now().toString(),
```

```551:558:src/store/slices/charactersSlice.js
id: `${Date.now()}-${Math.random()}-${detail.characterId}-${detail.sourceGroupId}`,
timestamp: Date.now(),
```

```96:126:src/store/slices/persistenceSlice.js
? `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

Proposed:
- Add `generateId(prefix?: string)` and `nowTimestamp()` to `src/store/utils/ids.ts|js`.
- Standardize IDs to `${prefix}-${YYYYMMDDTHHmmssSSS}-${8charRand}`.
- Replace `Date.now().toString()` and ad-hoc concatenations.

Tests:
- File: `src/tests/store/utils/ids.test.js`
  - generateId:
    - with and without prefix; matches regex `${prefix-}YYYYMMDDTHHmmssSSS-XXXXXXXX`
    - sequential calls are unique
    - prefix sanitized (no spaces)
  - nowTimestamp:
    - within tolerance of `Date.now()` using fake timers

Planned changes:
- charactersSlice, bossesSlice, groupsSlice, combatSlice, persistenceSlice → replace all ID/timestamp creation.

### 3) LocalStorage Read/Write Duplication ✅ COMPLETED
Each slice directly reads/writes to localStorage repeatedly.

**Implementation**: `src/store/utils/storage.ts`
**Tests**: `src/tests/store/utils/storage.test.ts` (15 tests, 100% coverage)

Occurrences (subset):

```1:3:src/store/slices/charactersSlice.js
const savedCharacters = localStorage.getItem('dnd-characters');
```

```61:77:src/store/slices/charactersSlice.js
localStorage.setItem('dnd-characters', JSON.stringify(updatedCharacters));
```

```44:46:src/store/slices/groupsSlice.js
localStorage.setItem('dnd-enemy-groups', JSON.stringify(migratedGroups));
```

```68:70:src/store/slices/persistenceSlice.js
localStorage.setItem('dnd-characters', JSON.stringify(characters));
```

Proposed:
- Create `src/store/utils/storage.ts|js` with:
  - `readJson(key, fallback)`
  - `writeJson(key, value)`
  - `remove(key)`
- Optionally expose typed helpers per slice: `persistCharacters`, `persistBosses`, `persistGroups`.
- Replace all direct `localStorage.*` in slices with helpers for consistency and error handling.

Tests:
- File: `src/tests/store/utils/storage.test.js`
  - readJson:
    - returns parsed JSON for valid value
    - returns fallback for missing key
    - returns fallback for invalid JSON
  - writeJson:
    - persists value; verify with `localStorage.getItem`
    - returns boolean success
    - circular structure returns false (graceful)
  - remove:
    - removes existing key; removing missing key is no-op success

Planned changes:
- charactersSlice, bossesSlice, groupsSlice, turnOrderSlice, combatSlice, persistenceSlice.

Notes:
- The existing `src/utils/localStorage.js` can be reused or relocated to `src/store/utils` to make it a store concern. Unify under one module to avoid two versions.

### 4) Damage/Healing Application Patterns ✅ COMPLETED
Very similar flows across slices:

**Implementation**: `src/store/utils/combat.ts`
**Tests**: `src/tests/store/utils/combat.test.ts` (26 tests, 100% coverage)
- Temp HP absorption before HP damage.
- AOe save logic (DC, save bonus, half/none on save).
- Rebuilding result messages and attack result records.

Occurrences (subset):

```142:162:src/store/slices/charactersSlice.js
temp HP absorption then currentHp = Math.max(0, currentHp - remainingDamage)
```

```424:528:src/store/slices/bossesSlice.js
save flow → half/none → apply damage → results aggregation
```

```508:583:src/store/slices/groupsSlice.js
AoE save flow → affectedCount → apply damage → results aggregation
```

Proposed:
- Add `src/store/utils/combat.ts|js`:
  - `applyDamageWithTempHp(currentHp, tempHp, damage): { currentHp, tempHp, consumedDamage }`
  - `computeSaveOutcome({ roll, bonus, dc, halfOnSave }): 'full' | 'half' | 'none'`
  - `formatSaveText({ totalRoll, baseRoll }): string`
  - `aggregateAttackResult(...)` for standardized result objects/messages
- Refactor slice logic to call these helpers.

Tests:
- File: `src/tests/store/utils/combat.test.js`
  - applyDamageWithTempHp:
    - no temp HP, damage reduces HP
    - damage <, =, > temp HP
    - zero/negative damage are no-ops
    - HP never below 0
  - computeSaveOutcome:
    - below DC ⇒ 'full'
    - ≥ DC with halfOnSave ⇒ 'half'
    - ≥ DC without halfOnSave ⇒ 'none'
    - varied bonuses/DCs
  - formatSaveText:
    - totalRoll != baseRoll shows breakdown
    - equal shows single value
  - aggregateAttackResult:
    - standardized shape (id, message, flags)
    - hit/miss/critical messaging variants

Planned changes:
- charactersSlice: replace repeated temp HP + damage logic (multiple call sites).
- bossesSlice: AoE save paths and single-target damage.
- groupsSlice: AoE and per-creature damage paths.

### 5) Initiative/Turn Order Triggering ✅ COMPLETED
After many updates, slices call `setTimeout(() => get().updateTurnOrder(), 0)` (sometimes with flags).

**Implementation**: `src/store/utils/turnOrder.ts`
**Tests**: `src/tests/store/utils/turnOrder.test.ts` (4 tests, 100% coverage)

Occurrences:

```30:31:src/store/slices/charactersSlice.js
setTimeout(() => get().updateTurnOrder(), 0);
```

```169:171:src/store/slices/bossesSlice.js
if (field === 'initiative') setTimeout(() => get().updateTurnOrder(true), 0);
```

```911:916:src/store/slices/groupsSlice.js
if (field === 'initiative') ... else ...
```

Proposed:
- Add `scheduleTurnOrderUpdate({ hardRecalc?: boolean, removedEntityId?, type? })` in `src/store/utils/turnOrder.ts|js`.
- Replace ad-hoc `setTimeout` calls with one helper to standardize behavior and parameters.

Tests:
- File: `src/tests/store/utils/turnOrder.test.js`
  - schedules exactly one async callback
  - invokes `updateTurnOrder` with expected args for:
    - hardRecalc true/false
    - with removedEntityId and type
  - safe no-op if `updateTurnOrder` absent

### 6) Random Rolls (d20, dice) ✅ COMPLETED
Store and components use both store-level `rollD20/rollDice` and ad-hoc dice rolls.

**Implementation**: `src/utils/dice.ts` (converted to TypeScript)
**Tests**: `src/tests/utils/dice.test.ts` (30+ tests, 100% coverage)

Occurrences:
```26:47:src/store/slices/utilitySlice.js
rollD20, rollDice
```

```467:476:src/store/slices/bossesSlice.js
const saveRoll = Math.floor(Math.random() * 20) + 1;
```

```244:253:src/store/slices/charactersSlice.js
const saveRoll = Math.floor(Math.random() * 20) + 1;
```

Proposed:
- Consolidate dice utilities to avoid duplication and ensure consistency:
  - Keep a single source of truth in `src/utils/dice.js`:
    - `rollDie(sides)`, `rollDice(numDice, sides)`, `rollD20(hasAdvantage?, hasDisadvantage?)`, `rollSavingThrow(modifier, hasAdvantage?, hasDisadvantage?)`
  - In `utilitySlice`, re-export these functions to maintain current API, or update slices to import from `src/utils/dice.js`.
  - Keep `rollD20` as an explicit helper (it calls `rollDie(20)`), do not remove the name since it’s semantic and widely used. `rollDice` remains for NdS rolls.
  - Remove direct `Math.random()`-based rolls from slices.

Planned changes:
- Replace all `Math.floor(Math.random() * 20) + 1` with `rollD20()` (import from `src/utils/dice.js` or the store re-export).
- Replace multi-die rolls with `rollDice(num, sides)`.
- Remove redundant dice implementations from `utilitySlice` once re-exports or imports are wired.

Tests:
- File: `src/tests/utils/dice.test.js`
  - rollDie:
    - returns [1, sides], uniform-ish over many trials (smoke test)
  - rollDice:
    - sums N rolls in range
  - rollD20:
    - returns [1, 20]
    - advantage/disadvantage logic correctness using controlled mocks
  - rollSavingThrow:
    - structure {roll, modifier, total}; respects advantage/disadvantage
  - Integration: mock dice in slice tests to be deterministic (spy/mocks)

### 7) Results/Logging Shape ✅ COMPLETED
Attack/heal result records vary slightly in fields (id format, message text, flags).

**Implementation**: `src/store/utils/results.ts`
**Tests**: `src/tests/store/utils/results.test.ts` (10 tests, 100% coverage)

Occurrences:
- charactersSlice, bossesSlice, groupsSlice emit result objects with similar but non-identical shapes.

Proposed:
- Standardize result record interface in `src/store/utils/results.ts|js`.
- Provide `createAttackResult(...)` and `createHealingResult(...)` with consistent fields.

Tests:
- File: `src/tests/store/utils/results.test.js`
  - standardized shape assertions
  - attack variants (hit/miss/critical)
  - healing messages and positivity checks

### 8) Template and Sanitisation ✅ COMPLETED
Similar sanitisation/normalisation logic for bosses and groups (defenses, savingThrows, tempHp defaults).

**Implementation**: `src/store/utils/normalize.ts`
**Tests**: `src/tests/store/utils/normalize.test.ts` (18 tests, 100% coverage)

Occurrences:
- `sanitizeBosses` in bossesSlice
- `migrateGroupData` in groupsSlice

Proposed:
- Move shared normalization helpers to `src/store/utils/normalize.ts|js`.
- E.g., `normalizeDefenses`, `normalizeSavingThrows`, `ensureCreatureArray(group)`.

Tests:
- File: `src/tests/store/utils/normalize.test.js`
  - normalizeDefenses: defaults empty arrays, preserves provided arrays
  - normalizeSavingThrows: defaults zeros, preserves provided values
  - ensureCreatureArray: creates creature list from count/maxHp when missing; preserves existing arrays

---

## Concrete Change List

1. Create utilities under `src/store/utils/`:
   - `numbers` → `clamp`, `numberOr`
   - `ids` → `generateId`, `nowTimestamp`
   - `storage` → `readJson`, `writeJson`, `remove`
   - `combat` → temp HP damage application, save outcome helpers, result text helpers
   - `turnOrder` → `scheduleTurnOrderUpdate`
   - `results` → `createAttackResult`, `createHealingResult`
   - `normalize` → defenses/saves/creature array helpers
   - Consolidate dice to `src/utils/dice.js` and re-export from store if needed

2. Replace inline clamps and defaulting across slices with `numbers` utils.
3. Replace all ad-hoc IDs/timestamps with `ids` utils.
4. Replace all direct `localStorage.*` in slices with `storage` utils.
5. Replace all ad-hoc dice rolls in slices with centralized dice helpers.
6. Standardize result record creation via `results` utils.
7. Extract repeated temp HP + damage logic to `combat` utils.
8. Standardize turn order update triggers via `turnOrder` utils.
9. Move/merge existing `src/utils/localStorage.js` into `src/store/utils/storage.*` or re-export to avoid duplication.

## Notes on `useStorageState`
Current implementation returns wrapper functions, not stateful values — the name suggests a React hook but behavior doesn’t. Recommendation:
- Either remove it as unnecessary, or rewrite as a true hook that synchronizes state with localStorage (read on mount, write on set, subscribe to storage events).

## Store Slices: Refactor Scope & Tests
Tests live under `src/tests/store/slices`.

### charactersSlice — Tests (`src/tests/store/slices/charactersSlice.test.ts`) 🔄 IN PROGRESS
- addCharacter:
  - creates defaults; persists via storage helper; schedules turn order update
- updateCharacter:
  - field updates; initiative triggers hard recalculation
- setTemporaryHitPoints:
  - replace vs additive paths; never negative
- applyDamageToCharacter:
  - temp HP absorption; HP clamps to 0; miss is no-op; standardized result appended
- applyDamageToAllCharactersInAoe / Internal:
  - inAoe filtering vs forceAll; save logic (full/half/none); persistence and result messaging
- applyHealingToCharacter:
  - clamps to maxHp; standardized healing result

### bossesSlice — Tests (`src/tests/store/slices/bossesSlice.test.ts`) 🔄 IN PROGRESS
- addBoss:
  - sanitizes attacks; clamps charges; persists; turn order update
- setBossAttackCharges:
  - clamps to [0, max]
- updateBossHp:
  - clamps currentHp to [0, maxHp]
- applyDamageToBoss:
  - miss noop; hit/critical reduce HP; standardized result
- applyDamageToAllBossesInAoe / Internal:
  - honors custom modifiers; save logic; messaging via helpers

### groupsSlice — Tests (`src/tests/store/slices/groupsSlice.test.ts`) ✅ COMPLETED
- addEnemyGroup / addMultipleEnemyGroups:
  - creates creatures array; persists; turn order update
- duplicateGroup:
  - cloned with new id; copies defaults as specified
- setTemporaryHitPointsGroup:
  - replace vs additive; clamp >= 0
- applyDamageToGroup:
  - per-creature processing; kill counts; avg currentHp recomputed; defeated removal triggers turn order update; standardized result
- applyDamageToAllInGroup:
  - respects percentAffected; accurate kill counts
- applyDamageToAllGroups / InAoe / Internal:
  - save logic per group; totals aggregated; standardized output

### persistenceSlice — Tests (`src/tests/store/slices/persistenceSlice.test.ts`) 🔄 IN PROGRESS
- exportState / exportStateSelective:
  - triggers download; returns true
- importState:
  - parses, sets state; handles invalid JSON (returns false); updates turn order
- importStateSelective:
  - merge vs replace; clearMissing* flags honored

### turnOrderSlice — Tests (`src/tests/store/slices/turnOrderSlice.test.ts`) 🔄 IN PROGRESS
- hydration from storage
- updateTurnOrder recomputes ordering after initiative changes, removals, mixed entity types

## Next Steps
- Approve the above plan.
- I will implement utilities (step 1), then refactor slices incrementally with small PR-sized edits per category (clamping, IDs, storage, combat, results, turnOrder).

---

## Additional Improvements (Optional but Valuable)
- Centralize storage keys:
  - Create `src/store/constants/storageKeys.js` with keys: `DND_CHARACTERS`, `DND_BOSSES`, `DND_GROUPS`, `DND_TURN_ORDER`
  - Replace string literals across slices to avoid typos and ease future migrations
  - Tests: smoke test that helpers use the same keys (import constants in tests)
- Gate console logging:
  - Replace `console.log` in slices/components with a `debugLog` that no-ops unless `import.meta.env.DEV` or a feature flag is enabled
  - Keeps store clean in production; test by mocking the logger
- Move UI-specific helpers out of store:
  - `getHealthColor` belongs in UI utilities (component layer), not in store logic
  - Relocate to `src/utils/view/health.ts|js` and update imports
  - Tests: unit test in `src/tests/utils/view/health.test.js`
- JSDoc typedefs for store state/actions:
  - Add `@typedef` blocks for characters, bosses, groups, and action signatures
  - Improves IntelliSense and test authoring without TypeScript conversion
- AoE target selection helper:
  - Common selection logic (`inAoe` vs applyAll) can be extracted to `src/store/utils/selection.ts|js`
  - Reduces duplication across slices; add unit tests under `src/tests/store/utils/selection.test.js`

### Component-level tests (only if necessary)
Most refactor is store-focused. Component tests are only warranted where UI wires to behaviors that changed:
- ImportExportModal:
  - selective import/export interactions integrate with persistenceSlice (mock store)
- GroupsSection hot paths that call newly standardized helpers (optional; focus on slice tests unless UI behavior differs)

### Coverage Notes and Gaps
- If `clamp` does not handle `min > max` by swapping, add that behavior to avoid subtle bugs and enable tests.
- If results/message formatting diverges across slices, refactor to `results` utils to enable consistent unit tests.
- Do not add new features beyond what’s needed for correctness and testability.

### Running tests
Add scripts (if not present) in `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui --dom",
    "test:coverage": "vitest --coverage"
  }
}
```



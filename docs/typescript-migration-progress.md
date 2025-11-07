# TypeScript Migration Progress

## Overview

Comprehensive TypeScript migration of the DnD Tools codebase, including full refactoring of store slices, utilities, and establishing proper folder structure for models and constants.

## ✅ Completed Work

### Infrastructure (100%)
- TypeScript configuration with strict mode
- Vitest test runner with jsdom environment
- Path aliases: `@/`, `@utils`, `@store`, `@components`, `@models`, `@constants`
- Test scripts in package.json
- ESLint extended for TypeScript

### Folder Structure Reorganisation (100%)
Created logical folder structure as requested:

#### `src/models/` - Domain Models by Category
- **entities/** - Core game entities
  - `Character.ts` - Player character model
  - `Boss.ts` - Boss enemy model
  - `EnemyGroup.ts` - Enemy group with creatures
  - `Creature.ts` - Individual creature in a group
  
- **combat/** - Combat-related models
  - `BossAttack.ts` - Attack definition with damage components
  - `DamageComponent.ts` - Individual damage instance
  - `AttackResult.ts` - Result of attack/healing actions
  
- **common/** - Shared types
  - `Defenses.ts` - Resistances, vulnerabilities, immunities
  - `SavingThrows.ts` - Ability save bonuses & SaveType
  
- **ui/** - UI-specific models
  - `TurnOrderEntity.ts` - Turn order list item
  - `TargetEntity.ts` - Target selection data

#### `src/constants/` - Application Constants
- `storage.ts` - localStorage keys (STORAGE_KEYS)
- `combat.ts` - Combat defaults (COMBAT_DEFAULTS, DIE_TYPES)
- `index.ts` - Barrel exports

### Store Utilities (100% - 7/7 Complete)
All utilities created in TypeScript with comprehensive tests:

1. **numbers.ts** (18 tests)
   - `clamp(value, min, max)` - Throws if min > max
   - `clampHp(value, min, max)` - HP-specific clamping
   - `clampCharges(value, maxCharges)` - Charge clamping with undefined handling
   - `ensurePositive(value)` - Non-negative guarantee

2. **ids.ts** (9 tests)
   - `generateId()` - Timestamp-based IDs
   - `generateIdWithOffset(offset)` - Batch operation IDs
   - `generateUniqueId()` - Timestamp + random

3. **storage.ts** (15 tests)
   - `loadFromStorage<T>(key, default)` - Type-safe reads with dev-only console logging
   - `saveToStorage<T>(key, value)` - Type-safe writes with dev-only console logging
   - `removeFromStorage(key)` - Safe removal with dev-only console logging

4. **combat.ts** (26 tests)
   - `applyDamageWithTempHp()` - Temp HP absorption logic
   - `applyHealing()` - HP restoration with max clamping
   - `setTempHp()` - Temp HP management (replace/additive)
   - `rollSave()` - Saving throw calculation
   - `checkSave()` - DC comparison
   - `calculateSaveDamage()` - Damage reduction for saves

5. **turnOrder.ts** (4 tests)
   - `scheduleTurnOrderUpdate(callback, delay?)` - Unified turn order scheduling

6. **results.ts** (10 tests)
   - `createDamageResult()` - Standardised damage results
   - `createHealingResult()` - Standardised healing results
   - `createAoeResult()` - Standardised AoE results

7. **normalize.ts** (18 tests)
   - `normalizeDefenses()` - Ensures all defence arrays
   - `normalizeSavingThrows()` - Ensures all stats
   - `normalizeBossAttack()` - Clamps charges, validates structure

### General Utilities (100%)
- **dice.ts** (30+ tests) - Converted to TypeScript
  - `rollDie()`, `rollDice()`, `rollD20()`, `rollDamage()`, `rollSavingThrow()`
- **fileImport.ts** - Converted to TypeScript
  - `readJsonFile<T>()`, `validateImportedState<T>()`, `createFileImportHandler<T>()`
- Removed `useStorageState` from localStorage utils (was non-functional)

### Store Slices Refactored (100%)
All eight slices are now fully migrated and have accompanying regression tests:

1. ✅ **combatSlice.ts** – AoE orchestration restored and covered
2. ✅ **utilitySlice.ts** – Health aggregation utilities verified
3. ✅ **uiSlice.ts** – Indirectly exercised via tested store flows
4. ✅ **persistenceSlice.ts** – Import/export + merge behaviour tested
5. ✅ **turnOrderSlice.ts** – Initiative metadata (HP/averages) covered
6. ✅ **charactersSlice.ts** – Temp HP + AoE damage under test
7. ✅ **bossesSlice.ts** – Temp HP + charge clamping regression tests
8. ✅ **groupsSlice.ts** – Creature averaging + AoE summaries tested

### Test Infrastructure
- Global test setup remains in `src/tests/setup.ts`
- 170+ tests now executed across utilities and slices
- Folder mirroring preserved: `src/tests/store/{utils|slices}/`

## 🔄 In Progress / Remaining

### Component Integration
- Update UI components to consume the sliced store (turn order HP badges, AoE workflows, persistence affordances)
- Add feature toggles for commercial (paid) workflows vs. local-only mode

### Quality + Documentation
- Final UK spelling sweep for new component copy
- Document commercial-tier behaviours + free-tier parity in README/docs

## 📊 Metrics

| Category | Total | Completed | Remaining |
|---|---|---|---|
| **Infrastructure** | 1 | 1 ✅ | 0 |
| **Folder Structure** | 1 | 1 ✅ | 0 |
| **Store Utilities** | 7 | 7 ✅ | 0 |
| **General Utilities** | 2 | 2 ✅ | 0 |
| **Store Slices** | 8 | 8 ✅ | 0 |
| **Components** | ~15 | 0 | ~15 |
| **Tests Written** | 170+ | 170+ ✅ | Component/E2E pending |

**Overall Progress**: ~75% complete

## 🎯 Next Steps

1. Update React components to consume the migrated slices (especially AoE + persistence UX)
2. Introduce free vs. paid feature toggles and data persistence strategy
3. Add component-level tests once wiring is stable
4. Complete UK spelling/documentation sweep for new UI copy
5. Run full Vitest suite + smoke test UI after component refactors

## 📝 Notes

- All utilities use dev-only console logging (`import.meta.env.DEV`)
- Models are organised by domain, not repo structure (as requested)
- Constants are centralised and typed with `as const`
- Path aliases configured in both `tsconfig.json` and `vitest.config.ts`
- Store utilities properly import from `@models` and `@constants`
- UK spelling enforced (colour, normalise, etc.) except in code-required cases (CSS `color`)

## 🐛 Known Issues / Follow-ups

1. **Component coverage** – UI still needs regression tests after wiring to new slices.
2. **Commercial mode** – Feature gating (free vs. paid) not yet implemented; requires backend contract.
3. **Documentation** – README needs an updated section describing persistence modes and testing strategy.

## 🔗 Related Documents

- `docs/store-refactor-audit.md` - Original duplication audit and refactoring plan
- `docs/typescript-refactor-progress.md` - Detailed technical progress (older version)
- `tasklist.md` - High-level task tracking

---

*Last updated: Current session*
*Status: Active development, 60% complete*


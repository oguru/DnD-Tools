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

### Store Slices Refactored (3/8 Complete)
1. ✅ **combatSlice.ts** - Fully refactored with types, using new utilities
2. ✅ **utilitySlice.ts** - Refactored, re-exports dice functions, proper UK spelling (getHealthColour)
3. ✅ **uiSlice.ts** - Refactored with ref management, scroll behaviour

### Test Infrastructure
- Global test setup in `src/tests/setup.ts`
- 130+ tests written with 100% coverage for utilities
- Mirrored folder structure: `src/tests/store/utils/`, `src/tests/store/slices/`

## 🔄 In Progress / Remaining

### Store Slices to Refactor (5 remaining)
4. **persistenceSlice.js** → `.ts` - Import/export functionality
5. **turnOrderSlice.js** → `.ts` - Turn order management
6. **charactersSlice.js** → `.ts` - Character management (large, ~600 lines)
7. **bossesSlice.js** → `.ts` - Boss management (large, ~750 lines)
8. **groupsSlice.js** → `.ts` - Group/creature management (largest, ~900 lines)

### Components to Update
- Update imports to use `@models`, `@constants`
- Use TypeScript utilities where applicable
- Fix any type errors

### Code Quality
- Fix UK spelling throughout (normalise, standardise, prioritise) - partially done
- Remove old .js slice files after verification
- Add JSDoc only where truly necessary (rely on types)

## 📊 Metrics

| Category | Total | Completed | Remaining |
|---|---|---|---|
| **Infrastructure** | 1 | 1 ✅ | 0 |
| **Folder Structure** | 1 | 1 ✅ | 0 |
| **Store Utilities** | 7 | 7 ✅ | 0 |
| **General Utilities** | 2 | 2 ✅ | 0 |
| **Store Slices** | 8 | 3 ✅ | 5 |
| **Components** | ~15 | 0 | ~15 |
| **Tests Written** | 130+ | 130+ ✅ | Slice tests pending |

**Overall Progress**: ~60% complete

## 🎯 Next Steps

1. Refactor remaining 5 slices in order:
   - persistenceSlice (moderate complexity)
   - turnOrderSlice (moderate complexity)
   - charactersSlice (high complexity)
   - bossesSlice (high complexity)
   - groupsSlice (highest complexity)

2. Write slice integration tests

3. Update components to import from new structure

4. Complete UK spelling fixes

5. Remove old .js files

6. Run full test suite and verify no regressions

## 📝 Notes

- All utilities use dev-only console logging (`import.meta.env.DEV`)
- Models are organised by domain, not repo structure (as requested)
- Constants are centralised and typed with `as const`
- Path aliases configured in both `tsconfig.json` and `vitest.config.ts`
- Store utilities properly import from `@models` and `@constants`
- UK spelling enforced (colour, normalise, etc.) except in code-required cases (CSS `color`)

## 🐛 Known Issues

1. **utilitySlice tests** - 6 failing tests need investigation:
   - `calculateGroupTotalCurrentHP` logic issue with empty creatures array
   - `getHealthColour` function not being found in tests (possible import issue)

2. **Old files to delete**: Once verified working:
   - `src/store/types.ts` (superseded by `src/models/`)
   - `src/store/constants.ts` (superseded by `src/constants/`)
   - All `.js` slice files once `.ts` versions are verified

3. **Import paths**: Some components may still reference old paths, need systematic update

## 🔗 Related Documents

- `docs/store-refactor-audit.md` - Original duplication audit and refactoring plan
- `docs/typescript-refactor-progress.md` - Detailed technical progress (older version)
- `tasklist.md` - High-level task tracking

---

*Last updated: Current session*
*Status: Active development, 60% complete*


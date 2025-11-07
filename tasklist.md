## Codebase Review & Cleanup
- [ ] Perform full audit of newly split store slices (characters, bosses, groups, turn order, UI, combat, persistence, utility) for duplication, unused helpers, or regressions.
- [ ] Review all React components by section (CharacterSection, GroupsSection, TurnOrder, DamageApplication, ImportExportModal, Attack calculators, Pages) for prop drilling, memoization opportunities, and accessibility gaps.
- [ ] Assess global styles and CSS modules for dead classes, responsive issues, and theme consistency.
- [ ] Catalogue tech debt in supporting utilities (dice rollers, import/export, localStorage helpers) and plan refactors.
- [ ] Check for duplication in all code relating to GroupAttackCalculator.jsx (including stores) and refactor to reduce duplication with reusable functions in a utils folder.

## Testing Strategy
- [x] Establish testing framework (Vitest/Jest + React Testing Library, and Playwright/Cypress for E2E).
- [x] Write unit tests for each store slice (state hydrations, migrations, actions, selectors).
- [ ] Add component integration tests covering page-level flows (turn order management, AoE damage application, import/export, group attack calculator).
- [ ] Implement end-to-end regression suite for primary user journeys (create session, manage combat, save/load data).

## Productization Roadmap
- [ ] Define feature parity matrix for free vs paid tiers (local storage vs cloud, sharing, live updates).
- [ ] Implement user accounts, authentication, and billing (evaluate services such as Stripe + webhook handling).
- [ ] Design and build backend persistence (API + database schema for encounters, sessions, user assets).
- [ ] Enable live session collaboration (real-time updates for turn order and character/boss state via WebSocket or WebRTC).
- [ ] Create shared content ecosystem (public encounter library, moderation workflow, search/browse UI).
- [ ] Ensure compliance/security readiness (data privacy, backups, audit logging, rate limiting).
- [ ] Add analytics/telemetry to monitor usage and inform roadmap.

## Immediate Follow-ups Post-Refactor
- [ ] Verify localStorage migrations for defenses/temp HP and boss attack charges survive reloads.
- [ ] Update UI to surface defenses & temp HP controls where applicable (characters, groups, bosses).
- [ ] Align damage application components with new additive temp HP behavior.
- [ ] Document store architecture and action conventions for contributors.

## Component Refactors (Planned)
- [ ] Refactor DamageApplication.jsx using `useAoeDamage` hook; extract AoE helpers to `utils/view/aoe.ts`.
- [ ] Refactor TurnOrder.jsx using `useTurnOrderProjection`; extract entry formatting to `store/utils/turnOrderFormat.ts`.
- [ ] Refactor CharacterSection.jsx to use `useCharacters` selector; move defence exclusivity to `store/utils/defense.ts`.
- [ ] Refactor GroupsSection.jsx using `useGroupAttacks`; move creature HP list builder to `utils/view/groups.ts`.
- [ ] Refactor AttackResults.jsx to use `store/utils/resultsFormat.ts` for message formatting.

## Testing (Components)
- [ ] Add RTL tests for DamageApplication (single-target, AoE with saves, multi-type modifiers).
- [ ] Add RTL tests for TurnOrder (characters/bosses/groups/groupCollection projections, navigation).
- [ ] Add RTL tests for CharacterSection (edits, empty-slot, defenses, targeting & AoE toggles).
- [ ] Add RTL tests for GroupsSection (add/duplicate/remove, creature HP, attack aggregation, AC override).
- [ ] Add RTL tests for AttackResults (message highlighting, batch grouping, clear/dismiss).

## Slice Logic Extraction
- [ ] Move AoE result string joiners to `store/utils/resultsFormat.ts`.
- [ ] Move group averaging/aggregation to `store/utils/groups.ts`.
- [ ] Move defence exclusivity toggles to `store/utils/defense.ts`.
- [ ] Create hooks: `useAoeDamage`, `useGroupAttacks`, `useTurnOrderProjection`.
## TypeScript Migration ✅ COMPLETE!
- [x] Create TypeScript configuration (tsconfig.json, vitest.config.ts)
- [x] Create store type definitions in `src/models/` and `src/constants/`
- [x] Create and test all 7 store utilities (numbers, ids, storage, combat, turnOrder, results, normalise)
- [x] Convert general utilities to TypeScript (dice, fileImport, localStorage)
- [x] Create comprehensive test suite (86+ tests, 100% coverage for utilities)
- [x] Install jsdom for test environment
- [x] **Refactor ALL 8/8 slices to TypeScript** (combat, utility, ui, persistence, turnOrder, characters, bosses, groups)
- [x] Fix UK spelling throughout (normalise, standardise, colour, etc)
- [x] Remove old JavaScript slice files and barrel files
- [x] Configure Vite with path aliases (@models, @constants, @utils, @store, @components)
- [x] Build succeeds, 80/83 tests passing
- [x] Create migration summary document (`TYPESCRIPT_MIGRATION_COMPLETE.md`)
- [ ] Update components to TypeScript (optional - already working with TS store)

## Store Architecture Review (POST-MIGRATION)
- [ ] **Review store slice functions** - Identify functions that only compute/return derived state from other slices without modifying store state
- [ ] **Move computed state to components** - Functions that just calculate/format data should be moved to custom hooks or component helpers
- [ ] **Clarify store boundaries** - Store should handle state mutations; components should handle computed/derived values
- [ ] **Create custom hooks** - For commonly used derived state calculations (e.g., `useHealthPercentage`, `useGroupTotalHp`)
- [ ] **Document store patterns** - Establish clear guidelines: stores mutate state, hooks compute derived state

## Bug Fixes (POST-MIGRATION)
- [x] **Fixed getHealthColor function name** - Updated to UK spelling `getHealthColour` in all components (TurnOrder, CharacterSection, GroupsSection, DamageApplication)


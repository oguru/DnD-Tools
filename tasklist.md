## Codebase Review & Cleanup
- [ ] Perform full audit of newly split store slices (characters, bosses, groups, turn order, UI, combat, persistence, utility) for duplication, unused helpers, or regressions.
- [ ] Review all React components by section (CharacterSection, GroupsSection, TurnOrder, DamageApplication, ImportExportModal, Attack calculators, Pages) for prop drilling, memoization opportunities, and accessibility gaps.
- [ ] Assess global styles and CSS modules for dead classes, responsive issues, and theme consistency.
- [ ] Catalogue tech debt in supporting utilities (dice rollers, import/export, localStorage helpers) and plan refactors.

## Testing Strategy
- [ ] Establish testing framework (Vitest/Jest + React Testing Library, and Playwright/Cypress for E2E).
- [ ] Write unit tests for each store slice (state hydrations, migrations, actions, selectors).
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


## Duplication

1. **Damage Type Constants**: Still duplicated in CharacterSection.jsx and GroupsSection.jsx
   - Can import from DefenseIcons.jsx instead

2. **Defense Editor UI**: Similar patterns in CharacterSection and GroupsSection
   - Could extract to `src/components/shared/DefenseEditor.jsx`

3. **Form Controls**: `.control-row`, `.control-field`, `.control-checkbox` patterns
   - Could create `FormField` components for consistency

4. **Saving Throws UI**: Similar code in multiple places
   - Could extract to reusable component

5. **Entity Selection UI**: Pattern repeated in DamageApplication for healing
   - Could extract to `EntitySelector` component

## Refactoring

1. **CharacterSection.jsx Refactoring**
   - Current size: 662 lines
   - Create CharacterRow sub-component
   - Create DefensesEditor sub-component  
   - Reuse DefenseIcons component
   - Target size: ~300-350 lines

2. **Additional DamageApplication Refactoring** (Optional)
   - Create AoeDamageSection component
   - Create HealingSection component
   - Would reduce main file to ~400 lines


## Next Steps
3. Extract DefenseEditor component
4. Extract FormField components for consistent form styling
5. Continue with GroupsSection refactoring per original plan


export const aspects = [
    'Flame', 'Radiance', 'Rage', 'Concentration', 'Direction', 'Shadow', 'Void'
  ];
  
export const aspectDescriptions = {
  'Flame': {
    effect: "Inferno Blaze",
    description: "The merged being unleashes a massive wave of fire, engulfing enemies in a 60-foot cone.",
    duration: 2,
    mechanics: [
      { title: "Damage", content: "10d6 fire damage; targets make a Dexterity saving throw (DC = 8 + proficiency bonus + merged being's Wisdom modifier). On a success, they take half damage." },
      { title: "Additional Effect", content: "The area remains ablaze, becoming difficult terrain and dealing 2d6 fire damage to creatures entering or ending their turn in the area for the next 2 rounds." }
    ]
  },
  'Radiance': {
    effect: "Healing Light",
    description: "A surge of radiant energy heals allies and purges negative conditions.",
    duration: 2,
    mechanics: [
      { title: "Healing", content: "All allies within 60 feet regain 8d6 hit points." },
      { title: "Condition Removal", content: "Removes one negative condition (blinded, charmed, frightened, poisoned, or stunned) from affected allies." },
      { title: "Additional Effect", content: "Allies gain advantage on saving throws against spells and magical effects for 2 rounds." }
    ]
  },
  'Rage': {
    effect: "Berserker's Fury",
    description: "The merged being channels pure rage, dramatically increasing physical prowess.",
    duration: 2,
    mechanics: [
      { title: "Bonus", content: "+5 to attack and damage rolls; resistance to bludgeoning, piercing, and slashing damage." },
      { title: "Duration", content: "2 rounds." },
      { title: "Drawback", content: "Cannot cast spells or use abilities requiring concentration during this time." }
    ]
  },
  'Concentration': {
    effect: "Mind Over Chaos",
    description: "The merged being attains heightened focus, stabilizing the environment and enhancing mental abilities.",
    duration: 4,
    mechanics: [
      { title: "Environmental Control", content: "Negate one environmental hazard or wild surge effect per round for the next 4 rounds." },
      { title: "Bonus", content: "Advantage on all Intelligence, Wisdom, and Charisma checks and saving throws." },
      { title: "Additional Effect", content: "Enemies have disadvantage on saving throws against the merged being's spells and abilities." }
    ]
  },
  'Direction': {
    effect: "Unstoppable Movement",
    description: "The merged being moves with unparalleled speed and precision.",
    duration: 4,
    mechanics: [
      { title: "Movement", content: "Gain an additional action that can be used to Dash, Disengage, or Dodge each turn for 4 rounds." },
      { title: "Bonus", content: "Movement speed is tripled; ignores difficult terrain." },
      { title: "Additional Effect", content: "Opportunity attacks against the merged being are made with disadvantage." }
    ]
  },
  'Shadow': {
    effect: "Veil of Darkness",
    description: "The merged being envelops the area in shadows, hindering enemies and enhancing stealth.",
    duration: 4,
    mechanics: [
      { title: "Area Effect", content: "Creates a 60-foot-radius sphere of magical darkness for 4 rounds." },
      { title: "Bonus", content: "The merged being and allies can see through this darkness." },
      { title: "Additional Effect", content: "Gain advantage on attack rolls against enemies within the darkness; enemies have disadvantage on attack rolls." }
    ]
  },
  'Void': {
    effect: "Annihilation Sphere",
    description: "The merged being taps into destructive cosmic energies, creating a sphere that consumes all.",
    duration: 4,
    mechanics: [
      { title: "Damage", content: "All creatures within a 30-foot radius must make a Constitution saving throw (DC = 8 + proficiency bonus + merged being's Wisdom modifier). On a failure, they take 12d8 force damage; on a success, half damage." },
      { title: "Additional Effect", content: "The area becomes a void zone for 4 rounds, nullifying all magical effects and abilities within it." },
      { title: "Drawback", content: "High risk of triggering a catastrophic wild surge." }
    ]
  },
  'Flame + Radiance': {
    effect: "Blazing Light",
    description: "Combines fire and radiant energy to create a blinding explosion.",
    duration: 4,
    mechanics: [
      { title: "Damage", content: "Enemies within a 40-foot radius take 8d6 fire damage and 8d6 radiant damage; Dexterity saving throw for half damage." },
      { title: "Additional Effect", content: "Enemies must make a Constitution saving throw or be blinded for 4 rounds (repeat save at the end of each turn)." }
    ]
  },
  'Flame + Rage': {
    effect: "Infernal Onslaught",
    description: "Enhances physical attacks with fiery energy.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "Add 4d6 fire damage to all melee attacks for 3 rounds." },
      { title: "Additional Effect", content: "Melee attacks cause enemies to catch fire, dealing 2d6 fire damage at the start of their turn for 3 rounds." }
    ]
  },
  'Flame + Concentration': {
    effect: "Controlled Burn",
    description: "Precisely manipulates fire to target enemies without harming allies.",
    duration: 3,
    mechanics: [
      { title: "Damage", content: "Targeted enemy takes 10d6 fire damage; Dexterity saving throw for half damage." },
      { title: "Bonus", content: "Ignore resistance to fire damage; treat immunity as resistance." },
      { title: "Additional Effect", content: "Fire spreads to other enemies within 10 feet, dealing half damage." }
    ]
  },
  'Flame + Direction': {
    effect: "Flame Dash",
    description: "Move swiftly, leaving a trail of fire.",
    duration: 3,
    mechanics: [
      { title: "Movement", content: "Instantly move up to 120 feet in a straight line." },
      { title: "Damage", content: "Enemies along the path take 6d6 fire damage; Dexterity saving throw for half." },
      { title: "Additional Effect", content: "The path remains ablaze, becoming difficult terrain." }
    ]
  },
  'Flame + Shadow': {
    effect: "Ember Cloak",
    description: "Shrouds the merged being in fiery shadows, enhancing stealth and offense.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "Gain advantage on Dexterity (Stealth) checks." },
      { title: "Damage", content: "First successful melee attack deals an extra 6d6 fire damage." },
      { title: "Additional Effect", content: "Enemies have disadvantage on perception checks to detect the merged being." }
    ]
  },
  'Flame + Void': {
    effect: "Nova Flare",
    description: "A dangerous explosion of fire and void energy.",
    duration: 3,
    mechanics: [
      { title: "Damage", content: "All creatures within a 60-foot radius take 12d8 fire and force damage; Constitution saving throw for half." },
      { title: "Drawback", content: "High chance (roll a d20; on 1-5, a catastrophic wild surge occurs)." }
    ]
  },
  'Radiance + Rage': {
    effect: "Holy Wrath",
    description: "Physical attacks are imbued with radiant energy.",
    duration: 4,
    mechanics: [
      { title: "Bonus", content: "Add 4d6 radiant damage to melee attacks for 4 rounds." },
      { title: "Additional Effect", content: "Enemies hit must make a Wisdom saving throw or be frightened until the end of their next turn." }
    ]
  },
  'Radiance + Concentration': {
    effect: "Purifying Focus",
    description: "Enhances healing and protective abilities.",
    duration: 3,
    mechanics: [
      { title: "Healing", content: "Allies within 60 feet regain 10d6 hit points." },
      { title: "Condition Removal", content: "Removes all negative conditions." },
      { title: "Bonus", content: "Allies gain resistance to all damage for 3 rounds." }
    ]
  },
  'Radiance + Direction': {
    effect: "Guiding Light",
    description: "Illuminates the path, enhancing movement and accuracy.",
    duration: 4,
    mechanics: [
      { title: "Bonus", content: "Allies gain +2 to attack rolls and advantage on saving throws against traps and hazards for 4 rounds." },
      { title: "Movement", content: "Increase allies' movement speed by 20 feet." },
      { title: "Additional Effect", content: "Reveals invisible or hidden creatures within 120 feet." }
    ]
  },
  'Radiance + Shadow': {
    effect: "Twilight Veil",
    description: "Merges light and darkness to confuse enemies.",
    duration: 4,
    mechanics: [
      { title: "Area Effect", content: "Creates a 60-foot-radius area of dim, shifting light for 4 rounds." },
      { title: "Effect on Enemies", content: "Disadvantage on attack rolls and perception checks." },
      { title: "Bonus", content: "The merged being and allies can see normally and have advantage on attack rolls." }
    ]
  },
  'Radiance + Void': {
    effect: "Celestial Annihilation",
    description: "Calls down a beam of destructive radiant and void energy.",
    duration: 3,
    mechanics: [
      { title: "Damage", content: "Single target takes 15d8 radiant and force damage; Dexterity saving throw for half." },
      { title: "Additional Effect", content: "Target is stunned until the end of their next turn." },
      { title: "Drawback", content: "Roll a d20; on a 1-5, a wild surge occurs." }
    ]
  },
  'Rage + Concentration': {
    effect: "Focused Fury",
    description: "Combines physical strength with mental clarity.",
    duration: 4,
    mechanics: [
      { title: "Bonus", content: "Gain advantage on all attack rolls and saving throws." },
      { title: "Duration", content: "4 rounds." },
      { title: "Additional Effect", content: "Critical hits on a roll of 19 or 20." }
    ]
  },
  'Rage + Direction': {
    effect: "Relentless Charge",
    description: "Rush forward with unstoppable force.",
    duration: 3,
    mechanics: [
      { title: "Movement", content: "Move up to double your speed towards an enemy." },
      { title: "Damage", content: "If you end adjacent to an enemy, make a melee attack with +5 bonus to the attack roll; on hit, deal normal damage plus 6d6." },
      { title: "Additional Effect", content: "Enemy must make a Strength saving throw or be knocked prone." }
    ]
  },
  'Rage + Shadow': {
    effect: "Fury of the Night",
    description: "Harness rage to become a terrifying presence in the shadows.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "Enemies within 30 feet must make a Wisdom saving throw or be frightened for 3 rounds." },
      { title: "Damage", content: "While frightened, enemies take 4d6 psychic damage at the start of their turn." },
      { title: "Additional Effect", content: "Gain advantage on attack rolls against frightened enemies." }
    ]
  },
  'Rage + Void': {
    effect: "Chaotic Destruction",
    description: "Unleash a devastating attack fueled by rage and void energy.",
    duration: 3,
    mechanics: [
      { title: "Damage", content: "Melee attack deals an extra 10d8 force damage." },
      { title: "Additional Effect", content: "Target must make a Constitution saving throw or be disintegrated if reduced to 0 hit points." },
      { title: "Drawback", content: "Automatic wild surge occurs after use." }
    ]
  },
  'Concentration + Direction': {
    effect: "Strategic Mastery",
    description: "Sharpen focus to outmaneuver opponents.",
    duration: 4,
    mechanics: [
      { title: "Bonus", content: "Allies gain advantage on initiative rolls and attacks of opportunity." },
      { title: "Movement", content: "Allies can move without provoking opportunity attacks for 4 rounds." },
      { title: "Additional Effect", content: "You can reposition allies within 30 feet to new positions as a bonus action." }
    ]
  },
  'Concentration + Shadow': {
    effect: "Mind Cloak",
    description: "Shield minds and bodies from detection.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "The merged being and allies become invisible and undetectable by magical means for 3 rounds." },
      { title: "Additional Effect", content: "Gain immunity to divination spells and effects during this time." }
    ]
  },
  'Concentration + Void': {
    effect: "Null Field",
    description: "Create an area where magic and abilities are suppressed.",
    duration: 4,
    mechanics: [
      { title: "Area Effect", content: "30-foot-radius sphere centered on the merged being." },
      { title: "Effect", content: "Spells and magical abilities cannot be cast or activated within the area." },
      { title: "Duration", content: "4 rounds." },
      { title: "Drawback", content: "Allies' abilities are also suppressed." }
    ]
  },
  'Direction + Shadow': {
    effect: "Phantom Step",
    description: "Move unseen and reposition strategically.",
    duration: 3,
    mechanics: [
      { title: "Movement", content: "Teleport up to 60 feet to an unoccupied space you can see." },
      { title: "Bonus", content: "Gain advantage on the next attack roll." },
      { title: "Additional Effect", content: "Leave behind an illusionary duplicate that distracts enemies." }
    ]
  },
  'Direction + Void': {
    effect: "Dimensional Shift",
    description: "Manipulate space to confuse enemies.",
    duration: 3,
    mechanics: [
      { title: "Effect", content: "Swap the positions of up to three creatures within 120 feet." },
      { title: "Saving Throw", content: "Unwilling targets make a Charisma saving throw to resist." },
      { title: "Additional Effect", content: "Enemies swapped become disoriented, suffering disadvantage on attack rolls until the end of their next turn." }
    ]
  },
  'Shadow + Void': {
    effect: "Eclipse",
    description: "Blanket the area in oppressive darkness infused with void energy.",
    duration: 3,
    mechanics: [
      { title: "Area Effect", content: "120-foot-radius sphere of magical darkness and silence." },
      { title: "Effect on Enemies", content: "Blind and deafen enemies; they must make a Wisdom saving throw or be paralyzed for 3 rounds (repeat save at end of each turn)." },
      { title: "Drawback", content: "The merged being and allies are also affected unless they have abilities to see through magical darkness." }
    ]
  }
};
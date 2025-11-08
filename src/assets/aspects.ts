export interface AspectMechanic {
  title: string;
  content: string;
}

export interface AspectDescription {
  effect: string;
  description: string;
  duration: number;
  mechanics: AspectMechanic[];
}

export type AspectDescriptions = Record<string, AspectDescription>;

export const aspects: readonly string[] = [
  'Flame', 'Radiance', 'Rage', 'Concentration', 'Direction', 'Shadow', 'Void'
] as const;

export type Aspect = typeof aspects[number];

export const aspectDescriptions: AspectDescriptions = {
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
    description: "A surge of radiant energy heals allies for 2 rounds and purges negative conditions.",
    duration: 2,
    mechanics: [
      { title: "Healing", content: "At the start of each ally's turn, they regain 2d6 hit points." },
      { title: "Condition Removal", content: "Removes one negative condition from each affected ally." },
      { title: "Additional Effect", content: "Allies gain advantage on their next saving throw against spells and magical effects." }
    ]
  },
  'Rage': {
    effect: "Berserker's Fury",
    description: "The merged being channels pure rage, dramatically increasing physical prowess.",
    duration: 2,
    mechanics: [
      { title: "Bonus", content: "+3 to attack and damage rolls; resistance to first instance of bludgeoning, piercing, and slashing damage per round." },
      { title: "Duration", content: "2 rounds." },
      { title: "Drawback", content: "You must roll to keep concentration on spells or abilities each round while the effect is active." }
    ]
  },
  'Concentration': {
    effect: "Mind Over Chaos",
    description: "The merged being attains heightened focus, stabilizing the environment and enhancing mental abilities.",
    duration: 4,
    mechanics: [
      { title: "Environmental Control", content: "As 1 entity, you can choose to negate one environmental hazard, status effect or wild surge effect per round for 4 rounds." },
      { title: "Bonus", content: "Advantage on first instance of Intelligence, Wisdom, and Constitution checks and saving throws per round." },
      { title: "Spellcasting", content: "Spell or attack damage dice can be rerolled once per round, taking the higher result." }
    ]
  },
  'Direction': {
    effect: "Unstoppable Movement",
    description: "The merged being moves with unparalleled speed and precision.",
    duration: 4,
    mechanics: [
      { title: "Movement", content: "Gain an additional action that can be used to Dash, Disengage, or Dodge once each round for 4 rounds." },
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
      { title: "Additional Effect", content: "Gain advantage on attack rolls against enemies within the darkness; enemies have disadvantage on first instance of attack rolls per round." }
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
      { title: "Bonus", content: "Each ally's first spell or melee attack per turn (whether it hits or not) deals an additional 4d6 fire damage for 3 rounds." },
      { title: "Additional Effect", content: "On a critical hit, the target catches fire, taking 2d6 fire damage at the start of their turn for 3 rounds." }
    ]
  },
  'Flame + Concentration': {
    effect: "Controlled Burn",
    description: "Precisely manipulates fire to target enemies without harming allies.",
    duration: 0,
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
      { title: "Additional Effect", content: "The path remains ablaze, becoming difficult terrain and causing 2d6 fire damage to creatures entering or ending their turn in the area." }
    ]
  },
  'Flame + Shadow': {
    effect: "Ember Cloak",
    description: "Shrouds the merged being in fiery shadows, enhancing stealth and offense.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "Gain advantage on Dexterity (Stealth) checks." },
      { title: "Damage", content: "First successful melee attack deals an extra 8d10 fire damage." },
      { title: "Additional Effect", content: "Enemies have disadvantage on perception checks to detect the merged being." }
    ]
  },
  'Flame + Void': {
    effect: "Nova Flare",
    description: "A dangerous explosion of fire and void energy.",
    duration: 3,
    mechanics: [
      { title: "Damage", content: "All creatures within a 60-foot radius take 12d8 fire and force damage; Constitution saving throw for half." },
      { title: "Drawback", content: "For wild surges, the effect will be negative (closest roll to: 1, 3, 7, 10, 13, 15, 17, 18, 22, 28, 37, 48, 49, 52, 73, 79, 92, 96)." }
    ]
  },
  'Radiance + Rage': {
    effect: "Holy Wrath",
    description: "Physical and spell attacks are imbued with radiant energy.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "Each ally's first spell or melee attack per turn (whether it hits or not) deals an extra 4d6 radiant damage for 3 rounds." },
      { title: "Additional Effect", content: "Enemies hit by the first bonus attack each roundmust make a Wisdom saving throw or be frightened until the end of their next turn." }
    ]
  },
  'Radiance + Concentration': {
    effect: "Purifying Focus",
    description: "Enhances healing and protective abilities.",
    duration: 3,
    mechanics: [
      { title: "Healing", content: "Allies within 60 feet regain 10d6 hit points (single instance split between up to 2 allies for the merged being)." },
      { title: "Condition Removal", content: "Removes all negative conditions." },
      { title: "Bonus", content: "Allies gain resistance to first instance of damage per round for 3 rounds." }
    ]
  },
  'Radiance + Direction': {
    effect: "Guiding Light",
    description: "Illuminates the path, enhancing movement and accuracy.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "Allies gain +2 to attack rolls and advantage on saving throws against traps and hazards for 3 rounds." },
      { title: "Movement", content: "Increase allies' movement speed by 20 feet." },
      { title: "Additional Effect", content: "Reveals invisible or hidden creatures within 120 feet." }
    ]
  },
  'Radiance + Shadow': {
    effect: "Twilight Veil",
    description: "Merges light and darkness to confuse enemies.",
    duration: 2,
    mechanics: [
      { title: "Area Effect", content: "Creates a 60-foot-radius area of dim, shifting light for 2 rounds." },
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
      { title: "Wild Surge", content: "Automatic wild surge occurs after use." }
    ]
  },
  'Rage + Concentration': {
    effect: "Focused Fury",
    description: "Combines physical strength with mental clarity.",
    duration: 2,
    mechanics: [
      { title: "Bonus", content: "Gain advantage on all attack rolls and saving throws." },
      { title: "Duration", content: "2 rounds." },
      { title: "Additional Effect", content: "-1 modifier to determine a critical hit roll." }
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
      { title: "Damage", content: "While frightened, enemies take 3d6 psychic damage at the start of their turn." },
      { title: "Additional Info", content: "Affected creatures can roll at the end of each of their turns to end the effect." }
    ]
  },
  'Rage + Void': {
    effect: "Chaotic Destruction",
    description: "Unleash a devastating attack fueled by rage and void energy.",
    duration: 3,
    mechanics: [
      { title: "Damage", content: "The next melee attack that hits deals an extra 10d8 force damage." },
      { title: "Additional Effect", content: "Target must make a Constitution saving throw or be disintegrated if reduced to 0 hit points." },
      { title: "Wild Surge", content: "Automatic wild surge occurs after use." }
    ]
  },
  'Concentration + Direction': {
    effect: "Strategic Mastery",
    description: "Sharpen focus to outmaneuver opponents.",
    duration: 4,
    mechanics: [
      { title: "Bonus", content: "Allies gain advantage on initiative rolls and attacks of opportunity." },
      { title: "Movement", content: "Allies can move without provoking opportunity attacks for 4 rounds." },
      { title: "Additional Effect", content: "You are immune to any conditions that prevent movement, and you can reposition allies within 30 feet to new positions as a bonus action." }
    ]
  },
  'Concentration + Shadow': {
    effect: "Mind Cloak",
    description: "Shield minds and bodies from detection.",
    duration: 3,
    mechanics: [
      { title: "Bonus", content: "The merged being becomes invisible and undetectable by magical means for 3 rounds. Attacking breaks the effect." },
      { title: "Additional Effect", content: "Gain immunity to divination spells and effects during this time." }
    ]
  },
  'Concentration + Void': {
    effect: "Null Field",
    description: "Create an area where magic and abilities are suppressed.",
    duration: 3,
    mechanics: [
      { title: "Area Effect", content: "30-foot-radius sphere centered on the merged being." },
      { title: "Effect", content: "Spells and magical abilities cannot be cast or activated within the area. Magic items become mundane." },
      { title: "Duration", content: "3 rounds." },
      { title: "Drawback", content: "Allies' abilities are also suppressed." }
    ]
  },
  'Direction + Shadow': {
    effect: "Phantom Step",
    description: "Move unseen and reposition strategically.",
    duration: 3,
    mechanics: [
      { title: "Movement", content: "Teleport up to 60 feet to an unoccupied space you can see." },
      { title: "Bonus", content: "Each player gains advantage on the next attack roll." },
      { title: "Additional Effect", content: "Leave behind an illusionary duplicate that distracts enemies. Attacked illusions are destroyed on hit." }
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
      { title: "Drawback", content: "The merged being and allies are affected unless they have abilities to see through magical darkness." }
    ]
  }
};


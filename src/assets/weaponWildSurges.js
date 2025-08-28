export const weaponWildSurges = {
  // SEVERE NEGATIVE (1-10)
  1: {
    effect: "Permanent: Unlingual",
    description: "Unlearn a random language you know (except Common)",
    duration: 0,
    permanent: true
  },
  2: {
    effect: "Permanent: Max HP Reduction",
    description: "Your maximum HP permanently decreases by 5",
    duration: 0,
    permanent: true
  },
  3: {
    effect: "Permanent: Lose Ability Check Proficiency",
    description: "Lose proficiency in a random ability check permanently",
    duration: 0,
    permanent: true
  },
  4: {
    effect: "Healing Strike",
    description: "This attack heals target for max weapon damage instead",
    duration: "0"
  },
  5: {
    effect: "Phase Shift",
    description: "Lose 2 AC as your armor partially phases out of existence",
    duration: "1"
  },
  6: {
    effect: "Mini Tarrasque",
    description: "A miniature Tarrasque (CR 5) appears and rampages",
    duration: "1",
    link: "https://www.dndbeyond.com/monsters/17034-tarrasque",
    linkText: "View Tarrasque Stats"
  },
  7: {
    effect: "Charisma Shield",
    description: "Your AC becomes exactly 10 + your Charisma modifier until the start of your nex turn",
    duration: "1"
  },
  8: {
    effect: "Mass Healing",
    description: "Both you and target regain half of all HP lost since the start of the battle",
    duration: "0"
  },
  9: {
    effect: "Paralysis Exchange",
    description: "You and target swap places and are both paralyzed for 1 round",
    duration: "1",
    link: "https://www.dndbeyond.com/sources/basic-rules/appendix-a-conditions#Paralyzed",
    linkText: "Read About Paralyzed Condition"
  },
  10: {
    effect: "Shadow Clone",
    description: "Your shadow animates and attacks random creatures",
    duration: "1"
  },

  // MAJOR NEGATIVE (11-25)
  11: {
    effect: "Poisonous Blood",
    description: "You gain poisonous blood (you and attackers take 2d6 poison damage when you take damage)",
    duration: "1"
  },
  12: {
    effect: "Limbo Flux",
    description: "You contract Limbo Flux (Con save each hour or take 1d10 force damage)",
    duration: "24"
  },
  13: {
    effect: "AC Exchange",
    description: "Exchange AC with target until next dawn",
    duration: "8"
  },
  14: {
    effect: "Dance Fever",
    description: "You must dance for 1 minute (you can still attack with disadvantage but must dance to targets at half your movement speed). Causes -2 to AC.",
    duration: "1"
  },
  15: {
    effect: "Position Swap",
    description: "You and target swap places every round",
    duration: "1"
  },
  16: {
    effect: "Flumph Friends",
    description: "Summon 1d4 flumphs that attack random creatures",
    duration: "1",
    link: "https://www.dndbeyond.com/monsters/17143-flumph",
    linkText: "View Flumph Stats"
  },
  17: {
    effect: "Slow",
    description: "You gain Slow",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/slow",
    linkText: "Read Slow Spell Details"
  },
  18: {
    effect: "Speed Reduction",
    description: "Movement speed decreases by 10 feet for 1 minute",
    duration: "1",
  },
  19: {
    effect: "Sleep",
    description: "You fall unconscious for 1 minute (Wis save at start of each turn)",
    duration: "1",
    link: "https://www.dndbeyond.com/sources/basic-rules/appendix-a-conditions#Unconscious",
    linkText: "Read About Unconscious Condition"
  },
  20: {
    effect: "Charm Person",
    description: "You are charmed by nearest hostile creature for 1 minute",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/charm-person",
    linkText: "Read Charm Person Spell Details"
  },
  21: {
    effect: "Age Shift",
    description: "You age 1d12 years (50% chance younger vs older)",
    duration: "0"
  },
  22: {
    effect: "Mirror Skin",
    description: "Your skin becomes reflective like a mirror",
    duration: "24"
  },
  23: {
    effect: "Pixie Swarm",
    description: "You're followed by a swarm of mischievous pixies",
    duration: "1",
    link: "https://www.dndbeyond.com/monsters/17195-pixie",
    linkText: "View Pixie Stats"
  },
  24: {
    effect: "Dramatic Lighting",
    description: "Dramatic lighting and wind effects follow your movements",
    duration: "1"
  },
  25: {
    effect: "Weapon Personality",
    description: "Your weapon becomes extremely shy and apologizes for hurting people",
    duration: "1"
  },

  // MINOR NEGATIVE (26-40)
  26: {
    effect: "Dimensional Hiccups",
    description: "For 1 minute, each time you hiccup you have a 25% change to teleport 5ft in a random direction, and have a 25% changce to hiccup at the start of your turn",
    duration: "1"
  },
  27: {
    effect: "Narration",
    description: "Morgan Freeman narrates your actions",
    duration: "1"
  },
  28: {
    effect: "Taste Colors",
    description: "You can taste colors and see flavors",
    duration: "1"
  },
  29: {
    effect: "Ethereal Echo",
    description: "Your voice has a slight echo",
    duration: "1"
  },
  30: {
    effect: "Weather Sense",
    description: "Know the weather forecast, but it manifests as joint pain",
    duration: "1"
  },
  31: {
    effect: "Beast Tongue",
    description: "Can speak to one random type of animal, but they're all sarcastic",
    duration: "1"
  },
  32: {
    effect: "Magical Scent",
    description: "You smell like a random pleasant scent",
    duration: "1"
  },
  33: {
    effect: "Butterfly Trail",
    description: "Your movements leave trails of butterflies",
    duration: "1"
  },
  34: {
    effect: "Musical Combat",
    description: "Your attacks play random musical notes when they hit",
    duration: "1"
  },
  35: {
    effect: "Emotion Aura",
    description: "Your emotions become visible as colored aura",
    duration: "1"
  },
  36: {
    effect: "Mirror Images",
    description: "3 illusory duplicates of you appear",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/mirror-image",
    linkText: "Read Mirror Image Spell Details"
  },
  37: {
    effect: "Weather Control",
    description: "Local weather changes based on your emotions",
    duration: "1"
  },
  38: {
    effect: "Spectral Audience",
    description: "Ghostly spectators appear and react to the combat",
    duration: "1"
  },
  39: {
    effect: "Rainbow Weapon",
    description: "Your weapon changes color every time it hits",
    duration: "1"
  },
  40: {
    effect: "Bubble Speech",
    description: "Everyone's words appear as comic book speech bubbles",
    duration: "1"
  },

  // META & COMBAT EFFECTS (41-50)
  41: {
    effect: "Double Surge",
    description: "Roll twice more on this table and apply both effects",
    duration: 0
  },
  42: {
    effect: "Surge Reflection",
    description: "Roll once more, but the effect happens to the target instead",
    duration: 0
  },
  43: {
    effect: "Surge Mastery",
    description: "Roll three times and choose which effect to apply",
    duration: 0
  },
  44: {
    effect: "Synchronised Surge",
    description: "Roll once more on this table and cause anyone within 100ft who can wild surge to trigger a surge (also affects aspects if one is active)",
    duration: "1"
  },
  45: {
    effect: "Enlarge",
    description: "You double in size and your attacks deal +1d4 damage",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/enlarge-reduce",
    linkText: "Read Enlarge/Reduce Spell Details"
  },
  46: {
    effect: "Blur",
    description: "Attacks against you have disadvantage",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/blur",
    linkText: "Read Blur Spell Details"
  },
  47: {
    effect: "False Life",
    description: "Gain 2d4 + 8 stacking temporary hit points",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/false-life",
    linkText: "Read False Life Spell Details"
  },
  48: {
    effect: "Heroism",
    description: "Gain temporary stacking HP equal to double your proficiency bonus at start of each turn for 3 rounds",
    duration: "3",
    link: "https://www.dndbeyond.com/spells/heroism",
    linkText: "Read Heroism Spell Details"
  },
  49: {
    effect: "Misty Step",
    description: "You can teleport up to 30 feet as a bonus action until the end of your next turn",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/misty-step",
    linkText: "Read Misty Step Spell Details"
  },
  50: {
    effect: "Sanctuary",
    description: "Creatures must make Wisdom save to attack you in the next round",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/sanctuary",
    linkText: "Read Sanctuary Spell Details"
  },

  // NEUTRAL/MIXED (51-65)
  51: {
    effect: "Dad Jokes",
    description: "Your sword gains sentience and won't stop telling dad jokes",
    duration: "1"
  },
  52: {
    effect: "Reality Glitch",
    description: "Minor graphical glitches appear around you like in a video game",
    duration: "1"
  },
  53: {
    effect: "Equipment Swap",
    description: "You and target swap all equipment instantly for 1 round",
    duration: "1"
  },
  54: {
    effect: "Mass Teleport",
    description: "Everyone within 30ft teleports 15ft in random directions",
    duration: "0"
  },
  55: {
    effect: "Gravity Shift",
    description: "Gravity shifts 90 degrees for everyone in 30ft",
    duration: "1"
  },
  56: {
    effect: "Random Damage",
    description: "Roll 1d4, deal that many d8s of random damage type",
    duration: "0"
  },
  57: {
    effect: "Force Conversion",
    description: "All damage within 30ft becomes force damage",
    duration: "1"
  },
  58: {
    effect: "Psychic Zone",
    description: "All damage within 30ft becomes psychic",
    duration: "1"
  },
  59: {
    effect: "Double Trouble",
    description: "All damage is doubled for 1 round but type is randomized",
    duration: "1"
  },
  60: {
    effect: "Fish Weapons",
    description: "All weapons in 30ft turn into fish (retain stats)",
    duration: "1"
  },
  61: {
    effect: "Magnificent Mustache",
    description: "Everyone within 100ft grows a magnificent mustache for a day",
    duration: "24"
  },
  62: {
    effect: "Cartoon Physics",
    description: "Physical attacks make cartoon sound effects",
    duration: "1"
  },
  63: {
    effect: "Cheese Armor",
    description: "All armor turns into fortified cheese for a day (retains AC but smells delicious)",
    duration: "24"
  },
  64: {
    effect: "Rhyming Curse",
    description: "Everyone can only speak in rhymes",
    duration: "1"
  },
  65: {
    effect: "Bouncy Ground",
    description: "The ground in a 15ft radius becomes bouncy like a trampoline (difficult terrain)",
    duration: "1"
  },

  // MINOR POSITIVE (66-80)
  66: {
    effect: "Crystal Armor",
    description: "Gain +2 AC and sprout crystalline armor until the end of your next turn",
    duration: "1"
  },
  67: {
    effect: "Multiple Reactions",
    description: "You can take 3 reactions until start of next turn",
    duration: "1"
  },
  68: {
    effect: "Spirit Weapon",
    description: "Spiritual Weapon spawns (looks like a tiny version of you)",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/spiritual-weapon",
    linkText: "Read Spiritual Weapon Spell Details"
  },
  69: {
    effect: "Haste",
    description: "You gain Haste for the next 3 rounds",
    duration: "3",
    link: "https://www.dndbeyond.com/spells/haste",
    linkText: "Read Haste Spell Details"
  },
  70: {
    effect: "Magic Missile Burst",
    description: "3d6 Magic Missiles hit random enemies within 60ft",
    duration: "0"
  },
  71: {
    effect: "Lightning Strike",
    description: "Your weapon attacks shoot lightning bolts that do 2d6 damage",
    duration: "1"
  },
  72: {
    effect: "Vampiric Strikes",
    description: "Your next 3 attacks deal necrotic damage and heal you",
    duration: "0"
  },
  73: {
    effect: "Spatial Mastery",
    description: "Your weapon attacks can be made from any unoccupied space you can see this turn",
    duration: "1"
  },
  74: {
    effect: "Gravity Well",
    description: "A gravity well forms around the target, pulling them and creatures within 10ft towards the center, reducing their movement speed by half for 1 round.",
    duration: "1"
  },
  75: {
    effect: "Reverse Gravity",
    description: "Gravity reverses for 1d4 rounds in a 30ft radius around target",
    duration: "1d4"
  },
  76: {
    effect: "Banishment",
    description: "Target is banished to Limbo for 1 round",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/banishment",
    linkText: "Read Banishment Spell Details"
  },
  77: {
    effect: "Color Spray",
    description: "Color Spray erupts in 15ft cone at target",
    duration: "0",
    link: "https://www.dndbeyond.com/spells/color-spray",
    linkText: "Read Color Spray Spell Details"
  },
  78: {
    effect: "Chaos Bolt",
    description: "Chaos Bolt strikes 1d4 random enemies in 30ft",
    duration: "0",
    link: "https://www.dndbeyond.com/spells/chaos-bolt",
    linkText: "Read Chaos Bolt Spell Details"
  },
  79: {
    effect: "Fireball",
    description: "Fireball centered on target (8d6 fire damage)",
    duration: "0",
    link: "https://www.dndbeyond.com/spells/fireball",
    linkText: "Read Fireball Spell Details"
  },
  80: {
    effect: "Jelly Terrain",
    description: "A 15ft radius sphere around target becomes Difficult Terrain made of jelly",
    duration: "1"
  },

  // MAJOR POSITIVE (81-95)
  81: {
    effect: "Polymorph: Gelatinous Cube",
    description: "Target polymorphs into a gelatinous cube for 1 minute (Con save, keeps same HP and AC)",
    duration: "1",
    link: "https://www.dndbeyond.com/monsters/16862-gelatinous-cube",
    linkText: "View Gelatinous Cube Stats"
  },
  82: {
    effect: "Life Drain",
    description: "Target's max HP is halved until long rest (Con save)",
    duration: "8"
  },
  83: {
    effect: "Near Death",
    description: "Target must succeed on DC 15 Con save or be reduced to 1 HP",
    duration: "0"
  },
  84: {
    effect: "Disintegrate",
    description: "Disintegrate beam shoots from sword in 20ft cone (Con save)",
    duration: "0",
    link: "https://www.dndbeyond.com/spells/disintegrate",
    linkText: "Read Disintegrate Spell Details"
  },
  85: {
    effect: "Polymorph: Squirrel",
    description: "Target becomes a squirrel (Wis save, retains HP and AC) for 1 round; if killed while squirrel, permanently dead",
    duration: "1",
    link: "https://www.dndbeyond.com/spells/polymorph",
    linkText: "Read Polymorph Spell Details"
  },
  86: {
    effect: "Time Stop",
    description: "Time stops for 1d4 rounds but only you and target can act",
    duration: "1d4",
    link: "https://www.dndbeyond.com/spells/time-stop",
    linkText: "Read Time Stop Spell Details"
  },
  87: {
    effect: "Legendary Actions",
    description: "Gain 3 legendary actions until end of next turn (Dash, Attack, or Teleport 30ft)",
    duration: "1"
  },
  88: {
    effect: "Polymorph: Dragon",
    description: "You polymorph into a young silver dragon for 1 minute",
    duration: "1",
    link: "https://www.dndbeyond.com/monsters/17033-young-silver-dragon",
    linkText: "View Young Silver Dragon Stats"
  },
  89: {
    effect: "Force Nova",
    description: "Deal 10d6 force damage to all enemies within 30ft of target",
    duration: "0"
  },
  90: {
    effect: "Power Word Pain",
    description: "Target takes 3d4 damage at start of each turn for 3 rounds (no save)",
    duration: "3",
    link: "https://www.dndbeyond.com/spells/power-word-pain",
    linkText: "Read Power Word Pain Spell Details"
  },
  91: {
    effect: "Mind Break",
    description: "Target has disadvantage on all saves for 3 rounds",
    duration: "3"
  },
  92: {
    effect: "Vulnerability Curse",
    description: "Target gains vulnerability to all damage for 1 round",
    duration: "1"
  },
  93: {
    effect: "Death Mark",
    description: "Target takes double damage from all sources for 1 round",
    duration: "1"
  },
  94: {
    effect: "Soul Bind",
    description: "Target can't regain HP for 3 rounds",
    duration: "3"
  },
  95: {
    effect: "Doom Strike",
    description: "If target drops to less than 50HP with this attack they die instantly",
    duration: "1"
  },

  // PERMANENT POSITIVE (96-100)
  96: {
    effect: "Permanent: Max HP Increase",
    description: "Your maximum HP permanently increases by 5",
    duration: 0,
    permanent: true
  },
  97: {
    effect: "Permanent: Max HP Increase",
    description: "Your maximum HP permanently increases by 10",
    duration: 0,
    permanent: true
  },
  98: {
    effect: "Permanent: Multilingual",
    description: "Instantly learn a new random language permanently.",
    duration: 0,
    permanent: true
  },
  99: {
    effect: "Permanent: Combat Master",
    description: "Gain permanent +1 to attack rolls with this weapon",
    duration: 0,
    permanent: true
  },
  100: {
    effect: "Permanent: Combat Master",
    description: "Gain permanent +1 to attack rolls and damage with this weapon",
    duration: 0,
    permanent: true
  }
};

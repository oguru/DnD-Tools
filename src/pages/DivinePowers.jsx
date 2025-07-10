import '../styles/DivinePowers.css';

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../firebaseConfig';

const DivinePowers = () => {
  const [view, setView] = useState('detailed'); // 'detailed', 'combined', or 'printable'
  const [selectedLevel, setSelectedLevel] = useState(2); // Default to level 2
  const [user, setUser] = useState(null);
  const [showGMControls, setShowGMControls] = useState(false);
  const [printView, setPrintView] = useState('all'); // 'all', 'universal', or 'character'
  
  // Check if user is logged in and is GM
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === 'gmdndbeyond@gmail.com') {
        setShowGMControls(true);
      } else {
        setShowGMControls(false);
        // Reset to level 2 if not GM and level is 3
        if (selectedLevel > 2) {
          setSelectedLevel(2);
        }
      }
    });
    
    return () => unsubscribe();
  }, [selectedLevel]);

  const handleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      console.error("Error signing in with Google", error);
    });
  };

  const handleSignOut = () => {
    signOut(auth).catch((error) => {
      console.error("Error signing out", error);
    });
  };
  
  const characters = [
    { id: 'universal', name: 'Universal Powers' },
    { id: 'kalmia', name: 'Kalmia (Rogue)' },
    { id: 'yrsa', name: 'Yrsa (Paladin/Cleric/Warlock)' },
    { id: 'pyre', name: 'Pyre (Sorcerer)' },
    { id: 'khada', name: 'Khada (Fighter)' },
    { id: 'pamykos', name: 'Pamykos (Bard/Warlock)' }
  ];

  const divinePowers = [
    {
      level: 1,
      name: "Divine Awakening",
      description: "Granted by Jizz'rek upon Revival",
      powers: [
        { name: "Physical Enhancement (Level 1)", description: "+2 to three ability scores of your choice and max", stackable: true },
        { name: "Divine Vitality", description: "Rolled hit points increase by 1.5x" },
        { name: "Divine Armor", description: "AC increases by 2, regardless of armor worn", replacedBy: "Divine Armor (Level 2)" },
        { name: "Empowered Attacks", description: "Weapon attacks and spell deal 1.5x damage (rounded up)", replacedBy: "Empowered Attacks (Level 2)" },
        { name: "Empowered Healing", description: "All healing you perform or receive (spells, potions, abilities, hit dice) is increased by 1.5x", replacedBy: "Empowered Healing (Level 2)" },
        { name: "Celestial Vision", description: "Gain truesight 30 feet", replacedBy: "Celestial Vision (Level 2)" },
        { name: "Divine Intuition", description: "Once per long rest, you can reroll any d20 and take either result", replacedBy: "Divine Intuition (Level 2)" },
        { name: "Planar Attunement", description: "You can speak and understand Celestial and can communicate telepathically with any celestial being" },
        { name: "Divine Movement", description: "Gain a 10ft walking speed", replacedBy: "Divine Movement (Level 2)" }
      ],
      printableSummary: [
        "All damage & healing 1.5x",
        "Truesight 30ft",
        "Reroll d20 1/long rest"
      ],
      godBoons: []
    },
    {
      level: 2,
      name: "Divine Ascendance",
      description: "Gained after liberating Athkatla",
      powers: [
        { name: "Physical Enhancement (Level 2)", description: "+2 to four additional ability scores and max", stackable: true },
        { name: "Divine Vitality", description: "Multiply your current rolled hit points by 1.5 (stacking with previous multiplier)" },
        { name: "Divine Resistance", description: "Gain resistance to one damage type of your choice" },
        { name: "Divine Armor (Level 2)", description: "AC increases by 4 (replacing previous bonus)" },
        { name: "Empowered Attacks (Level 2)", description: "Weapon and spell attacks deal 2x damage (replacing previous multiplier)" },
        { name: "Empowered Healing (Level 2)", description: "All healing you perform or receive is increased by 2x (replacing previous multiplier)" },
        { name: "Celestial Vision (Level 2)", description: "Truesight extends to 60 feet" },
        { name: "Divine Resurrection", description: "Once per day one of you can raise a fallen party member from the dead or unconscious to full HP using your combined divine essence" },
        { name: "Divine Movement (Level 2)", description: "Gain 10ft to your walking speed and a flying speed equal to half your new walking speed" },
        { name: "Divine Restoration", description: "During a short rest, recover hit points equal to half your maximum hit points" },
        { name: "Divine Form", description: "As an action once per long rest, transform into a celestial version of yourself for your next 3 turns", 
          subPowers: [
            "Your size increases by 1 category",
            "+2 to AC (stacks with Divine Armor)",
            "+30 temporary hit points",
            "Once per round when you damage a creature with a weapon attack or spell, you can add 5d8 radiant damage (to 1 target only)",
            "You can hover and move through creatures (but not objects)"
          ]
        }
      ],
      printableSummary: [
        "All damage & healing 2x",
        "Truesight 60ft",
        "Reroll d20 1/long rest",
        "Resistance to one damage type",
        "Revive ally to full HP 1/day",
        "Recover half max HP on short rest",
        "Divine Form 1/long rest (3 turns, +1 size, +2 AC, +30 temp HP, 5d8 radiant)"
      ],
      godBoons: [
        { 
          god: "Tyr", 
          name: "Smite of Justice", 
          description: "Twice per day when you deal damage to an enemy, you can unleash a smite of divine justice from above to deal an additional 4d10 radiant damage to a single target. This damage increases to 6d10 against creatures that have harmed innocents or broken sacred oaths."
        }
      ]
    },
    {
      level: 3,
      name: "Divine Transcendence",
      description: "Gained after sealing the demonic portal",
      powers: [
        { name: "Physical Enhancement (Level 3)", description: "+2 to all ability scores and max", stackable: true },
        { name: "Divine Vitality (Level 3)", description: "Multiply your current rolled hit points by 1.5 (stacking with previous multipliers)" },
        { name: "Divine Resilience (Level 3)", description: "Add immunity to 1 damage type" },
        { name: "Divine Immortality", description: "If reduced to 0 hit points, you instead return to 1/2 your maximum HP (usable once per long rest)" },
        { name: "Divine Armor (Level 3)", description: "AC increases by 6 (replacing previous bonus)" },
        { name: "Empowered Attacks (Level 3)", description: "Weapon and spell attacks deal 3x damage (replacing previous multiplier)" },
        { name: "Empowered Healing (Level 3)", description: "All healing you perform or receive is increased by 3x (replacing previous multiplier)" },
        { name: "Divine Penetration", description: "Your attacks and spells ignore resistance to damage and treat immunity as resistance. Additionally, your attacks count as magical for the purpose of overcoming damage reduction" },
        { name: "Divine Intuition (Level 3)", description: "Increase to 2x per day and now includes ability to give an ally advantage on any roll once per short rest (counts as 1 use)" },
        { name: "Divine Speed", description: "Your movement speed increases by 20ft" },
        { name: "Divine Form (Level 3)", description: "Divine Form improves with the following enhancements", 
          subPowers: [
            "Your size increases by 1 category",
            "+4 to AC (stacks with Divine Armor)",
            "+50 temporary hit points",
            "Once per round when you damage a creature with a weapon attack or spell, you can add 6d10 radiant damage (to 1 target only)"
          ]
        }
      ],
      printableSummary: [
        "All damage & healing 3x",
        "Truesight 60ft",
        "Reroll d20 2/day + give ally advantage 1/short rest",
        "Immunity to one damage type",
        "Return to half HP when reduced to 0 HP 1/long rest",
        "Ignore resistance, treat immunity as resistance",
        "Divine Form improved (+1 size, +4 AC, +50 temp HP, 6d10 radiant)"
      ],
      godBoons: [
        { 
          god: "Tyr", 
          name: "Smite of Justice", 
          description: "Twice per day when you deal damage to an enemy, you can unleash a smite of divine justice from above to deal an additional 4d10 radiant damage to a single target. This damage increases to 6d10 against creatures that have harmed innocents or broken sacred oaths."
        }
      ]
    }
  ];

  const classSpecificPowers = {
    kalmia: [
      { level: 2, name: "Divine Momentum (Level 2)", description: "(2x per day) - You can choose for an attack to damage all enemies in a 10ft line from your target" },
      { level: 3, name: "Divine Momentum (Level 3)", description: "(3x per day) - You can choose for an attack to damage all enemies in a 15ft sphere from your target" }
    ],
    yrsa: [
      { level: 2, name: "Divine Aura (Level 2)", description: "Your Aura of Protection heals you and allies within your aura 4x your Charisma modifier at the start of each of your turns" },
      { level: 3, name: "Divine Aura (Level 3)", description: "Your Aura of Protection reduces enemy saving throws equal to half your Charisma modifier (rounded down)" }
    ],
    pyre: [
      { level: 2, name: "Divine Alacrity (Level 2)", description: "(1x per day) you can cast an additional spell in 1 round as a bonus action" },
      { level: 3, name: "Divine Alacrity (Level 3)", description: "(2x per day) you can cast an additional spell in 1 round as a bonus action. The first spell cast this way after a long rest does not consume a spell slot." }
    ],
    khada: [
      { level: 2, name: "Divine Prowess (Level 2)", description: "Your critical hits with weapons heal you for half the damage dealt" },
      { level: 3, name: "Divine Prowess (Level 3)", description: "Your critical hits with weapons heal or give you temporary HP for half the damage dealt" }
    ],
    pamykos: [
      { 
        level: 2, 
        name: "Divine Decree (Level 2)", 
        description: "(1x per day) Issue one divine command:",
        subPowers: [
          "\"I deny your power\": (Action) - You cause all damage caused by your target to be completely negated until the start of your next turn",
          "\"I grant you my blessing\": (Bonus Action) - Cure the target of any status condition"
        ]
      },
      { 
        level: 3, 
        name: "Divine Decree (Level 3)", 
        description: "(2x per day) Issue one divine command:",
        subPowers: [
          "Same as previous, and:",
          "\"I command your obedience\": (Bonus Action) - Target must immediately follow one simple command that does not cause them or their allies harm (no save)",
          "\"I forbid your magic\": (Reaction) - you can choose to nullify the effects of a spell cast against you or one creature of your choice (does not nullify AOE effects against other targets)"
        ]
      }
    ]
  };

  // Filter out passive bonuses from items and focus on active abilities
  const itemSummaries = {
    pyre: [
      {
        name: "Crown of Chaotic Potential",
        description: "A circlet that shifts colors and sparks with miniature lightning",
        effects: [
          "Apply additional metamagic without spending points (2/day)",
          "Maximize spells (3rd+ level) and regain half spell level in sorcery points (2/day)",
          "Trigger Wild Magic Surge voluntarily (2/day)"
        ]
      },
      {
        name: "Probability Prism",
        description: "A shifting, multifaceted crystal that seems to exist in more than 3 dimensions",
        effects: [
          "Trigger wild surge when casting (1/day)",
          "Store wild magic surge effect until next long rest (1/day)",
          "Roll twice on surge table and pick one OR avoid surge but take 1d10 force damage (1/long rest)",
          "Spend sorcery point to shift surge result up/down by 1",
          "Use action to stabilize 10ft radius in areas of wild magic/chaos (may trigger surge)",
          "Gain advantage on next spell attack after natural surge",
          "Risk of instability: may cause disadvantage on spell save DC, minor magical effects, or increased surge chance"
        ]
      }
    ],
    kalmia: [
      {
        name: "Shadowdancer's Veil",
        description: "A cloak made of material so dark it seems to absorb light",
        effects: [
          "Hide as bonus action even when observed",
          "Teleport 30ft as bonus action (2/day)",
          "Command shadows to turn enemies against allies (3/day, DC16 Int save)",
          "Maximum damage on Sneak Attack (2/day)",
          "Steal specific memory for 1 hour (1/day, DC18 Int save)"
        ]
      },
      {
        name: "Shadowmend Crossbow +1",
        description: "A crossbow that can channel healing energy",
        effects: [
          "10 charges, regains 2d4+2 daily at dawn",
          "Cure Wounds (1 charge/level, up to 4th)",
          "Freedom of Movement (4 charges)",
          "Greater Restoration (5 charges)",
          "Mass Cure Wounds (5 charges)",
          "Raise Dead (5 charges)"
        ]
      }
    ],
    khada: [
      {
        name: "Titan's Grip Gauntlets",
        description: "Large intricate gauntlets with runes and gemstones that pulse with power",
        effects: [
          "Shatter ground in 15ft cone (3/day, DC18 Str save, 4d6 force damage)",
          "Critical hits may blind target (DC15 Con save)"
        ]
      }
    ],
    yrsa: [
      {
        name: "Radiant Soul Greatsword",
        description: "A greatsword with a central diamond that glows with inner divine light",
        effects: [
          "Add proficiency to healing (2x for level 3+)",
          "Divine smites and radiant spells deal +2d8 radiant damage",
          "Halve damage to you or ally within 30ft (2/day)",
          "Add max level divine smite on critical hit (1/day)"
        ]
      }
    ],
    pamykos: [
      {
        name: "Resonance Breastplate of the Final Chord +2",
        description: "Ornate breastplate inscribed with musical notes that emit harmonic tones",
        effects: [
          "Roll Bardic Inspiration twice, take higher",
          "Target one additional creature with Bardic Inspiration",
          "\"Final Chord\": 40ft radius mass healing (6d4 + Cha) + thunderwave (8d8, DC18 Con save)",
          "Negate one spell targeting you or ally within 30ft (1/day)",
          "After Final Chord, no spells for 2 rounds (cantrips ok)"
        ]
      }
    ]
  };

  // Get combined powers up to selected level
  const getCombinedPowers = () => {
    // Create a map to track powers by name base (without level)
    const powerMap = new Map();
    const stackablePowers = [];
    
    // Process powers from level 1 up to selected level
    for (let i = 0; i < divinePowers.length && i < selectedLevel; i++) {
      const levelData = divinePowers[i];
      
      levelData.powers.forEach(power => {
        const baseName = power.name.split(' (Level')[0]; // Remove level suffix if present
        
        if (power.stackable) {
          // Add stackable powers separately
          stackablePowers.push(power);
        } else if (power.replacedBy) {
          // If this power is replaced by a higher level version, only add if higher version not present
          if (!powerMap.has(baseName) || powerMap.get(baseName).level < power.level) {
            powerMap.set(baseName, power);
          }
        } else {
          // If power already exists in map, update it (higher level version)
          // Otherwise add it to the map
          powerMap.set(baseName, power);
        }
      });
    }
    
    // Convert map values to array and add stackable powers
    const combinedPowers = Array.from(powerMap.values());
    return [...combinedPowers, ...stackablePowers];
  };

  // Get combined printable summary for selected level
  const getCombinedPrintableSummary = () => {
    if (selectedLevel <= 0 || selectedLevel > divinePowers.length) {
      return [];
    }
    
    // Define power categories that get upgraded
    const upgradableCategories = {
      truesight: ["Truesight"],
      reroll: ["Reroll d20"],
      ac: ["AC increases by"],
      damage_healing: ["All damage & healing"],
      movement: ["walking speed"],
      divine_form: ["Divine Form"],
      resistance_immunity: ["Resistance", "Immunity"]
    };
    
    // Create a map to track the highest version of each power
    const powerMap = new Map();
    
    // Process powers from level 1 up to selected level
    for (let i = 0; i < selectedLevel; i++) {
      const levelData = divinePowers[i];
      const currentLevel = i + 1;
      
      levelData.printableSummary.forEach(item => {
        // Check if this is an upgradable power
        let isUpgradable = false;
        let categoryKey = null;
        
        // Check each upgradable category
        for (const [key, patterns] of Object.entries(upgradableCategories)) {
          if (patterns.some(pattern => item.includes(pattern))) {
            isUpgradable = true;
            categoryKey = key;
            break;
          }
        }
        
        if (isUpgradable && categoryKey) {
          // Special case for resistance/immunity - they should both exist
          if (categoryKey === 'resistance_immunity') {
            if (item.includes('Immunity')) {
              powerMap.set('immunity', { text: item, level: currentLevel });
            } else if (item.includes('Resistance')) {
              // Only add resistance if immunity isn't already present
              if (!powerMap.has('immunity')) {
                powerMap.set('resistance', { text: item, level: currentLevel });
              }
            }
          } else {
            // For other upgradable powers, only keep the highest level version
            if (!powerMap.has(categoryKey) || currentLevel > powerMap.get(categoryKey).level) {
              powerMap.set(categoryKey, { text: item, level: currentLevel });
            }
          }
        } else {
          // For non-upgradable powers, just add them if they don't exist yet
          // Use the full text as the key to avoid duplicates
          if (!powerMap.has(item)) {
            powerMap.set(item, { text: item, level: currentLevel });
          }
        }
      });
    }
    
    // Define the desired order of power categories
    const powerOrder = [
      // Passive bonuses first
      'damage_healing',  // Damage and healing multiplier
      'ac',              // AC increase
      'resistance',      // Damage resistance
      'immunity',        // Damage immunity
      'truesight',       // Truesight
      
      // Other abilities
      'Revive ally to full HP 1/day',
      'Recover half max HP on short rest',
      'Return to half HP when reduced to 0 HP 1/long rest',
      'Ignore resistance, treat immunity as resistance',
      'reroll',          // Reroll ability
      
      // Divine Form at the end
      'divine_form'      // Divine Form
    ];
    
    // Sort powers according to the defined order
    const sortedPowers = [];
    
    // First add powers in the specified order
    powerOrder.forEach(category => {
      // Check if it's a category key
      if (['damage_healing', 'ac', 'resistance', 'immunity', 'movement', 'truesight', 'reroll', 'divine_form'].includes(category)) {
        if (powerMap.has(category)) {
          sortedPowers.push(powerMap.get(category).text);
          powerMap.delete(category);
        }
      } else {
        // It's a specific power text
        if (powerMap.has(category)) {
          sortedPowers.push(powerMap.get(category).text);
          powerMap.delete(category);
        }
      }
    });
    
    // Add any remaining powers that weren't in the explicit order
    Array.from(powerMap.values())
      .sort((a, b) => a.text.localeCompare(b.text))
      .forEach(entry => {
        sortedPowers.push(entry.text);
      });
    
    return sortedPowers;
  };

  // Get combined god boons for selected level
  const getCombinedGodBoons = () => {
    if (selectedLevel <= 0 || selectedLevel > divinePowers.length) {
      return [];
    }
    
    // Create a map to track the highest version of each boon by god
    const boonMap = new Map();
    
    // Process boons from level 1 up to selected level
    for (let i = 0; i < selectedLevel; i++) {
      const levelData = divinePowers[i];
      
      levelData.godBoons.forEach(boon => {
        // Use the god name as the key to avoid duplicates
        boonMap.set(boon.god, {
          god: boon.god,
          name: boon.name,
          description: boon.description
        });
      });
    }
    
    // Convert map values to array
    return Array.from(boonMap.values());
  };

  // Get class-specific powers for a character
  const getClassPowers = (characterId, maxLevel) => {
    if (characterId === 'universal') return [];
    
    const powers = classSpecificPowers[characterId] || [];
    const filteredPowers = powers.filter(power => power.level <= maxLevel);
    
    // Determine which powers are upgrades vs. separate abilities
    const upgradablePowers = {};
    const finalPowers = [];
    
    // Characters with powers that are upgrades (only show highest level)
    const upgradeCharacters = ['kalmia', 'pyre', 'khada'];
    // Characters with powers that are separate abilities (show all)
    const separateCharacters = ['yrsa', 'pamykos'];
    
    if (upgradeCharacters.includes(characterId)) {
      // For characters with upgradable powers, only show highest level
      const powerGroups = {};
      
      filteredPowers.forEach(power => {
        const baseName = power.name.split(' (Level')[0];
        
        if (!powerGroups[baseName] || power.level > powerGroups[baseName].level) {
          powerGroups[baseName] = power;
        }
      });
      
      return Object.values(powerGroups);
    } else {
      // For characters with separate powers, show all powers up to max level
      return filteredPowers;
    }
  };

  // Get item summaries for a character
  const getItemSummaries = (characterId) => {
    return itemSummaries[characterId] || [];
  };

  const renderDetailedView = () => {
    return (
      <div className="divine-powers-detailed">
        {/* Universal Divine Powers */}
        <h3 className="section-title">Universal Divine Abilities (All Characters)</h3>
        {divinePowers.slice(0, showGMControls ? 3 : 2).map((level) => (
          <div key={level.level} className="divine-level">
            <h3>Level {level.level}: {level.name} <span className="level-subtitle">({level.description})</span></h3>
            <ul className="powers-list">
              {level.powers.map((power, index) => (
                <li key={index} className="power-item">
                  <strong>{power.name.split(' (Level')[0]}:</strong> {power.description}
                  {power.subPowers && (
                    <ul className="sub-powers">
                      {power.subPowers.map((subPower, subIndex) => (
                        <li key={subIndex}>{subPower}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            
            {/* God Boons Section */}
            {level.godBoons.length > 0 && (
              <div className="god-boons">
                <h4>God-Specific Boons</h4>
                <ul className="powers-list">
                  {level.godBoons.map((boon, index) => (
                    <li key={index} className="power-item">
                      <strong>{boon.god}'s {boon.name}:</strong> {boon.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* Class-Specific Divine Powers */}
        <h3 className="section-title">Class-Specific Divine Abilities</h3>
        {characters.filter(char => char.id !== 'universal').map((character) => (
          <div key={character.id} className="divine-level">
            <h3>{character.name}</h3>
            <ul className="powers-list">
              {(classSpecificPowers[character.id] || [])
                .filter(power => power.level <= (showGMControls ? 3 : 2))
                .map((power, index) => (
                <li key={index} className="power-item">
                  <strong>{power.name}:</strong> {power.description}
                  {power.subPowers && (
                    <ul className="sub-powers">
                      {power.subPowers.map((subPower, subIndex) => (
                        <li key={subIndex}>{subPower}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Item Summaries */}
        <h3 className="section-title">Item Summaries</h3>
        {characters.filter(char => char.id !== 'universal' && itemSummaries[char.id]).map((character) => (
          <div key={character.id} className="divine-level">
            <h3>{character.name} Items</h3>
            {(itemSummaries[character.id] || []).map((item, itemIndex) => (
              <div key={itemIndex} className="item-summary">
                <h4>{item.name}</h4>
                <p className="item-description">{item.description}</p>
                <ul className="item-effects">
                  {item.effects.map((effect, effectIndex) => (
                    <li key={effectIndex}>{effect}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderCombinedView = () => {
    const combinedPowers = getCombinedPowers();
    const godBoons = getCombinedGodBoons();
    
    return (
      <div className="divine-powers-detailed">
        <div className="divine-level">
          <h3>Combined Divine Powers (Level 1-{selectedLevel})</h3>
          <div className="level-selector">
            <label htmlFor="level-select">Show powers up to level: </label>
            <select 
              id="level-select" 
              value={selectedLevel} 
              onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
            >
              {divinePowers.slice(0, showGMControls ? 3 : 2).map(level => (
                <option key={level.level} value={level.level}>
                  {level.level} - {level.name}
                </option>
              ))}
            </select>
          </div>
          <ul className="powers-list">
            {combinedPowers.map((power, index) => (
              <li key={index} className="power-item">
                <strong>{power.name.split(' (Level')[0]}:</strong> {power.description}
                {power.subPowers && (
                  <ul className="sub-powers">
                    {power.subPowers.map((subPower, subIndex) => (
                      <li key={subIndex}>{subPower}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          
          {/* God Boons Section */}
          {godBoons.length > 0 && selectedLevel >= 2 && (
            <div className="god-boons">
              <h4>God-Specific Boons</h4>
              <ul className="powers-list">
                {godBoons.map((boon, index) => (
                  <li key={index} className="power-item">
                    <strong>{boon.god}'s {boon.name}:</strong> {boon.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPrintableView = () => {
    const universalSummary = getCombinedPrintableSummary();
    const godBoons = getCombinedGodBoons();
    
    // Create arrays for each column to better control layout
    const column1 = [];
    const column2 = [];
    const column3 = [];
    
    // Add universal cards (2 per column) if showing universal powers
    if (printView === 'all' || printView === 'universal') {
      for (let i = 0; i < 6; i++) {
        const universalCard = (
          <div key={`universal-${i}`} className="printable-card character-card universal-card">
            <h4>Universal Divine Powers (Level {selectedLevel})</h4>
            <div className="card-section">
              <ul className="printable-summary">
                {universalSummary.map((item, itemIndex) => (
                  <li key={itemIndex} className={item.startsWith('  •') ? 'sub-item' : ''}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* God-specific boons */}
            {godBoons.length > 0 && (
              <div className="card-section god-boons-section">
                <h5>God-Specific Boons</h5>
                <ul className="printable-summary">
                  {godBoons.map((boon, index) => (
                    <li key={index}>
                      <strong>{boon.god}'s {boon.name}:</strong> 2/day, 4d10 radiant damage (6d10 vs. oath-breakers)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
        // Distribute cards evenly across columns
        if (i < 2) column1.push(universalCard);
        else if (i < 4) column2.push(universalCard);
        else column3.push(universalCard);
      }
    }
    
    // Add character-specific cards if showing character powers
    if (printView === 'all' || printView === 'character') {
      // Custom order for character cards to optimize space
      const characterOrder = [
        'kalmia',
        'khada', // Swapped with Yrsa
        'pyre',
        'yrsa',  // Swapped with Khada
        'pamykos'
      ];
      
      // Add character-specific cards in the custom order
      const characterCards = characterOrder.map(charId => {
        const character = characters.find(c => c.id === charId);
        if (!character) return null;
        
        const classPowers = getClassPowers(character.id, selectedLevel);
        const items = getItemSummaries(character.id);
        
        return (
          <div key={`character-${character.id}`} className="printable-card character-card specific-card">
            <h4>{character.name}</h4>
            
            {/* Class Powers */}
            {classPowers.length > 0 && (
              <div className="card-section">
                <h5>Class Abilities</h5>
                
                {/* Special handling for Pamykos - combine all decrees */}
                {character.id === 'pamykos' && (
                  <div>
                    {classPowers.length > 0 && (
                      <div>
                        <p><strong>{classPowers[classPowers.length - 1].name.split(' (Level')[0]}:</strong> {selectedLevel >= 3 ? "(2x per day)" : "(1x per day)"} Issue one divine command:</p>
                        <ul className="printable-summary">
                          {/* Level 2 commands */}
                          <li>"I deny your power": (Action) - You cause all damage caused by your target to be completely negated until the start of your next turn</li>
                          <li>"I grant you my blessing": (Bonus Action) - Cure the target of any status condition</li>
                          
                          {/* Level 3 commands */}
                          {selectedLevel >= 3 && (
                            <>
                              <li>"I command your obedience": (Bonus Action) - Target must immediately follow one simple command that does not cause them or their allies harm (no save)</li>
                              <li>"I forbid your magic": (Reaction) - you can choose to nullify the effects of a spell cast against you or one creature of your choice (does not nullify AOE effects against other targets)</li>
                            </>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Special handling for Yrsa - show both abilities without level indicators */}
                {character.id === 'yrsa' && (
                  <div>
                    <ul className="printable-summary">
                      {classPowers.map((power, index) => (
                        <li key={index}>
                          <strong>{power.name.split(' (Level')[0]}:</strong> {power.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* For all other characters with upgradable powers */}
                {(character.id !== 'yrsa' && character.id !== 'pamykos') && (
                  <ul className="printable-summary">
                    {classPowers.map((power, index) => (
                      <li key={index}>
                        <strong>{power.name.split(' (Level')[0]}:</strong> {power.description}
                        {power.subPowers && power.subPowers.map((subPower, subIndex) => (
                          <li key={`sub-${subIndex}`} className="sub-item">• {subPower}</li>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Item Abilities */}
            {items.length > 0 && (
              <div className="card-section">
                <h5>Item Abilities</h5>
                {items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <p className="item-name">{item.name}</p>
                    <ul className="printable-summary item-list">
                      {item.effects.map((effect, effectIndex) => (
                        <li key={effectIndex}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            
            {/* If no class powers or items, show a message */}
            {classPowers.length === 0 && items.length === 0 && (
              <div className="card-section">
                <p>No unique powers or items for this character.</p>
              </div>
            )}
          </div>
        );
      }).filter(Boolean);
      
      // Distribute character cards across columns
      characterCards.forEach((card, index) => {
        if (index % 3 === 0) column1.push(card);
        else if (index % 3 === 1) column2.push(card);
        else column3.push(card);
      });
    }
    
    return (
      <div className="divine-powers-printable no-break-before">
        <div className="printable-controls">
          <div className="level-selector">
            <label htmlFor="printable-level-select">Show powers up to level: </label>
            <select 
              id="printable-level-select" 
              value={selectedLevel} 
              onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
            >
              {divinePowers.slice(0, showGMControls ? 3 : 2).map(level => (
                <option key={level.level} value={level.level}>
                  {level.level} - {level.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="print-view-selector">
            <label htmlFor="print-view-select">Show: </label>
            <select 
              id="print-view-select" 
              value={printView} 
              onChange={(e) => setPrintView(e.target.value)}
            >
              <option value="all">All Powers</option>
              <option value="universal">Universal Powers Only</option>
              <option value="character">Character-Specific Powers Only</option>
            </select>
          </div>
        </div>
        
        <div className="printable-container">
          <div className="printable-column">
            {column1}
          </div>
          <div className="printable-column">
            {column2}
          </div>
          <div className="printable-column">
            {column3}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="divine-powers-page">
      <h2>Divine Powers</h2>
      
      {/* GM Authentication */}
      <div className="gm-auth-section">
        {!user && (
          <button onClick={handleSignIn} className="gm-button">GM Sign In</button>
        )}
        {user && (
          <div className="gm-controls">
            <span className="gm-status">
              {showGMControls ? 'GM Mode Active' : 'Logged in as ' + user.email}
            </span>
            <button onClick={handleSignOut} className="gm-button">Sign Out</button>
          </div>
        )}
      </div>
      
      <div className="view-toggle">
        <button 
          className={view === 'detailed' ? 'active' : ''}
          onClick={() => setView('detailed')}
        >
          Detailed View
        </button>
        <button 
          className={view === 'combined' ? 'active' : ''}
          onClick={() => setView('combined')}
        >
          Combined View
        </button>
        <button 
          className={view === 'printable' ? 'active' : ''}
          onClick={() => setView('printable')}
        >
          Printable View
        </button>
      </div>
      
      {view === 'detailed' && renderDetailedView()}
      {view === 'combined' && renderCombinedView()}
      {view === 'printable' && renderPrintableView()}
      
      {view === 'printable' && (
        <div className="print-instructions">
          <p>Print this page for all character reference cards.</p>
          <button onClick={() => window.print()} className="print-button">Print Page</button>
        </div>
      )}
    </div>
  );
};

export default DivinePowers; 
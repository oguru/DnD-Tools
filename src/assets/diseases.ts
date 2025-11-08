// A compact diseases table (1..20) with effects adapted from the 5e SRD diseases list.
// Each entry is unique and aimed to impact combat readiness. Source: https://www.5esrd.com/GAMEMASTERING/DISEASES

import { DiseaseTable } from '../types/wildSurge';

export const diseases: DiseaseTable = {
  1: {
    label: 'Ashen Inflammation',
    description: 'Mounting fever. While diseased, you are vulnerable to cold damage. At the end of each long rest: DC 15 CON. On a failure, take 2 (1d4) fire damage per level of exhaustion you possess and gain 1 level of exhaustion; on a success, remove 1 level of exhaustion.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES',
    linkText: '5e SRD – Diseases'
  },
  2: {
    label: 'Blinding Sickness',
    description: 'Eyes burn and blur. At the start of each turn: DC 12 CON or you are blinded until the end of the turn. Disadvantage on attack rolls relying on sight while diseased.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  3: {
    label: 'Blood Fever',
    description: 'Fever chills sap strength. Disadvantage on Strength checks and Strength-based attack rolls. Speed reduced by 10 ft. until cured.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  4: {
    label: 'Bubonic Plague',
    description: 'Swollen buboes and tremors. When contracted, lose 1d4 points of Constitution and 1 point of Charisma. Disadvantage on attack rolls while suffering any Constitution loss from this disease.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  5: {
    label: 'Cackle Fever',
    description: 'Fits of mad laughter. Disadvantage on Wisdom checks and Concentration. Each time you roll a 1 on initiative, DC 10 CON or you are incapacitated until the start of your next turn.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  6: {
    label: 'Calcification Virus',
    description: 'Stiffening skin and joints. Disadvantage on Dexterity saving throws and Acrobatics/Stealth checks. Speed reduced by half.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  7: {
    label: 'Celestial Melancholia',
    description: 'Apathy and awe. Disadvantage on Wisdom (Insight/Perception) and Charisma checks and saves; you cannot take the Help action in combat while diseased.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  8: {
    label: 'Flesh Rot',
    description: 'Open sores and foul decay. You are vulnerable to radiant damage and have disadvantage on death saving throws while diseased.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  9: {
    label: 'Green Decay',
    description: 'Sickly pallor. Magical healing restores only half as many hit points; hit dice healing you perform is reduced by 1 die (minimum 1).',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  10: {
    label: 'Hanta Virus',
    description: 'Lungs ache; breath is short. Disadvantage on Constitution saves and reduce hp max by 5d10. At dawn for 3 days, reduce your hit point maximum by 1d6 (min 1) until cured.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  11: {
    label: 'Ignis Sacer',
    description: 'Burning limbs. When you Dash or take the Attack action, DC 12 CON or take 5d10 fire damage and your speed is reduced by half until the end of your next turn.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  12: {
    label: 'Leech Fever',
    description: 'Blood runs thin. Whenever you take piercing or slashing damage, take an extra 10 damage and you cannot regain more than half your hit points from a single healing effect.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  13: {
    label: 'Living Death',
    description: 'Grave chill creeps in. Your necrotic resistance or immunity (if any) is suppressed. When you take necrotic damage, CON save or be frightened of the source until the end of your next turn.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  14: {
    label: 'Marblewife Syndrome',
    description: 'Skin hardens like stone. Speed reduced by half.; disadvantage on Dexterity checks and saving throws. If you are grappled, you have disadvantage on checks to escape.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  15: {
    label: 'Mindfire',
    description: 'Thoughts burn. Disadvantage on Intelligence, Wisdom, and Charisma attack rolls and checks. Concentration checks are at disadvantage.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  16: {
    label: 'Pestilence',
    description: 'Wasting illness. While below half hit points, you have disadvantage on all attack rolls. Magical healing you receive restores half as many hit points.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  17: {
    label: 'Sewer Plague',
    description: 'Fever and weakness. Gain 1 level of exhaustion on contracting the disease. At the end of each long rest: DC 11 CON; on a failure gain 1 level of exhaustion; on a success the exhaustion from this disease is reduced by 1.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  18: {
    label: 'Shadowed Typhus',
    description: 'Delirious shadows. At the start of your turn: DC 12 WIS or you must move at your movement speed toward the nearest hostile creature before taking other actions.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  19: {
    label: 'Sight Rot',
    description: 'Eyes inflamed and weeping. Disadvantage on ranged weapon and spell attack rolls and on Wisdom (Perception) checks relying on sight.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  },
  20: {
    label: 'Slimy Doom',
    description: 'Bleeding and shock. When you take bludgeoning, piercing, or slashing damage: DC 15 CON or you are stunned until the end of your next turn due to shock.',
    link: 'https://www.5esrd.com/GAMEMASTERING/DISEASES'
  }
};



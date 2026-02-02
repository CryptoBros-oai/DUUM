/**
 * GIGAMECH - Mech Chassis Definitions
 * Predefined mech loadouts inspired by classic BattleTech
 */

import { Weapon, AmmoStore } from '../core/weapons.js';

/**
 * Mech chassis database
 */
export const MECH_CHASSIS = {
  // ═══════════════════════════════════════════════════════════════
  // LIGHT MECHS (20-35 tons)
  // ═══════════════════════════════════════════════════════════════

  LOCUST: {
    name: 'Locust',
    designation: 'LCT-1V',
    tonnage: 20,
    class: 'LIGHT',
    description: 'Fast scout mech, lightly armed but extremely mobile.',
    maxSpeed: 130,
    armorMultiplier: 0.6,
    heatSinks: 10,
    weapons: [
      { id: 'MLAS', location: 'CENTER_TORSO' },
      { id: 'MG', location: 'LEFT_ARM' },
      { id: 'MG', location: 'RIGHT_ARM' },
    ],
    ammo: [
      { weaponId: 'MG', count: 200, location: 'CENTER_TORSO' },
    ],
  },

  COMMANDO: {
    name: 'Commando',
    designation: 'COM-2D',
    tonnage: 25,
    class: 'LIGHT',
    description: 'Aggressive light striker with SRM punch.',
    maxSpeed: 120,
    armorMultiplier: 0.7,
    heatSinks: 10,
    weapons: [
      { id: 'MLAS', location: 'RIGHT_ARM' },
      { id: 'SRM6', location: 'LEFT_TORSO' },
      { id: 'SRM4', location: 'RIGHT_TORSO' },
    ],
    ammo: [
      { weaponId: 'SRM6', count: 30, location: 'LEFT_TORSO' },
      { weaponId: 'SRM4', count: 25, location: 'RIGHT_TORSO' },
    ],
  },

  JENNER: {
    name: 'Jenner',
    designation: 'JR7-D',
    tonnage: 35,
    class: 'LIGHT',
    description: 'Fast striker with heavy laser armament.',
    maxSpeed: 118,
    armorMultiplier: 0.75,
    heatSinks: 10,
    weapons: [
      { id: 'MLAS', location: 'LEFT_ARM' },
      { id: 'MLAS', location: 'RIGHT_ARM' },
      { id: 'MLAS', location: 'LEFT_ARM' },
      { id: 'MLAS', location: 'RIGHT_ARM' },
      { id: 'SRM4', location: 'CENTER_TORSO' },
    ],
    ammo: [
      { weaponId: 'SRM4', count: 25, location: 'CENTER_TORSO' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDIUM MECHS (40-55 tons)
  // ═══════════════════════════════════════════════════════════════

  CENTURION: {
    name: 'Centurion',
    designation: 'CN9-A',
    tonnage: 50,
    class: 'MEDIUM',
    description: 'Versatile medium mech with good all-round capabilities.',
    maxSpeed: 86,
    armorMultiplier: 1.0,
    heatSinks: 10,
    weapons: [
      { id: 'AC10', location: 'RIGHT_ARM' },
      { id: 'LRM10', location: 'LEFT_TORSO' },
      { id: 'MLAS', location: 'CENTER_TORSO' },
      { id: 'MLAS', location: 'CENTER_TORSO' },
    ],
    ammo: [
      { weaponId: 'AC10', count: 20, location: 'RIGHT_TORSO' },
      { weaponId: 'LRM10', count: 24, location: 'LEFT_TORSO' },
    ],
  },

  HUNCHBACK: {
    name: 'Hunchback',
    designation: 'HBK-4G',
    tonnage: 50,
    class: 'MEDIUM',
    description: 'Feared close-range brawler with devastating AC/20.',
    maxSpeed: 86,
    armorMultiplier: 1.1,
    heatSinks: 13,
    weapons: [
      { id: 'AC20', location: 'RIGHT_TORSO' },
      { id: 'MLAS', location: 'LEFT_ARM' },
      { id: 'MLAS', location: 'RIGHT_ARM' },
      { id: 'SLAS', location: 'HEAD' },
    ],
    ammo: [
      { weaponId: 'AC20', count: 10, location: 'LEFT_TORSO' },
    ],
  },

  SHADOWHAWK: {
    name: 'Shadow Hawk',
    designation: 'SHD-2H',
    tonnage: 55,
    class: 'MEDIUM',
    description: 'Jack-of-all-trades with diverse weapon mix.',
    maxSpeed: 83,
    armorMultiplier: 1.0,
    heatSinks: 12,
    weapons: [
      { id: 'AC5', location: 'LEFT_TORSO' },
      { id: 'LRM5', location: 'RIGHT_TORSO' },
      { id: 'SRM2', location: 'HEAD' },
      { id: 'MLAS', location: 'RIGHT_ARM' },
    ],
    ammo: [
      { weaponId: 'AC5', count: 40, location: 'LEFT_TORSO' },
      { weaponId: 'LRM5', count: 24, location: 'RIGHT_TORSO' },
      { weaponId: 'SRM2', count: 50, location: 'CENTER_TORSO' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // HEAVY MECHS (60-75 tons)
  // ═══════════════════════════════════════════════════════════════

  CATAPULT: {
    name: 'Catapult',
    designation: 'CPLT-C1',
    tonnage: 65,
    class: 'HEAVY',
    description: 'Iconic fire support mech with dual LRM racks.',
    maxSpeed: 64,
    armorMultiplier: 1.2,
    heatSinks: 15,
    weapons: [
      { id: 'LRM20', location: 'LEFT_TORSO' },
      { id: 'LRM20', location: 'RIGHT_TORSO' },
      { id: 'MLAS', location: 'LEFT_ARM' },
      { id: 'MLAS', location: 'RIGHT_ARM' },
    ],
    ammo: [
      { weaponId: 'LRM20', count: 12, location: 'LEFT_TORSO' },
      { weaponId: 'LRM20', count: 12, location: 'RIGHT_TORSO' },
    ],
  },

  THUNDERBOLT: {
    name: 'Thunderbolt',
    designation: 'TDR-5S',
    tonnage: 65,
    class: 'HEAVY',
    description: 'Heavy brawler with excellent durability.',
    maxSpeed: 64,
    armorMultiplier: 1.3,
    heatSinks: 15,
    weapons: [
      { id: 'LLAS', location: 'RIGHT_ARM' },
      { id: 'LRM10', location: 'LEFT_TORSO' },
      { id: 'SRM2', location: 'RIGHT_TORSO' },
      { id: 'MLAS', location: 'LEFT_ARM' },
      { id: 'MLAS', location: 'LEFT_ARM' },
      { id: 'MLAS', location: 'LEFT_ARM' },
    ],
    ammo: [
      { weaponId: 'LRM10', count: 24, location: 'LEFT_TORSO' },
      { weaponId: 'SRM2', count: 50, location: 'RIGHT_TORSO' },
    ],
  },

  MARAUDER: {
    name: 'Marauder',
    designation: 'MAD-3R',
    tonnage: 75,
    class: 'HEAVY',
    description: 'Iconic command mech with devastating PPC firepower.',
    maxSpeed: 54,
    armorMultiplier: 1.3,
    heatSinks: 16,
    weapons: [
      { id: 'PPC', location: 'RIGHT_ARM' },
      { id: 'PPC', location: 'LEFT_ARM' },
      { id: 'AC5', location: 'RIGHT_TORSO' },
      { id: 'MLAS', location: 'LEFT_TORSO' },
      { id: 'MLAS', location: 'RIGHT_TORSO' },
    ],
    ammo: [
      { weaponId: 'AC5', count: 20, location: 'RIGHT_TORSO' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ASSAULT MECHS (80-100 tons)
  // ═══════════════════════════════════════════════════════════════

  AWESOME: {
    name: 'Awesome',
    designation: 'AWS-8Q',
    tonnage: 80,
    class: 'ASSAULT',
    description: 'Heavy fire support with triple PPC array.',
    maxSpeed: 48,
    armorMultiplier: 1.4,
    heatSinks: 28,
    weapons: [
      { id: 'PPC', location: 'RIGHT_ARM' },
      { id: 'PPC', location: 'LEFT_ARM' },
      { id: 'PPC', location: 'RIGHT_TORSO' },
      { id: 'SLAS', location: 'HEAD' },
    ],
    ammo: [],
  },

  BATTLEMASTER: {
    name: 'BattleMaster',
    designation: 'BLR-1G',
    tonnage: 85,
    class: 'ASSAULT',
    description: 'Iconic command assault with balanced loadout.',
    maxSpeed: 54,
    armorMultiplier: 1.5,
    heatSinks: 18,
    weapons: [
      { id: 'PPC', location: 'RIGHT_ARM' },
      { id: 'MLAS', location: 'LEFT_TORSO' },
      { id: 'MLAS', location: 'LEFT_TORSO' },
      { id: 'MLAS', location: 'RIGHT_TORSO' },
      { id: 'MLAS', location: 'RIGHT_TORSO' },
      { id: 'SRM6', location: 'LEFT_TORSO' },
      { id: 'MG', location: 'LEFT_ARM' },
      { id: 'MG', location: 'LEFT_ARM' },
    ],
    ammo: [
      { weaponId: 'SRM6', count: 30, location: 'LEFT_TORSO' },
      { weaponId: 'MG', count: 200, location: 'LEFT_ARM' },
    ],
  },

  ATLAS: {
    name: 'Atlas',
    designation: 'AS7-D',
    tonnage: 100,
    class: 'ASSAULT',
    description: 'The ultimate assault mech. Fear incarnate.',
    maxSpeed: 48,
    armorMultiplier: 1.6,
    heatSinks: 20,
    weapons: [
      { id: 'AC20', location: 'RIGHT_TORSO' },
      { id: 'LRM20', location: 'LEFT_TORSO' },
      { id: 'MLAS', location: 'LEFT_ARM' },
      { id: 'MLAS', location: 'RIGHT_ARM' },
      { id: 'SRM6', location: 'LEFT_TORSO' },
    ],
    ammo: [
      { weaponId: 'AC20', count: 10, location: 'RIGHT_TORSO' },
      { weaponId: 'LRM20', count: 12, location: 'LEFT_TORSO' },
      { weaponId: 'SRM6', count: 15, location: 'CENTER_TORSO' },
    ],
  },

  KING_CRAB: {
    name: 'King Crab',
    designation: 'KGC-0000',
    tonnage: 100,
    class: 'ASSAULT',
    description: 'Dual AC/20 monstrosity. Unmatched close-range devastation.',
    maxSpeed: 48,
    armorMultiplier: 1.55,
    heatSinks: 15,
    weapons: [
      { id: 'AC20', location: 'RIGHT_ARM' },
      { id: 'AC20', location: 'LEFT_ARM' },
      { id: 'LLAS', location: 'RIGHT_TORSO' },
    ],
    ammo: [
      { weaponId: 'AC20', count: 10, location: 'RIGHT_TORSO' },
      { weaponId: 'AC20', count: 10, location: 'LEFT_TORSO' },
    ],
  },
};

/**
 * Create a fully initialized mech from chassis definition
 */
export function createMechFromChassis(chassisId, config = {}) {
  const chassis = MECH_CHASSIS[chassisId];
  if (!chassis) {
    throw new Error(`Unknown chassis: ${chassisId}`);
  }

  // Build weapons array
  const weapons = chassis.weapons.map(w => new Weapon(w.id, w.location));

  // Build ammo object
  const ammo = {};
  for (const a of chassis.ammo) {
    ammo[a.weaponId] = new AmmoStore(a.weaponId, a.count, a.location);
  }

  return {
    name: config.name || chassis.name,
    chassis: chassis.designation,
    tonnage: chassis.tonnage,
    maxSpeed: chassis.maxSpeed,
    armorMultiplier: chassis.armorMultiplier,
    heatSinks: chassis.heatSinks,
    weapons,
    ammo,
    ...config,
  };
}

/**
 * Get chassis by class
 */
export function getChassisByClass(mechClass) {
  return Object.entries(MECH_CHASSIS)
    .filter(([_, c]) => c.class === mechClass)
    .map(([id, c]) => ({ id, ...c }));
}

/**
 * Get random chassis for enemy spawning
 */
export function getRandomChassis(mechClass = null) {
  const options = mechClass
    ? getChassisByClass(mechClass)
    : Object.entries(MECH_CHASSIS).map(([id, c]) => ({ id, ...c }));

  return options[Math.floor(Math.random() * options.length)];
}

export default MECH_CHASSIS;

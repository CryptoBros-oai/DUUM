/**
 * GIGAMECH - Damage System
 * Hit detection, damage application, hit location determination
 */

import { LOCATIONS } from '../core/mech.js';

// Hit location tables (front attack)
const HIT_TABLE_FRONT = {
  2:  'CENTER_TORSO',
  3:  'RIGHT_ARM',
  4:  'RIGHT_ARM',
  5:  'RIGHT_LEG',
  6:  'RIGHT_TORSO',
  7:  'CENTER_TORSO',
  8:  'LEFT_TORSO',
  9:  'LEFT_LEG',
  10: 'LEFT_ARM',
  11: 'LEFT_ARM',
  12: 'HEAD',
};

// Hit location tables (side attack)
const HIT_TABLE_SIDE = {
  2:  'CENTER_TORSO',
  3:  'RIGHT_ARM',
  4:  'RIGHT_ARM',
  5:  'RIGHT_LEG',
  6:  'RIGHT_TORSO',
  7:  'RIGHT_TORSO',
  8:  'CENTER_TORSO',
  9:  'LEFT_LEG',
  10: 'LEFT_TORSO',
  11: 'LEFT_ARM',
  12: 'HEAD',
};

// Hit location tables (rear attack)
const HIT_TABLE_REAR = {
  2:  'CENTER_TORSO',
  3:  'RIGHT_ARM',
  4:  'RIGHT_TORSO',
  5:  'RIGHT_TORSO',
  6:  'RIGHT_TORSO',
  7:  'CENTER_TORSO',
  8:  'LEFT_TORSO',
  9:  'LEFT_TORSO',
  10: 'LEFT_TORSO',
  11: 'LEFT_ARM',
  12: 'HEAD',
};

/**
 * Roll 2d6 for hit location
 */
function roll2d6() {
  return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
}

/**
 * Determine attack direction based on angles
 */
function getAttackDirection(attackerAngle, defenderAngle) {
  // Calculate relative angle
  let relAngle = attackerAngle - defenderAngle;
  while (relAngle > Math.PI) relAngle -= Math.PI * 2;
  while (relAngle < -Math.PI) relAngle += Math.PI * 2;

  const absAngle = Math.abs(relAngle);

  if (absAngle < Math.PI / 4) {
    return 'rear';   // Attacking from behind
  } else if (absAngle > Math.PI * 3 / 4) {
    return 'front';  // Head-on attack
  } else {
    return 'side';   // Flanking
  }
}

/**
 * Get hit location based on attack direction
 */
export function rollHitLocation(attackerAngle, defenderAngle) {
  const direction = getAttackDirection(attackerAngle, defenderAngle);
  const roll = roll2d6();

  let table;
  switch (direction) {
    case 'rear': table = HIT_TABLE_REAR; break;
    case 'side': table = HIT_TABLE_SIDE; break;
    default:     table = HIT_TABLE_FRONT;
  }

  return {
    location: table[roll],
    roll: roll,
    direction: direction,
  };
}

/**
 * Damage result object
 */
export class DamageResult {
  constructor() {
    this.hits = [];            // Array of { location, damage, armorDamage, structureDamage }
    this.criticalHits = [];    // Array of { location, system }
    this.locationDestroyed = [];
    this.mechDestroyed = false;
    this.totalDamage = 0;
  }

  addHit(location, damage, armorDamage, structureDamage) {
    this.hits.push({ location, damage, armorDamage, structureDamage });
    this.totalDamage += damage;
  }

  addCritical(location, system) {
    this.criticalHits.push({ location, system });
  }

  addLocationDestroyed(location) {
    this.locationDestroyed.push(location);
  }
}

/**
 * Apply damage to a mech
 */
export function applyDamage(mech, damage, attackerAngle) {
  const result = new DamageResult();

  // Determine hit location
  const hitRoll = rollHitLocation(attackerAngle, mech.torsoAngle);
  let location = hitRoll.location;
  let remainingDamage = damage;

  // Apply damage, potentially transferring to adjacent locations
  while (remainingDamage > 0 && location) {
    const armorBefore = mech.armor[location];
    const structureBefore = mech.structure[location];

    // Apply to armor first
    let armorDamage = 0;
    if (mech.armor[location] > 0) {
      armorDamage = Math.min(mech.armor[location], remainingDamage);
      mech.armor[location] -= armorDamage;
      remainingDamage -= armorDamage;
    }

    // Then to structure
    let structureDamage = 0;
    if (remainingDamage > 0 && mech.structure[location] > 0) {
      structureDamage = Math.min(mech.structure[location], remainingDamage);
      mech.structure[location] -= structureDamage;
      remainingDamage -= structureDamage;

      // Check for critical hits
      if (structureDamage > 0 && Math.random() < 0.3) {
        const critResult = rollCriticalHit(mech, location);
        if (critResult) {
          result.addCritical(location, critResult);
        }
      }
    }

    result.addHit(location, armorDamage + structureDamage, armorDamage, structureDamage);

    // Check if location is destroyed
    if (mech.structure[location] <= 0) {
      result.addLocationDestroyed(location);

      // Check for mech destruction
      if (LOCATIONS[location].critical) {
        mech.isDestroyed = true;
        result.mechDestroyed = true;
        break;
      }

      // Transfer remaining damage to adjacent location
      location = getTransferLocation(location);
    } else {
      break;
    }
  }

  return result;
}

/**
 * Get location damage transfers to when destroyed
 */
function getTransferLocation(location) {
  const transfers = {
    'LEFT_ARM': 'LEFT_TORSO',
    'RIGHT_ARM': 'RIGHT_TORSO',
    'LEFT_LEG': 'LEFT_TORSO',
    'RIGHT_LEG': 'RIGHT_TORSO',
    'LEFT_TORSO': 'CENTER_TORSO',
    'RIGHT_TORSO': 'CENTER_TORSO',
    'HEAD': 'CENTER_TORSO',
    'CENTER_TORSO': null,  // Mech destroyed
  };
  return transfers[location];
}

/**
 * Roll for critical hit effects
 */
function rollCriticalHit(mech, location) {
  const systems = [
    'weapon',
    'ammo',
    'heatsink',
    'actuator',
    'sensor',
    'gyro',
    'engine',
  ];

  const hit = systems[Math.floor(Math.random() * systems.length)];

  switch (hit) {
    case 'weapon':
      // Destroy a weapon in this location
      const weapon = mech.weapons.find(w => w.location === location && w.isFunctional);
      if (weapon) {
        weapon.isFunctional = false;
        return { type: 'weapon', weapon: weapon.id };
      }
      break;

    case 'ammo':
      // Ammo explosion!
      const ammo = Object.values(mech.ammo).find(a => a.location === location && a.count > 0);
      if (ammo) {
        const explosionDamage = ammo.count * 2;
        ammo.count = 0;
        // Apply internal explosion damage
        applyDamage(mech, explosionDamage, mech.torsoAngle);
        return { type: 'ammo_explosion', damage: explosionDamage };
      }
      break;

    case 'heatsink':
      mech.heatDissipation = Math.max(1, mech.heatDissipation - 1);
      return { type: 'heatsink' };

    case 'sensor':
      mech.sensors.range = Math.floor(mech.sensors.range * 0.75);
      return { type: 'sensor' };

    case 'gyro':
      mech.gyro.health -= 50;
      if (mech.gyro.health <= 0) {
        mech.gyro.functional = false;
        // Mech falls, potential pilot damage
        return { type: 'gyro_destroyed' };
      }
      return { type: 'gyro_damaged' };

    case 'engine':
      mech.reactor.health -= 25;
      mech.maxSpeed *= 0.9;
      if (mech.reactor.health <= 0) {
        mech.isDestroyed = true;
        return { type: 'engine_destroyed' };
      }
      return { type: 'engine_damaged' };
  }

  return null;
}

/**
 * Splash damage for missiles/explosions
 */
export function applySplashDamage(entities, centerX, centerY, damage, radius, sourceId) {
  const results = [];

  for (const entity of entities) {
    if (entity.id === sourceId) continue;

    const dx = entity.x - centerX;
    const dy = entity.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      // Damage falls off with distance
      const falloff = 1 - (dist / radius);
      const splashDamage = Math.floor(damage * falloff);

      if (splashDamage > 0 && entity.applyDamage) {
        const angle = Math.atan2(dy, dx);
        const result = applyDamage(entity, splashDamage, angle);
        results.push({ entity, result });
      }
    }
  }

  return results;
}

export default { rollHitLocation, applyDamage, applySplashDamage, DamageResult };

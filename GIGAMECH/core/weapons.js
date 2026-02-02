/**
 * GIGAMECH - Weapons System
 * Weapon definitions, firing mechanics, and ammunition
 */

// Weapon categories
export const WEAPON_TYPE = {
  ENERGY: 'energy',       // No ammo, high heat
  BALLISTIC: 'ballistic', // Uses ammo, low heat
  MISSILE: 'missile',     // Uses ammo, splash damage
};

// Projectile behaviors
export const PROJECTILE_TYPE = {
  BEAM: 'beam',           // Instant hit, draws line
  BOLT: 'bolt',           // Fast projectile with glow
  PROJECTILE: 'projectile', // Ballistic arc
  MISSILE: 'missile',     // Tracking with smoke trail
};

/**
 * Weapon definitions - BattleTech inspired
 */
export const WEAPON_DATA = {
  // === ENERGY WEAPONS ===
  SLAS: {
    name: 'Small Laser',
    type: WEAPON_TYPE.ENERGY,
    projectile: PROJECTILE_TYPE.BEAM,
    damage: 3,
    heat: 1,
    range: { min: 0, optimal: 3, max: 6 },
    cooldown: 0.4,
    tonnage: 0.5,
    critSlots: 1,
    color: [255, 50, 50],
  },
  MLAS: {
    name: 'Medium Laser',
    type: WEAPON_TYPE.ENERGY,
    projectile: PROJECTILE_TYPE.BEAM,
    damage: 5,
    heat: 3,
    range: { min: 0, optimal: 6, max: 9 },
    cooldown: 0.5,
    tonnage: 1,
    critSlots: 1,
    color: [255, 100, 100],
  },
  LLAS: {
    name: 'Large Laser',
    type: WEAPON_TYPE.ENERGY,
    projectile: PROJECTILE_TYPE.BEAM,
    damage: 8,
    heat: 8,
    range: { min: 0, optimal: 10, max: 15 },
    cooldown: 1.0,
    tonnage: 5,
    critSlots: 2,
    color: [255, 150, 150],
  },
  PPC: {
    name: 'Particle Projector Cannon',
    type: WEAPON_TYPE.ENERGY,
    projectile: PROJECTILE_TYPE.BOLT,
    damage: 10,
    heat: 10,
    range: { min: 3, optimal: 12, max: 18 },
    cooldown: 1.5,
    tonnage: 7,
    critSlots: 3,
    color: [100, 150, 255],
    minRangeReducesDamage: true,
  },
  ERPPC: {
    name: 'ER PPC',
    type: WEAPON_TYPE.ENERGY,
    projectile: PROJECTILE_TYPE.BOLT,
    damage: 10,
    heat: 15,
    range: { min: 0, optimal: 14, max: 23 },
    cooldown: 1.5,
    tonnage: 7,
    critSlots: 3,
    color: [80, 120, 255],
  },

  // === BALLISTIC WEAPONS ===
  MG: {
    name: 'Machine Gun',
    type: WEAPON_TYPE.BALLISTIC,
    projectile: PROJECTILE_TYPE.PROJECTILE,
    damage: 2,
    heat: 0,
    range: { min: 0, optimal: 3, max: 6 },
    cooldown: 0.1,
    tonnage: 0.5,
    critSlots: 1,
    ammoPerTon: 200,
    burstCount: 5,
    color: [255, 255, 100],
  },
  AC5: {
    name: 'Autocannon/5',
    type: WEAPON_TYPE.BALLISTIC,
    projectile: PROJECTILE_TYPE.PROJECTILE,
    damage: 5,
    heat: 1,
    range: { min: 0, optimal: 12, max: 18 },
    cooldown: 0.8,
    tonnage: 8,
    critSlots: 4,
    ammoPerTon: 20,
    color: [255, 200, 50],
  },
  AC10: {
    name: 'Autocannon/10',
    type: WEAPON_TYPE.BALLISTIC,
    projectile: PROJECTILE_TYPE.PROJECTILE,
    damage: 10,
    heat: 3,
    range: { min: 0, optimal: 10, max: 15 },
    cooldown: 1.2,
    tonnage: 12,
    critSlots: 7,
    ammoPerTon: 10,
    color: [255, 180, 50],
  },
  AC20: {
    name: 'Autocannon/20',
    type: WEAPON_TYPE.BALLISTIC,
    projectile: PROJECTILE_TYPE.PROJECTILE,
    damage: 20,
    heat: 7,
    range: { min: 0, optimal: 6, max: 9 },
    cooldown: 2.0,
    tonnage: 14,
    critSlots: 10,
    ammoPerTon: 5,
    color: [255, 150, 50],
    screenShake: 1.5,
  },
  GAUSS: {
    name: 'Gauss Rifle',
    type: WEAPON_TYPE.BALLISTIC,
    projectile: PROJECTILE_TYPE.BOLT,
    damage: 15,
    heat: 1,
    range: { min: 0, optimal: 14, max: 22 },
    cooldown: 1.5,
    tonnage: 15,
    critSlots: 7,
    ammoPerTon: 8,
    color: [200, 200, 255],
    ammoExplosive: true,
  },
  UAC5: {
    name: 'Ultra AC/5',
    type: WEAPON_TYPE.BALLISTIC,
    projectile: PROJECTILE_TYPE.PROJECTILE,
    damage: 5,
    heat: 1,
    range: { min: 0, optimal: 12, max: 18 },
    cooldown: 0.4,
    tonnage: 9,
    critSlots: 5,
    ammoPerTon: 20,
    doubleFireChance: 0.5, // Can fire twice but risks jam
    color: [255, 200, 50],
  },

  // === MISSILE WEAPONS ===
  SRM2: {
    name: 'SRM-2',
    type: WEAPON_TYPE.MISSILE,
    projectile: PROJECTILE_TYPE.MISSILE,
    damage: 4,  // 2 damage per missile
    heat: 2,
    range: { min: 0, optimal: 6, max: 9 },
    cooldown: 0.8,
    tonnage: 1,
    critSlots: 1,
    ammoPerTon: 50,
    missileCount: 2,
    spread: 0.1,
    color: [255, 150, 50],
  },
  SRM4: {
    name: 'SRM-4',
    type: WEAPON_TYPE.MISSILE,
    projectile: PROJECTILE_TYPE.MISSILE,
    damage: 8,
    heat: 3,
    range: { min: 0, optimal: 6, max: 9 },
    cooldown: 0.8,
    tonnage: 2,
    critSlots: 1,
    ammoPerTon: 25,
    missileCount: 4,
    spread: 0.15,
    color: [255, 150, 50],
  },
  SRM6: {
    name: 'SRM-6',
    type: WEAPON_TYPE.MISSILE,
    projectile: PROJECTILE_TYPE.MISSILE,
    damage: 12,
    heat: 4,
    range: { min: 0, optimal: 6, max: 9 },
    cooldown: 1.0,
    tonnage: 3,
    critSlots: 2,
    ammoPerTon: 15,
    missileCount: 6,
    spread: 0.2,
    color: [255, 150, 50],
  },
  LRM5: {
    name: 'LRM-5',
    type: WEAPON_TYPE.MISSILE,
    projectile: PROJECTILE_TYPE.MISSILE,
    damage: 5,
    heat: 2,
    range: { min: 6, optimal: 14, max: 21 },
    cooldown: 1.0,
    tonnage: 2,
    critSlots: 1,
    ammoPerTon: 24,
    missileCount: 5,
    spread: 0.3,
    requiresLock: true,
    color: [100, 255, 100],
  },
  LRM10: {
    name: 'LRM-10',
    type: WEAPON_TYPE.MISSILE,
    projectile: PROJECTILE_TYPE.MISSILE,
    damage: 10,
    heat: 4,
    range: { min: 6, optimal: 14, max: 21 },
    cooldown: 1.2,
    tonnage: 5,
    critSlots: 2,
    ammoPerTon: 12,
    missileCount: 10,
    spread: 0.35,
    requiresLock: true,
    color: [100, 255, 100],
  },
  LRM20: {
    name: 'LRM-20',
    type: WEAPON_TYPE.MISSILE,
    projectile: PROJECTILE_TYPE.MISSILE,
    damage: 20,
    heat: 6,
    range: { min: 6, optimal: 14, max: 21 },
    cooldown: 1.5,
    tonnage: 10,
    critSlots: 5,
    ammoPerTon: 6,
    missileCount: 20,
    spread: 0.4,
    requiresLock: true,
    color: [100, 255, 100],
  },
};

/**
 * Weapon instance - attached to a mech
 */
export class Weapon {
  constructor(weaponId, location) {
    const data = WEAPON_DATA[weaponId];
    if (!data) throw new Error(`Unknown weapon: ${weaponId}`);

    this.id = weaponId;
    this.data = data;
    this.location = location;     // Which mech location it's mounted
    this.cooldownRemaining = 0;
    this.isJammed = false;
    this.isFunctional = true;
  }

  /**
   * Check if weapon can fire
   */
  canFire() {
    return this.isFunctional &&
           !this.isJammed &&
           this.cooldownRemaining <= 0;
  }

  /**
   * Update cooldown
   */
  update(dt) {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }
  }

  /**
   * Fire the weapon
   */
  fire(mech, target = null) {
    if (!this.canFire()) return null;

    // Check ammo for ballistic/missile
    if (this.data.type !== WEAPON_TYPE.ENERGY) {
      const ammoKey = this.id;
      if (!mech.ammo[ammoKey] || mech.ammo[ammoKey].count <= 0) {
        return { success: false, reason: 'no_ammo' };
      }
      mech.ammo[ammoKey].count--;
    }

    // Check LRM minimum range and lock requirement
    if (this.data.requiresLock && !target) {
      return { success: false, reason: 'no_lock' };
    }

    // Add heat
    mech.addHeat(this.data.heat);

    // Start cooldown
    this.cooldownRemaining = this.data.cooldown;

    // Handle jam chance for Ultra ACs
    if (this.data.doubleFireChance && Math.random() < 0.05) {
      this.isJammed = true;
    }

    // Return firing data for projectile system
    return {
      success: true,
      weaponId: this.id,
      data: this.data,
      origin: { x: mech.x, y: mech.y },
      angle: mech.torsoAngle,
      target: target,
      owner: mech.id,
    };
  }

  /**
   * Attempt to unjam
   */
  unjam() {
    if (this.isJammed && Math.random() < 0.5) {
      this.isJammed = false;
      return true;
    }
    return false;
  }

  /**
   * Calculate damage at range
   */
  calcDamageAtRange(range) {
    const { min, optimal, max } = this.data.range;
    let damage = this.data.damage;

    // Below minimum range (for PPCs, LRMs)
    if (range < min) {
      if (this.data.minRangeReducesDamage) {
        damage *= range / min;
      }
    }
    // Beyond optimal range
    else if (range > optimal) {
      const falloff = 1 - ((range - optimal) / (max - optimal)) * 0.5;
      damage *= Math.max(0.5, falloff);
    }
    // Beyond max range
    if (range > max) {
      damage = 0;
    }

    return Math.floor(damage);
  }

  serialize() {
    return {
      id: this.id,
      location: this.location,
      cooldownRemaining: this.cooldownRemaining,
      isJammed: this.isJammed,
      isFunctional: this.isFunctional,
    };
  }

  static deserialize(data) {
    const weapon = new Weapon(data.id, data.location);
    weapon.cooldownRemaining = data.cooldownRemaining;
    weapon.isJammed = data.isJammed;
    weapon.isFunctional = data.isFunctional;
    return weapon;
  }
}

/**
 * Ammo container
 */
export class AmmoStore {
  constructor(weaponId, count, location) {
    this.weaponId = weaponId;
    this.count = count;
    this.maxCount = count;
    this.location = location;
    this.isExplosive = WEAPON_DATA[weaponId]?.ammoExplosive || false;
  }

  serialize() {
    return {
      weaponId: this.weaponId,
      count: this.count,
      maxCount: this.maxCount,
      location: this.location,
    };
  }
}

export default { WEAPON_DATA, Weapon, AmmoStore };

/**
 * GIGAMECH - Mech Core System
 * Handles mech state, physics, heat management, and damage model
 */

// Mech weight classes with base stats
export const MECH_CLASS = {
  LIGHT:   { tonnage: [20, 35],  speedMax: 130, armorMult: 0.7, sensorRange: 18 },
  MEDIUM:  { tonnage: [40, 55],  speedMax: 97,  armorMult: 1.0, sensorRange: 15 },
  HEAVY:   { tonnage: [60, 75],  speedMax: 64,  armorMult: 1.3, sensorRange: 12 },
  ASSAULT: { tonnage: [80, 100], speedMax: 48,  armorMult: 1.6, sensorRange: 10 },
};

// Body locations for damage tracking
export const LOCATIONS = {
  HEAD:          { abbrev: 'HD', critical: true,  maxArmor: 9 },
  CENTER_TORSO:  { abbrev: 'CT', critical: true,  maxArmor: 40 },
  LEFT_TORSO:    { abbrev: 'LT', critical: false, maxArmor: 30 },
  RIGHT_TORSO:   { abbrev: 'RT', critical: false, maxArmor: 30 },
  LEFT_ARM:      { abbrev: 'LA', critical: false, maxArmor: 24 },
  RIGHT_ARM:     { abbrev: 'RA', critical: false, maxArmor: 24 },
  LEFT_LEG:      { abbrev: 'LL', critical: false, maxArmor: 30 },
  RIGHT_LEG:     { abbrev: 'RL', critical: false, maxArmor: 30 },
};

/**
 * MechState - Core mech data container
 */
export class MechState {
  constructor(config = {}) {
    // Identity
    this.id = config.id || crypto.randomUUID();
    this.name = config.name || 'Unknown Mech';
    this.chassis = config.chassis || 'Generic';
    this.tonnage = config.tonnage || 50;
    this.mechClass = this._determineClass(this.tonnage);

    // Position & Orientation
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.legAngle = config.angle || 0;    // Direction mech is walking
    this.torsoAngle = config.angle || 0;  // Direction torso is facing (for weapons)
    this.torsoTwistLimit = Math.PI / 3;   // Max torso twist from legs (60 degrees)

    // Movement
    this.velocity = { x: 0, y: 0 };
    this.throttle = 0;           // -1 to 1 (reverse to full forward)
    this.targetThrottle = 0;
    this.maxSpeed = config.maxSpeed || MECH_CLASS[this.mechClass].speedMax;
    this.acceleration = config.acceleration || 15;  // KPH per second
    this.turnRate = config.turnRate || 1.2;         // Radians per second
    this.isMoving = false;

    // Heat System
    this.heat = 0;
    this.maxHeat = 30;
    this.heatDissipation = config.heatSinks || 10;  // Heat per second
    this.heatWarning = 0.7;      // 70% = warning
    this.heatCritical = 0.9;     // 90% = shutdown risk
    this.isOverheated = false;
    this.isShutdown = false;

    // Armor & Structure (per location)
    this.armor = {};
    this.structure = {};
    this.maxArmor = {};
    this.maxStructure = {};
    this._initArmorStructure(config.armorMultiplier || 1);

    // Critical Systems
    this.reactor = { health: 100, functional: true };
    this.gyro = { health: 100, functional: true };
    this.sensors = { health: 100, range: MECH_CLASS[this.mechClass].sensorRange };
    this.lifeSupport = { health: 100, functional: true };

    // Weapons & Equipment
    this.weapons = config.weapons || [];
    this.ammo = config.ammo || {};
    this.equipment = config.equipment || [];

    // Combat State
    this.target = null;
    this.targetLock = 0;         // 0-1, time to lock
    this.isDestroyed = false;
    this.pilot = config.pilot || { skill: 4, gunnery: 4 };
  }

  _determineClass(tonnage) {
    if (tonnage <= 35) return 'LIGHT';
    if (tonnage <= 55) return 'MEDIUM';
    if (tonnage <= 75) return 'HEAVY';
    return 'ASSAULT';
  }

  _initArmorStructure(multiplier) {
    const classMult = MECH_CLASS[this.mechClass].armorMult * multiplier;
    for (const [loc, data] of Object.entries(LOCATIONS)) {
      this.maxArmor[loc] = Math.floor(data.maxArmor * classMult);
      this.armor[loc] = this.maxArmor[loc];
      this.maxStructure[loc] = Math.floor(data.maxArmor * 0.5);
      this.structure[loc] = this.maxStructure[loc];
    }
  }

  /**
   * Update mech physics each frame
   */
  update(dt) {
    if (this.isDestroyed || this.isShutdown) return;

    // Throttle interpolation (mechs don't instantly change speed)
    const throttleDiff = this.targetThrottle - this.throttle;
    const throttleChange = Math.sign(throttleDiff) * Math.min(Math.abs(throttleDiff), this.acceleration * dt / this.maxSpeed);
    this.throttle += throttleChange;

    // Calculate current speed
    const currentSpeed = this.throttle * this.maxSpeed;

    // Apply velocity based on LEG angle (not torso)
    this.velocity.x = Math.cos(this.legAngle) * currentSpeed * dt;
    this.velocity.y = Math.sin(this.legAngle) * currentSpeed * dt;

    this.isMoving = Math.abs(currentSpeed) > 1;

    // Heat dissipation
    this.heat = Math.max(0, this.heat - this.heatDissipation * dt);
    this._checkHeatStatus();
  }

  /**
   * Set throttle (-1 to 1)
   */
  setThrottle(value) {
    this.targetThrottle = Math.max(-0.5, Math.min(1, value)); // Reverse is slower
  }

  /**
   * Turn the mech legs
   */
  turnLegs(direction, dt) {
    this.legAngle += direction * this.turnRate * dt;
    this.legAngle = this.legAngle % (Math.PI * 2);

    // Torso tries to follow legs but within twist limits
    this._constrainTorso();
  }

  /**
   * Twist torso relative to legs
   */
  twistTorso(targetAngle) {
    const relativeAngle = targetAngle - this.legAngle;
    const clampedTwist = Math.max(-this.torsoTwistLimit, Math.min(this.torsoTwistLimit, relativeAngle));
    this.torsoAngle = this.legAngle + clampedTwist;
  }

  _constrainTorso() {
    const twist = this.torsoAngle - this.legAngle;
    if (Math.abs(twist) > this.torsoTwistLimit) {
      this.torsoAngle = this.legAngle + Math.sign(twist) * this.torsoTwistLimit;
    }
  }

  /**
   * Add heat from weapon fire
   */
  addHeat(amount) {
    this.heat = Math.min(this.maxHeat * 1.5, this.heat + amount); // Can exceed max temporarily
    this._checkHeatStatus();
  }

  _checkHeatStatus() {
    const heatRatio = this.heat / this.maxHeat;

    if (heatRatio >= 1.0) {
      // Emergency shutdown
      if (Math.random() < 0.3) {
        this.isShutdown = true;
        this.isOverheated = true;
      }
    } else if (heatRatio >= this.heatCritical) {
      // Risk of shutdown, movement penalties
      this.isOverheated = true;
    } else if (heatRatio >= this.heatWarning) {
      this.isOverheated = false;
    } else {
      this.isOverheated = false;
    }
  }

  /**
   * Apply damage to a location
   */
  applyDamage(location, amount) {
    if (!LOCATIONS[location]) return { destroyed: false, critical: false };

    let remaining = amount;

    // Armor absorbs first
    if (this.armor[location] > 0) {
      const absorbed = Math.min(this.armor[location], remaining);
      this.armor[location] -= absorbed;
      remaining -= absorbed;
    }

    // Then structure
    if (remaining > 0 && this.structure[location] > 0) {
      const absorbed = Math.min(this.structure[location], remaining);
      this.structure[location] -= absorbed;
      remaining -= absorbed;

      // Critical hit chance when structure is damaged
      if (Math.random() < 0.4) {
        this._rollCriticalHit(location);
      }
    }

    // Check for location destruction
    const locationDestroyed = this.structure[location] <= 0;

    // Check for mech destruction (CT or head destroyed)
    if (locationDestroyed && LOCATIONS[location].critical) {
      this.isDestroyed = true;
    }

    return {
      destroyed: locationDestroyed,
      critical: LOCATIONS[location].critical,
      mechDestroyed: this.isDestroyed
    };
  }

  _rollCriticalHit(location) {
    // Simplified critical hit system
    const crits = ['weapon', 'ammo', 'heatsink', 'actuator'];
    const hit = crits[Math.floor(Math.random() * crits.length)];

    if (hit === 'ammo' && this._hasAmmoInLocation(location)) {
      // AMMO EXPLOSION!
      this.applyDamage(location, 20);
      return { type: 'ammo_explosion', location };
    }

    return { type: hit, location };
  }

  _hasAmmoInLocation(location) {
    // Check if any ammo is stored in this location
    return Object.values(this.ammo).some(a => a.location === location && a.count > 0);
  }

  /**
   * Get overall health percentage
   */
  getHealthPercent() {
    let totalArmor = 0, maxArmor = 0;
    for (const loc of Object.keys(LOCATIONS)) {
      totalArmor += this.armor[loc] + this.structure[loc];
      maxArmor += this.maxArmor[loc] + this.maxStructure[loc];
    }
    return totalArmor / maxArmor;
  }

  /**
   * Serialize for save/network
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      chassis: this.chassis,
      tonnage: this.tonnage,
      x: this.x,
      y: this.y,
      legAngle: this.legAngle,
      torsoAngle: this.torsoAngle,
      throttle: this.throttle,
      heat: this.heat,
      armor: { ...this.armor },
      structure: { ...this.structure },
      weapons: this.weapons.map(w => w.serialize()),
      ammo: { ...this.ammo },
      isDestroyed: this.isDestroyed,
    };
  }

  static deserialize(data) {
    const mech = new MechState(data);
    mech.armor = data.armor;
    mech.structure = data.structure;
    mech.heat = data.heat;
    mech.isDestroyed = data.isDestroyed;
    return mech;
  }
}

/**
 * PlayerMech - Extended mech with player-specific controls
 */
export class PlayerMech extends MechState {
  constructor(config = {}) {
    super(config);
    this.isPlayer = true;
    this.weaponGroups = [[], [], [], [], [], []]; // 6 weapon groups
    this.selectedGroup = 0;
  }

  /**
   * Handle player input
   */
  handleInput(input, dt) {
    if (this.isDestroyed || this.isShutdown) return;

    // Throttle control
    if (input.keys['KeyW']) this.setThrottle(this.targetThrottle + 0.5 * dt);
    if (input.keys['KeyS']) this.setThrottle(this.targetThrottle - 0.5 * dt);

    // Leg turning with A/D
    if (input.keys['KeyA']) this.turnLegs(-1, dt);
    if (input.keys['KeyD']) this.turnLegs(1, dt);

    // Torso follows mouse (passed as targetAngle from renderer)
    // This is handled externally to decouple from input system
  }

  /**
   * Assign weapon to group
   */
  assignWeaponToGroup(weaponIndex, groupIndex) {
    if (groupIndex < 0 || groupIndex >= this.weaponGroups.length) return;

    // Remove from other groups
    for (const group of this.weaponGroups) {
      const idx = group.indexOf(weaponIndex);
      if (idx !== -1) group.splice(idx, 1);
    }

    // Add to new group
    this.weaponGroups[groupIndex].push(weaponIndex);
  }

  /**
   * Fire current weapon group
   */
  fireGroup(groupIndex = this.selectedGroup) {
    const group = this.weaponGroups[groupIndex];
    const results = [];

    for (const weaponIdx of group) {
      const weapon = this.weapons[weaponIdx];
      if (weapon && weapon.canFire()) {
        results.push(weapon.fire(this));
      }
    }

    return results;
  }
}

export default MechState;

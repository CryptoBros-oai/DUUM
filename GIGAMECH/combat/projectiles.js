/**
 * GIGAMECH - Projectile System
 * Handles all projectile physics, rendering data, and collision
 */

import { PROJECTILE_TYPE, WEAPON_DATA } from '../core/weapons.js';

// Projectile speeds (world units per second)
const PROJECTILE_SPEEDS = {
  [PROJECTILE_TYPE.BEAM]: Infinity,     // Instant hit
  [PROJECTILE_TYPE.BOLT]: 40,           // Fast energy bolt
  [PROJECTILE_TYPE.PROJECTILE]: 30,     // Ballistic
  [PROJECTILE_TYPE.MISSILE]: 15,        // Slower but tracking
};

/**
 * Individual projectile instance
 */
export class Projectile {
  constructor(fireData) {
    this.id = crypto.randomUUID();
    this.weaponId = fireData.weaponId;
    this.data = fireData.data;
    this.type = fireData.data.projectile;

    // Position
    this.x = fireData.origin.x;
    this.y = fireData.origin.y;
    this.startX = this.x;
    this.startY = this.y;

    // Direction
    this.angle = fireData.angle;

    // For missiles with spread
    if (fireData.data.spread) {
      this.angle += (Math.random() - 0.5) * fireData.data.spread;
    }

    // Movement
    this.speed = PROJECTILE_SPEEDS[this.type];
    this.velocity = {
      x: Math.cos(this.angle) * this.speed,
      y: Math.sin(this.angle) * this.speed,
    };

    // Tracking (for missiles)
    this.target = fireData.target;
    this.trackingStrength = this.type === PROJECTILE_TYPE.MISSILE ? 3 : 0;

    // Lifetime
    this.lifetime = 0;
    this.maxLifetime = fireData.data.range.max / this.speed + 0.5;
    this.distanceTraveled = 0;

    // State
    this.isAlive = true;
    this.owner = fireData.owner;

    // Visual trail (for rendering)
    this.trail = [];
    this.maxTrailLength = this.type === PROJECTILE_TYPE.MISSILE ? 8 : 4;

    // For beams, we calculate hit instantly
    if (this.type === PROJECTILE_TYPE.BEAM) {
      this.isBeam = true;
      this.beamEnd = { x: this.x, y: this.y };
      this.beamFadeTime = 0.15;
    }
  }

  /**
   * Update projectile position
   */
  update(dt, world, entities) {
    if (!this.isAlive) return null;

    // Beams don't move, they just fade
    if (this.isBeam) {
      this.lifetime += dt;
      if (this.lifetime >= this.beamFadeTime) {
        this.isAlive = false;
      }
      return null;
    }

    // Store trail position
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Tracking for missiles
    if (this.target && this.trackingStrength > 0) {
      const targetEntity = entities.find(e => e.id === this.target);
      if (targetEntity) {
        const dx = targetEntity.x - this.x;
        const dy = targetEntity.y - this.y;
        const targetAngle = Math.atan2(dy, dx);

        // Smooth turn towards target
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.angle += angleDiff * this.trackingStrength * dt;

        // Update velocity
        this.velocity.x = Math.cos(this.angle) * this.speed;
        this.velocity.y = Math.sin(this.angle) * this.speed;
      }
    }

    // Move projectile
    const moveX = this.velocity.x * dt;
    const moveY = this.velocity.y * dt;
    this.x += moveX;
    this.y += moveY;
    this.distanceTraveled += Math.sqrt(moveX * moveX + moveY * moveY);

    // Update lifetime
    this.lifetime += dt;

    // Check lifetime expiry
    if (this.lifetime >= this.maxLifetime) {
      this.isAlive = false;
      return null;
    }

    // Check world collision (walls)
    const sector = world.getSector(this.x, this.y);
    if (!sector.walkable) {
      this.isAlive = false;
      return {
        type: 'terrain',
        x: this.x,
        y: this.y,
        projectile: this,
      };
    }

    // Check entity collision
    for (const entity of entities) {
      if (entity.id === this.owner) continue; // Don't hit self
      if (!entity.isAlive && !entity.isDestroyed === false) continue;

      const dx = entity.x - this.x;
      const dy = entity.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = entity.radius || 0.5;

      if (dist < hitRadius) {
        this.isAlive = false;
        return {
          type: 'entity',
          entity: entity,
          x: this.x,
          y: this.y,
          projectile: this,
          damage: this.calcDamage(),
        };
      }
    }

    return null;
  }

  /**
   * For beams: perform instant raycast
   */
  doBeamTrace(world, entities, maxRange) {
    const step = 0.1;
    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);
    let x = this.x;
    let y = this.y;
    let dist = 0;

    while (dist < maxRange) {
      x += cosA * step;
      y += sinA * step;
      dist += step;

      // Check world collision
      const sector = world.getSector(x, y);
      if (!sector.walkable) {
        this.beamEnd = { x, y };
        return { type: 'terrain', x, y, projectile: this };
      }

      // Check entity collision
      for (const entity of entities) {
        if (entity.id === this.owner) continue;

        const dx = entity.x - x;
        const dy = entity.y - y;
        const hitDist = Math.sqrt(dx * dx + dy * dy);

        if (hitDist < (entity.radius || 0.5)) {
          this.beamEnd = { x, y };
          return {
            type: 'entity',
            entity: entity,
            x, y,
            projectile: this,
            damage: this.calcDamage(),
          };
        }
      }
    }

    // No hit, beam ends at max range
    this.beamEnd = { x, y };
    return null;
  }

  /**
   * Calculate damage based on distance
   */
  calcDamage() {
    const { min, optimal, max } = this.data.range;
    let damage = this.data.damage;

    // Below minimum range penalty
    if (this.distanceTraveled < min) {
      damage *= this.distanceTraveled / min;
    }
    // Beyond optimal range falloff
    else if (this.distanceTraveled > optimal) {
      const falloff = 1 - ((this.distanceTraveled - optimal) / (max - optimal)) * 0.5;
      damage *= Math.max(0.5, falloff);
    }

    return Math.floor(damage);
  }

  /**
   * Get render data for this projectile
   */
  getRenderData() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      angle: this.angle,
      color: this.data.color,
      trail: [...this.trail],
      isBeam: this.isBeam,
      beamStart: this.isBeam ? { x: this.startX, y: this.startY } : null,
      beamEnd: this.beamEnd,
      beamAlpha: this.isBeam ? 1 - (this.lifetime / this.beamFadeTime) : 1,
    };
  }
}

/**
 * Projectile Manager - handles all active projectiles
 */
export class ProjectileManager {
  constructor() {
    this.projectiles = [];
    this.pendingHits = [];
  }

  /**
   * Spawn a new projectile from weapon fire
   */
  spawn(fireData) {
    // Handle missile volleys
    const missileCount = fireData.data.missileCount || 1;

    for (let i = 0; i < missileCount; i++) {
      const proj = new Projectile(fireData);

      // Beams resolve instantly
      if (proj.isBeam) {
        // Will be traced in update
      }

      this.projectiles.push(proj);
    }
  }

  /**
   * Update all projectiles
   */
  update(dt, world, entities) {
    this.pendingHits = [];

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // Handle beams specially (instant trace on first frame)
      if (proj.isBeam && proj.lifetime === 0) {
        const hit = proj.doBeamTrace(world, entities, proj.data.range.max);
        if (hit) {
          this.pendingHits.push(hit);
        }
      }

      const hit = proj.update(dt, world, entities);

      if (hit) {
        this.pendingHits.push(hit);
      }

      if (!proj.isAlive) {
        this.projectiles.splice(i, 1);
      }
    }

    return this.pendingHits;
  }

  /**
   * Get all projectile render data
   */
  getRenderData() {
    return this.projectiles.map(p => p.getRenderData());
  }

  /**
   * Clear all projectiles
   */
  clear() {
    this.projectiles = [];
    this.pendingHits = [];
  }
}

export default ProjectileManager;

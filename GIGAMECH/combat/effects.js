/**
 * GIGAMECH - Visual Effects System
 * Explosions, muzzle flashes, smoke, sparks - all procedural
 */

/**
 * Effect types
 */
export const EFFECT_TYPE = {
  EXPLOSION: 'explosion',
  MUZZLE_FLASH: 'muzzle_flash',
  SPARK: 'spark',
  SMOKE: 'smoke',
  BEAM_IMPACT: 'beam_impact',
  MISSILE_TRAIL: 'missile_trail',
  DEBRIS: 'debris',
  SCREEN_SHAKE: 'screen_shake',
  DUST: 'dust',
};

/**
 * Single particle in an effect
 */
class Particle {
  constructor(config) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.size = config.size || 1;
    this.sizeDecay = config.sizeDecay || 0;
    this.color = config.color || [255, 255, 255];
    this.alpha = config.alpha || 1;
    this.alphaDecay = config.alphaDecay || 1;
    this.lifetime = config.lifetime || 1;
    this.age = 0;
    this.gravity = config.gravity || 0;
    this.friction = config.friction || 0.98;
    this.rotation = config.rotation || 0;
    this.rotationSpeed = config.rotationSpeed || 0;
  }

  update(dt) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.alpha = Math.max(0, 1 - (this.age / this.lifetime) * this.alphaDecay);
    this.size = Math.max(0, this.size - this.sizeDecay * dt);
    this.rotation += this.rotationSpeed * dt;
    return this.age < this.lifetime && this.alpha > 0;
  }
}

/**
 * Visual effect instance
 */
export class Effect {
  constructor(type, x, y, config = {}) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.x = x;
    this.y = y;
    this.particles = [];
    this.isAlive = true;
    this.age = 0;
    this.lifetime = config.lifetime || 1;

    // Screen shake data
    this.screenShake = config.screenShake || 0;

    // Light flash data
    this.lightFlash = config.lightFlash || null;

    this._init(config);
  }

  _init(config) {
    switch (this.type) {
      case EFFECT_TYPE.EXPLOSION:
        this._initExplosion(config);
        break;
      case EFFECT_TYPE.MUZZLE_FLASH:
        this._initMuzzleFlash(config);
        break;
      case EFFECT_TYPE.SPARK:
        this._initSparks(config);
        break;
      case EFFECT_TYPE.SMOKE:
        this._initSmoke(config);
        break;
      case EFFECT_TYPE.BEAM_IMPACT:
        this._initBeamImpact(config);
        break;
      case EFFECT_TYPE.DEBRIS:
        this._initDebris(config);
        break;
      case EFFECT_TYPE.DUST:
        this._initDust(config);
        break;
    }
  }

  _initExplosion(config) {
    const count = config.particleCount || 20;
    const baseSpeed = config.speed || 5;

    // Core flash
    this.lightFlash = {
      color: config.color || [255, 200, 100],
      intensity: config.intensity || 2,
      radius: config.radius || 5,
      duration: 0.2,
    };

    // Fire particles
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = baseSpeed * (0.5 + Math.random() * 0.5);
      this.particles.push(new Particle({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.2 + Math.random() * 0.3,
        sizeDecay: 0.3,
        color: [255, 150 + Math.random() * 100, Math.random() * 50],
        alphaDecay: 1.5,
        lifetime: 0.3 + Math.random() * 0.3,
        friction: 0.95,
      }));
    }

    // Smoke particles (slower, longer lasting)
    for (let i = 0; i < count / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = baseSpeed * 0.3 * Math.random();
      this.particles.push(new Particle({
        x: this.x + (Math.random() - 0.5) * 0.5,
        y: this.y + (Math.random() - 0.5) * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 0.3 + Math.random() * 0.4,
        sizeDecay: -0.2, // Grows
        color: [80, 80, 90],
        alphaDecay: 0.8,
        lifetime: 0.8 + Math.random() * 0.5,
        gravity: -0.5,
        friction: 0.98,
      }));
    }

    this.lifetime = 1.5;
    this.screenShake = config.screenShake || 0.5;
  }

  _initMuzzleFlash(config) {
    const angle = config.angle || 0;

    this.lightFlash = {
      color: config.color || [255, 220, 150],
      intensity: 1.5,
      radius: 3,
      duration: 0.08,
    };

    // Main flash
    for (let i = 0; i < 5; i++) {
      const spreadAngle = angle + (Math.random() - 0.5) * 0.3;
      const speed = 8 + Math.random() * 4;
      this.particles.push(new Particle({
        x: this.x,
        y: this.y,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        size: 0.1 + Math.random() * 0.15,
        color: config.color || [255, 200, 100],
        alphaDecay: 3,
        lifetime: 0.1,
        friction: 0.9,
      }));
    }

    this.lifetime = 0.15;
    this.screenShake = config.screenShake || 0.1;
  }

  _initSparks(config) {
    const count = config.particleCount || 8;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      this.particles.push(new Particle({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.05 + Math.random() * 0.05,
        color: [255, 200 + Math.random() * 55, 100],
        alphaDecay: 2,
        lifetime: 0.2 + Math.random() * 0.3,
        gravity: 2,
        friction: 0.95,
      }));
    }

    this.lifetime = 0.6;
  }

  _initSmoke(config) {
    const count = config.particleCount || 5;

    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle({
        x: this.x + (Math.random() - 0.5) * 0.3,
        y: this.y + (Math.random() - 0.5) * 0.3,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 0.5,
        size: 0.2 + Math.random() * 0.3,
        sizeDecay: -0.1,
        color: config.color || [60, 60, 70],
        alphaDecay: 0.5,
        lifetime: 1 + Math.random() * 1,
        gravity: -0.3,
        friction: 0.99,
      }));
    }

    this.lifetime = 2.5;
  }

  _initBeamImpact(config) {
    const count = 10;
    const angle = config.angle || 0;

    this.lightFlash = {
      color: config.color || [255, 100, 100],
      intensity: 1,
      radius: 2,
      duration: 0.1,
    };

    // Spray particles in opposite direction of beam
    for (let i = 0; i < count; i++) {
      const spreadAngle = angle + Math.PI + (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push(new Particle({
        x: this.x,
        y: this.y,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        size: 0.08 + Math.random() * 0.08,
        color: config.color || [255, 150, 150],
        alphaDecay: 2,
        lifetime: 0.2 + Math.random() * 0.2,
        friction: 0.9,
      }));
    }

    this.lifetime = 0.5;
  }

  _initDebris(config) {
    const count = config.particleCount || 6;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push(new Particle({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 0.1 + Math.random() * 0.15,
        color: config.color || [100, 100, 110],
        alphaDecay: 0.8,
        lifetime: 0.8 + Math.random() * 0.5,
        gravity: 5,
        friction: 0.98,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      }));
    }

    this.lifetime = 1.5;
  }

  _initDust(config) {
    const count = config.particleCount || 8;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle({
        x: this.x + (Math.random() - 0.5),
        y: this.y + (Math.random() - 0.5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.15 + Math.random() * 0.2,
        sizeDecay: -0.05,
        color: config.color || [120, 110, 100],
        alpha: 0.5,
        alphaDecay: 0.4,
        lifetime: 1.5 + Math.random(),
        friction: 0.97,
      }));
    }

    this.lifetime = 3;
  }

  update(dt) {
    this.age += dt;

    // Update light flash
    if (this.lightFlash) {
      this.lightFlash.age = (this.lightFlash.age || 0) + dt;
      if (this.lightFlash.age >= this.lightFlash.duration) {
        this.lightFlash = null;
      }
    }

    // Update particles
    this.particles = this.particles.filter(p => p.update(dt));

    // Check if effect is complete
    if (this.age >= this.lifetime && this.particles.length === 0) {
      this.isAlive = false;
    }

    return this.isAlive;
  }

  getRenderData() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      particles: this.particles.map(p => ({
        x: p.x,
        y: p.y,
        size: p.size,
        color: p.color,
        alpha: p.alpha,
        rotation: p.rotation,
      })),
      lightFlash: this.lightFlash ? {
        x: this.x,
        y: this.y,
        color: this.lightFlash.color,
        intensity: this.lightFlash.intensity * (1 - this.lightFlash.age / this.lightFlash.duration),
        radius: this.lightFlash.radius,
      } : null,
    };
  }
}

/**
 * Effect Manager - handles all active effects
 */
export class EffectManager {
  constructor() {
    this.effects = [];
    this.screenShake = { x: 0, y: 0, intensity: 0, decay: 5 };
  }

  /**
   * Spawn an effect
   */
  spawn(type, x, y, config = {}) {
    const effect = new Effect(type, x, y, config);
    this.effects.push(effect);

    // Add screen shake
    if (effect.screenShake > 0) {
      this.addScreenShake(effect.screenShake);
    }

    return effect;
  }

  /**
   * Add screen shake
   */
  addScreenShake(intensity) {
    this.screenShake.intensity = Math.min(2, this.screenShake.intensity + intensity);
  }

  /**
   * Update all effects
   */
  update(dt) {
    // Update effects
    this.effects = this.effects.filter(e => e.update(dt));

    // Update screen shake
    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 10;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 10;
      this.screenShake.intensity = Math.max(0, this.screenShake.intensity - this.screenShake.decay * dt);
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }
  }

  /**
   * Get all effect render data
   */
  getRenderData() {
    return this.effects.map(e => e.getRenderData());
  }

  /**
   * Get current screen shake offset
   */
  getScreenShake() {
    return { x: this.screenShake.x, y: this.screenShake.y };
  }

  /**
   * Get all active light flashes for lighting system
   */
  getLightFlashes() {
    return this.effects
      .filter(e => e.lightFlash)
      .map(e => e.getRenderData().lightFlash);
  }

  /**
   * Clear all effects
   */
  clear() {
    this.effects = [];
    this.screenShake = { x: 0, y: 0, intensity: 0, decay: 5 };
  }
}

export default EffectManager;

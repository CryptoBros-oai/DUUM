/**
 * GIGAMECH - AI System
 * Enemy mech behaviors, pathfinding, decision making
 */

import { MechState } from './mech.js';

// AI behavior states
export const AI_STATE = {
  IDLE: 'idle',
  PATROL: 'patrol',
  ALERT: 'alert',
  COMBAT: 'combat',
  RETREAT: 'retreat',
  DEAD: 'dead',
};

// AI personality types (affects behavior weights)
export const AI_PERSONALITY = {
  AGGRESSIVE: { engageRange: 1.2, retreatThreshold: 0.2, preferClose: true },
  BALANCED: { engageRange: 1.0, retreatThreshold: 0.35, preferClose: false },
  CAUTIOUS: { engageRange: 0.8, retreatThreshold: 0.5, preferClose: false },
  SNIPER: { engageRange: 1.5, retreatThreshold: 0.4, preferClose: false, preferRange: true },
  BRAWLER: { engageRange: 0.7, retreatThreshold: 0.15, preferClose: true },
};

/**
 * AI Controller for enemy mechs
 */
export class AIController {
  constructor(mech, config = {}) {
    this.mech = mech;
    this.state = AI_STATE.IDLE;
    this.personality = config.personality || AI_PERSONALITY.BALANCED;

    // Target tracking
    this.target = null;
    this.lastKnownTargetPos = null;
    this.targetLostTime = 0;
    this.targetAcquireTime = 0;

    // Patrol
    this.patrolPoints = config.patrolPoints || [];
    this.currentPatrolIndex = 0;
    this.patrolWaitTime = 0;

    // Combat
    this.engageDistance = config.engageDistance || 12;
    this.optimalDistance = config.optimalDistance || 8;
    this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
    this.strafeTimer = 0;
    this.lastFireTime = 0;

    // Movement
    this.currentPath = [];
    this.pathIndex = 0;
    this.stuckTimer = 0;
    this.lastPosition = { x: mech.x, y: mech.y };

    // Awareness
    this.alertLevel = 0;  // 0 = unaware, 1 = fully alert
    this.hearingRange = config.hearingRange || 15;
    this.sightRange = mech.sensors.range;
    this.sightAngle = Math.PI / 3;  // 60 degree cone
  }

  /**
   * Main update loop
   */
  update(dt, world, playerMech, allEntities) {
    if (this.mech.isDestroyed) {
      this.state = AI_STATE.DEAD;
      return;
    }

    // Update awareness
    this._updateAwareness(dt, playerMech);

    // State machine
    switch (this.state) {
      case AI_STATE.IDLE:
        this._updateIdle(dt);
        break;
      case AI_STATE.PATROL:
        this._updatePatrol(dt, world);
        break;
      case AI_STATE.ALERT:
        this._updateAlert(dt, world);
        break;
      case AI_STATE.COMBAT:
        this._updateCombat(dt, world, playerMech);
        break;
      case AI_STATE.RETREAT:
        this._updateRetreat(dt, world, playerMech);
        break;
    }

    // Update mech physics
    this.mech.update(dt);

    // Check if stuck
    this._checkStuck(dt);
  }

  /**
   * Update awareness of player
   */
  _updateAwareness(dt, playerMech) {
    if (!playerMech || playerMech.isDestroyed) {
      this.alertLevel = Math.max(0, this.alertLevel - dt * 0.5);
      return;
    }

    const dx = playerMech.x - this.mech.x;
    const dy = playerMech.y - this.mech.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToPlayer = Math.atan2(dy, dx);

    // Check if player is visible
    let canSee = false;
    if (distance < this.sightRange) {
      // Check if in sight cone
      let angleDiff = angleToPlayer - this.mech.torsoAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) < this.sightAngle) {
        // TODO: Raycast to check line of sight
        canSee = true;
      }
    }

    // Check if player is heard (moving nearby)
    const canHear = distance < this.hearingRange && playerMech.isMoving;

    if (canSee) {
      this.alertLevel = Math.min(1, this.alertLevel + dt * 2);
      this.target = playerMech;
      this.lastKnownTargetPos = { x: playerMech.x, y: playerMech.y };
      this.targetLostTime = 0;
    } else if (canHear) {
      this.alertLevel = Math.min(0.7, this.alertLevel + dt * 0.5);
      this.lastKnownTargetPos = { x: playerMech.x, y: playerMech.y };
    } else if (this.target) {
      this.targetLostTime += dt;
      if (this.targetLostTime > 5) {
        this.target = null;
      }
    }

    // State transitions based on awareness
    if (this.alertLevel > 0.8 && this.target) {
      if (this.state !== AI_STATE.COMBAT && this.state !== AI_STATE.RETREAT) {
        this.state = AI_STATE.COMBAT;
      }
    } else if (this.alertLevel > 0.3) {
      if (this.state === AI_STATE.IDLE || this.state === AI_STATE.PATROL) {
        this.state = AI_STATE.ALERT;
      }
    }
  }

  /**
   * Idle state - waiting for something to happen
   */
  _updateIdle(dt) {
    // Start patrolling if we have patrol points
    if (this.patrolPoints.length > 0) {
      this.state = AI_STATE.PATROL;
    }
  }

  /**
   * Patrol state - moving between waypoints
   */
  _updatePatrol(dt, world) {
    if (this.patrolPoints.length === 0) return;

    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.mech.x;
    const dy = target.y - this.mech.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
      // Reached waypoint, wait then move to next
      this.patrolWaitTime += dt;
      this.mech.setThrottle(0);

      if (this.patrolWaitTime > 2) {
        this.patrolWaitTime = 0;
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      }
    } else {
      // Move towards waypoint
      const targetAngle = Math.atan2(dy, dx);
      this._turnTowards(targetAngle, dt);
      this.mech.setThrottle(0.5);
    }
  }

  /**
   * Alert state - investigating
   */
  _updateAlert(dt, world) {
    if (this.lastKnownTargetPos) {
      const dx = this.lastKnownTargetPos.x - this.mech.x;
      const dy = this.lastKnownTargetPos.y - this.mech.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2) {
        // Reached last known position, look around
        this.mech.setThrottle(0);
        this.mech.torsoAngle += dt * 1;  // Scan
        this.alertLevel -= dt * 0.2;

        if (this.alertLevel < 0.2) {
          this.state = AI_STATE.PATROL;
          this.lastKnownTargetPos = null;
        }
      } else {
        // Move to investigate
        const targetAngle = Math.atan2(dy, dx);
        this._turnTowards(targetAngle, dt);
        this.mech.setThrottle(0.6);
      }
    } else {
      this.alertLevel -= dt * 0.3;
      if (this.alertLevel < 0.2) {
        this.state = AI_STATE.PATROL;
      }
    }
  }

  /**
   * Combat state - engaging enemy
   */
  _updateCombat(dt, world, playerMech) {
    if (!this.target || this.target.isDestroyed) {
      this.state = AI_STATE.ALERT;
      return;
    }

    // Check health for retreat
    const healthPercent = this.mech.getHealthPercent();
    if (healthPercent < this.personality.retreatThreshold) {
      this.state = AI_STATE.RETREAT;
      return;
    }

    const dx = this.target.x - this.mech.x;
    const dy = this.target.y - this.mech.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToTarget = Math.atan2(dy, dx);

    // Aim torso at target
    this.mech.twistTorso(angleToTarget);

    // Movement decisions
    if (this.personality.preferClose && distance > this.optimalDistance) {
      // Close distance
      this._turnTowards(angleToTarget, dt);
      this.mech.setThrottle(0.8);
    } else if (this.personality.preferRange && distance < this.optimalDistance * 0.7) {
      // Back off
      this._turnTowards(angleToTarget + Math.PI, dt);
      this.mech.setThrottle(0.5);
    } else {
      // Strafe
      this.strafeTimer += dt;
      if (this.strafeTimer > 3) {
        this.strafeTimer = 0;
        this.strafeDirection *= -1;
      }

      const strafeAngle = angleToTarget + (Math.PI / 2) * this.strafeDirection;
      this._turnTowards(strafeAngle, dt);
      this.mech.setThrottle(0.4);
    }

    // Fire weapons
    this._attemptFire(distance, angleToTarget);
  }

  /**
   * Retreat state - fleeing while firing
   */
  _updateRetreat(dt, world, playerMech) {
    if (!this.target) {
      this.state = AI_STATE.PATROL;
      return;
    }

    const dx = this.target.x - this.mech.x;
    const dy = this.target.y - this.mech.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToTarget = Math.atan2(dy, dx);

    // Run away
    this._turnTowards(angleToTarget + Math.PI, dt);
    this.mech.setThrottle(1);

    // Twist torso to fire while retreating
    this.mech.twistTorso(angleToTarget);

    // Fire rear weapons
    if (distance < this.engageDistance) {
      this._attemptFire(distance, angleToTarget);
    }

    // Check if safe
    if (distance > this.engageDistance * 2 || this.mech.getHealthPercent() > 0.6) {
      this.state = AI_STATE.COMBAT;
    }
  }

  /**
   * Turn mech legs towards angle
   */
  _turnTowards(targetAngle, dt) {
    let angleDiff = targetAngle - this.mech.legAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > 0.1) {
      this.mech.turnLegs(Math.sign(angleDiff), dt);
    }
  }

  /**
   * Attempt to fire weapons
   */
  _attemptFire(distance, angleToTarget) {
    // Check if facing target
    let aimError = angleToTarget - this.mech.torsoAngle;
    while (aimError > Math.PI) aimError -= Math.PI * 2;
    while (aimError < -Math.PI) aimError += Math.PI * 2;

    if (Math.abs(aimError) > 0.15) return []; // Not aimed enough

    const results = [];

    for (const weapon of this.mech.weapons) {
      if (!weapon.canFire()) continue;

      // Check range
      const { min, max } = weapon.data.range;
      if (distance < min || distance > max) continue;

      // Fire!
      const result = weapon.fire(this.mech, this.target);
      if (result && result.success) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Check if mech is stuck
   */
  _checkStuck(dt) {
    const dx = this.mech.x - this.lastPosition.x;
    const dy = this.mech.y - this.lastPosition.y;
    const moved = Math.sqrt(dx * dx + dy * dy);

    if (moved < 0.01 && Math.abs(this.mech.throttle) > 0.3) {
      this.stuckTimer += dt;

      if (this.stuckTimer > 2) {
        // Try to unstick
        this.mech.legAngle += (Math.random() - 0.5) * Math.PI / 2;
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }

    this.lastPosition = { x: this.mech.x, y: this.mech.y };
  }

  /**
   * Get current AI state for debugging/UI
   */
  getDebugInfo() {
    return {
      state: this.state,
      alertLevel: this.alertLevel,
      hasTarget: !!this.target,
      targetDistance: this.target ? Math.sqrt(
        (this.target.x - this.mech.x) ** 2 +
        (this.target.y - this.mech.y) ** 2
      ) : null,
      healthPercent: this.mech.getHealthPercent(),
    };
  }
}

/**
 * Enemy mech with AI controller
 */
export class EnemyMech extends MechState {
  constructor(config = {}) {
    super(config);
    this.isEnemy = true;
    this.ai = new AIController(this, config.ai || {});
  }

  update(dt, world, playerMech, allEntities) {
    this.ai.update(dt, world, playerMech, allEntities);
  }
}

export default { AIController, EnemyMech, AI_STATE, AI_PERSONALITY };

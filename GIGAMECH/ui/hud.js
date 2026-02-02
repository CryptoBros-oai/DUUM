/**
 * GIGAMECH - Cockpit HUD System
 * Renders all cockpit UI elements on Canvas2D overlay
 */

/**
 * HUD Configuration
 */
export const HUD_CONFIG = {
  // Colors
  primaryColor: '#33ff33',      // Classic green
  warningColor: '#ffaa33',      // Orange warning
  dangerColor: '#ff3333',       // Red critical
  infoColor: '#33aaff',         // Blue info
  dimColor: '#225522',          // Dim green

  // Fonts
  mainFont: 'Share Tech Mono, monospace',
  titleFont: 'Orbitron, sans-serif',

  // Sizing
  padding: 10,
  borderWidth: 2,
};

/**
 * Cockpit HUD Renderer
 */
export class CockpitHUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    // Cached damage paperdoll path
    this.paperdollPaths = null;

    // Animation state
    this.scanlineOffset = 0;
    this.flickerIntensity = 0;
    this.warningFlash = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Rebuild paperdoll paths for new size
    this._buildPaperdollPaths();
  }

  /**
   * Main render function
   */
  render(mechState, gameState = {}) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Update animations
    this.scanlineOffset = (this.scanlineOffset + 1) % 4;
    this.warningFlash = (this.warningFlash + 0.1) % (Math.PI * 2);

    // Draw HUD elements
    this._drawDamagePaperdoll(mechState, 10, this.height - 180);
    this._drawHeatGauge(mechState, this.width - 60, 100);
    this._drawWeaponPanel(mechState, this.width - 180, this.height - 250);
    this._drawRadar(mechState, gameState, 10, 10);
    this._drawSpeedometer(mechState, this.width / 2 - 100, this.height - 50);
    this._drawTargetInfo(mechState, gameState, this.width - 200, 10);
    this._drawCrosshair();
    this._drawWarnings(mechState);

    // CRT effects
    this._drawScanlines();
    this._drawVignette();
  }

  /**
   * Damage paperdoll - mech silhouette showing damage per location
   */
  _drawDamagePaperdoll(mech, x, y) {
    const ctx = this.ctx;
    const scale = 1.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Draw each location
    const locations = [
      { key: 'HEAD', path: this.paperdollPaths.head },
      { key: 'CENTER_TORSO', path: this.paperdollPaths.centerTorso },
      { key: 'LEFT_TORSO', path: this.paperdollPaths.leftTorso },
      { key: 'RIGHT_TORSO', path: this.paperdollPaths.rightTorso },
      { key: 'LEFT_ARM', path: this.paperdollPaths.leftArm },
      { key: 'RIGHT_ARM', path: this.paperdollPaths.rightArm },
      { key: 'LEFT_LEG', path: this.paperdollPaths.leftLeg },
      { key: 'RIGHT_LEG', path: this.paperdollPaths.rightLeg },
    ];

    for (const loc of locations) {
      const armorPercent = mech.armor[loc.key] / mech.maxArmor[loc.key];
      const structPercent = mech.structure[loc.key] / mech.maxStructure[loc.key];

      let color;
      if (structPercent <= 0) {
        color = '#331111';  // Destroyed
      } else if (armorPercent <= 0) {
        color = HUD_CONFIG.dangerColor;  // Structure exposed
      } else if (armorPercent < 0.3) {
        color = HUD_CONFIG.warningColor;
      } else if (armorPercent < 0.6) {
        color = '#aaaa33';
      } else {
        color = HUD_CONFIG.primaryColor;
      }

      ctx.fillStyle = color;
      ctx.fill(loc.path);
      ctx.strokeStyle = HUD_CONFIG.primaryColor;
      ctx.lineWidth = 1;
      ctx.stroke(loc.path);
    }

    ctx.restore();

    // Label
    ctx.font = `10px ${HUD_CONFIG.titleFont}`;
    ctx.fillStyle = HUD_CONFIG.dimColor;
    ctx.fillText('DAMAGE STATUS', x, y - 5);
  }

  _buildPaperdollPaths() {
    // Simplified mech silhouette paths
    const cx = 40;

    this.paperdollPaths = {
      head: this._createPath([[cx - 5, 0], [cx + 5, 0], [cx + 5, 10], [cx - 5, 10]]),
      centerTorso: this._createPath([[cx - 10, 12], [cx + 10, 12], [cx + 10, 45], [cx - 10, 45]]),
      leftTorso: this._createPath([[cx - 22, 15], [cx - 12, 15], [cx - 12, 42], [cx - 22, 42]]),
      rightTorso: this._createPath([[cx + 12, 15], [cx + 22, 15], [cx + 22, 42], [cx + 12, 42]]),
      leftArm: this._createPath([[cx - 30, 15], [cx - 24, 15], [cx - 24, 55], [cx - 30, 55]]),
      rightArm: this._createPath([[cx + 24, 15], [cx + 30, 15], [cx + 30, 55], [cx + 24, 55]]),
      leftLeg: this._createPath([[cx - 15, 47], [cx - 5, 47], [cx - 5, 85], [cx - 15, 85]]),
      rightLeg: this._createPath([[cx + 5, 47], [cx + 15, 47], [cx + 15, 85], [cx + 5, 85]]),
    };
  }

  _createPath(points) {
    const path = new Path2D();
    path.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i][0], points[i][1]);
    }
    path.closePath();
    return path;
  }

  /**
   * Heat gauge - vertical bar
   */
  _drawHeatGauge(mech, x, y) {
    const ctx = this.ctx;
    const width = 30;
    const height = 150;
    const heatPercent = mech.heat / mech.maxHeat;

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(x, y, width, height);

    // Heat fill
    const fillHeight = height * Math.min(1, heatPercent);
    const gradient = ctx.createLinearGradient(x, y + height, x, y);
    gradient.addColorStop(0, HUD_CONFIG.primaryColor);
    gradient.addColorStop(0.6, HUD_CONFIG.warningColor);
    gradient.addColorStop(0.9, HUD_CONFIG.dangerColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y + height - fillHeight, width, fillHeight);

    // Warning/critical lines
    ctx.strokeStyle = HUD_CONFIG.warningColor;
    ctx.setLineDash([2, 2]);
    const warningY = y + height * (1 - mech.heatWarning);
    ctx.beginPath();
    ctx.moveTo(x, warningY);
    ctx.lineTo(x + width, warningY);
    ctx.stroke();

    ctx.strokeStyle = HUD_CONFIG.dangerColor;
    const criticalY = y + height * (1 - mech.heatCritical);
    ctx.beginPath();
    ctx.moveTo(x, criticalY);
    ctx.lineTo(x + width, criticalY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Border
    ctx.strokeStyle = HUD_CONFIG.primaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Label
    ctx.font = `10px ${HUD_CONFIG.titleFont}`;
    ctx.fillStyle = HUD_CONFIG.dimColor;
    ctx.fillText('HEAT', x, y - 5);

    // Percentage
    ctx.font = `14px ${HUD_CONFIG.mainFont}`;
    ctx.fillStyle = heatPercent > mech.heatCritical ? HUD_CONFIG.dangerColor :
                    heatPercent > mech.heatWarning ? HUD_CONFIG.warningColor :
                    HUD_CONFIG.primaryColor;
    ctx.fillText(`${Math.floor(heatPercent * 100)}%`, x, y + height + 15);

    // Overheat warning
    if (mech.isOverheated) {
      const flash = Math.sin(this.warningFlash) > 0;
      if (flash) {
        ctx.fillStyle = HUD_CONFIG.dangerColor;
        ctx.font = `12px ${HUD_CONFIG.titleFont}`;
        ctx.fillText('OVERHEAT', x - 15, y + height + 30);
      }
    }
  }

  /**
   * Weapon panel - shows weapon groups and status
   */
  _drawWeaponPanel(mech, x, y) {
    const ctx = this.ctx;
    const lineHeight = 22;

    // Panel background
    ctx.fillStyle = 'rgba(0, 20, 0, 0.7)';
    ctx.fillRect(x - 5, y - 5, 175, mech.weapons.length * lineHeight + 30);

    // Border
    ctx.strokeStyle = HUD_CONFIG.primaryColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 5, y - 5, 175, mech.weapons.length * lineHeight + 30);

    // Title
    ctx.font = `10px ${HUD_CONFIG.titleFont}`;
    ctx.fillStyle = HUD_CONFIG.dimColor;
    ctx.fillText('WEAPONS', x, y + 10);

    // Weapons list
    ctx.font = `12px ${HUD_CONFIG.mainFont}`;
    for (let i = 0; i < mech.weapons.length; i++) {
      const weapon = mech.weapons[i];
      const yPos = y + 25 + i * lineHeight;

      // Status indicator
      let statusColor = HUD_CONFIG.primaryColor;
      if (!weapon.isFunctional) {
        statusColor = '#333';
      } else if (weapon.isJammed) {
        statusColor = HUD_CONFIG.dangerColor;
      } else if (weapon.cooldownRemaining > 0) {
        statusColor = HUD_CONFIG.dimColor;
      }

      // Cooldown bar
      if (weapon.cooldownRemaining > 0 && weapon.isFunctional) {
        const cooldownPercent = weapon.cooldownRemaining / weapon.data.cooldown;
        ctx.fillStyle = HUD_CONFIG.dimColor;
        ctx.fillRect(x, yPos - 12, 100 * (1 - cooldownPercent), 14);
      }

      ctx.fillStyle = statusColor;
      ctx.fillText(weapon.data.name, x, yPos);

      // Ammo count for ballistic/missile
      if (weapon.data.ammoPerTon) {
        const ammo = mech.ammo[weapon.id];
        const ammoCount = ammo ? ammo.count : 0;
        ctx.fillStyle = ammoCount < 5 ? HUD_CONFIG.warningColor : HUD_CONFIG.primaryColor;
        ctx.fillText(`${ammoCount}`, x + 120, yPos);
      }
    }
  }

  /**
   * Radar display - top-down view of nearby contacts
   */
  _drawRadar(mech, gameState, x, y) {
    const ctx = this.ctx;
    const size = 120;
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Background circle
    ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Range rings
    ctx.strokeStyle = HUD_CONFIG.dimColor;
    ctx.lineWidth = 1;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (size / 2) * (r / 3), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - size / 2, cy);
    ctx.lineTo(cx + size / 2, cy);
    ctx.moveTo(cx, cy - size / 2);
    ctx.lineTo(cx, cy + size / 2);
    ctx.stroke();

    // Player direction indicator
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mech.legAngle);
    ctx.fillStyle = HUD_CONFIG.primaryColor;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    // Torso direction
    ctx.rotate(mech.torsoAngle - mech.legAngle);
    ctx.strokeStyle = HUD_CONFIG.primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -15);
    ctx.stroke();
    ctx.restore();

    // Enemy contacts
    if (gameState.enemies) {
      const radarRange = mech.sensors.range;

      for (const enemy of gameState.enemies) {
        if (enemy.isDestroyed) continue;

        const dx = enemy.x - mech.x;
        const dy = enemy.y - mech.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radarRange) continue;

        const angle = Math.atan2(dy, dx);
        const radarDist = (dist / radarRange) * (size / 2 - 5);

        const bx = cx + Math.cos(angle) * radarDist;
        const by = cy + Math.sin(angle) * radarDist;

        // Enemy blip
        ctx.fillStyle = HUD_CONFIG.dangerColor;
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Border
    ctx.strokeStyle = HUD_CONFIG.primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.font = `10px ${HUD_CONFIG.titleFont}`;
    ctx.fillStyle = HUD_CONFIG.dimColor;
    ctx.fillText('RADAR', x + size / 2 - 15, y + size + 15);
  }

  /**
   * Speedometer - current speed and throttle
   */
  _drawSpeedometer(mech, x, y) {
    const ctx = this.ctx;
    const width = 200;

    // Throttle bar background
    ctx.fillStyle = '#111';
    ctx.fillRect(x, y, width, 20);

    // Throttle fill
    const throttleWidth = (mech.throttle + 1) / 2 * width; // -1 to 1 -> 0 to width
    ctx.fillStyle = mech.throttle < 0 ? HUD_CONFIG.warningColor : HUD_CONFIG.primaryColor;
    ctx.fillRect(x + width / 2, y, throttleWidth - width / 2, 20);

    // Center line
    ctx.strokeStyle = HUD_CONFIG.primaryColor;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + 20);
    ctx.stroke();

    // Border
    ctx.strokeRect(x, y, width, 20);

    // Speed readout
    const speed = Math.abs(mech.throttle * mech.maxSpeed);
    ctx.font = `16px ${HUD_CONFIG.mainFont}`;
    ctx.fillStyle = HUD_CONFIG.primaryColor;
    ctx.fillText(`${Math.floor(speed)} KPH`, x + width / 2 - 30, y - 8);
  }

  /**
   * Target information panel
   */
  _drawTargetInfo(mech, gameState, x, y) {
    const ctx = this.ctx;

    if (!mech.target) {
      ctx.font = `10px ${HUD_CONFIG.titleFont}`;
      ctx.fillStyle = HUD_CONFIG.dimColor;
      ctx.fillText('NO TARGET', x, y + 15);
      return;
    }

    const target = mech.target;
    const dx = target.x - mech.x;
    const dy = target.y - mech.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Panel background
    ctx.fillStyle = 'rgba(0, 20, 0, 0.7)';
    ctx.fillRect(x - 5, y - 5, 190, 80);
    ctx.strokeStyle = HUD_CONFIG.dangerColor;
    ctx.strokeRect(x - 5, y - 5, 190, 80);

    // Target name
    ctx.font = `12px ${HUD_CONFIG.titleFont}`;
    ctx.fillStyle = HUD_CONFIG.dangerColor;
    ctx.fillText(target.name || 'ENEMY MECH', x, y + 12);

    // Distance
    ctx.font = `11px ${HUD_CONFIG.mainFont}`;
    ctx.fillStyle = HUD_CONFIG.primaryColor;
    ctx.fillText(`RANGE: ${distance.toFixed(0)}m`, x, y + 30);

    // Target health bar
    const healthPercent = target.getHealthPercent ? target.getHealthPercent() : 1;
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y + 40, 150, 12);
    ctx.fillStyle = healthPercent > 0.5 ? HUD_CONFIG.primaryColor :
                    healthPercent > 0.25 ? HUD_CONFIG.warningColor :
                    HUD_CONFIG.dangerColor;
    ctx.fillRect(x, y + 40, 150 * healthPercent, 12);
    ctx.strokeStyle = HUD_CONFIG.primaryColor;
    ctx.strokeRect(x, y + 40, 150, 12);

    // Lock status
    if (mech.targetLock < 1) {
      ctx.fillStyle = HUD_CONFIG.warningColor;
      ctx.fillText(`LOCKING ${Math.floor(mech.targetLock * 100)}%`, x, y + 68);
    } else {
      ctx.fillStyle = HUD_CONFIG.primaryColor;
      ctx.fillText('TARGET LOCKED', x, y + 68);
    }
  }

  /**
   * Crosshair
   */
  _drawCrosshair() {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;

    ctx.strokeStyle = HUD_CONFIG.primaryColor;
    ctx.lineWidth = 2;

    // Outer brackets
    ctx.beginPath();
    // Top
    ctx.moveTo(cx - 20, cy - 15);
    ctx.lineTo(cx - 20, cy - 25);
    ctx.lineTo(cx - 10, cy - 25);
    ctx.moveTo(cx + 10, cy - 25);
    ctx.lineTo(cx + 20, cy - 25);
    ctx.lineTo(cx + 20, cy - 15);
    // Bottom
    ctx.moveTo(cx - 20, cy + 15);
    ctx.lineTo(cx - 20, cy + 25);
    ctx.lineTo(cx - 10, cy + 25);
    ctx.moveTo(cx + 10, cy + 25);
    ctx.lineTo(cx + 20, cy + 25);
    ctx.lineTo(cx + 20, cy + 15);
    // Left
    ctx.moveTo(cx - 15, cy - 20);
    ctx.lineTo(cx - 25, cy - 20);
    ctx.lineTo(cx - 25, cy - 10);
    ctx.moveTo(cx - 25, cy + 10);
    ctx.lineTo(cx - 25, cy + 20);
    ctx.lineTo(cx - 15, cy + 20);
    // Right
    ctx.moveTo(cx + 15, cy - 20);
    ctx.lineTo(cx + 25, cy - 20);
    ctx.lineTo(cx + 25, cy - 10);
    ctx.moveTo(cx + 25, cy + 10);
    ctx.lineTo(cx + 25, cy + 20);
    ctx.lineTo(cx + 15, cy + 20);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = HUD_CONFIG.primaryColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Warning messages
   */
  _drawWarnings(mech) {
    const ctx = this.ctx;
    const warnings = [];

    if (mech.isOverheated) warnings.push('HEAT CRITICAL');
    if (mech.isShutdown) warnings.push('EMERGENCY SHUTDOWN');
    if (mech.getHealthPercent() < 0.25) warnings.push('DAMAGE CRITICAL');
    if (!mech.gyro.functional) warnings.push('GYRO OFFLINE');

    if (warnings.length === 0) return;

    const flash = Math.sin(this.warningFlash * 2) > 0;
    if (!flash) return;

    ctx.font = `18px ${HUD_CONFIG.titleFont}`;
    ctx.fillStyle = HUD_CONFIG.dangerColor;
    ctx.textAlign = 'center';

    for (let i = 0; i < warnings.length; i++) {
      ctx.fillText(warnings[i], this.width / 2, 80 + i * 25);
    }

    ctx.textAlign = 'left';
  }

  /**
   * CRT scanline effect
   */
  _drawScanlines() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';

    for (let y = this.scanlineOffset; y < this.height; y += 4) {
      ctx.fillRect(0, y, this.width, 2);
    }
  }

  /**
   * Vignette effect
   */
  _drawVignette() {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.3,
      this.width / 2, this.height / 2, this.height * 0.9
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}

export default CockpitHUD;

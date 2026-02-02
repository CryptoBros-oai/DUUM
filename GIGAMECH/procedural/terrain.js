/**
 * GIGAMECH - Procedural Terrain Generation
 * Biomes, outdoor environments, terrain features
 */

// Biome definitions
export const BIOMES = {
  DESERT: {
    name: 'Desert Wasteland',
    floorColors: [[180, 160, 120], [190, 170, 130], [170, 150, 110]],
    wallColors: [[160, 140, 100], [150, 130, 90]],
    ambientLight: 0.25,
    features: ['dunes', 'rocks', 'ruins', 'outpost'],
    weather: ['clear', 'sandstorm'],
  },
  FOREST: {
    name: 'Temperate Forest',
    floorColors: [[60, 80, 50], [70, 90, 55], [55, 75, 45]],
    wallColors: [[80, 60, 40], [70, 50, 35]],
    ambientLight: 0.15,
    features: ['trees', 'clearings', 'creek', 'camp'],
    weather: ['clear', 'rain', 'fog'],
  },
  URBAN: {
    name: 'Urban Warzone',
    floorColors: [[90, 90, 95], [85, 85, 90], [80, 80, 85]],
    wallColors: [[100, 100, 105], [110, 110, 115]],
    ambientLight: 0.2,
    features: ['buildings', 'streets', 'plaza', 'rubble'],
    weather: ['clear', 'smoke'],
  },
  INDUSTRIAL: {
    name: 'Industrial Complex',
    floorColors: [[70, 75, 80], [75, 80, 85], [65, 70, 75]],
    wallColors: [[80, 85, 90], [90, 95, 100]],
    ambientLight: 0.18,
    features: ['factories', 'pipes', 'tanks', 'cranes'],
    weather: ['clear', 'steam'],
  },
  ARCTIC: {
    name: 'Frozen Tundra',
    floorColors: [[200, 210, 220], [190, 200, 210], [210, 220, 230]],
    wallColors: [[180, 190, 200], [170, 180, 190]],
    ambientLight: 0.3,
    features: ['ice', 'crevasse', 'bunker', 'wreckage'],
    weather: ['clear', 'blizzard'],
  },
  VOLCANIC: {
    name: 'Volcanic Hellscape',
    floorColors: [[50, 40, 35], [60, 45, 40], [45, 35, 30]],
    wallColors: [[70, 50, 40], [80, 55, 45]],
    ambientLight: 0.12,
    features: ['lava', 'rocks', 'vents', 'caves'],
    weather: ['ash', 'eruption'],
    hazards: ['lava_pools', 'geysers'],
  },
  LUNAR: {
    name: 'Lunar Surface',
    floorColors: [[120, 120, 125], [130, 130, 135], [110, 110, 115]],
    wallColors: [[100, 100, 105], [90, 90, 95]],
    ambientLight: 0.4,
    features: ['craters', 'domes', 'base', 'debris'],
    weather: ['vacuum'],
    special: 'low_gravity',
  },
};

/**
 * Noise functions for terrain generation
 */
class NoiseGenerator {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this.perm = this._generatePermutation();
  }

  _generatePermutation() {
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;

    // Fisher-Yates shuffle with seed
    let rng = this.seed;
    for (let i = 255; i > 0; i--) {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      const j = rng % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    // Duplicate for overflow
    return [...perm, ...perm];
  }

  // Simple value noise
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this._fade(xf);
    const v = this._fade(yf);

    const a = this.perm[X] + Y;
    const b = this.perm[X + 1] + Y;

    return this._lerp(v,
      this._lerp(u, this._grad(this.perm[a], xf, yf), this._grad(this.perm[b], xf - 1, yf)),
      this._lerp(u, this._grad(this.perm[a + 1], xf, yf - 1), this._grad(this.perm[b + 1], xf - 1, yf - 1))
    );
  }

  // Fractal Brownian Motion
  fbm(x, y, octaves = 4, lacunarity = 2, persistence = 0.5) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(t, a, b) {
    return a + t * (b - a);
  }

  _grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

/**
 * Terrain Generator
 */
export class TerrainGenerator {
  constructor(config = {}) {
    this.width = config.width || 64;
    this.height = config.height || 64;
    this.seed = config.seed || Date.now();
    this.noise = new NoiseGenerator(this.seed);
  }

  /**
   * Generate a terrain map for a biome
   */
  generate(biome, options = {}) {
    const biomeData = BIOMES[biome] || BIOMES.DESERT;
    const grid = [];

    // Initialize grid
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = this._generateCell(x, y, biomeData, options);
      }
    }

    // Add features
    this._addFeatures(grid, biomeData, options);

    // Ensure playable (clear spawn and exit)
    this._ensurePlayable(grid, options);

    return {
      grid,
      biome: biomeData,
      spawnPoint: options.spawnPoint || { x: 2, y: 2 },
      exitPoint: options.exitPoint || { x: this.width - 3, y: this.height - 3 },
    };
  }

  _generateCell(x, y, biome, options) {
    // Edge walls
    if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
      return { type: 'wall', walkable: false };
    }

    // Use noise to determine base terrain
    const noiseVal = this.noise.fbm(x * 0.1, y * 0.1, 4);

    // Threshold for walls/obstacles
    const wallThreshold = options.density || 0.3;

    if (noiseVal > 0.5 + wallThreshold * 0.5) {
      return { type: 'wall', walkable: false };
    }

    // Pick floor color based on position
    const colorIndex = Math.floor(this.noise.noise2D(x * 0.3, y * 0.3) * 3 + 1.5) % biome.floorColors.length;

    return {
      type: 'floor',
      walkable: true,
      color: biome.floorColors[colorIndex],
    };
  }

  _addFeatures(grid, biome, options) {
    const featureCount = options.featureCount || 5;

    for (let i = 0; i < featureCount; i++) {
      const featureType = biome.features[Math.floor(Math.random() * biome.features.length)];
      this._placeFeature(grid, featureType, biome);
    }
  }

  _placeFeature(grid, featureType, biome) {
    // Find a suitable location
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * (this.width - 10)) + 5;
      const y = Math.floor(Math.random() * (this.height - 10)) + 5;

      if (this._canPlaceFeature(grid, x, y, 3)) {
        this._buildFeature(grid, x, y, featureType, biome);
        break;
      }
    }
  }

  _canPlaceFeature(grid, x, y, size) {
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) return false;
        if (grid[ny][nx].type === 'feature') return false;
      }
    }
    return true;
  }

  _buildFeature(grid, x, y, featureType, biome) {
    switch (featureType) {
      case 'rocks':
      case 'dunes':
        this._buildRockCluster(grid, x, y);
        break;
      case 'buildings':
        this._buildBuilding(grid, x, y);
        break;
      case 'ruins':
      case 'rubble':
        this._buildRuins(grid, x, y);
        break;
      case 'outpost':
      case 'camp':
      case 'base':
        this._buildOutpost(grid, x, y);
        break;
      case 'trees':
        this._buildForest(grid, x, y);
        break;
      case 'craters':
        this._buildCrater(grid, x, y);
        break;
      default:
        this._buildGenericFeature(grid, x, y);
    }
  }

  _buildRockCluster(grid, cx, cy) {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const x = cx + Math.floor(Math.random() * 5) - 2;
      const y = cy + Math.floor(Math.random() * 5) - 2;
      if (x > 0 && y > 0 && x < this.width - 1 && y < this.height - 1) {
        grid[y][x] = { type: 'rock', walkable: false, destructible: false };
      }
    }
  }

  _buildBuilding(grid, cx, cy) {
    const w = 3 + Math.floor(Math.random() * 3);
    const h = 3 + Math.floor(Math.random() * 3);

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= this.width - 1 || y >= this.height - 1) continue;

        // Walls on edge, floor inside
        if (dx === 0 || dy === 0 || dx === w - 1 || dy === h - 1) {
          grid[y][x] = { type: 'building_wall', walkable: false, destructible: true };
        } else {
          grid[y][x] = { type: 'building_floor', walkable: true, indoor: true };
        }
      }
    }

    // Add door
    const doorSide = Math.floor(Math.random() * 4);
    let doorX = cx, doorY = cy;
    if (doorSide === 0) { doorX = cx + Math.floor(w / 2); doorY = cy; }
    else if (doorSide === 1) { doorX = cx + w - 1; doorY = cy + Math.floor(h / 2); }
    else if (doorSide === 2) { doorX = cx + Math.floor(w / 2); doorY = cy + h - 1; }
    else { doorX = cx; doorY = cy + Math.floor(h / 2); }

    if (doorX > 0 && doorY > 0 && doorX < this.width - 1 && doorY < this.height - 1) {
      grid[doorY][doorX] = { type: 'door', walkable: true };
    }
  }

  _buildRuins(grid, cx, cy) {
    const w = 4 + Math.floor(Math.random() * 4);
    const h = 4 + Math.floor(Math.random() * 4);

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= this.width - 1 || y >= this.height - 1) continue;

        // Partially destroyed walls
        if ((dx === 0 || dy === 0 || dx === w - 1 || dy === h - 1) && Math.random() > 0.4) {
          grid[y][x] = { type: 'rubble', walkable: Math.random() > 0.5, destructible: true };
        }
      }
    }
  }

  _buildOutpost(grid, cx, cy) {
    // Central structure
    this._buildBuilding(grid, cx, cy);

    // Surrounding cover
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4;
      const x = cx + Math.floor(Math.cos(angle) * 5);
      const y = cy + Math.floor(Math.sin(angle) * 5);
      if (x > 0 && y > 0 && x < this.width - 1 && y < this.height - 1) {
        grid[y][x] = { type: 'cover', walkable: false, destructible: true };
        grid[y][x + 1] = { type: 'cover', walkable: false, destructible: true };
      }
    }
  }

  _buildForest(grid, cx, cy) {
    const count = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 4;
      const x = cx + Math.floor(Math.cos(angle) * dist);
      const y = cy + Math.floor(Math.sin(angle) * dist);
      if (x > 0 && y > 0 && x < this.width - 1 && y < this.height - 1) {
        grid[y][x] = { type: 'tree', walkable: false, destructible: true };
      }
    }
  }

  _buildCrater(grid, cx, cy) {
    const radius = 2 + Math.floor(Math.random() * 3);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue;

        const x = cx + dx;
        const y = cy + dy;
        if (x <= 0 || y <= 0 || x >= this.width - 1 || y >= this.height - 1) continue;

        if (dist > radius - 1) {
          grid[y][x] = { type: 'crater_rim', walkable: true, elevation: 0.5 };
        } else {
          grid[y][x] = { type: 'crater_floor', walkable: true, elevation: -0.5 };
        }
      }
    }
  }

  _buildGenericFeature(grid, cx, cy) {
    grid[cy][cx] = { type: 'feature', walkable: false };
  }

  _ensurePlayable(grid, options) {
    const spawn = options.spawnPoint || { x: 2, y: 2 };
    const exit = options.exitPoint || { x: this.width - 3, y: this.height - 3 };

    // Clear spawn area
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = spawn.x + dx;
        const y = spawn.y + dy;
        if (x > 0 && y > 0 && x < this.width - 1 && y < this.height - 1) {
          grid[y][x] = { type: 'spawn', walkable: true };
        }
      }
    }

    // Clear exit area
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = exit.x + dx;
        const y = exit.y + dy;
        if (x > 0 && y > 0 && x < this.width - 1 && y < this.height - 1) {
          grid[y][x] = { type: 'exit', walkable: true };
        }
      }
    }

    // TODO: Verify path exists between spawn and exit
  }
}

export default TerrainGenerator;

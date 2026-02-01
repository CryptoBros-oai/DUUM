/**
 * INSTALLATION ALPHA - Level Definition
 * 
 * E1M1 Homage level for the Sector Engine demo.
 * This shows how to define levels using the engine's data-driven approach.
 */

export const SECTOR_TYPES = {
  hangar: { 
    floor: 0, ceiling: 1.4, 
    floorColor: [80, 82, 88], 
    wallColor: [110, 115, 125],
    ceilingColor: [55, 58, 65], 
    walkable: true,
    name: 'HANGAR'
  },
  hangar_platform: { 
    floor: 0.2, ceiling: 1.4, 
    floorColor: [120, 110, 85], 
    wallColor: [140, 130, 100],
    ceilingColor: [55, 58, 65], 
    walkable: true,
    name: 'PLATFORM'
  },
  corridor: { 
    floor: 0, ceiling: 1.1, 
    floorColor: [75, 78, 85], 
    wallColor: [100, 105, 115],
    ceilingColor: [45, 48, 55], 
    walkable: true,
    name: 'CORRIDOR'
  },
  zigzag: { 
    floor: 0.05, ceiling: 1.5, 
    floorColor: [70, 90, 78], 
    wallColor: [95, 120, 105],
    ceilingColor: [40, 55, 45], 
    walkable: true,
    name: 'OPS CENTER'
  },
  computer: { 
    floor: 0.1, ceiling: 1.2, 
    floorColor: [75, 80, 100], 
    wallColor: [100, 108, 130],
    ceilingColor: [38, 45, 62], 
    walkable: true,
    name: 'TERMINAL BAY'
  },
  outdoor: { 
    floor: -0.1, ceiling: 4.0, 
    floorColor: [100, 95, 80], 
    wallColor: [130, 125, 110],
    ceilingColor: [45, 55, 75], 
    walkable: true,
    name: 'EXTERIOR'
  },
  pillar: { 
    floor: 0, ceiling: 1.5, 
    floorColor: [130, 125, 118], 
    wallColor: [150, 145, 138],
    ceilingColor: [50, 50, 55], 
    walkable: false,
    name: 'PILLAR'
  },
  crate: { 
    floor: 0.5, ceiling: 1.2, 
    floorColor: [130, 105, 70], 
    wallColor: [150, 125, 85],
    ceilingColor: [50, 50, 55], 
    walkable: false,
    name: 'CRATE'
  }
};

export const REGIONS = [
  // Entry hangar
  { type: 'hangar', x1: 1, y1: 9, x2: 7, y2: 15 },
  { type: 'hangar_platform', x1: 4, y1: 11, x2: 6, y2: 13 },
  
  // Corridors
  { type: 'corridor', x1: 7, y1: 11, x2: 11, y2: 13 },
  { type: 'corridor', x1: 17, y1: 11, x2: 19, y2: 13 },
  
  // Zigzag / ops room
  { type: 'zigzag', x1: 11, y1: 7, x2: 17, y2: 17 },
  { type: 'pillar', x1: 13, y1: 9, x2: 13, y2: 9 },
  { type: 'pillar', x1: 15, y1: 9, x2: 15, y2: 9 },
  { type: 'pillar', x1: 13, y1: 15, x2: 13, y2: 15 },
  { type: 'pillar', x1: 15, y1: 15, x2: 15, y2: 15 },
  
  // Computer room
  { type: 'computer', x1: 19, y1: 9, x2: 23, y2: 15 },
  { type: 'crate', x1: 21, y1: 10, x2: 22, y2: 10 },
  { type: 'crate', x1: 21, y1: 14, x2: 21, y2: 14 },
  
  // Secret outdoor
  { type: 'outdoor', x1: 1, y1: 1, x2: 7, y2: 7 },
  { type: 'hangar', x1: 3, y1: 8, x2: 5, y2: 8 }
];

export const PLAYER_START = {
  x: 3.5,
  y: 12.5,
  angle: 0
};

export const LEVEL_CONFIG = {
  name: 'Installation Alpha',
  width: 24,
  height: 24,
  sectorTypes: SECTOR_TYPES,
  regions: REGIONS,
  playerStart: PLAYER_START
};

/**
 * Build the level into a World instance
 * @param {World} world - World instance to populate
 */
export function buildLevel(world) {
  // Register sector types
  world.registerSectorTypes(SECTOR_TYPES);
  
  // Fill regions
  for (const region of REGIONS) {
    world.fillRect(region.x1, region.y1, region.x2, region.y2, region.type);
  }
  
  // Define named regions for gameplay
  world.defineRegion('hangar', { x1: 1, y1: 9, x2: 7, y2: 15 }, { description: 'Entry Hangar' });
  world.defineRegion('ops_center', { x1: 11, y1: 7, x2: 17, y2: 17 }, { description: 'Operations Center' });
  world.defineRegion('terminal_bay', { x1: 19, y1: 9, x2: 23, y2: 15 }, { description: 'Terminal Bay' });
  world.defineRegion('exterior', { x1: 1, y1: 1, x2: 7, y2: 7 }, { description: 'Exterior Area', secret: true });
  
  return world;
}

export default LEVEL_CONFIG;

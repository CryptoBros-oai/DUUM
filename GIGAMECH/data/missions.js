/**
 * GIGAMECH - Mission Definitions
 * Mission templates, objectives, and campaign structure
 */

/**
 * Mission objective types
 */
export const OBJECTIVE_TYPE = {
  DESTROY_ALL: 'destroy_all',           // Kill all enemies
  DESTROY_TARGET: 'destroy_target',     // Destroy specific target
  DEFEND: 'defend',                      // Protect target for duration
  ESCORT: 'escort',                      // Escort friendly to destination
  CAPTURE: 'capture',                    // Reach and hold location
  RECON: 'recon',                        // Visit multiple waypoints
  EXTRACTION: 'extraction',             // Reach evac point
  SURVIVE: 'survive',                    // Stay alive for duration
  ASSASSINATION: 'assassination',       // Destroy specific enemy mech
};

/**
 * Mission difficulty settings
 */
export const DIFFICULTY = {
  EASY: {
    enemyCount: 0.7,
    enemySkill: 0.8,
    enemyAccuracy: 0.7,
    payoutMultiplier: 0.8,
    salvageChance: 1.2,
  },
  NORMAL: {
    enemyCount: 1.0,
    enemySkill: 1.0,
    enemyAccuracy: 1.0,
    payoutMultiplier: 1.0,
    salvageChance: 1.0,
  },
  HARD: {
    enemyCount: 1.3,
    enemySkill: 1.2,
    enemyAccuracy: 1.2,
    payoutMultiplier: 1.3,
    salvageChance: 0.9,
  },
  BRUTAL: {
    enemyCount: 1.6,
    enemySkill: 1.5,
    enemyAccuracy: 1.4,
    payoutMultiplier: 1.8,
    salvageChance: 0.7,
  },
};

/**
 * Mission template definitions
 */
export const MISSION_TEMPLATES = {
  // ═══════════════════════════════════════════════════════════════
  // COMBAT MISSIONS
  // ═══════════════════════════════════════════════════════════════

  PATROL: {
    name: 'Combat Patrol',
    description: 'Patrol the area and eliminate any hostile contacts.',
    type: 'combat',
    objectives: [
      { type: OBJECTIVE_TYPE.DESTROY_ALL, description: 'Eliminate all hostile mechs' },
    ],
    enemyCountBase: 3,
    enemyClasses: ['LIGHT', 'MEDIUM'],
    terrainType: 'outdoor',
    biomes: ['DESERT', 'FOREST', 'URBAN'],
    timeLimit: null,
    payout: 50000,
    difficulty: 'EASY',
  },

  ASSAULT: {
    name: 'Base Assault',
    description: 'Attack and destroy the enemy installation.',
    type: 'combat',
    objectives: [
      { type: OBJECTIVE_TYPE.DESTROY_TARGET, description: 'Destroy the command center' },
      { type: OBJECTIVE_TYPE.DESTROY_ALL, description: 'Eliminate all defenders', optional: true },
    ],
    enemyCountBase: 5,
    enemyClasses: ['MEDIUM', 'HEAVY'],
    terrainType: 'structure',
    structureType: 'BASE',
    timeLimit: null,
    payout: 120000,
    difficulty: 'NORMAL',
  },

  DEFENSE: {
    name: 'Base Defense',
    description: 'Defend the installation against incoming attackers.',
    type: 'combat',
    objectives: [
      { type: OBJECTIVE_TYPE.DEFEND, description: 'Protect the generator for 5 minutes', duration: 300 },
    ],
    enemyCountBase: 8,
    enemyClasses: ['LIGHT', 'MEDIUM'],
    enemyWaves: 3,
    terrainType: 'structure',
    structureType: 'BUNKER',
    timeLimit: 300,
    payout: 100000,
    difficulty: 'NORMAL',
  },

  ASSASSINATION: {
    name: 'Assassination',
    description: 'Locate and destroy the enemy commander.',
    type: 'combat',
    objectives: [
      { type: OBJECTIVE_TYPE.ASSASSINATION, description: 'Destroy the enemy commander' },
      { type: OBJECTIVE_TYPE.EXTRACTION, description: 'Reach extraction point' },
    ],
    enemyCountBase: 4,
    enemyClasses: ['MEDIUM', 'HEAVY'],
    bossClass: 'ASSAULT',
    terrainType: 'outdoor',
    biomes: ['URBAN', 'INDUSTRIAL'],
    payout: 200000,
    difficulty: 'HARD',
  },

  // ═══════════════════════════════════════════════════════════════
  // RECON MISSIONS
  // ═══════════════════════════════════════════════════════════════

  RECON: {
    name: 'Reconnaissance',
    description: 'Scout enemy positions and report back.',
    type: 'recon',
    objectives: [
      { type: OBJECTIVE_TYPE.RECON, description: 'Scout all waypoints', waypointCount: 4 },
      { type: OBJECTIVE_TYPE.EXTRACTION, description: 'Reach extraction point' },
    ],
    enemyCountBase: 2,
    enemyClasses: ['LIGHT'],
    terrainType: 'outdoor',
    biomes: ['FOREST', 'DESERT', 'ARCTIC'],
    payout: 40000,
    difficulty: 'EASY',
    preferLight: true,
  },

  DEEP_RECON: {
    name: 'Deep Reconnaissance',
    description: 'Infiltrate enemy territory and gather intel.',
    type: 'recon',
    objectives: [
      { type: OBJECTIVE_TYPE.RECON, description: 'Scout all waypoints', waypointCount: 6 },
      { type: OBJECTIVE_TYPE.AVOID_DETECTION, description: 'Avoid detection', optional: true },
      { type: OBJECTIVE_TYPE.EXTRACTION, description: 'Reach extraction point' },
    ],
    enemyCountBase: 5,
    enemyClasses: ['LIGHT', 'MEDIUM', 'HEAVY'],
    terrainType: 'structure',
    structureType: 'FACTORY',
    payout: 80000,
    difficulty: 'NORMAL',
    preferLight: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // SPECIAL MISSIONS
  // ═══════════════════════════════════════════════════════════════

  ESCORT: {
    name: 'Convoy Escort',
    description: 'Protect the convoy as it traverses hostile territory.',
    type: 'escort',
    objectives: [
      { type: OBJECTIVE_TYPE.ESCORT, description: 'Escort convoy to destination' },
    ],
    enemyCountBase: 6,
    enemyClasses: ['LIGHT', 'MEDIUM'],
    enemyWaves: 2,
    terrainType: 'outdoor',
    biomes: ['DESERT', 'URBAN'],
    payout: 90000,
    difficulty: 'NORMAL',
  },

  EXTRACTION: {
    name: 'Hot Extraction',
    description: 'Extract friendly forces under heavy fire.',
    type: 'extraction',
    objectives: [
      { type: OBJECTIVE_TYPE.CAPTURE, description: 'Reach extraction zone' },
      { type: OBJECTIVE_TYPE.SURVIVE, description: 'Hold for dropship', duration: 120 },
    ],
    enemyCountBase: 8,
    enemyClasses: ['MEDIUM', 'HEAVY'],
    enemyWaves: 4,
    terrainType: 'structure',
    structureType: 'HANGAR',
    payout: 150000,
    difficulty: 'HARD',
  },

  RAID: {
    name: 'Supply Raid',
    description: 'Hit the enemy supply depot and get out fast.',
    type: 'raid',
    objectives: [
      { type: OBJECTIVE_TYPE.DESTROY_TARGET, description: 'Destroy supply caches', count: 3 },
      { type: OBJECTIVE_TYPE.EXTRACTION, description: 'Escape before reinforcements' },
    ],
    enemyCountBase: 3,
    enemyClasses: ['LIGHT', 'MEDIUM'],
    reinforcementTimer: 180,
    terrainType: 'structure',
    structureType: 'WAREHOUSE',
    payout: 110000,
    difficulty: 'NORMAL',
    preferLight: true,
  },

  DEMOLITION: {
    name: 'Demolition',
    description: 'Destroy the enemy reactor facility.',
    type: 'demolition',
    objectives: [
      { type: OBJECTIVE_TYPE.DESTROY_TARGET, description: 'Destroy the reactor core' },
      { type: OBJECTIVE_TYPE.EXTRACTION, description: 'Escape before meltdown', timeAfterObjective: 60 },
    ],
    enemyCountBase: 6,
    enemyClasses: ['MEDIUM', 'HEAVY'],
    terrainType: 'structure',
    structureType: 'REACTOR',
    payout: 180000,
    difficulty: 'HARD',
  },
};

/**
 * Generate a mission instance from template
 */
export function generateMission(templateId, config = {}) {
  const template = MISSION_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown mission template: ${templateId}`);
  }

  const difficulty = DIFFICULTY[config.difficulty || template.difficulty];

  return {
    id: crypto.randomUUID(),
    templateId,
    name: template.name,
    description: template.description,
    type: template.type,
    objectives: template.objectives.map(obj => ({
      ...obj,
      completed: false,
    })),

    // Environment
    terrainType: template.terrainType,
    biome: template.biomes?.[Math.floor(Math.random() * template.biomes.length)],
    structureType: template.structureType,

    // Enemies
    enemyCount: Math.ceil(template.enemyCountBase * difficulty.enemyCount),
    enemyClasses: template.enemyClasses,
    enemySkill: difficulty.enemySkill,
    enemyAccuracy: difficulty.enemyAccuracy,
    enemyWaves: template.enemyWaves || 1,
    bossClass: template.bossClass,

    // Rewards
    payout: Math.floor(template.payout * difficulty.payoutMultiplier),
    salvageChance: difficulty.salvageChance,

    // Constraints
    timeLimit: template.timeLimit,
    preferLight: template.preferLight || false,
    maxTonnage: config.maxTonnage || null,

    // State
    status: 'briefing',
    timeElapsed: 0,
    seed: config.seed || Date.now(),
  };
}

/**
 * Get random mission for procedural campaign
 */
export function getRandomMission(config = {}) {
  const templates = Object.keys(MISSION_TEMPLATES);
  const templateId = templates[Math.floor(Math.random() * templates.length)];
  return generateMission(templateId, config);
}

/**
 * Check if mission objectives are complete
 */
export function checkMissionComplete(mission) {
  const requiredObjectives = mission.objectives.filter(o => !o.optional);
  return requiredObjectives.every(o => o.completed);
}

/**
 * Calculate mission rewards
 */
export function calculateRewards(mission, performance) {
  const baseReward = mission.payout;

  // Performance modifiers
  let modifier = 1.0;

  // Time bonus
  if (mission.timeLimit && performance.timeRemaining > 0) {
    modifier += (performance.timeRemaining / mission.timeLimit) * 0.2;
  }

  // No damage bonus
  if (performance.damageTaken === 0) {
    modifier += 0.25;
  }

  // Optional objectives
  const optionalComplete = mission.objectives
    .filter(o => o.optional && o.completed).length;
  modifier += optionalComplete * 0.1;

  // Kill efficiency
  if (performance.enemiesDestroyed >= mission.enemyCount) {
    modifier += 0.15;
  }

  return {
    credits: Math.floor(baseReward * modifier),
    salvage: performance.salvageCollected || [],
    reputation: Math.floor(10 * modifier),
  };
}

export default MISSION_TEMPLATES;

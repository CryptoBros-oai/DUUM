# GIGAMECH Development Roadmap

> Heavy Metal Combat - A 2.5D Mech Combat Game
> Powered by SectorEngine

---

## 🎯 Vision

GIGAMECH is a love letter to classic mech combat games like MechWarrior 2, MechWarrior 3, and BattleTech. Using a retro 2.5D raycasting engine (SectorEngine), we create an accessible yet deep mech combat experience that runs on any hardware.

**Core Pillars:**
1. **Weight & Momentum** - Mechs feel massive and powerful
2. **Heat Management** - Classic BattleTech heat system
3. **Component Damage** - Lose an arm, lose those weapons
4. **Procedural Everything** - Infinite replayability through generation

---

## 📋 Current Status: Foundation Complete

### ✅ Completed
- [x] SectorEngine core (raycasting, rendering, sprites)
- [x] Per-pixel sprite occlusion
- [x] Dynamic lighting system
- [x] Fog of war / visibility
- [x] Basic audio framework
- [x] 100+ FPS at 600 rays

### 🏗️ Game Systems (Stubbed)
- [x] Mech state & damage model (`core/mech.js`)
- [x] Weapons system (`core/weapons.js`)
- [x] Projectile physics (`combat/projectiles.js`)
- [x] Damage calculation (`combat/damage.js`)
- [x] Visual effects (`combat/effects.js`)
- [x] Enemy AI (`core/ai.js`)
- [x] Terrain generation (`procedural/terrain.js`)
- [x] Structure generation (`procedural/structures.js`)
- [x] Cockpit HUD (`ui/hud.js`)
- [x] Mech database (`data/mechs.js`)
- [x] Mission system (`data/missions.js`)

---

## 🗺️ Development Phases

### Phase 1: Core Combat Loop (Priority: HIGH)
**Goal:** Get a single mech shooting at barrels

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 1.1 | Integrate MechState with player entity | 2h | 🔲 |
| 1.2 | Implement torso twist (independent aim) | 2h | 🔲 |
| 1.3 | Add heat system to gameplay loop | 1h | 🔲 |
| 1.4 | Single weapon firing (Medium Laser) | 2h | 🔲 |
| 1.5 | Beam rendering in WebGL | 2h | 🔲 |
| 1.6 | Muzzle flash effect | 1h | 🔲 |
| 1.7 | Screen shake on firing | 30m | 🔲 |
| 1.8 | Destructible barrel sprites | 2h | 🔲 |
| 1.9 | Explosion effect on destruction | 1h | 🔲 |

**Milestone:** Player can walk around, aim independently, fire laser, destroy barrels

---

### Phase 2: Cockpit HUD (Priority: HIGH)
**Goal:** Feel like you're inside a mech

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 2.1 | Damage paperdoll display | 2h | 🔲 |
| 2.2 | Heat gauge with warning states | 1h | 🔲 |
| 2.3 | Weapon status panel | 2h | 🔲 |
| 2.4 | Radar/minimap with contacts | 2h | 🔲 |
| 2.5 | Speedometer/throttle display | 1h | 🔲 |
| 2.6 | Crosshair with target brackets | 1h | 🔲 |
| 2.7 | CRT scanline effect | 30m | 🔲 |
| 2.8 | Warning messages (HEAT CRITICAL, etc) | 1h | 🔲 |

**Milestone:** Full cockpit UI displaying mech status

---

### Phase 3: Complete Weapon Suite (Priority: HIGH)
**Goal:** All weapon types functional

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 3.1 | Ballistic projectiles (AC series) | 3h | 🔲 |
| 3.2 | Missile system (SRM/LRM) | 4h | 🔲 |
| 3.3 | Missile smoke trails | 2h | 🔲 |
| 3.4 | Ammo tracking & reload | 2h | 🔲 |
| 3.5 | Weapon cooldowns | 1h | 🔲 |
| 3.6 | Weapon groups (fire-linked weapons) | 2h | 🔲 |
| 3.7 | Target lock system for LRMs | 2h | 🔲 |
| 3.8 | Gauss rifle charging mechanic | 2h | 🔲 |

**Milestone:** All weapons firing with correct behavior

---

### Phase 4: Enemy AI (Priority: MEDIUM-HIGH)
**Goal:** Mechs that fight back

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 4.1 | Stationary turret enemy | 2h | 🔲 |
| 4.2 | Basic pathfinding (A* on grid) | 4h | 🔲 |
| 4.3 | AI state machine (patrol/alert/combat) | 3h | 🔲 |
| 4.4 | AI weapon selection by range | 2h | 🔲 |
| 4.5 | AI heat management | 2h | 🔲 |
| 4.6 | AI retreat behavior | 2h | 🔲 |
| 4.7 | Different AI personalities | 2h | 🔲 |
| 4.8 | Enemy mech sprites (multiple frames) | 4h | 🔲 |

**Milestone:** AI mechs patrol, engage, and fight intelligently

---

### Phase 5: Damage & Destruction (Priority: MEDIUM)
**Goal:** Mechs fall apart realistically

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 5.1 | Per-location damage application | 2h | 🔲 |
| 5.2 | Armor vs structure tracking | 1h | 🔲 |
| 5.3 | Critical hit system | 2h | 🔲 |
| 5.4 | Weapon destruction on arm loss | 2h | 🔲 |
| 5.5 | Ammo explosion on crit | 2h | 🔲 |
| 5.6 | Mech death animation | 2h | 🔲 |
| 5.7 | Debris/wreckage sprites | 2h | 🔲 |
| 5.8 | Damage smoke effects | 2h | 🔲 |

**Milestone:** Mechs take damage visibly, components fail, dramatic deaths

---

### Phase 6: Procedural Terrain (Priority: MEDIUM)
**Goal:** Infinite outdoor maps

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 6.1 | Desert biome generation | 3h | 🔲 |
| 6.2 | Forest biome generation | 3h | 🔲 |
| 6.3 | Urban biome generation | 4h | 🔲 |
| 6.4 | Biome-specific textures | 3h | 🔲 |
| 6.5 | Feature placement (rocks, ruins) | 2h | 🔲 |
| 6.6 | Height variation | 3h | 🔲 |
| 6.7 | Spawn/exit point placement | 1h | 🔲 |

**Milestone:** Playable procedural outdoor environments

---

### Phase 7: Procedural Structures (Priority: MEDIUM)
**Goal:** Indoor combat environments

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 7.1 | BSP room generation | 4h | 🔲 |
| 7.2 | Corridor connection | 2h | 🔲 |
| 7.3 | Hangar layout template | 2h | 🔲 |
| 7.4 | Factory layout template | 2h | 🔲 |
| 7.5 | Cover object placement | 2h | 🔲 |
| 7.6 | Objective placement | 1h | 🔲 |
| 7.7 | Enemy spawn points | 1h | 🔲 |

**Milestone:** Playable procedural indoor environments

---

### Phase 8: Mission System (Priority: MEDIUM)
**Goal:** Structured gameplay loop

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 8.1 | Mission briefing screen | 3h | 🔲 |
| 8.2 | Objective tracking | 2h | 🔲 |
| 8.3 | Mission complete/fail detection | 2h | 🔲 |
| 8.4 | Extraction objective | 2h | 🔲 |
| 8.5 | Destroy target objective | 2h | 🔲 |
| 8.6 | Defense objective | 3h | 🔲 |
| 8.7 | Mission rewards | 2h | 🔲 |
| 8.8 | Mission selection menu | 3h | 🔲 |

**Milestone:** Complete mission loop from briefing to reward

---

### Phase 9: Mech Customization (Priority: LOW-MEDIUM)
**Goal:** Make the mech your own

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 9.1 | Mech lab screen | 4h | 🔲 |
| 9.2 | Weapon swapping | 3h | 🔲 |
| 9.3 | Tonnage/slot validation | 2h | 🔲 |
| 9.4 | Armor allocation | 2h | 🔲 |
| 9.5 | Equipment installation | 2h | 🔲 |
| 9.6 | Loadout saving/loading | 2h | 🔲 |
| 9.7 | Paint scheme selection | 3h | 🔲 |

**Milestone:** Full mech customization between missions

---

### Phase 10: Campaign & Progression (Priority: LOW)
**Goal:** Long-term engagement

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| 10.1 | Persistent save system | 4h | 🔲 |
| 10.2 | Credit/currency system | 2h | 🔲 |
| 10.3 | Salvage system | 3h | 🔲 |
| 10.4 | Reputation/faction system | 4h | 🔲 |
| 10.5 | Campaign map | 4h | 🔲 |
| 10.6 | Random contract generation | 3h | 🔲 |
| 10.7 | Difficulty progression | 2h | 🔲 |
| 10.8 | Unlockable mechs | 2h | 🔲 |

**Milestone:** Full roguelike campaign mode

---

## 🚀 Quick Wins (Do Anytime)

These are easy wins that improve the feel immediately:

- [ ] Footstep sounds synced to movement
- [ ] Cockpit shake on footsteps
- [ ] Weapon fire sounds
- [ ] Impact sounds
- [ ] Low health warning beep
- [ ] Overheat warning siren
- [ ] Reactor hum ambient
- [ ] Startup sequence sound

---

## 🏗️ Technical Debt & Improvements

| Task | Priority | Description |
|------|----------|-------------|
| TypeScript migration | Low | Add type safety |
| Bundle/minify | Low | Production build |
| Mobile touch controls | Low | Expand platform support |
| Gamepad support | Medium | Controller input |
| Save state compression | Low | Smaller saves |
| WebGL 1 fallback | Low | Older browser support |

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| FPS (600 rays) | 60+ | 100+ ✅ |
| FPS (400 rays) | 100+ | 120+ ✅ |
| Memory usage | <100MB | ~30MB ✅ |
| Load time | <2s | <1s ✅ |
| Draw calls/frame | <50 | 3 ✅ |

---

## 🎮 Playtest Milestones

### Alpha 0.1 (Current)
- Engine foundation
- Basic movement
- Lighting/sprites working

### Alpha 0.2 (Target: Phase 1-2)
- Player can shoot
- Basic HUD
- Destructible objects

### Alpha 0.3 (Target: Phase 3-4)
- All weapons working
- AI enemies fight back

### Alpha 0.4 (Target: Phase 5-6)
- Full damage model
- Procedural outdoor maps

### Beta 0.5 (Target: Phase 7-8)
- Indoor structures
- Mission system

### Beta 0.6 (Target: Phase 9-10)
- Mech customization
- Campaign mode

### Release 1.0
- Full game loop
- Multiple biomes
- 12+ mech chassis
- 10+ mission types

---

## 📁 Folder Structure

```
GIGAMECH/
├── index.html          # Main entry point
├── ROADMAP.md          # This file
├── core/
│   ├── mech.js         # Mech state & physics
│   ├── weapons.js      # Weapon definitions
│   └── ai.js           # Enemy AI
├── combat/
│   ├── projectiles.js  # Projectile physics
│   ├── damage.js       # Damage calculation
│   └── effects.js      # Visual effects
├── procedural/
│   ├── terrain.js      # Outdoor generation
│   └── structures.js   # Indoor generation
├── ui/
│   └── hud.js          # Cockpit HUD
├── data/
│   ├── mechs.js        # Mech chassis database
│   └── missions.js     # Mission templates
└── assets/
    └── (generated)     # Procedural textures cached
```

---

## 👥 Contributing

1. Pick a task from any phase
2. Create a feature branch
3. Implement & test
4. Submit PR

**Coding Standards:**
- ES6+ JavaScript
- JSDoc comments on public APIs
- Keep functions under 50 lines
- No external runtime dependencies

---

*Last Updated: February 2026*
*GigaMech is inspired by FASA's BattleTech. This is a fan project.*

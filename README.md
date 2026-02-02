# DUUM - 2.5D Game Engine & GIGAMECH

> A lightweight 2.5D raycasting engine inspired by classic Doom, and GIGAMECH - a mech combat game built on it.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-alpha-orange.svg)
![No Dependencies](https://img.shields.io/badge/dependencies-none-blue.svg)

## 🎮 Play Now

- **[Sector Engine Demo](https://cryptobros-oai.github.io/DUUM/sector-engine-sprites.html)** - Full engine with sprites, lighting, audio
- **[GIGAMECH](https://cryptobros-oai.github.io/DUUM/GIGAMECH/)** - Mech combat game (in development)

## 🚀 Features

### SectorEngine (2.5D Renderer)
- **Pure JavaScript** - No dependencies, runs in any browser
- **WebGL2 Raycasting** - 600+ rays at 100+ FPS
- **Per-pixel sprite occlusion** - Sprites correctly clip behind walls
- **Dynamic lighting** - Multiple lights with flickering/pulsing
- **Procedural textures** - All textures generated at runtime
- **Fog of war** - True line-of-sight visibility system
- **Spatial audio** - Positional sound effects

### GIGAMECH (Mech Combat Game)
- **BattleTech-inspired** - Heat management, component damage, torso twist
- **18 weapon types** - Lasers, autocannons, PPCs, missiles
- **12 mech chassis** - From 20-ton Locust to 100-ton Atlas
- **Procedural worlds** - Infinite outdoor terrains and indoor structures
- **Full cockpit HUD** - Damage paperdoll, radar, heat gauge

## 📁 Project Structure

```
DUUM/
├── sector-engine/              # Core engine modules
├── sector-engine-sprites.html  # Standalone demo (working!)
├── sector-engine-lighting-audio.html
└── GIGAMECH/                   # Mech combat game
    ├── core/                   # Mech, weapons, AI
    ├── combat/                 # Projectiles, damage, effects
    ├── procedural/             # World generation
    ├── ui/                     # Cockpit HUD
    └── data/                   # Mech & mission definitions
```

## 🎯 Quick Start

```bash
# Clone the repo
git clone https://github.com/CryptoBros-oai/DUUM.git

# No build step! Just open in browser:
# - sector-engine-sprites.html (engine demo)
# - GIGAMECH/index.html (game)
```

Or run a local server:
```bash
npx serve .
# Then visit http://localhost:3000
```

## 🎮 Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Mouse | Look |
| Shift | Run |
| F | Flashlight |
| Click | Lock pointer |
| Esc | Release pointer |

## 🛠️ Development

See [GIGAMECH/ROADMAP.md](GIGAMECH/ROADMAP.md) for the full development plan.

### Current Status: Alpha
- ✅ Engine core complete
- ✅ Sprite occlusion working
- ✅ Lighting system
- 🚧 Mech combat integration
- 🚧 Weapon firing
- 📋 AI enemies
- 📋 Procedural missions

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## 📜 License

MIT License - See [LICENSE](LICENSE)

Free to use for any purpose. Attribution appreciated but not required.

---

*Built with ☕ and Claude Code*

*GIGAMECH is inspired by FASA's BattleTech/MechWarrior. This is a fan project.*

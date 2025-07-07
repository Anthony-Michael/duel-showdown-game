# 🤠 Wild West Duel Game

A fast-paced two-player dueling game with spectacular visual effects, comprehensive audio handling, and advanced pattern-based duel mechanics.

**Author:** Anthony Sabatino

## 🎯 Game Features

### Core Mechanics
- **Pattern-Based Duels**: Players must memorize and input 3-key sequences to fire
- **Real-Time Competition**: First to complete pattern correctly after "FIRE!" wins
- **Early Input Penalties**: Shooting before "FIRE!" results in disqualification
- **Dynamic Patterns**: Unique random sequences generated each round

### Visual Effects
- **Spectacular Muzzle Flashes**: Multi-layered with rays, glow, and sparkles
- **Bullet Trails**: Smooth animated projectiles with glowing effects
- **Real-Time Feedback**: Keys highlight as correct (green ✓) or incorrect (red ✗)
- **Professional Animations**: Pulse, bounce, shake, and glow effects
- **Western Theme**: Authentic styling with Google Fonts and rich colors

### Audio System
- **Gunshot Sound Effects**: High-quality audio with comprehensive error handling
- **Browser Compatibility**: Robust playback with autoplay policy handling
- **Audio Diagnostics**: Built-in debugging and retry functionality

## 🎮 How to Play

1. **Start**: Press any pattern key (A, S, D, W, Q, E, Z, X, C)
2. **Countdown**: Watch the 3... 2... countdown
3. **Memorize**: When countdown hits "1", memorize your 3-key pattern
4. **Wait**: Patterns display for 2 seconds - resist early input!
5. **Fire**: When "FIRE!" appears, race to input your exact sequence
6. **Win**: First to complete pattern correctly wins the duel!

## 🛠️ Technical Architecture

### Modular Design
- **PatternManager**: Handles all pattern generation, validation, and visual feedback
- **DuelGame**: Main game loop, canvas rendering, audio, and state management
- **Visual Effects**: Dedicated classes for muzzle flashes and bullet trails

### Key Features
- **Queue-Based Input**: Precise timing control with game loop processing
- **Professional Code Organization**: Clean separation of concerns
- **Comprehensive Error Handling**: Robust edge case management
- **Debug Tools**: Built-in debugging functions and extensive logging

### Files Structure
```
duel-showdown-game/
├── index.html          # Game HTML structure
├── style.css           # Styling and animations
├── game.js             # Main game logic and PatternManager
├── assets/
│   └── gunshot.mp3     # Audio effects
└── README.md           # This file
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anthony-Michael/duel-showdown-game.git
   cd duel-showdown-game
   ```

2. **Open the game**
   ```bash
   open index.html
   ```
   Or serve with a local web server for best audio compatibility.

3. **Start dueling!**
   Press any pattern key to begin your Wild West showdown!

## 🔧 Debug Tools

Open browser console and use these debug functions:
- `debugInputQueue()` - Show current input queue status
- `debugPatternManager()` - Display pattern states and player progress
- `demoInputQueue()` - Interactive demo guide
- `window.duelGame` - Access main game instance

## 🎨 Customization

### Pattern Difficulty
Modify pattern length and available keys in `game.js`:
```javascript
this.PATTERN_CONFIG = {
    length: 3,  // Change pattern length
    availableKeys: ['A', 'S', 'D', 'W', 'Q', 'E', 'Z', 'X', 'C'],
    displayTime: 2000,  // Memorization time (ms)
    penaltyTime: 1000   // Penalty duration (ms)
};
```

### Visual Effects
Customize animations and styling in `style.css`:
- Pattern key animations
- Color schemes and gradients
- Animation timing and effects

## 🏆 Game Statistics

The game tracks completion timing with millisecond precision:
- **Draw threshold**: 50ms difference
- **Pattern validation**: Real-time sequence checking
- **Visual feedback**: Instant key state updates
- **Professional polish**: Enterprise-grade user experience

## 📝 License

This project is open source. Feel free to modify and enhance!

## 🤝 Contributing

Contributions welcome! Some ideas for enhancements:
- Tournament mode with multiple rounds
- Difficulty levels (longer patterns, faster timing)
- Network multiplayer support
- Sound effect customization
- Pattern themes and variations

---

**Built with passion for Wild West dueling action!** 🤠🎯

*Author: Anthony Sabatino*
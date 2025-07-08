/**
 * Wild West Duel Game
 * A fast-paced two-player dueling game with spectacular visual effects,
 * comprehensive audio handling, and advanced pattern-based duel mechanics.
 * 
 * Author: Anthony Sabatino
 * Features: Pattern-input duels, muzzle flashes, bullet trails, sound effects, 
 *           real-time visual feedback, modular architecture, and animations
 */

// ================================
// 🎯 PATTERN MANAGER MODULE
// ================================

/**
 * PatternManager - Handles all pattern generation, tracking, and validation
 */
class PatternManager {
    constructor(config = {}) {
        this.config = {
            defaultLength: config.defaultLength || 3,
            defaultAvailableKeys: config.defaultAvailableKeys || ['A', 'S', 'D', 'W', 'Q', 'E', 'Z', 'X', 'C'],
            displayTime: config.displayTime || 2000,
            defaultPenaltyTime: config.defaultPenaltyTime || 1000,
            wrongPatternDelay: config.wrongPatternDelay || 1500 // New: delay for wrong patterns
        };
        
        // Weapon-specific configurations
        this.weaponConfigs = {
            gun_revolver: {
                length: 3,
                availableKeys: ['A', 'S', 'D', 'W', 'Q', 'E', 'Z', 'X', 'C'],
                inputWindow: 5000, // 5 seconds to input pattern
                name: 'Revolver'
            },
            gun_laser: {
                length: 4,
                availableKeys: ['↑', '↓', '←', '→', 'A', 'S', 'D', 'W'], // Arrows + some letters
                inputWindow: 6000, // 6 seconds for longer pattern
                name: 'Laser Gun'
            },
            gun_shotgun: {
                length: 2,
                availableKeys: ['A', 'S', 'D', 'W', 'Q', 'E'],
                inputWindow: 3000, // 3 seconds - shorter window
                name: 'Shotgun'
            }
        };
        
        // Player pattern states with weapon info
        this.players = {
            player1: this.createPlayerState(),
            player2: this.createPlayerState()
        };
        
        // Input queue for game loop processing
        this.inputQueue = [];
        
        // UI elements (will be set by game)
        this.uiElements = {};
        
        // Timing state for input windows and penalties
        this.timing = {
            patternStartTime: 0,
            player1: { penaltyEndTime: 0, inputWindow: 0 },
            player2: { penaltyEndTime: 0, inputWindow: 0 }
        };
    }

    /**
     * Create initial player pattern state
     */
    createPlayerState() {
        return {
            pattern: [],
            progress: 0,
            isDisqualified: false,
            lastInputTime: 0,
            isComplete: false,
            weaponType: null,
            weaponConfig: null,
            hasPenalty: false,
            lastWrongInput: 0
        };
    }

    /**
     * Set UI elements for pattern display
     */
    setUIElements(elements) {
        this.uiElements = elements;
    }

    /**
     * Generate unique patterns for both players based on their equipped weapons
     */
    generatePatterns(player1Equipment, player2Equipment) {
        // Set weapon types and configs for each player
        this.players.player1.weaponType = player1Equipment.equippedGun || 'gun_revolver';
        this.players.player2.weaponType = player2Equipment.equippedGun || 'gun_revolver';
        
        this.players.player1.weaponConfig = this.weaponConfigs[this.players.player1.weaponType];
        this.players.player2.weaponConfig = this.weaponConfigs[this.players.player2.weaponType];
        
        // Generate weapon-specific patterns
        this.players.player1.pattern = this.generateWeaponSpecificPattern(this.players.player1.weaponType);
        this.players.player2.pattern = this.generateWeaponSpecificPattern(this.players.player2.weaponType);
        
        // Ensure patterns are different (if using same weapon type)
        if (this.players.player1.weaponType === this.players.player2.weaponType) {
            let attempts = 0;
            while (this.arraysEqual(this.players.player1.pattern, this.players.player2.pattern) && attempts < 10) {
                this.players.player2.pattern = this.generateWeaponSpecificPattern(this.players.player2.weaponType);
                attempts++;
            }
        }
        
        // Set timing windows
        this.timing.player1.inputWindow = this.players.player1.weaponConfig.inputWindow;
        this.timing.player2.inputWindow = this.players.player2.weaponConfig.inputWindow;
        
        console.log(`🎯 Generated weapon-specific patterns:`);
        console.log(`Player 1 (${this.players.player1.weaponConfig.name}):`, this.players.player1.pattern);
        console.log(`Player 2 (${this.players.player2.weaponConfig.name}):`, this.players.player2.pattern);
        
        return {
            player1: [...this.players.player1.pattern],
            player2: [...this.players.player2.pattern]
        };
    }

    /**
     * Generate a weapon-specific pattern
     */
    generateWeaponSpecificPattern(weaponType) {
        const config = this.weaponConfigs[weaponType];
        if (!config) {
            console.warn(`Unknown weapon type: ${weaponType}, using default`);
            return this.generateRandomPattern();
        }
        
        const pattern = [];
        const availableKeys = [...config.availableKeys];
        
        for (let i = 0; i < config.length; i++) {
            const randomIndex = Math.floor(Math.random() * availableKeys.length);
            const selectedKey = availableKeys[randomIndex];
            pattern.push(selectedKey);
            // Remove selected key to avoid duplicates in pattern
            availableKeys.splice(randomIndex, 1);
        }
        
        return pattern;
    }

    /**
     * Generate a random pattern using default configuration (fallback)
     */
    generateRandomPattern() {
        const pattern = [];
        const availableKeys = [...this.config.defaultAvailableKeys];
        
        for (let i = 0; i < this.config.defaultLength; i++) {
            const randomIndex = Math.floor(Math.random() * availableKeys.length);
            const selectedKey = availableKeys[randomIndex];
            pattern.push(selectedKey);
            // Remove selected key to avoid duplicates in pattern
            availableKeys.splice(randomIndex, 1);
        }
        
        return pattern;
    }

    /**
     * Check if two arrays are equal
     */
    arraysEqual(a, b) {
        return Array.isArray(a) && Array.isArray(b) && 
               a.length === b.length && 
               a.every((val, index) => val === b[index]);
    }

    /**
     * Reset all player patterns and progress
     */
    reset() {
        this.players.player1 = this.createPlayerState();
        this.players.player2 = this.createPlayerState();
        this.inputQueue = [];
        
        // Reset timing state
        this.timing = {
            patternStartTime: 0,
            player1: { penaltyEndTime: 0, inputWindow: 0 },
            player2: { penaltyEndTime: 0, inputWindow: 0 }
        };
        
        this.resetAllVisualStates();
    }

    /**
     * Reset all visual states and feedback messages
     */
    resetAllVisualStates() {
        // Clear all pattern key elements
        const patternElements = [
            this.uiElements.player1PatternElement,
            this.uiElements.player2PatternElement
        ];
        
        patternElements.forEach(element => {
            if (element) {
                element.innerHTML = '';
            }
        });
        
        // Reset progress displays
        const progressElements = [
            this.uiElements.player1ProgressElement,
            this.uiElements.player2ProgressElement
        ];
        
        progressElements.forEach(element => {
            if (element) {
                element.textContent = '';
                element.style.color = '#F5DEB3';
            }
        });
        
        // Reset feedback messages
        const feedbackElements = [
            this.uiElements.player1FeedbackElement,
            this.uiElements.player2FeedbackElement
        ];
        
        feedbackElements.forEach(element => {
            if (element) {
                element.textContent = '';
                element.className = 'pattern-feedback';
            }
        });
    }

    /**
     * Display patterns in UI with weapon info
     */
    displayPatterns() {
        this.renderPatternDisplay(this.players.player1.pattern, 'player1');
        this.renderPatternDisplay(this.players.player2.pattern, 'player2');
        
        if (this.uiElements.patternDisplay) {
            this.uiElements.patternDisplay.classList.add('show');
        }
        
        // Initialize progress displays and visual states
        this.updateProgressDisplay('player1');
        this.updateProgressDisplay('player2');
        
        // Initialize feedback messages with weapon info
        this.initializeFeedbackMessages();
    }

    /**
     * Initialize feedback messages for both players with weapon info
     */
    initializeFeedbackMessages() {
        const player1Config = this.players.player1.weaponConfig;
        const player2Config = this.players.player2.weaponConfig;
        
        const player1Feedback = this.uiElements.player1FeedbackElement;
        const player2Feedback = this.uiElements.player2FeedbackElement;
        
        if (player1Feedback && player1Config) {
            player1Feedback.textContent = `${player1Config.name}: Memorize your pattern!`;
            player1Feedback.className = 'pattern-feedback';
        }
        
        if (player2Feedback && player2Config) {
            player2Feedback.textContent = `${player2Config.name}: Memorize your pattern!`;
            player2Feedback.className = 'pattern-feedback';
        }
    }

    /**
     * Hide patterns from UI
     */
    hidePatterns() {
        if (this.uiElements.patternDisplay) {
            this.uiElements.patternDisplay.classList.remove('show');
        }
    }

    /**
     * Render pattern keys for a specific player
     */
    renderPatternDisplay(pattern, playerId) {
        const patternElement = this.uiElements[`${playerId}PatternElement`];
        if (!patternElement) return;
        
        patternElement.innerHTML = '';
        
        pattern.forEach((key, index) => {
            const keyElement = document.createElement('div');
            keyElement.className = 'pattern-key';
            
            // Add arrow class for arrow keys
            if (['↑', '↓', '←', '→'].includes(key)) {
                keyElement.classList.add('arrow');
            }
            
            keyElement.textContent = key;
            keyElement.id = `${playerId}_key_${index}`;
            patternElement.appendChild(keyElement);
        });
    }

    /**
     * Update progress display for a specific player
     */
    updateProgressDisplay(playerId) {
        const player = this.players[playerId];
        const progressElement = this.uiElements[`${playerId}ProgressElement`];
        if (!progressElement) return;
        
        const totalKeys = player.pattern ? player.pattern.length : this.config.defaultLength;
        progressElement.textContent = `Progress: ${player.progress}/${totalKeys}`;
        progressElement.style.color = '#F5DEB3';
        
        // Update key visual states
        this.updateKeyVisualStates(playerId);
    }

    /**
     * Update visual states of pattern keys
     */
    updateKeyVisualStates(playerId) {
        const player = this.players[playerId];
        
        for (let i = 0; i < player.pattern.length; i++) {
            const keyElement = document.getElementById(`${playerId}_key_${i}`);
            if (!keyElement) continue;
            
            // Clear all state classes
            keyElement.classList.remove('completed', 'error', 'current', 'active');
            
            if (i < player.progress) {
                // Completed keys
                keyElement.classList.add('completed');
                this.triggerKeyAnimation(keyElement, 'active');
            } else if (i === player.progress && !player.isDisqualified && !player.isComplete) {
                // Current target key
                keyElement.classList.add('current');
            }
        }
    }

    /**
     * Trigger key animation effect
     */
    triggerKeyAnimation(keyElement, animationClass) {
        keyElement.classList.add(animationClass);
        setTimeout(() => {
            keyElement.classList.remove(animationClass);
        }, 300);
    }

    /**
     * Queue input for pattern validation (non-immediate processing)
     */
    queueInput(key, timestamp) {
        const upperKey = key.toUpperCase();
        
        if (!this.isPatternKey(upperKey)) {
            return null;
        }
        
        // Add to input queue for processing in game loop
        if (!this.inputQueue) {
            this.inputQueue = [];
        }
        
        this.inputQueue.push({
            key: upperKey,
            timestamp: timestamp
        });
        
        console.log(`🎹 Queued input: ${upperKey} at ${timestamp} (Queue length: ${this.inputQueue.length})`);
        return { type: 'queued', key: upperKey, queueLength: this.inputQueue.length };
    }

    /**
     * Process all queued inputs (called from game loop)
     */
    processQueuedInputs(gameState, isReadyState) {
        if (!this.inputQueue || this.inputQueue.length === 0) {
            return [];
        }
        
        const results = [];
        
        // Process each queued input
        const initialQueueLength = this.inputQueue.length;
        while (this.inputQueue.length > 0) {
            const input = this.inputQueue.shift();
            console.log(`🔄 Processing queued input: ${input.key} (${initialQueueLength - this.inputQueue.length}/${initialQueueLength})`);
            
            const inputResults = this.handleInput(input.key, gameState, isReadyState, input.timestamp);
            
            if (inputResults) {
                if (Array.isArray(inputResults)) {
                    results.push(...inputResults);
                } else {
                    results.push(inputResults);
                }
            }
        }
        
        return results;
    }

    /**
     * Handle input for patterns with weapon-specific validation
     */
    handleInput(key, gameState, isReadyState, timestamp = Date.now()) {
        const upperKey = key.toUpperCase();
        
        if (!isReadyState) {
            return this.handleEarlyInput(upperKey);
        }
        
        // Set pattern start time if not set
        if (this.timing.patternStartTime === 0) {
            this.timing.patternStartTime = timestamp;
        }
        
        // Check which player this key belongs to and process
        const results = [];
        
        // Check Player 1
        if (this.canPlayerInput('player1', upperKey, timestamp)) {
            const result = this.processWeaponInput('player1', upperKey, timestamp);
            if (result) results.push(result);
        }
        
        // Check Player 2
        if (this.canPlayerInput('player2', upperKey, timestamp)) {
            const result = this.processWeaponInput('player2', upperKey, timestamp);
            if (result) results.push(result);
        }
        
        return results;
    }

    /**
     * Check if a player can input at this time (considering penalties and windows)
     */
    canPlayerInput(playerId, key, timestamp) {
        const player = this.players[playerId];
        const timing = this.timing[playerId];
        
        // Check if player is disqualified or completed
        if (player.isDisqualified || player.isComplete) {
            return false;
        }
        
        // Check if player is in penalty period
        if (timestamp < timing.penaltyEndTime) {
            return false;
        }
        
        // Check if input window has expired
        const timeSinceStart = timestamp - this.timing.patternStartTime;
        if (timeSinceStart > timing.inputWindow) {
            return false;
        }
        
        // Check if key is valid for this weapon
        if (!player.weaponConfig.availableKeys.includes(key)) {
            return false;
        }
        
        return true;
    }

    /**
     * Process weapon-specific input with wrong pattern penalties
     */
    processWeaponInput(playerId, key, timestamp) {
        const player = this.players[playerId];
        const expectedKey = player.pattern[player.progress];
        
        if (key === expectedKey) {
            // Correct input
            return this.processCorrectInput(playerId, key, timestamp);
        } else {
            // Wrong input - apply penalty
            return this.processWrongInput(playerId, key, timestamp);
        }
    }

    /**
     * Process correct input
     */
    processCorrectInput(playerId, key, timestamp) {
        const player = this.players[playerId];
        
        player.progress++;
        player.lastInputTime = timestamp;
        
        console.log(`✅ ${playerId} correct key: ${key} (${player.progress}/${player.pattern.length})`);
        
        // Update visual feedback
        this.updateProgressDisplay(playerId);
        
        // Check if pattern is complete
        if (player.progress >= player.pattern.length) {
            player.isComplete = true;
            this.showCompletionFeedback(playerId);
            
            return {
                type: 'complete',
                playerId: playerId,
                timestamp: timestamp
            };
        }
        
        return {
            type: 'progress',
            playerId: playerId,
            progress: player.progress
        };
    }

    /**
     * Process wrong input with penalty delay
     */
    processWrongInput(playerId, key, timestamp) {
        const player = this.players[playerId];
        const timing = this.timing[playerId];
        
        // Apply penalty delay
        timing.penaltyEndTime = timestamp + this.config.wrongPatternDelay;
        player.hasPenalty = true;
        player.lastWrongInput = timestamp;
        
        console.log(`❌ ${playerId} wrong key: ${key} (expected: ${player.pattern[player.progress]}) - ${this.config.wrongPatternDelay}ms penalty`);
        
        // Show wrong input feedback
        this.showWrongInputFeedback(playerId, key);
        
        return {
            type: 'wrong_input',
            playerId: playerId,
            expectedKey: player.pattern[player.progress],
            actualKey: key,
            penaltyDuration: this.config.wrongPatternDelay
        };
    }

    /**
     * Show feedback for wrong input
     */
    showWrongInputFeedback(playerId, key) {
        const progressElement = this.uiElements[`${playerId}ProgressElement`];
        if (progressElement) {
            progressElement.textContent = `❌ Wrong! Penalty: 1.5s`;
            progressElement.style.color = '#FF6347';
        }
        
        const feedbackElement = this.uiElements[`${playerId}FeedbackElement`];
        if (feedbackElement) {
            feedbackElement.textContent = 'Wrong Pattern! Wait...';
            feedbackElement.className = 'pattern-feedback error';
        }
        
        // Mark current key as error if applicable
        if (this.players[playerId].progress < this.players[playerId].pattern.length) {
            const keyElement = document.getElementById(`${playerId}_key_${this.players[playerId].progress}`);
            if (keyElement) {
                keyElement.classList.add('error');
                setTimeout(() => {
                    keyElement.classList.remove('error');
                }, this.config.wrongPatternDelay);
            }
        }
        
        // Clear penalty feedback after delay
        setTimeout(() => {
            if (feedbackElement && !this.players[playerId].isComplete && !this.players[playerId].isDisqualified) {
                feedbackElement.textContent = 'Try again!';
                feedbackElement.className = 'pattern-feedback';
            }
            if (progressElement && !this.players[playerId].isComplete && !this.players[playerId].isDisqualified) {
                this.updateProgressDisplay(playerId);
            }
        }, this.config.wrongPatternDelay);
    }

    /**
     * Check if input is valid for a player (updated for weapon-specific keys)
     */
    isValidInput(playerId, key) {
        const player = this.players[playerId];
        return !player.isDisqualified && 
               !player.isComplete && 
               player.progress < player.pattern.length && 
               player.weaponConfig && 
               player.weaponConfig.availableKeys.includes(key) &&
               player.pattern[player.progress] === key;
    }

    /**
     * Handle early input (before FIRE!) with weapon awareness
     */
    handleEarlyInput(key) {
        if (!this.isPatternKey(key)) {
            return null;
        }
        
        console.warn(`⚠️ Early input detected: ${key}`);
        
        // Determine which player pressed early based on weapon configurations
        let playerId = null;
        
        // Check if key belongs to either player's weapon pattern
        if (this.players.player1.weaponConfig && this.players.player1.weaponConfig.availableKeys.includes(key)) {
            if (this.players.player1.pattern.includes(key)) {
                playerId = 'player1';
            }
        }
        
        if (this.players.player2.weaponConfig && this.players.player2.weaponConfig.availableKeys.includes(key)) {
            if (this.players.player2.pattern.includes(key)) {
                playerId = 'player2';
            }
        }
        
        // Fallback to checking default pattern keys
        if (!playerId) {
            if (this.players.player1.pattern.includes(key)) {
                playerId = 'player1';
            } else if (this.players.player2.pattern.includes(key)) {
                playerId = 'player2';
            }
        }
        
        if (playerId && !this.players[playerId].isDisqualified) {
            this.disqualifyPlayer(playerId, 'TOO EARLY');
            return {
                type: 'disqualified',
                playerId: playerId,
                reason: 'early'
            };
        }
        
        return null;
    }

    /**
     * Disqualify a player with feedback
     */
    disqualifyPlayer(playerId, reason) {
        const player = this.players[playerId];
        player.isDisqualified = true;
        
        // Update progress display
        const progressElement = this.uiElements[`${playerId}ProgressElement`];
        if (progressElement) {
            progressElement.textContent = `⚡ ${reason} - DISQUALIFIED!`;
            progressElement.style.color = '#FF6347';
        }
        
        // Show error feedback
        const feedbackElement = this.uiElements[`${playerId}FeedbackElement`];
        if (feedbackElement) {
            feedbackElement.textContent = reason === 'TOO EARLY' ? 'Too Early!' : 'Wrong Key!';
            feedbackElement.className = 'pattern-feedback error';
        }
        
        // Mark current key as error if applicable
        if (player.progress < player.pattern.length) {
            const keyElement = document.getElementById(`${playerId}_key_${player.progress}`);
            if (keyElement) {
                keyElement.classList.add('error');
            }
        }
        
        // Mark all remaining keys as error
        this.markRemainingKeysAsError(playerId);
        
        console.warn(`⚡ ${playerId} disqualified: ${reason}`);
    }

    /**
     * Mark remaining keys as error state
     */
    markRemainingKeysAsError(playerId) {
        const player = this.players[playerId];
        
        for (let i = player.progress; i < player.pattern.length; i++) {
            const keyElement = document.getElementById(`${playerId}_key_${i}`);
            if (keyElement) {
                setTimeout(() => {
                    keyElement.classList.add('error');
                }, i * 100); // Stagger the error animation
            }
        }
    }

    /**
     * Show completion feedback for a player
     */
    showCompletionFeedback(playerId) {
        const progressElement = this.uiElements[`${playerId}ProgressElement`];
        if (progressElement) {
            progressElement.textContent = `🎯 PATTERN COMPLETE - FIRED!`;
            progressElement.style.color = '#32CD32';
        }
        
        // Show completion feedback
        const feedbackElement = this.uiElements[`${playerId}FeedbackElement`];
        if (feedbackElement) {
            feedbackElement.textContent = 'FIRED! 🔥';
            feedbackElement.className = 'pattern-feedback complete';
        }
        
        // Trigger completion animation on all keys
        this.triggerCompletionAnimation(playerId);
    }

    /**
     * Trigger completion animation for all pattern keys
     */
    triggerCompletionAnimation(playerId) {
        const player = this.players[playerId];
        
        for (let i = 0; i < player.pattern.length; i++) {
            const keyElement = document.getElementById(`${playerId}_key_${i}`);
            if (keyElement) {
                setTimeout(() => {
                    keyElement.classList.add('active');
                    setTimeout(() => {
                        keyElement.classList.remove('active');
                    }, 300);
                }, i * 100); // Stagger the completion animation
            }
        }
    }

    /**
     * Get game end state based on player completion/disqualification
     */
    getGameEndState() {
        const p1 = this.players.player1;
        const p2 = this.players.player2;
        
        const p1Done = p1.isComplete || p1.isDisqualified;
        const p2Done = p2.isComplete || p2.isDisqualified;
        
        if (!p1Done && !p2Done) {
            return null; // Game continues
        }
        
        // Determine winner
        if (p1.isDisqualified && p2.isDisqualified) {
            return { winner: 'none', reason: 'Both Disqualified!' };
        } else if (p1.isDisqualified) {
            return { winner: 'player2', reason: 'Player 2 Wins! (P1 Disqualified)' };
        } else if (p2.isDisqualified) {
            return { winner: 'player1', reason: 'Player 1 Wins! (P2 Disqualified)' };
        } else if (p1.isComplete && p2.isComplete) {
            // Both completed - check timing
            const timeDiff = Math.abs(p1.lastInputTime - p2.lastInputTime);
            if (timeDiff < 50) {
                return { winner: 'draw', reason: 'Draw!' };
            } else if (p1.lastInputTime < p2.lastInputTime) {
                return { winner: 'player1', reason: 'Player 1 Wins!' };
            } else {
                return { winner: 'player2', reason: 'Player 2 Wins!' };
            }
        } else if (p1.isComplete) {
            return { winner: 'player1', reason: 'Player 1 Wins!' };
        } else if (p2.isComplete) {
            return { winner: 'player2', reason: 'Player 2 Wins!' };
        }
        
        return null;
    }

    /**
     * Check if a key belongs to any weapon's pattern keys
     */
    isPatternKey(key) {
        const upperKey = key.toUpperCase();
        
        // Check default keys first
        if (this.config.defaultAvailableKeys.includes(upperKey)) {
            return true;
        }
        
        // Check weapon-specific keys
        for (const weaponType in this.weaponConfigs) {
            if (this.weaponConfigs[weaponType].availableKeys.includes(upperKey)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get player states (for external access)
     */
    getPlayerStates() {
        return {
            player1: { ...this.players.player1 },
            player2: { ...this.players.player2 }
        };
    }

    /**
     * Get input queue status for debugging
     */
    getInputQueueStatus() {
        return {
            queueLength: this.inputQueue ? this.inputQueue.length : 0,
            queuedInputs: this.inputQueue ? [...this.inputQueue] : [],
            gameState: this.gameState,
            isListening: this.gameState === this.GAME_STATES.READY
        };
    }
}

// ================================
// 🖼️ SPRITE LOADER CLASS
// ================================

/**
 * SpriteLoader - Manages sprite loading and caching with composite layer support
 */
class SpriteLoader {
    constructor() {
        this.sprites = new Map();
        this.loadingPromises = new Map();
        this.loadedCount = 0;
        this.totalCount = 0;
        
        // Default sprite configuration
        this.SPRITE_SIZE = 32;
        this.SPRITE_PATHS = {
            // Base character sprites (for drawImage rendering)
            cowboy_plain: 'assets/sprites/cowboy_plain.png',
            helmeted_shotgun: 'assets/sprites/helmeted_shotgun.png',
            
            // Gun sprites (drawn on top near hand position)
            gun_revolver: 'assets/sprites/gun_revolver.png',
            gun_shotgun: 'assets/sprites/gun_shotgun.png',
            gun_laser: 'assets/sprites/gun_laser.png',
            
            // Additional character sprites
            player_default: 'assets/sprites/player_default.png',
            player_cowboy: 'assets/sprites/player_cowboy.png',
            player_cowboy_plain: 'assets/sprites/player_cowboy_plain.png',
            player_helmeted_shotgun: 'assets/sprites/player_helmeted_shotgun.png',
            
            // Hat accessories
            hat_fedora: 'assets/sprites/hat_fedora.png',
            
            // Legacy sprites (for backward compatibility)
            player_red: 'assets/sprites/player_red.png',
            player_blue: 'assets/sprites/player_blue.png',
            hat: 'assets/sprites/hat.png',
            gun: 'assets/sprites/gun.png',
            overlay: 'assets/sprites/overlay.png'
        };
    }

    /**
     * Create placeholder sprite as base64 data URI
     */
    createPlaceholderSprite(color = '#8B4513', type = 'player') {
        const canvas = document.createElement('canvas');
        canvas.width = this.SPRITE_SIZE;
        canvas.height = this.SPRITE_SIZE;
        const ctx = canvas.getContext('2d');
        
        if (type === 'player') {
            // Create a simple character sprite (baseSprite)
            ctx.fillStyle = color;
            ctx.fillRect(4, 8, 24, 24); // Body
            
            // Head
            ctx.fillStyle = '#FDBCB4';
            ctx.fillRect(8, 4, 16, 12); // Head
            
            // Different styling based on color (indicating different character types)
            if (color === '#556B2F') { // Helmeted shotgun variant
                // Military green armor
                ctx.fillStyle = '#556B2F';
                ctx.fillRect(6, 10, 20, 18); // Armor vest
                // Helmet
                ctx.fillStyle = '#2F4F2F';
                ctx.fillRect(6, 2, 20, 10); // Helmet
                // Visor
                ctx.fillStyle = '#000000';
                ctx.fillRect(8, 6, 16, 4); // Dark visor
            } else if (color === '#654321') { // Cowboy variant
                // Vest
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(8, 12, 16, 16); // Red vest
                // Black hat
                ctx.fillStyle = '#000000';
                ctx.fillRect(6, 2, 20, 4); // Hat brim
                ctx.fillRect(10, 0, 12, 6); // Hat top
            } else {
                // Regular hat
                ctx.fillStyle = '#2F1B14';
                ctx.fillRect(6, 2, 20, 4); // Hat brim
                ctx.fillRect(10, 0, 12, 6); // Hat top
            }
        } else if (type === 'gun') {
            if (color === '#00FFFF') { // Laser gun
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(16, 13, 8, 6); // Silver body
                ctx.fillStyle = '#00FFFF';
                ctx.fillRect(20, 15, 10, 2); // Cyan beam
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(24, 14, 4, 4); // Red tip
            } else if (color === '#8B4513') { // Shotgun
                ctx.fillStyle = '#654321';
                ctx.fillRect(18, 13, 12, 6); // Longer barrel
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(14, 15, 8, 4); // Wooden stock
                ctx.fillStyle = '#444444';
                ctx.fillRect(22, 16, 2, 2); // Trigger guard
            } else { // Revolver or regular gun
                ctx.fillStyle = '#444444';
                ctx.fillRect(20, 14, 10, 4); // Barrel
                ctx.fillRect(16, 12, 8, 8); // Cylinder
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(12, 16, 6, 4); // Wooden grip
            }
        } else if (type === 'hat') {
            if (color === '#2F2F2F') { // Fedora
                ctx.fillStyle = '#2F2F2F';
                ctx.fillRect(6, 6, 20, 3); // Fedora brim
                ctx.fillRect(10, 3, 12, 6); // Fedora crown
                // Band
                ctx.fillStyle = '#000000';
                ctx.fillRect(10, 8, 12, 2); // Hat band
            } else { // Regular cowboy hat
                ctx.fillStyle = color;
                ctx.fillRect(6, 2, 20, 4); // Hat brim
                ctx.fillRect(10, 0, 12, 6); // Hat top
            }
        }
        
        return canvas.toDataURL('image/png');
    }

    /**
     * Load a single sprite
     */
    async loadSprite(name, path) {
        if (this.sprites.has(name)) {
            return this.sprites.get(name);
        }

        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.sprites.set(name, img);
                this.loadedCount++;
                console.log(`🖼️ Loaded sprite: ${name} (${this.loadedCount}/${this.totalCount})`);
                resolve(img);
            };
            
            img.onerror = (error) => {
                console.error(`❌ Failed to load sprite: ${name} from ${path}`, error);
                console.warn(`⚠️ Using placeholder for: ${name}`);
                
                // Create placeholder based on sprite name
                let placeholderType = 'player';
                let color = '#8B4513';
                
                if (name.includes('gun')) {
                    placeholderType = 'gun';
                    if (name.includes('laser')) {
                        color = '#00FFFF'; // Cyan for laser
                    } else if (name.includes('shotgun')) {
                        color = '#8B4513'; // Brown for shotgun
                    } else {
                        color = '#444444'; // Dark gray for revolver/gun
                    }
                } else if (name.includes('hat')) {
                    placeholderType = 'hat';
                    color = '#2F2F2F'; // Dark gray for hats
                } else {
                    // Character sprites (baseSprite)
                    placeholderType = 'player';
                    if (name.includes('helmeted') || name.includes('shotgun')) {
                        color = '#556B2F'; // Dark olive for helmeted
                    } else if (name.includes('cowboy') || name.includes('plain')) {
                        color = '#654321'; // Darker brown for cowboy
                    } else if (name.includes('red')) {
                        color = '#CD5C5C';
                    } else if (name.includes('blue')) {
                        color = '#4169E1';
                    } else {
                        color = '#8B4513'; // Default brown
                    }
                }
                
                const placeholderImg = new Image();
                placeholderImg.onload = () => {
                    this.sprites.set(name, placeholderImg);
                    this.loadedCount++;
                    console.log(`🖼️ Created placeholder for: ${name} (${this.loadedCount}/${this.totalCount})`);
                    resolve(placeholderImg);
                };
                placeholderImg.onerror = () => {
                    console.error(`❌ Failed to create placeholder for: ${name}`);
                    reject(new Error(`Failed to create placeholder sprite for ${name}`));
                };
                placeholderImg.src = this.createPlaceholderSprite(color, placeholderType);
            };
            
            img.src = path;
        });

        this.loadingPromises.set(name, loadPromise);
        return loadPromise;
    }

    /**
     * Load all sprites
     */
    async loadAllSprites() {
        const spriteNames = Object.keys(this.SPRITE_PATHS);
        this.totalCount = spriteNames.length;
        this.loadedCount = 0;

        console.log(`🖼️ Loading ${this.totalCount} sprites...`);

        const loadPromises = spriteNames.map(name => 
            this.loadSprite(name, this.SPRITE_PATHS[name])
        );

        try {
            await Promise.all(loadPromises);
            console.log('🎨 All sprites loaded successfully!');
        } catch (error) {
            console.warn('⚠️ Some sprites failed to load, but placeholders were created');
        }

        return this.sprites;
    }

    /**
     * Get a loaded sprite
     */
    getSprite(name) {
        return this.sprites.get(name);
    }

    /**
     * Check if sprite is loaded
     */
    isLoaded(name) {
        return this.sprites.has(name);
    }

    /**
     * Get loading progress
     */
    getLoadingProgress() {
        return {
            loaded: this.loadedCount,
            total: this.totalCount,
            percentage: this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0
        };
    }
}

// ================================
// 🎨 SPRITE RENDERER CLASS
// ================================

/**
 * SpriteRenderer - Handles composite sprite rendering with layers
 */
class SpriteRenderer {
    constructor(spriteLoader) {
        this.spriteLoader = spriteLoader;
        this.SPRITE_SIZE = 32;
    }

    /**
     * Draw a composite sprite with baseSprite + gunSprite using drawImage()
     */
    drawCompositeSprite(ctx, x, y, baseName, layers = [], scale = 1, flipX = false) {
        ctx.save();
        
        // Apply transformations
        if (flipX) {
            ctx.scale(-1, 1);
            x = -x - (this.SPRITE_SIZE * scale);
        }
        
        // Draw base sprite (character body) using drawImage()
        const baseSuccess = this.drawSingleSprite(ctx, x, y, baseName, scale);
        if (!baseSuccess) {
            console.warn(`⚠️ Failed to render baseSprite: ${baseName}, continuing gracefully`);
        }
        
        // Draw layer sprites on top (hat, gun, etc.) using drawImage()
        layers.forEach((layerName, index) => {
            if (layerName && this.spriteLoader.isLoaded(layerName)) {
                const layerSuccess = this.drawSingleSprite(ctx, x, y, layerName, scale);
                if (!layerSuccess) {
                    console.warn(`⚠️ Failed to render layer ${index} (${layerName}), continuing gracefully`);
                }
            } else if (layerName) {
                console.warn(`⚠️ Layer sprite not loaded: ${layerName}, skipping layer`);
            }
        });
        
        ctx.restore();
    }

    /**
     * Draw a single sprite using drawImage()
     */
    drawSingleSprite(ctx, x, y, spriteName, scale = 1) {
        const sprite = this.spriteLoader.getSprite(spriteName);
        if (!sprite) {
            console.error(`❌ Sprite not found for drawImage(): ${spriteName}`);
            return false;
        }

        const width = this.SPRITE_SIZE * scale;
        const height = this.SPRITE_SIZE * scale;
        
        try {
            // Use drawImage() to render the sprite
            ctx.drawImage(sprite, x, y, width, height);
            return true;
        } catch (error) {
            console.error(`❌ Failed to drawImage() for sprite: ${spriteName}`, error);
            return false;
        }
    }

    /**
     * Get sprite bounds for collision detection
     */
    getSpriteBounds(x, y, scale = 1) {
        const size = this.SPRITE_SIZE * scale;
        return {
            x: x,
            y: y,
            width: size,
            height: size,
            centerX: x + size / 2,
            centerY: y + size / 2
        };
    }
}

// ================================
// 🎒 EQUIPMENT MANAGER CLASS
// ================================

/**
 * EquipmentManager - Handles player equipment, localStorage persistence, and store functionality
 */
class EquipmentManager {
    constructor() {
        this.STORAGE_KEY = 'duel_game_equipment';
        this.DEFAULT_EQUIPMENT = {
            player1: {
                equippedCharacterSkin: 'cowboy_plain',
                equippedHat: null,
                equippedGun: 'gun_revolver'
            },
            player2: {
                equippedCharacterSkin: 'helmeted_shotgun',
                equippedHat: null,
                equippedGun: 'gun_shotgun'
            }
        };
        
        // Available items in the store
        this.AVAILABLE_ITEMS = {
            characterSkins: ['cowboy_plain', 'helmeted_shotgun', 'player_default', 'player_cowboy', 'player_red', 'player_blue'],
            hats: ['hat_fedora', 'hat'],
            guns: ['gun_revolver', 'gun_shotgun', 'gun_laser', 'gun'],
            overlays: ['overlay']
        };
        
        // Item display names
        this.ITEM_NAMES = {
            // Character skins (baseSprite)
            'cowboy_plain': 'Plain Cowboy',
            'helmeted_shotgun': 'Helmeted Gunslinger',
            'player_default': 'Default Cowboy',
            'player_cowboy': 'Classic Cowboy',
            'player_red': 'Red Bandana',
            'player_blue': 'Blue Denim',
            
            // Hats
            'hat_fedora': 'Fedora Hat',
            'hat': 'Cowboy Hat',
            
            // Guns (gunSprite)
            'gun_revolver': 'Revolver',
            'gun_shotgun': 'Shotgun',
            'gun_laser': 'Laser Gun',
            'gun': 'Six-Shooter',
            
            // Overlays
            'overlay': 'Special Effects'
        };
        
        // Load equipment from localStorage
        this.equipment = this.loadEquipment();
        
        console.log('🎒 Equipment Manager initialized');
    }

    /**
     * Load equipment from localStorage
     */
    loadEquipment() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all properties exist
                return {
                    player1: { ...this.DEFAULT_EQUIPMENT.player1, ...parsed.player1 },
                    player2: { ...this.DEFAULT_EQUIPMENT.player2, ...parsed.player2 }
                };
            }
        } catch (error) {
            console.warn('⚠️ Error loading equipment from localStorage:', error);
        }
        
        // Return defaults if loading fails
        return JSON.parse(JSON.stringify(this.DEFAULT_EQUIPMENT));
    }

    /**
     * Save equipment to localStorage
     */
    saveEquipment() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.equipment));
            console.log('💾 Equipment saved to localStorage');
            return true;
        } catch (error) {
            console.error('❌ Error saving equipment to localStorage:', error);
            return false;
        }
    }

    /**
     * Get player's current equipment
     */
    getPlayerEquipment(playerNumber) {
        const playerKey = `player${playerNumber}`;
        return { ...this.equipment[playerKey] };
    }

    /**
     * Equip an item to a player
     */
    equipItem(playerNumber, itemType, itemName) {
        if (playerNumber !== 1 && playerNumber !== 2) {
            console.warn('⚠️ Invalid player number. Use 1 or 2.');
            return false;
        }

        const playerKey = `player${playerNumber}`;
        const validTypes = ['equippedCharacterSkin', 'equippedHat', 'equippedGun'];
        
        if (!validTypes.includes(itemType)) {
            console.warn(`⚠️ Invalid item type: ${itemType}. Valid types:`, validTypes);
            return false;
        }

        // Allow null for optional items (hat can be unequipped)
        if (itemName !== null && !this.isItemAvailable(itemName)) {
            console.warn(`⚠️ Item not available: ${itemName}`);
            return false;
        }

        const oldItem = this.equipment[playerKey][itemType];
        this.equipment[playerKey][itemType] = itemName;
        
        // Save to localStorage
        this.saveEquipment();
        
        const itemDisplayName = itemName ? this.ITEM_NAMES[itemName] || itemName : 'None';
        const oldDisplayName = oldItem ? this.ITEM_NAMES[oldItem] || oldItem : 'None';
        
        console.log(`🎒 Player ${playerNumber} equipped ${itemType}: ${oldDisplayName} → ${itemDisplayName}`);
        return true;
    }

    /**
     * Unequip an item from a player (set to null)
     */
    unequipItem(playerNumber, itemType) {
        return this.equipItem(playerNumber, itemType, null);
    }

    /**
     * Check if an item is available in the store
     */
    isItemAvailable(itemName) {
        return Object.values(this.AVAILABLE_ITEMS).flat().includes(itemName);
    }

    /**
     * Get all available items
     */
    getAvailableItems() {
        return { ...this.AVAILABLE_ITEMS };
    }

    /**
     * Get item display name
     */
    getItemDisplayName(itemName) {
        return this.ITEM_NAMES[itemName] || itemName;
    }

    /**
     * Get equipped items as array for rendering
     */
    getEquippedItemsArray(playerNumber) {
        const equipment = this.getPlayerEquipment(playerNumber);
        const items = [];
        
        // Add equipped items in rendering order
        if (equipment.equippedHat) items.push(equipment.equippedHat);
        if (equipment.equippedGun) items.push(equipment.equippedGun);
        
        return items;
    }

    /**
     * Reset all equipment to defaults
     */
    resetAllEquipment() {
        this.equipment = JSON.parse(JSON.stringify(this.DEFAULT_EQUIPMENT));
        this.saveEquipment();
        console.log('🔄 All equipment reset to defaults');
        return true;
    }

    /**
     * Get equipment summary for debugging
     */
    getEquipmentSummary() {
        const summary = {};
        
        [1, 2].forEach(playerNum => {
            const equipment = this.getPlayerEquipment(playerNum);
            summary[`player${playerNum}`] = {
                skin: this.getItemDisplayName(equipment.equippedCharacterSkin),
                hat: equipment.equippedHat ? this.getItemDisplayName(equipment.equippedHat) : 'None',
                gun: equipment.equippedGun ? this.getItemDisplayName(equipment.equippedGun) : 'None'
            };
        });
        
        return summary;
    }

    /**
     * Quick equip functions for common operations
     */
    equipSkin(playerNumber, skinName) {
        return this.equipItem(playerNumber, 'equippedCharacterSkin', skinName);
    }

    equipHat(playerNumber, hatName) {
        return this.equipItem(playerNumber, 'equippedHat', hatName);
    }

    equipGun(playerNumber, gunName) {
        return this.equipItem(playerNumber, 'equippedGun', gunName);
    }

    unequipHat(playerNumber) {
        return this.unequipItem(playerNumber, 'equippedHat');
    }

    unequipGun(playerNumber) {
        return this.unequipItem(playerNumber, 'equippedGun');
    }
}

// ================================
// 🪙 COIN MANAGER CLASS
// ================================

class CoinManager {
    constructor() {
        this.STORAGE_KEY = 'duel_game_coins';
        this.DEFAULT_COINS = 50;
        this.DUEL_WIN_REWARD = 25;
        
        // Item prices (10-50 coins as requested)
        this.ITEM_PRICES = {
            // Character skins (baseSprite) - Higher tier items cost more
            'cowboy_plain': 15,
            'helmeted_shotgun': 25,
            'player_default': 10, // Cheapest default option
            'player_cowboy': 20,
            'player_red': 15,
            'player_blue': 15,
            
            // Hats - Moderate pricing
            'hat_fedora': 30,
            'hat': 20,
            
            // Guns (gunSprite) - Varied pricing based on rarity
            'gun_revolver': 25,
            'gun_shotgun': 35,
            'gun_laser': 50, // Most expensive
            'gun': 15
        };
        
        this.currentCoins = this.loadCoins();
        this.coinCounterElement = null;
    }
    
    /**
     * Load coins from localStorage
     */
    loadCoins() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored !== null) {
                const coins = parseInt(stored, 10);
                if (!isNaN(coins) && coins >= 0) {
                    console.log(`🪙 Loaded ${coins} coins from storage`);
                    return coins;
                }
            }
        } catch (error) {
            console.warn('⚠️ Error loading coins from storage:', error);
        }
        
        console.log(`🪙 Starting with default ${this.DEFAULT_COINS} coins`);
        return this.DEFAULT_COINS;
    }
    
    /**
     * Save coins to localStorage
     */
    saveCoins() {
        try {
            localStorage.setItem(this.STORAGE_KEY, this.currentCoins.toString());
            console.log(`💾 Saved ${this.currentCoins} coins to storage`);
            return true;
        } catch (error) {
            console.error('❌ Error saving coins to storage:', error);
            return false;
        }
    }
    
    /**
     * Set the coin counter UI element
     */
    setCoinCounterElement(element) {
        this.coinCounterElement = element;
        this.updateCoinDisplay();
    }
    
    /**
     * Get current coin count
     */
    getCoins() {
        return this.currentCoins;
    }
    
    /**
     * Add coins (e.g., for winning duels)
     */
    addCoins(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            console.warn('⚠️ Invalid coin amount to add:', amount);
            return false;
        }
        
        this.currentCoins += amount;
        this.saveCoins();
        this.updateCoinDisplay();
        this.animateCoinGain();
        
        console.log(`🪙 Added ${amount} coins. Total: ${this.currentCoins}`);
        return true;
    }
    
    /**
     * Spend coins (e.g., for buying items)
     */
    spendCoins(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            console.warn('⚠️ Invalid coin amount to spend:', amount);
            return false;
        }
        
        if (this.currentCoins < amount) {
            console.warn(`⚠️ Not enough coins. Need ${amount}, have ${this.currentCoins}`);
            return false;
        }
        
        this.currentCoins -= amount;
        this.saveCoins();
        this.updateCoinDisplay();
        
        console.log(`🪙 Spent ${amount} coins. Remaining: ${this.currentCoins}`);
        return true;
    }
    
    /**
     * Check if player can afford an item
     */
    canAfford(itemName) {
        const price = this.getItemPrice(itemName);
        return this.currentCoins >= price;
    }
    
    /**
     * Get the price of an item
     */
    getItemPrice(itemName) {
        return this.ITEM_PRICES[itemName] || 10; // Default price if not found
    }
    
    /**
     * Get all item prices
     */
    getAllPrices() {
        return { ...this.ITEM_PRICES };
    }
    
    /**
     * Buy an item (spend coins)
     */
    buyItem(itemName) {
        const price = this.getItemPrice(itemName);
        if (this.spendCoins(price)) {
            console.log(`🛒 Purchased ${itemName} for ${price} coins`);
            return true;
        }
        return false;
    }
    
    /**
     * Award coins for winning a duel
     */
    awardDuelWin() {
        return this.addCoins(this.DUEL_WIN_REWARD);
    }
    
    /**
     * Update the coin display in the UI
     */
    updateCoinDisplay() {
        if (this.coinCounterElement) {
            const amountElement = this.coinCounterElement.querySelector('#coinAmount');
            if (amountElement) {
                amountElement.textContent = this.currentCoins;
            }
        }
    }
    
    /**
     * Animate coin gain effect
     */
    animateCoinGain() {
        if (this.coinCounterElement) {
            this.coinCounterElement.classList.remove('animate');
            // Force reflow
            this.coinCounterElement.offsetHeight;
            this.coinCounterElement.classList.add('animate');
            
            // Remove animation class after it completes
            setTimeout(() => {
                this.coinCounterElement.classList.remove('animate');
            }, 600);
        }
    }
    
    /**
     * Reset coins to default amount
     */
    resetCoins() {
        this.currentCoins = this.DEFAULT_COINS;
        this.saveCoins();
        this.updateCoinDisplay();
        console.log(`🔄 Reset coins to ${this.DEFAULT_COINS}`);
        return true;
    }
    
    /**
     * Get coin system summary for debugging
     */
    getCoinSummary() {
        return {
            currentCoins: this.currentCoins,
            defaultCoins: this.DEFAULT_COINS,
            duelReward: this.DUEL_WIN_REWARD,
            itemPrices: this.getAllPrices()
        };
    }
}

// ================================
// 🎮 DUEL GAME CLASS
// ================================

/**
 * DuelGame - Main game class for Wild West Pattern Duel
 */
class DuelGame {
    // ================================
    // 🎮 INITIALIZATION SECTION
    // ================================
    
    constructor() {
        this.initializeDOM();
        this.initializeCanvas();
        this.initializeStoreUI();
        this.initializeConstants();
        this.initializeSprites();
        this.initializeEquipment();
        this.initializeCoinSystem();
        this.initializePatternManager();
        this.initializeGameState();
        this.initializeAudio();
        this.initializeVisualEffects();
        this.initializeEventListeners();
        
        // Load sprites and start the game
        this.loadSpritesAndStart();
        
        console.log('🤠 Wild West Duel Game initialized successfully!');
    }

    async initializeSprites() {
        this.spriteLoader = new SpriteLoader();
        this.spriteRenderer = new SpriteRenderer(this.spriteLoader);
        this.spritesLoaded = false;
    }

    initializeEquipment() {
        this.equipmentManager = new EquipmentManager();
    }
    
    initializeCoinSystem() {
        this.coinManager = new CoinManager();
        this.coinManager.setCoinCounterElement(this.coinCounter);
    }

    async loadSpritesAndStart() {
        try {
            await this.spriteLoader.loadAllSprites();
            this.spritesLoaded = true;
            
            // Start the game
            this.reset();
            this.startGameLoop();
            
            console.log('🎨 Sprites loaded and game started!');
        } catch (error) {
            console.warn('⚠️ Error loading sprites:', error);
            // Start anyway with placeholders
            this.spritesLoaded = true;
            this.reset();
            this.startGameLoop();
        }
    }
    
    initializeDOM() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.countdownElement = document.getElementById('countdown');
        this.resultElement = document.getElementById('result');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Pattern display elements
        this.patternDisplay = document.getElementById('patternDisplay');
        this.player1PatternElement = document.getElementById('player1Pattern');
        this.player2PatternElement = document.getElementById('player2Pattern');
        this.player1ProgressElement = document.getElementById('player1Progress');
        this.player2ProgressElement = document.getElementById('player2Progress');
        this.player1FeedbackElement = document.getElementById('player1Feedback');
        this.player2FeedbackElement = document.getElementById('player2Feedback');
        
        // Store UI elements
        this.storeButton = document.getElementById('storeButton');
        this.storeModal = document.getElementById('storeModal');
        this.closeStoreButton = document.getElementById('closeStoreButton');
        this.storeTabs = document.querySelectorAll('.store-tab');
        this.playerSelect = document.getElementById('playerSelect');
        this.storeItems = document.getElementById('storeItems');
        
        // Coin counter element
        this.coinCounter = document.getElementById('coinCounter');
    }
    
    initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 400;
    }
    
    initializeStoreUI() {
        // Current active category
        this.currentStoreCategory = 'skins';
        
        // Add event listeners for store UI
        this.storeButton.addEventListener('click', () => this.openStore());
        this.closeStoreButton.addEventListener('click', () => this.closeStore());
        
        // Close store when clicking outside modal content
        this.storeModal.addEventListener('click', (e) => {
            if (e.target === this.storeModal) {
                this.closeStore();
            }
        });
        
        // Add tab switching
        this.storeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                this.switchStoreCategory(category);
            });
        });
        
        // Add player selection change handler
        this.playerSelect.addEventListener('change', () => {
            this.refreshStoreItems();
        });
        
        // Initialize with skins category
        this.refreshStoreItems();
    }
    
    initializeConstants() {
        this.GAME_STATES = {
            WAITING: 'waiting',
            COUNTDOWN: 'countdown',
            PATTERN_SHOWN: 'pattern_shown', // New state when patterns are displayed
            READY: 'ready',
            FINISHED: 'finished'
        };
        
        // Updated player configuration for 32x32 sprites
        this.PLAYER_CONFIG = {
            spriteSize: 32,
            scale: 2, // Scale sprites 2x for better visibility
            player1: { 
                x: 150, 
                y: 250, 
                spriteX: 150, 
                spriteY: 250,
                gunOffsetX: 32, 
                gunOffsetY: 20,
                baseSkin: 'player_default',
                accessories: ['gun'] // Default accessories
            },
            player2: { 
                x: 590, 
                y: 250, 
                spriteX: 590, 
                spriteY: 250,
                gunOffsetX: -8, 
                gunOffsetY: 20,
                baseSkin: 'player_red',
                accessories: ['gun'] // Default accessories
            }
        };
        
        // Pattern configuration for PatternManager
        this.PATTERN_CONFIG = {
            length: 3,
            availableKeys: ['A', 'S', 'D', 'W', 'Q', 'E', 'Z', 'X', 'C'],
            displayTime: 2000,
            penaltyTime: 1000
        };
        
        this.ANIMATION_DURATION = 200; // ms
        this.COUNTDOWN_DURATION = 3;
        this.GAME_TIMEOUT = 2000; // ms
    }

    initializePatternManager() {
        // Create PatternManager instance
        this.patternManager = new PatternManager(this.PATTERN_CONFIG);
        
        // Set UI elements for PatternManager
        this.patternManager.setUIElements({
            patternDisplay: this.patternDisplay,
            player1PatternElement: this.player1PatternElement,
            player2PatternElement: this.player2PatternElement,
            player1ProgressElement: this.player1ProgressElement,
            player2ProgressElement: this.player2ProgressElement,
            player1FeedbackElement: this.player1FeedbackElement,
            player2FeedbackElement: this.player2FeedbackElement
        });
    }
    
    // ================================
    // 🎯 GAME STATE SECTION
    // ================================
    
    initializeGameState() {
        this.gameState = this.GAME_STATES.WAITING;
        this.countdownValue = this.COUNTDOWN_DURATION;
        this.countdownTimer = 0;
        this.countdownTimeoutId = null;
        this.gameEndTimeoutId = null;
        this.patternTimeoutId = null;
        
        // Load equipment from EquipmentManager
        this.updatePlayerEquipment();
        
        this.keys = {};
        this.currentPatterns = { player1: [], player2: [] };
    }

    /**
     * Update player equipment from EquipmentManager
     */
    updatePlayerEquipment() {
        const player1Equipment = this.equipmentManager.getPlayerEquipment(1);
        const player2Equipment = this.equipmentManager.getPlayerEquipment(2);
        
        // Updated player objects for sprite-based rendering with equipment
        this.player1 = {
            ...this.PLAYER_CONFIG.player1,
            hasShot: false,
            shotTime: 0,
            // Equipment properties
            equippedCharacterSkin: player1Equipment.equippedCharacterSkin,
            equippedHat: player1Equipment.equippedHat,
            equippedGun: player1Equipment.equippedGun,
            // Sprite properties
            currentSkin: player1Equipment.equippedCharacterSkin,
            currentAccessories: this.equipmentManager.getEquippedItemsArray(1),
            scale: this.PLAYER_CONFIG.scale,
            flipX: false, // Player 1 faces right
            // Pattern-related properties
            pattern: [],
            patternProgress: 0,
            isDisqualified: false,
            lastInputTime: 0
        };
        
        this.player2 = {
            ...this.PLAYER_CONFIG.player2,
            hasShot: false,
            shotTime: 0,
            // Equipment properties
            equippedCharacterSkin: player2Equipment.equippedCharacterSkin,
            equippedHat: player2Equipment.equippedHat,
            equippedGun: player2Equipment.equippedGun,
            // Sprite properties
            currentSkin: player2Equipment.equippedCharacterSkin,
            currentAccessories: this.equipmentManager.getEquippedItemsArray(2),
            scale: this.PLAYER_CONFIG.scale,
            flipX: true, // Player 2 faces left
            // Pattern-related properties
            pattern: [],
            patternProgress: 0,
            isDisqualified: false,
            lastInputTime: 0
        };
        
        console.log('🎒 Player equipment updated from storage');
    }

    // ================================
    // 🎨 DRAWING/RENDERING SECTION
    // ================================
    
    initializeVisualEffects() {
        this.muzzleFlashes = [];
        this.bulletTrails = [];
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Process queued pattern inputs if in READY state
        this.processPatternInputs();
        
        // Draw background elements
        this.drawBackground();
        
        // Draw players
        this.drawPlayer(this.player1, 1);
        this.drawPlayer(this.player2, -1);
        
        // Draw visual effects
        this.drawVisualEffects();
        
        // Update visual effects
        this.updateVisualEffects();
    }

    /**
     * Process queued pattern inputs during the game loop
     */
    processPatternInputs() {
        if (this.gameState === this.GAME_STATES.READY) {
            const results = this.patternManager.processQueuedInputs(this.gameState, true);
            
            if (results && results.length > 0) {
                console.log(`🎯 Processing ${results.length} pattern input results`);
                results.forEach(result => this.handlePatternResult(result));
            }
        }
    }

    /**
     * Get current input queue status for debugging
     */
    getInputQueueStatus() {
        return {
            queueLength: this.patternManager.inputQueue ? this.patternManager.inputQueue.length : 0,
            queuedInputs: this.patternManager.inputQueue ? [...this.patternManager.inputQueue] : [],
            gameState: this.gameState,
            isListening: this.gameState === this.GAME_STATES.READY
        };
    }

    /**
     * Handle results from PatternManager
     */
    handlePatternResult(result) {
        if (result.type === 'complete') {
            this.handlePatternComplete(result.playerId, result.timestamp);
        } else if (result.type === 'disqualified') {
            // Disqualification is already handled by PatternManager UI
            this.checkGameEnd();
        } else if (result.type === 'wrong_input') {
            // Wrong input penalty is already handled by PatternManager UI
            console.log(`🚫 ${result.playerId} wrong input: ${result.actualKey} (expected: ${result.expectedKey})`);
        } else if (result.type === 'progress') {
            // Progress updates are handled by PatternManager UI
            // No additional action needed here
        }
    }

    /**
     * Update feedback messages when game enters READY state with weapon info
     */
    updateFeedbackForReadyState() {
        const player1Config = this.patternManager.players.player1.weaponConfig;
        const player2Config = this.patternManager.players.player2.weaponConfig;
        
        if (this.player1FeedbackElement && player1Config) {
            this.player1FeedbackElement.textContent = `${player1Config.name}: Input your pattern now!`;
            this.player1FeedbackElement.className = 'pattern-feedback';
        }
        
        if (this.player2FeedbackElement && player2Config) {
            this.player2FeedbackElement.textContent = `${player2Config.name}: Input your pattern now!`;
            this.player2FeedbackElement.className = 'pattern-feedback';
        }
    }
    
    drawBackground() {
        // Ground
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Sun
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 80, 80, 40, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPlayer(player, direction) {
        // Only draw sprites if they're loaded
        if (!this.spritesLoaded || !this.spriteRenderer) {
            // Fallback to rectangle rendering while sprites load
            this.drawPlayerFallback(player, direction);
            return;
        }

        // Calculate sprite position (center the sprite on the player position)
        const spriteX = player.spriteX;
        const spriteY = player.spriteY;

        // Draw composite sprite with base skin and accessories
        this.spriteRenderer.drawCompositeSprite(
            this.ctx,
            spriteX,
            spriteY,
            player.currentSkin,
            player.currentAccessories,
            player.scale,
            player.flipX
        );

        // Update gun position for muzzle flash effects
        const scaledSize = this.PLAYER_CONFIG.spriteSize * player.scale;
        if (player.flipX) {
            // Player 2 (facing left)
            player.gunX = spriteX + player.gunOffsetX;
            player.gunY = spriteY + player.gunOffsetY;
        } else {
            // Player 1 (facing right)
            player.gunX = spriteX + scaledSize + player.gunOffsetX;
            player.gunY = spriteY + player.gunOffsetY;
        }
    }

    /**
     * Fallback rectangle drawing for when sprites aren't loaded yet
     */
    drawPlayerFallback(player, direction) {
        const fallbackWidth = 60;
        const fallbackHeight = 80;
        
        // Draw body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(player.x, player.y, fallbackWidth, fallbackHeight);
        
        // Draw head
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.fillRect(player.x + 15, player.y - 20, 30, 25);
        
        // Draw hat
        this.ctx.fillStyle = '#2F1B14';
        this.ctx.fillRect(player.x + 10, player.y - 25, 40, 8);
        this.ctx.fillRect(player.x + 15, player.y - 30, 30, 8);
        
        // Draw gun
        this.ctx.fillStyle = '#444444';
        const gunLength = 40;
        const gunX = direction === 1 ? player.x + fallbackWidth : player.x;
        this.ctx.fillRect(gunX, player.y + 20, gunLength * direction, 6);
        
        // Update gun position for fallback mode
        player.gunX = gunX + (direction === 1 ? gunLength : 0);
        player.gunY = player.y + 23;
    }
    
    drawVisualEffects() {
        this.muzzleFlashes.forEach(flash => flash.draw(this.ctx));
        this.bulletTrails.forEach(trail => trail.draw(this.ctx));
    }
    
    updateVisualEffects() {
        // Update muzzle flashes
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            if (!this.muzzleFlashes[i].update()) {
                this.muzzleFlashes.splice(i, 1);
            }
        }
        
        // Update bullet trails
        for (let i = this.bulletTrails.length - 1; i >= 0; i--) {
            if (!this.bulletTrails[i].update()) {
                this.bulletTrails.splice(i, 1);
            }
        }
    }
    
    startGameLoop() {
        const gameLoop = () => {
            this.draw();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    
    // ================================
    // 🎮 PLAYER INPUT SECTION
    // ================================
    
    initializeEventListeners() {
        // Enhanced keydown listener to handle both letters and arrow keys
        document.addEventListener('keydown', (event) => {
            let key = event.key;
            
            // Convert arrow keys to symbols for pattern matching
            switch(event.key) {
                case 'ArrowUp':
                    key = '↑';
                    event.preventDefault(); // Prevent page scrolling
                    break;
                case 'ArrowDown':
                    key = '↓';
                    event.preventDefault();
                    break;
                case 'ArrowLeft':
                    key = '←';
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    key = '→';
                    event.preventDefault();
                    break;
                default:
                    // Regular letter keys - convert to uppercase
                    key = event.key.toUpperCase();
                    break;
            }
            
            this.handleInput(key);
        });
        
        console.log('⌨️ Event listeners initialized with arrow key support');
        
        // Play Again button
        this.playAgainBtn.addEventListener('click', () => {
            this.reset();
        });
    }
    
    handleInput(key) {
        const upperKey = key.toUpperCase();
        const timestamp = Date.now();
        
        if (this.gameState === this.GAME_STATES.WAITING) {
            // Any pattern key starts the countdown
            if (this.patternManager.isPatternKey(upperKey)) {
                this.startCountdown();
            }
        } else if (this.gameState === this.GAME_STATES.PATTERN_SHOWN) {
            // Handle early input during pattern memorization - process immediately
            const result = this.patternManager.handleInput(upperKey, this.gameState, false, timestamp);
            if (result) {
                this.handlePatternResult(result);
            }
        } else if (this.gameState === this.GAME_STATES.READY) {
            // Queue input for processing in game loop
            const queueResult = this.patternManager.queueInput(upperKey, timestamp);
            if (queueResult) {
                console.log(`🎮 Input queued for processing: ${upperKey}`);
            }
        } else if (this.gameState === this.GAME_STATES.COUNTDOWN) {
            // Handle early input during countdown - process immediately
            const result = this.patternManager.handleInput(upperKey, this.gameState, false, timestamp);
            if (result) {
                this.handlePatternResult(result);
            }
        }
    }

    /**
     * Handle pattern completion - fire the shot!
     */
    handlePatternComplete(playerId, timestamp) {
        const player = playerId === 'player1' ? this.player1 : this.player2;
        const direction = playerId === 'player1' ? 1 : -1;
        
        player.hasShot = true;
        player.shotTime = timestamp;
        
        console.log(`🎯 ${playerId} completed pattern and fired!`);
        
        // Play gunshot sound effect
        this.playGunshotSound();
        
        // Create muzzle flash and bullet trail
        const muzzleFlash = new MuzzleFlash(player.gunX, player.gunY, direction);
        this.muzzleFlashes.push(muzzleFlash);
        
        const startX = player.gunX;
        const startY = player.gunY;
        const endX = direction === 1 ? this.canvas.width - 50 : 50;
        const endY = startY + (Math.random() - 0.5) * 40;
        
        const bulletTrail = new BulletTrail(startX, startY, endX, endY);
        this.bulletTrails.push(bulletTrail);
        
        this.checkGameEnd();
    }


    

    
    // ================================
    // 🔊 AUDIO HANDLING SECTION
    // ================================
    
    initializeAudio() {
        this.audioLoaded = false;
        this.audioError = false;
        this.audioLoadAttempted = false;
        
        this.gunshotSound = new Audio('assets/gunshot.mp3');
        this.gunshotSound.preload = 'auto';
        this.gunshotSound.volume = 0.7;
        
        this.setupAudioEventListeners();
        this.loadAudio();
    }
    
    setupAudioEventListeners() {
        this.gunshotSound.addEventListener('canplaythrough', () => {
            this.audioLoaded = true;
            this.audioError = false;
            console.log('🔊 Gunshot sound loaded successfully');
        });
        
        this.gunshotSound.addEventListener('error', (e) => {
            this.audioError = true;
            this.audioLoaded = false;
            console.warn('🔇 Gunshot sound file failed to load:', e.type, 'Game will continue without sound.');
        });
        
        this.gunshotSound.addEventListener('loadstart', () => {
            this.audioLoadAttempted = true;
            console.log('⏳ Starting to load gunshot sound...');
        });
        
        this.gunshotSound.addEventListener('loadeddata', () => {
            console.log('📦 Gunshot sound data loaded');
        });
    }
    
    loadAudio() {
        try {
            this.gunshotSound.load();
        } catch (error) {
            console.warn('❌ Failed to initiate audio loading:', error.message);
            this.audioError = true;
        }
    }
    
    playGunshotSound() {
        // Check if audio is available and loaded
        if (this.audioError) {
            console.warn('🔇 Cannot play gunshot sound - audio failed to load');
            return;
        }
        
        if (!this.audioLoaded && this.audioLoadAttempted) {
            console.warn('⏳ Cannot play gunshot sound - audio still loading');
            return;
        }
        
        if (!this.audioLoadAttempted) {
            console.warn('❌ Cannot play gunshot sound - audio not initialized');
            return;
        }
        
        try {
            // Check if audio element is in a valid state
            if (this.gunshotSound.readyState < 2) { // HAVE_CURRENT_DATA
                console.warn('📊 Cannot play gunshot sound - insufficient audio data loaded');
                return;
            }
            
            // Reset the audio to the beginning in case it's already played
            this.gunshotSound.currentTime = 0;
            
            // Play the sound
            const playPromise = this.gunshotSound.play();
            
            // Handle promise rejection (modern browsers require user interaction first)
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('🔊 Gunshot sound played successfully');
                }).catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn('🚫 Gunshot sound blocked by browser - user interaction required first');
                    } else if (error.name === 'AbortError') {
                        console.warn('⏹️ Gunshot sound playback aborted');
                    } else {
                        console.warn('❌ Could not play gunshot sound:', error.name, error.message);
                    }
                });
            }
        } catch (error) {
            console.warn('💥 Error attempting to play gunshot sound:', error.message);
            
            // If there's a critical error, mark audio as failed
            if (error.name === 'InvalidStateError' || error.name === 'NotSupportedError') {
                this.audioError = true;
                console.warn('🔴 Audio marked as failed due to critical error');
            }
        }
    }
    
    getAudioStatus() {
        return {
            loaded: this.audioLoaded,
            error: this.audioError,
            loadAttempted: this.audioLoadAttempted,
            readyState: this.gunshotSound.readyState,
            networkState: this.gunshotSound.networkState,
            currentTime: this.gunshotSound.currentTime,
            duration: this.gunshotSound.duration || 'unknown'
        };
    }
    
    retryAudioLoad() {
        if (this.audioError && this.audioLoadAttempted) {
            console.log('🔄 Retrying audio load...');
            this.audioError = false;
            this.audioLoaded = false;
            
            try {
                this.gunshotSound.load();
            } catch (error) {
                console.warn('❌ Audio retry failed:', error.message);
                this.audioError = true;
            }
        }
    }
    
    // ================================
    // 🎨 EQUIPMENT AND STORE SYSTEM
    // ================================

    /**
     * Equip a character skin to a player
     */
    equipSkin(playerNumber, skinName) {
        const success = this.equipmentManager.equipSkin(playerNumber, skinName);
        if (success) {
            this.updatePlayerEquipment();
        }
        return success;
    }

    /**
     * Equip a hat to a player
     */
    equipHat(playerNumber, hatName) {
        const success = this.equipmentManager.equipHat(playerNumber, hatName);
        if (success) {
            this.updatePlayerEquipment();
        }
        return success;
    }

    /**
     * Equip a gun to a player
     */
    equipGun(playerNumber, gunName) {
        const success = this.equipmentManager.equipGun(playerNumber, gunName);
        if (success) {
            this.updatePlayerEquipment();
        }
        return success;
    }

    /**
     * Unequip a hat from a player
     */
    unequipHat(playerNumber) {
        const success = this.equipmentManager.unequipHat(playerNumber);
        if (success) {
            this.updatePlayerEquipment();
        }
        return success;
    }

    /**
     * Unequip a gun from a player
     */
    unequipGun(playerNumber) {
        const success = this.equipmentManager.unequipGun(playerNumber);
        if (success) {
            this.updatePlayerEquipment();
        }
        return success;
    }

    /**
     * Get current player equipment
     */
    getPlayerEquipment(playerNumber) {
        return this.equipmentManager.getPlayerEquipment(playerNumber);
    }

    /**
     * Get all available items from the store
     */
    getAvailableItems() {
        return this.equipmentManager.getAvailableItems();
    }

    /**
     * Get equipment summary for all players
     */
    getEquipmentSummary() {
        return this.equipmentManager.getEquipmentSummary();
    }

    /**
     * Reset all equipment to defaults
     */
    resetAllEquipment() {
        const success = this.equipmentManager.resetAllEquipment();
        if (success) {
            this.updatePlayerEquipment();
        }
        return success;
    }
    
    // ================================
    // 🛒 STORE UI SECTION
    // ================================
    
    openStore() {
        this.storeModal.classList.remove('hidden');
        this.refreshStoreItems();
        console.log('🛒 Store opened');
    }
    
    closeStore() {
        this.storeModal.classList.add('hidden');
        console.log('🛒 Store closed');
    }
    
    switchStoreCategory(category) {
        // Update active tab
        this.storeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        this.currentStoreCategory = category;
        this.refreshStoreItems();
        console.log(`🛒 Switched to ${category} category`);
    }
    
    refreshStoreItems() {
        const selectedPlayer = parseInt(this.playerSelect.value);
        const availableItems = this.equipmentManager.getAvailableItems();
        const playerEquipment = this.equipmentManager.getPlayerEquipment(selectedPlayer);
        
        // Clear existing items
        this.storeItems.innerHTML = '';
        
        let items = [];
        let equippedItem = null;
        
        switch (this.currentStoreCategory) {
            case 'skins':
                items = availableItems.characterSkins;
                equippedItem = playerEquipment.equippedCharacterSkin;
                break;
            case 'hats':
                items = availableItems.hats;
                equippedItem = playerEquipment.equippedHat;
                break;
            case 'guns':
                items = availableItems.guns;
                equippedItem = playerEquipment.equippedGun;
                break;
        }
        
        // Create item elements
        items.forEach(itemName => {
            const itemElement = this.createStoreItemElement(itemName, selectedPlayer, equippedItem === itemName);
            this.storeItems.appendChild(itemElement);
        });
    }
    
    createStoreItemElement(itemName, selectedPlayer, isEquipped) {
        const itemDiv = document.createElement('div');
        itemDiv.className = `store-item ${isEquipped ? 'equipped' : ''}`;
        
        // Create thumbnail
        const thumbnail = document.createElement('div');
        thumbnail.className = 'item-thumbnail';
        
        // Create thumbnail canvas
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = 64;
        thumbnailCanvas.height = 64;
        const thumbnailCtx = thumbnailCanvas.getContext('2d');
        
        // Draw sprite thumbnail
        this.drawSpriteThumbnail(thumbnailCtx, itemName);
        
        thumbnail.appendChild(thumbnailCanvas);
        
        // Create item name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'item-name';
        nameDiv.textContent = this.equipmentManager.getItemDisplayName(itemName);
        
        // Create item price
        const priceDiv = document.createElement('div');
        priceDiv.className = 'item-price';
        const price = this.coinManager.getItemPrice(itemName);
        priceDiv.innerHTML = `<span class="coin-icon">🪙</span>${price}`;
        
        // Create equip button
        const equipButton = document.createElement('button');
        equipButton.className = 'equip-button';
        const canAfford = this.coinManager.canAfford(itemName);
        
        if (isEquipped) {
            equipButton.textContent = 'Equipped';
            equipButton.disabled = true;
        } else if (!canAfford) {
            equipButton.textContent = 'Can\'t Afford';
            equipButton.disabled = true;
            equipButton.style.background = '#999999';
            equipButton.style.color = '#666666';
        } else {
            equipButton.textContent = `Buy (🪙${price})`;
            equipButton.disabled = false;
        }
        
        if (!isEquipped && canAfford) {
            equipButton.addEventListener('click', () => {
                this.buyAndEquipItem(selectedPlayer, this.currentStoreCategory, itemName);
            });
        }
        
        itemDiv.appendChild(thumbnail);
        itemDiv.appendChild(nameDiv);
        itemDiv.appendChild(priceDiv);
        itemDiv.appendChild(equipButton);
        
        return itemDiv;
    }
    
    drawSpriteThumbnail(ctx, itemName) {
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, 64, 64);
        
        // Try to get sprite from sprite loader
        const sprite = this.spriteLoader.getSprite(itemName);
        if (sprite && sprite.complete) {
            try {
                // Draw sprite centered and scaled to fit
                const scale = Math.min(64 / this.spriteLoader.SPRITE_SIZE, 2);
                const scaledSize = this.spriteLoader.SPRITE_SIZE * scale;
                const offsetX = (64 - scaledSize) / 2;
                const offsetY = (64 - scaledSize) / 2;
                
                ctx.drawImage(sprite, offsetX, offsetY, scaledSize, scaledSize);
            } catch (error) {
                console.warn(`⚠️ Failed to draw sprite thumbnail for ${itemName}:`, error);
                this.drawPlaceholderThumbnail(ctx, itemName);
            }
        } else {
            // Draw placeholder
            this.drawPlaceholderThumbnail(ctx, itemName);
        }
    }
    
    drawPlaceholderThumbnail(ctx, itemName) {
        // Determine color based on item type
        let color = '#8B4513';
        if (itemName.includes('gun')) {
            if (itemName.includes('laser')) {
                color = '#00FFFF';
            } else if (itemName.includes('shotgun')) {
                color = '#8B4513';
            } else {
                color = '#444444';
            }
        } else if (itemName.includes('hat')) {
            color = '#2F2F2F';
        } else if (itemName.includes('helmeted') || itemName.includes('shotgun')) {
            color = '#556B2F';
        } else if (itemName.includes('cowboy') || itemName.includes('plain')) {
            color = '#654321';
        } else if (itemName.includes('red')) {
            color = '#CD5C5C';
        } else if (itemName.includes('blue')) {
            color = '#4169E1';
        }
        
        // Draw simple placeholder
        ctx.fillStyle = color;
        ctx.fillRect(8, 8, 48, 48);
        
        // Add border
        ctx.strokeStyle = '#2F1B14';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, 48, 48);
        
        // Add item type indicator
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(itemName.charAt(0).toUpperCase(), 32, 36);
    }
    
    buyAndEquipItem(playerNumber, category, itemName) {
        // Check if player can afford the item
        if (!this.coinManager.canAfford(itemName)) {
            console.warn(`⚠️ Not enough coins to buy ${itemName}`);
            return false;
        }
        
        // Try to buy the item first
        if (!this.coinManager.buyItem(itemName)) {
            console.warn(`⚠️ Failed to purchase ${itemName}`);
            return false;
        }
        
        // Now equip the item
        let success = false;
        
        switch (category) {
            case 'skins':
                success = this.equipSkin(playerNumber, itemName);
                break;
            case 'hats':
                success = this.equipHat(playerNumber, itemName);
                break;
            case 'guns':
                success = this.equipGun(playerNumber, itemName);
                break;
        }
        
        if (success) {
            this.refreshStoreItems(); // Refresh to update equipped states and prices
            console.log(`🛒 Purchased and equipped ${itemName} to Player ${playerNumber}`);
        } else {
            // If equipping failed, refund the coins
            const price = this.coinManager.getItemPrice(itemName);
            this.coinManager.addCoins(price);
            console.warn(`⚠️ Failed to equip ${itemName}, refunded ${price} coins`);
        }
        
        return success;
    }
    
    equipItemFromStore(playerNumber, category, itemName) {
        // Legacy method - now redirects to buy and equip
        return this.buyAndEquipItem(playerNumber, category, itemName);
    }

    /**
     * Get all available sprites (for backward compatibility)
     */
    getAvailableSprites() {
        const sprites = this.spriteLoader.SPRITE_PATHS;
        const loaded = {};
        
        Object.keys(sprites).forEach(name => {
            loaded[name] = this.spriteLoader.isLoaded(name);
        });
        
        return {
            sprites: sprites,
            loaded: loaded,
            progress: this.spriteLoader.getLoadingProgress()
        };
    }

    /**
     * Legacy function - use equipSkin instead
     */
    changePlayerSkin(playerNumber, skinName) {
        console.warn('⚠️ changePlayerSkin is deprecated. Use equipSkin instead.');
        return this.equipSkin(playerNumber, skinName);
    }

    /**
     * Legacy function - use equipHat instead
     */
    addPlayerAccessory(playerNumber, accessoryName) {
        console.warn('⚠️ addPlayerAccessory is deprecated. Use equipHat or equipGun instead.');
        if (accessoryName === 'hat') {
            return this.equipHat(playerNumber, accessoryName);
        } else if (accessoryName === 'gun') {
            return this.equipGun(playerNumber, accessoryName);
        }
        return false;
    }

    /**
     * Legacy function - use unequipHat or unequipGun instead
     */
    removePlayerAccessory(playerNumber, accessoryName) {
        console.warn('⚠️ removePlayerAccessory is deprecated. Use unequipHat or unequipGun instead.');
        if (accessoryName === 'hat') {
            return this.unequipHat(playerNumber);
        } else if (accessoryName === 'gun') {
            return this.unequipGun(playerNumber);
        }
        return false;
    }

    /**
     * Legacy function - use getPlayerEquipment instead
     */
    getPlayerAppearance(playerNumber) {
        console.warn('⚠️ getPlayerAppearance is deprecated. Use getPlayerEquipment instead.');
        const equipment = this.getPlayerEquipment(playerNumber);
        if (!equipment) return null;
        
        const player = playerNumber === 1 ? this.player1 : this.player2;
        return {
            skin: equipment.equippedCharacterSkin,
            accessories: this.equipmentManager.getEquippedItemsArray(playerNumber),
            scale: player.scale,
            flipX: player.flipX
        };
    }

    // ================================
    // 🔄 RESET AND UI CONTROLS SECTION
    // ================================
    
    startCountdown() {
        this.gameState = this.GAME_STATES.COUNTDOWN;
        this.countdownValue = this.COUNTDOWN_DURATION;
        this.countdownTimer = Date.now();
        
        // Generate patterns at the start of countdown
        const patterns = this.patternManager.generatePatterns(this.equipmentManager.getPlayerEquipment(1), this.equipmentManager.getPlayerEquipment(2));
        
        // Store patterns in player objects for backward compatibility
        this.player1.pattern = patterns.player1;
        this.player2.pattern = patterns.player2;
        
        this.countdown();
    }

    countdown() {
        if (this.countdownValue > 1) {
            this.countdownElement.textContent = this.countdownValue;
            this.countdownValue--;
            this.countdownTimeoutId = setTimeout(() => this.countdown(), 1000);
        } else if (this.countdownValue === 1) {
            // Show patterns when countdown reaches 1
            this.countdownElement.textContent = 'MEMORIZE YOUR PATTERN!';
            this.patternManager.displayPatterns();
            this.gameState = this.GAME_STATES.PATTERN_SHOWN;
            
            // Give players time to memorize patterns
            this.patternTimeoutId = setTimeout(() => {
                this.countdownElement.textContent = 'FIRE! ⌨️ LISTENING FOR PATTERNS...';
                this.gameState = this.GAME_STATES.READY;
                
                // Update feedback messages for ready state
                this.updateFeedbackForReadyState();
                
                console.log('🎮 Game loop now listening for pattern inputs!');
                console.log('🎯 Input queue initialized and ready');
                
                // Set game timeout for maximum duel duration
                this.gameEndTimeoutId = setTimeout(() => {
                    if (this.gameState === this.GAME_STATES.READY) {
                        // Nobody shot in time
                        this.gameState = this.GAME_STATES.FINISHED;
                        this.resultElement.textContent = 'Too slow!';
                        this.playAgainBtn.classList.add('show');
                    }
                }, this.GAME_TIMEOUT);
            }, this.PATTERN_CONFIG.displayTime);
        }
    }
    
    checkGameEnd() {
        // Get game end state from PatternManager
        const endState = this.patternManager.getGameEndState();
        
        if (endState) {
            this.gameState = this.GAME_STATES.FINISHED;
            this.resultElement.textContent = endState.reason;
            
            // Award coins to the winner
            if (endState.winner) {
                this.coinManager.awardDuelWin();
                console.log(`🪙 ${endState.winner} wins! Awarded ${this.coinManager.DUEL_WIN_REWARD} coins`);
            } else {
                console.log('🤝 No winner - no coins awarded');
            }
            
            // Hide patterns and show the Play Again button
            this.patternManager.hidePatterns();
            this.playAgainBtn.classList.add('show');
        }
    }
    
    reset() {
        // Clear any pending timeouts/intervals
        this.clearTimeouts();
        
        // Reset game state variables
        this.gameState = this.GAME_STATES.WAITING;
        this.countdownValue = this.COUNTDOWN_DURATION;
        this.countdownTimer = 0;
        
        // Reset player states
        this.resetPlayers();
        
        // Clear and reset UI elements
        this.resetUI();
        
        // Clear all visual effects arrays
        this.clearVisualEffects();
        
        // Reset audio
        this.resetAudio();
        
        // Clear canvas explicitly (will be redrawn in next frame)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        console.log('🔄 Game reset successfully');
    }
    
    clearTimeouts() {
        if (this.countdownTimeoutId) {
            clearTimeout(this.countdownTimeoutId);
            this.countdownTimeoutId = null;
        }
        if (this.gameEndTimeoutId) {
            clearTimeout(this.gameEndTimeoutId);
            this.gameEndTimeoutId = null;
        }
        if (this.patternTimeoutId) {
            clearTimeout(this.patternTimeoutId);
            this.patternTimeoutId = null;
        }
    }

    resetPlayers() {
        // Reset player 1 state
        this.player1.hasShot = false;
        this.player1.shotTime = 0;
        this.player1.pattern = [];
        this.player1.patternProgress = 0;
        this.player1.isDisqualified = false;
        this.player1.lastInputTime = 0;
        
        // Reset player 2 state
        this.player2.hasShot = false;
        this.player2.shotTime = 0;
        this.player2.pattern = [];
        this.player2.patternProgress = 0;
        this.player2.isDisqualified = false;
        this.player2.lastInputTime = 0;
        
        // Update equipment from storage (in case it changed)
        this.updatePlayerEquipment();
        
        // Reset PatternManager
        this.patternManager.reset();
    }

    resetUI() {
        this.countdownElement.textContent = 'Press any pattern key to start!';
        this.resultElement.textContent = '';
        this.playAgainBtn.classList.remove('show');
        
        // Reset pattern display using PatternManager
        this.patternManager.hidePatterns();
        // Note: Visual states are already reset by PatternManager.reset() in resetPlayers()
    }
    
    clearVisualEffects() {
        this.muzzleFlashes.length = 0;
        this.bulletTrails.length = 0;
    }
    
    resetAudio() {
        try {
            if (!this.audioError && this.gunshotSound.readyState >= 1) { // HAVE_METADATA
                this.gunshotSound.pause();
                this.gunshotSound.currentTime = 0;
                console.log('🔊 Audio reset successfully');
            } else if (this.audioError) {
                console.warn('🔇 Skipping audio reset - audio is in error state');
            } else {
                console.warn('⏳ Skipping audio reset - audio not ready');
            }
        } catch (error) {
            // Ignore audio reset errors but log them for debugging
            console.warn('⚠️ Audio reset warning:', error.message);
            
            // If reset fails critically, mark audio as having issues
            if (error.name === 'InvalidStateError') {
                console.warn('🔴 Audio may be in an invalid state');
            }
        }
    }
}

// ================================
// ✨ VISUAL EFFECTS CLASSES
// ================================

// Enhanced Muzzle flash class with improved visuals and smooth animations
class MuzzleFlash {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 1 for right, -1 for left
        this.startTime = Date.now();
        this.duration = 200; // 200ms duration
        this.maxSize = 50; // Increased from 30 for more noticeable flash
        this.maxRayLength = 80; // Length of flash rays
        this.rayCount = 12; // Number of flash rays
        
        // Random angles for each ray for more dynamic appearance
        this.rayAngles = [];
        for (let i = 0; i < this.rayCount; i++) {
            this.rayAngles.push((i / this.rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3);
        }
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        return elapsed < this.duration;
    }

    draw(ctx) {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        // Enhanced easing function for smoother fade-out
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const alpha = 1 - easeOutQuart;
        const size = this.maxSize * (1 - easeOutQuart * 0.3); // Less dramatic size reduction
        const rayLength = this.maxRayLength * (1 - easeOutQuart * 0.5);

        ctx.save();
        
        // Draw flash rays first (behind the main flash)
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6; // Thicker rays for more visibility
        ctx.lineCap = 'round';
        
        for (let i = 0; i < this.rayCount; i++) {
            const angle = this.rayAngles[i];
            const rayStartX = this.x + Math.cos(angle) * size * 0.3;
            const rayStartY = this.y + Math.sin(angle) * size * 0.3;
            const rayEndX = this.x + Math.cos(angle) * rayLength;
            const rayEndY = this.y + Math.sin(angle) * rayLength;
            
            // Create gradient for each ray
            const rayGradient = ctx.createLinearGradient(rayStartX, rayStartY, rayEndX, rayEndY);
            rayGradient.addColorStop(0, '#FFFFFF');
            rayGradient.addColorStop(0.7, '#FFFF00');
            rayGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            ctx.strokeStyle = rayGradient;
            ctx.beginPath();
            ctx.moveTo(rayStartX, rayStartY);
            ctx.lineTo(rayEndX, rayEndY);
            ctx.stroke();
        }
        
        // Draw outer glow ring
        ctx.globalAlpha = alpha * 0.3;
        const outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.5);
        outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        outerGlow.addColorStop(0.4, 'rgba(255, 255, 0, 0.6)');
        outerGlow.addColorStop(0.7, 'rgba(255, 165, 0, 0.3)');
        outerGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Main bright flash core with enhanced gradient
        ctx.globalAlpha = alpha;
        const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size);
        coreGradient.addColorStop(0, '#FFFFFF');      // Pure white center
        coreGradient.addColorStop(0.1, '#FFFF99');    // Light yellow
        coreGradient.addColorStop(0.3, '#FFFF00');    // Bright yellow
        coreGradient.addColorStop(0.6, '#FF8800');    // Orange
        coreGradient.addColorStop(0.85, '#FF4400');   // Red-orange
        coreGradient.addColorStop(1, '#CC0000');      // Dark red
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Enhanced sparkle effect with more particles and better distribution
        ctx.globalAlpha = alpha;
        const sparkleCount = 8; // Increased sparkle count
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + (elapsed * 0.01); // Subtle rotation
            const distance = size * (0.8 + Math.sin(elapsed * 0.02 + i) * 0.2); // Pulsing effect
            const sparkleX = this.x + Math.cos(angle) * distance;
            const sparkleY = this.y + Math.sin(angle) * distance;
            const sparkleSize = size * (0.08 + Math.sin(elapsed * 0.03 + i * 2) * 0.02);
            
            // Create sparkle gradient
            const sparkleGradient = ctx.createRadialGradient(
                sparkleX, sparkleY, 0, 
                sparkleX, sparkleY, sparkleSize * 2
            );
            sparkleGradient.addColorStop(0, '#FFFFFF');
            sparkleGradient.addColorStop(0.5, '#FFFF99');
            sparkleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = sparkleGradient;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add inner white-hot center
        ctx.globalAlpha = alpha * 0.9;
        const innerCore = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 0.3);
        innerCore.addColorStop(0, '#FFFFFF');
        innerCore.addColorStop(0.6, 'rgba(255, 255, 255, 0.8)');
        innerCore.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = innerCore;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Bullet trail class
class BulletTrail {
    constructor(startX, startY, endX, endY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.startTime = Date.now();
        this.duration = 200; // 200ms as requested
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        return elapsed < this.duration;
    }

    draw(ctx) {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Draw main bullet line
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        
        // Add glowing effect with a thicker, more transparent line
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        
        ctx.restore();
    }
}

// ================================
// 🚀 GAME INITIALIZATION
// ================================

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new DuelGame();
    
    // Expose game instance globally for debugging and testing
    window.duelGame = game;
    
    // Debug functions for input queue monitoring
    window.debugInputQueue = () => {
        const status = window.duelGame.getInputQueueStatus();
        console.log('🔍 Input Queue Debug:', status);
        return status;
    };
    
    window.debugPatternManager = () => {
        const pmStatus = window.duelGame.patternManager.getInputQueueStatus();
        const playerStates = window.duelGame.patternManager.getPlayerStates();
        console.log('🎯 PatternManager Debug:', { queue: pmStatus, players: playerStates });
        return { queue: pmStatus, players: playerStates };
    };
    
    // Demo function to show input queue behavior
    window.demoInputQueue = () => {
        console.log('🎮 Input Queue Demo:');
        console.log('1. Start a game and wait for "FIRE!"');
        console.log('2. Press pattern keys rapidly');
        console.log('3. Call debugInputQueue() to see queued inputs');
        console.log('4. Watch console for processing messages');
        console.log('5. Inputs are processed in game loop, not immediately!');
        
        if (window.duelGame.gameState === 'ready') {
            console.log('🎯 Game is READY - input queue is active!');
            console.log('🎹 Try pressing pattern keys now and call debugInputQueue()');
        } else {
            console.log(`⏳ Game state: ${window.duelGame.gameState} - start a game first`);
        }
    };

    // Equipment system debug functions
    window.debugEquipment = () => {
        const summary = window.duelGame.getEquipmentSummary();
        console.log('🎒 Equipment System Debug:', summary);
        return summary;
    };

    window.debugStore = () => {
        const items = window.duelGame.getAvailableItems();
        console.log('🏪 Store Inventory:', items);
        return items;
    };

    window.equipSkin = (playerNumber, skinName) => {
        console.log(`🎨 Equipping skin '${skinName}' to Player ${playerNumber}`);
        return window.duelGame.equipSkin(playerNumber, skinName);
    };

    window.equipHat = (playerNumber, hatName) => {
        console.log(`🎩 Equipping hat '${hatName}' to Player ${playerNumber}`);
        return window.duelGame.equipHat(playerNumber, hatName);
    };

    window.equipGun = (playerNumber, gunName) => {
        console.log(`🔫 Equipping gun '${gunName}' to Player ${playerNumber}`);
        return window.duelGame.equipGun(playerNumber, gunName);
    };

    window.unequipHat = (playerNumber) => {
        console.log(`🎩 Unequipping hat from Player ${playerNumber}`);
        return window.duelGame.unequipHat(playerNumber);
    };

    window.unequipGun = (playerNumber) => {
        console.log(`🔫 Unequipping gun from Player ${playerNumber}`);
        return window.duelGame.unequipGun(playerNumber);
    };

    window.getPlayerEquipment = (playerNumber) => {
        const equipment = window.duelGame.getPlayerEquipment(playerNumber);
        console.log(`👤 Player ${playerNumber} equipment:`, equipment);
        return equipment;
    };

    window.resetAllEquipment = () => {
        console.log('🔄 Resetting all equipment to defaults');
        return window.duelGame.resetAllEquipment();
    };

    // Coin system debug functions
    window.debugCoins = () => {
        const summary = window.duelGame.coinManager.getCoinSummary();
        console.log('🪙 Coin System Debug:', summary);
        return summary;
    };

    window.getCoins = () => {
        const coins = window.duelGame.coinManager.getCoins();
        console.log(`🪙 Current coins: ${coins}`);
        return coins;
    };

    window.addCoins = (amount) => {
        console.log(`🪙 Adding ${amount} coins`);
        return window.duelGame.coinManager.addCoins(amount);
    };

    window.spendCoins = (amount) => {
        console.log(`🪙 Spending ${amount} coins`);
        return window.duelGame.coinManager.spendCoins(amount);
    };

    window.resetCoins = () => {
        console.log('🔄 Resetting coins to default amount');
        return window.duelGame.coinManager.resetCoins();
    };

    window.getItemPrice = (itemName) => {
        const price = window.duelGame.coinManager.getItemPrice(itemName);
        console.log(`🪙 ${itemName} costs ${price} coins`);
        return price;
    };

    window.canAfford = (itemName) => {
        const affordable = window.duelGame.coinManager.canAfford(itemName);
        const price = window.duelGame.coinManager.getItemPrice(itemName);
        const currentCoins = window.duelGame.coinManager.getCoins();
        console.log(`🪙 Can afford ${itemName} (${price} coins)? ${affordable} (you have ${currentCoins})`);
        return affordable;
    };

    window.demoCoins = () => {
        console.log('🪙 Coin System Demo:');
        console.log('📋 Available functions:');
        console.log('  debugCoins() - Show detailed coin system info');
        console.log('  getCoins() - Show current coin count');
        console.log('  addCoins(amount) - Add coins (for testing)');
        console.log('  spendCoins(amount) - Spend coins (for testing)');
        console.log('  resetCoins() - Reset to default amount (50)');
        console.log('  getItemPrice("itemName") - Check item price');
        console.log('  canAfford("itemName") - Check if you can afford item');
        console.log('');
        console.log('💰 Earn coins: +25 for winning duels');
        console.log('🛒 Spend coins: 10-50 per cosmetic item');
        console.log('💾 Coins automatically save to localStorage!');
        console.log('');
        console.log('💡 Try: getItemPrice("gun_laser"); canAfford("gun_laser"); addCoins(100)');
    };

    window.demoStore = () => {
        console.log('🏪 Equipment Store Demo:');
        console.log('📋 Available functions:');
        console.log('  debugEquipment() - Show current equipment for all players');
        console.log('  debugStore() - Show all available items in store');
        console.log('  equipSkin(1, "player_blue") - Equip skin to player');
        console.log('  equipHat(1, "hat") - Equip hat to player');
        console.log('  equipGun(1, "gun") - Equip gun to player');
        console.log('  unequipHat(1) - Remove hat from player');
        console.log('  unequipGun(1) - Remove gun from player');
        console.log('  getPlayerEquipment(1) - Show player equipment');
        console.log('  resetAllEquipment() - Reset all to defaults');
        console.log('');
        console.log('🎨 Available skins (baseSprite): cowboy_plain, helmeted_shotgun, player_default, player_cowboy, player_red, player_blue');
        console.log('🎩 Available hats: hat_fedora, hat');
        console.log('🔫 Available guns (gunSprite): gun_revolver, gun_shotgun, gun_laser, gun');
        console.log('✨ Available overlays: overlay');
        console.log('');
        console.log('💡 Try: equipSkin(1, "cowboy_plain"); equipHat(1, "hat_fedora"); equipGun(2, "gun_shotgun")');
        console.log('💾 All changes are saved to localStorage automatically!');
    };

    // Legacy functions for backward compatibility
    window.changePlayerSkin = (playerNumber, skinName) => {
        console.warn('⚠️ changePlayerSkin is deprecated. Use equipSkin instead.');
        return window.duelGame.equipSkin(playerNumber, skinName);
    };

    window.addAccessory = (playerNumber, accessoryName) => {
        console.warn('⚠️ addAccessory is deprecated. Use equipHat or equipGun instead.');
        if (accessoryName === 'hat') {
            return window.duelGame.equipHat(playerNumber, accessoryName);
        } else if (accessoryName === 'gun') {
            return window.duelGame.equipGun(playerNumber, accessoryName);
        }
        return false;
    };

    window.removeAccessory = (playerNumber, accessoryName) => {
        console.warn('⚠️ removeAccessory is deprecated. Use unequipHat or unequipGun instead.');
        if (accessoryName === 'hat') {
            return window.duelGame.unequipHat(playerNumber);
        } else if (accessoryName === 'gun') {
            return window.duelGame.unequipGun(playerNumber);
        }
        return false;
    };

    window.getPlayerAppearance = (playerNumber) => {
        console.warn('⚠️ getPlayerAppearance is deprecated. Use getPlayerEquipment instead.');
        return window.duelGame.getPlayerEquipment(playerNumber);
    };

    window.debugSprites = () => {
        console.warn('⚠️ debugSprites is deprecated. Use debugEquipment instead.');
        return window.duelGame.debugEquipment();
    };

    window.demoSprites = () => {
        console.warn('⚠️ demoSprites is deprecated. Use demoStore instead.');
        return window.demoStore();
    };
    
    console.log('🎮 Wild West Duel Game ready to play!');
    console.log('🔧 Access game instance via window.duelGame for debugging');
    console.log('🔧 Pattern functions: debugInputQueue(), debugPatternManager(), demoInputQueue()');
    console.log('🎒 Equipment functions: debugEquipment(), equipSkin(), equipHat(), demoStore()');
    console.log('🪙 Coin functions: debugCoins(), getCoins(), addCoins(), demoCoins()');
    console.log('💾 Equipment and coins automatically save to localStorage!');
});


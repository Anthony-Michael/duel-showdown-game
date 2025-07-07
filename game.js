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
            length: config.length || 3,
            availableKeys: config.availableKeys || ['A', 'S', 'D', 'W', 'Q', 'E', 'Z', 'X', 'C'],
            displayTime: config.displayTime || 2000,
            penaltyTime: config.penaltyTime || 1000
        };
        
        // Player pattern states
        this.players = {
            player1: this.createPlayerState(),
            player2: this.createPlayerState()
        };
        
        // Input queue for game loop processing
        this.inputQueue = [];
        
        // UI elements (will be set by game)
        this.uiElements = {};
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
            isComplete: false
        };
    }

    /**
     * Set UI elements for pattern display
     */
    setUIElements(elements) {
        this.uiElements = elements;
    }

    /**
     * Generate unique patterns for both players
     */
    generatePatterns() {
        this.players.player1.pattern = this.generateRandomPattern();
        this.players.player2.pattern = this.generateRandomPattern();
        
        // Ensure patterns are different
        while (this.arraysEqual(this.players.player1.pattern, this.players.player2.pattern)) {
            this.players.player2.pattern = this.generateRandomPattern();
        }
        
        console.log('🎯 Generated patterns - Player 1:', this.players.player1.pattern, 'Player 2:', this.players.player2.pattern);
        return {
            player1: [...this.players.player1.pattern],
            player2: [...this.players.player2.pattern]
        };
    }

    /**
     * Generate a random pattern of unique keys
     */
    generateRandomPattern() {
        const pattern = [];
        const availableKeys = [...this.config.availableKeys];
        
        for (let i = 0; i < this.config.length; i++) {
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
     * Display patterns in UI
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
        
        // Initialize feedback messages
        this.initializeFeedbackMessages();
    }

    /**
     * Initialize feedback messages for both players
     */
    initializeFeedbackMessages() {
        const feedbackElements = [
            this.uiElements.player1FeedbackElement,
            this.uiElements.player2FeedbackElement
        ];
        
        feedbackElements.forEach(element => {
            if (element) {
                element.textContent = 'Memorize your pattern!';
                element.className = 'pattern-feedback';
            }
        });
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
            keyElement.textContent = key;
            keyElement.id = `${playerId}_key_${index}`;
            patternElement.appendChild(keyElement);
        });
    }

    /**
     * Update progress display for a player
     */
    updateProgressDisplay(playerId) {
        const player = this.players[playerId];
        const progressElement = this.uiElements[`${playerId}ProgressElement`];
        
        if (!progressElement) return;
        
        progressElement.textContent = `Progress: ${player.progress}/${this.config.length}`;
        progressElement.style.color = '#F5DEB3';
        
        // Update visual feedback for all keys
        this.updateKeyVisualStates(playerId);
        
        // Show progress feedback
        this.showProgressFeedback(playerId, player.progress);
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
     * Show progress feedback message
     */
    showProgressFeedback(playerId, progress) {
        const feedbackElement = this.uiElements[`${playerId}FeedbackElement`];
        if (!feedbackElement) return;
        
        const totalKeys = this.config.length;
        const percentage = Math.round((progress / totalKeys) * 100);
        
        if (progress === 0) {
            feedbackElement.textContent = 'Ready to start!';
            feedbackElement.className = 'pattern-feedback';
        } else if (progress < totalKeys) {
            feedbackElement.textContent = `${percentage}% Complete`;
            feedbackElement.className = 'pattern-feedback success';
        }
    }

    /**
     * Queue input for pattern validation (non-immediate processing)
     */
    queueInput(key, timestamp) {
        const upperKey = key.toUpperCase();
        
        if (!this.config.availableKeys.includes(upperKey)) {
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
     * Handle input for pattern validation (internal processing)
     */
    handleInput(key, gameState, isReadyState, timestamp = Date.now()) {
        const upperKey = key.toUpperCase();
        
        if (!isReadyState) {
            return this.handleEarlyInput(upperKey);
        }
        
        // Check which player this key belongs to
        const results = [];
        
        if (this.isValidInput('player1', upperKey)) {
            results.push(this.processInput('player1', upperKey, timestamp));
        }
        
        if (this.isValidInput('player2', upperKey)) {
            results.push(this.processInput('player2', upperKey, timestamp));
        }
        
        return results;
    }

    /**
     * Check if input is valid for a player
     */
    isValidInput(playerId, key) {
        const player = this.players[playerId];
        return !player.isDisqualified && 
               !player.isComplete && 
               player.progress < player.pattern.length && 
               player.pattern[player.progress] === key;
    }

    /**
     * Process valid input for a player
     */
    processInput(playerId, key, timestamp = Date.now()) {
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
     * Handle early input (before FIRE!)
     */
    handleEarlyInput(key) {
        if (!this.config.availableKeys.includes(key)) {
            return null;
        }
        
        console.warn(`⚠️ Early input detected: ${key}`);
        
        // Determine which player pressed early
        let playerId = null;
        
        if (this.players.player1.pattern.includes(key)) {
            playerId = 'player1';
        } else if (this.players.player2.pattern.includes(key)) {
            playerId = 'player2';
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
     * Check if a key belongs to any player's pattern
     */
    isPatternKey(key) {
        return this.config.availableKeys.includes(key.toUpperCase());
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
            queueLength: this.inputQueue.length,
            queuedInputs: [...this.inputQueue],
            hasQueuedInputs: this.inputQueue.length > 0
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
        this.initializeConstants();
        this.initializePatternManager();
        this.initializeGameState();
        this.initializeAudio();
        this.initializeVisualEffects();
        this.initializeEventListeners();
        
        // Start the game
        this.reset();
        this.startGameLoop();
        
        console.log('🤠 Wild West Duel Game initialized successfully!');
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
    }
    
    initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 400;
    }
    
    initializeConstants() {
        this.GAME_STATES = {
            WAITING: 'waiting',
            COUNTDOWN: 'countdown',
            PATTERN_SHOWN: 'pattern_shown', // New state when patterns are displayed
            READY: 'ready',
            FINISHED: 'finished'
        };
        
        this.PLAYER_CONFIG = {
            width: 60,
            height: 80,
            player1: { x: 150, y: 250, gunX: 200, gunY: 270 },
            player2: { x: 590, y: 250, gunX: 600, gunY: 270 }
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
        
        this.player1 = {
            ...this.PLAYER_CONFIG.player1,
            width: this.PLAYER_CONFIG.width,
            height: this.PLAYER_CONFIG.height,
            hasShot: false,
            shotTime: 0,
            // Pattern-related properties
            pattern: [],
            patternProgress: 0,
            isDisqualified: false,
            lastInputTime: 0
        };
        
        this.player2 = {
            ...this.PLAYER_CONFIG.player2,
            width: this.PLAYER_CONFIG.width,
            height: this.PLAYER_CONFIG.height,
            hasShot: false,
            shotTime: 0,
            // Pattern-related properties
            pattern: [],
            patternProgress: 0,
            isDisqualified: false,
            lastInputTime: 0
        };
        
        this.keys = {};
        this.currentPatterns = { player1: [], player2: [] };
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
     * Update feedback messages when game enters READY state
     */
    updateFeedbackForReadyState() {
        if (this.player1FeedbackElement) {
            this.player1FeedbackElement.textContent = 'Input your pattern now!';
            this.player1FeedbackElement.className = 'pattern-feedback';
        }
        
        if (this.player2FeedbackElement) {
            this.player2FeedbackElement.textContent = 'Input your pattern now!';
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
        // Draw body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        
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
        const gunX = direction === 1 ? player.x + player.width : player.x;
        this.ctx.fillRect(gunX, player.y + 20, gunLength * direction, 6);
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
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleInput(e.key.toLowerCase());
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
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
     * Handle results from PatternManager
     */
    handlePatternResult(result) {
        if (result.type === 'complete') {
            this.handlePatternComplete(result.playerId, result.timestamp);
        } else if (result.type === 'disqualified') {
            // Disqualification is already handled by PatternManager UI
            this.checkGameEnd();
        } else if (result.type === 'progress') {
            // Progress updates are handled by PatternManager UI
            // No additional action needed here
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
    // 🔄 RESET AND UI CONTROLS SECTION
    // ================================
    
    startCountdown() {
        this.gameState = this.GAME_STATES.COUNTDOWN;
        this.countdownValue = this.COUNTDOWN_DURATION;
        this.countdownTimer = Date.now();
        
        // Generate patterns at the start of countdown
        const patterns = this.patternManager.generatePatterns();
        
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
        this.player1.hasShot = false;
        this.player1.shotTime = 0;
        this.player1.pattern = [];
        this.player1.patternProgress = 0;
        this.player1.isDisqualified = false;
        this.player1.lastInputTime = 0;
        
        this.player2.hasShot = false;
        this.player2.shotTime = 0;
        this.player2.pattern = [];
        this.player2.patternProgress = 0;
        this.player2.isDisqualified = false;
        this.player2.lastInputTime = 0;
        
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
    
    console.log('🎮 Wild West Duel Game ready to play!');
    console.log('🔧 Access game instance via window.duelGame for debugging');
    console.log('🔧 Debug functions: debugInputQueue(), debugPatternManager(), demoInputQueue()');
});

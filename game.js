/**
 * Wild West Duel Game
 * A fast-paced two-player dueling game with spectacular visual effects
 * and comprehensive audio handling.
 * 
 * Author: Game Developer
 * Features: Muzzle flashes, bullet trails, sound effects, animations
 */

class DuelGame {
    // ================================
    // 🎮 INITIALIZATION SECTION
    // ================================
    
    constructor() {
        this.initializeDOM();
        this.initializeCanvas();
        this.initializeConstants();
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
    }
    
    initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 400;
    }
    
    initializeConstants() {
        this.GAME_STATES = {
            WAITING: 'waiting',
            COUNTDOWN: 'countdown', 
            READY: 'ready',
            FINISHED: 'finished'
        };
        
        this.PLAYER_CONFIG = {
            width: 60,
            height: 80,
            player1: { x: 150, y: 250, gunX: 200, gunY: 270 },
            player2: { x: 590, y: 250, gunX: 600, gunY: 270 }
        };
        
        this.ANIMATION_DURATION = 200; // ms
        this.COUNTDOWN_DURATION = 3;
        this.GAME_TIMEOUT = 2000; // ms
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
        
        this.player1 = {
            ...this.PLAYER_CONFIG.player1,
            width: this.PLAYER_CONFIG.width,
            height: this.PLAYER_CONFIG.height,
            hasShot: false,
            shotTime: 0
        };
        
        this.player2 = {
            ...this.PLAYER_CONFIG.player2,
            width: this.PLAYER_CONFIG.width,
            height: this.PLAYER_CONFIG.height,
            hasShot: false,
            shotTime: 0
        };
        
        this.keys = {};
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
        if (this.gameState === this.GAME_STATES.WAITING) {
            if (key === 'a' || key === 'l') {
                this.startCountdown();
            }
        } else if (this.gameState === this.GAME_STATES.READY) {
            if (key === 'a' && !this.player1.hasShot) {
                this.shootPlayer(this.player1, 1);
            } else if (key === 'l' && !this.player2.hasShot) {
                this.shootPlayer(this.player2, -1);
            }
        } else {
            // Handle early shots with explicit feedback
            if (key === 'a' || key === 'l') {
                const playerName = key === 'a' ? 'Player 1' : 'Player 2';
                console.warn(`${playerName} shot too early! Current state: ${this.gameState}`);
            }
        }
    }
    
    shootPlayer(player, direction) {
        // Extra safety check: Prevent shooting if not in 'ready' state
        if (this.gameState !== this.GAME_STATES.READY) {
            console.warn('Early shot attempt blocked - game not ready');
            return;
        }
        
        player.hasShot = true;
        player.shotTime = Date.now();
        
        // Play gunshot sound effect (only for valid shots after "FIRE!")
        this.playGunshotSound();
        
        // Create muzzle flash
        const muzzleFlash = new MuzzleFlash(player.gunX, player.gunY, direction);
        this.muzzleFlashes.push(muzzleFlash);
        
        // Create bullet trail
        const startX = player.gunX;
        const startY = player.gunY;
        const endX = direction === 1 ? this.canvas.width - 50 : 50;
        const endY = startY + (Math.random() - 0.5) * 40; // Slight random trajectory
        
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
        this.countdown();
    }
    
    countdown() {
        if (this.countdownValue > 0) {
            this.countdownElement.textContent = this.countdownValue;
            this.countdownValue--;
            this.countdownTimeoutId = setTimeout(() => this.countdown(), 1000);
        } else {
            this.countdownElement.textContent = 'FIRE!';
            this.gameState = this.GAME_STATES.READY;
            this.gameEndTimeoutId = setTimeout(() => {
                if (this.gameState === this.GAME_STATES.READY) {
                    // Nobody shot in time
                    this.gameState = this.GAME_STATES.FINISHED;
                    this.resultElement.textContent = 'Too slow!';
                    this.playAgainBtn.classList.add('show');
                }
            }, this.GAME_TIMEOUT);
        }
    }
    
    checkGameEnd() {
        if (this.player1.hasShot || this.player2.hasShot) {
            this.gameState = this.GAME_STATES.FINISHED;
            
            if (this.player1.hasShot && this.player2.hasShot) {
                // Both shot, determine winner by time
                const timeDiff = Math.abs(this.player1.shotTime - this.player2.shotTime);
                if (timeDiff < 50) { // Within 50ms is a draw
                    this.resultElement.textContent = 'Draw!';
                } else if (this.player1.shotTime < this.player2.shotTime) {
                    this.resultElement.textContent = 'Player 1 Wins!';
                } else {
                    this.resultElement.textContent = 'Player 2 Wins!';
                }
            } else if (this.player1.hasShot) {
                this.resultElement.textContent = 'Player 1 Wins!';
            } else {
                this.resultElement.textContent = 'Player 2 Wins!';
            }
            
            // Show the Play Again button
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
    }
    
    resetPlayers() {
        this.player1.hasShot = false;
        this.player1.shotTime = 0;
        this.player2.hasShot = false;
        this.player2.shotTime = 0;
    }
    
    resetUI() {
        this.countdownElement.textContent = 'Press A or L to start!';
        this.resultElement.textContent = '';
        this.playAgainBtn.classList.remove('show');
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
    
    console.log('🎮 Wild West Duel Game ready to play!');
    console.log('🔧 Access game instance via window.duelGame for debugging');
});

// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const countdownElement = document.getElementById('countdown');
const resultElement = document.getElementById('result');
const playAgainBtn = document.getElementById('playAgainBtn');

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// Audio setup - Enhanced gunshot sound handling with comprehensive error handling
// Features: preloading, load state tracking, early shot prevention, detailed error reporting
const gunshotSound = new Audio('assets/gunshot.mp3');
gunshotSound.preload = 'auto';
gunshotSound.volume = 0.7; // Set volume to 70%

// Audio loading state tracking
let audioLoaded = false;
let audioError = false;
let audioLoadAttempted = false;

// Enhanced audio loading event handlers
gunshotSound.addEventListener('canplaythrough', () => {
    audioLoaded = true;
    audioError = false;
    console.log('Gunshot sound loaded successfully');
});

gunshotSound.addEventListener('error', (e) => {
    audioError = true;
    audioLoaded = false;
    console.warn('Gunshot sound file failed to load:', e.type, 'Game will continue without sound.');
});

gunshotSound.addEventListener('loadstart', () => {
    audioLoadAttempted = true;
    console.log('Starting to load gunshot sound...');
});

gunshotSound.addEventListener('loadeddata', () => {
    console.log('Gunshot sound data loaded');
});

// Preload the audio with error handling
try {
    gunshotSound.load();
} catch (error) {
    console.warn('Failed to initiate audio loading:', error.message);
    audioError = true;
}

// Game state
let gameState = 'waiting'; // 'waiting', 'countdown', 'ready', 'finished'
let countdownTimer = 0;
let countdownValue = 3;

// Timeout tracking for cleanup
let countdownTimeoutId = null;
let gameEndTimeoutId = null;

// Players
const player1 = {
    x: 150,
    y: 250,
    width: 60,
    height: 80,
    gunX: 200,
    gunY: 270,
    hasShot: false,
    shotTime: 0
};

const player2 = {
    x: 590,
    y: 250,
    width: 60,
    height: 80,
    gunX: 600,
    gunY: 270,
    hasShot: false,
    shotTime: 0
};

// Visual effects arrays
const muzzleFlashes = [];
const bulletTrails = [];

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

    draw() {
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

    draw() {
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

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    handleInput(e.key.toLowerCase());
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Play Again button event listener
playAgainBtn.addEventListener('click', () => {
    resetGame();
});

function handleInput(key) {
    if (gameState === 'waiting') {
        if (key === 'a' || key === 'l') {
            startCountdown();
        }
    } else if (gameState === 'ready') {
        if (key === 'a' && !player1.hasShot) {
            shootPlayer(player1, 1);
        } else if (key === 'l' && !player2.hasShot) {
            shootPlayer(player2, -1);
        }
    } else {
        // Handle early shots with explicit feedback
        if (key === 'a' || key === 'l') {
            const playerName = key === 'a' ? 'Player 1' : 'Player 2';
            console.warn(`${playerName} shot too early! Current state: ${gameState}`);
            
            // Optional: Could add visual feedback here for early shots
            // e.g., flash red border, show "TOO EARLY!" message, etc.
        }
    }
}

function shootPlayer(player, direction) {
    // Extra safety check: Prevent shooting if not in 'ready' state
    if (gameState !== 'ready') {
        console.warn('Early shot attempt blocked - game not ready');
        return;
    }
    
    player.hasShot = true;
    player.shotTime = Date.now();
    
    // Play gunshot sound effect (only for valid shots after "FIRE!")
    playGunshotSound();
    
    // Create muzzle flash
    const muzzleFlash = new MuzzleFlash(player.gunX, player.gunY, direction);
    muzzleFlashes.push(muzzleFlash);
    
    // Create bullet trail
    const startX = player.gunX;
    const startY = player.gunY;
    const endX = direction === 1 ? canvas.width - 50 : 50;
    const endY = startY + (Math.random() - 0.5) * 40; // Slight random trajectory
    
    const bulletTrail = new BulletTrail(startX, startY, endX, endY);
    bulletTrails.push(bulletTrail);
    
    checkGameEnd();
}

function playGunshotSound() {
    // Check if audio is available and loaded
    if (audioError) {
        console.warn('Cannot play gunshot sound - audio failed to load');
        return;
    }
    
    if (!audioLoaded && audioLoadAttempted) {
        console.warn('Cannot play gunshot sound - audio still loading');
        return;
    }
    
    if (!audioLoadAttempted) {
        console.warn('Cannot play gunshot sound - audio not initialized');
        return;
    }
    
    try {
        // Check if audio element is in a valid state
        if (gunshotSound.readyState < 2) { // HAVE_CURRENT_DATA
            console.warn('Cannot play gunshot sound - insufficient audio data loaded');
            return;
        }
        
        // Reset the audio to the beginning in case it's already played
        gunshotSound.currentTime = 0;
        
        // Play the sound
        const playPromise = gunshotSound.play();
        
        // Handle promise rejection (modern browsers require user interaction first)
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Gunshot sound played successfully');
            }).catch(error => {
                if (error.name === 'NotAllowedError') {
                    console.warn('Gunshot sound blocked by browser - user interaction required first');
                } else if (error.name === 'AbortError') {
                    console.warn('Gunshot sound playback aborted');
                } else {
                    console.warn('Could not play gunshot sound:', error.name, error.message);
                }
            });
        }
    } catch (error) {
        console.warn('Error attempting to play gunshot sound:', error.message);
        
        // If there's a critical error, mark audio as failed
        if (error.name === 'InvalidStateError' || error.name === 'NotSupportedError') {
            audioError = true;
            console.warn('Audio marked as failed due to critical error');
        }
    }
}

// Audio diagnostics and retry function
function getAudioStatus() {
    return {
        loaded: audioLoaded,
        error: audioError,
        loadAttempted: audioLoadAttempted,
        readyState: gunshotSound.readyState,
        networkState: gunshotSound.networkState,
        currentTime: gunshotSound.currentTime,
        duration: gunshotSound.duration || 'unknown'
    };
}

// Optional: Function to retry audio loading if it failed
function retryAudioLoad() {
    if (audioError && audioLoadAttempted) {
        console.log('Retrying audio load...');
        audioError = false;
        audioLoaded = false;
        
        try {
            gunshotSound.load();
        } catch (error) {
            console.warn('Audio retry failed:', error.message);
            audioError = true;
        }
    }
}

function startCountdown() {
    gameState = 'countdown';
    countdownValue = 3;
    countdownTimer = Date.now();
    countdown();
}

function countdown() {
    if (countdownValue > 0) {
        countdownElement.textContent = countdownValue;
        countdownValue--;
        countdownTimeoutId = setTimeout(countdown, 1000);
    } else {
        countdownElement.textContent = 'FIRE!';
        gameState = 'ready';
        gameEndTimeoutId = setTimeout(() => {
            if (gameState === 'ready') {
                // Nobody shot in time
                gameState = 'finished';
                resultElement.textContent = 'Too slow!';
                playAgainBtn.classList.add('show');
            }
        }, 2000);
    }
}

function checkGameEnd() {
    if (player1.hasShot || player2.hasShot) {
        gameState = 'finished';
        
        if (player1.hasShot && player2.hasShot) {
            // Both shot, determine winner by time
            const timeDiff = Math.abs(player1.shotTime - player2.shotTime);
            if (timeDiff < 50) { // Within 50ms is a draw
                resultElement.textContent = 'Draw!';
            } else if (player1.shotTime < player2.shotTime) {
                resultElement.textContent = 'Player 1 Wins!';
            } else {
                resultElement.textContent = 'Player 2 Wins!';
            }
        } else if (player1.hasShot) {
            resultElement.textContent = 'Player 1 Wins!';
        } else {
            resultElement.textContent = 'Player 2 Wins!';
        }
        
        // Show the Play Again button
        playAgainBtn.classList.add('show');
    }
}

function resetGame() {
    // Clear any pending timeouts/intervals
    if (countdownTimeoutId) {
        clearTimeout(countdownTimeoutId);
        countdownTimeoutId = null;
    }
    if (gameEndTimeoutId) {
        clearTimeout(gameEndTimeoutId);
        gameEndTimeoutId = null;
    }
    
    // Reset game state variables
    gameState = 'waiting';
    countdownValue = 3;
    countdownTimer = 0;
    
    // Reset player states
    player1.hasShot = false;
    player1.shotTime = 0;
    player2.hasShot = false;
    player2.shotTime = 0;
    
    // Clear and reset UI elements
    countdownElement.textContent = 'Press A or L to start!';
    resultElement.textContent = '';
    
    // Hide the result and play again button
    playAgainBtn.classList.remove('show');
    
    // Clear all visual effects arrays
    muzzleFlashes.length = 0;
    bulletTrails.length = 0;
    
    // Reset audio (stop any playing sounds)
    try {
        if (!audioError && gunshotSound.readyState >= 1) { // HAVE_METADATA
            gunshotSound.pause();
            gunshotSound.currentTime = 0;
            console.log('Audio reset successfully');
        } else if (audioError) {
            console.warn('Skipping audio reset - audio is in error state');
        } else {
            console.warn('Skipping audio reset - audio not ready');
        }
    } catch (error) {
        // Ignore audio reset errors but log them for debugging
        console.warn('Audio reset warning:', error.message);
        
        // If reset fails critically, mark audio as having issues
        if (error.name === 'InvalidStateError') {
            console.warn('Audio may be in an invalid state');
        }
    }
    
    // Clear canvas explicitly (will be redrawn in next frame)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Note: Event listeners are managed globally and don't need rebinding
    // The keydown/keyup listeners are attached once at startup and handle
    // all game states appropriately based on the current gameState variable
}

function drawPlayer(player, direction) {
    ctx.fillStyle = '#8B4513';
    
    // Draw body
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw head
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(player.x + 15, player.y - 20, 30, 25);
    
    // Draw hat
    ctx.fillStyle = '#2F1B14';
    ctx.fillRect(player.x + 10, player.y - 25, 40, 8);
    ctx.fillRect(player.x + 15, player.y - 30, 30, 8);
    
    // Draw gun
    ctx.fillStyle = '#444444';
    const gunLength = 40;
    const gunX = direction === 1 ? player.x + player.width : player.x;
    ctx.fillRect(gunX, player.y + 20, gunLength * direction, 6);
}

function updateVisualEffects() {
    // Update muzzle flashes
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        if (!muzzleFlashes[i].update()) {
            muzzleFlashes.splice(i, 1);
        }
    }
    
    // Update bullet trails
    for (let i = bulletTrails.length - 1; i >= 0; i--) {
        if (!bulletTrails[i].update()) {
            bulletTrails.splice(i, 1);
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background elements
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // Ground
    
    // Draw sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw players
    drawPlayer(player1, 1);
    drawPlayer(player2, -1);
    
    // Draw visual effects
    muzzleFlashes.forEach(flash => flash.draw());
    bulletTrails.forEach(trail => trail.draw());
    
    // Update visual effects
    updateVisualEffects();
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize game
resetGame();
gameLoop();

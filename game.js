// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const countdownElement = document.getElementById('countdown');
const resultElement = document.getElementById('result');
const playAgainBtn = document.getElementById('playAgainBtn');

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// Audio setup - preload gunshot sound
const gunshotSound = new Audio('assets/gunshot.mp3');
gunshotSound.preload = 'auto';
gunshotSound.volume = 0.7; // Set volume to 70%

// Handle audio loading errors gracefully
gunshotSound.addEventListener('error', () => {
    console.warn('Gunshot sound file not found. Game will continue without sound.');
});

// Preload the audio
gunshotSound.load();

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

// Muzzle flash class
class MuzzleFlash {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 1 for right, -1 for left
        this.startTime = Date.now();
        this.duration = 200; // 200ms as requested
        this.maxSize = 30;
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        return elapsed < this.duration;
    }

    draw() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;
        const size = this.maxSize * (1 - progress * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Bright flash circles
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.3, '#FF6600');
        gradient.addColorStop(1, '#FF0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle effect with small circles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const sparkleX = this.x + Math.cos(angle) * size * 0.7;
            const sparkleY = this.y + Math.sin(angle) * size * 0.7;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        
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
    }
}

function shootPlayer(player, direction) {
    player.hasShot = true;
    player.shotTime = Date.now();
    
    // Play gunshot sound effect (only plays for valid shots after "FIRE!")
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
    try {
        // Reset the audio to the beginning in case it's already played
        gunshotSound.currentTime = 0;
        
        // Play the sound
        const playPromise = gunshotSound.play();
        
        // Handle promise rejection (modern browsers require user interaction first)
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Could not play gunshot sound:', error.message);
            });
        }
    } catch (error) {
        console.warn('Error playing gunshot sound:', error.message);
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
        gunshotSound.pause();
        gunshotSound.currentTime = 0;
    } catch (error) {
        // Ignore audio reset errors
        console.warn('Audio reset warning:', error.message);
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

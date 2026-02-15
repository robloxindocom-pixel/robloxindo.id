/**
 * Professional Particle Text Effect System
 * Modular, scalable, and performance-optimized
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  canvas: {
    id: 'particle-canvas',
    bgColor: '#000000'
  },
  text: {
    id: 'text-effect',
    content: 'HELLO WORLD',
    font: 'bold 70px Arial',
    color: '#ffffff',
    samplingGap: 6 // Pixel sampling density
  },
  particles: {
    count: 500,
    minSize: 1,
    maxSize: 5,
    hueRange: { min: 20, max: 40 }, // Orange to yellow
    saturation: 100,
    lightness: 65,
    maxSpeed: 4,
    formSpeed: 0.05,
    explosionSpeed: { min: 3, max: 8 },
    driftStrength: 0.2,
    targetFPS: 60
  },
  mouse: {
    radius: 150,
    repelStrength: 0.06,
    repelRange: 3
  },
  animation: {
    formDelay: 1000, // ms before particles start forming text
    formThreshold: 8, // Distance to consider "formed"
    clickExplosionCount: 150
  },
  audio: {
    explosion: 'https://assets.mixkit.co/sfx/preview/mixkit-whoosh-whoosh-3000.mp3',
    click: 'https://assets.mixkit.co/sfx/preview/mixkit-small-impact-674.mp3',
    preload: true
  }
};

// ============================================================================
// UTILITIES
// ============================================================================

const Utils = {
  /**
   * Generate random number in range
   */
  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Calculate distance between two points
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Clamp value between min and max
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Generate HSL color
   */
  hslColor(hue, saturation, lightness) {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  },

  /**
   * Random HSL color from config
   */
  randomParticleColor() {
    const hue = this.random(
      CONFIG.particles.hueRange.min,
      CONFIG.particles.hueRange.max
    );
    return this.hslColor(hue, CONFIG.particles.saturation, CONFIG.particles.lightness);
  }
};

// ============================================================================
// AUDIO MANAGER
// ============================================================================

class AudioManager {
  constructor() {
    this.sounds = {};
    this.initialized = false;
  }

  /**
   * Initialize audio assets
   */
  init() {
    if (this.initialized) return;

    this.sounds.explosion = new Audio(CONFIG.audio.explosion);
    this.sounds.click = new Audio(CONFIG.audio.click);

    if (CONFIG.audio.preload) {
      Object.values(this.sounds).forEach(sound => {
        sound.preload = 'auto';
      });
    }

    this.initialized = true;
  }

  /**
   * Play sound with error handling
   */
  play(soundName) {
    if (!this.sounds[soundName]) return;
    
    this.sounds[soundName].currentTime = 0;
    this.sounds[soundName].play().catch(err => {
      console.warn(`Audio playback blocked: ${soundName}`, err);
    });
  }
}

// ============================================================================
// PARTICLE CLASS
// ============================================================================

class Particle {
  constructor(x, y, targetX = null, targetY = null) {
    this.x = x;
    this.y = y;
    this.targetX = targetX || x;
    this.targetY = targetY || y;
    this.speedX = 0;
    this.speedY = 0;
    this.size = Utils.random(CONFIG.particles.minSize, CONFIG.particles.maxSize);
    this.color = Utils.randomParticleColor();
    this.isActive = true;
  }

  /**
   * Draw particle on canvas
   */
  draw(ctx) {
    if (!this.isActive) return;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  /**
   * Update particle position based on current state
   */
  update(deltaTime, state, mouse, canvasWidth, canvasHeight) {
    const dtFactor = deltaTime * CONFIG.particles.targetFPS;

    switch (state) {
      case 'forming':
        this.updateForming(dtFactor);
        break;
      case 'exploding':
        this.updateExploding(dtFactor);
        break;
      case 'interactive':
        this.updateInteractive(dtFactor, mouse, canvasWidth, canvasHeight);
        break;
    }
  }

  /**
   * Move towards target position (forming text)
   */
  updateForming(dtFactor) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Utils.distance(this.x, this.y, this.targetX, this.targetY);

    if (distance > 1) {
      this.x += dx * CONFIG.particles.formSpeed * dtFactor;
      this.y += dy * CONFIG.particles.formSpeed * dtFactor;
    }
  }

  /**
   * Explode in random direction
   */
  updateExploding(dtFactor) {
    // Initialize explosion velocity once
    if (this.speedX === 0 && this.speedY === 0) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.random(
        CONFIG.particles.explosionSpeed.min,
        CONFIG.particles.explosionSpeed.max
      );
      this.speedX = Math.cos(angle) * speed;
      this.speedY = Math.sin(angle) * speed;
    }

    this.x += this.speedX * dtFactor;
    this.y += this.speedY * dtFactor;
  }

  /**
   * Interactive movement with mouse repulsion and drift
   */
  updateInteractive(dtFactor, mouse, canvasWidth, canvasHeight) {
    // Mouse repulsion
    if (mouse.x !== undefined && mouse.y !== undefined) {
      const distance = Utils.distance(this.x, this.y, mouse.x, mouse.y);

      if (distance < CONFIG.mouse.radius) {
        const force = (CONFIG.mouse.radius - distance) / CONFIG.mouse.radius;
        const strength = (1 - force) * CONFIG.mouse.repelRange;
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;

        this.speedX -= dx * force * CONFIG.mouse.repelStrength * strength * dtFactor;
        this.speedY -= dy * force * CONFIG.mouse.repelStrength * strength * dtFactor;
      }
    }

    // Random drift
    this.speedX += (Math.random() - 0.5) * CONFIG.particles.driftStrength * dtFactor;
    this.speedY += (Math.random() - 0.5) * CONFIG.particles.driftStrength * dtFactor;

    // Clamp speed
    this.speedX = Utils.clamp(this.speedX, -CONFIG.particles.maxSpeed, CONFIG.particles.maxSpeed);
    this.speedY = Utils.clamp(this.speedY, -CONFIG.particles.maxSpeed, CONFIG.particles.maxSpeed);

    // Update position
    this.x += this.speedX * dtFactor;
    this.y += this.speedY * dtFactor;

    // Screen wrapping
    if (this.x < 0) this.x = canvasWidth;
    if (this.x > canvasWidth) this.x = 0;
    if (this.y < 0) this.y = canvasHeight;
    if (this.y > canvasHeight) this.y = 0;
  }

  /**
   * Check if particle is close to target
   */
  isNearTarget() {
    const distance = Utils.distance(this.x, this.y, this.targetX, this.targetY);
    return distance < CONFIG.animation.formThreshold;
  }
}

// ============================================================================
// PARTICLE SYSTEM MANAGER
// ============================================================================

class ParticleSystem {
  constructor(canvas, textElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.textElement = textElement;
    
    // State
    this.particles = [];
    this.textTargets = [];
    this.state = 'idle'; // idle, forming, exploding, interactive
    
    // Mouse tracking
    this.mouse = {
      x: undefined,
      y: undefined
    };

    // Timing
    this.lastTime = 0;

    // Audio
    this.audio = new AudioManager();
    this.audio.init();

    this.init();
  }

  /**
   * Initialize the particle system
   */
  init() {
    this.resizeCanvas();
    this.extractTextTargets();
    this.createParticles();
    this.setupEventListeners();
    
    // Start forming after delay
    setTimeout(() => {
      this.state = 'forming';
      this.assignTargetsToParticles();
    }, CONFIG.animation.formDelay);
  }

  /**
   * Resize canvas to window size
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Extract pixel positions from text
   */
  extractTextTargets() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    tempCtx.font = CONFIG.text.font;
    tempCtx.fillStyle = CONFIG.text.color;
    
    const text = this.textElement.textContent;
    const metrics = tempCtx.measureText(text);
    const x = (this.canvas.width - metrics.width) / 2;
    const y = this.canvas.height / 2;

    tempCtx.fillText(text, x, y);

    const imageData = tempCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;

    // Sample pixels to create targets
    for (let y = 0; y < this.canvas.height; y += CONFIG.text.samplingGap) {
      for (let x = 0; x < this.canvas.width; x += CONFIG.text.samplingGap) {
        const index = (y * this.canvas.width + x) * 4;
        const alpha = pixels[index + 3];

        if (alpha > 0) {
          this.textTargets.push({ x, y });
        }
      }
    }

    // Randomize target order for organic formation
    this.textTargets.sort(() => Math.random() - 0.5);
  }

  /**
   * Create initial particles scattered around screen
   */
  createParticles() {
    for (let i = 0; i < CONFIG.particles.count; i++) {
      const x = Utils.random(-this.canvas.width, this.canvas.width * 2);
      const y = Utils.random(-this.canvas.height, this.canvas.height * 2);
      this.particles.push(new Particle(x, y));
    }
  }

  /**
   * Assign text target positions to particles
   */
  assignTargetsToParticles() {
    const maxAssign = Math.min(this.particles.length, this.textTargets.length);
    
    for (let i = 0; i < maxAssign; i++) {
      this.particles[i].targetX = this.textTargets[i].x;
      this.particles[i].targetY = this.textTargets[i].y;
    }
  }

  /**
   * Add explosion particles at position
   */
  addExplosion(x, y, count = CONFIG.animation.clickExplosionCount) {
    for (let i = 0; i < count; i++) {
      const particle = new Particle(x, y, x, y);
      this.particles.push(particle);
    }
    this.audio.play('click');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Click explosion
    window.addEventListener('click', (e) => {
      if (this.state === 'interactive') {
        this.addExplosion(e.clientX, e.clientY);
      }
    });

    // Resize handling
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.extractTextTargets();
      this.assignTargetsToParticles();
    });
  }

  /**
   * Check if all particles have formed text
   */
  checkTextFormed() {
    if (this.state !== 'forming') return false;

    const allFormed = this.particles.every(p => p.isNearTarget());

    if (allFormed) {
      this.state = 'exploding';
      this.textElement.style.opacity = 1;
      this.audio.play('explosion');
      
      // Transition to interactive after brief explosion
      setTimeout(() => {
        this.state = 'interactive';
      }, 800);

      return true;
    }

    return false;
  }

  /**
   * Update all particles
   */
  update(deltaTime) {
    this.particles.forEach(particle => {
      particle.update(
        deltaTime,
        this.state,
        this.mouse,
        this.canvas.width,
        this.canvas.height
      );
    });

    this.checkTextFormed();
  }

  /**
   * Draw all particles
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(particle => particle.draw(this.ctx));
  }

  /**
   * Animation loop
   */
  animate(currentTime) {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame((time) => this.animate(time));
  }

  /**
   * Start the animation
   */
  start() {
    requestAnimationFrame((time) => {
      this.lastTime = time;
      this.animate(time);
    });
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById(CONFIG.canvas.id);
  const textElement = document.getElementById(CONFIG.text.id);

  if (!canvas || !textElement) {
    console.error('Required elements not found. Please check HTML structure.');
    return;
  }

  const particleSystem = new ParticleSystem(canvas, textElement);
  particleSystem.start();
});

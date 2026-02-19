/**
 * Weather Effects Module
 * Advanced visual effects for weather cards
 * Integrates with Weather Ultimate
 */

class WeatherCardEffects {
    constructor() {
        this.activeEffects = new Map();
        this.particlePool = [];
        this.maxParticles = 100;
        this.initialized = false;
        // Skip heavy effects on touch devices (performance + scroll fix)
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.init();
    }

    init() {
        // On touch devices, skip all particle effects to prevent scroll issues
        if (this.isTouchDevice) {
            this.initialized = true;
            this.connectToWeatherApp();
            console.log('🌦️ Weather Effects: touch device detected, effects disabled');
            return;
        }

        // Create effects container
        this.createEffectsContainer();

        // Initialize particle pool
        this.initializeParticlePool();

        // Setup resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Connect to main app
        this.connectToWeatherApp();

        this.initialized = true;
        console.log('🌦️ Weather Effects initialized');
    }

    createEffectsContainer() {
        // Remove existing container if any
        const existing = document.getElementById('weather-effects-container');
        if (existing) existing.remove();

        this.container = document.createElement('div');
        this.container.id = 'weather-effects-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
        `;
        document.body.appendChild(this.container);

        // Add effect styles
        this.addEffectStyles();
    }

    addEffectStyles() {
        if (document.getElementById('weather-effects-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'weather-effects-styles';
        styles.textContent = `
            .weather-particle {
                position: absolute;
                pointer-events: none;
                will-change: transform;
                z-index: 1;
            }

            .raindrop {
                width: 2px;
                height: 15px;
                background: linear-gradient(to bottom, transparent, rgba(174, 197, 255, 0.6));
                border-radius: 0 0 2px 2px;
                animation: rain-fall linear infinite;
            }

            @keyframes rain-fall {
                to {
                    transform: translateY(100vh);
                }
            }

            .snowflake {
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.9), transparent);
                border-radius: 50%;
                animation: snow-fall linear infinite;
            }

            @keyframes snow-fall {
                0% {
                    transform: translateY(-10px) translateX(0) rotate(0deg);
                }
                100% {
                    transform: translateY(100vh) translateX(50px) rotate(360deg);
                }
            }

            .lightning {
                position: absolute;
                width: 100%;
                height: 100%;
                background: linear-gradient(to bottom, 
                    transparent 0%, 
                    rgba(255, 255, 255, 0.8) 45%, 
                    rgba(255, 255, 255, 1) 50%, 
                    rgba(255, 255, 255, 0.8) 55%, 
                    transparent 100%);
                opacity: 0;
                filter: blur(1px);
                transform: scaleX(0.5);
                animation: lightning-flash 0.2s ease-out;
            }

            @keyframes lightning-flash {
                0% {
                    opacity: 0;
                    transform: scaleX(0.5);
                }
                50% {
                    opacity: 1;
                    transform: scaleX(1);
                }
                100% {
                    opacity: 0;
                    transform: scaleX(1.5);
                }
            }

            .fog-layer {
                position: absolute;
                width: 120%;
                height: 100%;
                left: -10%;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(200, 200, 200, 0.4), 
                    transparent);
                filter: blur(20px);
                animation: fog-drift 20s ease-in-out infinite;
            }

            @keyframes fog-drift {
                0%, 100% {
                    transform: translateX(-20%);
                }
                50% {
                    transform: translateX(20%);
                }
            }

            .sunray {
                position: absolute;
                width: 2px;
                height: 100%;
                background: linear-gradient(to bottom, 
                    transparent, 
                    rgba(255, 215, 0, 0.3), 
                    transparent);
                transform-origin: top center;
                animation: sunray-rotate 10s linear infinite;
            }

            @keyframes sunray-rotate {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }

            .cloud-shadow {
                position: absolute;
                width: 100px;
                height: 40px;
                background: radial-gradient(ellipse, 
                    rgba(100, 100, 100, 0.2), 
                    transparent);
                filter: blur(10px);
                animation: cloud-drift 15s ease-in-out infinite;
            }

            @keyframes cloud-drift {
                0%, 100% {
                    transform: translateX(-50px);
                    opacity: 0.3;
                }
                50% {
                    transform: translateX(calc(100% + 50px));
                    opacity: 0.6;
                }
            }

            .weather-card.rain-effect {
                position: relative;
                overflow: hidden;
            }

            .weather-card.rain-effect::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(to bottom, 
                    transparent 0%, 
                    rgba(100, 150, 200, 0.1) 100%);
                pointer-events: none;
                z-index: 1;
            }

            .thunder-shake {
                animation: thunder-shake 0.3s ease-out;
            }

            @keyframes thunder-shake {
                0%, 100% {
                    transform: translateX(0);
                }
                10%, 30%, 50%, 70%, 90% {
                    transform: translateX(-2px);
                }
                20%, 40%, 60%, 80% {
                    transform: translateX(2px);
                }
            }

            .weather-card-canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 2;
            }

            .drizzle-particle {
                width: 1px;
                height: 8px;
                background: rgba(174, 197, 255, 0.4);
                animation: drizzle-fall linear infinite;
            }

            @keyframes drizzle-fall {
                to {
                    transform: translateY(100vh) translateX(20px);
                }
            }

            .hail-particle {
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #f0f0f0, #d0d0d0);
                border-radius: 50%;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                animation: hail-fall linear infinite;
            }

            @keyframes hail-fall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    initializeParticlePool() {
        // Pre-create particles for better performance
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'weather-particle';
            particle.style.display = 'none';
            this.container.appendChild(particle);
            this.particlePool.push(particle);
        }
    }

    getParticle() {
        // Get unused particle from pool
        return this.particlePool.find(p => p.style.display === 'none') || null;
    }

    releaseParticle(particle) {
        // Return particle to pool
        particle.style.display = 'none';
        particle.className = 'weather-particle';
        particle.style = 'display: none;';
    }

    createCardEffect(card, weatherType) {
        // Skip on touch devices
        if (this.isTouchDevice) return;

        // Remove existing effects
        this.removeCardEffect(card);

        const weatherKey = weatherType.toLowerCase();
        const cardRect = card.getBoundingClientRect();
        
        // Store effect info
        const effectInfo = {
            card,
            weatherType: weatherKey,
            particles: [],
            intervals: [],
            canvases: []
        };

        switch (weatherKey) {
            case 'rain':
                this.createRainEffect(card, cardRect, effectInfo);
                break;
            case 'snow':
                this.createSnowEffect(card, cardRect, effectInfo);
                break;
            case 'thunderstorm':
                this.createThunderstormEffect(card, cardRect, effectInfo);
                break;
            case 'drizzle':
                this.createDrizzleEffect(card, cardRect, effectInfo);
                break;
            case 'clouds':
                this.createCloudsEffect(card, cardRect, effectInfo);
                break;
            case 'clear':
                this.createClearEffect(card, cardRect, effectInfo);
                break;
            case 'mist':
            case 'fog':
            case 'haze':
                this.createFogEffect(card, cardRect, effectInfo);
                break;
            default:
                console.log(`No effect for weather: ${weatherKey}`);
        }

        // Store effect
        this.activeEffects.set(card, effectInfo);
    }

    createRainEffect(card, rect, effectInfo) {
        card.classList.add('rain-effect');
        
        const createRaindrop = () => {
            const particle = this.getParticle();
            if (!particle) return;

            particle.className = 'weather-particle raindrop';
            particle.style.cssText = `
                display: block;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top - 20}px;
                animation-duration: ${0.5 + Math.random() * 0.5}s;
                opacity: ${0.3 + Math.random() * 0.4};
            `;

            effectInfo.particles.push(particle);

            // Auto-remove after animation
            setTimeout(() => {
                this.releaseParticle(particle);
                const index = effectInfo.particles.indexOf(particle);
                if (index > -1) effectInfo.particles.splice(index, 1);
            }, 1000);
        };

        // Create rain particles periodically
        const interval = setInterval(createRaindrop, 50);
        effectInfo.intervals.push(interval);

        // Add splash effect canvas
        this.addSplashCanvas(card, effectInfo);
    }

    createSnowEffect(card, rect, effectInfo) {
        const createSnowflake = () => {
            const particle = this.getParticle();
            if (!particle) return;

            particle.className = 'weather-particle snowflake';
            const size = 4 + Math.random() * 4;
            particle.style.cssText = `
                display: block;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top - 20}px;
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${3 + Math.random() * 2}s;
                opacity: ${0.4 + Math.random() * 0.4};
                filter: blur(${Math.random() * 0.5}px);
            `;

            effectInfo.particles.push(particle);

            setTimeout(() => {
                this.releaseParticle(particle);
                const index = effectInfo.particles.indexOf(particle);
                if (index > -1) effectInfo.particles.splice(index, 1);
            }, 5000);
        };

        const interval = setInterval(createSnowflake, 200);
        effectInfo.intervals.push(interval);

        // Add frost overlay
        this.addFrostOverlay(card, effectInfo);
    }

    createThunderstormEffect(card, rect, effectInfo) {
        // Add rain effect first
        this.createRainEffect(card, rect, effectInfo);

        // Lightning flashes
        const createLightning = () => {
            const lightning = document.createElement('div');
            lightning.className = 'lightning';
            lightning.style.cssText = `
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
            `;
            this.container.appendChild(lightning);

            // Thunder shake
            card.classList.add('thunder-shake');

            setTimeout(() => {
                lightning.remove();
                card.classList.remove('thunder-shake');
            }, 300);

            // Play thunder sound if available
            this.playThunderSound();
        };

        // Random lightning strikes
        const lightningInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                createLightning();
            }
        }, 3000);

        effectInfo.intervals.push(lightningInterval);
    }

    createDrizzleEffect(card, rect, effectInfo) {
        const createDrizzle = () => {
            const particle = this.getParticle();
            if (!particle) return;

            particle.className = 'weather-particle drizzle-particle';
            particle.style.cssText = `
                display: block;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top - 10}px;
                animation-duration: ${1 + Math.random() * 0.5}s;
                opacity: ${0.2 + Math.random() * 0.3};
            `;

            effectInfo.particles.push(particle);

            setTimeout(() => {
                this.releaseParticle(particle);
                const index = effectInfo.particles.indexOf(particle);
                if (index > -1) effectInfo.particles.splice(index, 1);
            }, 1500);
        };

        const interval = setInterval(createDrizzle, 100);
        effectInfo.intervals.push(interval);
    }

    createCloudsEffect(card, rect, effectInfo) {
        // Create drifting cloud shadows
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud-shadow';
            cloud.style.cssText = `
                left: ${rect.left}px;
                top: ${rect.top + Math.random() * rect.height}px;
                width: ${80 + Math.random() * 40}px;
                height: ${30 + Math.random() * 20}px;
                animation-delay: ${i * 5}s;
                animation-duration: ${10 + Math.random() * 5}s;
            `;
            this.container.appendChild(cloud);
            effectInfo.particles.push(cloud);
        }
    }

    createClearEffect(card, rect, effectInfo) {
        const isNight = card.classList.contains('weather-card--night');
        const isTwilight = card.classList.contains('weather-card--twilight');

        if (isNight) {
            // Night: cool moonlight glow, no sun rays
            card.style.boxShadow = '0 0 30px rgba(100, 130, 200, 0.15)';
            return;
        }

        if (isTwilight) {
            // Twilight: warm-to-cool gradient glow
            card.style.boxShadow = '0 0 25px rgba(200, 120, 80, 0.15)';
            return;
        }

        // Day: sun rays
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            ray.className = 'sunray';
            const angle = (i * 45) * Math.PI / 180;
            const length = Math.max(rect.width, rect.height);

            ray.style.cssText = `
                left: ${centerX}px;
                top: ${centerY - length / 2}px;
                height: ${length}px;
                transform: rotate(${i * 45}deg);
                animation-delay: ${i * 0.2}s;
                opacity: ${0.1 + Math.random() * 0.1};
            `;

            this.container.appendChild(ray);
            effectInfo.particles.push(ray);
        }

        // Add warm glow to card
        card.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.2)';
    }

    createFogEffect(card, rect, effectInfo) {
        // Create multiple fog layers
        for (let i = 0; i < 4; i++) {
            const fog = document.createElement('div');
            fog.className = 'fog-layer';
            fog.style.cssText = `
                left: ${rect.left - rect.width * 0.1}px;
                top: ${rect.top + (i * rect.height / 4)}px;
                height: ${rect.height / 3}px;
                animation-delay: ${i * 2}s;
                animation-duration: ${15 + i * 3}s;
                opacity: ${0.3 + Math.random() * 0.2};
            `;
            this.container.appendChild(fog);
            effectInfo.particles.push(fog);
        }
    }

    addSplashCanvas(card, effectInfo) {
        const canvas = document.createElement('canvas');
        canvas.className = 'weather-card-canvas';
        canvas.width = card.offsetWidth;
        canvas.height = card.offsetHeight;
        card.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        effectInfo.canvases.push(canvas);

        // Animate water ripples
        const ripples = [];
        
        const animateRipples = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Add new ripple occasionally
            if (Math.random() > 0.95) {
                ripples.push({
                    x: Math.random() * canvas.width,
                    y: canvas.height - 10,
                    radius: 0,
                    opacity: 0.5
                });
            }

            // Update and draw ripples
            for (let i = ripples.length - 1; i >= 0; i--) {
                const ripple = ripples[i];
                ripple.radius += 1;
                ripple.opacity -= 0.01;

                if (ripple.opacity <= 0) {
                    ripples.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(174, 197, 255, ${ripple.opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            if (effectInfo.canvases.includes(canvas)) {
                requestAnimationFrame(animateRipples);
            }
        };

        animateRipples();
    }

    addFrostOverlay(card, effectInfo) {
        const canvas = document.createElement('canvas');
        canvas.className = 'weather-card-canvas';
        canvas.width = card.offsetWidth;
        canvas.height = card.offsetHeight;
        card.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        effectInfo.canvases.push(canvas);

        // Create frost pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        
        // Draw ice crystals
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 20 + 5;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI);
            
            // Draw snowflake pattern
            for (let j = 0; j < 6; j++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -size);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.1})`;
                ctx.stroke();
                
                // Add branches
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.3);
                ctx.lineTo(-size * 0.2, -size * 0.5);
                ctx.moveTo(0, -size * 0.6);
                ctx.lineTo(size * 0.2, -size * 0.8);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }

    removeCardEffect(card) {
        const effectInfo = this.activeEffects.get(card);
        if (!effectInfo) return;

        // Clear intervals
        effectInfo.intervals.forEach(interval => clearInterval(interval));

        // Remove particles
        effectInfo.particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });

        // Remove canvases
        effectInfo.canvases.forEach(canvas => {
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });

        // Remove classes
        card.classList.remove('rain-effect', 'thunder-shake');
        card.style.boxShadow = '';

        // Remove from active effects
        this.activeEffects.delete(card);
    }

    handleResize() {
        // Update all active effects positions
        this.activeEffects.forEach((effectInfo, card) => {
            const weatherType = effectInfo.weatherType;
            this.removeCardEffect(card);
            setTimeout(() => {
                this.createCardEffect(card, weatherType);
            }, 100);
        });
    }

    playThunderSound() {
        // Optional: Add sound effects
        if ('Audio' in window) {
            // Could implement audio playback here
            console.log('⚡ Thunder!');
        }
    }

    connectToWeatherApp() {
        // Wait for main app to be ready
        const checkApp = setInterval(() => {
            if (window.weatherApp && window.weatherApp.cardEffects === undefined) {
                window.weatherApp.cardEffects = this;
                clearInterval(checkApp);
                console.log('🔗 Weather Effects connected to main app');
                
                // Auto-apply effects to existing cards
                setTimeout(() => {
                    document.querySelectorAll('.weather-card').forEach(card => {
                        const weather = card.dataset.weather;
                        if (weather) {
                            this.createCardEffect(card, weather);
                        }
                    });
                }, 1000);
            }
        }, 100);
    }

    // Advanced effects for specific conditions
    createHailEffect(card, rect, effectInfo) {
        const createHail = () => {
            const particle = this.getParticle();
            if (!particle) return;

            particle.className = 'weather-particle hail-particle';
            const size = 4 + Math.random() * 4;
            particle.style.cssText = `
                display: block;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top - 20}px;
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${0.4 + Math.random() * 0.3}s;
            `;

            effectInfo.particles.push(particle);

            setTimeout(() => {
                this.releaseParticle(particle);
                const index = effectInfo.particles.indexOf(particle);
                if (index > -1) effectInfo.particles.splice(index, 1);
            }, 700);
        };

        const interval = setInterval(createHail, 80);
        effectInfo.intervals.push(interval);
    }

    // Utility methods
    cleanup() {
        // Remove all active effects
        this.activeEffects.forEach((effectInfo, card) => {
            this.removeCardEffect(card);
        });

        // Clear particle pool
        this.particlePool.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });

        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        console.log('🧹 Weather Effects cleaned up');
    }

    // Performance monitoring
    getActiveEffectsCount() {
        return this.activeEffects.size;
    }

    getActiveParticlesCount() {
        let count = 0;
        this.activeEffects.forEach(effectInfo => {
            count += effectInfo.particles.length;
        });
        return count;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.weatherCardEffects = new WeatherCardEffects();
    });
} else {
    window.weatherCardEffects = new WeatherCardEffects();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherCardEffects;
}

// AMD support
if (typeof define === 'function' && define.amd) {
    define([], function() {
        return WeatherCardEffects;
    });
}

console.log('🌦️ Weather Effects Module loaded');
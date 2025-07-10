/**
 * Weather 3D Effects Module
 * Advanced 3D animations for each weather card using Three.js
 * Creates immersive weather experiences directly on cards
 */

class Weather3DEffects {
    constructor() {
        this.scenes = new Map();
        this.renderers = new Map();
        this.cameras = new Map();
        this.animations = new Map();
        this.rafId = null;
        this.initialized = false;
        
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            console.error('❌ Three.js not found! 3D effects disabled.');
            return;
        }
        
        this.init();
    }

    init() {
        this.initialized = true;
        this.connectToWeatherApp();
        this.startAnimationLoop();
        
        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('🎮 Weather 3D Effects initialized');
    }

    connectToWeatherApp() {
        // Wait for weather effects to be ready
        const checkEffects = setInterval(() => {
            if (window.weatherCardEffects) {
                // Override the createCardEffect method to add 3D
                const originalCreateEffect = window.weatherCardEffects.createCardEffect.bind(window.weatherCardEffects);
                
                window.weatherCardEffects.createCardEffect = (card, weatherType) => {
                    // Call original 2D effects
                    originalCreateEffect(card, weatherType);
                    
                    // Add 3D effects
                    this.create3DEffect(card, weatherType);
                };
                
                clearInterval(checkEffects);
                console.log('🔗 3D Effects connected to Weather Effects');
                
                // Apply to existing cards
                setTimeout(() => {
                    document.querySelectorAll('.weather-card').forEach(card => {
                        const weather = card.dataset.weather;
                        if (weather) {
                            this.create3DEffect(card, weather);
                        }
                    });
                }, 500);
            }
        }, 100);
    }

    create3DEffect(card, weatherType) {
        // Remove existing 3D effect if any
        this.remove3DEffect(card);
        
        // Create container for 3D scene
        const container = document.createElement('div');
        container.className = 'weather-3d-container';
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        // Insert at the beginning so it's behind content
        card.insertBefore(container, card.firstChild);
        
        // Setup Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            45,
            card.offsetWidth / card.offsetHeight,
            0.1,
            1000
        );
        camera.position.z = 30;
        
        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        renderer.setSize(card.offsetWidth, card.offsetHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        
        // Store references
        const cardId = this.getCardId(card);
        this.scenes.set(cardId, scene);
        this.cameras.set(cardId, camera);
        this.renderers.set(cardId, renderer);
        
        // Create weather-specific 3D effect
        const weather = weatherType.toLowerCase();
        switch (weather) {
            case 'clear':
                this.createSunEffect(scene, cardId);
                break;
            case 'clouds':
                this.createCloudsEffect(scene, cardId);
                break;
            case 'rain':
                this.createRainEffect3D(scene, cardId);
                break;
            case 'thunderstorm':
                this.createThunderstormEffect3D(scene, cardId);
                break;
            case 'snow':
                this.createSnowEffect3D(scene, cardId);
                break;
            case 'mist':
            case 'fog':
            case 'haze':
                this.createFogEffect3D(scene, cardId);
                break;
            case 'drizzle':
                this.createDrizzleEffect3D(scene, cardId);
                break;
        }
        
        // Add ambient light to all scenes
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
    }

    createSunEffect(scene, cardId) {
        // Create sun sphere
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8,
            shininess: 100
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(10, 10, -10);
        scene.add(sun);
        
        // Add sun glow
        const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(sun.position);
        scene.add(glow);
        
        // Create sun rays
        const rayCount = 12;
        const rays = new THREE.Group();
        
        for (let i = 0; i < rayCount; i++) {
            const rayGeometry = new THREE.ConeGeometry(0.5, 15, 4);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6
            });
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            
            const angle = (i / rayCount) * Math.PI * 2;
            ray.position.x = Math.cos(angle) * 8;
            ray.position.y = Math.sin(angle) * 8;
            ray.rotation.z = angle + Math.PI / 2;
            
            rays.add(ray);
        }
        
        rays.position.copy(sun.position);
        scene.add(rays);
        
        // Add point light
        const sunLight = new THREE.PointLight(0xffdd00, 2, 100);
        sunLight.position.copy(sun.position);
        scene.add(sunLight);
        
        // Animate
        const animationData = {
            sun,
            glow,
            rays,
            time: 0
        };
        
        this.animations.set(cardId, (delta) => {
            animationData.time += delta;
            
            // Rotate sun
            sun.rotation.y += delta * 0.5;
            
            // Pulsate glow
            const scale = 1 + Math.sin(animationData.time * 2) * 0.1;
            glow.scale.set(scale, scale, scale);
            
            // Rotate rays
            rays.rotation.z += delta * 0.3;
            
            // Animate ray opacity
            rays.children.forEach((ray, i) => {
                ray.material.opacity = 0.3 + Math.sin(animationData.time * 3 + i) * 0.3;
            });
        });
    }

    createCloudsEffect(scene, cardId) {
        const clouds = [];
        
        // Create multiple cloud layers
        for (let i = 0; i < 5; i++) {
            const cloud = new THREE.Group();
            
            // Create cloud with multiple spheres
            const sphereCount = 6 + Math.floor(Math.random() * 4);
            for (let j = 0; j < sphereCount; j++) {
                const geometry = new THREE.SphereGeometry(
                    2 + Math.random() * 2,
                    16,
                    16
                );
                const material = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8,
                    fog: true
                });
                const sphere = new THREE.Mesh(geometry, material);
                
                sphere.position.x = (Math.random() - 0.5) * 8;
                sphere.position.y = (Math.random() - 0.5) * 2;
                sphere.position.z = (Math.random() - 0.5) * 2;
                
                cloud.add(sphere);
            }
            
            cloud.position.x = (Math.random() - 0.5) * 40;
            cloud.position.y = 5 + Math.random() * 10;
            cloud.position.z = -5 - i * 2;
            
            scene.add(cloud);
            clouds.push({
                mesh: cloud,
                speed: 0.5 + Math.random() * 0.5,
                initialX: cloud.position.x
            });
        }
        
        // Add directional light for cloud shading
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(5, 10, 5);
        scene.add(light);
        
        // Animate clouds
        this.animations.set(cardId, (delta) => {
            clouds.forEach(cloud => {
                cloud.mesh.position.x += delta * cloud.speed;
                
                // Reset position when cloud moves off screen
                if (cloud.mesh.position.x > 25) {
                    cloud.mesh.position.x = -25;
                }
                
                // Gentle bobbing motion
                cloud.mesh.position.y += Math.sin(Date.now() * 0.001 + cloud.initialX) * 0.01;
            });
        });
    }

    createRainEffect3D(scene, cardId) {
        const rainCount = 200;
        const rainGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = new Float32Array(rainCount);
        
        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            velocities[i] = 10 + Math.random() * 10;
        }
        
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xaaaaff,
            size: 0.3,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const rain = new THREE.Points(rainGeometry, rainMaterial);
        scene.add(rain);
        
        // Create splash particles
        const splashGeometry = new THREE.BufferGeometry();
        const splashPositions = new Float32Array(50 * 3);
        splashGeometry.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));
        
        const splashMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        const splashes = new THREE.Points(splashGeometry, splashMaterial);
        scene.add(splashes);
        
        // Add fog for depth
        scene.fog = new THREE.Fog(0x000033, 10, 50);
        
        // Animate rain
        this.animations.set(cardId, (delta) => {
            const positions = rain.geometry.attributes.position.array;
            const splashPos = splashes.geometry.attributes.position.array;
            
            for (let i = 0; i < rainCount; i++) {
                positions[i * 3 + 1] -= velocities[i] * delta;
                
                // Reset raindrop when it falls below ground
                if (positions[i * 3 + 1] < -5) {
                    positions[i * 3 + 1] = 25;
                    
                    // Create splash effect
                    if (Math.random() > 0.8 && i < 50) {
                        splashPos[i * 3] = positions[i * 3];
                        splashPos[i * 3 + 1] = -4;
                        splashPos[i * 3 + 2] = positions[i * 3 + 2];
                    }
                }
            }
            
            // Animate splashes
            for (let i = 0; i < 50; i++) {
                if (splashPos[i * 3 + 1] > -5) {
                    splashPos[i * 3 + 1] += delta * 2;
                    if (splashPos[i * 3 + 1] > -3) {
                        splashPos[i * 3 + 1] = -10;
                    }
                }
            }
            
            rain.geometry.attributes.position.needsUpdate = true;
            splashes.geometry.attributes.position.needsUpdate = true;
        });
    }

    createThunderstormEffect3D(scene, cardId) {
        // First add rain
        this.createRainEffect3D(scene, cardId);
        
        // Create storm clouds
        const cloudGeometry = new THREE.BoxGeometry(30, 10, 10);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.9
        });
        const stormCloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        stormCloud.position.y = 15;
        scene.add(stormCloud);
        
        // Lightning bolt geometry
        const lightningMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            emissive: 0xffffff,
            emissiveIntensity: 2
        });
        
        const createLightningBolt = () => {
            const points = [];
            let currentPoint = new THREE.Vector3(0, 20, 0);
            points.push(currentPoint.clone());
            
            while (currentPoint.y > -5) {
                const nextPoint = currentPoint.clone();
                nextPoint.x += (Math.random() - 0.5) * 5;
                nextPoint.y -= 2 + Math.random() * 3;
                nextPoint.z += (Math.random() - 0.5) * 2;
                points.push(nextPoint);
                currentPoint = nextPoint;
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const lightning = new THREE.Line(geometry, lightningMaterial);
            return lightning;
        };
        
        let lightning = createLightningBolt();
        scene.add(lightning);
        
        // Flash light
        const flashLight = new THREE.PointLight(0xffffff, 0, 100);
        flashLight.position.set(0, 10, 10);
        scene.add(flashLight);
        
        // Store original animation
        const originalAnimation = this.animations.get(cardId);
        
        // Thunder animation
        let thunderTime = 0;
        let nextThunder = 3 + Math.random() * 4;
        
        this.animations.set(cardId, (delta) => {
            // Run original rain animation
            if (originalAnimation) originalAnimation(delta);
            
            thunderTime += delta;
            
            // Trigger lightning
            if (thunderTime > nextThunder) {
                // Remove old lightning
                scene.remove(lightning);
                lightning.geometry.dispose();
                
                // Create new lightning
                lightning = createLightningBolt();
                scene.add(lightning);
                
                // Flash animation
                let flashDuration = 0.3;
                let flashTime = 0;
                
                const flash = setInterval(() => {
                    flashTime += 0.016;
                    
                    if (flashTime < flashDuration) {
                        const intensity = Math.sin((flashTime / flashDuration) * Math.PI);
                        lightning.material.opacity = intensity;
                        flashLight.intensity = intensity * 5;
                        
                        // Shake cloud
                        stormCloud.position.x = (Math.random() - 0.5) * intensity;
                        stormCloud.position.z = (Math.random() - 0.5) * intensity;
                    } else {
                        lightning.material.opacity = 0;
                        flashLight.intensity = 0;
                        stormCloud.position.x = 0;
                        stormCloud.position.z = 0;
                        clearInterval(flash);
                    }
                }, 16);
                
                thunderTime = 0;
                nextThunder = 2 + Math.random() * 5;
            }
        });
    }

    createSnowEffect3D(scene, cardId) {
        const snowCount = 300;
        const snowflakes = [];
        
        // Create snowflake texture
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Draw snowflake
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create snow particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(snowCount * 3);
        const sizes = new Float32Array(snowCount);
        
        for (let i = 0; i < snowCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
            sizes[i] = Math.random() * 0.5 + 0.5;
            
            snowflakes.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    -(Math.random() * 0.5 + 0.5),
                    0
                ),
                rotation: Math.random() * Math.PI,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            map: texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const snow = new THREE.Points(geometry, material);
        scene.add(snow);
        
        // Add ground plane with snow accumulation
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            opacity: 0.9,
            transparent: true
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        scene.add(ground);
        
        // Add soft blue lighting
        const light = new THREE.DirectionalLight(0xccddff, 0.8);
        light.position.set(0, 10, 5);
        scene.add(light);
        
        scene.fog = new THREE.Fog(0xccddff, 10, 50);
        
        // Animate
        this.animations.set(cardId, (delta) => {
            const positions = snow.geometry.attributes.position.array;
            
            for (let i = 0; i < snowCount; i++) {
                const flake = snowflakes[i];
                
                // Update position
                positions[i * 3] += flake.velocity.x + Math.sin(Date.now() * 0.001 + i) * 0.02;
                positions[i * 3 + 1] += flake.velocity.y;
                positions[i * 3 + 2] += flake.velocity.z;
                
                // Reset when below ground
                if (positions[i * 3 + 1] < -5) {
                    positions[i * 3 + 1] = 25;
                    positions[i * 3] = (Math.random() - 0.5) * 50;
                }
                
                // Update rotation
                flake.rotation += flake.rotationSpeed;
            }
            
            snow.geometry.attributes.position.needsUpdate = true;
            snow.rotation.y += delta * 0.05;
        });
    }

    createFogEffect3D(scene, cardId) {
        const fogLayers = [];
        
        // Create multiple fog planes
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.PlaneGeometry(60, 20);
            const material = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const fog = new THREE.Mesh(geometry, material);
            fog.position.z = -10 + i * 3;
            fog.position.y = -5 + Math.random() * 10;
            fog.rotation.y = Math.random() * Math.PI;
            
            scene.add(fog);
            fogLayers.push({
                mesh: fog,
                speed: 0.1 + Math.random() * 0.2,
                amplitude: 5 + Math.random() * 5,
                offset: Math.random() * Math.PI * 2
            });
        }
        
        // Add volumetric fog effect
        scene.fog = new THREE.FogExp2(0xcccccc, 0.05);
        
        // Soft lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.6);
        scene.add(light);
        
        // Animate fog layers
        this.animations.set(cardId, (delta) => {
            fogLayers.forEach((layer, i) => {
                const time = Date.now() * 0.001;
                
                // Drift motion
                layer.mesh.position.x = Math.sin(time * layer.speed + layer.offset) * layer.amplitude;
                
                // Vertical bobbing
                layer.mesh.position.y += Math.sin(time * 0.5 + i) * 0.01;
                
                // Rotation
                layer.mesh.rotation.y += delta * layer.speed * 0.1;
                
                // Opacity variation
                layer.mesh.material.opacity = 0.1 + Math.sin(time * 0.3 + i) * 0.1;
            });
        });
    }

    createDrizzleEffect3D(scene, cardId) {
        const drizzleCount = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(drizzleCount * 3);
        const opacities = new Float32Array(drizzleCount);
        const velocities = new Float32Array(drizzleCount);
        
        for (let i = 0; i < drizzleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            opacities[i] = Math.random() * 0.5 + 0.3;
            velocities[i] = 3 + Math.random() * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0xaaccff,
            size: 0.2,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            vertexColors: false
        });
        
        const drizzle = new THREE.Points(geometry, material);
        scene.add(drizzle);
        
        // Add mist effect
        const mistGeometry = new THREE.BoxGeometry(40, 20, 20);
        const mistMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            depthWrite: false
        });
        const mist = new THREE.Mesh(mistGeometry, mistMaterial);
        mist.position.y = 0;
        scene.add(mist);
        
        // Soft lighting
        scene.fog = new THREE.Fog(0xccccff, 10, 40);
        
        // Animate
        this.animations.set(cardId, (delta) => {
            const positions = drizzle.geometry.attributes.position.array;
            
            for (let i = 0; i < drizzleCount; i++) {
                // Diagonal fall
                positions[i * 3] += delta * 0.5;
                positions[i * 3 + 1] -= velocities[i] * delta;
                
                // Reset
                if (positions[i * 3 + 1] < -5) {
                    positions[i * 3] = (Math.random() - 0.5) * 40;
                    positions[i * 3 + 1] = 25;
                }
            }
            
            drizzle.geometry.attributes.position.needsUpdate = true;
            
            // Animate mist opacity
            mist.material.opacity = 0.05 + Math.sin(Date.now() * 0.001) * 0.05;
        });
    }

    remove3DEffect(card) {
        const cardId = this.getCardId(card);
        
        // Clean up scene
        const scene = this.scenes.get(cardId);
        if (scene) {
            // Dispose all objects in scene
            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        
        // Clean up renderer
        const renderer = this.renderers.get(cardId);
        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
        }
        
        // Remove from maps
        this.scenes.delete(cardId);
        this.cameras.delete(cardId);
        this.renderers.delete(cardId);
        this.animations.delete(cardId);
        
        // Remove container
        const container = card.querySelector('.weather-3d-container');
        if (container) {
            container.remove();
        }
    }

    startAnimationLoop() {
        let lastTime = 0;
        
        const animate = (currentTime) => {
            this.rafId = requestAnimationFrame(animate);
            
            const delta = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Update all scenes
            this.scenes.forEach((scene, cardId) => {
                const camera = this.cameras.get(cardId);
                const renderer = this.renderers.get(cardId);
                const animation = this.animations.get(cardId);
                
                if (camera && renderer) {
                    // Run animation
                    if (animation) {
                        animation(delta);
                    }
                    
                    // Render scene
                    renderer.render(scene, camera);
                }
            });
        };
        
        animate(0);
    }

    handleResize() {
        this.renderers.forEach((renderer, cardId) => {
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (card) {
                const camera = this.cameras.get(cardId);
                
                camera.aspect = card.offsetWidth / card.offsetHeight;
                camera.updateProjectionMatrix();
                
                renderer.setSize(card.offsetWidth, card.offsetHeight);
            }
        });
    }

    getCardId(card) {
        // Generate unique ID for card
        if (!card.dataset.cardId) {
            card.dataset.cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        return card.dataset.cardId;
    }

    cleanup() {
        // Stop animation loop
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        // Clean up all 3D effects
        this.scenes.forEach((scene, cardId) => {
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (card) {
                this.remove3DEffect(card);
            }
        });
        
        console.log('🧹 3D Effects cleaned up');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.weather3DEffects = new Weather3DEffects();
    });
} else {
    window.weather3DEffects = new Weather3DEffects();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Weather3DEffects;
}

console.log('🎮 Weather 3D Effects Module loaded');
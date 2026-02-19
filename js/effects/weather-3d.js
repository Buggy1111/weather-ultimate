/**
 * Weather 3D Effects v2.0 — Premium Edition
 * Next-gen 3D weather visualizations with custom GLSL shaders,
 * GPU-instanced particles, volumetric effects, and glow compositing.
 * Requires Three.js r150+ (tested with r170)
 */

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE TIER DETECTION
// ═══════════════════════════════════════════════════════════════
function detectPerformanceTier() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'low';
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 2;
    if (isMobile && cores <= 4) return 'low';
    if (isMobile || cores <= 4) return 'medium';
    return 'high';
}

const PERF_TIER = detectPerformanceTier();

const PARTICLE_COUNTS = {
    high:   { rain: 3000, snow: 4000, drizzle: 1500, sunDust: 200 },
    medium: { rain: 1500, snow: 2000, drizzle: 800,  sunDust: 100 },
    low:    { rain: 500,  snow: 600,  drizzle: 300,  sunDust: 50  }
};

const COUNTS = PARTICLE_COUNTS[PERF_TIER];

// ═══════════════════════════════════════════════════════════════
// GLSL SHARED CODE — Simplex 3D Noise (Ashima Arts, MIT)
// ═══════════════════════════════════════════════════════════════
const GLSL_NOISE = /* glsl */`
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// ═══════════════════════════════════════════════════════════════
// TEXTURE GENERATORS
// ═══════════════════════════════════════════════════════════════
function createSoftCircleTexture(size = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    g.addColorStop(0.15, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function createSnowflakeTexture(size = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const half = size / 2;
    // Soft hexagonal snowflake
    const g = ctx.createRadialGradient(half, half, 0, half, half, half);
    g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    g.addColorStop(0.2, 'rgba(220,235,255,0.9)');
    g.addColorStop(0.5, 'rgba(200,220,255,0.3)');
    g.addColorStop(1.0, 'rgba(200,220,255,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // Draw subtle cross pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(half, half);
        ctx.lineTo(half + Math.cos(angle) * half * 0.7, half + Math.sin(angle) * half * 0.7);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

// Shared textures (created once)
let _softCircleTex = null;
let _snowflakeTex = null;
function getSoftCircle() { return _softCircleTex || (_softCircleTex = createSoftCircleTexture(64)); }
function getSnowflake() { return _snowflakeTex || (_snowflakeTex = createSnowflakeTexture(64)); }

// ═══════════════════════════════════════════════════════════════
// MAIN CLASS
// ═══════════════════════════════════════════════════════════════
class Weather3DEffects {
    constructor() {
        this.scenes = new Map();
        this.renderers = new Map();
        this.cameras = new Map();
        this.animations = new Map();
        this.effectData = new Map();
        this.rafId = null;
        this.initialized = false;
        this.globalTime = 0;

        if (typeof THREE === 'undefined') {
            console.error('Three.js not found! 3D effects disabled.');
            return;
        }
        this.init();
    }

    init() {
        this.initialized = true;
        this.connectToWeatherApp();
        this.startAnimationLoop();
        window.addEventListener('resize', () => this.handleResize());
        console.log(`🎮 Weather 3D v2.0 [${PERF_TIER}] initialized`);
    }

    connectToWeatherApp() {
        const check = setInterval(() => {
            if (window.weatherCardEffects) {
                const orig = window.weatherCardEffects.createCardEffect.bind(window.weatherCardEffects);
                window.weatherCardEffects.createCardEffect = (card, weatherType) => {
                    orig(card, weatherType);
                    this.create3DEffect(card, weatherType);
                };
                clearInterval(check);
                console.log('🔗 3D v2.0 connected');
                setTimeout(() => {
                    document.querySelectorAll('.weather-card').forEach(card => {
                        const w = card.dataset.weather;
                        if (w) this.create3DEffect(card, w);
                    });
                }, 500);
            }
        }, 100);
    }

    // ───────────────────────────────────────────────────────────
    // EFFECT DISPATCHER
    // ───────────────────────────────────────────────────────────
    create3DEffect(card, weatherType) {
        this.remove3DEffect(card);

        const container = document.createElement('div');
        container.className = 'weather-3d-container';
        container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:hidden;border-radius:inherit;';
        card.insertBefore(container, card.firstChild);

        const w = card.offsetWidth;
        const h = card.offsetHeight;
        if (w === 0 || h === 0) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: PERF_TIER !== 'low' });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const cardId = this.getCardId(card);
        this.scenes.set(cardId, scene);
        this.cameras.set(cardId, camera);
        this.renderers.set(cardId, renderer);

        // Ambient light for all scenes
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        const weather = weatherType.toLowerCase();
        switch (weather) {
            case 'clear':       this.createSunEffect(scene, cardId); break;
            case 'clouds':      this.createCloudsEffect(scene, cardId); break;
            case 'rain':        this.createRainEffect(scene, cardId); break;
            case 'thunderstorm': this.createThunderstormEffect(scene, cardId); break;
            case 'snow':        this.createSnowEffect(scene, cardId); break;
            case 'mist': case 'fog': case 'haze':
                                this.createFogEffect(scene, cardId); break;
            case 'drizzle':     this.createDrizzleEffect(scene, cardId); break;
            default:            this.createCloudsEffect(scene, cardId); break;
        }
    }

    // ───────────────────────────────────────────────────────────
    // ☀️  SUN / CLEAR — Premium glow layers + god rays + dust
    // ───────────────────────────────────────────────────────────
    createSunEffect(scene, cardId) {
        const sunPos = new THREE.Vector3(10, 10, -5);

        // 1. Core sun sphere — emissive shader
        const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const sunMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                void main(){
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`,
            fragmentShader: GLSL_NOISE + `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vNormal;
                void main(){
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 2.0);
                    float n = snoise(vec3(vUv * 5.0, uTime * 0.3)) * 0.15;
                    float brightness = 0.9 + n + fresnel * 0.3;
                    vec3 core = mix(vec3(1.0,0.95,0.7), vec3(1.0,0.7,0.2), fresnel + n);
                    gl_FragColor = vec4(core * brightness, 1.0);
                }`,
            transparent: false
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.position.copy(sunPos);
        scene.add(sun);

        // 2. Multi-layer glow halos
        const glowLayers = [];
        const sizes = [6, 9, 14, 20];
        const opacities = [0.35, 0.2, 0.1, 0.05];
        const colors = [0xffdd44, 0xffcc33, 0xffaa22, 0xff8811];
        sizes.forEach((s, i) => {
            const g = new THREE.SphereGeometry(s, 16, 16);
            const m = new THREE.MeshBasicMaterial({
                color: colors[i], transparent: true, opacity: opacities[i],
                blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
            });
            const mesh = new THREE.Mesh(g, m);
            mesh.position.copy(sunPos);
            scene.add(mesh);
            glowLayers.push(mesh);
        });

        // 3. God rays — thin triangles from sun center
        const rayGroup = new THREE.Group();
        const rayCount = 16;
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const len = 12 + Math.random() * 8;
            const width = 0.3 + Math.random() * 0.4;
            const verts = new Float32Array([
                0, 0, 0,
                Math.cos(angle - width * 0.05) * len, Math.sin(angle - width * 0.05) * len, 0,
                Math.cos(angle + width * 0.05) * len, Math.sin(angle + width * 0.05) * len, 0
            ]);
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffdd44, transparent: true, opacity: 0.12,
                blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.userData.baseOpacity = 0.06 + Math.random() * 0.08;
            mesh.userData.phase = Math.random() * Math.PI * 2;
            mesh.userData.speed = 0.5 + Math.random() * 0.5;
            rayGroup.add(mesh);
        }
        rayGroup.position.copy(sunPos);
        scene.add(rayGroup);

        // 4. Floating dust particles
        const dustCount = COUNTS.sunDust;
        const dustGeo = this._createInstancedQuad(dustCount);
        const offsets = new Float32Array(dustCount * 3);
        const randoms = new Float32Array(dustCount);
        for (let i = 0; i < dustCount; i++) {
            offsets[i*3]   = (Math.random()-0.5) * 40;
            offsets[i*3+1] = (Math.random()-0.5) * 30;
            offsets[i*3+2] = (Math.random()-0.5) * 20;
            randoms[i] = Math.random();
        }
        dustGeo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
        dustGeo.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));

        const dustMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTex: { value: getSoftCircle() }
            },
            vertexShader: `
                attribute vec3 aOffset;
                attribute float aRandom;
                uniform float uTime;
                varying float vAlpha;
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    float t = uTime;
                    vec3 iPos = aOffset;
                    iPos.x += sin(t * 0.2 + aRandom * 6.28) * 3.0;
                    iPos.y += cos(t * 0.15 + aRandom * 4.0) * 2.0;
                    float size = 0.3 + aRandom * 0.5;
                    vec4 viewPos = modelViewMatrix * vec4(iPos, 1.0);
                    viewPos.xy += position.xy * size;
                    vAlpha = 0.2 + sin(t * 1.5 + aRandom * 10.0) * 0.15;
                    gl_Position = projectionMatrix * viewPos;
                }`,
            fragmentShader: `
                uniform sampler2D uTex;
                varying float vAlpha;
                varying vec2 vUv;
                void main(){
                    float a = texture2D(uTex, vUv).r;
                    gl_FragColor = vec4(1.0, 0.95, 0.7, a * vAlpha);
                }`,
            transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const dustMesh = new THREE.Mesh(dustGeo, dustMat);
        scene.add(dustMesh);

        // 5. Warm point light
        const light = new THREE.PointLight(0xffdd44, 2.5, 60);
        light.position.copy(sunPos);
        scene.add(light);

        // Animation
        this.animations.set(cardId, (delta, time) => {
            sunMat.uniforms.uTime.value = time;
            dustMat.uniforms.uTime.value = time;
            sun.rotation.y += delta * 0.2;
            // Pulsate glow
            glowLayers.forEach((g, i) => {
                const s = 1.0 + Math.sin(time * (1.5 + i * 0.3)) * 0.06;
                g.scale.set(s, s, s);
                g.material.opacity = opacities[i] * (0.8 + Math.sin(time * 2 + i) * 0.2);
            });
            // Animate god rays
            rayGroup.rotation.z += delta * 0.08;
            rayGroup.children.forEach(r => {
                r.material.opacity = r.userData.baseOpacity *
                    (0.6 + Math.sin(time * r.userData.speed + r.userData.phase) * 0.4);
            });
        });
    }

    // ───────────────────────────────────────────────────────────
    // ☁️  CLOUDS — Noise-based volumetric planes with parallax
    // ───────────────────────────────────────────────────────────
    createCloudsEffect(scene, cardId) {
        const cloudPlanes = [];
        const layerCount = PERF_TIER === 'low' ? 3 : 5;

        for (let i = 0; i < layerCount; i++) {
            const depth = -3 - i * 3;
            const geo = new THREE.PlaneGeometry(50, 25, 1, 1);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uDensity: { value: 0.15 + i * 0.05 },
                    uSpeed: { value: 0.02 + i * 0.008 },
                    uCloudLight: { value: new THREE.Color(1.0, 1.0, 1.0) },
                    uCloudShadow: { value: new THREE.Color(0.55, 0.6, 0.7) },
                    uOpacity: { value: 0.55 - i * 0.06 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main(){
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                    }`,
                fragmentShader: GLSL_NOISE + `
                    uniform float uTime, uDensity, uSpeed, uOpacity;
                    uniform vec3 uCloudLight, uCloudShadow;
                    varying vec2 vUv;
                    void main(){
                        vec2 uv = vUv;
                        uv.x += uTime * uSpeed;
                        float n = 0.0;
                        n += snoise(vec3(uv * 2.0, uTime * 0.04)) * 0.5;
                        n += snoise(vec3(uv * 4.0, uTime * 0.06)) * 0.25;
                        n += snoise(vec3(uv * 8.0, uTime * 0.09)) * 0.125;
                        n += snoise(vec3(uv * 16.0, uTime * 0.12)) * 0.0625;
                        float cloud = smoothstep(-0.1, 0.5, n + uDensity);
                        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
                        edge *= smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
                        float light = smoothstep(0.2, 0.7, n + 0.3);
                        vec3 color = mix(uCloudShadow, uCloudLight, light);
                        gl_FragColor = vec4(color, cloud * edge * uOpacity);
                    }`,
                transparent: true, depthWrite: false, side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set((Math.random()-0.5) * 5, 3 + i * 2, depth);
            scene.add(mesh);
            cloudPlanes.push({ mesh, mat });
        }

        // Soft directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(5, 8, 5);
        scene.add(dirLight);

        this.animations.set(cardId, (delta, time) => {
            cloudPlanes.forEach(({ mat }) => {
                mat.uniforms.uTime.value = time;
            });
        });
    }

    // ───────────────────────────────────────────────────────────
    // 🌧️  RAIN — GPU instanced drops + ground ripples + atmosphere
    // ───────────────────────────────────────────────────────────
    createRainEffect(scene, cardId) {
        const count = COUNTS.rain;

        // 1. Instanced rain drops
        const geo = this._createInstancedQuad(count);
        const offsets = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        const randoms = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            offsets[i*3]   = (Math.random()-0.5) * 50;
            offsets[i*3+1] = Math.random() * 45;
            offsets[i*3+2] = (Math.random()-0.5) * 25;
            speeds[i] = 10 + Math.random() * 12;
            randoms[i] = Math.random();
        }
        geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
        geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
        geo.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));

        const rainMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0.55, 0.65, 1.0) },
                uWindAngle: { value: -0.12 }
            },
            vertexShader: `
                attribute vec3 aOffset;
                attribute float aSpeed;
                attribute float aRandom;
                uniform float uTime, uWindAngle;
                varying float vAlpha;
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    float t = uTime;
                    float y = mod(aOffset.y - t * aSpeed, 45.0) - 5.0;
                    float x = aOffset.x + sin(t * 0.3 + aRandom * 6.28) * 0.8;
                    x = mod(x + 25.0, 50.0) - 25.0;
                    float z = aOffset.z;
                    vec3 iPos = vec3(x, y, z);
                    vec4 viewPos = modelViewMatrix * vec4(iPos, 1.0);
                    // Elongated drop shape, slightly angled
                    float s = sin(uWindAngle), c = cos(uWindAngle);
                    vec2 rp = vec2(
                        position.x * c - position.y * s,
                        position.x * s + position.y * c
                    );
                    float dropW = 0.04 + aRandom * 0.02;
                    float dropH = 0.4 + aSpeed * 0.03;
                    viewPos.x += rp.x * dropW;
                    viewPos.y += rp.y * dropH;
                    vAlpha = smoothstep(-5.0, 2.0, y) * smoothstep(35.0, 25.0, y);
                    vAlpha *= 0.4 + aRandom * 0.3;
                    gl_Position = projectionMatrix * viewPos;
                }`,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                varying vec2 vUv;
                void main(){
                    float d = abs(vUv.x - 0.5) * 2.0;
                    float shape = smoothstep(1.0, 0.3, d);
                    float bright = smoothstep(0.5, 0.0, d) * 0.3;
                    vec3 col = uColor + bright;
                    gl_FragColor = vec4(col, shape * vAlpha);
                }`,
            transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const rainMesh = new THREE.Mesh(geo, rainMat);
        scene.add(rainMesh);

        // 2. Ground ripple plane
        const groundGeo = new THREE.PlaneGeometry(50, 50, 1, 1);
        const groundMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                float hash(vec2 p){
                    p = fract(p * vec2(443.897, 397.297));
                    p += dot(p, p.yx + 19.19);
                    return fract(p.x * p.y);
                }
                void main(){
                    float result = 0.0;
                    for(float i = 0.0; i < 20.0; i++){
                        vec2 center = vec2(hash(vec2(i, 1.0)), hash(vec2(1.0, i)));
                        float period = 0.6 + hash(vec2(i*7.0, i*13.0)) * 1.4;
                        float age = fract((uTime + hash(vec2(i, i)) * 6.28) / period);
                        float radius = age * 0.18;
                        float dist = length(vUv - center);
                        float ring = smoothstep(radius - 0.008, radius, dist)
                                   - smoothstep(radius, radius + 0.008, dist);
                        result += ring * (1.0 - age) * 2.0;
                    }
                    gl_FragColor = vec4(0.5, 0.6, 1.0, min(result, 0.5));
                }`,
            transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        scene.add(ground);

        // 3. Atmosphere
        scene.fog = new THREE.FogExp2(0x0a0a2e, 0.015);
        const light = new THREE.DirectionalLight(0x667799, 0.5);
        light.position.set(-2, 8, 3);
        scene.add(light);

        this.animations.set(cardId, (delta, time) => {
            rainMat.uniforms.uTime.value = time;
            groundMat.uniforms.uTime.value = time;
        });
    }

    // ───────────────────────────────────────────────────────────
    // ⛈️  THUNDERSTORM — Rain + lightning bolts + flash + dark clouds
    // ───────────────────────────────────────────────────────────
    createThunderstormEffect(scene, cardId) {
        // Start with rain base
        this.createRainEffect(scene, cardId);
        const rainAnim = this.animations.get(cardId);

        // Dark storm cloud layer
        const cloudGeo = new THREE.PlaneGeometry(50, 20, 1, 1);
        const cloudMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uFlash: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`,
            fragmentShader: GLSL_NOISE + `
                uniform float uTime, uFlash;
                varying vec2 vUv;
                void main(){
                    vec2 uv = vUv;
                    uv.x += uTime * 0.01;
                    float n = snoise(vec3(uv * 3.0, uTime * 0.05)) * 0.5
                            + snoise(vec3(uv * 6.0, uTime * 0.08)) * 0.25;
                    float cloud = smoothstep(-0.1, 0.6, n + 0.3);
                    float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
                    edge *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
                    vec3 dark = mix(vec3(0.15, 0.15, 0.2), vec3(0.3, 0.3, 0.35), n + 0.5);
                    vec3 col = mix(dark, vec3(1.0), uFlash * 0.7);
                    gl_FragColor = vec4(col, cloud * edge * 0.85);
                }`,
            transparent: true, depthWrite: false, side: THREE.DoubleSide
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(0, 15, -5);
        scene.add(cloud);

        // Lightning system
        let lightning = null;
        let lightningGlow = null;
        const flashLight = new THREE.PointLight(0xccccff, 0, 80);
        flashLight.position.set(0, 10, 5);
        scene.add(flashLight);

        let nextStrike = 2 + Math.random() * 4;
        let strikeTimer = 0;
        let flashValue = 0;

        const createBolt = () => {
            if (lightning) {
                scene.remove(lightning);
                lightning.geometry.dispose();
                lightning.material.dispose();
            }
            if (lightningGlow) {
                scene.remove(lightningGlow);
                lightningGlow.geometry.dispose();
                lightningGlow.material.dispose();
            }
            const pts = [];
            let cur = new THREE.Vector3((Math.random()-0.5)*10, 20, (Math.random()-0.5)*3);
            pts.push(cur.clone());
            while (cur.y > -5) {
                const next = cur.clone();
                next.x += (Math.random()-0.5) * 6;
                next.y -= 2 + Math.random() * 4;
                next.z += (Math.random()-0.5) * 2;
                pts.push(next);
                // Random branch
                if (Math.random() > 0.65) {
                    const br = next.clone();
                    br.x += (Math.random()-0.5) * 8;
                    br.y -= 3 + Math.random() * 5;
                    pts.push(br);
                    pts.push(next.clone());
                }
                cur = next;
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const mat = new THREE.LineBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 1.0,
                blending: THREE.AdditiveBlending
            });
            lightning = new THREE.Line(geo, mat);
            scene.add(lightning);

            // Glow line (wider, dimmer)
            const glowMat = new THREE.LineBasicMaterial({
                color: 0x8888ff, transparent: true, opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            lightningGlow = new THREE.Line(geo.clone(), glowMat);
            lightningGlow.scale.set(1.03, 1.0, 1.03);
            scene.add(lightningGlow);
        };

        this.animations.set(cardId, (delta, time) => {
            if (rainAnim) rainAnim(delta, time);
            cloudMat.uniforms.uTime.value = time;

            strikeTimer += delta;
            if (strikeTimer >= nextStrike) {
                createBolt();
                flashValue = 1.0;
                strikeTimer = 0;
                nextStrike = 1.5 + Math.random() * 5;
            }

            // Flash decay
            if (flashValue > 0) {
                flashValue *= Math.pow(0.02, delta); // rapid decay
                if (flashValue < 0.01) flashValue = 0;
                flashLight.intensity = flashValue * 8;
                cloudMat.uniforms.uFlash.value = flashValue;
                if (lightning) lightning.material.opacity = flashValue;
                if (lightningGlow) lightningGlow.material.opacity = flashValue * 0.5;
            }
        });
    }

    // ───────────────────────────────────────────────────────────
    // ❄️  SNOW — GPU instanced with turbulence + bokeh particles
    // ───────────────────────────────────────────────────────────
    createSnowEffect(scene, cardId) {
        const count = COUNTS.snow;
        const geo = this._createInstancedQuad(count);
        const offsets = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const randoms = new Float32Array(count);
        const phases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            offsets[i*3]   = (Math.random()-0.5) * 55;
            offsets[i*3+1] = Math.random() * 45;
            offsets[i*3+2] = (Math.random()-0.5) * 30;
            sizes[i] = 0.3 + Math.random() * 0.8;
            randoms[i] = Math.random();
            phases[i] = Math.random() * Math.PI * 2;
        }
        geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
        geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1));
        geo.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));
        geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

        const snowMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTex: { value: getSnowflake() }
            },
            vertexShader: GLSL_NOISE + `
                attribute vec3 aOffset;
                attribute float aSize, aRandom, aPhase;
                uniform float uTime;
                varying float vAlpha;
                varying vec2 vUv;
                varying float vSparkle;
                void main(){
                    vUv = uv;
                    float t = uTime;
                    float fallSpeed = 0.8 + aSize * 0.4;
                    float y = mod(aOffset.y - t * fallSpeed, 45.0) - 5.0;
                    float x = aOffset.x
                            + sin(t * 0.4 + aPhase) * 2.5
                            + sin(t * 1.1 + aRandom * 10.0) * 0.8;
                    x = mod(x + 27.5, 55.0) - 27.5;
                    float z = aOffset.z + cos(t * 0.3 + aPhase) * 1.5;
                    // Turbulence from noise
                    float turb = snoise(vec3(x * 0.1, y * 0.1, t * 0.15)) * 1.5;
                    x += turb;
                    vec3 iPos = vec3(x, y, z);
                    vec4 viewPos = modelViewMatrix * vec4(iPos, 1.0);
                    // Billboard
                    viewPos.xy += position.xy * aSize;
                    vAlpha = smoothstep(-5.0, 0.0, y) * (0.5 + aRandom * 0.5);
                    // Sparkle: occasional bright glint
                    vSparkle = pow(max(0.0, snoise(vec3(aRandom * 100.0, t * 3.0, 0.0))), 6.0);
                    gl_Position = projectionMatrix * viewPos;
                }`,
            fragmentShader: `
                uniform sampler2D uTex;
                varying float vAlpha, vSparkle;
                varying vec2 vUv;
                void main(){
                    vec4 tex = texture2D(uTex, vUv);
                    float a = tex.r * vAlpha;
                    vec3 col = mix(vec3(0.85, 0.9, 1.0), vec3(1.0), vSparkle);
                    col += vSparkle * 0.5;
                    gl_FragColor = vec4(col, a);
                }`,
            transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const snowMesh = new THREE.Mesh(geo, snowMat);
        scene.add(snowMesh);

        // Snow ground
        const groundGeo = new THREE.PlaneGeometry(55, 55, 1, 1);
        const groundMat = new THREE.MeshPhongMaterial({
            color: 0xe8eeff, transparent: true, opacity: 0.7,
            emissive: 0x334466, emissiveIntensity: 0.15
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        scene.add(ground);

        // Atmosphere
        scene.fog = new THREE.FogExp2(0xc8d8f0, 0.012);
        const light = new THREE.DirectionalLight(0xccddff, 0.6);
        light.position.set(2, 10, 5);
        scene.add(light);
        const hemi = new THREE.HemisphereLight(0xddeeff, 0x8899bb, 0.4);
        scene.add(hemi);

        this.animations.set(cardId, (delta, time) => {
            snowMat.uniforms.uTime.value = time;
        });
    }

    // ───────────────────────────────────────────────────────────
    // 🌫️  FOG / MIST — Volumetric ray-marched fog shader
    // ───────────────────────────────────────────────────────────
    createFogEffect(scene, cardId) {
        // Fullscreen quad with volumetric fog shader
        const fogGeo = new THREE.PlaneGeometry(60, 35, 1, 1);
        const fogMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uDensity: { value: 0.4 },
                uColor: { value: new THREE.Color(0.75, 0.78, 0.82) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main(){
                    vUv = uv;
                    vWorldPos = (modelMatrix * vec4(position,1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`,
            fragmentShader: GLSL_NOISE + `
                uniform float uTime, uDensity;
                uniform vec3 uColor;
                varying vec2 vUv;
                void main(){
                    vec2 uv = vUv;
                    float t = uTime * 0.08;
                    // Layered noise for fog wisps
                    float n = 0.0;
                    n += snoise(vec3(uv * 1.5 + t, t * 0.5)) * 0.5;
                    n += snoise(vec3(uv * 3.0 + t * 1.3, t * 0.8)) * 0.25;
                    n += snoise(vec3(uv * 6.0 + t * 1.7, t * 1.1)) * 0.125;
                    n += snoise(vec3(uv * 12.0 + t * 2.0, t * 1.5)) * 0.0625;
                    float fog = smoothstep(-0.2, 0.6, n + uDensity);
                    // Edge fade
                    float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
                    edge *= smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
                    // Light variation
                    float light = 0.8 + snoise(vec3(uv * 2.0, t * 0.3)) * 0.2;
                    vec3 col = uColor * light;
                    gl_FragColor = vec4(col, fog * edge * 0.6);
                }`,
            transparent: true, depthWrite: false, side: THREE.DoubleSide
        });
        const fogPlane = new THREE.Mesh(fogGeo, fogMat);
        fogPlane.position.z = 0;
        scene.add(fogPlane);

        // Second layer at different depth for parallax
        const fog2Geo = new THREE.PlaneGeometry(55, 30, 1, 1);
        const fog2Mat = fogMat.clone();
        fog2Mat.uniforms = {
            uTime: { value: 0 },
            uDensity: { value: 0.3 },
            uColor: { value: new THREE.Color(0.7, 0.73, 0.78) }
        };
        const fog2 = new THREE.Mesh(fog2Geo, fog2Mat);
        fog2.position.z = -8;
        fog2.position.y = -2;
        scene.add(fog2);

        // Soft lighting
        const hemi = new THREE.HemisphereLight(0xdddde0, 0x999aaa, 0.5);
        scene.add(hemi);

        scene.fog = new THREE.FogExp2(0xc0c5cc, 0.025);

        this.animations.set(cardId, (delta, time) => {
            fogMat.uniforms.uTime.value = time;
            fog2Mat.uniforms.uTime.value = time * 1.2;
        });
    }

    // ───────────────────────────────────────────────────────────
    // 🌦️  DRIZZLE — Fine particles + atmospheric mist
    // ───────────────────────────────────────────────────────────
    createDrizzleEffect(scene, cardId) {
        const count = COUNTS.drizzle;
        const geo = this._createInstancedQuad(count);
        const offsets = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        const randoms = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            offsets[i*3]   = (Math.random()-0.5) * 45;
            offsets[i*3+1] = Math.random() * 40;
            offsets[i*3+2] = (Math.random()-0.5) * 20;
            speeds[i] = 4 + Math.random() * 3;
            randoms[i] = Math.random();
        }
        geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
        geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
        geo.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));

        const drizzleMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0.6, 0.7, 0.95) }
            },
            vertexShader: `
                attribute vec3 aOffset;
                attribute float aSpeed, aRandom;
                uniform float uTime;
                varying float vAlpha;
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    float t = uTime;
                    float y = mod(aOffset.y - t * aSpeed, 40.0) - 5.0;
                    float x = aOffset.x + sin(t * 0.2 + aRandom * 6.28) * 0.5 + t * 0.3;
                    x = mod(x + 22.5, 45.0) - 22.5;
                    vec3 iPos = vec3(x, y, aOffset.z);
                    vec4 viewPos = modelViewMatrix * vec4(iPos, 1.0);
                    float dropW = 0.025;
                    float dropH = 0.2 + aSpeed * 0.02;
                    viewPos.x += position.x * dropW;
                    viewPos.y += position.y * dropH;
                    vAlpha = smoothstep(-5.0, 0.0, y) * (0.25 + aRandom * 0.2);
                    gl_Position = projectionMatrix * viewPos;
                }`,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                varying vec2 vUv;
                void main(){
                    float d = abs(vUv.x - 0.5) * 2.0;
                    float shape = smoothstep(1.0, 0.2, d);
                    gl_FragColor = vec4(uColor, shape * vAlpha);
                }`,
            transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const drizzleMesh = new THREE.Mesh(geo, drizzleMat);
        scene.add(drizzleMesh);

        // Atmospheric mist overlay
        const mistGeo = new THREE.PlaneGeometry(50, 30, 1, 1);
        const mistMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0.7, 0.75, 0.85) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`,
            fragmentShader: GLSL_NOISE + `
                uniform float uTime;
                uniform vec3 uColor;
                varying vec2 vUv;
                void main(){
                    vec2 uv = vUv;
                    uv.x += uTime * 0.015;
                    float n = snoise(vec3(uv * 2.0, uTime * 0.05)) * 0.5
                            + snoise(vec3(uv * 4.0, uTime * 0.08)) * 0.25;
                    float mist = smoothstep(-0.2, 0.5, n + 0.2);
                    float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
                    edge *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
                    gl_FragColor = vec4(uColor, mist * edge * 0.25);
                }`,
            transparent: true, depthWrite: false, side: THREE.DoubleSide
        });
        const mistMesh = new THREE.Mesh(mistGeo, mistMat);
        mistMesh.position.z = -3;
        scene.add(mistMesh);

        scene.fog = new THREE.FogExp2(0xbbbbdd, 0.01);
        const hemi = new THREE.HemisphereLight(0xccccee, 0x8888aa, 0.5);
        scene.add(hemi);

        this.animations.set(cardId, (delta, time) => {
            drizzleMat.uniforms.uTime.value = time;
            mistMat.uniforms.uTime.value = time;
        });
    }

    // ───────────────────────────────────────────────────────────
    // UTILITY: Create InstancedBufferGeometry from a unit quad
    // ───────────────────────────────────────────────────────────
    _createInstancedQuad(count) {
        const base = new THREE.PlaneGeometry(1, 1, 1, 1);
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = base.index;
        geo.attributes.position = base.attributes.position;
        geo.attributes.normal = base.attributes.normal;
        geo.attributes.uv = base.attributes.uv;
        geo.instanceCount = count;
        return geo;
    }

    // ───────────────────────────────────────────────────────────
    // CLEANUP & LIFECYCLE
    // ───────────────────────────────────────────────────────────
    remove3DEffect(card) {
        const cardId = this.getCardId(card);
        const scene = this.scenes.get(cardId);
        if (scene) {
            scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else {
                        if (obj.material.uniforms) {
                            Object.values(obj.material.uniforms).forEach(u => {
                                if (u.value && u.value.dispose) u.value.dispose();
                            });
                        }
                        obj.material.dispose();
                    }
                }
            });
        }
        const renderer = this.renderers.get(cardId);
        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
        }
        this.scenes.delete(cardId);
        this.cameras.delete(cardId);
        this.renderers.delete(cardId);
        this.animations.delete(cardId);
        this.effectData.delete(cardId);
        const container = card.querySelector('.weather-3d-container');
        if (container) container.remove();
    }

    startAnimationLoop() {
        let lastTime = 0;
        const animate = (currentTime) => {
            this.rafId = requestAnimationFrame(animate);
            const delta = Math.min((currentTime - lastTime) / 1000, 0.1); // cap delta
            lastTime = currentTime;
            this.globalTime += delta;

            this.scenes.forEach((scene, cardId) => {
                const camera = this.cameras.get(cardId);
                const renderer = this.renderers.get(cardId);
                const anim = this.animations.get(cardId);
                if (camera && renderer) {
                    if (anim) anim(delta, this.globalTime);
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
                const cam = this.cameras.get(cardId);
                const w = card.offsetWidth;
                const h = card.offsetHeight;
                if (w > 0 && h > 0) {
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                    renderer.setSize(w, h);
                }
            }
        });
    }

    getCardId(card) {
        if (!card.dataset.cardId) {
            card.dataset.cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        return card.dataset.cardId;
    }

    cleanup() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.scenes.forEach((_, cardId) => {
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (card) this.remove3DEffect(card);
        });
        if (_softCircleTex) { _softCircleTex.dispose(); _softCircleTex = null; }
        if (_snowflakeTex) { _snowflakeTex.dispose(); _snowflakeTex = null; }
        console.log('🧹 3D v2.0 cleaned up');
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-INITIALIZE
// ═══════════════════════════════════════════════════════════════
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.weather3DEffects = new Weather3DEffects();
    });
} else {
    window.weather3DEffects = new Weather3DEffects();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Weather3DEffects;
}

console.log('🎮 Weather 3D Effects v2.0 Premium loaded');

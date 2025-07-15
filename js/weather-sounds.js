/**
 * Weather Sounds Module - Realistic Audio System
 * Advanced synthetic weather sounds using Web Audio API
 */

class WeatherSounds {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.audioContext = null;
        this.activeSounds = new Map();
        this.audioUnlocked = false;
        
        this.init();
    }

    async init() {
        console.log('🔊 Initializing Realistic Weather Sounds...');
        
        // Create UI
        this.createUI();
        
        // Setup audio unlock
        this.setupAudioUnlock();
        
        // Connect to weather app
        this.connectToWeatherApp();
    }

    setupAudioUnlock() {
        const unlockAudio = async () => {
            if (this.audioUnlocked) return;
            
            try {
                // Create audio context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Create master gain
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = this.volume;
                this.masterGain.connect(this.audioContext.destination);
                
                // Create master compressor for better sound
                this.compressor = this.audioContext.createDynamicsCompressor();
                this.compressor.threshold.value = -24;
                this.compressor.knee.value = 30;
                this.compressor.ratio.value = 12;
                this.compressor.attack.value = 0.003;
                this.compressor.release.value = 0.25;
                this.compressor.connect(this.masterGain);
                
                // Test beep
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = 800;
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.1);
                
                this.audioUnlocked = true;
                console.log('✅ Audio unlocked!');
                
                // Update UI
                const status = document.querySelector('.sound-status');
                if (status) {
                    status.textContent = '✅ Zvuk aktivní';
                    setTimeout(() => {
                        status.textContent = 'Hover na kartu';
                    }, 2000);
                }
                
            } catch (e) {
                console.error('Audio unlock failed:', e);
            }
        };
        
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, unlockAudio, { once: true });
        });
    }

    createUI() {
        const existing = document.getElementById('weather-sounds-ui');
        if (existing) existing.remove();

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sound-panel-toggle';
        toggleBtn.innerHTML = '🎵';
        toggleBtn.title = 'Otevřít zvukový panel';
        
        // Create sidebar panel
        const ui = document.createElement('div');
        ui.id = 'weather-sounds-ui';
        ui.innerHTML = `
            <div class="sound-panel-header">
                <h3>🎵 Zvukové efekty</h3>
                <button id="sound-panel-close">&times;</button>
            </div>
            
            <div class="sound-panel-content">
                <div class="sound-control-group">
                    <label>Hlavní ovládání</label>
                    <div class="sound-main-controls">
                        <button id="sound-toggle" title="Zapnout/Vypnout zvuk">
                            ${this.enabled ? '🔊' : '🔇'}
                        </button>
                        <div class="volume-control">
                            <span class="volume-label">🔉</span>
                            <input type="range" id="volume-slider" min="0" max="100" value="${this.volume * 100}">
                            <span class="volume-value">${Math.round(this.volume * 100)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="sound-control-group">
                    <label>Stav přehrávání</label>
                    <div class="sound-status-container">
                        <div class="sound-status">Hover na kartu pro aktivaci</div>
                        <div class="sound-visualizer">
                            <div class="viz-bar"></div>
                            <div class="viz-bar"></div>
                            <div class="viz-bar"></div>
                            <div class="viz-bar"></div>
                            <div class="viz-bar"></div>
                        </div>
                    </div>
                </div>
                
                <div class="sound-control-group">
                    <label>Informace</label>
                    <div class="sound-info">
                        <p>💡 Najeďte myší na kartu počasí pro aktivaci zvukových efektů</p>
                        <p>🌧️ Každý typ počasí má unikátní zvukovou stopu</p>
                        <p>🌙 Zvuky se mění podle denní/noční doby</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #sound-panel-toggle {
                position: fixed;
                left: 2rem;
                bottom: 2rem;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            #sound-panel-toggle:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
            }
            
            #sound-panel-toggle.active {
                background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }
            
            #weather-sounds-ui {
                position: fixed;
                left: -350px;
                top: 0;
                width: 350px;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 1001;
                transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                overflow-y: auto;
                font-family: system-ui, sans-serif;
                color: white;
            }
            
            #weather-sounds-ui.open {
                left: 0;
            }
            
            .sound-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.05);
            }
            
            .sound-panel-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                background: linear-gradient(135deg, #667eea, #764ba2);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            #sound-panel-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.2s;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            #sound-panel-close:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: rotate(90deg);
            }
            
            .sound-panel-content {
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            .sound-control-group {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .sound-control-group label {
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: rgba(255, 255, 255, 0.7);
                font-weight: 600;
            }
            
            .sound-main-controls {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            #sound-toggle {
                background: linear-gradient(135deg, #667eea, #764ba2);
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 1rem;
                border-radius: 12px;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 60px;
            }
            
            #sound-toggle:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            }
            
            #sound-toggle.muted {
                background: linear-gradient(135deg, #6b7280, #9ca3af);
                opacity: 0.7;
            }
            
            .volume-control {
                display: flex;
                align-items: center;
                gap: 1rem;
                background: rgba(255, 255, 255, 0.05);
                padding: 1rem;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .volume-label {
                font-size: 1.25rem;
                min-width: 24px;
            }
            
            #volume-slider {
                flex: 1;
                height: 6px;
                -webkit-appearance: none;
                appearance: none;
                background: rgba(255, 255, 255, 0.2);
                outline: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            #volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                cursor: pointer;
                border-radius: 50%;
                transition: all 0.2s;
                box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
            }
            
            #volume-slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
            }
            
            #volume-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                cursor: pointer;
                border-radius: 50%;
                border: none;
                box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
            }
            
            .volume-value {
                font-size: 0.875rem;
                font-weight: 600;
                color: #667eea;
                min-width: 40px;
                text-align: right;
            }
            
            .sound-status-container {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .sound-status {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.8);
                margin-bottom: 1rem;
                text-align: center;
            }
            
            .sound-visualizer {
                display: flex;
                gap: 4px;
                align-items: flex-end;
                height: 40px;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            #weather-sounds-ui.playing .sound-visualizer {
                opacity: 1;
            }
            
            .viz-bar {
                width: 4px;
                background: linear-gradient(to top, #667eea, #764ba2);
                border-radius: 2px;
                animation: soundWave 0.6s ease-in-out infinite;
            }
            
            .viz-bar:nth-child(1) { animation-delay: 0s; height: 30%; }
            .viz-bar:nth-child(2) { animation-delay: 0.1s; height: 60%; }
            .viz-bar:nth-child(3) { animation-delay: 0.2s; height: 100%; }
            .viz-bar:nth-child(4) { animation-delay: 0.3s; height: 60%; }
            .viz-bar:nth-child(5) { animation-delay: 0.4s; height: 30%; }
            
            @keyframes soundWave {
                0%, 100% { transform: scaleY(0.3); }
                50% { transform: scaleY(1); }
            }
            
            .sound-info {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .sound-info p {
                margin: 0 0 0.75rem 0;
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.5;
            }
            
            .sound-info p:last-child {
                margin-bottom: 0;
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                #weather-sounds-ui {
                    width: 100%;
                    left: -100%;
                }
                
                #weather-sounds-ui.open {
                    left: 0;
                }
                
                #sound-panel-toggle {
                    left: 1rem;
                    bottom: 1rem;
                    width: 50px;
                    height: 50px;
                    font-size: 1.25rem;
                }
                
                .sound-panel-content {
                    padding: 1rem;
                    gap: 1.5rem;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(toggleBtn);
        document.body.appendChild(ui);
        
        // Event listeners
        toggleBtn.addEventListener('click', () => this.togglePanel());
        document.getElementById('sound-panel-close').addEventListener('click', () => this.togglePanel());
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.updateVolume();
            document.querySelector('.volume-value').textContent = `${Math.round(this.volume * 100)}%`;
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!ui.contains(e.target) && !toggleBtn.contains(e.target) && ui.classList.contains('open')) {
                this.togglePanel();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && ui.classList.contains('open')) {
                this.togglePanel();
            }
        });
    }
    
    togglePanel() {
        const ui = document.getElementById('weather-sounds-ui');
        const toggleBtn = document.getElementById('sound-panel-toggle');
        
        ui.classList.toggle('open');
        toggleBtn.classList.toggle('active');
        
        if (ui.classList.contains('open')) {
            toggleBtn.title = 'Zavřít zvukový panel';
        } else {
            toggleBtn.title = 'Otevřít zvukový panel';
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('sound-toggle');
        btn.textContent = this.enabled ? '🔊' : '🔇';
        btn.classList.toggle('muted', !this.enabled);
        
        if (!this.enabled) {
            this.stopAllSounds();
        }
    }

    updateVolume() {
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                this.volume,
                this.audioContext.currentTime + 0.1
            );
        }
        
        // Save preference
        if (window.localStorage) {
            localStorage.setItem('weatherSoundVolume', this.volume);
        }
    }

    connectToWeatherApp() {
        const setupHover = () => {
            console.log('🎯 Setting up hover sounds...');
            
            const setupCard = (card) => {
                card.removeEventListener('mouseenter', card._soundEnter);
                card.removeEventListener('mouseleave', card._soundLeave);
                
                card._soundEnter = () => {
                    if (!this.enabled || !this.audioUnlocked) return;
                    const weather = card.dataset.weather;
                    if (weather) {
                        this.playWeatherSound(card, weather);
                        document.querySelector('.sound-status').textContent = `Hraje: ${this.getWeatherName(weather)}`;
                        document.getElementById('weather-sounds-ui').classList.add('playing');
                    }
                };
                
                card._soundLeave = () => {
                    this.stopWeatherSound(card);
                    document.querySelector('.sound-status').textContent = 'Hover na kartu';
                    if (this.activeSounds.size === 0) {
                        document.getElementById('weather-sounds-ui').classList.remove('playing');
                    }
                };
                
                card.addEventListener('mouseenter', card._soundEnter);
                card.addEventListener('mouseleave', card._soundLeave);
                
                // Touch support
                card.addEventListener('touchstart', (e) => {
                    if (!this.enabled) return;
                    e.preventDefault();
                    card._soundEnter();
                    setTimeout(() => card._soundLeave(), 3000);
                });
            };
            
            document.querySelectorAll('.weather-card').forEach(setupCard);
            
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.classList?.contains('weather-card')) {
                            setTimeout(() => setupCard(node), 100);
                        }
                    });
                });
            });
            
            const grid = document.getElementById('weatherGrid');
            if (grid) observer.observe(grid, { childList: true });
        };
        
        if (document.readyState === 'complete') {
            setupHover();
        } else {
            document.addEventListener('DOMContentLoaded', setupHover);
        }
        
        setTimeout(setupHover, 2000);
        
        // Load saved volume
        if (window.localStorage) {
            const savedVolume = localStorage.getItem('weatherSoundVolume');
            if (savedVolume !== null) {
                this.volume = parseFloat(savedVolume);
                document.getElementById('volume-slider').value = this.volume * 100;
            }
        }
    }

    getWeatherName(weather) {
        const names = {
            'rain': 'Déšť',
            'thunderstorm': 'Bouřka',
            'drizzle': 'Mrholení',
            'snow': 'Sněžení',
            'clear': 'Jasno',
            'clouds': 'Oblačno',
            'mist': 'Mlha',
            'fog': 'Mlha',
            'haze': 'Opar'
        };
        return names[weather] || weather;
    }

    playWeatherSound(card, weather) {
        if (!this.audioContext) return;
        
        const cardId = this.getCardId(card);
        this.stopWeatherSound(card);
        
        try {
            // Get time of day from card data
            const hour = new Date().getHours();
            const isNight = hour < 6 || hour > 20;
            
            let soundGenerator;
            
            switch (weather.toLowerCase()) {
                case 'rain':
                    soundGenerator = this.createRainSound(isNight);
                    break;
                case 'thunderstorm':
                case 'thunder':
                case 'storm':
                    soundGenerator = this.createThunderstormSound(card, isNight);
                    break;
                case 'drizzle':
                    soundGenerator = this.createDrizzleSound(isNight);
                    break;
                case 'snow':
                    soundGenerator = this.createSnowSound(isNight);
                    break;
                case 'clear':
                    soundGenerator = this.createClearSound(isNight);
                    break;
                case 'clouds':
                    soundGenerator = this.createCloudsSound(isNight);
                    break;
                case 'mist':
                case 'fog':
                case 'haze':
                    soundGenerator = this.createMistSound(isNight);
                    break;
                default:
                    soundGenerator = this.createCloudsSound(isNight);
            }
            
            this.activeSounds.set(cardId, soundGenerator);
            
            // Visual feedback
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'all 0.3s ease';
            
            // Add time-based visual effect
            if (isNight) {
                card.style.filter = 'brightness(0.9)';
            }
            
        } catch (error) {
            console.error('Error playing weather sound:', error);
        }
    }

    createRainSound(isNight = false) {
        const now = this.audioContext.currentTime;
        const sounds = { nodes: [], stop: () => {} };
        
        // Adjust volume for night
        const nightVolumeFactor = isNight ? 0.7 : 1;
        
        // Create multiple layers for realistic rain
        
        // Layer 1: High frequency rain (main rain sound)
        const rainBuffer1 = this.audioContext.createBuffer(1, 2 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const rainData1 = rainBuffer1.getChannelData(0);
        
        // White noise for rain
        for (let i = 0; i < rainData1.length; i++) {
            rainData1[i] = Math.random() * 2 - 1;
        }
        
        const rainNoise1 = this.audioContext.createBufferSource();
        rainNoise1.buffer = rainBuffer1;
        rainNoise1.loop = true;
        
        // High frequency rain filter
        const rainHighpass = this.audioContext.createBiquadFilter();
        rainHighpass.type = 'highpass';
        rainHighpass.frequency.setValueAtTime(2000, now);
        
        const rainBandpass = this.audioContext.createBiquadFilter();
        rainBandpass.type = 'bandpass';
        rainBandpass.frequency.setValueAtTime(4000, now);
        rainBandpass.Q.setValueAtTime(2, now);
        
        const rainGain1 = this.audioContext.createGain();
        rainGain1.gain.setValueAtTime(0, now);
        rainGain1.gain.linearRampToValueAtTime(0.4 * nightVolumeFactor, now + 1);
        
        // Connect high frequency chain
        rainNoise1.connect(rainHighpass);
        rainHighpass.connect(rainBandpass);
        rainBandpass.connect(rainGain1);
        rainGain1.connect(this.compressor);
        
        // Layer 2: Mid frequency rain (body of rain)
        const rainBuffer2 = this.audioContext.createBuffer(1, 2 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const rainData2 = rainBuffer2.getChannelData(0);
        
        for (let i = 0; i < rainData2.length; i++) {
            rainData2[i] = Math.random() * 2 - 1;
        }
        
        const rainNoise2 = this.audioContext.createBufferSource();
        rainNoise2.buffer = rainBuffer2;
        rainNoise2.loop = true;
        
        const rainBandpass2 = this.audioContext.createBiquadFilter();
        rainBandpass2.type = 'bandpass';
        rainBandpass2.frequency.setValueAtTime(1500, now);
        rainBandpass2.Q.setValueAtTime(1, now);
        
        const rainGain2 = this.audioContext.createGain();
        rainGain2.gain.setValueAtTime(0, now);
        rainGain2.gain.linearRampToValueAtTime(0.25 * nightVolumeFactor, now + 1);
        
        // Connect mid frequency chain
        rainNoise2.connect(rainBandpass2);
        rainBandpass2.connect(rainGain2);
        rainGain2.connect(this.compressor);
        
        // Layer 3: Low frequency rumble (distant rain)
        const rainBuffer3 = this.audioContext.createBuffer(1, 2 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const rainData3 = rainBuffer3.getChannelData(0);
        
        for (let i = 0; i < rainData3.length; i++) {
            rainData3[i] = Math.random() * 2 - 1;
        }
        
        const rainNoise3 = this.audioContext.createBufferSource();
        rainNoise3.buffer = rainBuffer3;
        rainNoise3.loop = true;
        
        const rainLowpass = this.audioContext.createBiquadFilter();
        rainLowpass.type = 'lowpass';
        rainLowpass.frequency.setValueAtTime(500, now);
        
        const rainGain3 = this.audioContext.createGain();
        rainGain3.gain.setValueAtTime(0, now);
        rainGain3.gain.linearRampToValueAtTime(0.1 * nightVolumeFactor, now + 1);
        
        // Connect low frequency chain
        rainNoise3.connect(rainLowpass);
        rainLowpass.connect(rainGain3);
        rainGain3.connect(this.compressor);
        
        // Start all layers
        rainNoise1.start(now);
        rainNoise2.start(now);
        rainNoise3.start(now);
        
        sounds.nodes.push(rainNoise1, rainNoise2, rainNoise3);
        
        // Add individual rain drops
        const createRaindrops = () => {
            if (!this.activeSounds.has(sounds)) return;
            
            // Create multiple drops at once for denser rain
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const dropTime = this.audioContext.currentTime;
                    
                    // Each drop is a short burst of filtered noise
                    const dropOsc = this.audioContext.createOscillator();
                    dropOsc.type = 'square';
                    dropOsc.frequency.setValueAtTime(8000 + Math.random() * 4000, dropTime);
                    
                    const dropFilter = this.audioContext.createBiquadFilter();
                    dropFilter.type = 'bandpass';
                    dropFilter.frequency.value = 6000 + Math.random() * 2000;
                    dropFilter.Q.value = 20;
                    
                    const dropGain = this.audioContext.createGain();
                    dropGain.gain.setValueAtTime(0, dropTime);
                    dropGain.gain.linearRampToValueAtTime(0.03 * nightVolumeFactor, dropTime + 0.001);
                    dropGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.05);
                    
                    dropOsc.connect(dropFilter);
                    dropFilter.connect(dropGain);
                    dropGain.connect(this.compressor);
                    
                    dropOsc.start(dropTime);
                    dropOsc.stop(dropTime + 0.05);
                }, i * 20);
            }
            
            // Schedule next batch of drops
            setTimeout(createRaindrops, 50 + Math.random() * 100);
        };
        
        // Start raindrop generation after initial fade-in
        setTimeout(createRaindrops, 500);
        
        // SPECIAL EFFECT: Dripping water after rain (roof/gutter drops)
        if (!isNight) {
            const createDripping = () => {
                if (!this.activeSounds.has(sounds)) return;
                
                const dripTime = this.audioContext.currentTime;
                
                // Drip sound - metallic ping
                const dripOsc = this.audioContext.createOscillator();
                dripOsc.frequency.setValueAtTime(1000 + Math.random() * 500, dripTime);
                dripOsc.frequency.exponentialRampToValueAtTime(500, dripTime + 0.2);
                
                const dripGain = this.audioContext.createGain();
                dripGain.gain.setValueAtTime(0.1, dripTime);
                dripGain.gain.exponentialRampToValueAtTime(0.001, dripTime + 0.3);
                
                dripOsc.connect(dripGain);
                dripGain.connect(this.compressor);
                
                dripOsc.start(dripTime);
                dripOsc.stop(dripTime + 0.3);
                
                // Schedule next drip
                setTimeout(createDripping, 2000 + Math.random() * 4000);
            };
            
            setTimeout(createDripping, 3000);
        }
        
        sounds.stop = () => {
            const fadeTime = 0.5;
            rainGain1.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
            rainGain2.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
            rainGain3.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
            setTimeout(() => {
                sounds.nodes.forEach(node => {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                });
            }, fadeTime * 1000);
        };
        
        return sounds;
    }

    createThunderstormSound(card, isNight = false) {
        // Start with heavy rain
        const rainSound = this.createRainSound(isNight);
        
        // Make rain heavier
        const heavyRainGain = this.audioContext.createGain();
        heavyRainGain.gain.value = 1.5;
        
        // Add low rumble
        const rumble = this.audioContext.createOscillator();
        rumble.type = 'sawtooth';
        rumble.frequency.setValueAtTime(40, this.audioContext.currentTime);
        
        const rumbleLFO = this.audioContext.createOscillator();
        rumbleLFO.frequency.value = 0.5;
        const rumbleLFOGain = this.audioContext.createGain();
        rumbleLFOGain.gain.value = 10;
        rumbleLFO.connect(rumbleLFOGain);
        rumbleLFOGain.connect(rumble.frequency);
        
        const rumbleFilter = this.audioContext.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 60;
        
        const rumbleGain = this.audioContext.createGain();
        rumbleGain.gain.value = isNight ? 0.1 : 0.15;
        
        rumble.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(this.compressor);
        
        rumble.start();
        rumbleLFO.start();
        
        // Thunder strikes
        const scheduleThunder = () => {
            const thunderDelay = isNight ? 8000 + Math.random() * 15000 : 5000 + Math.random() * 10000;
            
            card._thunderTimeout = setTimeout(() => {
                if (!this.activeSounds.has(this.getCardId(card))) return;
                
                this.createThunderClap(card, isNight);
                scheduleThunder();
            }, thunderDelay);
        };
        
        scheduleThunder();
        
        const originalStop = rainSound.stop;
        rainSound.stop = () => {
            originalStop();
            rumble.stop();
            rumbleLFO.stop();
            if (card._thunderTimeout) {
                clearTimeout(card._thunderTimeout);
            }
        };
        
        return rainSound;
    }

    createThunderClap(card, isNight = false) {
        const now = this.audioContext.currentTime;
        const duration = 1 + Math.random() * 2;
        const volume = isNight ? 0.6 : 0.8;
        
        // Thunder sound synthesis
        const thunderNoise = this.audioContext.createBufferSource();
        const thunderBuffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const thunderData = thunderBuffer.getChannelData(0);
        
        // Generate thunder waveform
        for (let i = 0; i < thunderData.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const envelope = Math.exp(-t * 0.7) * (1 + Math.sin(t * 15) * 0.3);
            
            // Multiple noise layers
            let sample = 0;
            sample += (Math.random() * 2 - 1) * envelope;
            sample += Math.sin(t * 50) * envelope * 0.3;
            sample += Math.sin(t * 25) * envelope * 0.5;
            
            thunderData[i] = sample;
        }
        
        thunderNoise.buffer = thunderBuffer;
        
        // Thunder filters
        const thunderLowpass = this.audioContext.createBiquadFilter();
        thunderLowpass.type = 'lowpass';
        thunderLowpass.frequency.setValueAtTime(200, now);
        thunderLowpass.frequency.exponentialRampToValueAtTime(50, now + duration);
        
        const thunderHighpass = this.audioContext.createBiquadFilter();
        thunderHighpass.type = 'highpass';
        thunderHighpass.frequency.value = 20;
        
        // Thunder gain envelope
        const thunderGain = this.audioContext.createGain();
        thunderGain.gain.setValueAtTime(0, now);
        thunderGain.gain.linearRampToValueAtTime(volume, now + 0.05);
        thunderGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        // Connect thunder
        thunderNoise.connect(thunderLowpass);
        thunderLowpass.connect(thunderHighpass);
        thunderHighpass.connect(thunderGain);
        thunderGain.connect(this.compressor);
        
        thunderNoise.start(now);
        
        // Visual lightning flash
        card.style.filter = 'brightness(2)';
        setTimeout(() => {
            card.style.filter = '';
        }, 100);
        
        setTimeout(() => {
            card.style.filter = 'brightness(1.5)';
            setTimeout(() => {
                card.style.filter = '';
            }, 100);
        }, 150);
    }

    createDrizzleSound(isNight = false) {
        const now = this.audioContext.currentTime;
        const sounds = { nodes: [], stop: () => {} };
        
        // Volume adjustment for night
        const nightVolume = isNight ? 0.5 : 1;
        
        // Lighter rain noise
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        const drizzleNoise = this.audioContext.createBufferSource();
        drizzleNoise.buffer = noiseBuffer;
        drizzleNoise.loop = true;
        
        // Drizzle filters
        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 800;
        
        const bandpass = this.audioContext.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 2000;
        bandpass.Q.value = 2;
        
        const drizzleGain = this.audioContext.createGain();
        drizzleGain.gain.setValueAtTime(0, now);
        drizzleGain.gain.linearRampToValueAtTime(0.15 * nightVolume, now + 1.5);
        
        // Connect
        drizzleNoise.connect(highpass);
        highpass.connect(bandpass);
        bandpass.connect(drizzleGain);
        drizzleGain.connect(this.compressor);
        
        drizzleNoise.start(now);
        sounds.nodes.push(drizzleNoise);
        
        sounds.stop = () => {
            drizzleGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            setTimeout(() => {
                sounds.nodes.forEach(node => {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                });
            }, 500);
        };
        
        return sounds;
    }

    createSnowSound(isNight = false) {
        const now = this.audioContext.currentTime;
        const sounds = { nodes: [], stop: () => {} };
        
        // Wind base - quieter at night
        const windVolume = isNight ? 0.15 : 0.2;
        const windBuffer = this.audioContext.createBuffer(1, 2 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const windData = windBuffer.getChannelData(0);
        
        // Brown noise for wind
        let lastOut = 0;
        for (let i = 0; i < windData.length; i++) {
            const white = Math.random() * 2 - 1;
            windData[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = windData[i];
            windData[i] *= 3.5;
        }
        
        const windNoise = this.audioContext.createBufferSource();
        windNoise.buffer = windBuffer;
        windNoise.loop = true;
        
        // Wind filters
        const windFilter = this.audioContext.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 500;
        windFilter.Q.value = 1;
        
        // Wind modulation
        const windLFO = this.audioContext.createOscillator();
        windLFO.frequency.value = 0.2;
        const windLFOGain = this.audioContext.createGain();
        windLFOGain.gain.value = 200;
        windLFO.connect(windLFOGain);
        windLFOGain.connect(windFilter.frequency);
        
        const windGain = this.audioContext.createGain();
        windGain.gain.setValueAtTime(0, now);
        windGain.gain.linearRampToValueAtTime(windVolume, now + 2);
        
        // Connect wind
        windNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.compressor);
        
        windNoise.start(now);
        windLFO.start(now);
        
        sounds.nodes.push(windNoise, windLFO);
        
        // Crystalline snow sounds
        const createSnowCrystal = () => {
            if (!this.activeSounds.has(sounds)) return;
            
            const crystal = this.audioContext.createOscillator();
            crystal.frequency.value = 4000 + Math.random() * 2000;
            crystal.type = 'sine';
            
            const crystalGain = this.audioContext.createGain();
            const attackTime = 0.01;
            const decayTime = 0.1 + Math.random() * 0.2;
            
            crystalGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            crystalGain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + attackTime);
            crystalGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + decayTime);
            
            crystal.connect(crystalGain);
            crystalGain.connect(this.compressor);
            
            crystal.start();
            crystal.stop(this.audioContext.currentTime + decayTime);
            
            setTimeout(createSnowCrystal, 500 + Math.random() * 1500);
        };
        
        createSnowCrystal();
        
        sounds.stop = () => {
            windGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
            setTimeout(() => {
                sounds.nodes.forEach(node => {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                });
            }, 1000);
        };
        
        return sounds;
    }

    createClearSound(isNight = false) {
        const now = this.audioContext.currentTime;
        const sounds = { nodes: [], stop: () => {} };
        
        if (isNight) {
            // NIGHT: Crickets and night ambience
            
            // Cricket chirping
            const createCrickets = () => {
                if (!this.activeSounds.has(sounds)) return;
                
                // Multiple cricket layers
                for (let layer = 0; layer < 3; layer++) {
                    const cricket = this.audioContext.createOscillator();
                    const cricketGain = this.audioContext.createGain();
                    
                    // Different frequencies for each cricket
                    const baseFreq = 4000 + layer * 500;
                    cricket.frequency.setValueAtTime(baseFreq, now);
                    
                    // Chirp pattern
                    const chirpDuration = 0.02;
                    const chirpInterval = 0.08 + layer * 0.02;
                    
                    for (let i = 0; i < 5; i++) {
                        const chirpTime = now + i * chirpInterval;
                        cricketGain.gain.setValueAtTime(0, chirpTime);
                        cricketGain.gain.linearRampToValueAtTime(0.03, chirpTime + chirpDuration/2);
                        cricketGain.gain.linearRampToValueAtTime(0, chirpTime + chirpDuration);
                    }
                    
                    cricket.connect(cricketGain);
                    cricketGain.connect(this.compressor);
                    
                    cricket.start(now);
                    cricket.stop(now + 0.5);
                }
                
                // Schedule next cricket chorus
                setTimeout(createCrickets, 1000 + Math.random() * 2000);
            };
            
            createCrickets();
            
            // Night ambient drone
            const nightDrone = this.audioContext.createOscillator();
            nightDrone.type = 'sine';
            nightDrone.frequency.value = 50;
            
            const nightGain = this.audioContext.createGain();
            nightGain.gain.value = 0.02;
            
            nightDrone.connect(nightGain);
            nightGain.connect(this.compressor);
            nightDrone.start(now);
            
            sounds.nodes.push(nightDrone);
            
            // Occasional owl hoot
            const createOwl = () => {
                if (!this.activeSounds.has(sounds)) return;
                
                const owl = this.audioContext.createOscillator();
                owl.frequency.setValueAtTime(400, now);
                owl.frequency.exponentialRampToValueAtTime(300, now + 0.5);
                
                const owlGain = this.audioContext.createGain();
                owlGain.gain.setValueAtTime(0, now);
                owlGain.gain.linearRampToValueAtTime(0.1, now + 0.1);
                owlGain.gain.setValueAtTime(0.1, now + 0.4);
                owlGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                
                owl.connect(owlGain);
                owlGain.connect(this.compressor);
                
                owl.start(now);
                owl.stop(now + 0.5);
                
                // Schedule next owl
                setTimeout(createOwl, 15000 + Math.random() * 30000);
            };
            
            setTimeout(createOwl, 5000);
            
        } else {
            // DAY: Birds and summer ambience
            
            // Ambient summer background
            const ambientOsc = this.audioContext.createOscillator();
            ambientOsc.type = 'sine';
            ambientOsc.frequency.value = 150;
            
            const ambientGain = this.audioContext.createGain();
            ambientGain.gain.value = 0.02;
            
            ambientOsc.connect(ambientGain);
            ambientGain.connect(this.compressor);
            ambientOsc.start(now);
            
            sounds.nodes.push(ambientOsc);
            
            // Bird chirps - more active during day
            const createBirdChirp = () => {
                if (!this.activeSounds.has(sounds)) return;
                
                const chirpCount = 3 + Math.floor(Math.random() * 4);
                
                for (let i = 0; i < chirpCount; i++) {
                    setTimeout(() => {
                        const chirp = this.audioContext.createOscillator();
                        const chirpGain = this.audioContext.createGain();
                        
                        // Realistic bird frequencies
                        const baseFreq = 2500 + Math.random() * 2000;
                        chirp.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
                        chirp.frequency.exponentialRampToValueAtTime(
                            baseFreq * (0.8 + Math.random() * 0.4),
                            this.audioContext.currentTime + 0.1
                        );
                        
                        // Chirp envelope
                        chirpGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                        chirpGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.02);
                        chirpGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                        
                        // Add slight vibrato
                        const vibrato = this.audioContext.createOscillator();
                        vibrato.frequency.value = 5;
                        const vibratoGain = this.audioContext.createGain();
                        vibratoGain.gain.value = 50;
                        vibrato.connect(vibratoGain);
                        vibratoGain.connect(chirp.frequency);
                        
                        chirp.connect(chirpGain);
                        chirpGain.connect(this.compressor);
                        
                        chirp.start();
                        vibrato.start();
                        chirp.stop(this.audioContext.currentTime + 0.1);
                        vibrato.stop(this.audioContext.currentTime + 0.1);
                    }, i * 120);
                }
                
                // Schedule next chirp - more frequent during day
                setTimeout(createBirdChirp, 2000 + Math.random() * 3000);
            };
            
            createBirdChirp();
            
            // SPECIAL: Bees buzzing in summer
            const createBees = () => {
                if (!this.activeSounds.has(sounds)) return;
                
                const buzz = this.audioContext.createOscillator();
                buzz.frequency.value = 200;
                
                const buzzLFO = this.audioContext.createOscillator();
                buzzLFO.frequency.value = 20;
                const buzzLFOGain = this.audioContext.createGain();
                buzzLFOGain.gain.value = 50;
                
                buzzLFO.connect(buzzLFOGain);
                buzzLFOGain.connect(buzz.frequency);
                
                const buzzGain = this.audioContext.createGain();
                buzzGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                buzzGain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.5);
                buzzGain.gain.setValueAtTime(0.02, this.audioContext.currentTime + 2);
                buzzGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2.5);
                
                buzz.connect(buzzGain);
                buzzGain.connect(this.compressor);
                
                buzz.start(this.audioContext.currentTime);
                buzzLFO.start(this.audioContext.currentTime);
                buzz.stop(this.audioContext.currentTime + 2.5);
                buzzLFO.stop(this.audioContext.currentTime + 2.5);
                
                // Schedule next bee
                setTimeout(createBees, 10000 + Math.random() * 20000);
            };
            
            setTimeout(createBees, 3000);
        }
        
        // Gentle breeze (both day and night)
        const breeze = this.audioContext.createBufferSource();
        const breezeBuffer = this.audioContext.createBuffer(1, 2 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const breezeData = breezeBuffer.getChannelData(0);
        
        for (let i = 0; i < breezeData.length; i++) {
            breezeData[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        breeze.buffer = breezeBuffer;
        breeze.loop = true;
        
        const breezeFilter = this.audioContext.createBiquadFilter();
        breezeFilter.type = 'lowpass';
        breezeFilter.frequency.value = isNight ? 150 : 200;
        
        const breezeGain = this.audioContext.createGain();
        breezeGain.gain.value = isNight ? 0.03 : 0.05;
        
        breeze.connect(breezeFilter);
        breezeFilter.connect(breezeGain);
        breezeGain.connect(this.compressor);
        
        breeze.start(now);
        sounds.nodes.push(breeze);
        
        sounds.stop = () => {
            sounds.nodes.forEach(node => {
                if (node.stop) {
                    try {
                        node.stop();
                    } catch (e) {}
                }
                if (node.disconnect) {
                    node.disconnect();
                }
            });
        };
        
        return sounds;
    }

    createCloudsSound(isNight = false) {
        const now = this.audioContext.currentTime;
        const sounds = { nodes: [], stop: () => {} };
        
        // Soft wind - even softer at night
        const windVolume = isNight ? 0.05 : 0.08;
        
        // Soft wind
        const windNoise = this.audioContext.createBufferSource();
        const windBuffer = this.audioContext.createBuffer(1, 2 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const windData = windBuffer.getChannelData(0);
        
        for (let i = 0; i < windData.length; i++) {
            windData[i] = (Math.random() * 2 - 1);
        }
        
        windNoise.buffer = windBuffer;
        windNoise.loop = true;
        
        // Multiple filters for realistic wind
        const filter1 = this.audioContext.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.value = 400;
        
        const filter2 = this.audioContext.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.value = 100;
        
        // Slow modulation
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 0.3;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 100;
        lfo.connect(lfoGain);
        lfoGain.connect(filter1.frequency);
        
        const windGain = this.audioContext.createGain();
        windGain.gain.setValueAtTime(0, now);
        windGain.gain.linearRampToValueAtTime(windVolume, now + 1.5);
        
        // Connect
        windNoise.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(windGain);
        windGain.connect(this.compressor);
        
        windNoise.start(now);
        lfo.start(now);
        
        sounds.nodes.push(windNoise, lfo);
        
        sounds.stop = () => {
            windGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.8);
            setTimeout(() => {
                sounds.nodes.forEach(node => {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                });
            }, 800);
        };
        
        return sounds;
    }

    createMistSound(isNight = false) {
        const now = this.audioContext.currentTime;
        const sounds = { nodes: [], stop: () => {} };
        
        // Even more mysterious at night
        const volume = isNight ? 0.03 : 0.05;
        
        // Very soft ambient drone
        const drone1 = this.audioContext.createOscillator();
        drone1.type = 'sine';
        drone1.frequency.value = 80;
        
        const drone2 = this.audioContext.createOscillator();
        drone2.type = 'sine';
        drone2.frequency.value = 120.5; // Slight detuning for richness
        
        // Slow amplitude modulation
        const ampMod = this.audioContext.createOscillator();
        ampMod.frequency.value = 0.1;
        const ampModGain = this.audioContext.createGain();
        ampModGain.gain.value = 0.3;
        
        const droneGain1 = this.audioContext.createGain();
        const droneGain2 = this.audioContext.createGain();
        const masterDroneGain = this.audioContext.createGain();
        
        ampMod.connect(ampModGain);
        ampModGain.connect(droneGain1.gain);
        ampModGain.connect(droneGain2.gain);
        
        droneGain1.gain.value = 0.5;
        droneGain2.gain.value = 0.5;
        masterDroneGain.gain.setValueAtTime(0, now);
        masterDroneGain.gain.linearRampToValueAtTime(volume, now + 3);
        
        // Reverb-like effect using delay
        const delay = this.audioContext.createDelay(1);
        delay.delayTime.value = 0.2;
        const delayFeedback = this.audioContext.createGain();
        delayFeedback.gain.value = 0.5;
        const delayFilter = this.audioContext.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 1000;
        
        // Connect drones
        drone1.connect(droneGain1);
        drone2.connect(droneGain2);
        droneGain1.connect(masterDroneGain);
        droneGain2.connect(masterDroneGain);
        masterDroneGain.connect(delay);
        masterDroneGain.connect(this.compressor);
        
        delay.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delay);
        delayFeedback.connect(this.compressor);
        
        drone1.start(now);
        drone2.start(now);
        ampMod.start(now);
        
        sounds.nodes.push(drone1, drone2, ampMod);
        
        sounds.stop = () => {
            masterDroneGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
            delayFeedback.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
            setTimeout(() => {
                sounds.nodes.forEach(node => {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                });
            }, 2000);
        };
        
        return sounds;
    }

    stopWeatherSound(card) {
        const cardId = this.getCardId(card);
        const sound = this.activeSounds.get(cardId);
        
        if (sound && sound.stop) {
            sound.stop();
            this.activeSounds.delete(cardId);
        }
        
        // Reset visual
        card.style.transform = '';
        
        // Clear thunder timeout if any
        if (card._thunderTimeout) {
            clearTimeout(card._thunderTimeout);
        }
    }

    stopAllSounds() {
        this.activeSounds.forEach((sound, cardId) => {
            if (sound && sound.stop) {
                sound.stop();
            }
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (card) {
                card.style.transform = '';
            }
        });
        this.activeSounds.clear();
        document.querySelector('.sound-status').textContent = 'Hover na kartu';
        document.getElementById('weather-sounds-ui').classList.remove('playing');
    }

    getCardId(card) {
        if (!card.dataset.cardId) {
            card.dataset.cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        return card.dataset.cardId;
    }
}

// Initialize
console.log('🔊 Weather Sounds Module loading...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.weatherSounds = new WeatherSounds();
    });
} else {
    window.weatherSounds = new WeatherSounds();
}

// Debug helper
window.debugWeatherSounds = () => {
    const sounds = window.weatherSounds;
    console.log('=== Weather Sounds Debug ===');
    console.log('Enabled:', sounds.enabled);
    console.log('Volume:', sounds.volume);
    console.log('Audio Unlocked:', sounds.audioUnlocked);
    console.log('Active Sounds:', sounds.activeSounds.size);
    console.log('Audio Context State:', sounds.audioContext?.state);
    console.log('===========================');
};
/**
 * Weather Ultimate - Next Level Architecture
 * Professional weather application with advanced features
 */

// Configuration
const CONFIG = {
    API_KEY: '4078c40502499b6489b8982b0930b28c',
    API_BASE_URL: 'https://api.openweathermap.org/data/2.5',
    GEO_API_URL: 'https://api.openweathermap.org/geo/1.0',
    CACHE_NAME: 'weather-ultimate-v1',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    UPDATE_INTERVAL: 60 * 1000, // 1 minute - EXACTLY AS REQUESTED
    ANIMATION_DURATION: 300,
    DEFAULT_CITIES: [
        { name: 'Praha', country: 'CZ', lat: 50.0755, lon: 14.4378 },
        { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
        { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
        { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 },
        { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
        { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 }
    ],
    WEATHER_MOODS: {
        'clear': { text: 'Perfektní', colors: ['#FFD700', '#FFA500'], emoji: '😎' },
        'clouds': { text: 'Zamyšlené', colors: ['#718096', '#4A5568'], emoji: '🤔' },
        'rain': { text: 'Melancholické', colors: ['#4299E1', '#2B6CB0'], emoji: '😌' },
        'drizzle': { text: 'Romantické', colors: ['#805AD5', '#6B46C1'], emoji: '💕' },
        'thunderstorm': { text: 'Dramatické', colors: ['#9F7AEA', '#805AD5'], emoji: '🎭' },
        'snow': { text: 'Kouzelné', colors: ['#E2E8F0', '#CBD5E0'], emoji: '✨' },
        'mist': { text: 'Tajemné', colors: ['#A0AEC0', '#718096'], emoji: '🔮' }
    }
};

// State Manager
class StateManager {
    constructor() {
        this.state = {
            cities: new Map(),
            isLoading: false,
            searchQuery: '',
            selectedCity: null,
            stats: {
                total: 0,
                avgTemp: 0,
                sunnyCount: 0,
                lastUpdate: null
            }
        };
        this.listeners = new Map();
    }

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    updateState(updates) {
        Object.assign(this.state, updates);
        this.emit('stateChange', this.state);
    }

    addCity(cityData) {
        this.state.cities.set(cityData.id, cityData);
        this.updateStats();
        this.emit('cityAdded', cityData);
    }

    updateStats() {
        const cities = Array.from(this.state.cities.values());
        const temps = cities.map(c => c.main.temp);
        const sunnyCount = cities.filter(c => c.weather[0].main.toLowerCase() === 'clear').length;

        this.state.stats = {
            total: cities.length,
            avgTemp: temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : 0,
            sunnyCount,
            lastUpdate: new Date()
        };

        this.emit('statsUpdated', this.state.stats);
    }
}

// Advanced Cache with IndexedDB
class AdvancedCache {
    constructor() {
        this.memoryCache = new Map();
        this.initIndexedDB();
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WeatherUltimate', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('weather')) {
                    db.createObjectStore('weather', { keyPath: 'id' });
                }
            };
        });
    }

    async set(key, data) {
        const item = {
            id: key,
            data,
            timestamp: Date.now()
        };

        this.memoryCache.set(key, item);

        if (this.db) {
            const transaction = this.db.transaction(['weather'], 'readwrite');
            const store = transaction.objectStore('weather');
            store.put(item);
        }
    }

    async get(key) {
        const memoryItem = this.memoryCache.get(key);
        if (memoryItem && this.isValid(memoryItem)) {
            return memoryItem.data;
        }

        if (this.db) {
            return new Promise((resolve) => {
                const transaction = this.db.transaction(['weather'], 'readonly');
                const store = transaction.objectStore('weather');
                const request = store.get(key);
                
                request.onsuccess = () => {
                    const item = request.result;
                    if (item && this.isValid(item)) {
                        this.memoryCache.set(key, item);
                        resolve(item.data);
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => resolve(null);
            });
        }

        return null;
    }

    isValid(item) {
        return Date.now() - item.timestamp < CONFIG.CACHE_DURATION;
    }
}

// Weather API Service
class WeatherService {
    constructor(cache) {
        this.cache = cache;
        this.requestQueue = [];
        this.processing = false;
    }

    async fetchWeather(lat, lon) {
        const cacheKey = `weather-${lat}-${lon}`;
        const cached = await this.cache.get(cacheKey);
        
        if (cached) {
            console.log('🎯 Cache hit:', cacheKey);
            return cached;
        }

        return this.queueRequest(async () => {
            const url = `${CONFIG.API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric&lang=cs`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Weather API Error: ${response.status}`);
            }

            const data = await response.json();
            await this.cache.set(cacheKey, data);
            return data;
        });
    }

    async fetchForecast(lat, lon) {
        const cacheKey = `forecast-${lat}-${lon}`;
        const cached = await this.cache.get(cacheKey);
        
        if (cached) {
            console.log('🎯 Forecast cache hit:', cacheKey);
            return cached;
        }

        return this.queueRequest(async () => {
            const url = `${CONFIG.API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric&lang=cs`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Forecast API Error: ${response.status}`);
            }

            const data = await response.json();
            await this.cache.set(cacheKey, data);
            return data;
        });
    }

    async searchCity(query) {
        const url = `${CONFIG.GEO_API_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Geo API Error: ${response.status}`);
        }

        return response.json();
    }

    async queueRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ fn: requestFn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.requestQueue.length === 0) return;

        this.processing = true;
        const { fn, resolve, reject } = this.requestQueue.shift();

        try {
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.processing = false;
            setTimeout(() => this.processQueue(), 100);
        }
    }
}

// AI Predictions Engine
class AIPredictions {
    constructor() {
        this.predictions = [
            "Podle analýzy tlakových systémů očekávejte stabilní počasí v následujících 48 hodinách.",
            "Detekuji přibližující se frontální systém. Připravte se na změnu počasí během 24-36 hodin.",
            "Satelitní data ukazují na formování vysokotlakové oblasti. Slunečné dny jsou na obzoru!",
            "Analyzuji proudění vzduchu - výrazné ochlazení není v dohledu.",
            "Modely předpovídají nadprůměrné teploty pro toto roční období."
        ];
    }

    generatePrediction(weatherData) {
        const temps = weatherData.map(d => d.main.temp);
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        const conditions = weatherData.map(d => d.weather[0].main);
        
        let prediction = this.predictions[Math.floor(Math.random() * this.predictions.length)];
        
        if (avgTemp > 25) {
            prediction = "🔥 Detekuji výrazně nadprůměrné teploty. Doporučuji zvýšený příjem tekutin a vyhýbání se přímému slunci.";
        } else if (avgTemp < 5) {
            prediction = "❄️ Nízké teploty napříč regiony. Oblečte se teple a připravte se na možné námrazy.";
        }
        
        if (conditions.filter(c => c === 'Rain').length > weatherData.length / 2) {
            prediction = "🌧️ Rozsáhlé srážkové systémy dominují. Nezapomeňte na deštník!";
        }
        
        return prediction;
    }
}

// Particle System
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((particle, index) => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.x -= dx * force * 0.03;
                particle.y -= dy * force * 0.03;
            }

            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
            this.ctx.fill();

            this.particles.slice(index + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${0.1 * (1 - distance / 150)})`;
                    this.ctx.stroke();
                }
            });
        });

        requestAnimationFrame(() => this.animate());
    }
}

// UI Components
class UIComponents {
    static weatherCard(city, data, forecast = null) {
        const weather = data.weather[0].main.toLowerCase();
        const mood = CONFIG.WEATHER_MOODS[weather] || CONFIG.WEATHER_MOODS['clear'];
        const emoji = this.getWeatherEmoji(weather);
        
        // Translate weather descriptions to Czech
        const czechDescription = this.translateWeatherToCzech(data.weather[0].description);
        
        // Get timezone offset from API (in seconds)
        const timezoneOffset = data.timezone || 0;
        
        // Convert sunrise and sunset to local time
        const sunriseUTC = new Date(data.sys.sunrise * 1000);
        const sunsetUTC = new Date(data.sys.sunset * 1000);
        
        // Apply timezone offset
        const sunriseLocal = new Date(sunriseUTC.getTime() + timezoneOffset * 1000);
        const sunsetLocal = new Date(sunsetUTC.getTime() + timezoneOffset * 1000);
        
        // Format times
        const sunriseTime = sunriseLocal.toISOString().substring(11, 16);
        const sunsetTime = sunsetLocal.toISOString().substring(11, 16);
        
        // Calculate day length
        const dayLength = data.sys.sunset - data.sys.sunrise;
        const hours = Math.floor(dayLength / 3600);
        const minutes = Math.floor((dayLength % 3600) / 60);

        // Calculate current local time for the city
        const nowMs = Date.now();
        const nowUtcMs = nowMs + (new Date().getTimezoneOffset() * 60000);
        const cityLocalMs = nowUtcMs + (timezoneOffset * 1000);
        const cityLocalTime = new Date(cityLocalMs);
        const localTimeStr = cityLocalTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Determine time of day (4 phases)
        const nowUtcSec = Math.floor(nowMs / 1000);
        const TWILIGHT_SEC = 1800; // 30 minutes
        let dayPhase, dayPhaseEmoji, dayPhaseText;

        if (nowUtcSec >= data.sys.sunrise && nowUtcSec < data.sys.sunset) {
            dayPhase = 'day'; dayPhaseEmoji = '☀️'; dayPhaseText = 'Den';
        } else if (nowUtcSec >= (data.sys.sunrise - TWILIGHT_SEC) && nowUtcSec < data.sys.sunrise) {
            dayPhase = 'dawn'; dayPhaseEmoji = '🌅'; dayPhaseText = 'Úsvit';
        } else if (nowUtcSec >= data.sys.sunset && nowUtcSec < (data.sys.sunset + TWILIGHT_SEC)) {
            dayPhase = 'twilight'; dayPhaseEmoji = '🌇'; dayPhaseText = 'Soumrak';
        } else {
            dayPhase = 'night'; dayPhaseEmoji = '🌙'; dayPhaseText = 'Noc';
        }
        
        // Process hourly forecast
        let hourlyForecastHTML = '';
        if (forecast && forecast.list) {
            const hourlyData = forecast.list.slice(0, 8); // Next 8 x 3-hour periods = 24 hours
            hourlyForecastHTML = `
                <div class="hourly-forecast">
                    <h4 class="hourly-forecast__title">Hodinová předpověď</h4>
                    <div class="hourly-forecast__scroll">
                        ${hourlyData.map(hour => {
                            const hourTime = new Date(hour.dt * 1000 + timezoneOffset * 1000);
                            const hourStr = hourTime.toISOString().substring(11, 16);
                            const hourEmoji = this.getWeatherEmoji(hour.weather[0].main.toLowerCase());
                            return `
                                <div class="hourly-item">
                                    <div class="hourly-item__time">${hourStr}</div>
                                    <div class="hourly-item__icon">${hourEmoji}</div>
                                    <div class="hourly-item__temp">${Math.round(hour.main.temp)}°</div>
                                    <div class="hourly-item__rain">
                                        ${hour.pop ? `<span class="rain-prob">💧${Math.round(hour.pop * 100)}%</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        return `
            <article class="weather-card weather-card--${dayPhase}"
                     data-city="${city.name}"
                     data-weather="${weather}"
                     data-lat="${city.lat}"
                     data-lon="${city.lon}"
                     style="--mood-color-1: ${mood.colors[0]}; --mood-color-2: ${mood.colors[1]};"
                     role="listitem"
                     tabindex="0">
                <div class="live-badge">
                    <div class="live-badge__dot"></div>
                    <span>Live</span>
                </div>
                
                <header class="weather-card__header">
                    <h3 class="weather-card__city">${city.name}</h3>
                    <p class="weather-card__country">${city.country || ''}</p>
                    <div class="weather-card__local-time"
                         data-timezone="${timezoneOffset}"
                         data-sunrise="${data.sys.sunrise}"
                         data-sunset="${data.sys.sunset}">
                        <span class="weather-card__clock">${localTimeStr}</span>
                        <span class="weather-card__daynight-badge weather-card__daynight-badge--${dayPhase}">${dayPhaseEmoji} ${dayPhaseText}</span>
                    </div>
                </header>
                
                <div class="weather-card__main">
                    <div class="weather-card__temp">
                        ${Math.round(data.main.temp)}<span class="weather-card__temp-unit">°C</span>
                    </div>
                    <div class="weather-card__icon">${emoji}</div>
                </div>
                
                <p class="weather-card__description">${czechDescription}</p>
                
                <div class="weather-details">
                    <div class="detail">
                        <div class="detail__icon">🌡️</div>
                        <div class="detail__value">${Math.round(data.main.feels_like)}°</div>
                        <div class="detail__label">Pocitově</div>
                    </div>
                    <div class="detail">
                        <div class="detail__icon">💧</div>
                        <div class="detail__value">${data.main.humidity}%</div>
                        <div class="detail__label">Vlhkost</div>
                    </div>
                    <div class="detail">
                        <div class="detail__icon">💨</div>
                        <div class="detail__value">${Math.round(data.wind.speed * 3.6)}</div>
                        <div class="detail__label">km/h</div>
                    </div>
                </div>
                
                ${hourlyForecastHTML}
                
                <div class="sun-info">
                    <div class="sun-info__item">
                        <span class="sun-info__icon">🌅</span>
                        <div class="sun-info__data">
                            <span class="sun-info__label">Východ</span>
                            <span class="sun-info__time">${sunriseTime}</span>
                        </div>
                    </div>
                    <div class="sun-info__separator">
                        <span class="day-length">${hours}h ${minutes}m</span>
                        <span class="day-length-label">délka dne</span>
                    </div>
                    <div class="sun-info__item">
                        <span class="sun-info__icon">🌇</span>
                        <div class="sun-info__data">
                            <span class="sun-info__label">Západ</span>
                            <span class="sun-info__time">${sunsetTime}</span>
                        </div>
                    </div>
                </div>
                
                <div class="weather-mood">
                    <p class="weather-mood__label">Nálada počasí</p>
                    <p class="weather-mood__value">${mood.emoji} ${mood.text}</p>
                </div>
                
                <button class="forecast-button" onclick="window.weatherApp.showForecast('${city.name}', ${city.lat}, ${city.lon})">
                    📅 Zobrazit 7-denní předpověď
                </button>
            </article>
        `;
    }

    static translateWeatherToCzech(description) {
        // Common weather descriptions translation
        const translations = {
            // Clear
            'clear sky': 'jasno',
            'clear': 'jasno',
            
            // Clouds
            'few clouds': 'skoro jasno',
            'scattered clouds': 'polojasno',
            'broken clouds': 'oblačno',
            'overcast clouds': 'zataženo',
            'clouds': 'oblačno',
            
            // Rain
            'light rain': 'slabý déšť',
            'moderate rain': 'mírný déšť',
            'heavy intensity rain': 'silný déšť',
            'very heavy rain': 'velmi silný déšť',
            'extreme rain': 'extrémní déšť',
            'freezing rain': 'mrznoucí déšť',
            'light intensity shower rain': 'slabé přeháňky',
            'shower rain': 'přeháňky',
            'heavy intensity shower rain': 'silné přeháňky',
            'ragged shower rain': 'občasné přeháňky',
            'rain': 'déšť',
            
            // Drizzle
            'light intensity drizzle': 'slabé mrholení',
            'drizzle': 'mrholení',
            'heavy intensity drizzle': 'silné mrholení',
            'light intensity drizzle rain': 'slabé mrholení s deštěm',
            'drizzle rain': 'mrholení s deštěm',
            'heavy intensity drizzle rain': 'silné mrholení s deštěm',
            'shower rain and drizzle': 'přeháňky s mrholením',
            'heavy shower rain and drizzle': 'silné přeháňky s mrholením',
            'shower drizzle': 'mrholivé přeháňky',
            
            // Thunderstorm
            'thunderstorm with light rain': 'bouřka se slabým deštěm',
            'thunderstorm with rain': 'bouřka s deštěm',
            'thunderstorm with heavy rain': 'bouřka se silným deštěm',
            'light thunderstorm': 'slabá bouřka',
            'thunderstorm': 'bouřka',
            'heavy thunderstorm': 'silná bouřka',
            'ragged thunderstorm': 'občasná bouřka',
            'thunderstorm with light drizzle': 'bouřka se slabým mrholením',
            'thunderstorm with drizzle': 'bouřka s mrholením',
            'thunderstorm with heavy drizzle': 'bouřka se silným mrholením',
            
            // Snow
            'light snow': 'slabé sněžení',
            'snow': 'sněžení',
            'heavy snow': 'silné sněžení',
            'sleet': 'déšť se sněhem',
            'light shower sleet': 'slabé přeháňky s deštěm a sněhem',
            'shower sleet': 'přeháňky s deštěm a sněhem',
            'light rain and snow': 'slabý déšť se sněhem',
            'rain and snow': 'déšť se sněhem',
            'light shower snow': 'slabé sněhové přeháňky',
            'shower snow': 'sněhové přeháňky',
            'heavy shower snow': 'silné sněhové přeháňky',
            
            // Atmosphere
            'mist': 'mlha',
            'smoke': 'kouř',
            'haze': 'opar',
            'sand/dust whirls': 'písečné/prachové víry',
            'fog': 'mlha',
            'sand': 'písek',
            'dust': 'prach',
            'volcanic ash': 'sopečný popel',
            'squalls': 'poryvy větru',
            'tornado': 'tornádo',
            
            // Additional
            'light intensity': 'slabá intenzita',
            'heavy intensity': 'silná intenzita',
            'very heavy': 'velmi silný',
            'extreme': 'extrémní',
            'freezing': 'mrznoucí',
            'shower': 'přeháňky',
            'ragged': 'občasný'
        };
        
        // Convert to lowercase for matching
        const lowerDesc = description.toLowerCase();
        
        // Check for exact match first
        if (translations[lowerDesc]) {
            return translations[lowerDesc];
        }
        
        // Try to find partial matches
        for (const [eng, cz] of Object.entries(translations)) {
            if (lowerDesc.includes(eng)) {
                return cz;
            }
        }
        
        // If no translation found, return original
        return description;
    }

    static getWeatherEmoji(weather) {
        const emojis = {
            'clear': '☀️',
            'clouds': '☁️',
            'rain': '🌧️',
            'drizzle': '🌦️',
            'thunderstorm': '⛈️',
            'snow': '❄️',
            'mist': '🌫️',
            'fog': '🌫️',
            'haze': '🌫️'
        };
        return emojis[weather] || '🌈';
    }

    static notification(title, message, type = 'info') {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };

        return `
            <div class="notification__icon">${icons[type]}</div>
            <div class="notification__content">
                <h4 class="notification__title">${title}</h4>
                <p class="notification__message">${message}</p>
            </div>
        `;
    }

    static skeletonCard() {
        return `
            <div class="weather-card skeleton">
                <div class="skeleton" style="height: 32px; width: 60%; margin-bottom: 1rem;"></div>
                <div class="skeleton" style="height: 64px; width: 40%; margin-bottom: 1rem;"></div>
                <div class="skeleton" style="height: 24px; width: 80%; margin-bottom: 1.5rem;"></div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                    <div class="skeleton" style="height: 80px;"></div>
                    <div class="skeleton" style="height: 80px;"></div>
                    <div class="skeleton" style="height: 80px;"></div>
                </div>
            </div>
        `;
    }
}

// Main Application Controller
class WeatherUltimate {
    constructor() {
        this.state = new StateManager();
        this.cache = new AdvancedCache();
        this.weatherService = new WeatherService(this.cache);
        this.aiEngine = new AIPredictions();
        this.updateInterval = null;
        this.initializeApp();
    }

    async initializeApp() {
        const canvas = document.getElementById('particle-canvas');
        this.particleSystem = new ParticleSystem(canvas);

        this.setupEventListeners();
        this.state.subscribe('stateChange', () => this.updateUI());
        this.state.subscribe('statsUpdated', (stats) => this.updateStats(stats));

        await this.loadDefaultCities();
        this.startRealTimeUpdates();
        this.setupIntersectionObserver();
    }

    setupEventListeners() {
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');
        const searchSuggestions = document.getElementById('searchSuggestions');

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                await this.searchAndAddCity(query);
                searchInput.value = '';
            }
        });

        let searchTimeout;
        searchInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchSuggestions.classList.remove('search-suggestions--active');
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const suggestions = await this.weatherService.searchCity(query);
                    this.showSearchSuggestions(suggestions);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchSuggestions.classList.remove('search-suggestions--active');
            }
            
            const card = e.target.closest('.weather-card');
            if (card && 
                !e.target.closest('.forecast-button') && 
                !e.target.closest('.hourly-forecast') &&
                !e.target.closest('.hourly-item')) {
                this.handleCardClick(card);
            }
        });

        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.weather-card');
            if (card) {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mouse-x', `${x}%`);
                card.style.setProperty('--mouse-y', `${y}%`);
            }
        });
    }

    async loadDefaultCities() {
        const weatherGrid = document.getElementById('weatherGrid');
        weatherGrid.innerHTML = Array(6).fill(0).map(() => UIComponents.skeletonCard()).join('');

        try {
            const promises = CONFIG.DEFAULT_CITIES.map(async (city) => {
                try {
                    const data = await this.weatherService.fetchWeather(city.lat, city.lon);
                    const forecast = await this.weatherService.fetchForecast(city.lat, city.lon);
                    return { city, data, forecast };
                } catch (error) {
                    console.error(`Error loading ${city.name}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const validResults = results.filter(r => r !== null);

            weatherGrid.innerHTML = '';
            
            validResults.forEach(({ city, data, forecast }) => {
                data.id = `${city.lat}-${city.lon}`;
                this.state.addCity(data);
                const card = UIComponents.weatherCard(city, data, forecast);
                weatherGrid.insertAdjacentHTML('beforeend', card);
                
                // Add weather effects to card after it's in DOM
                setTimeout(() => {
                    const insertedCard = weatherGrid.lastElementChild;
                    if (insertedCard && this.cardEffects) {
                        const weatherType = data.weather[0].main;
                        this.cardEffects.createCardEffect(insertedCard, weatherType);
                    }
                }, 100);
            });

            const weatherData = validResults.map(r => r.data);
            this.updateAIPrediction(weatherData);

        } catch (error) {
            this.showNotification('Chyba', 'Nepodařilo se načíst počasí', 'error');
        }
    }

    async searchAndAddCity(query) {
        try {
            this.showNotification('Hledám', `Vyhledávám město "${query}"...`, 'info');
            
            const geoResults = await this.weatherService.searchCity(query);
            if (geoResults.length === 0) {
                throw new Error('Město nenalezeno');
            }

            const location = geoResults[0];
            const city = {
                name: location.local_names?.cs || location.name,
                country: location.country,
                lat: location.lat,
                lon: location.lon
            };

            const weatherData = await this.weatherService.fetchWeather(city.lat, city.lon);
            const forecastData = await this.weatherService.fetchForecast(city.lat, city.lon);
            
            const cityId = `${city.lat}-${city.lon}`;
            if (this.state.state.cities.has(cityId)) {
                this.showNotification('Info', 'Toto město již sledujete', 'warning');
                return;
            }

            weatherData.id = cityId;
            this.state.addCity(weatherData);
            
            const weatherGrid = document.getElementById('weatherGrid');
            const card = UIComponents.weatherCard(city, weatherData, forecastData);
            weatherGrid.insertAdjacentHTML('afterbegin', card);

            const newCard = weatherGrid.firstElementChild;
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(-20px) scale(0.95)';
            
            requestAnimationFrame(() => {
                newCard.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                newCard.style.opacity = '1';
                newCard.style.transform = 'translateY(0) scale(1)';
            });

            // Add weather effects to new card
            setTimeout(() => {
                if (this.cardEffects) {
                    const weatherType = weatherData.weather[0].main;
                    this.cardEffects.createCardEffect(newCard, weatherType);
                }
            }, 100);

            this.showNotification('Úspěch', `Město ${city.name} bylo přidáno`, 'success');

        } catch (error) {
            this.showNotification('Chyba', error.message, 'error');
        }
    }

    showSearchSuggestions(suggestions) {
        const container = document.getElementById('searchSuggestions');
        
        if (suggestions.length === 0) {
            container.classList.remove('search-suggestions--active');
            return;
        }

        const html = suggestions.map(s => `
            <div class="suggestion-item" 
                 data-lat="${s.lat}" 
                 data-lon="${s.lon}"
                 data-name="${s.local_names?.cs || s.name}"
                 data-country="${s.country}">
                <span class="suggestion-item__name">
                    ${s.local_names?.cs || s.name}
                </span>
                <span class="suggestion-item__country">
                    ${s.state ? `${s.state}, ` : ''}${s.country}
                </span>
            </div>
        `).join('');

        container.innerHTML = html;
        container.classList.add('search-suggestions--active');

        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                document.getElementById('searchInput').value = name;
                container.classList.remove('search-suggestions--active');
                this.searchAndAddCity(name);
            });
        });
    }

    updateAIPrediction(weatherData) {
        const prediction = this.aiEngine.generatePrediction(weatherData);
        const aiContent = document.getElementById('aiContent');
        
        aiContent.style.opacity = '0';
        setTimeout(() => {
            aiContent.textContent = prediction;
            aiContent.style.opacity = '1';
        }, 300);
    }

    updateStats(stats) {
        document.getElementById('totalCities').textContent = stats.total;
        document.getElementById('avgTemp').textContent = `${stats.avgTemp}°C`;
        document.getElementById('sunnyCount').textContent = stats.sunnyCount;
        document.getElementById('updateTime').textContent = 
            stats.lastUpdate?.toLocaleTimeString('cs-CZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }) || '--:--';
    }

    showNotification(title, message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.innerHTML = UIComponents.notification(title, message, type);
        notification.classList.add('notification--show');

        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('notification--show');
        }, 4000);
    }

    handleCardClick(card) {
        // Animate card
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        // Get city data and show forecast
        const cityName = card.dataset.city;
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        
        console.log('Card clicked:', cityName);
        vibrate([50]);
        
        // Show forecast when clicking on card
        if (lat && lon) {
            this.showForecast(cityName, lat, lon);
        }
    }

    async showForecast(cityName, lat, lon) {
        try {
            this.showNotification('Načítám', 'Získávám 7-denní předpověď...', 'info');
            
            const forecastData = await this.weatherService.fetchForecast(lat, lon);
            
            // Process forecast data - group by days
            const dailyForecasts = this.processForecastData(forecastData.list);
            
            // Create and show modal
            this.showForecastModal(cityName, dailyForecasts);
            
        } catch (error) {
            this.showNotification('Chyba', 'Nepodařilo se načíst předpověď', 'error');
            console.error('Forecast error:', error);
        }
    }

    processForecastData(forecastList) {
        const days = new Map();
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString('cs-CZ');
            
            if (!days.has(dayKey)) {
                days.set(dayKey, {
                    date: date,
                    temps: [],
                    weather: [],
                    humidity: [],
                    wind: [],
                    items: []
                });
            }
            
            const day = days.get(dayKey);
            day.temps.push(item.main.temp);
            day.weather.push(item.weather[0]);
            day.humidity.push(item.main.humidity);
            day.wind.push(item.wind.speed);
            day.items.push(item);
        });
        
        // Calculate daily averages and get most common weather
        const dailyData = [];
        days.forEach((day, dayKey) => {
            const avgTemp = day.temps.reduce((a, b) => a + b, 0) / day.temps.length;
            const minTemp = Math.min(...day.temps);
            const maxTemp = Math.max(...day.temps);
            const avgHumidity = day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length;
            const avgWind = day.wind.reduce((a, b) => a + b, 0) / day.wind.length;
            
            // Get most common weather
            const weatherCounts = {};
            day.weather.forEach(w => {
                weatherCounts[w.main] = (weatherCounts[w.main] || 0) + 1;
            });
            const dominantWeather = Object.entries(weatherCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
            const weatherInfo = day.weather.find(w => w.main === dominantWeather);
            
            dailyData.push({
                date: day.date,
                dayKey,
                avgTemp: Math.round(avgTemp),
                minTemp: Math.round(minTemp),
                maxTemp: Math.round(maxTemp),
                avgHumidity: Math.round(avgHumidity),
                avgWind: Math.round(avgWind * 3.6),
                weather: weatherInfo,
                hourly: day.items
            });
        });
        
        // Return only next 7 days
        return dailyData.slice(0, 7);
    }

    showForecastModal(cityName, dailyForecasts) {
        // Remove existing modal if any
        const existingModal = document.getElementById('forecast-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="forecast-modal" class="forecast-modal">
                <div class="forecast-modal__content">
                    <button class="forecast-modal__close" onclick="window.weatherApp.closeForecastModal()">&times;</button>
                    <h2 class="forecast-modal__title">📅 7-denní předpověď pro ${cityName}</h2>
                    
                    <div class="forecast-days">
                        ${dailyForecasts.map(day => this.createDayForecast(day)).join('')}
                    </div>
                    
                    <div class="forecast-chart" id="forecastChart">
                        <canvas id="tempChart" width="800" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal with animation
        const modal = document.getElementById('forecast-modal');
        requestAnimationFrame(() => {
            modal.classList.add('forecast-modal--show');
        });
        
        // Draw temperature chart
        this.drawTemperatureChart(dailyForecasts);
        
        // Close on ESC or outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeForecastModal();
            }
        });
    }

    createDayForecast(day) {
        const dayName = day.date.toLocaleDateString('cs-CZ', { weekday: 'long' });
        const dateStr = day.date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
        const emoji = UIComponents.getWeatherEmoji(day.weather.main.toLowerCase());
        const czechDescription = UIComponents.translateWeatherToCzech(day.weather.description);
        
        return `
            <div class="forecast-day-card">
                <div class="forecast-day-card__header">
                    <h3>${dayName}</h3>
                    <p>${dateStr}</p>
                </div>
                
                <div class="forecast-day-card__icon">${emoji}</div>
                
                <div class="forecast-day-card__temps">
                    <span class="temp-max">${day.maxTemp}°</span>
                    <span class="temp-min">${day.minTemp}°</span>
                </div>
                
                <p class="forecast-day-card__desc">${czechDescription}</p>
                
                <div class="forecast-day-card__details">
                    <div>💧 ${day.avgHumidity}%</div>
                    <div>💨 ${day.avgWind} km/h</div>
                </div>
            </div>
        `;
    }

    drawTemperatureChart(dailyForecasts) {
        const canvas = document.getElementById('tempChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Get temperature range
        const allTemps = dailyForecasts.flatMap(d => [d.minTemp, d.maxTemp]);
        const minTemp = Math.min(...allTemps) - 2;
        const maxTemp = Math.max(...allTemps) + 2;
        const tempRange = maxTemp - minTemp;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i * (height - 2 * padding) / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            // Temperature labels
            const temp = Math.round(maxTemp - (i * tempRange / 5));
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(`${temp}°`, padding - 10, y + 4);
        }
        
        // Draw temperature lines
        const dayWidth = (width - 2 * padding) / (dailyForecasts.length - 1);
        
        // Max temperature line
        ctx.beginPath();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        dailyForecasts.forEach((day, i) => {
            const x = padding + i * dayWidth;
            const y = padding + ((maxTemp - day.maxTemp) / tempRange) * (height - 2 * padding);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Max temperature points and labels
        dailyForecasts.forEach((day, i) => {
            const x = padding + i * dayWidth;
            const y = padding + ((maxTemp - day.maxTemp) / tempRange) * (height - 2 * padding);
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${day.maxTemp}°`, x, y - 10);
        });

        // Min temperature line
        ctx.beginPath();
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 3;
        dailyForecasts.forEach((day, i) => {
            const x = padding + i * dayWidth;
            const y = padding + ((maxTemp - day.minTemp) / tempRange) * (height - 2 * padding);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Min temperature points and labels
        dailyForecasts.forEach((day, i) => {
            const x = padding + i * dayWidth;
            const y = padding + ((maxTemp - day.minTemp) / tempRange) * (height - 2 * padding);
            ctx.fillStyle = '#4ecdc4';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${day.minTemp}°`, x, y + 20);
        });
        
        // Day labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px system-ui';
        dailyForecasts.forEach((day, i) => {
            const x = padding + i * dayWidth;
            const dayName = day.date.toLocaleDateString('cs-CZ', { weekday: 'short' });
            ctx.textAlign = 'center';
            ctx.fillText(dayName, x, height - 10);
        });
        
        // Legend
        ctx.font = '12px system-ui';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(width - 150, 10, 20, 3);
        ctx.fillText('Max teplota', width - 120, 15);
        
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(width - 150, 25, 20, 3);
        ctx.fillText('Min teplota', width - 120, 30);
    }

    closeForecastModal() {
        const modal = document.getElementById('forecast-modal');
        if (modal) {
            modal.classList.remove('forecast-modal--show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    startRealTimeUpdates() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Update immediately on start
        console.log('⏰ Starting real-time updates (every minute)');
        
        // Set interval for exactly 1 minute as requested
        this.updateInterval = setInterval(async () => {
            console.log('🔄 Updating weather data...');
            const cities = Array.from(this.state.state.cities.values());
            
            for (const cityData of cities) {
                try {
                    const lat = cityData.coord.lat;
                    const lon = cityData.coord.lon;
                    
                    const newData = await this.weatherService.fetchWeather(lat, lon);
                    newData.id = cityData.id;
                    this.state.addCity(newData);
                    
                    // Find the card and update it
                    const card = document.querySelector(`[data-city="${cityData.name}"]`);
                    if (card) {
                        // Visual feedback for update
                        card.style.opacity = '0.7';
                        setTimeout(() => {
                            card.style.opacity = '1';
                        }, 300);

                        // Update weather effects if weather changed
                        if (this.cardEffects) {
                            const weatherType = newData.weather[0].main;
                            this.cardEffects.createCardEffect(card, weatherType);
                        }
                    }
                } catch (error) {
                    console.error('Update error:', error);
                }
            }

            // Update stats and AI prediction
            this.state.updateStats();
            const weatherData = cities.map(c => c);
            this.updateAIPrediction(weatherData);
            
            console.log('✅ Update complete at', new Date().toLocaleTimeString('cs-CZ'));

        }, CONFIG.UPDATE_INTERVAL); // 60,000ms = 1 minute
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, observerOptions);

        setTimeout(() => {
            document.querySelectorAll('.weather-card').forEach(card => {
                observer.observe(card);
            });
        }, 1000);
    }

    updateUI() {
        console.log('State updated:', this.state.state);
    }
}

// Utility Functions
function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

async function shareWeather(city, temp, description) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Počasí v ${city}`,
                text: `${city}: ${temp}°C, ${description}`,
                url: window.location.href
            });
            vibrate([50, 30, 50]);
        } catch (error) {
            console.log('Error sharing:', error);
        }
    } else {
        const text = `${city}: ${temp}°C, ${description}`;
        navigator.clipboard.writeText(text).then(() => {
            window.weatherApp.showNotification(
                'Zkopírováno', 
                'Text byl zkopírován do schránky', 
                'success'
            );
        });
    }
}

// Feature Detection
const features = {
    indexedDB: 'indexedDB' in window,
    webGL: (() => {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch(e) {
            return false;
        }
    })(),
    webShare: 'share' in navigator,
    battery: 'getBattery' in navigator,
    networkInfo: 'connection' in navigator,
    vibration: 'vibrate' in navigator,
    geolocation: 'geolocation' in navigator,
    clipboard: 'clipboard' in navigator
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Weather Ultimate starting...');
    console.log('🔍 Feature detection:', features);
    window.weatherApp = new WeatherUltimate();
    
    // Connect with weather effects - robust initialization
    const connectEffects = () => {
        if (window.weatherCardEffects && window.weatherApp) {
            window.weatherApp.cardEffects = window.weatherCardEffects;
            console.log('🌦️ Weather Effects connected');
            // Apply effects to all existing cards
            document.querySelectorAll('.weather-card').forEach(card => {
                const weather = card.dataset.weather;
                if (weather) {
                    window.weatherCardEffects.createCardEffect(card, weather);
                }
            });
        } else {
            setTimeout(connectEffects, 200);
        }
    };
    setTimeout(connectEffects, 500);

    // Live clock updater - updates local time on every card each second
    setInterval(() => {
        document.querySelectorAll('.weather-card__local-time').forEach(el => {
            const tz = parseInt(el.dataset.timezone);
            const sunrise = parseInt(el.dataset.sunrise);
            const sunset = parseInt(el.dataset.sunset);

            const nowMs = Date.now();
            const nowUtcMs = nowMs + (new Date().getTimezoneOffset() * 60000);
            const cityLocalMs = nowUtcMs + (tz * 1000);
            const cityLocalTime = new Date(cityLocalMs);

            const clockEl = el.querySelector('.weather-card__clock');
            if (clockEl) {
                clockEl.textContent = cityLocalTime.toLocaleTimeString('cs-CZ', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            }

            const nowUtcSec = Math.floor(nowMs / 1000);
            const TWILIGHT_SEC = 1800;
            let dayPhase, phaseText;
            if (nowUtcSec >= sunrise && nowUtcSec < sunset) {
                dayPhase = 'day'; phaseText = '☀️ Den';
            } else if (nowUtcSec >= (sunrise - TWILIGHT_SEC) && nowUtcSec < sunrise) {
                dayPhase = 'dawn'; phaseText = '🌅 Úsvit';
            } else if (nowUtcSec >= sunset && nowUtcSec < (sunset + TWILIGHT_SEC)) {
                dayPhase = 'twilight'; phaseText = '🌇 Soumrak';
            } else {
                dayPhase = 'night'; phaseText = '🌙 Noc';
            }

            const badge = el.querySelector('.weather-card__daynight-badge');
            if (badge) {
                badge.textContent = phaseText;
                badge.className = `weather-card__daynight-badge weather-card__daynight-badge--${dayPhase}`;
            }

            const card = el.closest('.weather-card');
            if (card) {
                card.classList.remove('weather-card--day', 'weather-card--night', 'weather-card--dawn', 'weather-card--twilight');
                card.classList.add(`weather-card--${dayPhase}`);
            }
        });
    }, 1000);
});

// Visibility change handler
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('🔋 App hidden, pausing animations');
        document.querySelectorAll('.weather-card').forEach(card => {
            card.style.animationPlayState = 'paused';
        });
    } else {
        console.log('👁️ App visible, resuming animations');
        document.querySelectorAll('.weather-card').forEach(card => {
            card.style.animationPlayState = 'running';
        });
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    if (e.key === 'Escape') {
        const notification = document.getElementById('notification');
        notification.classList.remove('notification--show');
        
        const suggestions = document.getElementById('searchSuggestions');
        suggestions.classList.remove('search-suggestions--active');
        
        // Close forecast modal
        window.weatherApp?.closeForecastModal();
    }
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusedCard = document.activeElement.closest('.weather-card');
        if (focusedCard) {
            e.preventDefault();
            const cards = Array.from(document.querySelectorAll('.weather-card'));
            const currentIndex = cards.indexOf(focusedCard);
            const nextIndex = e.key === 'ArrowDown' 
                ? Math.min(currentIndex + 1, cards.length - 1)
                : Math.max(currentIndex - 1, 0);
            cards[nextIndex].focus();
        }
    }
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.weatherApp) {
        window.weatherApp.showNotification(
            'Chyba aplikace', 
            'Něco se pokazilo. Zkuste obnovit stránku.', 
            'error'
        );
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// Performance APIs
if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
        console.log(`🔋 Battery: ${(battery.level * 100).toFixed(0)}%`);
        
        if (battery.level < 0.2) {
            document.body.classList.add('reduce-animations');
            console.log('⚡ Low battery mode activated');
        }
        
        battery.addEventListener('levelchange', () => {
            if (battery.level < 0.2) {
                document.body.classList.add('reduce-animations');
            } else {
                document.body.classList.remove('reduce-animations');
            }
        });
    });
}

// Network Information API
if ('connection' in navigator) {
    const connection = navigator.connection;
    console.log(`📡 Network: ${connection.effectiveType}`);
    
    if (connection.effectiveType === '2g' || connection.saveData) {
        document.body.classList.add('data-saver-mode');
        console.log('📱 Data saver mode activated');
    }
    
    connection.addEventListener('change', () => {
        if (connection.effectiveType === '2g' || connection.saveData) {
            document.body.classList.add('data-saver-mode');
        } else {
            document.body.classList.remove('data-saver-mode');
        }
    });
}

// Geolocation
function getUserLocationWeather() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`📍 User location: ${latitude}, ${longitude}`);
                
                if (window.weatherApp) {
                    try {
                        const weatherService = window.weatherApp.weatherService;
                        const data = await weatherService.fetchWeather(latitude, longitude);
                        console.log('📍 User location weather:', data);
                    } catch (error) {
                        console.error('Error fetching user location weather:', error);
                    }
                }
            },
            (error) => {
                console.log('Geolocation error:', error);
            },
            { enableHighAccuracy: false, timeout: 5000 }
        );
    }
}

setTimeout(getUserLocationWeather, 2000);

// Debug mode
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
    console.log('🐛 Debug mode enabled');
    window.DEBUG = true;
    
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: #0f0;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 9999;
        min-width: 200px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        border: 1px solid #0f0;
    `;
    document.body.appendChild(debugPanel);
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    function updateDebugPanel() {
        frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        
        if (deltaTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / deltaTime);
            frameCount = 0;
            lastTime = currentTime;
            
            const memory = performance.memory ? `
                <div>JS Heap: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB</div>
                <div>Total Heap: ${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)}MB</div>
                <div>Limit: ${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB</div>
            ` : '';
            
            debugPanel.innerHTML = `
                <div style="color: #0f0; font-weight: bold; margin-bottom: 10px;">🐛 DEBUG MODE</div>
                <div>FPS: ${fps}</div>
                ${memory}
                <div>Cities: ${window.weatherApp?.state.state.cities.size || 0}</div>
                <div>Cache Items: ${window.weatherApp?.cache.memoryCache.size || 0}</div>
                <div>Effects: ${window.weatherApp?.cardEffects?.activeEffects.size || 0}</div>
                <div>Network: ${navigator.connection?.effectiveType || 'N/A'}</div>
                <div>Battery: ${navigator.getBattery ? 'Checking...' : 'N/A'}</div>
                <div>Update Interval: ${CONFIG.UPDATE_INTERVAL / 1000}s</div>
            `;
            
            if (navigator.getBattery) {
                navigator.getBattery().then(battery => {
                    const batteryDiv = debugPanel.querySelector('div:last-child');
                    batteryDiv.textContent = `Battery: ${(battery.level * 100).toFixed(0)}% ${battery.charging ? '⚡' : ''}`;
                });
            }
        }
        
        requestAnimationFrame(updateDebugPanel);
    }
    
    updateDebugPanel();
    
    // Debug commands
    window.debug = {
        clearCache: () => {
            window.weatherApp.cache.memoryCache.clear();
            console.log('✅ Cache cleared');
        },
        showState: () => {
            console.log('State:', window.weatherApp.state.state);
        },
        simulateError: () => {
            throw new Error('Debug error test');
        },
        toggleAnimations: () => {
            document.body.classList.toggle('reduce-animations');
            console.log('✅ Animations toggled');
        },
        addRandomCity: async () => {
            const cities = ['Berlin', 'Vienna', 'Budapest', 'Warsaw', 'Rome', 'Madrid', 'Amsterdam'];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            await window.weatherApp.searchAndAddCity(randomCity);
        },
        exportData: () => {
            const data = Array.from(window.weatherApp.state.state.cities.values());
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `weather-data-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            console.log('✅ Data exported');
        },
        testEffects: () => {
            const cards = document.querySelectorAll('.weather-card');
            const weathers = ['rain', 'snow', 'thunderstorm', 'clear', 'clouds', 'mist'];
            cards.forEach((card, i) => {
                if (window.weatherApp.cardEffects) {
                    const weather = weathers[i % weathers.length];
                    window.weatherApp.cardEffects.createCardEffect(card, weather);
                    console.log(`✅ Applied ${weather} effect to card ${i + 1}`);
                }
            });
        }
    };
    
    console.log('Debug commands available:', Object.keys(window.debug));
}

// Performance monitoring
class PerformanceMonitor {
    static measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`⚡ ${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }
    
    static async measureAsync(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`⚡ ${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// Web Animations API for advanced animations
function animateCardEntrance(card) {
    if ('animate' in card) {
        card.animate([
            { 
                opacity: 0, 
                transform: 'translateY(50px) scale(0.9) rotateX(10deg)',
                filter: 'blur(5px)'
            },
            { 
                opacity: 1, 
                transform: 'translateY(0) scale(1) rotateX(0)',
                filter: 'blur(0)'
            }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'both'
        });
    }
}

// Intersection Observer for lazy loading
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
        }
    });
});

document.querySelectorAll('img.lazy').forEach(img => {
    imageObserver.observe(img);
});

// Ambient Light Sensor (experimental)
if ('AmbientLightSensor' in window) {
    try {
        const sensor = new AmbientLightSensor();
        sensor.addEventListener('reading', () => {
            const brightness = sensor.illuminance;
            if (brightness < 10) {
                document.body.classList.add('dark-environment');
            } else {
                document.body.classList.remove('dark-environment');
            }
        });
        sensor.start();
    } catch (error) {
        console.log('Ambient Light Sensor not available');
    }
}

// Wake Lock API to keep screen on
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            const wakeLock = await navigator.wakeLock.request('screen');
            console.log('🔆 Wake Lock active');
            
            document.addEventListener('visibilitychange', async () => {
                if (!document.hidden && wakeLock.released) {
                    await navigator.wakeLock.request('screen');
                }
            });
        } catch (err) {
            console.log('Wake Lock failed:', err);
        }
    }
}

// Request wake lock for dashboard mode
if (urlParams.get('dashboard') === 'true') {
    requestWakeLock();
}

// Custom Events
const weatherEvents = {
    emit(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    },
    
    on(eventName, handler) {
        document.addEventListener(eventName, handler);
    }
};

// Emit custom events
weatherEvents.on('weatherUpdate', (e) => {
    console.log('Weather updated:', e.detail);
});

weatherEvents.on('cityAdded', (e) => {
    console.log('City added:', e.detail);
    vibrate([50, 30, 50]);
});

// Expose UIComponents globally for weather effects integration
window.UIComponents = UIComponents;

// Final initialization message
console.log('✨ Weather Ultimate initialized successfully!');
console.log('💡 Pro tips:');
console.log('   - Add ?debug=true to URL for debug mode');
console.log('   - Add ?dashboard=true to keep screen on');
console.log('   - Press Ctrl+K to focus search');
console.log('   - Use arrow keys to navigate cards');
console.log('   - Try debug.testEffects() to see all weather effects');
console.log('🚀 Enjoy the weather experience!');
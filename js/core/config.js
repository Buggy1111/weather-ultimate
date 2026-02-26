/**
 * Configuration, feature detection, URL parameters
 */

const CONFIG = {
    API_KEY: '4078c40502499b6489b8982b0930b28c',
    API_BASE_URL: 'https://api.openweathermap.org/data/2.5',
    GEO_API_URL: 'https://api.openweathermap.org/geo/1.0',
    CACHE_NAME: 'weather-ultimate-v1',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    UPDATE_INTERVAL: 60 * 1000, // 1 minute
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
    battery: 'getBattery' in navigator,
    networkInfo: 'connection' in navigator,
    vibration: 'vibrate' in navigator,
    geolocation: 'geolocation' in navigator
};

const urlParams = new URLSearchParams(window.location.search);

/**
 * Configuration for Weather Ultimate
 * Store sensitive data separately from main code
 */

// API Configuration
const API_CONFIG = {
    // Move this to server-side or environment variable in production
    WEATHER_API_KEY: '4078c40502499b6489b8982b0930b28c',
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    GEO_URL: 'https://api.openweathermap.org/geo/1.0'
};

// Application Configuration
const APP_CONFIG = {
    CACHE_NAME: 'weather-ultimate-v1',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    UPDATE_INTERVAL: 60 * 1000, // 1 minute
    ANIMATION_DURATION: 300,
    MAX_CITIES: 10,
    DEBUG: false
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, APP_CONFIG };
} else {
    window.API_CONFIG = API_CONFIG;
    window.APP_CONFIG = APP_CONFIG;
}
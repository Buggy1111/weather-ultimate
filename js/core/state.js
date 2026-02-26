/**
 * State Manager — reactive state with pub/sub
 */

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

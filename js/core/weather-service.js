/**
 * Weather API Service — fetch with queue & cache
 */

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

    async fetchAirPollution(lat, lon) {
        const cacheKey = `airpollution-${lat}-${lon}`;
        const cached = await this.cache.get(cacheKey);

        if (cached) {
            console.log('🎯 Air pollution cache hit:', cacheKey);
            return cached;
        }

        return this.queueRequest(async () => {
            const url = `${CONFIG.API_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Air Pollution API Error: ${response.status}`);
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

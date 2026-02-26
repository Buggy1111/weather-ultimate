/**
 * Advanced Cache — memory + IndexedDB two-tier cache
 */

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

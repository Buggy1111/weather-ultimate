/**
 * Debug Panel & Performance Monitor
 *
 * Depends on: CONFIG, urlParams (config.js)
 */

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

// Debug mode (activated via ?debug=true)
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

            const memoryInfo = performance.memory ? `
                JS Heap: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB
                Total Heap: ${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)}MB
                Limit: ${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB
            `.trim().split('\n').map(l => l.trim()) : [];

            // Build debug info using textContent (safe)
            debugPanel.textContent = '';

            const title = document.createElement('div');
            title.style.cssText = 'color: #0f0; font-weight: bold; margin-bottom: 10px;';
            title.textContent = '🐛 DEBUG MODE';
            debugPanel.appendChild(title);

            const lines = [
                `FPS: ${fps}`,
                ...memoryInfo,
                `Cities: ${window.weatherApp?.state.state.cities.size || 0}`,
                `Cache Items: ${window.weatherApp?.cache.memoryCache.size || 0}`,
                `Effects: ${window.weatherApp?.cardEffects?.activeEffects.size || 0}`,
                `Network: ${navigator.connection?.effectiveType || 'N/A'}`,
                `Update Interval: ${CONFIG.UPDATE_INTERVAL / 1000}s`
            ];

            lines.forEach(line => {
                const div = document.createElement('div');
                div.textContent = line;
                debugPanel.appendChild(div);
            });

            if (navigator.getBattery) {
                navigator.getBattery().then(battery => {
                    const batteryDiv = document.createElement('div');
                    batteryDiv.textContent = `Battery: ${(battery.level * 100).toFixed(0)}% ${battery.charging ? '⚡' : ''}`;
                    debugPanel.appendChild(batteryDiv);
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

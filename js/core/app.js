/**
 * Weather Ultimate — main application controller
 *
 * Depends on: StateManager, AdvancedCache, WeatherService, AIPredictions,
 *             ParticleSystem, UIComponents, ForecastManager
 */

class WeatherUltimate {
    constructor() {
        this.state = new StateManager();
        this.cache = new AdvancedCache();
        this.weatherService = new WeatherService(this.cache);
        this.aiEngine = new AIPredictions();
        this.forecastManager = new ForecastManager(this);
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

        const isTouchDevice = (navigator.maxTouchPoints ?? 0) > 0;

        // Search suggestion click (event delegation — no listener stacking)
        searchSuggestions.addEventListener('click', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (item) {
                const name = item.dataset.name;
                searchInput.value = name;
                searchSuggestions.classList.remove('search-suggestions--active');
                this.searchAndAddCity(name);
            }
        });

        // Close search suggestions on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchSuggestions.classList.remove('search-suggestions--active');
            }
        });

        // Forecast button click (event delegation — works on both mobile & desktop)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.forecast-button');
            if (btn) {
                const cityName = btn.dataset.forecastCity;
                const lat = parseFloat(btn.dataset.forecastLat);
                const lon = parseFloat(btn.dataset.forecastLon);
                if (cityName && !isNaN(lat) && !isNaN(lon)) {
                    this.showForecast(cityName, lat, lon);
                }
            }
        });

        // Card body click → open forecast (desktop only)
        if (!isTouchDevice) {
            document.addEventListener('click', (e) => {
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
    }

    async loadDefaultCities() {
        const weatherGrid = document.getElementById('weatherGrid');
        // Note: skeletonCard() returns safe internally-generated HTML
        weatherGrid.innerHTML = Array(6).fill(0).map(() => UIComponents.skeletonCard()).join('');

        try {
            const promises = CONFIG.DEFAULT_CITIES.map(async (city) => {
                try {
                    const data = await this.weatherService.fetchWeather(city.lat, city.lon);
                    const forecast = await this.weatherService.fetchForecast(city.lat, city.lon);
                    let airPollution = null;
                    try { airPollution = await this.weatherService.fetchAirPollution(city.lat, city.lon); } catch(e) { console.warn('Air pollution fetch failed:', e.message); }
                    return { city, data, forecast, airPollution };
                } catch (error) {
                    console.error(`Error loading ${city.name}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const validResults = results.filter(r => r !== null);

            weatherGrid.innerHTML = '';

            validResults.forEach(({ city, data, forecast, airPollution }) => {
                data.id = `${city.lat}-${city.lon}`;
                this.state.addCity(data);
                const card = UIComponents.weatherCard(city, data, forecast, airPollution);
                weatherGrid.insertAdjacentHTML('beforeend', card);

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
            this.showNotification('Hledám', `Vyhledávám město "${WeatherHelpers.escapeHTML(query)}"...`, 'info');

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
            let airPollutionData = null;
            try { airPollutionData = await this.weatherService.fetchAirPollution(city.lat, city.lon); } catch(e) { console.warn('Air pollution fetch failed:', e.message); }

            const cityId = `${city.lat}-${city.lon}`;
            if (this.state.state.cities.has(cityId)) {
                this.showNotification('Info', 'Toto město již sledujete', 'warning');
                return;
            }

            weatherData.id = cityId;
            this.state.addCity(weatherData);

            const weatherGrid = document.getElementById('weatherGrid');
            const card = UIComponents.weatherCard(city, weatherData, forecastData, airPollutionData);
            weatherGrid.insertAdjacentHTML('afterbegin', card);

            const newCard = weatherGrid.firstElementChild;
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(-20px) scale(0.95)';

            requestAnimationFrame(() => {
                newCard.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                newCard.style.opacity = '1';
                newCard.style.transform = 'translateY(0) scale(1)';
            });

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

        const esc = WeatherHelpers.escapeHTML;
        const html = suggestions.map(s => {
            const name = s.local_names?.cs || s.name;
            return `
            <div class="suggestion-item"
                 data-lat="${s.lat}"
                 data-lon="${s.lon}"
                 data-name="${esc(name)}"
                 data-country="${esc(s.country)}">
                <span class="suggestion-item__name">
                    ${esc(name)}
                </span>
                <span class="suggestion-item__country">
                    ${s.state ? `${esc(s.state)}, ` : ''}${esc(s.country)}
                </span>
            </div>
        `;
        }).join('');

        container.innerHTML = html;
        container.classList.add('search-suggestions--active');
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
        // Note: notification() returns safe internally-generated HTML
        notification.innerHTML = UIComponents.notification(title, message, type);
        notification.classList.add('notification--show');

        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('notification--show');
        }, 4000);
    }

    handleCardClick(card) {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => { card.style.transform = ''; }, 150);

        const cityName = card.dataset.city;
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);

        console.log('Card clicked:', cityName);
        vibrate([50]);

        if (!isNaN(lat) && !isNaN(lon)) {
            this.showForecast(cityName, lat, lon);
        }
    }

    // Delegate forecast methods to ForecastManager
    showForecast(cityName, lat, lon) {
        return this.forecastManager.showForecast(cityName, lat, lon);
    }

    closeForecastModal() {
        return this.forecastManager.closeForecastModal();
    }

    startRealTimeUpdates() {
        if (this.updateInterval) clearInterval(this.updateInterval);

        console.log('⏰ Starting real-time updates (every minute)');

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

                    const card = document.querySelector(`[data-city="${CSS.escape(cityData.name)}"]`);
                    if (card) {
                        card.style.opacity = '0.7';
                        setTimeout(() => { card.style.opacity = '1'; }, 300);

                        if (this.cardEffects) {
                            const weatherType = newData.weather[0].main;
                            this.cardEffects.createCardEffect(card, weatherType);
                        }
                    }
                } catch (error) {
                    console.error('Update error:', error);
                }
            }

            const weatherData = Array.from(this.state.state.cities.values());
            this.updateAIPrediction(weatherData);

            console.log('✅ Update complete at', new Date().toLocaleTimeString('cs-CZ'));

        }, CONFIG.UPDATE_INTERVAL);
    }

    setupIntersectionObserver() {
        const observerOptions = { threshold: 0.1, rootMargin: '50px' };

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
        // State change handled by specific subscribers (updateStats, etc.)
    }
}

// Utility functions (global)
function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}


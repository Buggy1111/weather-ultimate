/**
 * Initialization — DOMContentLoaded, event handlers, APIs
 *
 * Depends on: WeatherUltimate (app.js), UIComponents, CONFIG, features
 */

// Boot the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Weather Ultimate starting...');
    console.log('🔍 Feature detection:', features);
    window.weatherApp = new WeatherUltimate();

    // Connect with weather effects (max 25 retries = 5s)
    let effectRetries = 0;
    const connectEffects = () => {
        if (window.weatherCardEffects && window.weatherApp) {
            window.weatherApp.cardEffects = window.weatherCardEffects;
            console.log('🌦️ Weather Effects connected');
            document.querySelectorAll('.weather-card').forEach(card => {
                const weather = card.dataset.weather;
                if (weather) {
                    window.weatherCardEffects.createCardEffect(card, weather);
                }
            });
        } else if (++effectRetries < 25) {
            setTimeout(connectEffects, 200);
        } else {
            console.warn('Weather Effects not available after 5s');
        }
    };
    setTimeout(connectEffects, 500);

    // Live clock updater — updates local time on every card each second
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

            // Update moon (show during night/twilight/dawn, hide during day)
            const card = el.closest('.weather-card');
            let moonBadge = el.querySelector('.weather-card__moon-badge');
            let moonVisual = card ? card.querySelector('.moon-visual') : null;
            if (dayPhase !== 'day' && window.MoonPhase) {
                if (!moonBadge) {
                    el.insertAdjacentHTML('beforeend', window.MoonPhase.getBadgeHTML());
                }
                if (!moonVisual && card) {
                    const cardWeather = card.dataset.weather || 'clear';
                    card.insertAdjacentHTML('afterbegin', window.MoonPhase.getVisualHTML(undefined, cardWeather));
                }
            } else {
                if (moonBadge) moonBadge.remove();
                if (moonVisual) moonVisual.remove();
            }

            if (card) {
                card.classList.remove('weather-card--day', 'weather-card--night', 'weather-card--dawn', 'weather-card--twilight');
                card.classList.add(`weather-card--${dayPhase}`);
            }
        });
    }, 1000);
});

// Visibility change — pause/resume animations
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

// Battery API
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

// Geolocation — add user's city to dashboard
function getUserLocationWeather() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`📍 User location: ${latitude}, ${longitude}`);

                if (window.weatherApp) {
                    try {
                        const app = window.weatherApp;
                        const ws = app.weatherService;

                        const existing = Array.from(app.state.state.cities.values()).find(c => {
                            const dlat = Math.abs(c.coord.lat - latitude);
                            const dlon = Math.abs(c.coord.lon - longitude);
                            return dlat < 0.1 && dlon < 0.1;
                        });
                        if (existing) {
                            console.log('📍 Location already tracked:', existing.name);
                            return;
                        }

                        const data = await ws.fetchWeather(latitude, longitude);
                        const forecast = await ws.fetchForecast(latitude, longitude);
                        let airPollution = null;
                        try { airPollution = await ws.fetchAirPollution(latitude, longitude); } catch(e) { console.warn('Air pollution fetch failed:', e.message); }

                        const city = {
                            name: data.name,
                            country: data.sys?.country || '',
                            lat: latitude,
                            lon: longitude
                        };

                        const cityId = `${latitude}-${longitude}`;
                        data.id = cityId;
                        app.state.addCity(data);

                        const weatherGrid = document.getElementById('weatherGrid');
                        const card = UIComponents.weatherCard(city, data, forecast, airPollution);
                        weatherGrid.insertAdjacentHTML('afterbegin', card);

                        const newCard = weatherGrid.firstElementChild;
                        newCard.style.opacity = '0';
                        newCard.style.transform = 'translateY(-20px) scale(0.95)';
                        requestAnimationFrame(() => {
                            newCard.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                            newCard.style.opacity = '1';
                            newCard.style.transform = 'translateY(0) scale(1)';
                        });

                        console.log(`📍 Added user location: ${city.name}`);
                        app.showNotification('📍 Vaše poloha', `${city.name} přidáno na dashboard`, 'success');
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

// Image lazy loading
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

// Wake Lock API
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

weatherEvents.on('weatherUpdate', (e) => {
    console.log('Weather updated:', e.detail);
});

weatherEvents.on('cityAdded', (e) => {
    console.log('City added:', e.detail);
    vibrate([50, 30, 50]);
});

// Final initialization message
console.log('✨ Weather Ultimate initialized successfully!');
console.log('💡 Pro tips:');
console.log('   - Add ?debug=true to URL for debug mode');
console.log('   - Add ?dashboard=true to keep screen on');
console.log('   - Press Ctrl+K to focus search');
console.log('   - Use arrow keys to navigate cards');
console.log('   - Try debug.testEffects() to see all weather effects');
console.log('🚀 Enjoy the weather experience!');

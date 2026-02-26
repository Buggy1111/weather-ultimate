/**
 * UI Components — weather card, notification, skeleton
 * ParticleSystem — canvas background particles
 *
 * Depends on: WeatherHelpers (ui-helpers.js), CONFIG (config.js)
 */

class UIComponents {
    static weatherCard(city, data, forecast = null, airPollution = null) {
        const weather = data.weather[0].main.toLowerCase();
        const weatherId = data.weather[0].id;
        const mood = CONFIG.WEATHER_MOODS[weather] || CONFIG.WEATHER_MOODS['clear'];
        const emoji = WeatherHelpers.getWeatherEmoji(weather, weatherId);
        const czechDescription = WeatherHelpers.translateWeatherToCzech(data.weather[0].description);

        const timezoneOffset = data.timezone || 0;
        const sunriseUTC = new Date(data.sys.sunrise * 1000);
        const sunsetUTC = new Date(data.sys.sunset * 1000);
        const sunriseLocal = new Date(sunriseUTC.getTime() + timezoneOffset * 1000);
        const sunsetLocal = new Date(sunsetUTC.getTime() + timezoneOffset * 1000);
        const sunriseTime = sunriseLocal.toISOString().substring(11, 16);
        const sunsetTime = sunsetLocal.toISOString().substring(11, 16);

        const dayLength = data.sys.sunset - data.sys.sunrise;
        const hours = Math.floor(dayLength / 3600);
        const minutes = Math.floor((dayLength % 3600) / 60);

        const nowMs = Date.now();
        const nowUtcMs = nowMs + (new Date().getTimezoneOffset() * 60000);
        const cityLocalMs = nowUtcMs + (timezoneOffset * 1000);
        const cityLocalTime = new Date(cityLocalMs);
        const localTimeStr = cityLocalTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const nowUtcSec = Math.floor(nowMs / 1000);
        const TWILIGHT_SEC = 1800;
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

        let moonBadgeHTML = '';
        let moonVisualHTML = '';
        if (dayPhase !== 'day' && window.MoonPhase) {
            moonBadgeHTML = window.MoonPhase.getBadgeHTML(nowMs);
            moonVisualHTML = window.MoonPhase.getVisualHTML(nowMs, data.weather[0].main);
        }

        const windDeg = data.wind?.deg;
        const windDir = WeatherHelpers.getWindDirection(windDeg);
        const windArrowDeg = windDeg != null ? windDeg + 180 : 0;
        const windGust = data.wind?.gust;

        const pressure = data.main?.pressure;
        const seaLevel = data.main?.sea_level;
        const grndLevel = data.main?.grnd_level;
        const visibility = data.visibility;
        const cloudiness = data.clouds?.all;

        const rainAmount = data.rain?.['1h'] || data.rain?.['3h'];
        const snowAmount = data.snow?.['1h'] || data.snow?.['3h'];

        const tempMin = data.main?.temp_min != null ? Math.round(data.main.temp_min) : null;
        const tempMax = data.main?.temp_max != null ? Math.round(data.main.temp_max) : null;

        let aqiBadgeHTML = '';
        if (airPollution?.list?.[0]) {
            const aqi = airPollution.list[0].main.aqi;
            const aqiInfo = WeatherHelpers.getAQIInfo(aqi);
            aqiBadgeHTML = `<span class="aqi-badge" style="--aqi-color: ${aqiInfo.color}; --aqi-bg: ${aqiInfo.bg}">${aqiInfo.emoji} Vzduch: ${aqiInfo.label}</span>`;
        }

        let extraInfoHTML = '';
        const extraItems = [];
        if (rainAmount) extraItems.push(`<span class="extra-info__item">🌧️ ${rainAmount.toFixed(1)} mm/h</span>`);
        if (snowAmount) extraItems.push(`<span class="extra-info__item">🌨️ ${snowAmount.toFixed(1)} mm/h</span>`);
        if (windGust) extraItems.push(`<span class="extra-info__item">💨 Nárazy: ${Math.round(windGust * 3.6)} km/h</span>`);
        if (extraItems.length > 0) {
            extraInfoHTML = `<div class="weather-extra">${extraItems.join('')}</div>`;
        }

        let hourlyForecastHTML = '';
        if (forecast && forecast.list) {
            const hourlyData = forecast.list.slice(0, 8);
            hourlyForecastHTML = `
                <div class="hourly-forecast">
                    <h4 class="hourly-forecast__title">Hodinová předpověď</h4>
                    <div class="hourly-forecast__scroll">
                        ${hourlyData.map(hour => {
                            const hourTime = new Date(hour.dt * 1000 + timezoneOffset * 1000);
                            const hourStr = hourTime.toISOString().substring(11, 16);
                            const hourEmoji = WeatherHelpers.getWeatherEmoji(hour.weather[0].main.toLowerCase(), hour.weather[0].id);
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
                     data-city="${WeatherHelpers.escapeHTML(city.name)}"
                     data-weather="${weather}"
                     data-lat="${city.lat}"
                     data-lon="${city.lon}"
                     data-pressure="${pressure || ''}"
                     data-visibility="${visibility || ''}"
                     data-clouds="${cloudiness != null ? cloudiness : ''}"
                     data-aqi="${airPollution?.list?.[0]?.main?.aqi || ''}"
                     style="--mood-color-1: ${mood.colors[0]}; --mood-color-2: ${mood.colors[1]};"
                     role="listitem"
                     tabindex="0">
                <div class="live-badge">
                    <div class="live-badge__dot"></div>
                    <span>Live</span>
                </div>
                ${moonVisualHTML}

                <header class="weather-card__header">
                    <h3 class="weather-card__city">${WeatherHelpers.escapeHTML(city.name)}</h3>
                    <p class="weather-card__country">${WeatherHelpers.escapeHTML(city.country || '')}</p>
                    <div class="weather-card__local-time"
                         data-timezone="${timezoneOffset}"
                         data-sunrise="${data.sys.sunrise}"
                         data-sunset="${data.sys.sunset}">
                        <span class="weather-card__clock">${localTimeStr}</span>
                        <span class="weather-card__daynight-badge weather-card__daynight-badge--${dayPhase}">${dayPhaseEmoji} ${dayPhaseText}</span>
                        ${moonBadgeHTML}
                    </div>
                </header>

                <div class="weather-card__main">
                    <div class="weather-card__temp-group">
                        <div class="weather-card__temp">
                            ${Math.round(data.main.temp)}<span class="weather-card__temp-unit">°C</span>
                        </div>
                        ${tempMin != null && tempMax != null ? `
                            <div class="weather-card__temp-range">
                                <span class="temp-hi">↑ ${tempMax}°</span>
                                <span class="temp-lo">↓ ${tempMin}°</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="weather-card__icon">${emoji}</div>
                </div>

                <div class="weather-card__desc-row">
                    <p class="weather-card__description">${czechDescription}</p>
                    ${aqiBadgeHTML}
                </div>

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
                        <div class="detail__value">
                            ${Math.round(data.wind.speed * 3.6)}
                            ${windDeg != null ? `<span class="wind-arrow" style="--wind-deg: ${windArrowDeg}deg">↑</span>` : ''}
                        </div>
                        <div class="detail__label">${windDir ? `km/h ${windDir}` : 'km/h'}</div>
                    </div>
                    <div class="detail group" ${seaLevel && grndLevel ? `title="Hladina moře: ${seaLevel} hPa\nÚroveň terénu: ${grndLevel} hPa"` : ''}>
                        <div class="detail__icon">🔻</div>
                        <div class="detail__value">${pressure || '—'}</div>
                        <div class="detail__label">hPa${seaLevel && grndLevel && Math.abs(seaLevel - grndLevel) > 5 ? ` <small>⛰️${grndLevel}</small>` : ''}</div>
                    </div>
                    <div class="detail">
                        <div class="detail__icon">👁️</div>
                        <div class="detail__value">${WeatherHelpers.formatVisibility(visibility)}</div>
                        <div class="detail__label">Viditelnost</div>
                    </div>
                    <div class="detail">
                        <div class="detail__icon">☁️</div>
                        <div class="detail__value">${cloudiness != null ? cloudiness + '%' : '—'}</div>
                        <div class="detail__label">Oblačnost</div>
                    </div>
                </div>

                ${extraInfoHTML}

                ${(() => {
                    const alerts = WeatherHelpers.getWeatherAlerts(data, forecast?.list);
                    if (alerts.length === 0) return '';
                    return '<div class="weather-alerts">' +
                        alerts.map(a => `<div class="weather-alert weather-alert--${a.severity}">${a.icon} ${WeatherHelpers.escapeHTML(a.text)}</div>`).join('') +
                        '</div>';
                })()}

                <button class="card-toggle" aria-expanded="false" aria-label="Zobrazit detaily">
                    <span class="card-toggle__text">Více detailů</span>
                    <span class="card-toggle__arrow">▼</span>
                </button>

                <div class="card-details-collapsible" hidden>
                    ${hourlyForecastHTML}

                    ${forecast && forecast.list ? WeatherHelpers.generatePrecipTimeline(forecast.list, timezoneOffset) : ''}

                    ${forecast && forecast.list ? WeatherHelpers.generateTempTrend(forecast.list, timezoneOffset) : ''}

                    <div class="sun-arc-container">
                        ${WeatherHelpers.generateSunArc(data.sys.sunrise, data.sys.sunset, timezoneOffset)}
                    </div>

                    <div class="activity-suggestions">
                        ${(() => {
                            const suggestions = WeatherHelpers.getActivitySuggestions(data.weather[0].main, data.main.temp, data.wind.speed * 3.6);
                            return suggestions.map(s => `<span class="activity-tag">${s.icon} ${s.text}</span>`).join('');
                        })()}
                    </div>

                    <div class="weather-mood">
                        <p class="weather-mood__label">Nálada počasí</p>
                        <p class="weather-mood__value">${mood.emoji} ${mood.text}</p>
                    </div>
                </div>

                <button class="forecast-button" data-forecast-city="${WeatherHelpers.escapeHTML(city.name)}" data-forecast-lat="${city.lat}" data-forecast-lon="${city.lon}">
                    📅 Zobrazit 7-denní předpověď
                </button>
            </article>
        `;
    }

    static notification(title, message, type = 'info') {
        const icons = { 'success': '✅', 'error': '❌', 'warning': '⚠️', 'info': 'ℹ️' };
        const esc = WeatherHelpers.escapeHTML;
        return `
            <div class="notification__icon">${icons[type]}</div>
            <div class="notification__content">
                <h4 class="notification__title">${esc(title)}</h4>
                <p class="notification__message">${esc(message)}</p>
            </div>
        `;
    }

    static skeletonCard() {
        return `
            <div class="weather-card skeleton">
                <div class="skeleton__header">
                    <div class="skeleton skeleton--line" style="width:55%;height:22px"></div>
                    <div class="skeleton skeleton--line" style="width:30%;height:14px;margin-top:0.4rem"></div>
                    <div class="skeleton skeleton--line" style="width:40%;height:14px;margin-top:0.4rem"></div>
                </div>
                <div class="skeleton__temp" style="display:flex;align-items:center;gap:1rem;margin:1.25rem 0">
                    <div class="skeleton skeleton--circle" style="width:72px;height:72px"></div>
                    <div class="skeleton skeleton--line" style="width:50px;height:50px;border-radius:8px"></div>
                </div>
                <div class="skeleton skeleton--line" style="width:65%;height:16px;margin-bottom:1rem"></div>
                <div class="skeleton__details" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:1rem">
                    <div class="skeleton" style="height:70px;border-radius:8px"></div>
                    <div class="skeleton" style="height:70px;border-radius:8px"></div>
                    <div class="skeleton" style="height:70px;border-radius:8px"></div>
                    <div class="skeleton" style="height:70px;border-radius:8px"></div>
                    <div class="skeleton" style="height:70px;border-radius:8px"></div>
                    <div class="skeleton" style="height:70px;border-radius:8px"></div>
                </div>
                <div class="skeleton__hourly" style="display:flex;gap:0.5rem;overflow:hidden;margin-bottom:1rem">
                    <div class="skeleton" style="min-width:56px;height:80px;border-radius:8px"></div>
                    <div class="skeleton" style="min-width:56px;height:80px;border-radius:8px"></div>
                    <div class="skeleton" style="min-width:56px;height:80px;border-radius:8px"></div>
                    <div class="skeleton" style="min-width:56px;height:80px;border-radius:8px"></div>
                    <div class="skeleton" style="min-width:56px;height:80px;border-radius:8px"></div>
                </div>
                <div class="skeleton__sun">
                    <div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:0.75rem"></div>
                </div>
                <div class="skeleton skeleton--line" style="width:100%;height:44px;border-radius:12px"></div>
            </div>
        `;
    }
}

// Expose globally for weather effects integration
window.UIComponents = UIComponents;


/**
 * Particle System — decorative canvas particles
 */

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.rafId = null;

        const isMobile = window.matchMedia('(max-width: 768px)').matches
            || (navigator.maxTouchPoints ?? 0) > 0;
        if (isMobile) {
            canvas.style.display = 'none';
            return;
        }

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

            for (let j = index + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < 22500) {
                    const dist = Math.sqrt(distSq);
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${0.1 * (1 - dist / 150)})`;
                    this.ctx.stroke();
                }
            }
        });

        this.rafId = requestAnimationFrame(() => this.animate());
    }
}

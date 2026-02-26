/**
 * Forecast Manager — modal, day cards, temperature chart
 *
 * Depends on: WeatherHelpers (ui-helpers.js), UIComponents (ui-components.js)
 */

class ForecastManager {
    constructor(app) {
        this.app = app;
    }

    async showForecast(cityName, lat, lon) {
        try {
            this.app.showNotification('Načítám', 'Získávám 7-denní předpověď...', 'info');

            const forecastData = await this.app.weatherService.fetchForecast(lat, lon);
            let airPollution = null;
            try { airPollution = await this.app.weatherService.fetchAirPollution(lat, lon); } catch(e) { console.warn('Air pollution fetch failed:', e.message); }

            const dailyForecasts = this.processForecastData(forecastData.list);
            this.showForecastModal(cityName, dailyForecasts, airPollution);

        } catch (error) {
            this.app.showNotification('Chyba', 'Nepodařilo se načíst předpověď', 'error');
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
                    temps: [], feelsLike: [], weather: [], weatherIds: [],
                    humidity: [], wind: [], windDeg: [], pressure: [],
                    clouds: [], visibility: [],
                    rain: 0, snow: 0, maxGust: 0,
                    pop: [], pods: [], items: []
                });
            }

            const day = days.get(dayKey);
            day.temps.push(item.main.temp);
            if (item.main.feels_like != null) day.feelsLike.push(item.main.feels_like);
            day.weather.push(item.weather[0]);
            if (item.weather[0]?.id) day.weatherIds.push(item.weather[0].id);
            day.humidity.push(item.main.humidity);
            day.wind.push(item.wind.speed);
            if (item.wind?.deg != null) day.windDeg.push(item.wind.deg);
            day.pressure.push(item.main.pressure);
            if (item.clouds?.all != null) day.clouds.push(item.clouds.all);
            if (item.visibility != null) day.visibility.push(item.visibility);
            if (item.rain?.['3h']) day.rain += item.rain['3h'];
            if (item.snow?.['3h']) day.snow += item.snow['3h'];
            if (item.wind?.gust > day.maxGust) day.maxGust = item.wind.gust;
            if (item.pop != null) day.pop.push(item.pop);
            if (item.sys?.pod) day.pods.push(item.sys.pod);
            day.items.push(item);
        });

        const dailyData = [];
        days.forEach((day, dayKey) => {
            const avgTemp = day.temps.reduce((a, b) => a + b, 0) / day.temps.length;
            const minTemp = Math.min(...day.temps);
            const maxTemp = Math.max(...day.temps);
            const avgHumidity = day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length;
            const avgWind = day.wind.reduce((a, b) => a + b, 0) / day.wind.length;

            const weatherCounts = {};
            day.weather.forEach(w => { weatherCounts[w.main] = (weatherCounts[w.main] || 0) + 1; });
            const dominantWeather = Object.entries(weatherCounts).sort((a, b) => b[1] - a[1])[0][0];
            const weatherInfo = day.weather.find(w => w.main === dominantWeather);

            const avgPressure = day.pressure.length ? day.pressure.reduce((a, b) => a + b, 0) / day.pressure.length : null;
            const avgClouds = day.clouds.length ? day.clouds.reduce((a, b) => a + b, 0) / day.clouds.length : null;
            const minVisibility = day.visibility.length ? Math.min(...day.visibility) : null;
            const maxPop = day.pop.length ? Math.max(...day.pop) : 0;
            const avgFeelsLike = day.feelsLike.length ? day.feelsLike.reduce((a, b) => a + b, 0) / day.feelsLike.length : null;

            let dominantWindDeg = null;
            let windDirLabel = null;
            if (day.windDeg.length > 0) {
                const sinSum = day.windDeg.reduce((s, d) => s + Math.sin(d * Math.PI / 180), 0);
                const cosSum = day.windDeg.reduce((s, d) => s + Math.cos(d * Math.PI / 180), 0);
                dominantWindDeg = Math.round(((Math.atan2(sinSum, cosSum) * 180 / Math.PI) + 360) % 360);
                const dirs = ['S', 'SSV', 'SV', 'VSV', 'V', 'VJV', 'JV', 'JJV', 'J', 'JJZ', 'JZ', 'ZJZ', 'Z', 'ZSZ', 'SZ', 'SSZ'];
                windDirLabel = dirs[Math.round(dominantWindDeg / 22.5) % 16];
            }

            const weatherIdCounts = {};
            day.weatherIds.forEach(id => { weatherIdCounts[id] = (weatherIdCounts[id] || 0) + 1; });
            const dominantWeatherId = Object.keys(weatherIdCounts).length
                ? Number(Object.entries(weatherIdCounts).sort((a, b) => b[1] - a[1])[0][0])
                : null;

            const dayPods = day.pods.filter(p => p === 'd').length;
            const nightPods = day.pods.filter(p => p === 'n').length;

            dailyData.push({
                date: day.date, dayKey,
                avgTemp: Math.round(avgTemp),
                minTemp: Math.round(minTemp),
                maxTemp: Math.round(maxTemp),
                avgFeelsLike: avgFeelsLike != null ? Math.round(avgFeelsLike) : null,
                avgHumidity: Math.round(avgHumidity),
                avgWind: Math.round(avgWind * 3.6),
                avgPressure: avgPressure ? Math.round(avgPressure) : null,
                avgClouds: avgClouds != null ? Math.round(avgClouds) : null,
                minVisibility,
                rainTotal: Math.round(day.rain * 10) / 10,
                snowTotal: Math.round(day.snow * 10) / 10,
                maxGust: day.maxGust ? Math.round(day.maxGust * 3.6) : 0,
                maxPop: Math.round(maxPop * 100),
                weather: weatherInfo,
                weatherId: dominantWeatherId,
                windDeg: dominantWindDeg,
                windDir: windDirLabel,
                dayHours: dayPods,
                nightHours: nightPods,
                hourly: day.items
            });
        });

        return dailyData.slice(0, 7);
    }

    showForecastModal(cityName, dailyForecasts, airPollution = null) {
        const existingModal = document.getElementById('forecast-modal');
        if (existingModal) existingModal.remove();

        // AQI detail section
        let aqiSectionHTML = '';
        if (airPollution?.list?.[0]) {
            const ap = airPollution.list[0];
            const aqi = ap.main.aqi;
            const aqiInfo = WeatherHelpers.getAQIInfo(aqi);
            const c = ap.components;

            const pollutants = [
                { key: 'pm2_5', label: 'PM2.5', val: c.pm2_5 },
                { key: 'pm10', label: 'PM10', val: c.pm10 },
                { key: 'o3', label: 'O₃', val: c.o3 },
                { key: 'no2', label: 'NO₂', val: c.no2 },
                { key: 'no', label: 'NO', val: c.no },
                { key: 'nh3', label: 'NH₃', val: c.nh3 },
                { key: 'so2', label: 'SO₂', val: c.so2 },
                { key: 'co', label: 'CO', val: c.co }
            ];
            aqiSectionHTML = `
                <div class="aqi-detail">
                    <h3 class="aqi-detail__title">🌬️ Kvalita vzduchu</h3>
                    <div class="aqi-detail__header">
                        <span class="aqi-detail__badge" style="--aqi-color: ${aqiInfo.color}; --aqi-bg: ${aqiInfo.bg}">
                            ${aqiInfo.emoji} ${aqiInfo.label}
                        </span>
                        <span class="aqi-detail__index">AQI ${aqi}/5</span>
                    </div>
                    <div class="aqi-detail__grid">
                        ${pollutants.map(p => {
                            const info = WeatherHelpers.formatPollutantValue(p.key, p.val);
                            return `
                                <div class="aqi-pollutant aqi-pollutant--${info.level}">
                                    <span class="aqi-pollutant__label">${p.label}</span>
                                    <span class="aqi-pollutant__value">${info.value}</span>
                                    <span class="aqi-pollutant__unit">${info.unit}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // AI city insights
        const cityInsights = this.app.aiEngine.generateCityPrediction(cityName, dailyForecasts, airPollution);
        const aiSectionHTML = cityInsights.length > 0 ? `
                    <div class="ai-city-insight">
                        <h3 class="ai-city-insight__title">🤖 AI Analýza — ${WeatherHelpers.escapeHTML(cityName)}</h3>
                        <div class="ai-city-insight__list">
                            ${cityInsights.map(i => `<div class="ai-city-insight__item">${i}</div>`).join('')}
                        </div>
                    </div>
        ` : '';

        const modalHTML = `
            <div id="forecast-modal" class="forecast-modal">
                <div class="forecast-modal__content">
                    <button class="forecast-modal__close" id="forecast-close-btn">&times;</button>
                    <h2 class="forecast-modal__title">📅 7-denní předpověď pro ${WeatherHelpers.escapeHTML(cityName)}</h2>

                    ${aiSectionHTML}

                    <div class="forecast-days">
                        ${dailyForecasts.map(day => this.createDayForecast(day)).join('')}
                    </div>

                    <div class="forecast-chart" id="forecastChart">
                        <canvas id="tempChart" height="200"></canvas>
                    </div>

                    ${aqiSectionHTML}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Attach close button listener (no inline onclick)
        document.getElementById('forecast-close-btn').addEventListener('click', () => this.closeForecastModal());

        // Show modal + lock scroll
        const modal = document.getElementById('forecast-modal');
        this._savedScrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this._savedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        requestAnimationFrame(() => {
            modal.classList.add('forecast-modal--show');
        });

        this.drawTemperatureChart(dailyForecasts);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeForecastModal();
        });
    }

    createDayForecast(day) {
        const dayName = day.date.toLocaleDateString('cs-CZ', { weekday: 'long' });
        const dateStr = day.date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
        const emoji = WeatherHelpers.getWeatherEmoji(day.weather.main.toLowerCase(), day.weatherId);
        const czechDescription = WeatherHelpers.translateWeatherToCzech(day.weather.description);

        const feelsLikeDiff = day.avgFeelsLike != null ? day.avgFeelsLike - day.avgTemp : 0;
        const showFeelsLike = day.avgFeelsLike != null && Math.abs(feelsLikeDiff) >= 2;

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

                <div class="forecast-day-card__metrics">
                    ${showFeelsLike ? `<div class="fc-metric fc-metric--feels">
                        <span class="fc-metric__icon">🌡️</span>
                        <span class="fc-metric__val">${day.avgFeelsLike}° <small>pocit</small></span>
                    </div>` : ''}
                    <div class="fc-metric">
                        <span class="fc-metric__icon">💧</span>
                        <span class="fc-metric__val">${day.avgHumidity}%</span>
                    </div>
                    <div class="fc-metric">
                        <span class="fc-metric__icon">💨</span>
                        <span class="fc-metric__val">${day.avgWind}${day.windDir ? ` ${day.windDir}` : ''} <small>km/h</small></span>
                    </div>
                    ${day.avgPressure ? `<div class="fc-metric">
                        <span class="fc-metric__icon">◉</span>
                        <span class="fc-metric__val">${day.avgPressure} <small>hPa</small></span>
                    </div>` : ''}
                    ${day.avgClouds != null ? `<div class="fc-metric">
                        <span class="fc-metric__icon">☁️</span>
                        <span class="fc-metric__val">${day.avgClouds}%</span>
                    </div>` : ''}
                    ${day.maxPop > 0 ? `<div class="fc-metric fc-metric--rain">
                        <span class="fc-metric__icon">☔</span>
                        <span class="fc-metric__val">${day.maxPop}%</span>
                    </div>` : ''}
                    ${day.rainTotal > 0 ? `<div class="fc-metric fc-metric--rain">
                        <span class="fc-metric__icon">🌧️</span>
                        <span class="fc-metric__val">${day.rainTotal} <small>mm</small></span>
                    </div>` : ''}
                    ${day.snowTotal > 0 ? `<div class="fc-metric fc-metric--snow">
                        <span class="fc-metric__icon">🌨️</span>
                        <span class="fc-metric__val">${day.snowTotal} <small>mm</small></span>
                    </div>` : ''}
                    ${day.maxGust > 0 ? `<div class="fc-metric fc-metric--wind">
                        <span class="fc-metric__icon">⚡</span>
                        <span class="fc-metric__val">${day.maxGust} <small>km/h</small></span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    drawTemperatureChart(dailyForecasts) {
        const canvas = document.getElementById('tempChart');
        if (!canvas) return;

        const container = canvas.parentElement;
        if (container) canvas.width = container.offsetWidth;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        ctx.clearRect(0, 0, width, height);

        const allTemps = dailyForecasts.flatMap(d => [d.minTemp, d.maxTemp]);
        const minTemp = Math.min(...allTemps) - 2;
        const maxTemp = Math.max(...allTemps) + 2;
        const tempRange = Math.max(maxTemp - minTemp, 1);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i * (height - 2 * padding) / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            const temp = Math.round(maxTemp - (i * tempRange / 5));
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(`${temp}°`, padding - 10, y + 4);
        }

        const dayWidth = (width - 2 * padding) / (dailyForecasts.length - 1);

        // Max temperature line
        ctx.beginPath();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        dailyForecasts.forEach((day, i) => {
            const x = padding + i * dayWidth;
            const y = padding + ((maxTemp - day.maxTemp) / tempRange) * (height - 2 * padding);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Max temperature points
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
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Min temperature points
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
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            if (this._savedScrollY != null) {
                window.scrollTo(0, this._savedScrollY);
                this._savedScrollY = null;
            }
            setTimeout(() => modal.remove(), 300);
        }
    }
}

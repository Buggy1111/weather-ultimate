/**
 * Weather Helpers — translations, emoji, AQI, wind, formatting
 */

const WeatherHelpers = {
    escapeHTML(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    translateWeatherToCzech(description) {
        const translations = {
            'clear sky': 'jasno', 'clear': 'jasno',
            'few clouds': 'skoro jasno', 'scattered clouds': 'polojasno',
            'broken clouds': 'oblačno', 'overcast clouds': 'zataženo', 'clouds': 'oblačno',
            'light rain': 'slabý déšť', 'moderate rain': 'mírný déšť',
            'heavy intensity rain': 'silný déšť', 'very heavy rain': 'velmi silný déšť',
            'extreme rain': 'extrémní déšť', 'freezing rain': 'mrznoucí déšť',
            'light intensity shower rain': 'slabé přeháňky', 'shower rain': 'přeháňky',
            'heavy intensity shower rain': 'silné přeháňky', 'ragged shower rain': 'občasné přeháňky',
            'rain': 'déšť',
            'light intensity drizzle': 'slabé mrholení', 'drizzle': 'mrholení',
            'heavy intensity drizzle': 'silné mrholení',
            'light intensity drizzle rain': 'slabé mrholení s deštěm',
            'drizzle rain': 'mrholení s deštěm',
            'heavy intensity drizzle rain': 'silné mrholení s deštěm',
            'shower rain and drizzle': 'přeháňky s mrholením',
            'heavy shower rain and drizzle': 'silné přeháňky s mrholením',
            'shower drizzle': 'mrholivé přeháňky',
            'thunderstorm with light rain': 'bouřka se slabým deštěm',
            'thunderstorm with rain': 'bouřka s deštěm',
            'thunderstorm with heavy rain': 'bouřka se silným deštěm',
            'light thunderstorm': 'slabá bouřka', 'thunderstorm': 'bouřka',
            'heavy thunderstorm': 'silná bouřka', 'ragged thunderstorm': 'občasná bouřka',
            'thunderstorm with light drizzle': 'bouřka se slabým mrholením',
            'thunderstorm with drizzle': 'bouřka s mrholením',
            'thunderstorm with heavy drizzle': 'bouřka se silným mrholením',
            'light snow': 'slabé sněžení', 'snow': 'sněžení', 'heavy snow': 'silné sněžení',
            'sleet': 'déšť se sněhem',
            'light shower sleet': 'slabé přeháňky s deštěm a sněhem',
            'shower sleet': 'přeháňky s deštěm a sněhem',
            'light rain and snow': 'slabý déšť se sněhem', 'rain and snow': 'déšť se sněhem',
            'light shower snow': 'slabé sněhové přeháňky', 'shower snow': 'sněhové přeháňky',
            'heavy shower snow': 'silné sněhové přeháňky',
            'mist': 'mlha', 'smoke': 'kouř', 'haze': 'opar',
            'sand/dust whirls': 'písečné/prachové víry', 'fog': 'mlha',
            'sand': 'písek', 'dust': 'prach', 'volcanic ash': 'sopečný popel',
            'squalls': 'poryvy větru', 'tornado': 'tornádo',
            'light intensity': 'slabá intenzita', 'heavy intensity': 'silná intenzita',
            'very heavy': 'velmi silný', 'extreme': 'extrémní',
            'freezing': 'mrznoucí', 'shower': 'přeháňky', 'ragged': 'občasný'
        };

        const lowerDesc = description.toLowerCase();
        if (translations[lowerDesc]) return translations[lowerDesc];

        for (const [eng, cz] of Object.entries(translations)) {
            if (lowerDesc.includes(eng)) return cz;
        }

        return description;
    },

    getWeatherEmoji(weather, weatherId = null, isNight = false) {
        if (weatherId) {
            if (weatherId >= 200 && weatherId < 300) return '⛈️';
            if (weatherId >= 300 && weatherId < 320) return '🌦️';
            if (weatherId === 500) return '🌦️';
            if (weatherId === 501) return '🌧️';
            if (weatherId >= 502 && weatherId <= 504) return '🌧️';
            if (weatherId === 511) return '🧊';
            if (weatherId >= 520 && weatherId < 600) return '🌧️';
            if (weatherId === 600) return '🌨️';
            if (weatherId === 601) return '❄️';
            if (weatherId >= 602 && weatherId < 700) return '🌨️';
            if (weatherId >= 700 && weatherId < 800) return '🌫️';
            if (weatherId === 800) return isNight ? '🌙' : '☀️';
            if (weatherId === 801) return isNight ? '☁️' : '🌤️';
            if (weatherId === 802) return '⛅';
            if (weatherId === 803) return '🌥️';
            if (weatherId === 804) return '☁️';
        }
        if (isNight && weather === 'clear') return '🌙';
        const emojis = {
            'clear': '☀️', 'clouds': '☁️', 'rain': '🌧️', 'drizzle': '🌦️',
            'thunderstorm': '⛈️', 'snow': '❄️', 'mist': '🌫️', 'fog': '🌫️', 'haze': '🌫️'
        };
        return emojis[weather] || '🌈';
    },

    getWindDirection(deg) {
        if (deg == null) return '';
        const dirs = ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'];
        return dirs[Math.round(deg / 45) % 8];
    },

    getAQIInfo(aqi) {
        const levels = {
            1: { label: 'Dobrá', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', emoji: '🟢' },
            2: { label: 'Přijatelná', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', emoji: '🟡' },
            3: { label: 'Střední', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', emoji: '🟠' },
            4: { label: 'Špatná', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', emoji: '🔴' },
            5: { label: 'Velmi špatná', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', emoji: '🟣' }
        };
        return levels[aqi] || levels[3];
    },

    formatVisibility(meters) {
        if (meters == null) return '—';
        if (meters >= 10000) return '10+ km';
        if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
        return `${meters} m`;
    },

    formatPollutantValue(name, value) {
        const limits = {
            pm2_5: { good: 10, fair: 25, mod: 50, poor: 75, unit: 'μg/m³' },
            pm10:  { good: 20, fair: 50, mod: 100, poor: 200, unit: 'μg/m³' },
            o3:    { good: 60, fair: 100, mod: 140, poor: 180, unit: 'μg/m³' },
            no2:   { good: 40, fair: 70, mod: 150, poor: 200, unit: 'μg/m³' },
            so2:   { good: 20, fair: 80, mod: 250, poor: 350, unit: 'μg/m³' },
            co:    { good: 4400, fair: 9400, mod: 12400, poor: 15400, unit: 'μg/m³' },
            no:    { good: 50, fair: 100, mod: 200, poor: 400, unit: 'μg/m³' },
            nh3:   { good: 200, fair: 400, mod: 800, poor: 1200, unit: 'μg/m³' }
        };
        const info = limits[name];
        if (!info) return { value: value.toFixed(1), unit: 'μg/m³', level: 'unknown' };
        let level = 'good';
        if (value > info.poor) level = 'poor';
        else if (value > info.mod) level = 'moderate';
        else if (value > info.fair) level = 'fair';
        return { value: value.toFixed(1), unit: info.unit, level };
    },

    getSunProgress(sunrise, sunset, now) {
        return (now - sunrise) / (sunset - sunrise);
    },

    generateSunArc(sunriseUtc, sunsetUtc, timezoneOffset) {
        const now = Math.floor(Date.now() / 1000);
        const progress = this.getSunProgress(sunriseUtc, sunsetUtc, now);

        const riseLocal = new Date((sunriseUtc + timezoneOffset) * 1000);
        const setLocal = new Date((sunsetUtc + timezoneOffset) * 1000);
        const riseStr = riseLocal.toISOString().substring(11, 16);
        const setStr = setLocal.toISOString().substring(11, 16);

        const dayLen = sunsetUtc - sunriseUtc;
        const nightLen = 86400 - dayLen;
        const dayH = Math.floor(dayLen / 3600);
        const dayM = Math.floor((dayLen % 3600) / 60);
        const nightH = Math.floor(nightLen / 3600);
        const nightM = Math.floor((nightLen % 3600) / 60);

        const W = 320, H = 220;
        const cx = 160, cy = 108, rx = 115, ry = 62;
        const sunArcPath = `M ${cx - rx},${cy} A ${rx},${ry} 0 0,1 ${cx + rx},${cy}`;
        const moonArcPath = `M ${cx + rx},${cy} A ${rx},${ry} 0 0,1 ${cx - rx},${cy}`;
        const sunFillPath = `${sunArcPath} Z`;
        const moonFillPath = `${moonArcPath} Z`;

        const isDay = progress >= 0 && progress <= 1;

        // Sun position
        const cp = Math.max(0, Math.min(1, progress));
        const sunAngle = Math.PI * (1 - cp);
        const sunX = (cx + rx * Math.cos(sunAngle)).toFixed(1);
        const sunY = (cy - ry * Math.sin(sunAngle)).toFixed(1);

        // Moon position (night progress: sunset→sunrise, right→left)
        let moonProg = 0;
        if (now > sunsetUtc) {
            moonProg = (now - sunsetUtc) / nightLen;
        } else if (now < sunriseUtc) {
            moonProg = (nightLen - (sunriseUtc - now)) / nightLen;
        }
        moonProg = Math.max(0, Math.min(1, moonProg));
        const moonAngle = Math.PI * moonProg;
        const moonX = (cx + rx * Math.cos(moonAngle)).toFixed(1);
        const moonY = (cy + ry * Math.sin(moonAngle)).toFixed(1);
        const isNight = !isDay;

        // Use pathLength=100 for easy percentage-based dash
        const sunPct = Math.round(cp * 100);
        const moonPct = Math.round(moonProg * 100);

        let svg = `<svg class="sun-arc" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

        // Gradient definitions
        svg += `<defs>`;
        svg += `<linearGradient id="saFillSun" x1="0" y1="0" x2="0" y2="1">`;
        svg += `<stop offset="0%" stop-color="#fbbf24" stop-opacity="0.18"/>`;
        svg += `<stop offset="100%" stop-color="#f97316" stop-opacity="0.02"/>`;
        svg += `</linearGradient>`;
        svg += `<linearGradient id="saStrokeSun" x1="0" y1="0" x2="1" y2="0">`;
        svg += `<stop offset="0%" stop-color="#f59e0b"/>`;
        svg += `<stop offset="50%" stop-color="#fbbf24"/>`;
        svg += `<stop offset="100%" stop-color="#f97316"/>`;
        svg += `</linearGradient>`;
        svg += `<linearGradient id="saFillMoon" x1="0" y1="0" x2="0" y2="1">`;
        svg += `<stop offset="0%" stop-color="#6366f1" stop-opacity="0.02"/>`;
        svg += `<stop offset="100%" stop-color="#818cf8" stop-opacity="0.12"/>`;
        svg += `</linearGradient>`;
        svg += `<linearGradient id="saStrokeMoon" x1="0" y1="0" x2="1" y2="0">`;
        svg += `<stop offset="0%" stop-color="#a5b4fc"/>`;
        svg += `<stop offset="50%" stop-color="#818cf8"/>`;
        svg += `<stop offset="100%" stop-color="#a5b4fc"/>`;
        svg += `</linearGradient>`;
        svg += `<radialGradient id="saGlowSun">`;
        svg += `<stop offset="0%" stop-color="#fbbf24" stop-opacity="0.5"/>`;
        svg += `<stop offset="60%" stop-color="#fbbf24" stop-opacity="0.1"/>`;
        svg += `<stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>`;
        svg += `</radialGradient>`;
        svg += `<radialGradient id="saGlowMoon">`;
        svg += `<stop offset="0%" stop-color="#818cf8" stop-opacity="0.45"/>`;
        svg += `<stop offset="60%" stop-color="#818cf8" stop-opacity="0.08"/>`;
        svg += `<stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>`;
        svg += `</radialGradient>`;
        svg += `</defs>`;

        // Filled areas (subtle gradient background)
        svg += `<path d="${sunFillPath}" fill="url(#saFillSun)"/>`;
        svg += `<path d="${moonFillPath}" fill="url(#saFillMoon)"/>`;

        // Sun arc — dashed outline
        svg += `<path class="sun-arc__path" d="${sunArcPath}" fill="none" stroke="rgba(251,191,36,0.12)" stroke-width="1.5" stroke-dasharray="6,4"/>`;

        // Sun progress + glow + dot
        if (isDay) {
            svg += `<path class="sun-arc__progress" d="${sunArcPath}" fill="none" stroke="url(#saStrokeSun)" stroke-width="2.5" pathLength="100" stroke-dasharray="${sunPct},100" stroke-linecap="round"/>`;
            svg += `<circle cx="${sunX}" cy="${sunY}" r="18" fill="url(#saGlowSun)"/>`;
            svg += `<circle class="sun-arc__dot" cx="${sunX}" cy="${sunY}" r="6" fill="#fbbf24" stroke="rgba(251,191,36,0.3)" stroke-width="2"/>`;
        }

        // Horizon line
        svg += `<line class="sun-arc__horizon" x1="${cx - rx - 12}" y1="${cy}" x2="${cx + rx + 12}" y2="${cy}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="3,3"/>`;

        // Moon arc — dashed outline
        svg += `<path class="moon-arc__path" d="${moonArcPath}" fill="none" stroke="rgba(129,140,248,0.1)" stroke-width="1.5" stroke-dasharray="6,4"/>`;

        // Moon progress + glow + dot
        if (isNight) {
            svg += `<path class="moon-arc__progress" d="${moonArcPath}" fill="none" stroke="url(#saStrokeMoon)" stroke-width="2.5" pathLength="100" stroke-dasharray="${moonPct},100" stroke-linecap="round"/>`;
            svg += `<circle cx="${moonX}" cy="${moonY}" r="16" fill="url(#saGlowMoon)"/>`;
            svg += `<circle class="moon-arc__dot" cx="${moonX}" cy="${moonY}" r="5" fill="#818cf8" stroke="rgba(129,140,248,0.3)" stroke-width="2"/>`;
        }

        // Sunrise label (left)
        svg += `<text class="sun-arc__icon" x="${cx - rx - 12}" y="${cy - 8}" text-anchor="middle" font-size="15">🌅</text>`;
        svg += `<text class="sun-arc__time sun-arc__time--rise" x="${cx - rx - 12}" y="${cy + 16}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="12" font-weight="500">${riseStr}</text>`;

        // Sunset label (right)
        svg += `<text class="sun-arc__icon" x="${cx + rx + 12}" y="${cy - 8}" text-anchor="middle" font-size="15">🌇</text>`;
        svg += `<text class="sun-arc__time sun-arc__time--set" x="${cx + rx + 12}" y="${cy + 16}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="12" font-weight="500">${setStr}</text>`;

        // Day duration (top center)
        svg += `<text class="sun-arc__label sun-arc__label--day" x="${cx}" y="20" text-anchor="middle" fill="rgba(251,191,36,0.55)" font-size="12" font-weight="600">☀️ Den: ${dayH}h ${dayM}m</text>`;

        // Night duration (bottom center)
        svg += `<text class="moon-arc__label" x="${cx}" y="${H - 6}" text-anchor="middle" fill="rgba(129,140,248,0.45)" font-size="12" font-weight="600">🌙 Noc: ${nightH}h ${nightM}m</text>`;

        svg += `</svg>`;

        return svg;
    },

    getTempColor(temp) {
        const clamped = Math.max(-20, Math.min(40, temp));
        const hue = 210 - ((clamped + 20) / 60) * 210;
        return `hsl(${Math.round(hue)}, 80%, 60%)`;
    },

    getActivitySuggestions(weatherMain, temp, windSpeed) {
        const activities = [];

        if (weatherMain === 'Thunderstorm') {
            activities.push({ icon: '🏠', text: 'Zůstaňte doma' });
            activities.push({ icon: '🎮', text: 'Deskovky & hry' });
            activities.push({ icon: '📚', text: 'Knihovna' });
            return activities.slice(0, 3);
        }

        if (weatherMain === 'Snow') {
            if (temp <= 0) {
                activities.push({ icon: '⛷️', text: 'Lyžování' });
                activities.push({ icon: '🛷', text: 'Bobování' });
                activities.push({ icon: '⛄', text: 'Stavba sněhuláka' });
            } else {
                activities.push({ icon: '🚶', text: 'Procházka ve sněhu' });
                activities.push({ icon: '☕', text: 'Kavárna' });
            }
            return activities.slice(0, 3);
        }

        if (weatherMain === 'Rain' || weatherMain === 'Drizzle') {
            activities.push({ icon: '🏛️', text: 'Muzeum / galerie' });
            activities.push({ icon: '☕', text: 'Kavárna s knihou' });
            activities.push({ icon: '🎬', text: 'Kino' });
            return activities.slice(0, 3);
        }

        if (windSpeed >= 20) {
            activities.push({ icon: '🪁', text: 'Pouštění draků' });
        }

        if (temp >= 30) {
            activities.push({ icon: '🏊', text: 'Koupání' });
            activities.push({ icon: '🍦', text: 'Zmrzlina' });
            activities.push({ icon: '🏖️', text: 'Pláž / aquapark' });
        } else if (temp >= 20) {
            activities.push({ icon: '🚴', text: 'Cyklistika' });
            activities.push({ icon: '🏃', text: 'Běh venku' });
            activities.push({ icon: '🧺', text: 'Piknik' });
        } else if (temp >= 10) {
            activities.push({ icon: '🚶', text: 'Procházka v parku' });
            activities.push({ icon: '📸', text: 'Fotografování' });
            activities.push({ icon: '🏃', text: 'Běh' });
        } else if (temp >= 0) {
            activities.push({ icon: '☕', text: 'Kavárna' });
            activities.push({ icon: '🚶', text: 'Krátká procházka' });
            activities.push({ icon: '🏛️', text: 'Muzeum' });
        } else {
            activities.push({ icon: '🏠', text: 'Zůstaňte v teple' });
            activities.push({ icon: '☕', text: 'Horký čaj / čokoláda' });
            activities.push({ icon: '📚', text: 'Knihovna' });
        }

        return activities.slice(0, 3);
    },

    generatePrecipTimeline(forecastItems, timezoneOffset) {
        if (!forecastItems || forecastItems.length === 0) return '';

        const items = forecastItems.slice(0, 8);
        const hasPrecip = items.some(i => (i.pop || 0) >= 0.1);
        if (!hasPrecip) return '';

        const maxPop = Math.max(...items.map(i => i.pop || 0));
        const peakIndex = items.findIndex(i => (i.pop || 0) === maxPop);
        const peakHours = peakIndex >= 0 ? peakIndex * 3 : 0;

        let alertText = '';
        const firstRainIdx = items.findIndex(i => (i.pop || 0) >= 0.3);
        if (firstRainIdx === 0) {
            alertText = '🌧️ Srážky probíhají';
        } else if (firstRainIdx > 0) {
            alertText = `🌧️ Déšť očekáván za ~${firstRainIdx * 3}h`;
        }

        const bars = items.map(item => {
            const pop = item.pop || 0;
            const heightPct = Math.round(pop * 100);
            const time = new Date((item.dt + timezoneOffset) * 1000);
            const timeStr = time.toISOString().substring(11, 16);
            const rain = item.rain?.['3h'] || 0;
            const color = pop >= 0.7 ? '#3b82f6' : pop >= 0.4 ? '#60a5fa' : '#93c5fd';

            return `<div class="precip-slot">` +
                `<div class="precip-bar" style="height:${Math.max(heightPct, 2)}%;background:${color}" title="${Math.round(pop * 100)}%${rain ? ' ' + rain.toFixed(1) + 'mm' : ''}"></div>` +
                `<span class="precip-time">${timeStr}</span>` +
                `</div>`;
        }).join('');

        return `<div class="precip-timeline">` +
            (alertText ? `<div class="precip-alert">${alertText}</div>` : '') +
            `<div class="precip-chart">${bars}</div>` +
            `</div>`;
    },

    getWeatherAlerts(data, forecastItems) {
        const alerts = [];
        if (!data?.main) return alerts;

        const temp = data.main.temp;
        const humidity = data.main.humidity || 0;
        const windSpeed = (data.wind?.speed || 0) * 3.6; // m/s → km/h
        const weather = data.weather?.[0]?.main || '';

        // Extreme cold
        if (temp <= -10) {
            alerts.push({ icon: '🥶', text: 'Extrémní mráz — omezte pobyt venku', severity: 'danger' });
        } else if (temp <= 0) {
            alerts.push({ icon: '❄️', text: 'Mráz — pozor na námrazu', severity: 'warning' });
        }

        // Extreme heat
        if (temp >= 35) {
            alerts.push({ icon: '🔥', text: 'Extrémní vedro — pijte dostatek tekutin', severity: 'danger' });
        } else if (temp >= 30 && humidity >= 70) {
            alerts.push({ icon: '🥵', text: 'Dusno a parno — zvýšené riziko úpalu', severity: 'warning' });
        }

        // Strong wind
        if (windSpeed >= 60) {
            alerts.push({ icon: '🌪️', text: 'Vichřice — vyhněte se otevřeným plochám', severity: 'danger' });
        } else if (windSpeed >= 40) {
            alerts.push({ icon: '💨', text: 'Silný vítr — buďte opatrní', severity: 'warning' });
        }

        // Thunderstorm
        if (weather === 'Thunderstorm') {
            alerts.push({ icon: '⛈️', text: 'Bouřka — zůstaňte v bezpečí', severity: 'danger' });
        }

        // Forecast-based alerts
        if (forecastItems && forecastItems.length >= 2) {
            const hasIncomingStorm = forecastItems.some(i =>
                i.weather?.[0]?.main === 'Thunderstorm'
            );
            if (hasIncomingStorm && weather !== 'Thunderstorm') {
                alerts.push({ icon: '⚡', text: 'Bouřka se blíží v následujících hodinách', severity: 'warning' });
            }

            const futureTempItems = forecastItems.filter(i => i.main?.temp != null);
            if (futureTempItems.length >= 2) {
                const lastTemp = futureTempItems[futureTempItems.length - 1].main.temp;
                const drop = temp - lastTemp;
                if (drop >= 8) {
                    alerts.push({ icon: '📉', text: `Výrazný pokles teploty o ${Math.round(drop)}°C — očekávejte ochlazení`, severity: 'info' });
                }
            }
        }

        return alerts;
    },

    generateTempTrend(forecastItems, timezoneOffset) {
        if (!forecastItems || forecastItems.length === 0) return '';

        const items = forecastItems.slice(0, 8);
        const temps = items.map(i => i.main?.temp ?? 0);
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);
        const range = maxTemp - minTemp || 1;

        const svgW = 500;
        const svgH = 120;
        const padX = 35;
        const padTop = 25;
        const padBot = 28;
        const plotW = svgW - padX * 2;
        const plotH = svgH - padTop - padBot;

        const points = items.map((item, i) => {
            const x = padX + (i / Math.max(items.length - 1, 1)) * plotW;
            const y = padTop + plotH - ((temps[i] - minTemp) / range) * plotH;
            return { x, y, temp: Math.round(temps[i]), item };
        });

        const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

        const gradientArea = `${points[0].x.toFixed(1)},${padTop + plotH} ${polyline} ${points[points.length-1].x.toFixed(1)},${padTop + plotH}`;

        const dots = points.map(p =>
            `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${this.getTempColor(p.temp)}" />`
        ).join('');

        const tempLabels = points.map(p =>
            `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1) - 8}" class="temp-trend__label">${p.temp}°</text>`
        ).join('');

        const timeLabels = points.map(p => {
            const time = new Date((p.item.dt + timezoneOffset) * 1000);
            const timeStr = time.toISOString().substring(11, 16);
            return `<text x="${p.x.toFixed(1)}" y="${padTop + plotH + 18}" class="temp-trend__time">${timeStr}</text>`;
        }).join('');

        return `<div class="temp-trend-container">` +
            `<svg class="temp-trend" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">` +
            `<defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">` +
            `<stop offset="0%" stop-color="${this.getTempColor(maxTemp)}" stop-opacity="0.3"/>` +
            `<stop offset="100%" stop-color="${this.getTempColor(minTemp)}" stop-opacity="0.05"/>` +
            `</linearGradient></defs>` +
            `<polygon points="${gradientArea}" fill="url(#trendGrad)"/>` +
            `<polyline points="${polyline}" fill="none" stroke="url(#trendGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke: rgba(255,255,255,0.6)"/>` +
            dots + tempLabels + timeLabels +
            `</svg></div>`;
    },

    generateTempBar(dayMin, dayMax, weekMin, weekMax) {
        const range = weekMax - weekMin || 1;
        const leftPct = ((dayMin - weekMin) / range) * 100;
        const widthPct = Math.max(2, ((dayMax - dayMin) / range) * 100);
        const startColor = this.getTempColor(dayMin);
        const endColor = this.getTempColor(dayMax);

        return `<div class="temp-bar"><div class="temp-bar__fill" style="left:${leftPct.toFixed(1)}%;width:${widthPct.toFixed(1)}%;background:linear-gradient(90deg,${startColor},${endColor})"></div></div>`;
    }
};

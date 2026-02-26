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

    getWeatherEmoji(weather, weatherId = null) {
        if (weatherId) {
            if (weatherId >= 200 && weatherId < 210) return '⛈️';
            if (weatherId >= 210 && weatherId < 220) return '🌩️';
            if (weatherId >= 220 && weatherId < 300) return '⛈️';
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
            if (weatherId === 800) return '☀️';
            if (weatherId === 801) return '🌤️';
            if (weatherId === 802) return '⛅';
            if (weatherId === 803) return '🌥️';
            if (weatherId === 804) return '☁️';
        }
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
        const h = Math.floor(dayLen / 3600);
        const m = Math.floor((dayLen % 3600) / 60);

        const W = 240, H = 130;
        const cx = 120, cy = 95, rx = 95, ry = 65;
        const arcPath = `M ${cx - rx},${cy} A ${rx},${ry} 0 0,1 ${cx + rx},${cy}`;
        const arcLen = 271;

        const cp = Math.max(0, Math.min(1, progress));
        const angle = Math.PI * (1 - cp);
        const sunX = (cx + rx * Math.cos(angle)).toFixed(1);
        const sunY = (cy - ry * Math.sin(angle)).toFixed(1);
        const isDay = progress >= 0 && progress <= 1;
        const dashLen = Math.round(cp * arcLen);

        let svg = `<svg class="sun-arc" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<line class="sun-arc__horizon" x1="${cx - rx}" y1="${cy}" x2="${cx + rx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;
        svg += `<path class="sun-arc__path" d="${arcPath}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4,4"/>`;
        if (isDay) {
            svg += `<path class="sun-arc__progress" d="${arcPath}" fill="none" stroke="rgba(251,191,36,0.6)" stroke-width="2.5" stroke-dasharray="${dashLen},${arcLen}"/>`;
            svg += `<circle class="sun-arc__glow" cx="${sunX}" cy="${sunY}" r="10" fill="rgba(251,191,36,0.15)"/>`;
            svg += `<circle class="sun-arc__dot" cx="${sunX}" cy="${sunY}" r="5" fill="#fbbf24"/>`;
        }
        svg += `<text class="sun-arc__time sun-arc__time--rise" x="${cx - rx}" y="${cy + 18}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11">${riseStr}</text>`;
        svg += `<text class="sun-arc__time sun-arc__time--set" x="${cx + rx}" y="${cy + 18}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11">${setStr}</text>`;
        svg += `<text class="sun-arc__label" x="${cx}" y="${cy + 18}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">${h}h ${m}m</text>`;
        svg += `<text class="sun-arc__icon" x="${cx - rx - 1}" y="${cy - 5}" text-anchor="middle" font-size="13">🌅</text>`;
        svg += `<text class="sun-arc__icon" x="${cx + rx + 1}" y="${cy - 5}" text-anchor="middle" font-size="13">🌇</text>`;
        svg += `</svg>`;

        return svg;
    },

    getTempColor(temp) {
        const clamped = Math.max(-20, Math.min(40, temp));
        const hue = 210 - ((clamped + 20) / 60) * 210;
        return `hsl(${Math.round(hue)}, 80%, 60%)`;
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

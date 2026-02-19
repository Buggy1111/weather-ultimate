/**
 * Moon Phase Calculator & Realistic Canvas Renderer
 * Synodic month algorithm + photorealistic moon with maria, craters, limb darkening
 * Reference: Known new moon January 6, 2000 00:14 UTC
 */

const MoonPhase = (() => {
    const SYNODIC_MONTH = 29.53058867;
    const REFERENCE_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 0, 14, 0)).getTime();

    const PHASES = [
        { name: 'Nov',               emoji: '🌑', en: 'New Moon' },
        { name: 'Dorůstající srpek',  emoji: '🌒', en: 'Waxing Crescent' },
        { name: 'První čtvrť',       emoji: '🌓', en: 'First Quarter' },
        { name: 'Dorůstající měsíc',  emoji: '🌔', en: 'Waxing Gibbous' },
        { name: 'Úplněk',            emoji: '🌕', en: 'Full Moon' },
        { name: 'Couvající měsíc',   emoji: '🌖', en: 'Waning Gibbous' },
        { name: 'Poslední čtvrť',    emoji: '🌗', en: 'Last Quarter' },
        { name: 'Couvající srpek',   emoji: '🌘', en: 'Waning Crescent' }
    ];

    // Lunar maria (dark "seas") — approximate positions as fraction of diameter
    const MARIA = [
        { x: 0.35, y: 0.28, rx: 0.14, ry: 0.11, rot: -0.2 },  // Mare Imbrium
        { x: 0.55, y: 0.30, rx: 0.07, ry: 0.06, rot: 0.1 },   // Mare Serenitatis
        { x: 0.58, y: 0.43, rx: 0.09, ry: 0.07, rot: 0.3 },   // Mare Tranquillitatis
        { x: 0.73, y: 0.37, rx: 0.055, ry: 0.045, rot: 0 },   // Mare Crisium
        { x: 0.24, y: 0.44, rx: 0.16, ry: 0.13, rot: -0.1 },  // Oceanus Procellarum
        { x: 0.37, y: 0.61, rx: 0.09, ry: 0.07, rot: 0.2 },   // Mare Nubium
        { x: 0.27, y: 0.56, rx: 0.05, ry: 0.04, rot: -0.3 },  // Mare Humorum
        { x: 0.63, y: 0.53, rx: 0.07, ry: 0.05, rot: 0.15 },  // Mare Fecunditatis
        { x: 0.45, y: 0.38, rx: 0.04, ry: 0.03, rot: 0 },     // Mare Vaporum
        { x: 0.42, y: 0.48, rx: 0.03, ry: 0.025, rot: 0.1 },  // Sinus Medii
    ];

    // Notable craters
    const CRATERS = [
        { x: 0.47, y: 0.77, r: 0.035 },  // Tycho
        { x: 0.38, y: 0.73, r: 0.028 },  // Clavius
        { x: 0.66, y: 0.58, r: 0.018 },  // Langrenus
        { x: 0.30, y: 0.20, r: 0.022 },  // Plato
        { x: 0.52, y: 0.22, r: 0.018 },  // Aristoteles
        { x: 0.60, y: 0.24, r: 0.014 },  // Eudoxus
        { x: 0.55, y: 0.67, r: 0.016 },  // Fracastorius
        { x: 0.70, y: 0.48, r: 0.015 },  // Cleomedes
        { x: 0.20, y: 0.53, r: 0.020 },  // Grimaldi
        { x: 0.33, y: 0.35, r: 0.012 },  // Archimedes
        { x: 0.42, y: 0.30, r: 0.010 },  // Autolycus
        { x: 0.48, y: 0.60, r: 0.013 },  // Albategnius
        { x: 0.35, y: 0.82, r: 0.015 },  // Maginus
        { x: 0.58, y: 0.80, r: 0.012 },  // Stöfler
    ];

    // ----- Phase Calculator -----

    function getPhase(timestampMs) {
        const now = timestampMs || Date.now();
        const daysSinceRef = (now - REFERENCE_NEW_MOON) / 86400000;
        const age = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
        const phaseIndex = Math.floor((age / SYNODIC_MONTH) * 8) % 8;
        const illumination = Math.round((1 - Math.cos(2 * Math.PI * age / SYNODIC_MONTH)) / 2 * 100);

        return {
            phase: phaseIndex,
            ...PHASES[phaseIndex],
            age: Math.round(age * 10) / 10,
            illumination
        };
    }

    // ----- Canvas Renderer -----

    // Cache rendered moons (phase doesn't change often)
    let _cachedDataURL = null;
    let _cachedPhaseIndex = -1;

    function renderToDataURL(size, age) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const r = size * 0.44;
        const cx = size / 2;
        const cy = size / 2;

        ctx.clearRect(0, 0, size, size);

        // Clip to moon circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // --- 1. Base sphere with limb darkening ---
        const baseGrad = ctx.createRadialGradient(
            cx - r * 0.12, cy - r * 0.08, r * 0.05,
            cx, cy, r
        );
        baseGrad.addColorStop(0, '#dcd8c8');
        baseGrad.addColorStop(0.35, '#d0ccbc');
        baseGrad.addColorStop(0.65, '#c0bca8');
        baseGrad.addColorStop(0.85, '#a8a494');
        baseGrad.addColorStop(1, '#888478');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, size, size);

        // --- 2. Highland texture (subtle bright patches) ---
        const highlands = [
            { x: 0.40, y: 0.15, r: 0.12 },
            { x: 0.55, y: 0.75, r: 0.10 },
            { x: 0.25, y: 0.68, r: 0.08 },
            { x: 0.70, y: 0.30, r: 0.09 },
            { x: 0.48, y: 0.85, r: 0.14 },
        ];
        highlands.forEach(h => {
            const hx = cx - r + h.x * r * 2;
            const hy = cy - r + h.y * r * 2;
            const hr = h.r * r * 2;
            const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
            hGrad.addColorStop(0, 'rgba(220, 216, 200, 0.15)');
            hGrad.addColorStop(1, 'rgba(220, 216, 200, 0)');
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.arc(hx, hy, hr, 0, Math.PI * 2);
            ctx.fill();
        });

        // --- 3. Maria (dark seas) ---
        MARIA.forEach(m => {
            ctx.save();
            const mx = cx - r + m.x * r * 2;
            const my = cy - r + m.y * r * 2;
            ctx.translate(mx, my);
            ctx.rotate(m.rot);
            const mrx = m.rx * r * 2;
            const mry = m.ry * r * 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, mrx, mry, 0, 0, Math.PI * 2);
            const mGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, mrx);
            mGrad.addColorStop(0, 'rgba(78, 74, 62, 0.55)');
            mGrad.addColorStop(0.5, 'rgba(85, 80, 68, 0.40)');
            mGrad.addColorStop(0.8, 'rgba(95, 90, 78, 0.20)');
            mGrad.addColorStop(1, 'rgba(100, 95, 85, 0)');
            ctx.fillStyle = mGrad;
            ctx.fill();
            ctx.restore();
        });

        // --- 4. Craters ---
        CRATERS.forEach(c => {
            const crX = cx - r + c.x * r * 2;
            const crY = cy - r + c.y * r * 2;
            const crR = c.r * r * 2;

            // Crater floor (darker)
            ctx.beginPath();
            ctx.arc(crX, crY, crR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(70, 66, 56, 0.30)';
            ctx.fill();

            // Crater rim highlight (top-left light)
            ctx.beginPath();
            ctx.arc(crX - crR * 0.25, crY - crR * 0.25, crR * 0.85, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(210, 205, 190, 0.12)';
            ctx.fill();

            // Crater inner shadow (bottom-right)
            ctx.beginPath();
            ctx.arc(crX + crR * 0.15, crY + crR * 0.15, crR * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(60, 56, 48, 0.15)';
            ctx.fill();
        });

        // --- 5. Micro-texture (deterministic "random" spots) ---
        for (let i = 0; i < 40; i++) {
            const angle1 = i * 2.399;
            const angle2 = i * 3.147;
            const dist = 0.15 + ((i * 7 + 3) % 13) / 13 * 0.75;
            const px = cx + r * dist * Math.cos(angle1);
            const py = cy + r * dist * Math.sin(angle2);
            const pr = r * (0.006 + ((i * 3) % 5) * 0.004);
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            const bright = (i % 3 === 0);
            ctx.fillStyle = bright
                ? `rgba(200, 196, 180, ${0.08 + (i % 4) * 0.03})`
                : `rgba(80, 76, 64, ${0.10 + (i % 3) * 0.04})`;
            ctx.fill();
        }

        // --- 6. Tycho rays (bright streaks from Tycho crater) ---
        const tychoX = cx - r + 0.47 * r * 2;
        const tychoY = cy - r + 0.77 * r * 2;
        ctx.save();
        ctx.globalAlpha = 0.06;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
            ctx.beginPath();
            ctx.moveTo(tychoX, tychoY);
            const rayLen = r * (0.3 + ((a * 5) % 1) * 0.4);
            ctx.lineTo(tychoX + Math.cos(a) * rayLen, tychoY + Math.sin(a) * rayLen);
            ctx.lineWidth = r * 0.015;
            ctx.strokeStyle = '#e0dcc8';
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // --- 7. Phase shadow (terminator) ---
        const norm = age / SYNODIC_MONTH;
        const phaseAngle = norm * 2 * Math.PI;
        const termX = Math.cos(phaseAngle); // -1 to 1

        ctx.beginPath();
        const steps = 80;

        if (norm <= 0.5) {
            // Waxing: shadow on left side
            ctx.arc(cx, cy, r + 0.5, -Math.PI / 2, Math.PI / 2, true); // left semicircle
            for (let i = 0; i <= steps; i++) {
                const t = Math.PI / 2 - (Math.PI * i / steps);
                ctx.lineTo(cx + termX * r * Math.cos(t), cy + r * Math.sin(t));
            }
        } else {
            // Waning: shadow on right side
            ctx.arc(cx, cy, r + 0.5, -Math.PI / 2, Math.PI / 2, false); // right semicircle
            for (let i = 0; i <= steps; i++) {
                const t = Math.PI / 2 - (Math.PI * i / steps);
                ctx.lineTo(cx + termX * r * Math.cos(t), cy + r * Math.sin(t));
            }
        }
        ctx.closePath();

        // Shadow gradient (slightly lighter near terminator = earthshine)
        const shadowDir = norm <= 0.5 ? -1 : 1;
        const shGrad = ctx.createLinearGradient(
            cx + shadowDir * r, cy,
            cx + shadowDir * r * termX, cy
        );
        shGrad.addColorStop(0, 'rgba(6, 8, 20, 0.96)');
        shGrad.addColorStop(0.7, 'rgba(8, 10, 25, 0.94)');
        shGrad.addColorStop(1, 'rgba(14, 16, 35, 0.88)');
        ctx.fillStyle = shGrad;
        ctx.fill();

        // Soft terminator edge
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = -Math.PI / 2 + (Math.PI * i / steps);
            const x = cx + termX * r * Math.cos(t);
            const y = cy + r * Math.sin(t);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineWidth = r * 0.06;
        ctx.strokeStyle = 'rgba(8, 10, 25, 0.35)';
        ctx.stroke();

        // --- 8. Earthshine on dark side (very faint) ---
        if (norm > 0.05 && norm < 0.95) {
            const esX = norm <= 0.5 ? cx - r * 0.5 : cx + r * 0.5;
            const esGrad = ctx.createRadialGradient(esX, cy, 0, esX, cy, r * 0.8);
            esGrad.addColorStop(0, 'rgba(100, 120, 160, 0.04)');
            esGrad.addColorStop(1, 'rgba(100, 120, 160, 0)');
            ctx.fillStyle = esGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // un-clip

        // --- 9. Outer atmosphere/rim glow ---
        const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.08);
        rimGrad.addColorStop(0, 'rgba(200, 210, 230, 0)');
        rimGrad.addColorStop(0.5, 'rgba(200, 210, 230, 0.08)');
        rimGrad.addColorStop(1, 'rgba(200, 210, 230, 0)');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
        ctx.fill();

        return canvas.toDataURL('image/png');
    }

    // ----- HTML Generators -----

    function getBadgeHTML(timestampMs) {
        const moon = getPhase(timestampMs);
        return `<span class="weather-card__moon-badge" title="${moon.name} (${moon.illumination}%)">${moon.emoji} ${moon.name}</span>`;
    }

    /**
     * Generate visual moon HTML with optional cloud overlay
     * @param {number} [timestampMs]
     * @param {string} [weather] - weather condition: 'clear','clouds','rain','drizzle','thunderstorm','snow','mist','fog'
     */
    function getVisualHTML(timestampMs, weather) {
        const moon = getPhase(timestampMs);

        // Cache: only re-render when phase index changes
        if (moon.phase !== _cachedPhaseIndex || !_cachedDataURL) {
            _cachedDataURL = renderToDataURL(160, moon.age);
            _cachedPhaseIndex = moon.phase;
        }

        const glowAlpha = (moon.illumination / 100 * 0.45).toFixed(2);
        const glowSize = Math.round(8 + moon.illumination / 100 * 20);

        // Weather modifier class
        let weatherClass = '';
        const w = (weather || '').toLowerCase();
        if (['rain', 'drizzle', 'thunderstorm'].includes(w)) {
            weatherClass = 'moon-visual--rain';
        } else if (['clouds'].includes(w)) {
            weatherClass = 'moon-visual--cloudy';
        } else if (['mist', 'fog', 'haze', 'smoke'].includes(w)) {
            weatherClass = 'moon-visual--overcast';
        }

        // Cloud elements HTML
        const cloudsHTML = weatherClass ? `
            <div class="moon-visual__clouds">
                <div class="moon-visual__cloud"></div>
                <div class="moon-visual__cloud"></div>
                <div class="moon-visual__cloud"></div>
            </div>
        ` : '';

        return `
            <div class="moon-visual ${weatherClass}" title="${moon.name} — ${moon.illumination}% osvětlení"
                 data-weather-type="${w}">
                <img class="moon-visual__img" src="${_cachedDataURL}" alt="${moon.name}" width="160" height="160" draggable="false">
                ${cloudsHTML}
                <div class="moon-visual__glow" style="
                    box-shadow: 0 0 ${glowSize}px rgba(200,210,240,${glowAlpha}),
                                0 0 ${glowSize * 2.5}px rgba(180,195,230,${(glowAlpha * 0.3).toFixed(2)});
                "></div>
                <div class="moon-visual__label">${moon.name}</div>
            </div>
        `;
    }

    return { getPhase, getBadgeHTML, getVisualHTML, PHASES };
})();

window.MoonPhase = MoonPhase;

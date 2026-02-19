/**
 * Moon Phase Calculator
 * Calculates moon phase based on synodic month (~29.53 days)
 * Reference: Known new moon on January 6, 2000 00:14 UTC
 */

const MoonPhase = (() => {
    // Synodic month in days (new moon to new moon)
    const SYNODIC_MONTH = 29.53058867;

    // Reference new moon: January 6, 2000 00:14 UTC
    const REFERENCE_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 0, 14, 0)).getTime();

    // 8 moon phases with emoji and Czech names
    const PHASES = [
        { name: 'Nov',              emoji: '🌑', en: 'New Moon' },
        { name: 'Dorůstající srpek', emoji: '🌒', en: 'Waxing Crescent' },
        { name: 'První čtvrť',      emoji: '🌓', en: 'First Quarter' },
        { name: 'Dorůstající měsíc', emoji: '🌔', en: 'Waxing Gibbous' },
        { name: 'Úplněk',           emoji: '🌕', en: 'Full Moon' },
        { name: 'Couvající měsíc',  emoji: '🌖', en: 'Waning Gibbous' },
        { name: 'Poslední čtvrť',   emoji: '🌗', en: 'Last Quarter' },
        { name: 'Couvající srpek',  emoji: '🌘', en: 'Waning Crescent' }
    ];

    /**
     * Get the current moon phase for a given UTC timestamp
     * @param {number} [timestampMs] - UTC timestamp in milliseconds (defaults to now)
     * @returns {{ phase: number, name: string, emoji: string, en: string, age: number, illumination: number }}
     */
    function getPhase(timestampMs) {
        const now = timestampMs || Date.now();

        // Days since reference new moon
        const daysSinceRef = (now - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);

        // Current position in the synodic cycle (0 = new moon, ~14.76 = full moon)
        const age = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

        // Phase index (0-7)
        const phaseIndex = Math.floor((age / SYNODIC_MONTH) * 8) % 8;

        // Illumination percentage (0% at new moon, 100% at full moon)
        const illumination = Math.round((1 - Math.cos(2 * Math.PI * age / SYNODIC_MONTH)) / 2 * 100);

        return {
            phase: phaseIndex,
            ...PHASES[phaseIndex],
            age: Math.round(age * 10) / 10,
            illumination
        };
    }

    /**
     * Generate HTML badge for moon phase
     * @param {number} [timestampMs] - UTC timestamp in milliseconds
     * @returns {string} HTML string for moon badge
     */
    function getBadgeHTML(timestampMs) {
        const moon = getPhase(timestampMs);
        return `<span class="weather-card__moon-badge" title="${moon.name} (${moon.illumination}%)">${moon.emoji} ${moon.name}</span>`;
    }

    // Public API
    return { getPhase, getBadgeHTML, PHASES };
})();

// Expose globally for use in ultimate.js
window.MoonPhase = MoonPhase;

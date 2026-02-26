/**
 * Weather Ultimate — Unit Tests
 * Minimal test framework + comprehensive tests for all pure-logic modules
 */

// ── Tiny test framework ───────────────────────────────────────
const _suites = [];
let _currentSuite = null;

function describe(name, fn) {
    _currentSuite = { name, tests: [] };
    _suites.push(_currentSuite);
    fn();
    _currentSuite = null;
}

function it(name, fn) {
    const test = { name, passed: false, error: null };
    try {
        fn();
        test.passed = true;
    } catch (e) {
        test.error = e.message || String(e);
    }
    _currentSuite.tests.push(test);
}

function expect(val) {
    return {
        toBe(expected) {
            if (val !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
        },
        toEqual(expected) {
            if (JSON.stringify(val) !== JSON.stringify(expected))
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
        },
        toBeTruthy() { if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toBeFalsy() { if (val) throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); },
        toBeGreaterThan(n) { if (!(val > n)) throw new Error(`Expected ${val} > ${n}`); },
        toBeLessThan(n) { if (!(val < n)) throw new Error(`Expected ${val} < ${n}`); },
        toBeGreaterThanOrEqual(n) { if (!(val >= n)) throw new Error(`Expected ${val} >= ${n}`); },
        toContain(sub) {
            if (typeof val === 'string') {
                if (!val.includes(sub)) throw new Error(`Expected "${val}" to contain "${sub}"`);
            } else if (Array.isArray(val)) {
                if (!val.includes(sub)) throw new Error(`Expected array to contain ${JSON.stringify(sub)}`);
            } else throw new Error(`toContain needs string or array, got ${typeof val}`);
        },
        toBeInstanceOf(cls) {
            if (!(val instanceof cls)) throw new Error(`Expected instance of ${cls.name}`);
        },
        toBeNull() { if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`); },
        toHaveLength(n) {
            if (val.length !== n) throw new Error(`Expected length ${n}, got ${val.length}`);
        },
        toMatch(regex) {
            if (!regex.test(val)) throw new Error(`Expected "${val}" to match ${regex}`);
        },
        toThrow() {
            if (typeof val !== 'function') throw new Error('toThrow needs a function');
            let threw = false;
            try { val(); } catch { threw = true; }
            if (!threw) throw new Error('Expected function to throw');
        }
    };
}

// ── Render results using safe DOM methods ─────────────────────
function renderResults() {
    const container = document.getElementById('results');
    // Clear existing content
    while (container.firstChild) container.removeChild(container.firstChild);

    let totalPass = 0, totalFail = 0;
    _suites.forEach(suite => {
        suite.tests.forEach(t => { t.passed ? totalPass++ : totalFail++; });
    });

    const total = totalPass + totalFail;

    // Summary
    const summary = document.createElement('div');
    summary.className = totalFail === 0 ? 'summary summary--pass' : 'summary summary--fail';
    const icon = totalFail === 0 ? '\u2705' : '\u274C';
    let summaryText = `${icon} ${totalPass}/${total} tests passed`;
    if (totalFail > 0) summaryText += ` \u2014 ${totalFail} failed`;
    summary.textContent = summaryText;
    container.appendChild(summary);

    // Suites
    _suites.forEach(suite => {
        const suiteDiv = document.createElement('div');
        suiteDiv.className = 'suite';

        const suiteName = document.createElement('div');
        suiteName.className = 'suite__name';
        suiteName.textContent = suite.name;
        suiteDiv.appendChild(suiteName);

        suite.tests.forEach(t => {
            const testDiv = document.createElement('div');
            testDiv.className = t.passed ? 'test test--pass' : 'test test--fail';
            const mark = t.passed ? '\u2713' : '\u2717';
            testDiv.textContent = `${mark} ${t.name}`;

            if (t.error) {
                const errSpan = document.createElement('span');
                errSpan.className = 'error';
                errSpan.textContent = t.error;
                testDiv.appendChild(errSpan);
            }
            suiteDiv.appendChild(testDiv);
        });

        container.appendChild(suiteDiv);
    });

    // Console output for Playwright
    console.log(`[TEST_RESULTS] ${totalPass}/${total} passed, ${totalFail} failed`);
    if (totalFail > 0) {
        _suites.forEach(suite => {
            suite.tests.filter(t => !t.passed).forEach(t => {
                console.error(`[TEST_FAIL] ${suite.name} > ${t.name}: ${t.error}`);
            });
        });
    }
}


// ══════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════

// ── CONFIG ────────────────────────────────────────────────────
describe('CONFIG', () => {
    it('has API_KEY', () => {
        expect(typeof CONFIG.API_KEY).toBe('string');
        expect(CONFIG.API_KEY.length).toBeGreaterThan(10);
    });

    it('has correct API_BASE_URL', () => {
        expect(CONFIG.API_BASE_URL).toContain('openweathermap.org');
    });

    it('has 6 default cities', () => {
        expect(CONFIG.DEFAULT_CITIES).toHaveLength(6);
    });

    it('default cities have required fields', () => {
        CONFIG.DEFAULT_CITIES.forEach(city => {
            expect(typeof city.name).toBe('string');
            expect(typeof city.country).toBe('string');
            expect(typeof city.lat).toBe('number');
            expect(typeof city.lon).toBe('number');
        });
    });

    it('CACHE_DURATION is 5 minutes', () => {
        expect(CONFIG.CACHE_DURATION).toBe(5 * 60 * 1000);
    });

    it('UPDATE_INTERVAL is 1 minute', () => {
        expect(CONFIG.UPDATE_INTERVAL).toBe(60 * 1000);
    });

    it('WEATHER_MOODS has all required types', () => {
        const types = ['clear', 'clouds', 'rain', 'drizzle', 'thunderstorm', 'snow', 'mist'];
        types.forEach(type => {
            expect(!!CONFIG.WEATHER_MOODS[type]).toBeTruthy();
            expect(typeof CONFIG.WEATHER_MOODS[type].text).toBe('string');
            expect(CONFIG.WEATHER_MOODS[type].colors).toHaveLength(2);
            expect(typeof CONFIG.WEATHER_MOODS[type].emoji).toBe('string');
        });
    });
});

// ── features ──────────────────────────────────────────────────
describe('Feature Detection', () => {
    it('features object exists', () => {
        expect(typeof features).toBe('object');
    });

    it('has all expected keys', () => {
        const keys = ['indexedDB', 'webGL', 'battery', 'networkInfo', 'vibration', 'geolocation'];
        keys.forEach(key => {
            expect(typeof features[key]).toBe('boolean');
        });
    });

    it('removed unused feature flags (webShare, clipboard)', () => {
        expect(features.webShare).toBe(undefined);
        expect(features.clipboard).toBe(undefined);
    });

    it('indexedDB is available in browser', () => {
        expect(features.indexedDB).toBe(true);
    });
});

// ── WeatherHelpers.escapeHTML ─────────────────────────────────
describe('WeatherHelpers.escapeHTML', () => {
    it('escapes < and >', () => {
        expect(WeatherHelpers.escapeHTML('<script>alert(1)</script>'))
            .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('escapes & character', () => {
        expect(WeatherHelpers.escapeHTML('foo & bar')).toBe('foo &amp; bar');
    });

    it('escapes double quotes', () => {
        expect(WeatherHelpers.escapeHTML('he said "hi"')).toBe('he said &quot;hi&quot;');
    });

    it('escapes single quotes', () => {
        expect(WeatherHelpers.escapeHTML("it's")).toBe('it&#39;s');
    });

    it('returns empty string for null', () => {
        expect(WeatherHelpers.escapeHTML(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(WeatherHelpers.escapeHTML(undefined)).toBe('');
    });

    it('converts numbers to string', () => {
        expect(WeatherHelpers.escapeHTML(42)).toBe('42');
    });

    it('handles empty string', () => {
        expect(WeatherHelpers.escapeHTML('')).toBe('');
    });

    it('handles string with no special chars', () => {
        expect(WeatherHelpers.escapeHTML('Praha')).toBe('Praha');
    });

    it('handles combined special chars', () => {
        expect(WeatherHelpers.escapeHTML('<"&\'>'))
            .toBe('&lt;&quot;&amp;&#39;&gt;');
    });
});

// ── WeatherHelpers.translateWeatherToCzech ────────────────────
describe('WeatherHelpers.translateWeatherToCzech', () => {
    it('translates clear sky', () => {
        expect(WeatherHelpers.translateWeatherToCzech('clear sky')).toBe('jasno');
    });

    it('translates heavy intensity rain', () => {
        expect(WeatherHelpers.translateWeatherToCzech('heavy intensity rain')).toBe('silný déšť');
    });

    it('is case insensitive', () => {
        expect(WeatherHelpers.translateWeatherToCzech('Clear Sky')).toBe('jasno');
    });

    it('falls back to original for unknown', () => {
        expect(WeatherHelpers.translateWeatherToCzech('unknown weather')).toBe('unknown weather');
    });

    it('translates thunderstorm', () => {
        expect(WeatherHelpers.translateWeatherToCzech('thunderstorm')).toBe('bouřka');
    });

    it('translates snow', () => {
        expect(WeatherHelpers.translateWeatherToCzech('snow')).toBe('sněžení');
    });

    it('translates fog', () => {
        expect(WeatherHelpers.translateWeatherToCzech('fog')).toBe('mlha');
    });

    it('translates broken clouds', () => {
        expect(WeatherHelpers.translateWeatherToCzech('broken clouds')).toBe('oblačno');
    });

    it('translates overcast clouds', () => {
        expect(WeatherHelpers.translateWeatherToCzech('overcast clouds')).toBe('zataženo');
    });

    it('uses partial match for unknown combos', () => {
        expect(WeatherHelpers.translateWeatherToCzech('light rain with snow')).toBe('slabý déšť');
    });
});

// ── WeatherHelpers.getWeatherEmoji ────────────────────────────
describe('WeatherHelpers.getWeatherEmoji', () => {
    it('returns sun for clear', () => {
        expect(WeatherHelpers.getWeatherEmoji('clear')).toBe('\u2600\uFE0F');
    });

    it('returns cloud for clouds', () => {
        expect(WeatherHelpers.getWeatherEmoji('clouds')).toBe('\u2601\uFE0F');
    });

    it('returns rainbow for unknown', () => {
        expect(WeatherHelpers.getWeatherEmoji('alien_weather')).toBe('\uD83C\uDF08');
    });

    it('uses weatherId 800 = clear sun', () => {
        expect(WeatherHelpers.getWeatherEmoji('clear', 800)).toBe('\u2600\uFE0F');
    });

    it('uses weatherId 801 = few clouds', () => {
        expect(WeatherHelpers.getWeatherEmoji('clouds', 801)).toBe('\uD83C\uDF24\uFE0F');
    });

    it('uses weatherId 804 = overcast', () => {
        expect(WeatherHelpers.getWeatherEmoji('clouds', 804)).toBe('\u2601\uFE0F');
    });

    it('uses weatherId 601 = heavy snow', () => {
        expect(WeatherHelpers.getWeatherEmoji('snow', 601)).toBe('\u2744\uFE0F');
    });

    it('uses weatherId 511 = freezing rain', () => {
        expect(WeatherHelpers.getWeatherEmoji('rain', 511)).toBe('\uD83E\uDDCA');
    });

    it('uses weatherId for thunderstorm (200)', () => {
        expect(WeatherHelpers.getWeatherEmoji('thunderstorm', 200)).toBe('\u26C8\uFE0F');
    });
});

// ── WeatherHelpers.getWindDirection ───────────────────────────
describe('WeatherHelpers.getWindDirection', () => {
    it('0 deg = S (north/sever)', () => {
        expect(WeatherHelpers.getWindDirection(0)).toBe('S');
    });

    it('90 deg = V (east)', () => {
        expect(WeatherHelpers.getWindDirection(90)).toBe('V');
    });

    it('180 deg = J (south)', () => {
        expect(WeatherHelpers.getWindDirection(180)).toBe('J');
    });

    it('270 deg = Z (west)', () => {
        expect(WeatherHelpers.getWindDirection(270)).toBe('Z');
    });

    it('45 deg = SV (northeast)', () => {
        expect(WeatherHelpers.getWindDirection(45)).toBe('SV');
    });

    it('315 deg = SZ (northwest)', () => {
        expect(WeatherHelpers.getWindDirection(315)).toBe('SZ');
    });

    it('null returns empty string', () => {
        expect(WeatherHelpers.getWindDirection(null)).toBe('');
    });

    it('360 deg wraps to S', () => {
        expect(WeatherHelpers.getWindDirection(360)).toBe('S');
    });
});

// ── WeatherHelpers.getAQIInfo ─────────────────────────────────
describe('WeatherHelpers.getAQIInfo', () => {
    it('AQI 1 = good (green)', () => {
        const info = WeatherHelpers.getAQIInfo(1);
        expect(info.label).toBe('Dobr\u00E1');
        expect(info.color).toBe('#4ade80');
    });

    it('AQI 2 = acceptable (yellow)', () => {
        expect(WeatherHelpers.getAQIInfo(2).label).toBe('P\u0159ijateln\u00E1');
    });

    it('AQI 3 = moderate', () => {
        expect(WeatherHelpers.getAQIInfo(3).label).toBe('St\u0159edn\u00ED');
    });

    it('AQI 4 = poor (red)', () => {
        expect(WeatherHelpers.getAQIInfo(4).label).toBe('\u0160patn\u00E1');
    });

    it('AQI 5 = very poor (purple)', () => {
        expect(WeatherHelpers.getAQIInfo(5).label).toBe('Velmi \u0161patn\u00E1');
    });

    it('unknown AQI defaults to level 3', () => {
        expect(WeatherHelpers.getAQIInfo(99).label).toBe('St\u0159edn\u00ED');
    });
});

// ── WeatherHelpers.formatVisibility ───────────────────────────
describe('WeatherHelpers.formatVisibility', () => {
    it('10000+ meters = 10+ km', () => {
        expect(WeatherHelpers.formatVisibility(10000)).toBe('10+ km');
        expect(WeatherHelpers.formatVisibility(15000)).toBe('10+ km');
    });

    it('5000 meters = 5.0 km', () => {
        expect(WeatherHelpers.formatVisibility(5000)).toBe('5.0 km');
    });

    it('1500 meters = 1.5 km', () => {
        expect(WeatherHelpers.formatVisibility(1500)).toBe('1.5 km');
    });

    it('500 meters stays as meters', () => {
        expect(WeatherHelpers.formatVisibility(500)).toBe('500 m');
    });

    it('null returns dash', () => {
        expect(WeatherHelpers.formatVisibility(null)).toBe('\u2014');
    });
});

// ── WeatherHelpers.formatPollutantValue ───────────────────────
describe('WeatherHelpers.formatPollutantValue', () => {
    it('PM2.5 good level', () => {
        const result = WeatherHelpers.formatPollutantValue('pm2_5', 5);
        expect(result.level).toBe('good');
        expect(result.unit).toBe('\u03BCg/m\u00B3');
    });

    it('PM2.5 fair level (value > 25)', () => {
        const result = WeatherHelpers.formatPollutantValue('pm2_5', 30);
        expect(result.level).toBe('fair');
    });

    it('PM2.5 moderate level (value > 50)', () => {
        const result = WeatherHelpers.formatPollutantValue('pm2_5', 55);
        expect(result.level).toBe('moderate');
    });

    it('PM2.5 poor level', () => {
        const result = WeatherHelpers.formatPollutantValue('pm2_5', 80);
        expect(result.level).toBe('poor');
    });

    it('unknown pollutant returns unknown level', () => {
        const result = WeatherHelpers.formatPollutantValue('xyz', 10);
        expect(result.level).toBe('unknown');
    });

    it('value is formatted to 1 decimal', () => {
        const result = WeatherHelpers.formatPollutantValue('pm10', 12.567);
        expect(result.value).toBe('12.6');
    });
});

// ── StateManager ──────────────────────────────────────────────
describe('StateManager', () => {
    it('initializes with empty cities map', () => {
        const sm = new StateManager();
        expect(sm.state.cities).toBeInstanceOf(Map);
        expect(sm.state.cities.size).toBe(0);
    });

    it('initializes with default stats', () => {
        const sm = new StateManager();
        expect(sm.state.stats.total).toBe(0);
        expect(sm.state.stats.avgTemp).toBe(0);
        expect(sm.state.stats.sunnyCount).toBe(0);
        expect(sm.state.stats.lastUpdate).toBeNull();
    });

    it('subscribe and emit work', () => {
        const sm = new StateManager();
        let received = null;
        sm.subscribe('test', (data) => { received = data; });
        sm.emit('test', 'hello');
        expect(received).toBe('hello');
    });

    it('multiple subscribers get notified', () => {
        const sm = new StateManager();
        let a = 0, b = 0;
        sm.subscribe('x', () => a++);
        sm.subscribe('x', () => b++);
        sm.emit('x');
        expect(a).toBe(1);
        expect(b).toBe(1);
    });

    it('emit with no subscribers does not throw', () => {
        const sm = new StateManager();
        sm.emit('nonexistent', { data: 1 });
        expect(true).toBeTruthy();
    });

    it('addCity stores city and updates stats', () => {
        const sm = new StateManager();
        const city = {
            id: 'test-1',
            main: { temp: 20 },
            weather: [{ main: 'Clear' }]
        };
        sm.addCity(city);
        expect(sm.state.cities.size).toBe(1);
        expect(sm.state.stats.total).toBe(1);
        expect(sm.state.stats.avgTemp).toBe(20);
        expect(sm.state.stats.sunnyCount).toBe(1);
    });

    it('addCity overwrites existing city with same id', () => {
        const sm = new StateManager();
        sm.addCity({ id: 'c1', main: { temp: 10 }, weather: [{ main: 'Clouds' }] });
        sm.addCity({ id: 'c1', main: { temp: 25 }, weather: [{ main: 'Clear' }] });
        expect(sm.state.cities.size).toBe(1);
        expect(sm.state.stats.avgTemp).toBe(25);
    });

    it('updateStats calculates correct average', () => {
        const sm = new StateManager();
        sm.addCity({ id: 'c1', main: { temp: 10 }, weather: [{ main: 'Clear' }] });
        sm.addCity({ id: 'c2', main: { temp: 30 }, weather: [{ main: 'Clouds' }] });
        expect(sm.state.stats.avgTemp).toBe(20);
        expect(sm.state.stats.total).toBe(2);
        expect(sm.state.stats.sunnyCount).toBe(1);
    });

    it('updateState merges into state and emits', () => {
        const sm = new StateManager();
        let emitted = false;
        sm.subscribe('stateChange', () => { emitted = true; });
        sm.updateState({ searchQuery: 'Praha' });
        expect(sm.state.searchQuery).toBe('Praha');
        expect(emitted).toBeTruthy();
    });

    it('addCity emits cityAdded event', () => {
        const sm = new StateManager();
        let addedCity = null;
        sm.subscribe('cityAdded', (data) => { addedCity = data; });
        const city = { id: 'x', main: { temp: 15 }, weather: [{ main: 'Rain' }] };
        sm.addCity(city);
        expect(addedCity.id).toBe('x');
    });

    it('updateStats emits statsUpdated event', () => {
        const sm = new StateManager();
        let stats = null;
        sm.subscribe('statsUpdated', (s) => { stats = s; });
        sm.addCity({ id: '1', main: { temp: 0 }, weather: [{ main: 'Snow' }] });
        expect(stats).toBeTruthy();
        expect(stats.total).toBe(1);
    });
});

// ── AdvancedCache ─────────────────────────────────────────────
describe('AdvancedCache (memory tier)', () => {
    it('constructor creates empty memory cache', () => {
        const cache = new AdvancedCache();
        expect(cache.memoryCache).toBeInstanceOf(Map);
        expect(cache.memoryCache.size).toBe(0);
    });

    it('set + get returns cached data', async () => {
        const cache = new AdvancedCache();
        await cache.set('key1', { temp: 20 });
        const result = await cache.get('key1');
        expect(result.temp).toBe(20);
    });

    it('get returns null for missing key', async () => {
        const cache = new AdvancedCache();
        const result = await cache.get('nonexistent');
        expect(result).toBeNull();
    });

    it('isValid returns true for fresh item', () => {
        const cache = new AdvancedCache();
        expect(cache.isValid({ timestamp: Date.now() })).toBe(true);
    });

    it('isValid returns false for expired item', () => {
        const cache = new AdvancedCache();
        const expired = Date.now() - CONFIG.CACHE_DURATION - 1000;
        expect(cache.isValid({ timestamp: expired })).toBe(false);
    });

    it('get returns null for expired item', async () => {
        const cache = new AdvancedCache();
        cache.memoryCache.set('old', {
            id: 'old',
            data: { temp: 5 },
            timestamp: Date.now() - CONFIG.CACHE_DURATION - 1000
        });
        const result = await cache.get('old');
        expect(result).toBeNull();
    });

    it('set stores with timestamp', async () => {
        const cache = new AdvancedCache();
        const before = Date.now();
        await cache.set('ts-test', 'data');
        const item = cache.memoryCache.get('ts-test');
        expect(item.timestamp).toBeGreaterThanOrEqual(before);
        expect(item.data).toBe('data');
    });
});

// ── AIPredictions ─────────────────────────────────────────────
describe('AIPredictions', () => {
    const ai = new AIPredictions();

    const makeCityData = (temp, weather, pressure, humidity, windSpeed, visibility) => ({
        main: { temp, feels_like: temp - 2, pressure: pressure || 1015, humidity: humidity || 60 },
        weather: [{ main: weather }],
        wind: { speed: windSpeed || 3 },
        clouds: { all: weather === 'Clouds' ? 80 : 10 },
        visibility: visibility || 10000
    });

    it('returns fallback for empty data', () => {
        const result = ai.generatePrediction([]);
        expect(result).toBe('Analyzuji dostupn\u00E1 data...');
    });

    it('returns fallback for null data', () => {
        const result = ai.generatePrediction(null);
        expect(result).toBe('Analyzuji dostupn\u00E1 data...');
    });

    it('generates insight for normal weather', () => {
        const data = [
            makeCityData(20, 'Clear'),
            makeCityData(18, 'Clear'),
            makeCityData(22, 'Clouds')
        ];
        const result = ai.generatePrediction(data);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(10);
    });

    it('analyzeWeather returns alerts for extreme cold', () => {
        const data = [makeCityData(-20, 'Clear')];
        const insights = ai.analyzeWeather(data);
        const hasAlert = insights.some(i => i.includes('mr\u00E1z') || i.includes('Extr\u00E9mn\u00ED'));
        expect(hasAlert).toBeTruthy();
    });

    it('analyzeWeather returns alerts for extreme heat', () => {
        const data = [makeCityData(40, 'Clear')];
        const insights = ai.analyzeWeather(data);
        const hasAlert = insights.some(i => i.includes('vedro') || i.includes('Vysok\u00E9'));
        expect(hasAlert).toBeTruthy();
    });

    it('analyzeWeather detects thunderstorms', () => {
        const data = [
            makeCityData(20, 'Thunderstorm'),
            makeCityData(22, 'Clear')
        ];
        const insights = ai.analyzeWeather(data);
        const hasStorm = insights.some(i => i.includes('Bou\u0159kov\u00E1'));
        expect(hasStorm).toBeTruthy();
    });

    it('analyzeWeather shows pressure analysis', () => {
        const data = [makeCityData(15, 'Clear', 1015, 50, 2)];
        const insights = ai.analyzeWeather(data);
        const hasPressure = insights.some(i => i.includes('hPa'));
        expect(hasPressure).toBeTruthy();
    });

    it('analyzeWeather detects low pressure', () => {
        const data = [makeCityData(10, 'Rain', 995, 80, 5)];
        const insights = ai.analyzeWeather(data);
        const hasLowPressure = insights.some(i => i.includes('n\u00ED\u017Ee') || i.includes('cyklon\u00E1ln\u00ED'));
        expect(hasLowPressure).toBeTruthy();
    });

    it('analyzeWeather detects high pressure', () => {
        const data = [makeCityData(25, 'Clear', 1030, 30, 1)];
        const insights = ai.analyzeWeather(data);
        const hasHighPressure = insights.some(i => i.includes('v\u00FD\u0161e') || i.includes('anticykl\u00F3na'));
        expect(hasHighPressure).toBeTruthy();
    });

    it('analyzeWeather detects all cities clear', () => {
        const data = [
            makeCityData(20, 'Clear'),
            makeCityData(25, 'Clear'),
            makeCityData(18, 'Clear')
        ];
        const insights = ai.analyzeWeather(data);
        const allClear = insights.some(i => i.includes('Jasno ve v\u0161ech'));
        expect(allClear).toBeTruthy();
    });

    it('analyzeWeather detects high humidity + heat', () => {
        const data = [makeCityData(32, 'Clouds', 1010, 92, 2)];
        const insights = ai.analyzeWeather(data);
        const hasTropical = insights.some(i => i.includes('tropick') || i.includes('dusn'));
        expect(hasTropical).toBeTruthy();
    });

    it('generatePrediction cycles through insights', () => {
        const ai2 = new AIPredictions();
        const data = [
            makeCityData(20, 'Clear', 1030),
            makeCityData(-5, 'Snow', 1000),
            makeCityData(35, 'Rain', 995)
        ];
        const first = ai2.generatePrediction(data);
        const second = ai2.generatePrediction(data);
        expect(typeof first).toBe('string');
        expect(typeof second).toBe('string');
    });
});

// ── AIPredictions.generateCityPrediction ──────────────────────
describe('AIPredictions.generateCityPrediction', () => {
    const ai = new AIPredictions();

    const makeDayForecast = (dayOffset, avgTemp, maxTemp, minTemp, weather, rain) => ({
        date: new Date(Date.now() + dayOffset * 86400000),
        avgTemp, maxTemp, minTemp,
        avgFeelsLike: avgTemp - 2,
        avgHumidity: 60,
        avgWind: 15,
        avgPressure: 1015,
        avgClouds: 30,
        minVisibility: 10000,
        rainTotal: rain || 0,
        snowTotal: 0,
        maxGust: 25,
        maxPop: (rain || 0) > 0 ? 80 : 10,
        weather: { main: weather || 'Clear', description: (weather || 'Clear').toLowerCase() },
        weatherId: 800,
        windDeg: 180,
        windDir: 'J'
    });

    it('returns empty array for null data', () => {
        expect(ai.generateCityPrediction('Test', null)).toEqual([]);
    });

    it('returns empty array for single day', () => {
        expect(ai.generateCityPrediction('Test', [makeDayForecast(0, 15, 18, 12)])).toEqual([]);
    });

    it('generates insights for valid 7-day forecast', () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(makeDayForecast(i, 15 + i, 18 + i, 12 + i));
        }
        const insights = ai.generateCityPrediction('Praha', days);
        expect(insights.length).toBeGreaterThan(2);
    });

    it('detects warming trend', () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(makeDayForecast(i, 5 + i * 2, 8 + i * 2, 2 + i * 2));
        }
        const insights = ai.generateCityPrediction('Test', days);
        const hasWarming = insights.some(i => i.includes('oteplov'));
        expect(hasWarming).toBeTruthy();
    });

    it('detects dry week', () => {
        const days = [];
        for (let i = 0; i < 5; i++) {
            days.push(makeDayForecast(i, 20, 23, 17, 'Clear', 0));
        }
        const insights = ai.generateCityPrediction('Test', days);
        const hasDry = insights.some(i => i.includes('Such\u00FD') || i.includes('such'));
        expect(hasDry).toBeTruthy();
    });

    it('detects rainy week', () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(makeDayForecast(i, 12, 14, 10, 'Rain', 5));
        }
        const insights = ai.generateCityPrediction('Test', days);
        const hasRain = insights.some(i => i.includes('D\u00E9\u0161\u0165') || i.includes('de\u0161tn\u00EDk'));
        expect(hasRain).toBeTruthy();
    });

    it('includes weekly summary', () => {
        const days = [];
        for (let i = 0; i < 4; i++) {
            days.push(makeDayForecast(i, 15, 18, 12));
        }
        const insights = ai.generateCityPrediction('Test', days);
        const hasSummary = insights.some(i => i.includes('T\u00FDdenn\u00ED souhrn'));
        expect(hasSummary).toBeTruthy();
    });

    it('detects good air quality', () => {
        const days = [makeDayForecast(0, 20, 23, 17), makeDayForecast(1, 21, 24, 18)];
        const airPollution = { list: [{ main: { aqi: 1 }, components: { pm2_5: 3 } }] };
        const insights = ai.generateCityPrediction('Test', days, airPollution);
        const hasAir = insights.some(i => i.includes('V\u00FDborn\u00E1') || i.includes('kvalit'));
        expect(hasAir).toBeTruthy();
    });

    it('detects bad air quality', () => {
        const days = [makeDayForecast(0, 20, 23, 17), makeDayForecast(1, 21, 24, 18)];
        const airPollution = { list: [{ main: { aqi: 4 }, components: { pm2_5: 60 } }] };
        const insights = ai.generateCityPrediction('Test', days, airPollution);
        const hasAir = insights.some(i => i.includes('\u0160patn\u00E1') || i.includes('omezte'));
        expect(hasAir).toBeTruthy();
    });
});

// ── StateManager robustness (audit fix) ──────────────────────
describe('StateManager: Robustness', () => {
    it('updateStats handles malformed city (missing main)', () => {
        const sm = new StateManager();
        sm.state.cities.set('bad', { id: 'bad', weather: [{ main: 'Clear' }] });
        sm.state.cities.set('good', { id: 'good', main: { temp: 20 }, weather: [{ main: 'Clear' }] });
        sm.updateStats();
        expect(sm.state.stats.total).toBe(2);
        expect(sm.state.stats.avgTemp).toBe(20);
    });

    it('updateStats handles malformed city (missing weather)', () => {
        const sm = new StateManager();
        sm.state.cities.set('bad', { id: 'bad', main: { temp: 10 } });
        sm.state.cities.set('good', { id: 'good', main: { temp: 20 }, weather: [{ main: 'Clouds' }] });
        sm.updateStats();
        expect(sm.state.stats.avgTemp).toBe(20);
        expect(sm.state.stats.sunnyCount).toBe(0);
    });

    it('updateStats handles all malformed cities', () => {
        const sm = new StateManager();
        sm.state.cities.set('bad1', { id: 'bad1' });
        sm.state.cities.set('bad2', { id: 'bad2', main: null });
        sm.updateStats();
        expect(sm.state.stats.total).toBe(2);
        expect(sm.state.stats.avgTemp).toBe(0);
    });

    it('updateStats handles empty temp (null)', () => {
        const sm = new StateManager();
        sm.state.cities.set('noTemp', { id: 'noTemp', main: { temp: null }, weather: [{ main: 'Clear' }] });
        sm.updateStats();
        expect(sm.state.stats.avgTemp).toBe(0);
    });
});

// ── Dead code removal verification ───────────────────────────
describe('Dead Code Removal', () => {
    it('animateCardEntrance is removed', () => {
        expect(typeof window.animateCardEntrance).toBe('undefined');
    });

    it('shareWeather is removed', () => {
        expect(typeof window.shareWeather).toBe('undefined');
    });

    it('PerformanceMonitor is removed', () => {
        expect(typeof window.PerformanceMonitor).toBe('undefined');
    });

    it('vibrate utility is defined in app.js (not loaded here)', () => {
        // vibrate() is in app.js which is not loaded in unit test runner
        // This test verifies it's NOT in the pure-logic modules (correct separation)
        expect(typeof window.vibrate).toBe('undefined');
    });
});

// ── Security: XSS Prevention ──────────────────────────────────
describe('Security: XSS Prevention', () => {
    it('escapeHTML neutralizes script injection', () => {
        const malicious = '<img src=x onerror=alert(1)>';
        const escaped = WeatherHelpers.escapeHTML(malicious);
        expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt;');
        expect(escaped.includes('<')).toBeFalsy();
    });

    it('escapeHTML neutralizes attribute injection', () => {
        const malicious = '" onmouseover="alert(1)" data-x="';
        const escaped = WeatherHelpers.escapeHTML(malicious);
        expect(escaped.includes('"')).toBeFalsy();
    });

    it('escapeHTML handles Unicode safely', () => {
        const czech = 'Nov\u00E1 slo\u017Eka/Po\u010Das\u00ED';
        expect(WeatherHelpers.escapeHTML(czech)).toBe(czech);
    });

    it('escapeHTML handles emoji safely', () => {
        const emoji = '\uD83C\uDF24\uFE0F Praha \u2600\uFE0F';
        expect(WeatherHelpers.escapeHTML(emoji)).toBe(emoji);
    });
});

// ── Run ───────────────────────────────────────────────────────
renderResults();

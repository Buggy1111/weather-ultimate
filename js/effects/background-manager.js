/**
 * Background Manager — Dynamic background based on weather + time of day
 * Changes universe-bg gradient, orb colors based on dominant weather conditions
 */

class BackgroundManager {
    constructor() {
        this.universeBg = document.querySelector('.universe-bg');
        this.orbs = document.querySelectorAll('.orb');
        this.currentWeather = 'clear';
        this.currentPhase = 'night';
        this.TWILIGHT_SEC = 1800;
    }

    /**
     * Main update — call with array of city data objects
     */
    update(cities) {
        if (!cities || cities.length === 0) return;

        const weather = this.getDominantWeather(cities);
        const phase = this.getDominantPhase(cities);

        // Skip if nothing changed
        if (weather === this.currentWeather && phase === this.currentPhase) return;

        this.currentWeather = weather;
        this.currentPhase = phase;

        const config = this.getBackgroundConfig(weather, phase);
        this.applyBackground(config);

        console.log(`🎨 Background: ${weather} × ${phase}`);
    }

    /**
     * Find the most common weather type across all cities
     */
    getDominantWeather(cities) {
        if (!cities || cities.length === 0) return 'clear';

        const counts = {};
        cities.forEach(city => {
            const w = city.weather?.[0]?.main?.toLowerCase() || 'clear';
            counts[w] = (counts[w] || 0) + 1;
        });

        let max = 0, dominant = 'clear';
        for (const [type, count] of Object.entries(counts)) {
            if (count > max) { max = count; dominant = type; }
        }
        return dominant;
    }

    /**
     * Find the most common day phase across all cities
     */
    getDominantPhase(cities) {
        if (!cities || cities.length === 0) return 'night';

        const nowUtc = Math.floor(Date.now() / 1000);
        const counts = { day: 0, night: 0, dawn: 0, twilight: 0 };

        cities.forEach(city => {
            if (!city.sys?.sunrise || !city.sys?.sunset) {
                counts.night++;
                return;
            }
            const sunrise = city.sys.sunrise;
            const sunset = city.sys.sunset;

            if (nowUtc >= sunrise && nowUtc < sunset) {
                counts.day++;
            } else if (nowUtc >= (sunrise - this.TWILIGHT_SEC) && nowUtc < sunrise) {
                counts.dawn++;
            } else if (nowUtc >= sunset && nowUtc < (sunset + this.TWILIGHT_SEC)) {
                counts.twilight++;
            } else {
                counts.night++;
            }
        });

        let max = 0, dominant = 'night';
        for (const [phase, count] of Object.entries(counts)) {
            if (count > max) { max = count; dominant = phase; }
        }
        return dominant;
    }

    /**
     * Get background configuration for weather × phase combo
     */
    getBackgroundConfig(weather, phase) {
        const gradients = this._getGradients();
        const orbSets = this._getOrbColors();

        // Normalize unknown values
        const w = gradients[weather] ? weather : 'clear';
        const p = gradients[w]?.[phase] ? phase : 'night';

        return {
            gradient: gradients[w][p],
            orbColors: orbSets[w]?.[p] || orbSets.clear.night
        };
    }

    /**
     * Apply background config to DOM
     */
    applyBackground(config) {
        if (this.universeBg) {
            this.universeBg.style.background = config.gradient;
        }

        if (this.orbs.length >= 3) {
            this.orbs[0].style.background = config.orbColors[0];
            this.orbs[1].style.background = config.orbColors[1];
            this.orbs[2].style.background = config.orbColors[2];
        }
    }

    // ── Gradient definitions ─────────────────────────────────────

    _getGradients() {
        return {
            clear: {
                day: `radial-gradient(ellipse at 30% 20%, #1a3a5c 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, #2a4a6c 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, #0d2137 0%, transparent 100%),
                      linear-gradient(180deg, #0a1628 0%, #1a3050 50%, #0d1f33 100%)`,
                night: `radial-gradient(ellipse at 20% 30%, #0a0a2e 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, #0e1538 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, #050510 0%, transparent 100%),
                        linear-gradient(180deg, #000008 0%, #0a0a2e 50%, #000010 100%)`,
                dawn: `radial-gradient(ellipse at 50% 80%, #4a2030 0%, transparent 50%),
                       radial-gradient(ellipse at 30% 40%, #2a1a3a 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 30%, #3a2040 0%, transparent 100%),
                       linear-gradient(180deg, #1a0a20 0%, #3a1a30 50%, #4a2535 100%)`,
                twilight: `radial-gradient(ellipse at 40% 60%, #2a1540 0%, transparent 50%),
                           radial-gradient(ellipse at 70% 30%, #1a1a4a 0%, transparent 50%),
                           radial-gradient(ellipse at 30% 80%, #301845 0%, transparent 100%),
                           linear-gradient(180deg, #0f0a25 0%, #2a1540 50%, #1a0f30 100%)`
            },
            clouds: {
                day: `radial-gradient(ellipse at 30% 30%, #2a3040 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 70%, #1f2a3a 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, #151c28 0%, transparent 100%),
                      linear-gradient(180deg, #101820 0%, #1a2535 50%, #0f161f 100%)`,
                night: `radial-gradient(ellipse at 20% 30%, #0a0f1e 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, #0e1320 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, #060a14 0%, transparent 100%),
                        linear-gradient(180deg, #030610 0%, #0a0f1e 50%, #050a15 100%)`,
                dawn: `radial-gradient(ellipse at 50% 70%, #3a2530 0%, transparent 50%),
                       radial-gradient(ellipse at 30% 30%, #2a2035 0%, transparent 50%),
                       linear-gradient(180deg, #15101a 0%, #2a1a28 50%, #352025 100%)`,
                twilight: `radial-gradient(ellipse at 40% 50%, #201530 0%, transparent 50%),
                           radial-gradient(ellipse at 70% 40%, #18182e 0%, transparent 50%),
                           linear-gradient(180deg, #0d0a1a 0%, #1a1530 50%, #120e22 100%)`
            },
            rain: {
                day: `radial-gradient(ellipse at 30% 40%, #1a2a3a 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 60%, #152535 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, #0d1a28 0%, transparent 100%),
                      linear-gradient(180deg, #0a1520 0%, #152535 50%, #0d1820 100%)`,
                night: `radial-gradient(ellipse at 20% 40%, #080e1a 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 60%, #0a1220 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, #050a12 0%, transparent 100%),
                        linear-gradient(180deg, #020610 0%, #0a1020 50%, #040812 100%)`,
                dawn: `radial-gradient(ellipse at 50% 70%, #2a2030 0%, transparent 50%),
                       radial-gradient(ellipse at 30% 30%, #1a1a2a 0%, transparent 50%),
                       linear-gradient(180deg, #0f0a18 0%, #1a1520 50%, #201520 100%)`,
                twilight: `radial-gradient(ellipse at 40% 50%, #151020 0%, transparent 50%),
                           radial-gradient(ellipse at 60% 40%, #101525 0%, transparent 50%),
                           linear-gradient(180deg, #080510 0%, #121025 50%, #0a0815 100%)`
            },
            drizzle: {
                day: `radial-gradient(ellipse at 30% 40%, #1e2d40 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 60%, #1a283a 0%, transparent 50%),
                      linear-gradient(180deg, #0c1520 0%, #1a2838 50%, #0e1822 100%)`,
                night: `radial-gradient(ellipse at 20% 40%, #0a1020 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 60%, #0c1425 0%, transparent 50%),
                        linear-gradient(180deg, #030815 0%, #0a1020 50%, #050a15 100%)`,
                dawn: `radial-gradient(ellipse at 50% 70%, #2a2035 0%, transparent 50%),
                       radial-gradient(ellipse at 30% 30%, #1c1a30 0%, transparent 50%),
                       linear-gradient(180deg, #100a1a 0%, #1c1525 50%, #221520 100%)`,
                twilight: `radial-gradient(ellipse at 40% 50%, #181028 0%, transparent 50%),
                           radial-gradient(ellipse at 60% 40%, #12152a 0%, transparent 50%),
                           linear-gradient(180deg, #0a0815 0%, #141028 50%, #0c0a18 100%)`
            },
            thunderstorm: {
                day: `radial-gradient(ellipse at 30% 30%, #1a1530 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 70%, #151028 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, #0a0818 0%, transparent 100%),
                      linear-gradient(180deg, #080515 0%, #15102a 50%, #0a0815 100%)`,
                night: `radial-gradient(ellipse at 20% 30%, #08051a 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, #0a0820 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, #030310 0%, transparent 100%),
                        linear-gradient(180deg, #010108 0%, #08051a 50%, #030310 100%)`,
                dawn: `radial-gradient(ellipse at 50% 70%, #301825 0%, transparent 50%),
                       radial-gradient(ellipse at 30% 30%, #1a1028 0%, transparent 50%),
                       linear-gradient(180deg, #0a0515 0%, #201020 50%, #2a1520 100%)`,
                twilight: `radial-gradient(ellipse at 40% 50%, #1a0a28 0%, transparent 50%),
                           radial-gradient(ellipse at 60% 40%, #150a22 0%, transparent 50%),
                           linear-gradient(180deg, #080510 0%, #1a0a28 50%, #0a0515 100%)`
            },
            snow: {
                day: `radial-gradient(ellipse at 30% 20%, #2a3545 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, #253048 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, #1a2535 0%, transparent 100%),
                      linear-gradient(180deg, #121c2a 0%, #1e2a3c 50%, #152030 100%)`,
                night: `radial-gradient(ellipse at 20% 30%, #0c1020 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, #0e1525 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, #080c18 0%, transparent 100%),
                        linear-gradient(180deg, #040810 0%, #0c1220 50%, #060a15 100%)`,
                dawn: `radial-gradient(ellipse at 50% 70%, #302535 0%, transparent 50%),
                       radial-gradient(ellipse at 30% 30%, #252035 0%, transparent 50%),
                       linear-gradient(180deg, #12101a 0%, #201a28 50%, #2a2030 100%)`,
                twilight: `radial-gradient(ellipse at 40% 50%, #1a1530 0%, transparent 50%),
                           radial-gradient(ellipse at 60% 40%, #151832 0%, transparent 50%),
                           linear-gradient(180deg, #0a0a18 0%, #151530 50%, #0e0c1a 100%)`
            },
            mist: {
                day: `radial-gradient(ellipse at 30% 30%, #222830 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 70%, #1e2530 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, #161c25 0%, transparent 100%),
                      linear-gradient(180deg, #10151c 0%, #1a2028 50%, #121820 100%)`,
                night: `radial-gradient(ellipse at 20% 30%, #0a0e15 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, #0c1018 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, #060a10 0%, transparent 100%),
                        linear-gradient(180deg, #04060c 0%, #0a0e18 50%, #060810 100%)`,
                dawn: `radial-gradient(ellipse at 50% 70%, #2a2028 0%, transparent 50%),
                       radial-gradient(ellipse at 30% 30%, #201a25 0%, transparent 50%),
                       linear-gradient(180deg, #100c14 0%, #1a1520 50%, #221a22 100%)`,
                twilight: `radial-gradient(ellipse at 40% 50%, #181420 0%, transparent 50%),
                           radial-gradient(ellipse at 60% 40%, #141525 0%, transparent 50%),
                           linear-gradient(180deg, #0a0a12 0%, #141420 50%, #0c0a15 100%)`
            }
        };
    }

    _getOrbColors() {
        return {
            clear: {
                day: [
                    'linear-gradient(135deg, #4a8ed4, #2a6ab0)',
                    'linear-gradient(135deg, #e8a040, #c07830)',
                    'linear-gradient(135deg, #4ac0e8, #2a90b8)'
                ],
                night: [
                    'linear-gradient(135deg, #3040a0, #1a2070)',
                    'linear-gradient(135deg, #6040b0, #4020a0)',
                    'linear-gradient(135deg, #2050c0, #1030a0)'
                ],
                dawn: [
                    'linear-gradient(135deg, #d06040, #a04030)',
                    'linear-gradient(135deg, #e08050, #c06040)',
                    'linear-gradient(135deg, #c04080, #a03060)'
                ],
                twilight: [
                    'linear-gradient(135deg, #6030a0, #4020b0)',
                    'linear-gradient(135deg, #a04080, #803070)',
                    'linear-gradient(135deg, #5040c0, #3030a0)'
                ]
            },
            clouds: {
                day: [
                    'linear-gradient(135deg, #506070, #384858)',
                    'linear-gradient(135deg, #607080, #485868)',
                    'linear-gradient(135deg, #455868, #354858)'
                ],
                night: [
                    'linear-gradient(135deg, #202838, #151c28)',
                    'linear-gradient(135deg, #283040, #1c2430)',
                    'linear-gradient(135deg, #1c2838, #101c28)'
                ],
                dawn: [
                    'linear-gradient(135deg, #805040, #604030)',
                    'linear-gradient(135deg, #705848, #505040)',
                    'linear-gradient(135deg, #904840, #704035)'
                ],
                twilight: [
                    'linear-gradient(135deg, #403058, #302048)',
                    'linear-gradient(135deg, #504068, #383058)',
                    'linear-gradient(135deg, #352850, #252040)'
                ]
            },
            rain: {
                day: [
                    'linear-gradient(135deg, #3060a0, #204880)',
                    'linear-gradient(135deg, #285898, #1c4078)',
                    'linear-gradient(135deg, #2550a0, #183878)'
                ],
                night: [
                    'linear-gradient(135deg, #182848, #0c1830)',
                    'linear-gradient(135deg, #1c3050, #102038)',
                    'linear-gradient(135deg, #152540, #0a1828)'
                ],
                dawn: [
                    'linear-gradient(135deg, #604050, #483040)',
                    'linear-gradient(135deg, #504860, #384050)',
                    'linear-gradient(135deg, #583848, #403038)'
                ],
                twilight: [
                    'linear-gradient(135deg, #302050, #201540)',
                    'linear-gradient(135deg, #282858, #1c1c48)',
                    'linear-gradient(135deg, #251848, #181038)'
                ]
            },
            drizzle: {
                day: [
                    'linear-gradient(135deg, #3868a8, #285090)',
                    'linear-gradient(135deg, #3060a0, #204880)',
                    'linear-gradient(135deg, #2858a0, #1c4080)'
                ],
                night: [
                    'linear-gradient(135deg, #1c2c48, #101c35)',
                    'linear-gradient(135deg, #203450, #14243c)',
                    'linear-gradient(135deg, #182840, #0c1a30)'
                ],
                dawn: [
                    'linear-gradient(135deg, #654858, #503848)',
                    'linear-gradient(135deg, #585060, #404050)',
                    'linear-gradient(135deg, #604050, #483040)'
                ],
                twilight: [
                    'linear-gradient(135deg, #352858, #251c48)',
                    'linear-gradient(135deg, #302c5c, #20204c)',
                    'linear-gradient(135deg, #2c2050, #1c1840)'
                ]
            },
            thunderstorm: {
                day: [
                    'linear-gradient(135deg, #4020a0, #280880)',
                    'linear-gradient(135deg, #6018a0, #400880)',
                    'linear-gradient(135deg, #3018c0, #1808a0)'
                ],
                night: [
                    'linear-gradient(135deg, #180840, #0c0428)',
                    'linear-gradient(135deg, #200a50, #100530)',
                    'linear-gradient(135deg, #140638, #080420)'
                ],
                dawn: [
                    'linear-gradient(135deg, #602040, #401030)',
                    'linear-gradient(135deg, #501848, #381038)',
                    'linear-gradient(135deg, #582838, #402028)'
                ],
                twilight: [
                    'linear-gradient(135deg, #350a58, #200540)',
                    'linear-gradient(135deg, #2a0a60, #180548)',
                    'linear-gradient(135deg, #300850, #1c0438)'
                ]
            },
            snow: {
                day: [
                    'linear-gradient(135deg, #5878a8, #406090)',
                    'linear-gradient(135deg, #6888b8, #507098)',
                    'linear-gradient(135deg, #4870a0, #385888)'
                ],
                night: [
                    'linear-gradient(135deg, #1c2840, #101c30)',
                    'linear-gradient(135deg, #223050, #182438)',
                    'linear-gradient(135deg, #1a2540, #0e1a30)'
                ],
                dawn: [
                    'linear-gradient(135deg, #785060, #604050)',
                    'linear-gradient(135deg, #6a5868, #525058)',
                    'linear-gradient(135deg, #704858, #584048)'
                ],
                twilight: [
                    'linear-gradient(135deg, #3a2858, #2a1c48)',
                    'linear-gradient(135deg, #443068, #322058)',
                    'linear-gradient(135deg, #342450, #241840)'
                ]
            },
            mist: {
                day: [
                    'linear-gradient(135deg, #485060, #384050)',
                    'linear-gradient(135deg, #505868, #404858)',
                    'linear-gradient(135deg, #424a58, #323c4c)'
                ],
                night: [
                    'linear-gradient(135deg, #181c28, #0e1218)',
                    'linear-gradient(135deg, #1c2030, #121820)',
                    'linear-gradient(135deg, #161a25, #0c1018)'
                ],
                dawn: [
                    'linear-gradient(135deg, #604848, #483838)',
                    'linear-gradient(135deg, #585050, #404040)',
                    'linear-gradient(135deg, #504040, #383030)'
                ],
                twilight: [
                    'linear-gradient(135deg, #302838, #201c2c)',
                    'linear-gradient(135deg, #383040, #282430)',
                    'linear-gradient(135deg, #282430, #1c1824)'
                ]
            }
        };
    }
}

// Auto-initialize
console.log('🎨 Background Manager loaded');

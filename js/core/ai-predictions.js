/**
 * AI Predictions Engine — weather analysis & insights
 */

class AIPredictions {
    constructor() {
        this.insightIndex = 0;
        this.lastInsights = [];
    }

    generatePrediction(weatherData) {
        const insights = this.analyzeWeather(weatherData);
        if (insights.length === 0) return 'Analyzuji dostupná data...';

        if (this.insightIndex >= insights.length) this.insightIndex = 0;
        const insight = insights[this.insightIndex];
        this.insightIndex++;
        this.lastInsights = insights;
        return insight;
    }

    analyzeWeather(data) {
        if (!data || data.length === 0) return [];

        const n = data.length;
        const temps = data.map(d => d.main.temp);
        const feelsLike = data.map(d => d.main.feels_like);
        const pressures = data.map(d => d.main.pressure);
        const humidities = data.map(d => d.main.humidity);
        const winds = data.map(d => (d.wind.speed * 3.6));
        const gusts = data.filter(d => d.wind.gust).map(d => d.wind.gust * 3.6);
        const clouds = data.map(d => d.clouds.all);
        const visibilities = data.map(d => (d.visibility || 10000));
        const conditions = data.map(d => d.weather[0].main);

        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const mn = arr => Math.min(...arr);
        const mx = arr => Math.max(...arr);
        const r = v => Math.round(v);

        const avgTemp = avg(temps);
        const avgPressure = avg(pressures);
        const avgHumidity = avg(humidities);
        const avgWind = avg(winds);
        const tempSpread = mx(temps) - mn(temps);
        const feelsLikeDiff = avgTemp - avg(feelsLike);

        const cc = {};
        conditions.forEach(c => cc[c] = (cc[c] || 0) + 1);
        const rainCount = (cc['Rain'] || 0) + (cc['Drizzle'] || 0);
        const snowCount = cc['Snow'] || 0;
        const clearCount = cc['Clear'] || 0;
        const stormCount = cc['Thunderstorm'] || 0;
        const cloudCount = cc['Clouds'] || 0;

        const alerts = [];
        const warnings = [];
        const analyses = [];

        // === ALERTS ===
        if (mn(temps) < -15) {
            alerts.push(`⚠️ Extrémní mráz ${r(mn(temps))}°C — riziko omrzlin a hypotermie. Omezte pobyt venku na minimum.`);
        } else if (mn(temps) < -10) {
            alerts.push(`⚠️ Silný mráz ${r(mn(temps))}°C detekován. Riziko námrazy na vozovkách a potrubí.`);
        }
        if (mx(temps) > 38) {
            alerts.push(`🔥 Extrémní vedro ${r(mx(temps))}°C — tepelný stres je reálné riziko. Pijte min. 3l tekutin denně.`);
        } else if (mx(temps) > 33) {
            alerts.push(`🔥 Vysoké teploty až ${r(mx(temps))}°C. Vyhněte se přímému slunci mezi 11–16h.`);
        }
        if (stormCount > 0) {
            alerts.push(`⛈️ Bouřková aktivita v ${stormCount} z ${n} měst! Vyhněte se otevřeným prostranstvím.`);
        }
        if (mx(gusts) > 80) {
            alerts.push(`💨 Extrémní nárazy větru až ${r(mx(gusts))} km/h — riziko pádu stromů a poškození objektů.`);
        }

        // === WARNINGS ===
        if (avgTemp > -2 && avgTemp < 2 && avgHumidity > 75 && rainCount > 0) {
            warnings.push(`🧊 Teploty kolem bodu mrazu (${r(avgTemp)}°C) se srážkami — vysoké riziko ledovky a náledí!`);
        }
        if (avgHumidity > 90 && avgTemp < 5 && avgWind < 10) {
            warnings.push(`🌫️ Vlhkost ${r(avgHumidity)}% při ${r(avgTemp)}°C a slabém větru — podmínky pro husté mlhy.`);
        }
        if (snowCount > 0 && avgWind > 25) {
            warnings.push(`🌨️ Sněžení s větrem ${r(avgWind)} km/h — možná tvorba sněhových jazyků a závějí.`);
        }
        if (mn(visibilities) < 1000) {
            warnings.push(`👁️ Viditelnost pod 1 km — zvýšená opatrnost v dopravě, rozsvěťte mlhovky.`);
        }

        // === ANALYSES ===
        if (avgPressure < 1000) {
            analyses.push(`🌀 Hluboká tlaková níže (${r(avgPressure)} hPa) — aktivní cyklonální činnost přináší nestabilní počasí a srážky.`);
        } else if (avgPressure > 1025) {
            analyses.push(`📈 Silná tlaková výše ${r(avgPressure)} hPa — anticyklóna přináší stabilní, jasné počasí s minimem srážek.`);
        } else if (avgPressure < 1010) {
            analyses.push(`📉 Snížený tlak ${r(avgPressure)} hPa naznačuje příchod frontálního systému — možné zhoršení během 12–24h.`);
        } else {
            analyses.push(`📊 Tlak ${r(avgPressure)} hPa je v normálu — bez výrazných synoptických změn.`);
        }

        if (tempSpread > 25) {
            analyses.push(`🌡️ Obrovský teplotní kontrast ${r(tempSpread)}°C (od ${r(mn(temps))}°C do ${r(mx(temps))}°C) — různé vzduchové hmoty ovlivňují regiony.`);
        } else if (tempSpread > 15) {
            analyses.push(`🌡️ Výrazný teplotní gradient ${r(tempSpread)}°C mezi městy ukazuje na rozhraní vzduchových hmot.`);
        } else if (tempSpread > 8) {
            analyses.push(`📊 Teplotní rozpětí ${r(tempSpread)}°C (${r(mn(temps))}°C – ${r(mx(temps))}°C) odpovídá regionálním rozdílům.`);
        }

        if (feelsLikeDiff > 6) {
            analyses.push(`🥶 Vítr a vlhkost snižují pocitovou teplotu v průměru o ${r(feelsLikeDiff)}°C — skutečný pocit: ${r(avg(feelsLike))}°C.`);
        } else if (feelsLikeDiff > 3) {
            analyses.push(`🌬️ Pocitová teplota o ${r(feelsLikeDiff)}°C nižší než naměřená kvůli proudění vzduchu.`);
        } else if (feelsLikeDiff < -2) {
            analyses.push(`🌡️ Vlhkost zesiluje tepelný diskomfort — pocitově o ${r(Math.abs(feelsLikeDiff))}°C tepleji než ukazuje teploměr.`);
        }

        if (avgWind > 40) {
            analyses.push(`💨 Silný vítr průměrně ${r(avgWind)} km/h — komplikace v dopravě, riziko pádů větví.`);
        } else if (avgWind > 25) {
            analyses.push(`🌬️ Zvýšená větrnost ${r(avgWind)} km/h — počítejte s ochlazeným pocitem a rozvlněnými vlajkami.`);
        }

        if (rainCount > n * 0.6) {
            analyses.push(`🌧️ Srážky dominují — déšť v ${rainCount} z ${n} měst. Frontální systém je aktivní.`);
        }
        if (snowCount > n * 0.3) {
            analyses.push(`❄️ Sněžení zasahuje ${snowCount} z ${n} měst — zimní podmínky na silnicích.`);
        }
        if (clearCount === n && n > 1) {
            analyses.push(`☀️ Jasno ve všech ${n} městech — anticyklóna zajišťuje stabilní slunečné počasí.`);
        } else if (clearCount > n * 0.6) {
            analyses.push(`☀️ Převážně jasno v ${clearCount} z ${n} měst — příznivé podmínky pro venkovní aktivity.`);
        }
        if (cloudCount > n * 0.7 && rainCount === 0) {
            analyses.push(`☁️ Oblačno v ${cloudCount} z ${n} měst, ale bez srážek — oblačnost brání prohřátí.`);
        }

        if (avgHumidity > 85 && avgTemp > 20) {
            analyses.push(`💧 Vysoká vlhkost ${r(avgHumidity)}% při ${r(avgTemp)}°C — dusné, tropické podmínky.`);
        } else if (avgHumidity < 30) {
            analyses.push(`🏜️ Velmi nízká vlhkost ${r(avgHumidity)}% — vysušený vzduch, zvyšte příjem tekutin.`);
        }

        const avgClouds = avg(clouds);
        if (avgClouds > 90) {
            analyses.push(`☁️ Souvislá oblačnost (${r(avgClouds)}%) — minimální sluneční svit, UV index nízký.`);
        }

        const month = new Date().getMonth();
        if ((month >= 11 || month <= 1) && avgTemp > 10) {
            analyses.push(`📈 Výrazně nadprůměrné zimní teploty (${r(avgTemp)}°C) — teplý vzduch od jihozápadu.`);
        } else if ((month >= 5 && month <= 7) && avgTemp < 15) {
            analyses.push(`📉 Podprůměrně chladné léto ${r(avgTemp)}°C — studený vzduch ze severu.`);
        }

        if (analyses.length === 0) {
            const mainCond = Object.entries(cc).sort((a, b) => b[1] - a[1])[0];
            const condName = { Clear: 'jasno', Clouds: 'oblačno', Rain: 'déšť', Snow: 'sněžení', Drizzle: 'mrholení', Thunderstorm: 'bouřky', Mist: 'mlha', Fog: 'mlha', Haze: 'opar' }[mainCond[0]] || mainCond[0];
            analyses.push(`📊 Průměr ${r(avgTemp)}°C, ${condName} v ${mainCond[1]}/${n} městech, tlak ${r(avgPressure)} hPa, vlhkost ${r(avgHumidity)}%.`);
        }

        return [...alerts, ...warnings, ...analyses];
    }

    generateCityPrediction(cityName, dailyForecasts, airPollution = null) {
        if (!dailyForecasts || dailyForecasts.length < 2) return [];

        const insights = [];
        const r = v => Math.round(v);
        const days = dailyForecasts;
        const n = days.length;
        const dayNames = d => d.date.toLocaleDateString('cs-CZ', { weekday: 'long' });

        // Temperature trend
        const firstHalf = days.slice(0, Math.ceil(n / 2));
        const secondHalf = days.slice(Math.ceil(n / 2));
        const avgFirst = firstHalf.reduce((s, d) => s + d.avgTemp, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, d) => s + d.avgTemp, 0) / secondHalf.length;
        const tempDiff = avgSecond - avgFirst;

        if (tempDiff > 5) {
            insights.push(`📈 Výrazné oteplování: z průměru ${r(avgFirst)}°C na ${r(avgSecond)}°C — nárůst o ${r(tempDiff)}°C během týdne.`);
        } else if (tempDiff > 2) {
            insights.push(`📈 Postupné oteplování o ${r(tempDiff)}°C — ke konci týdne příjemnější teploty.`);
        } else if (tempDiff < -5) {
            insights.push(`📉 Výrazné ochlazení: z ${r(avgFirst)}°C na ${r(avgSecond)}°C — pokles o ${r(Math.abs(tempDiff))}°C.`);
        } else if (tempDiff < -2) {
            insights.push(`📉 Postupné ochlazování o ${r(Math.abs(tempDiff))}°C — ke konci týdne chladněji.`);
        } else {
            insights.push(`🌡️ Stabilní teploty kolem ${r((avgFirst + avgSecond) / 2)}°C — bez výraznějších výkyvů.`);
        }

        // Extremes
        const warmest = days.reduce((a, b) => a.maxTemp > b.maxTemp ? a : b);
        const coldest = days.reduce((a, b) => a.minTemp < b.minTemp ? a : b);
        if (warmest.maxTemp - coldest.minTemp > 10) {
            insights.push(`🔥 Nejteplejší den: ${dayNames(warmest)} (${warmest.maxTemp}°C) | 🥶 Nejchladnější: ${dayNames(coldest)} (${coldest.minTemp}°C).`);
        }

        // Precipitation
        const rainyDays = days.filter(d => d.rainTotal > 0 || d.maxPop > 60);
        const snowyDays = days.filter(d => d.snowTotal > 0);
        const totalRain = days.reduce((s, d) => s + d.rainTotal, 0);
        const totalSnow = days.reduce((s, d) => s + d.snowTotal, 0);

        if (rainyDays.length === 0 && snowyDays.length === 0) {
            insights.push(`☀️ Suchý týden — žádné srážky v předpovědi. Ideální pro venkovní aktivity.`);
        } else if (rainyDays.length >= n - 1) {
            insights.push(`🌧️ Déšť téměř celý týden (${rainyDays.length}/${n} dní, celkem ${r(totalRain)} mm). Nezapomeňte deštník!`);
        } else if (rainyDays.length > 0) {
            const rainDayNames = rainyDays.slice(0, 3).map(d => dayNames(d)).join(', ');
            insights.push(`🌧️ Déšť očekáván: ${rainDayNames} (celkem ${r(totalRain)} mm za ${rainyDays.length} dní).`);
        }
        if (totalSnow > 0) {
            const snowDayNames = snowyDays.slice(0, 3).map(d => dayNames(d)).join(', ');
            insights.push(`❄️ Sněžení: ${snowDayNames} — celkem ${r(totalSnow)} cm nového sněhu.`);
        }

        // Wind
        const windiest = days.reduce((a, b) => a.avgWind > b.avgWind ? a : b);
        const maxGustAll = Math.max(...days.map(d => d.maxGust));
        if (maxGustAll > 60) {
            insights.push(`💨 Silný vítr — nárazy až ${r(maxGustAll)} km/h (${dayNames(windiest)}). Pozor na komplikace v dopravě.`);
        } else if (windiest.avgWind > 30) {
            insights.push(`🌬️ Největrnější den: ${dayNames(windiest)} (${windiest.avgWind} km/h, nárazy ${windiest.maxGust} km/h).`);
        }

        // Pressure trend
        const pressures = days.filter(d => d.avgPressure).map(d => d.avgPressure);
        if (pressures.length >= 3) {
            const pFirst = pressures.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
            const pLast = pressures.slice(-2).reduce((a, b) => a + b, 0) / 2;
            const pDiff = pLast - pFirst;
            if (pDiff < -5) {
                insights.push(`📉 Klesající tlak (${r(pFirst)} → ${r(pLast)} hPa) — příchod frontálního systému, zhoršení počasí.`);
            } else if (pDiff > 5) {
                insights.push(`📈 Rostoucí tlak (${r(pFirst)} → ${r(pLast)} hPa) — tlaková výše přinese stabilní počasí.`);
            }
        }

        // Weekend forecast
        const weekend = days.filter(d => {
            const dow = d.date.getDay();
            return dow === 0 || dow === 6;
        });
        if (weekend.length > 0) {
            const wkRain = weekend.some(d => d.rainTotal > 0 || d.maxPop > 60);
            const wkAvg = r(weekend.reduce((s, d) => s + d.avgTemp, 0) / weekend.length);
            const wkCond = wkRain ? 'se srážkami' : 'bez srážek';
            insights.push(`📅 Víkend: průměr ${wkAvg}°C, ${wkCond}. ${wkRain ? 'Plánujte indoor aktivity.' : 'Vhodné pro výlety!'}`);
        }

        // Today vs tomorrow
        if (days.length >= 2) {
            const today = days[0];
            const tomorrow = days[1];
            const tDiff = tomorrow.maxTemp - today.maxTemp;
            if (Math.abs(tDiff) >= 3) {
                const dir = tDiff > 0 ? 'tepleji' : 'chladněji';
                insights.push(`🔄 Zítra (${dayNames(tomorrow)}) bude o ${r(Math.abs(tDiff))}°C ${dir} než dnes (${today.maxTemp}°C → ${tomorrow.maxTemp}°C).`);
            }
        }

        // Humidity & fog risk
        const humidDays = days.filter(d => d.avgHumidity > 85 && d.minTemp < 5);
        if (humidDays.length > 0) {
            insights.push(`🌫️ Riziko mlh: ${humidDays.map(d => dayNames(d)).slice(0, 3).join(', ')} (vlhkost >85% + nízké teploty).`);
        }

        // Air quality
        if (airPollution?.list?.[0]) {
            const aqi = airPollution.list[0].main.aqi;
            const c = airPollution.list[0].components;
            if (aqi >= 4) {
                insights.push(`⚠️ Špatná kvalita vzduchu (AQI ${aqi}/5) — omezte venkovní sport, zvažte respirátor.`);
            } else if (aqi <= 1 && c.pm2_5 < 10) {
                insights.push(`🌿 Výborná kvalita vzduchu (PM2.5: ${r(c.pm2_5)} µg/m³) — ideální pro běh a outdoor aktivity.`);
            }
        }

        // Overall summary
        const avgWeekTemp = r(days.reduce((s, d) => s + d.avgTemp, 0) / n);
        const dryDays = n - rainyDays.length - snowyDays.length;
        insights.push(`📊 Týdenní souhrn: průměr ${avgWeekTemp}°C, ${dryDays} suchých dní, ${rainyDays.length + snowyDays.length} se srážkami.`);

        return insights;
    }
}

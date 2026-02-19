# Weather Ultimate

Next-gen weather experience s AI predikcemi, real-time 3D vizualizacemi a pohlcujícimi zvukovymi efekty. Vanilla JS, zero dependencies (kromě Three.js).

**[Live Demo](https://buggy1111.github.io/weather-ultimate/)**

## Funkce

### Hlavni
- **Real-time data** — aktualizace každych 60s, IndexedDB cache
- **100% OpenWeatherMap API** — current weather, 5-day forecast, air pollution
- **AI predikce** — chytra lokalni analyza dat (bez externi AI API)
- **AI analyza per mesto** — 7+ insights v forecast modalu (trendy, extremy, srazky, vitr, tlak, vikend, mlhy, AQI)
- **7-denni predpoved** — teploty, pocitova teplota, smer vetru, srazky, oblacnost, tlak, narazy
- **Kvalita vzduchu** — AQI index + 8 polutantu (PM2.5, PM10, O3, NO2, NO, NH3, SO2, CO)
- **Canvas teplotni graf** — dynamicka sirka, max/min krivky

### Vizualni efekty
- **3D animace pocasi** (Three.js r160) — dest, snih, bourky s blesky, mlha, slunecni paprsky, mraky
- **2D canvas efekty** — casticovy system, dest/snih/blesky overlay
- **Canvas mesic** — realisticka faze mesice s kratery a mraky (ne emoji)
- **Glass-morphism UI** — backdrop-filter blur, CSS variables

### Zvuky
- **Web Audio API synteza** — dest (vicevrstvy), hrom, vitr, ptaci (den), cvrcci (noc)
- **Automaticky dle pocasi** — intenzita podle skutecnych podminek
- **Ovladani hlasitosti** — UI slider + mute

### Responzivita
- **320px az 6K displeje** — 8 breakpointu
- **Mobile-first** + touch optimalizace
- **zoom: 0.75** pro vetsi efektivni viewport

### Dalsi
- Automaticka detekce polohy (Geolocation API)
- Cesky jazyk (popisy pocasi, dny, smery vetru)
- Debug rezim (`?debug=true`)
- Dashboard rezim (`?dashboard=true`)
- Klavesove zkratky (Ctrl+K hledani, Esc zavrit, sipky navigace)

## Tech stack

| Co | Cim |
|---|---|
| Frontend | Vanilla JavaScript ES6+ (zero build) |
| 3D | Three.js r160.1 (UMD) |
| Audio | Web Audio API |
| CSS | Modularni (13 souboru), CSS Variables |
| API | OpenWeatherMap (current + forecast + air pollution) |
| Cache | IndexedDB |
| Celkem | ~6200 radku JS, ~1200 radku CSS |

## Instalace

```bash
git clone https://github.com/Buggy1111/weather-ultimate.git
cd weather-ultimate
```

### API klic
1. Registrace na [OpenWeatherMap](https://openweathermap.org/api) (free plan staci)
2. V `js/ultimate.js` nastavte:
```javascript
const CONFIG = {
    API_KEY: 'vas_api_klic',
};
```

### Spusteni
```bash
python -m http.server 8000
# nebo: npx serve
# nebo: php -S localhost:8000
```

## Struktura

```
weather-ultimate/
├── index.html
├── manifest.json
├── css/
│   ├── main.css              # importy
│   ├── variables.css         # CSS custom properties
│   ├── base.css              # reset, bg, scrollbar
│   ├── layout.css            # container, hero
│   ├── effects.css           # animace, 3D kontejner
│   ├── utilities.css         # helpers
│   ├── responsive.css        # 8 breakpointu (320px-6K)
│   └── components/
│       ├── cards.css         # weather karty, detaily, hourly
│       ├── forecast.css      # modal, day cards, chart, AQI, AI insight
│       ├── search.css        # vyhledavani, suggestions
│       ├── stats.css         # quick stats
│       ├── ai-insights.css   # AI predikce sekce
│       └── notifications.css
├── js/
│   ├── ultimate.js           # hlavni app (~2450r) — WeatherService, UIComponents,
│   │                         #   AIPredictions, WeatherApp
│   ├── effects/
│   │   ├── weather-2d.js     # canvas 2D efekty (~800r)
│   │   ├── weather-3d.js     # Three.js 3D sceny (~1340r)
│   │   └── sounds.js         # Web Audio synteza (~1290r)
│   └── modules/
│       └── moon.js           # canvas mesic s kratery (~345r)
└── assets/
    └── favicon/              # SVG + ICO + PNG (16-512px)
```

## API vyuziti — 100%

Vsechna data z OpenWeatherMap API jsou zobrazena:

| Endpoint | Pole | Kde |
|----------|------|-----|
| Current | temp, feels_like, humidity, pressure, wind.speed/deg/gust, clouds, visibility, weather.id | Karta mesta |
| Current | sea_level, grnd_level | Tooltip na tlaku + ikona hory |
| Current | sunrise, sunset | Sun info sekce |
| Forecast | temp, feels_like, wind.speed/deg, pressure, humidity, clouds, weather.id, pop, rain, snow, gust | Forecast karty |
| Forecast | sys.pod | Den/noc ratio (internal) |
| Air Pollution | aqi, pm2_5, pm10, o3, no2, no, nh3, so2, co | AQI sekce v modalu |

## Prednastavena mesta

- Praha, New York, Tokyo, Sydney, London, Paris

## Debug

```
http://localhost:8000?debug=true
```

Konzolove prikazy:
```javascript
debug.clearCache()
debug.showState()
debug.toggleAnimations()
debug.addRandomCity()
debug.exportData()
debug.testEffects()
```

## Licence

MIT

## Autor

Michal Burgermeister — michalbugy12@gmail.com

---

Vytvoreno s srdcem v Ceske republice

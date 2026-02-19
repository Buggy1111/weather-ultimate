# Weather Ultimate - Architektura projektu

## Přehled
Weather Ultimate je pokročilá webová aplikace pro zobrazení počasí s AI predikcemi,
3D vizualizacemi, zvukovými efekty a real-time aktualizacemi.

**Technologie:** Vanilla JavaScript (ES6+), CSS3, HTML5, Three.js r160.1
**API:** OpenWeatherMap (weather, forecast, geocoding)

## Struktura složek

```
Počasí/
├── index.html                  # Vstupní bod aplikace
├── manifest.json               # PWA manifest
├── LICENSE                     # MIT licence
│
├── css/                        # Stylování
│   ├── main.css                # Entry point (@import všech modulů)
│   ├── variables.css           # CSS custom properties & design tokens
│   ├── base.css                # Reset, body, pozadí, scrollbar
│   ├── layout.css              # Container, hero, weather grid
│   ├── effects.css             # 3D kontejnery, déšť, blesk
│   ├── utilities.css           # Přístupnost, tisk, kontrast, pohyb
│   ├── responsive.css          # Media queries (360px → 6K)
│   └── components/
│       ├── ai-insights.css     # AI předpověď sekce
│       ├── search.css          # Vyhledávací lišta + návrhy
│       ├── stats.css           # Quick stats grid
│       ├── cards.css           # Weather karty + hodiny + měsíc
│       ├── forecast.css        # Forecast modal + denní karty + graf
│       └── notifications.css   # Notifikace + skeleton loading
│
├── js/                         # JavaScript
│   ├── ultimate.js             # Hlavní aplikace (všechny třídy)
│   ├── modules/
│   │   └── moon.js             # Kalkulátor fáze měsíce (8 fází)
│   └── effects/
│       ├── weather-2d.js       # 2D canvas efekty (déšť, sníh, blesky)
│       ├── weather-3d.js       # 3D WebGL efekty (Three.js + GLSL shadery)
│       └── sounds.js           # Zvukové efekty počasí (Web Audio API)
│
├── assets/
│   └── favicon/                # Favicony (SVG, PNG, ICO, Apple Touch)
│
└── docs/
    └── ARCHITECTURE.md         # Tento soubor
```

## Hlavní třídy (ultimate.js)

| Třída | Odpovědnost |
|-------|-------------|
| `CONFIG` | Konfigurace API, cache, výchozí města, nálady počasí |
| `StateManager` | Centrální stav aplikace, pub/sub event systém |
| `AdvancedCache` | Dvouúrovňová cache (memory + IndexedDB) |
| `WeatherService` | API volání s queue a rate limiting |
| `AIPredictions` | Generátor AI předpovědí na základě dat |
| `ParticleSystem` | Background particle animace (canvas 2D) |
| `UIComponents` | Statické metody pro generování HTML komponent |
| `WeatherUltimate` | Hlavní kontrolér aplikace |
| `PerformanceMonitor` | Měření výkonu operací |

## Funkce

- **Lokální čas** - živé hodiny pro každé město (timezone offset z API)
- **4 fáze dne** - Den, Noc, Úsvit (30 min před východem), Soumrak (30 min po západu)
- **Fáze měsíce** - 8 fází (synodický měsíc ~29.53 dní), zobrazení při noci/soumraku/úsvitu
- **3D efekty** - GPU-instanced částice, custom GLSL shadery (Three.js)
- **2D efekty** - Déšť, sníh, hvězdy, blesky (Canvas 2D)
- **Zvukové efekty** - Generované přes Web Audio API (žádné externí soubory)
- **7-denní předpověď** - Modal s denními kartami + teplotní graf (Canvas)
- **Hodinová předpověď** - Scroll na každé kartě (24h)
- **AI predikce** - Generované na základě aktuálních dat
- **Real-time** - Automatický update každou minutu
- **PWA** - Manifest, cache, offline podpora
- **Přístupnost** - Focus visible, reduced motion, high contrast, print
- **Responsivita** - 10 breakpointů (< 360px až 6K+)
- **Debug mód** - `?debug=true` pro FPS, memory, stav

## API Flow

```
OpenWeatherMap API
    ├── /weather    → aktuální počasí (teplota, vlhkost, vítr, sunrise/sunset)
    ├── /forecast   → 5-denní/3-hodinová předpověď
    └── /geo/direct → geocoding (vyhledávání měst)
         ↓
    AdvancedCache (5 min TTL)
         ↓
    StateManager → UI rendering
```

# Weather Ultimate 🌦️

Aplikace počasí nové generace s AI predikcemi, real-time 3D vizualizacemi a pohlcujícími zvukovými efekty. Zažijte počasí jako nikdy předtím!

## ✨ Funkce

### 🎯 Hlavní funkce
- **Real-time data počasí** - Aktualizace každých 60 sekund
- **AI předpovědi počasí** - Chytré přehledy založené na globálních meteorologických datech
- **Sledování více měst** - Monitorujte počasí na více místech současně
- **7-denní předpověď** - Detailní týdenní předpověď s teplotními grafy

### 🎮 Vizuální efekty
- **3D animace počasí** - Poháněno Three.js
  - Realistický déšť s efekty dopadu
  - Dynamická akumulace sněhu
  - Bouřky s blesky
  - Volumetrická mlha
  - Animované sluneční paprsky a mraky
- **Systém částic** - Interaktivní částice na pozadí
- **Glass-morphism UI** - Moderní efekty matného skla

### 🔊 Zvuková zkušenost
- **Realistické zvuky počasí** - Syntetizováno pomocí Web Audio API
  - Vícevrstvý déšť s jednotlivými kapkami
  - Hrom s dynamickou intenzitou
  - Variace větru pro různé počasí
  - Denní/noční ambientní zvuky
  - Ptačí zpěv za jasných dnů
  - Cvrčci v noci

### 📱 Responzivní design
- **Mobile First** - Optimalizováno pro všechna zařízení
- **Škáluje od 320px do 6K displejů**
- **Optimalizované pro dotyk**
- **Připraveno jako Progressive Web App**

### 🌍 Lokalizace
- **Český jazyk** - Kompletní české překlady
- **Automatická detekce polohy**
- **Mezinárodní vyhledávání měst**

## 🚀 Demo

**[Live Demo →](https://your-username.github.io/weather-ultimate/)**

### Demo města
Aplikace obsahuje přednastavené počasí pro:
- 🇨🇿 Praha
- 🇺🇸 New York
- 🇯🇵 Tokyo
- 🇦🇺 Sydney
- 🇬🇧 London
- 🇫🇷 Paris

## 🛠️ Technologie

- **Frontend**: Vanilla JavaScript (ES6+)
- **3D Grafika**: Three.js r128
- **Audio**: Web Audio API
- **Stylování**: Vlastní CSS s CSS Variables
- **Data počasí**: OpenWeatherMap API
- **Build**: Není potřeba žádný build proces! Čistý vanilla JS
- **Architektura**: Modulární, třídní design

## 📦 Instalace

### Požadavky
- Moderní webový prohlížeč (Chrome, Firefox, Safari, Edge)
- OpenWeatherMap API klíč ([Získejte zdarma](https://openweathermap.org/api))

### Lokální vývoj

1. **Naklonujte repozitář**
   ```bash
   git clone https://github.com/Buggy1111/weather-ultimate.git
   cd weather-ultimate
   ```

2. **Získejte API klíč**
   - Zaregistrujte se na [OpenWeatherMap](https://openweathermap.org/api)
   - Zkopírujte váš API klíč

3. **Nastavte API klíč**
   ```javascript
   // V js/ultimate.js nahraďte svým klíčem:
   const CONFIG = {
       API_KEY: 'váš_api_klíč_zde',
       // ...
   };
   ```

4. **Spusťte lokální server**
   ```bash
   # Pomocí Pythonu
   python -m http.server 8000

   # Pomocí Node.js
   npx serve

   # Pomocí PHP
   php -S localhost:8000
   ```

5. **Otevřete v prohlížeči**
   ```
   http://localhost:8000
   ```

## 🏗️ Struktura projektu

```
weather-ultimate/
├── index.html           # Hlavní HTML soubor
├── styles.css           # Všechny styly (responzivní)
├── manifest.json        # PWA manifest
├── LICENSE              # MIT licence
├── README.md            # Tento soubor
├── favicon/             # Ikony aplikace
│   ├── favicon.svg
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── mstile-144x144.png
└── js/                  # JavaScript moduly
    ├── ultimate.js         # Hlavní aplikační logika
    ├── weather-effects.js  # 2D efekty počasí
    ├── weather-3d-effects.js # 3D animace počasí
    └── weather-sounds.js   # Syntéza zvuku
```

### Přehled modulů

- **`js/ultimate.js`** - Jádro aplikace
  - Správa stavu
  - Integrace API
  - UI komponenty
  - Real-time aktualizace

- **`js/weather-effects.js`** - 2D vizuální efekty
  - Dešťové kapky
  - Sněhové částice
  - Blesky
  - Vrstvy mlhy

- **`js/weather-3d-effects.js`** - 3D scény
  - Three.js integrace
  - 3D prostředí počasí
  - Optimalizováno pro výkon

- **`js/weather-sounds.js`** - Zvukový engine
  - Syntetické zvuky počasí
  - Denní/noční variace
  - Ovládání hlasitosti
  - Podpora touch-to-play

## 🎮 Použití

### Hledání měst
1. Klikněte na vyhledávací pole
2. Napište název města
3. Vyberte z návrhů
4. Město se přidá na váš dashboard

### Interakce s kartami počasí
- **Hover** - Aktivuje zvuky a efekty počasí
- **Klik** - Zobrazí 7-denní předpověď
- **Live odznak** - Indikuje real-time data

### Ovládání zvuku
- 🔊/🔇 - Zapnout/vypnout zvuky
- Posuvník hlasitosti - Nastavení úrovně zvuku
- První interakce odemkne zvuk (požadavek prohlížeče)

### Klávesové zkratky
- `Ctrl/Cmd + K` - Zaměřit vyhledávání
- `Escape` - Zavřít modaly/návrhy
- `Šipky` - Navigace mezi kartami počasí

## 🎨 Přizpůsobení

### Změna barev tématu
```css
/* V styles.css */
:root {
    --hue-primary: 250;    /* Změňte odstín primární barvy */
    --hue-accent: 280;     /* Změňte odstín akcentové barvy */
    --saturation: 70%;
    --lightness: 60%;
}
```

### Přidání nových efektů počasí
```javascript
// V js/weather-effects.js
createCustomEffect(card, rect, effectInfo) {
    // Vaše vlastní logika efektu
}
```

### Úprava intervalu aktualizace
```javascript
// V js/ultimate.js
const CONFIG = {
    UPDATE_INTERVAL: 60 * 1000, // Změňte na požadované milisekundy
};
```

## 📱 Progressive Web App

Pro možnost instalace:

1. **Přidejte manifest.json**
   ```json
   {
     "name": "Weather Ultimate",
     "short_name": "Weather",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#0a0a0a",
     "background_color": "#000000"
   }
   ```

2. **Propojte v HTML**
   ```html
   <link rel="manifest" href="manifest.json">
   ```

3. **Přidejte service worker** (volitelné pro offline podporu)

## 🐛 Debug režim

Přidejte `?debug=true` k URL pro debug panel zobrazující:
- FPS počítadlo
- Využití paměti
- Počet aktivních efektů
- Statistiky cache
- Stav sítě

### Debug příkazy (v konzoli)
```javascript
debug.clearCache()        // Vymazat cache počasí
debug.showState()         // Zobrazit stav aplikace
debug.toggleAnimations()  // Přepnout animace
debug.addRandomCity()     // Přidat náhodné město
debug.exportData()        // Exportovat data počasí
debug.testEffects()       // Otestovat všechny efekty
```

## 🚀 Nasazení

### GitHub Pages
1. Jděte do Settings → Pages
2. Vyberte source: Deploy from branch
3. Vyberte branch: main
4. Vyberte složku: / (root)
5. Uložte a počkejte na nasazení

### Netlify
1. Build command: (nechte prázdné)
2. Publish directory: `.`
3. Deploy!

### Vercel
```bash
npm i -g vercel
vercel
```

## 🤝 Přispívání

Příspěvky jsou vítány! Nejdříve si prosím přečtěte [CONTRIBUTING.md](CONTRIBUTING.md).

1. Forkněte repozitář
2. Vytvořte svou feature branch (`git checkout -b feature/ÚžasnáFunkce`)
3. Commitněte změny (`git commit -m 'Přidat úžasnou funkci'`)
4. Pushněte do branch (`git push origin feature/ÚžasnáFunkce`)
5. Otevřete Pull Request

### Pokyny pro vývoj
- Držte se vanilla JS (žádné frameworky)
- Udržujte mobile-first přístup
- Testujte na více zařízeních
- Komentujte složitou logiku
- Dodržujte existující styl kódu

## 📋 Roadmapa

- [ ] PWA offline podpora
- [ ] Upozornění na počasí
- [ ] Historická data počasí
- [ ] Integrace mapy počasí
- [ ] Funkce sdílení na sociální sítě
- [ ] Podpora více jazyků
- [ ] Přepínač tmavého/světlého tématu
- [ ] Widgety počasí
- [ ] Řešení API rate limitů
- [ ] Ukládání uživatelských preferencí

## 🐞 Známé problémy

- Zvuk nemusí fungovat na iOS bez interakce uživatele
- 3D efekty jsou vypnuté na slabších zařízeních
- Některé efekty počasí mohou ovlivnit výkon na starších telefonech

## 📄 Licence

Tento projekt je licencován pod MIT licencí - viz soubor [LICENSE](LICENSE) pro detaily.

## 🙏 Poděkování

- Data počasí poskytuje [OpenWeatherMap](https://openweathermap.org/)
- 3D grafika poháněná [Three.js](https://threejs.org/)
- Inspirováno moderními aplikacemi počasí a kreativními webovými zážitky
- Díky všem přispěvatelům!

## 📧 Kontakt

Máte otázky nebo návrhy? Otevřete issue nebo mě kontaktujte!
michalbugy12@gmail.com

---

Vytvořeno s ❤️ v České republice
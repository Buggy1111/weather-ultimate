# Weather Ultimate — Feature Roadmap

## Pravidla
- [x] Testy PŘED kódem (TDD)
- [x] Git commit po každém feature
- [ ] Push až když je vše na 100%

---

## Phase 1: Vizuální WOW efekty

### 1. ✅ Dynamické pozadí podle počasí + denní doby
- Gradient pozadí se mění podle: clear/clouds/rain/snow/storm × day/night/dawn/twilight
- BackgroundManager s orbColors a transitions
- Každé město má vlastní barevný tint na kartě

### 2. ✅ Sunrise/Sunset oblouk (Sun Arc)
- SVG vizualizace pozice slunce na obloze
- Golden hour indikátor, aktuální pozice slunce na křivce
- Časy východu/západu + délka dne

### 3. ✅ Teplotní vizuální škála (Temperature Bars)
- High/low teplotní bar pro 7-denní forecast
- HSL barevný gradient: modrá (studeno) → zelená → žlutá → oranžová → červená (horko)

### 4. ✅ Skeleton Loading
- Realistický skeleton placeholder s header/temp/details/hourly/sun placeholdery
- Pulzující animace při načítání

---

## Phase 2: Interaktivní features

### 5. ✅ Swipe mezi městy (Mobile)
- CSS scroll-snap carousel na mobilech
- Dot pagination indikátor
- CarouselManager class

### 6. ✅ Activity Suggestions (Doporučení aktivit)
- 6 kategorií počasí: jasno, déšť, sníh, teplo, vítr, bouřka
- Ikony + český text, max 3 doporučení na kartě

### 7. ✅ Přepínač Light/Dark mode
- Respektuje prefers-color-scheme
- ThemeManager class s toggle + localStorage persistence
- Kompletní light theme CSS overrides

---

## Phase 3: Datové vylepšení

### 8. ✅ Srážkový timeline (adaptace pro free API)
- 3-hodinový srážkový timeline místo minutového nowcastu (free API limit)
- Barevné bary intenzity, časové popisky, alert text

### 9. ⏭️ SKIP — Interaktivní počasí mapa
- Vyžaduje Leaflet/Mapbox (externí knihovna) — mimo scope vanilla JS projektu

### 10. ⏭️ SKIP — Porovnání modelů (ECMWF vs GFS)
- Vyžaduje placený přístup k API modelů — nedostupné

---

## Phase 4: Polish & UX

### 11. ✅ Skládací sekce karet (Progressive Disclosure)
- Tlačítko "Více detailů" skrývá/zobrazuje hodinovou předpověď,
  srážky, sun arc, aktivity a náladu
- CSS max-height animace + aria-expanded atributy

### 12. ✅ Pokročilé počasí alerts
- getWeatherAlerts() — detekce extrémního mrazu, vedra, větru, bouřek
- Předpovědní varování: blížící se bouřka, velký pokles teploty
- Barevné alert bannery (info/warning/danger) na kartě

### 13. ✅ Teplotní trend graf
- SVG polyline graf 24h průběhu teplot
- Barevné body (HSL podle teploty), teplotní a časové popisky
- Gradient výplň pod křivkou

---

## Status
- [x] Phase 0: Audit, testy, mobilní opravy (HOTOVO)
- [x] Phase 1: Vizuální WOW efekty (HOTOVO — 4/4)
- [x] Phase 2: Interaktivní features (HOTOVO — 3/3)
- [x] Phase 3: Datové vylepšení (1/3 + 2 skipped)
- [x] Phase 4: Polish & UX (HOTOVO — 3/3)

## Celkem: 11/13 features implementováno, 2 skipped (vyžadují ext. knihovny/API)
## Testy: 216/216 ✅

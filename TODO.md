# Weather Ultimate — Feature Roadmap

## Pravidla
- [ ] Testy PŘED kódem (TDD)
- [ ] Git commit po každém feature
- [ ] Push až když je vše na 100%

---

## Phase 1: Vizuální WOW efekty

### 1. Dynamické pozadí podle počasí + denní doby
- Gradient pozadí se mění podle: clear/clouds/rain/snow/storm × day/night/dawn/twilight
- Plynulé CSS transitions mezi stavy
- Každé město má vlastní barevný tint na kartě (už částečně máme)

### 2. Sunrise/Sunset oblouk (Sun Arc)
- SVG/Canvas vizualizace pozice slunce na obloze
- Golden hour indikátor
- Aktuální pozice slunce na křivce

### 3. Teplotní vizuální škála (Temperature Bars)
- High/low teplotní bar pro 7-denní forecast
- Barevný gradient: modrá (studeno) → zelená → žlutá → oranžová → červená (horko)
- Vizuální rozsah, ne jen čísla

### 4. Skeleton Loading
- Skeleton placeholder místo "Analyzuji data..."
- Pulzující animace při načítání
- Okamžitý vizuální feedback

---

## Phase 2: Interaktivní features

### 5. Swipe mezi městy (Mobile)
- Touch swipe na kartách
- Dot indikátor (pagination)
- Plynulá animace přechodů

### 6. Activity Suggestions (Doporučení aktivit)
- Na základě počasí: běh, kolo, procházka, lyže, pláž...
- Ikony + krátký text
- Sekce na kartě nebo v modálu

### 7. Přepínač Light/Dark mode
- Respektuje systémové nastavení (prefers-color-scheme)
- Manuální přepínač v UI
- Uložení preference do localStorage

---

## Phase 3: Datové vylepšení

### 8. Minutový Nowcast (srážky na 90 min)
- Vizuální timeline srážek minute-by-minute
- Barevná intenzita srážek
- "Za 15 min začne pršet" notifikace

### 9. Interaktivní počasí mapa
- Leaflet/Mapbox mapa s vrstvami
- Srážkový radar overlay
- Teplotní heatmapa
- Větrné proudy animace

### 10. Porovnání modelů (ECMWF vs GFS)
- Zobrazení předpovědí z více modelů
- Vizuální porovnání rozptylu
- Spolehlivost předpovědi

---

## Phase 4: Polish & UX

### 11. Vylepšené widgety/karty
- Kompaktnější card layout možnost
- Rozbalitelné sekce (progressive disclosure)
- Drag & drop řazení karet

### 12. Pokročilé notifikace
- Alerts před změnou počasí
- Denní ranní shrnutí
- Extrémní podmínky varování

### 13. Historická data & trendy
- Graf teploty za poslední týden/měsíc
- Porovnání s průměrem
- Klimatické trendy

---

## Status
- [x] Phase 0: Audit, testy, mobilní opravy (HOTOVO)
- [ ] Phase 1: Vizuální WOW efekty (AKTUÁLNÍ)
- [ ] Phase 2: Interaktivní features
- [ ] Phase 3: Datové vylepšení
- [ ] Phase 4: Polish & UX

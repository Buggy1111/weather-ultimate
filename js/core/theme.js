/**
 * Theme Manager — auto / light / dark mode
 *
 * Auto mode switches based on local time (day = light, night = dark).
 * Manual light/dark overrides auto. Stores preference in localStorage.
 * Toggle cycles: auto → light → dark → auto
 */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'weather-theme';
        this.mode = this._loadMode();          // 'auto' | 'light' | 'dark'
        this.theme = this._resolveTheme();     // 'light' | 'dark'
        this._apply();
        this._startAutoCheck();
    }

    _loadMode() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
        return 'auto';
    }

    _resolveTheme() {
        if (this.mode !== 'auto') return this.mode;
        const hour = new Date().getHours();
        return (hour >= 6 && hour < 20) ? 'light' : 'dark';
    }

    _apply() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    _startAutoCheck() {
        setInterval(() => {
            if (this.mode === 'auto') {
                const resolved = this._resolveTheme();
                if (resolved !== this.theme) {
                    this.theme = resolved;
                    this._apply();
                }
            }
        }, 60000);
    }

    getTheme() {
        return this.theme;
    }

    getMode() {
        return this.mode;
    }

    setTheme(theme) {
        this.mode = theme;
        this.theme = this._resolveTheme();
        localStorage.setItem(this.STORAGE_KEY, this.mode);
        this._apply();
    }

    toggle() {
        const cycle = { auto: 'light', light: 'dark', dark: 'auto' };
        this.setTheme(cycle[this.mode] || 'auto');
    }
}

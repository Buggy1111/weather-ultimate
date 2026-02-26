/**
 * Theme Manager — light/dark mode toggle
 *
 * Respects prefers-color-scheme, stores preference in localStorage.
 */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'weather-theme';
        this.theme = this._loadTheme();
        this._apply();
    }

    _loadTheme() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    _apply() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    getTheme() {
        return this.theme;
    }

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem(this.STORAGE_KEY, theme);
        this._apply();
    }

    toggle() {
        this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    }
}

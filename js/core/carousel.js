/**
 * Carousel Manager — mobile horizontal swipe with CSS scroll-snap
 *
 * Activates only on mobile (< 768px). Desktop keeps normal grid.
 * Uses native CSS scroll-snap for performance, JS only for pagination dots.
 */

class CarouselManager {
    constructor(gridSelector, paginationSelector) {
        this.grid = document.querySelector(gridSelector);
        this.pagination = document.querySelector(paginationSelector);
        this.currentIndex = 0;
        this.scrollTimeout = null;
        this.isMobile = this.checkMobile();

        if (this.grid && this.pagination && this.isMobile) {
            this.init();
        }

        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = this.checkMobile();
            if (this.isMobile && !wasMobile) {
                this.init();
            } else if (!this.isMobile && wasMobile) {
                this.destroy();
            }
        });
    }

    checkMobile() {
        return window.innerWidth <= 767;
    }

    getCardCount() {
        if (!this.grid) return 0;
        return this.grid.querySelectorAll('.weather-card').length;
    }

    init() {
        this.updatePaginationDots();
        this._onScroll = () => this.handleScroll();
        this.grid.addEventListener('scroll', this._onScroll, { passive: true });
    }

    destroy() {
        if (this.pagination) {
            while (this.pagination.firstChild) this.pagination.removeChild(this.pagination.firstChild);
        }
        if (this.grid && this._onScroll) {
            this.grid.removeEventListener('scroll', this._onScroll);
        }
        this.currentIndex = 0;
    }

    refresh() {
        if (this.isMobile) {
            this.updatePaginationDots();
        }
    }

    updatePaginationDots() {
        if (!this.pagination) return;
        while (this.pagination.firstChild) this.pagination.removeChild(this.pagination.firstChild);

        const count = this.getCardCount();
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = `carousel-dot${i === this.currentIndex ? ' carousel-dot--active' : ''}`;
            dot.setAttribute('aria-label', `Karta ${i + 1}`);
            dot.addEventListener('click', () => this.scrollToCard(i));
            this.pagination.appendChild(dot);
        }
    }

    handleScroll() {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            if (!this.grid) return;
            const scrollLeft = this.grid.scrollLeft;
            const cardWidth = this.grid.offsetWidth;
            if (cardWidth === 0) return;
            const newIndex = Math.round(scrollLeft / cardWidth);
            const maxIndex = Math.max(0, this.getCardCount() - 1);
            this.currentIndex = Math.max(0, Math.min(newIndex, maxIndex));
            this.updateActiveDot();
        }, 50);
    }

    scrollToCard(index) {
        this.currentIndex = index;
        if (this.grid) {
            const cardWidth = this.grid.offsetWidth;
            this.grid.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
        }
        this.updateActiveDot();
    }

    updateActiveDot() {
        if (!this.pagination) return;
        const dots = this.pagination.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('carousel-dot--active', i === this.currentIndex);
        });
    }
}

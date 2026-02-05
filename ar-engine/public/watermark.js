/**
 * Watermark Utility
 * Adds a logo watermark to a canvas.
 */
window.Watermark = {
    /**
     * Applies a watermark to the given canvas.
     * @param {HTMLCanvasElement} canvas - The target canvas.
     * @param {string} logoUrl - URL of the logo image.
     * @param {Object} options - Customization options.
     * @returns {Promise<HTMLCanvasElement>}
     */
    apply: function (canvas, logoUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const defaults = {
                opacity: 0.8,
                margin: 20,
                sizeRatio: 0.20,
                position: 'bottom-right'
            };
            const config = { ...defaults, ...options };

            const ctx = canvas.getContext('2d');
            const logoSize = Math.min(canvas.width, canvas.height) * config.sizeRatio;
            let x, y;

            if (config.position === 'bottom-right') {
                x = canvas.width - logoSize - config.margin;
                y = canvas.height - logoSize - config.margin;
            } else {
                x = canvas.width - logoSize - config.margin;
                y = canvas.height - logoSize - config.margin;
            }

            const logo = new Image();
            logo.onload = () => {
                ctx.save();
                ctx.globalAlpha = config.opacity;
                ctx.drawImage(logo, x, y, logoSize, logoSize);
                ctx.restore();
                resolve(canvas);
            };

            logo.onerror = (e) => {
                console.error('[Watermark] Failed to load logo:', logoUrl);
                resolve(canvas);
            };

            logo.src = logoUrl;
        });
    }
};

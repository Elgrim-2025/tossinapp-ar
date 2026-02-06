/**
 * Watermark Utility - 강화판
 */
window.Watermark = {
    apply: function (canvas, logoUrl, options = {}) {
        return new Promise((resolve) => {
            const defaults = {
                opacity: 0.8,
                margin: 30,
                sizeRatio: 0.20
            };
            const config = { ...defaults, ...options };
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(canvas);
                return;
            }

            // === 디버그 표식: 왼쪽 하단 노란색 점 ===
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(10, canvas.height - 20, 10, 10);

            const logo = new Image();
            logo.crossOrigin = "anonymous";

            logo.onload = () => {
                const logoSize = Math.min(canvas.width, canvas.height) * config.sizeRatio;
                const x = canvas.width - logoSize - config.margin;
                const y = canvas.height - logoSize - config.margin;

                ctx.save();
                ctx.globalAlpha = config.opacity;
                ctx.drawImage(logo, x, y, logoSize, logoSize);
                ctx.restore();

                console.log('[Watermark] 합성 완료');
                resolve(canvas);
            };

            logo.onerror = () => {
                console.warn('[Watermark] 로드 실패, 텍스트 출력');
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('EL-LOGO', canvas.width - config.margin, canvas.height - config.margin);
                resolve(canvas);
            };

            logo.src = logoUrl + (logoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        });
    }
};

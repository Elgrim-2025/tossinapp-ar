/**
 * Watermark - 이미지에 워터마크를 추가하는 유틸리티 (강화판)
 */
window.Watermark = {
    /**
     * 캔버스에 워터마크 적용
     * @param {HTMLCanvasElement} canvas - 대상 캔버스
     * @param {string} logoSrc - 로고 이미지 경로
     * @param {Object} options - 옵션
     * @returns {Promise<HTMLCanvasElement>}
     */
    apply: function (canvas, logoSrc, options = {}) {
        return new Promise((resolve) => {
            const {
                opacity = 0.8,
                sizeRatio = 0.20,
                margin = 30
            } = options;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('[Watermark] 2D 컨텍스트를 얻을 수 없습니다.');
                resolve(canvas);
                return;
            }

            // === 디버그 표식: 왼쪽 하단에 노란색 점 (코드 작동 확인용) ===
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(10, canvas.height - 20, 10, 10);

            const logo = new Image();
            logo.crossOrigin = "anonymous";

            logo.onload = () => {
                const logoSize = Math.min(canvas.width, canvas.height) * sizeRatio;
                const logoX = canvas.width - logoSize - margin;
                const logoY = canvas.height - logoSize - margin;

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
                ctx.restore();

                console.log('[Watermark] 로고 합성 완료:', { logoX, logoY, logoSize });
                resolve(canvas);
            };

            logo.onerror = (e) => {
                console.warn('[Watermark] 로고 로드 실패, 대체 텍스트 작성:', logoSrc);

                // 로고 대신 텍스트라도 출력하여 위치 확인
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('EL-LOGO', canvas.width - margin, canvas.height - margin);

                resolve(canvas);
            };

            // 캐시 방지를 위해 쿼리스트링 추가 (선택 사항)
            logo.src = logoSrc + (logoSrc.includes('?') ? '&' : '?') + 'v=' + Date.now();
        });
    }
};

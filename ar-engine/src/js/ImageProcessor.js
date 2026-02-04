/**
 * ImageProcessor.js
 *
 * MediaPipe Selfie Segmentation을 이용한 배경 제거 모듈
 * 이미지 업로드 → 배경 분리 → 초록색 크로마키 배경 적용 → AR 표시
 */

import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

export class ImageProcessor {
    constructor() {
        this.selfieSegmentation = null;
        this.isReady = false;

        // 처리용 캔버스
        this.canvas = null;
        this.ctx = null;

        // 크로마키 색상 (초록색)
        this.chromaKeyColor = { r: 0, g: 255, b: 0 };

        // 콜백
        this.onResultCallback = null;
    }

    /**
     * MediaPipe 초기화
     */
    async init() {
        console.log('[ImageProcessor] MediaPipe 초기화 중...');

        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }
        });

        // 모델 설정
        this.selfieSegmentation.setOptions({
            modelSelection: 1,  // 0: general, 1: landscape (더 정확)
            selfieMode: false,
        });

        // 결과 콜백 설정
        this.selfieSegmentation.onResults((results) => this.onResults(results));

        // 캔버스 생성
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.isReady = true;
        console.log('[ImageProcessor] MediaPipe 초기화 완료!');
    }

    /**
     * MediaPipe 결과 처리
     */
    onResults(results) {
        if (!results.segmentationMask) {
            console.warn('[ImageProcessor] 세그멘테이션 마스크 없음');
            return;
        }

        const width = results.image.width;
        const height = results.image.height;

        // 캔버스 크기 설정
        this.canvas.width = width;
        this.canvas.height = height;

        // 원본 이미지 그리기
        this.ctx.drawImage(results.image, 0, 0, width, height);

        // 이미지 데이터 가져오기
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // 마스크 데이터 가져오기
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        maskCtx.drawImage(results.segmentationMask, 0, 0, width, height);
        const maskData = maskCtx.getImageData(0, 0, width, height).data;

        // 배경을 크로마키 색상으로 대체
        for (let i = 0; i < pixels.length; i += 4) {
            const maskValue = maskData[i];  // 마스크 값 (0-255)

            // 마스크 값이 낮으면 배경 (사람이 아님)
            if (maskValue < 128) {
                // 배경 → 초록색으로 대체
                pixels[i] = this.chromaKeyColor.r;      // R
                pixels[i + 1] = this.chromaKeyColor.g;  // G
                pixels[i + 2] = this.chromaKeyColor.b;  // B
                pixels[i + 3] = 255;                     // A
            }
            // else: 전경 (사람) → 원본 유지
        }

        // 결과 적용
        this.ctx.putImageData(imageData, 0, 0);

        // 콜백 호출
        if (this.onResultCallback) {
            this.onResultCallback(this.canvas);
        }
    }

    /**
     * 이미지 파일 처리
     * @param {File} file - 이미지 파일
     * @returns {Promise<HTMLCanvasElement>} - 처리된 캔버스
     */
    async processFile(file) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                reject(new Error('ImageProcessor가 초기화되지 않음'));
                return;
            }

            const img = new Image();
            img.onload = async () => {
                this.onResultCallback = (resultCanvas) => {
                    resolve(resultCanvas);
                };

                try {
                    await this.selfieSegmentation.send({ image: img });
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('이미지 로드 실패'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * 이미지 URL 처리
     * @param {string} url - 이미지 URL
     * @returns {Promise<HTMLCanvasElement>} - 처리된 캔버스
     */
    async processURL(url) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                reject(new Error('ImageProcessor가 초기화되지 않음'));
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = async () => {
                this.onResultCallback = (resultCanvas) => {
                    resolve(resultCanvas);
                };

                try {
                    await this.selfieSegmentation.send({ image: img });
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('이미지 로드 실패'));
            img.src = url;
        });
    }

    /**
     * HTMLImageElement 직접 처리
     * @param {HTMLImageElement} img - 이미지 엘리먼트
     * @returns {Promise<HTMLCanvasElement>} - 처리된 캔버스
     */
    async processImage(img) {
        return new Promise(async (resolve, reject) => {
            if (!this.isReady) {
                reject(new Error('ImageProcessor가 초기화되지 않음'));
                return;
            }

            this.onResultCallback = (resultCanvas) => {
                resolve(resultCanvas);
            };

            try {
                await this.selfieSegmentation.send({ image: img });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 처리된 캔버스를 Blob으로 변환
     * @param {HTMLCanvasElement} canvas
     * @param {string} type - MIME 타입 (default: 'image/png')
     * @returns {Promise<Blob>}
     */
    canvasToBlob(canvas, type = 'image/png') {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, type);
        });
    }

    /**
     * 처리된 캔버스를 Data URL로 변환
     * @param {HTMLCanvasElement} canvas
     * @param {string} type - MIME 타입 (default: 'image/png')
     * @returns {string}
     */
    canvasToDataURL(canvas, type = 'image/png') {
        return canvas.toDataURL(type);
    }

    /**
     * 크로마키 색상 설정
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     */
    setChromaKeyColor(r, g, b) {
        this.chromaKeyColor = { r, g, b };
    }

    /**
     * 정리
     */
    destroy() {
        if (this.selfieSegmentation) {
            this.selfieSegmentation.close();
            this.selfieSegmentation = null;
        }
        this.canvas = null;
        this.ctx = null;
        this.isReady = false;
        console.log('[ImageProcessor] 정리 완료');
    }
}

export default ImageProcessor;

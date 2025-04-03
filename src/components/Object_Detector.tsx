import { ObjectDetector, FilesetResolver, Detection } from "@mediapipe/tasks-vision";

export class ObjectDetectorHandler {
    private objectDetector: ObjectDetector | null = null;
    private runningMode: "IMAGE" | "VIDEO" = "IMAGE";
    private video: HTMLVideoElement | null = null;
    private lineView: HTMLElement | null = null;
    private lastVideoTime = -1;
    private animationFrameId: number | null = null;

    public async initialize(): Promise<void> {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
            );

            this.objectDetector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                    delegate: "GPU",
                },
                scoreThreshold: 0.5,
                runningMode: this.runningMode,
            });
            console.log("ObjectDetector initialized successfully");
        } catch (error) {
            console.error("Error initializing ObjectDetector:", error);
            throw error;
        }
    }

    public async handleImageClick(event: Event): Promise<void> {
        if (!this.objectDetector) {
            console.error("Object detector not initialized");
            return;
        }

        const target = event.target as HTMLImageElement;
        const parent = target.parentElement;

        if (!parent) return;

        // Clear previous detections
        this.clearDetections(parent);

        try {
            if (this.runningMode === "VIDEO") {
                this.runningMode = "IMAGE";
                await this.objectDetector.setOptions({ runningMode: "IMAGE" });
            }

            const detections = await this.objectDetector.detect(target);
            this.displayImageDetections(detections, target);
        } catch (error) {
            console.error("Detection error:", error);
        }
    }

    private clearDetections(parent: HTMLElement): void {
        const elements = parent.querySelectorAll(".highlighter, .info");
        elements.forEach(el => el.remove());
    }

    private displayImageDetections(result: { detections: Detection[] }, imgElement: HTMLImageElement): void {
        const ratio = imgElement.height / imgElement.naturalHeight;

        result.detections.forEach(detection => {
            if (!detection.categories[0]) return;

            const highlighter = document.createElement("div");
            highlighter.className = "highlighter";
            highlighter.style.cssText = `
                position: absolute;
                left: ${detection.boundingBox.originX * ratio}px;
                top: ${detection.boundingBox.originY * ratio}px;
                width: ${detection.boundingBox.width * ratio}px;
                height: ${detection.boundingBox.height * ratio}px;
                border: 2px solid #6e45e2;
                background: rgba(110, 69, 226, 0.2);
                pointer-events: none;
                z-index: 10;`;

            const label = document.createElement("div");
            label.className = "info";
            label.textContent = `${detection.categories[0].categoryName} (${Math.round(detection.categories[0].score * 100)}%)`;
            label.style.cssText = `
                position: absolute;
                left: ${detection.boundingBox.originX * ratio}px;
                top: ${(detection.boundingBox.originY * ratio) - 20}px;
                background: rgba(110, 69, 226, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 11;`;

            imgElement.parentElement?.appendChild(highlighter);
            imgElement.parentElement?.appendChild(label);
        });
    }

    public async enableCam(video: HTMLVideoElement, lineView: HTMLElement): Promise<void> {
        if (!this.objectDetector) {
            throw new Error("Object detector not initialized");
        }

        this.video = video;
        this.lineView = lineView;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "environment"
                }
            });

            this.video.srcObject = stream;
            await new Promise<void>((resolve) => {
                this.video!.onloadedmetadata = () => resolve();
            });

            if (this.runningMode === "IMAGE") {
                this.runningMode = "VIDEO";
                await this.objectDetector.setOptions({ runningMode: "VIDEO" });
            }

            this.video.play();
            this.predictWebcam();
        } catch (error) {
            console.error("Camera error:", error);
            throw error;
        }
    }

    private async predictWebcam(): Promise<void> {
        if (!this.objectDetector || !this.video || !this.lineView || this.video.readyState < 2) {
            return;
        }

        try {
            const startTimeMs = performance.now();
            if (this.video.currentTime !== this.lastVideoTime) {
                this.lastVideoTime = this.video.currentTime;
                const detections = await this.objectDetector.detectForVideo(this.video, startTimeMs);
                this.displayVideoDetections(detections);
            }
        } catch (error) {
            console.error("Prediction error:", error);
        }

        this.animationFrameId = requestAnimationFrame(() => this.predictWebcam());
    }

    private displayVideoDetections(result: { detections: Detection[] }): void {
        if (!this.lineView) return;

        // Clear previous detections
        this.lineView.innerHTML = '';

        result.detections.forEach(detection => {
            if (!detection.categories[0]) return;

            const highlighter = document.createElement("div");
            highlighter.className = "highlighter";
            highlighter.style.cssText = `
                position: absolute;
                left: ${detection.boundingBox.originX}px;
                top: ${detection.boundingBox.originY}px;
                width: ${detection.boundingBox.width}px;
                height: ${detection.boundingBox.height}px;
                border: 2px solid #6e45e2;
                background: rgba(110, 69, 226, 0.2);
                pointer-events: none;
                z-index: 10;`;

            const label = document.createElement("div");
            label.className = "info";
            label.textContent = `${detection.categories[0].categoryName} (${Math.round(detection.categories[0].score * 100)}%)`;
            label.style.cssText = `
                position: absolute;
                left: ${detection.boundingBox.originX}px;
                top: ${detection.boundingBox.originY - 20}px;
                background: rgba(110, 69, 226, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 11;`;

            this.lineView.appendChild(highlighter);
            this.lineView.appendChild(label);
        });
    }

    public disableCam(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.video?.srcObject) {
            const stream = this.video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }

        if (this.lineView) {
            this.lineView.innerHTML = '';
        }
    }
}
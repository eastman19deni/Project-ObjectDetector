import { ObjectDetector, FilesetResolver, Detection } from "@mediapipe/tasks-vision";

export class ObjectDetectorHandler {
  private objectDetector: ObjectDetector | null = null;
  private runningMode: "IMAGE" | "VIDEO" = "IMAGE";
  private video: HTMLVideoElement | null = null;
  private lineView: HTMLElement | null = null;
  private children: HTMLElement[] = [];
  private lastVideoTime = -1;

  constructor() {}

  public async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
    );

    this.objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
        delegate: "GPU",
      },
      scoreThreshold: 0.5,
      runningMode: this.runningMode,
    });
  }

  public async handleImageClick(event: Event): Promise<void> {
    const target = event.target as HTMLImageElement;
    const parent = target.parentNode as HTMLElement;

    // Удаление старых выделений
    const highlighters = parent.getElementsByClassName("highlighter");
    while (highlighters[0]) {
      highlighters[0].parentNode?.removeChild(highlighters[0]);
    }

    const infos = parent.getElementsByClassName("info");
    while (infos[0]) {
      infos[0].parentNode?.removeChild(infos[0]);
    }

    if (!this.objectDetector) {
      alert("Object detector is still loading, please try again.");
      return;
    }

    if (this.runningMode === "VIDEO") {
      this.runningMode = "IMAGE";
      await this.objectDetector.setOptions({ runningMode: "IMAGE" });
    }

    const detections = await this.objectDetector.detect(target);
    this.displayImageDetections(detections, target);
  }

  private displayImageDetections(result: { detections: Detection[] }, resultElement: HTMLImageElement): void {
    const ratio = resultElement.height / resultElement.naturalHeight;

    for (const detection of result.detections) {
      const p = document.createElement("p");
      p.className = "info";
      p.innerText = `${detection.categories[0].categoryName} - with ${Math.round(
        detection.categories[0].score * 100
      )}% confidence.`;
      p.style.cssText = `
        left: ${detection.boundingBox.originX * ratio}px;
        top: ${detection.boundingBox.originY * ratio}px;
        width: ${detection.boundingBox.width * ratio - 10}px;`;

      const highlighter = document.createElement("div");
      highlighter.className = "highlighter";
      highlighter.style.cssText = `
        left: ${detection.boundingBox.originX * ratio}px;
        top: ${detection.boundingBox.originY * ratio}px;
        width: ${detection.boundingBox.width * ratio}px;
        height: ${detection.boundingBox.height * ratio}px;`;

      resultElement.parentNode?.appendChild(highlighter);
      resultElement.parentNode?.appendChild(p);
    }
  }

  public async enableCam(video: HTMLVideoElement, lineView: HTMLElement): Promise<void> {
    if (!this.objectDetector) {
      console.log("Wait! Object Detector not loaded yet");
      return;
    }

    this.video = video;
    this.lineView = lineView;

    const constraints = { video: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = stream;
      this.video.addEventListener("loadeddata", this.predictWebcam.bind(this));
    } catch (err) {
      console.error(err);
    }
  }

  private async predictWebcam(): Promise<void> {
    if (!this.objectDetector || !this.video || !this.lineView) {
      console.error("Object detector not initialized");
      return;
    }

    if (this.runningMode === "IMAGE") {
      this.runningMode = "VIDEO";
      await this.objectDetector.setOptions({ runningMode: "VIDEO" });
    }

    const startTimeMs = performance.now();

    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const detections = await this.objectDetector.detectForVideo(this.video, startTimeMs);
      this.displayVideoDetections(detections);
    }
    window.requestAnimationFrame(this.predictWebcam.bind(this));
  }

  private displayVideoDetections(result: { detections: Detection[] }): void {
    if (!this.lineView) return;

    for (const child of this.children) {
      this.lineView.removeChild(child);
    }
    this.children = [];

    for (const detection of result.detections) {
      const p = document.createElement("p");
      p.innerText = `${detection.categories[0].categoryName} - with ${Math.round(
        detection.categories[0].score * 100
      )}% confidence.`;
      p.style.cssText = `
        left: ${this.video!.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px;
        top: ${detection.boundingBox.originY}px;
        width: ${detection.boundingBox.width - 10}px;`;

      const highlighter = document.createElement("div");
      highlighter.className = "highlighter";
      highlighter.style.cssText = `
        left: ${this.video!.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px;
        top: ${detection.boundingBox.originY}px;
        width: ${detection.boundingBox.width - 10}px;
        height: ${detection.boundingBox.height}px;`;

      this.lineView.appendChild(highlighter);
      this.lineView.appendChild(p);
      this.children.push(highlighter, p);
    }
  }
}
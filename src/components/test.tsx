// import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

// const demosSection = document.getElementById('demos') as HTMLElement;

// let objectDetector: ObjectDetector | null = null;
// let runningMode: "IMAGE" | "VIDEO" = "IMAGE";

// const initializeObjectDetector = async (): Promise<void> => {
//   const vision = await FilesetResolver.forVisionTasks(
//     "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
//   );

//   objectDetector = await ObjectDetector.createFromOptions(vision, {
//     baseOptions: {
//       modelAssetPath:
//         "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
//       delegate: "GPU",
//     },
//     scoreThreshold: 0.5,
//     runningMode: runningMode,
//   });

//   demosSection.classList.remove("invisible");
// };
// initializeObjectDetector();

// const imageContainers = document.getElementsByClassName(
//   "detectOnClick"
// ) as HTMLCollectionOf<HTMLDivElement>;

// for (const imageContainer of imageContainers) {
//   const img = imageContainer.children[0] as HTMLImageElement;
//   img.addEventListener("click", handleClick);
// }

// async function handleClick(event: Event): Promise<void> {
//   const target = event.target as HTMLImageElement;
//   const parent = target.parentNode as HTMLElement;
  
//   // Удаление старых выделений
//   const highlighters = parent.getElementsByClassName("highlighter");
//   while (highlighters[0]) {
//     highlighters[0].parentNode?.removeChild(highlighters[0]);
//   }

//   const infos = parent.getElementsByClassName("info");
//   while (infos[0]) {
//     infos[0].parentNode?.removeChild(infos[0]);
//   }

//   // Проверка, что objectDetector загружен
//   if (!objectDetector) {
//     alert("Object detector is still loading, please try again.");
//     return;
//   }

//   if (runningMode === "VIDEO") {
//     runningMode = "IMAGE";
//     await objectDetector.setOptions({ runningMode: "IMAGE" });
//   }

//   const detections = await objectDetector.detect(target);
//   displayImageDetections(detections, target);
// }

// function displayImageDetections(
//   result: any,
//   resultElement: HTMLImageElement
// ): void {
//   const ratio = resultElement.height / resultElement.naturalHeight;
  
//   for (const detection of result.detections) {
//     const p = document.createElement("p");
//     p.className = "info";
//     p.innerText = `${detection.categories[0].categoryName} - with ${Math.round(
//       detection.categories[0].score * 100
//     )}% confidence.`;
//     p.style.cssText = `
//       left: ${detection.boundingBox.originX * ratio}px;
//       top: ${detection.boundingBox.originY * ratio}px;
//       width: ${detection.boundingBox.width * ratio - 10}px;`;

//     const highlighter = document.createElement("div");
//     highlighter.className = "highlighter";
//     highlighter.style.cssText = `
//       left: ${detection.boundingBox.originX * ratio}px;
//       top: ${detection.boundingBox.originY * ratio}px;
//       width: ${detection.boundingBox.width * ratio}px;
//       height: ${detection.boundingBox.height * ratio}px;`;

//     resultElement.parentNode?.appendChild(highlighter);
//     resultElement.parentNode?.appendChild(p);
//   }
// }

// let video = document.getElementById("webcam") as HTMLVideoElement;
// const lineView = document.getElementById("lineView") as HTMLElement;
// const enableWebcamButton = document.getElementById(
//   "webcamButton"
// ) as HTMLButtonElement;
// let children: HTMLElement[] = [];

// function hasGetUserMedia(): boolean {
//   return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
// }

// if (hasGetUserMedia()) {
//   enableWebcamButton.addEventListener("click", enableCam);
// } else {
//   console.warn("getUserMedia() is not supported by your browser");
// }

// async function enableCam(): Promise<void> {
//   if (!objectDetector) {
//     console.log("Wait! Object Detector not loaded yet");
//     return;
//   }

//   enableWebcamButton.classList.add("removed");
//   const constraints = { video: true };
//   try {
//     const stream = await navigator.mediaDevices.getUserMedia(constraints);
//     video.srcObject = stream;
//     video.addEventListener("loadeddata", predictWebcam);
//   } catch (err) {
//     console.error(err);
//   }
// }

// let lastVideoTime = -1;
// async function predictWebcam(): Promise<void> {
//   if (!objectDetector) {
//     console.error("Object detector not initialized");
//     return;
//   }

//   if (runningMode === "IMAGE") {
//     runningMode = "VIDEO";
//     await objectDetector.setOptions({ runningMode: "VIDEO" });
//   }

//   const startTimeMs = performance.now();

//   if (video.currentTime !== lastVideoTime) {
//     lastVideoTime = video.currentTime;
//     const detections = await objectDetector.detectForVideo(video, startTimeMs);
//     displayVideoDetections(detections);
//   }
//   window.requestAnimationFrame(predictWebcam);
// }

// function displayVideoDetections(result: any): void {
//   for (const child of children) {
//     lineView.removeChild(child);
//   }
//   children = [];

//   for (const detection of result.detections) {
//     const p = document.createElement("p");
//     p.innerText = `${detection.categories[0].categoryName} - with ${Math.round(
//       detection.categories[0].score * 100
//     )}% confidence.`;
//     p.style.cssText = `
//       left: ${video.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px;
//       top: ${detection.boundingBox.originY}px;
//       width: ${detection.boundingBox.width - 10}px;`;

//     const highlighter = document.createElement("div");
//     highlighter.className = "highlighter";
//     highlighter.style.cssText = `
//       left: ${video.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px;
//       top: ${detection.boundingBox.originY}px;
//       width: ${detection.boundingBox.width - 10}px;
//       height: ${detection.boundingBox.height}px;`;

//     lineView.appendChild(highlighter);
//     lineView.appendChild(p);
//     children.push(highlighter, p);
//   }
// }

// export default Object

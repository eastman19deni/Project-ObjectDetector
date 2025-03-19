import { ObjectDetector, FilesetResolver,ObjectDetectionResult } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

const demosSection = document.getElementById('demos') as HTMLElement

let objectDetector: ObjectDetector
let runningMode: 'IMAGE' | 'VIDEO' = 'IMAGE'

const initializeObjectDetector = async (): Promise<void> => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  )
  objectDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions:{
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
      delegate: "GPU"
    },
    scoreThreshold:0.5,
    runningMode: runningMode
  })
  demosSection.classList.remove('invisible')
} 
initializeObjectDetector()

const imageContainers = document.getElementsByClassName(
  "detectOnClick"
) as HTMLCollectionOf<HTMLDivElement>

for(const iamgeContainer of imageContainers){
  const img = iamgeContainer.children[0] as HTMLImageElement
  img.addEventListener("click", handleClick)
}

async function handleClick(event: Event):Promise<void>{
  const target = event.target as HTMLImageElement
  const parent = target.parentNode as HTMLElement
  const highlighters = parent.getElementsByClassName('highlighter')
  while(highlighters[0]){
    highlighters[0].parentNode?.removeChild(highlighters[0])
  }

  const infos = parent.getElementsByClassName('info')
  while(infos[0]){
    infos[0].parentNode?.removeChild(infos[0])
  }
  if(!ObjectDetector){
    alert('Object detector is still loading, Please try again'); return
  }

  if(runningMode === 'VIDEO'){
    runningMode = 'IMAGE'
    await ObjectDetector.setOptions({runningMode: 'IMAGE'})
  }

  const detections = await ObjectDetector.detect(target);
  displayImageDetections(detections,target);
}

function displayImageDetections(
  result: ObjectDetectionResult,
  resultElement: HTMLImageElement
): void {
  const ratio = resultElement.height / resultElement.naturalHeight
  for (const detection of result.detections){
   const p = document.createElement('p')
   p.className = 'info' 
   p.innerText = `${detection.categories[0].categoryName} - with${Math.round(
    detection.categories[0].score * 100
   )} % confidence.`
   p.style.cssText = `
   left:${detection.boundingBox.originX * ratio} px;
   top:${detection.boundingBox.originY * ratio} px;
   width:${detection.boundingBox.width * ratio - 10} px;`;

   const highlighter = document.createElement('div')
   highlighter.className = 'highlighter'
   highlighter.style.cssText =`
    left:${detection.boundingBox.originX * ratio} px;
    top:${detection.boundingBox.originY * ratio} px;
    width:${detection.boundingBox.width * ratio} px;
    hight:${detection.boundingBox.height * ratio} px;`;

   resultElement.parentNode?.appendChild(highlighter)
   resultElement.parentNode?.appendChild(p)
  }
}

let video = document.getElementById('webcam') as HTMLVideoElement
const lineView = document.getElementById('lineView') as HTMLElement
const enableWebcamButton = document.getElementById('webcamButton') as HTMLButtonElement
let children : HTMLElement[] = []

function hasGetUserMedia() : boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

if(hasGetUserMedia()){
  enableWebcamButton.addEventListener('click',enableCam)
} else {
  console.warn("getUserMedia() os not supported by your browser")
}

async function enableCam(): Promise<void>{
  if(!objectDetector){
    console.log("Wait! object Detectior not loaded yet"); return
  }

  enableWebcamButton.classList.add('removed')
  const constaraints = {video: true}
  try{
    const stream = await navigator.mediaDevices.getUserMedia(constaraints)
    video.srcObject = stream
    video.addEventListener('loadeddate', predictWebcam)
  } catch(err){
    console.error(err)
  }
}

let lastVideoTime = -1
async function predictWebcam() : Promise<void> {
  if(runningMode === 'IMAGE'){
    runningMode = 'VIDEO'
    await objectDetector.setOptions({ runningMode: 'VIDEO'})
  }
  const startTimeMs = performance.now()

  if(video.currentTime !== lastVideoTime){
    lastVideoTime = video.currentTime
    const detections = await objectDetector.detectForVideo(video, startTimeMs)
    displayVideoDetections(detections)
  }
  window.requestAnimationFrame(predictWebcam)
}

function displayVideoDetections(result:ObjectDetectionResult) : void {
  for(const child of children){
    lineView.removeChild(child)
  }
  children = [];
  for(const detection of result.detections){
    const p = document.createElement('p')
    p.innerText = `${detection.categories[0].categoryName} - with${Math.round(
      detection.categories[0].score * 100
    )} % confidence.`
    p.style.cssText = `left: ${video.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px;
      top: ${detection.boundingBox.originY}px;
      width: ${detection.boundingBox.width - 10}px;`;

    const highlighter = document.createElement('div')
    highlighter.className = 'highlighter'
    highlighter.style.cssText =`left: ${video.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px;
      top: ${detection.boundingBox.originY}px;
      width: ${detection.boundingBox.width - 10}px;
      height: ${detection.boundingBox.height}px;`;
    
      lineView.appendChild(highlighter)
      lineView.appendChild(p)
      children.push(highlighter, p)
  }
}

export default ObjectDetector
import React, { useEffect, useRef } from 'react';
import Button from '@mui/material/Button';
import { ObjectDetectorHandler } from './Object_Detector';

const ObjectDetectionUI: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lineViewRef = useRef<HTMLDivElement>(null);
  const objectDetectorRef = useRef<ObjectDetectorHandler | null>(null);

  useEffect(() => {
    objectDetectorRef.current = new ObjectDetectorHandler();
    objectDetectorRef.current.initialize();

    const imageContainers = document.getElementsByClassName("detectOnClick");
    for (const imageContainer of imageContainers) {
      const img = imageContainer.children[0] as HTMLImageElement;
      img.addEventListener("click", (event) => objectDetectorRef.current!.handleImageClick(event));
    }
  }, []);

  const imageFiles = ['pancake.jpeg', 'por.jpeg', 'retrocar.jpeg']; 

  const enableCam = async () => {
    if (videoRef.current && lineViewRef.current) {
      await objectDetectorRef.current?.enableCam(videoRef.current, lineViewRef.current);
    }
  };

  return (
    <div>
      <h1>Отслеживание обектов с помощью mediapipe</h1>

      <section id="demos">
        <h2>Возможности отслеживания</h2>
        <p><b>нажмите на картинку!</b><br/>и она должна отобразиться</p>

        {imageFiles.map((imageFile, index) => (
          <div key={index} className="detectOnClick">
            <img
              src={`/images/${imageFile}`} // Путь к изображению в папке public/images
              width="50%"
              crossOrigin="anonymous"
              title="Click to get classification!"
            />
          </div>
        ))}

        <h2>Продолжаем показывать возможности</h2>
        <p>Поместите какой любо обьект перед камерой должно показать на экране что за предмет и его название в реальном времени</p>
        
        <div id="liveView" className="videoView">
          <Button id="webcamButton" variant="contained" onClick={enableCam}>
            Включение Камеры
          </Button>
          <video id="webcam" ref={videoRef} autoPlay playsInline></video>
          <div id="lineView" ref={lineViewRef}></div>
        </div>
      </section>
    </div>
  );
};

export default ObjectDetectionUI;
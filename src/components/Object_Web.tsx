import React, { useEffect, useRef, useState } from 'react';
import { Box, Grid, Typography, Container, styled, Button } from '@mui/material';
import { ObjectDetectorHandler } from './Object_Detector';

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0f0f1a 0%, #1e1e3a 100%)',
  color: '#ffffff',
  padding: theme.spacing(8, 2),
  textAlign: 'center',
  borderRadius: '16px',
  marginBottom: theme.spacing(6),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
}));

const FeatureCard = styled(Box)(({ theme }) => ({
  background: 'rgba(30, 30, 58, 0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  padding: theme.spacing(4),
  height: '100%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    borderColor: 'rgba(255, 255, 255, 0.3)'
  }
}));

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  height: '300px',
  background: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px dashed rgba(255, 255, 255, 0.2)',
  marginTop: theme.spacing(2)
}));

const ObjectDetectionUI: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lineViewRef = useRef<HTMLDivElement>(null);
  const objectDetectorRef = useRef<ObjectDetectorHandler | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageFiles = ['pancake.jpeg', 'por.jpeg', 'retrocar.jpeg'];

  useEffect(() => {
    const init = async () => {
      try {
        objectDetectorRef.current = new ObjectDetectorHandler();
        await objectDetectorRef.current.initialize();
        setIsInitialized(true);
        
        // Setup image click handlers
        const images = document.querySelectorAll('.detectOnClick img');
        images.forEach(img => {
          img.addEventListener('click', (e) => {
            if (objectDetectorRef.current) {
              objectDetectorRef.current.handleImageClick(e);
            }
          });
        });
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to initialize object detector");
      }
    };

    init();

    return () => {
      if (objectDetectorRef.current) {
        objectDetectorRef.current.disableCam();
      }
    };
  }, []);

  const toggleCamera = async () => {
    if (!isInitialized || !videoRef.current || !lineViewRef.current) return;

    try {
      if (isCameraActive) {
        objectDetectorRef.current?.disableCam();
        setIsCameraActive(false);
      } else {
        await objectDetectorRef.current?.enableCam(videoRef.current, lineViewRef.current);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HeroSection>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Object Detection Demo
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: '800px', margin: '0 auto', opacity: 0.9, mb: 4 }}>
          Click on images or enable camera for real-time detection
        </Typography>
      </HeroSection>

      {error && (
        <Box sx={{ color: 'error.main', textAlign: 'center', mb: 2 }}>
          {error}
        </Box>
      )}

      <Grid container spacing={4}>
        {/* Image Detection */}
        <Grid item xs={12} md={6}>
          <FeatureCard>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#88d3ce' }}>
              Image Detection
            </Typography>
            <Typography paragraph sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Click on any image below to detect objects
            </Typography>

            <Grid container spacing={2}>
              {imageFiles.map((imageFile, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box className="detectOnClick" sx={{ 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    position: 'relative'
                  }}>
                    <img
                      src={`/images/${imageFile}`}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                      crossOrigin="anonymous"
                      alt={`Sample ${index + 1}`}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </FeatureCard>
        </Grid>

        {/* Real-time Detection */}
        <Grid item xs={12} md={6}>
          <FeatureCard>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#88d3ce' }}>
              Real-time Detection
            </Typography>
            <Typography paragraph sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Enable camera to detect objects in real-time
            </Typography>

            <Button
              variant="contained"
              onClick={toggleCamera}
              fullWidth
              disabled={!isInitialized}
              sx={{
                background: 'linear-gradient(90deg, #6e45e2 0%, #88d3ce 100%)',
                color: '#fff',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '50px',
                mb: 2,
                '&:hover': {
                  boxShadow: '0 4px 15px rgba(110, 69, 226, 0.4)'
                }
              }}
            >
              {isCameraActive ? 'Disable Camera' : 'Enable Camera'}
            </Button>

            <VideoContainer>
              {!isCameraActive ? (
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Camera is disabled
                </Typography>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div 
                    ref={lineViewRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}
                  />
                </>
              )}
            </VideoContainer>
          </FeatureCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ObjectDetectionUI;
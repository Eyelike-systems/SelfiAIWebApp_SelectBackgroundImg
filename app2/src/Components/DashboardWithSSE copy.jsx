import React, { useEffect, useRef, useState } from "react";
import config from "../config";
import "../App.css";
import html2canvas from "html2canvas";
import domtoimage from "dom-to-image";
import gsap from "gsap";
import "../static/css/animation.css";
import ganeshVideo from "../static/images/ganapatiVideo.mp4";
import guruDevDattaVideo from "../static/images/GuruDevDatta.mp4";
import MahaLakshiDevi from "../static/images/MahaLakshiDevi.mp4";
import { startAnimation, stopAnimation } from "../utils/animationUtils";
import Hls from "hls.js"; // Import hls.js for HLS support
// import logo from "../static/images/eyelikesystemsLogo.jpg"
import logo from "../static/images/eyelikesystemsLogo.jpg"
import dagdushetNewV from "../static/images/dagdushetNewV.mp4"

function DashboardWithSSE() {
  const [animationEnded, setAnimationEnded] = useState(false);
  const videoRef = useRef(null);
  const cameraContainerRef = useRef(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [imageDataArray, setImageDataArray] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);



    // Fetch the camera stream or fallback video
  const getCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraError(false);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError(true);
    }
  };

  useEffect( () => {
    // getCameraStream()
  }, [])



  useEffect(() => {
    const eventSource = new EventSource(`${config.BACKEND_SSE_API}/items`);

      eventSource.onmessage = (event) => {
        try {
          const incomingArray = JSON.parse(event.data); // Example: [{id: 87}, ..., {id: 91}]

          setImageDataArray((prevArray) => {
            const updatedMap = new Map();

            // Add previous data first
            prevArray.forEach((item) => {
              updatedMap.set(item.id, item);
            });

            // Add new incoming data (replace if exists)
            incomingArray.forEach((data) => {
              updatedMap.set(data.id, {
                ...data,
                screenshotSent: false,
                animationTriggered: false,
              });
            });

            // Convert map to array, sort by id descending (91, 90, 89...) and take top 5
            const sortedArray = Array.from(updatedMap.values())
              .sort((a, b) => b.id - a.id)
              .slice(0, 10);  // 10 images for loop

            return sortedArray;
          });
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };      

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
      };

    return () => {
      eventSource.close();
    };
  }, []);



  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (imageDataArray.length > 0 && !isProcessing) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % imageDataArray.length;
          const currentImage = imageDataArray[newIndex];

          if (currentImage && (!currentImage.screenshotSent || !currentImage.animationTriggered)) {
            setIsProcessing(true); // Block next cycle

            // Mark screenshot sent
            if (!currentImage.screenshotSent) {
              setImageDataArray((prevArray) =>
                prevArray.map((item, index) =>
                  index === newIndex ? { ...item, screenshotSent: true } : item
                )
              );
              setTimeout(() => {
                captureScreenshot(currentImage);
              }, 5000);
            }

            // Trigger animation
            if (!currentImage.animationTriggered) {
              startAnimation();
              setImageDataArray((prevArray) =>
                prevArray.map((item, index) =>
                  index === newIndex ? { ...item, animationTriggered: true } : item
                )
              );
              setTimeout(() => {
                stopAnimation();
                setIsProcessing(false); // Allow next image to process
              }, 5000);
            } else {
              // Still need to unblock if no animation
              setTimeout(() => setIsProcessing(false), 5000);
            }
          }

          return newIndex;
        });
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [imageDataArray, isProcessing]);


  const captureScreenshot = (currentImage) => {
    if (cameraContainerRef.current && videoRef.current) {
      const container = cameraContainerRef.current;
      const video = videoRef.current;

      const width = container.offsetWidth;
      const height = container.offsetHeight;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(video, 0, 0, width, height); // draw video

      domtoimage
        .toPng(container, {
          filter: (node) => node !== video, // skip video element (already drawn)
        })
        .then((overlayUrl) => {
          const overlayImg = new Image();
          overlayImg.onload = () => {
            ctx.drawImage(overlayImg, 0, 0, width, height);
            const finalImage = canvas.toDataURL("image/png");

            // Send to backend
            fetch(`${config.BACKEND_UPLOAD_API}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                screenshot: finalImage,
                customer_name: currentImage.customer_name,
                customer_phone: currentImage.customer_phone,
                order_id: currentImage.order_id
              }),
            })
              .then((res) => res.json())
              .then((data) =>
                console.log("Screenshot sent successfully:", data)
              )
              .catch((err) => console.error("Error sending screenshot:", err));
          };
          overlayImg.src = overlayUrl;
        });
    }
  };

  // For live cam feed used below useEffect ------ start-------------------------

  // useEffect(() => {
  //   if (videoRef.current && Hls.isSupported()) {
  //     const hls = new Hls({
  //       startLevel: -1, // Automatically select the best quality level
  //       capLevelToPlayerSize: true, // Limit the video quality to the size of the player
  //       maxMaxBufferLength: 30, // Reduce the maximum buffer size (default is 60)
  //       maxBufferLength: 10, // Limit buffer length
  //       maxBufferSize: 50 * 1000 * 1000, // Max buffer size
  //       bufferStarvationLimit: 2, // Increase this to reduce stalls
  //       highBufferWatchdogPeriod: 3, // Watchdog to prevent excessive buffering
  //       lowBufferWatchdogPeriod: 1, // Reduce to reduce startup buffering delay
  //       liveSyncDuration: 0, // Reduce live sync delay to improve live latency
  //       liveMaxLatencyDuration: 5, // Limit max latency in seconds
  //     });
  
  //     // hls.loadSource('http://localhost:3000/stream/output.m3u8');
  //     hls.loadSource(`${config.BACKEND_API_RTSP}/stream/output.m3u8`);
  //     hls.attachMedia(videoRef.current);
  //     hls.on(Hls.Events.MANIFEST_PARSED, function () {
  //       console.log('Manifest loaded');
  //     });
  //   } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
  //     // Safari natively supports HLS
  //     videoRef.current.src = 'http://localhost:3000/stream/output.m3u8';
  //   }
  // }, []);
  // For live cam feed used above useEffect ------ end-------------------------

  return (
    <div
      className="camera-container"
      id="container"
      ref={cameraContainerRef}
      >
      <video
        ref={videoRef}
        src={mediaFile || dagdushetNewV}
        autoPlay
        loop
        muted
        className="camera-feed"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo-fade" style={{ width:"30%"}} />
      </div>

      {imageDataArray.length > 0 && (
        <>
          <div className="parent-container">
            <div className="user-info">
              <h1 className="user-slogan">
                {imageDataArray[currentIndex]?.slogan}
              </h1>
              <h1 className="user-name">
                ~ {imageDataArray[currentIndex]?.customer_name} 
              </h1> 
            </div>
          </div>
          <div className="corner-wrapper">
            <img
              src={imageDataArray[currentIndex]?.image_base64}
              alt="Received"
              className="corner-image"
            />
          </div>
          <div className="copyright-text">
            © Copyright Protected
          </div>

        </>
      )}
    </div>
  );
}

export default DashboardWithSSE;

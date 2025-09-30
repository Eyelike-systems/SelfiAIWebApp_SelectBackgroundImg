import React, { useEffect, useRef, useState } from "react";
import config from "../../config";
import "../App.css";
import html2canvas from "html2canvas";
import domtoimage from "dom-to-image";
import gsap from "gsap";
import "../static/css/animation.css";
import ganeshVideo from "../static/images/ganapatiVideo.mp4";
import guruDevDattaVideo from "../static/images/GuruDevDatta.mp4";

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
        const dataArray = JSON.parse(event.data);
        setImageDataArray((prevArray) => {
          // console.log("received data from backend: ", imageDataArray)
          const updatedArray = [...prevArray];
          dataArray.forEach((data) => {
            if (!updatedArray.some((item) => item.id === data.id)) {
              if (updatedArray.length >= 9) updatedArray.shift();
              updatedArray.push({
                ...data,
                screenshotSent: false,
                animationTriggered: false,
              });
            }
          });
          return updatedArray;
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

  useEffect(() => {
    if (imageDataArray.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % imageDataArray.length;
          const currentImage = imageDataArray[newIndex];

          if (currentImage && !currentImage.screenshotSent) {
            setImageDataArray((prevArray) =>
              prevArray.map((item, index) =>
                index === newIndex ? { ...item, screenshotSent: true } : item
              )
            );

            // Capture screenshot after 1 second of animation
            setTimeout(() => {
              captureScreenshot(currentImage);
            }, 5000);
          }

          if (currentImage && !currentImage.animationTriggered) {
            startAnimation();
            setImageDataArray((prevArray) =>
              prevArray.map((item, index) =>
                index === newIndex
                  ? { ...item, animationTriggered: true }
                  : item
              )
            );
            setTimeout(() => {
              stopAnimation();
            }, 5000);
          }

          return newIndex;
        });
      }, 6000); // cycle every 6 seconds

      return () => clearInterval(interval);
    }
  }, [cameraContainerRef, imageDataArray]);

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

  const startAnimation = () => {
    gsap.set("#container", { perspective: 600 });
    gsap.set("img", { xPercent: "-50%", yPercent: "-50%" });

    const total = 30;
    const warp = document.getElementById("container");
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < total; i++) {
      const Div = document.createElement("div");
      gsap.set(Div, {
        attr: { class: "dot" },
        x: R(0, w),
        y: R(-200, -150),
        z: R(-200, 200),
      });
      warp.appendChild(Div);
      animm(Div);
    }

    function animm(elm) {
      gsap.to(elm, R(6, 15), {
        y: h + 100,
        ease: "none",
        repeat: -1,
        delay: -15,
      });
      gsap.to(elm, R(4, 8), {
        x: "+=100",
        rotationZ: R(0, 180),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(elm, R(2, 8), {
        rotationX: R(0, 360),
        rotationY: R(0, 360),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: -5,
      });
    }

    function R(min, max) {
      return min + Math.random() * (max - min);
    }
  };

  const stopAnimation = () => {
    gsap.killTweensOf("#container .dot");
    const flowers = document.querySelectorAll("#container .dot");
    flowers.forEach((flower) => flower.remove());
    setAnimationEnded(true);
  };

  return (
    <div
      className="camera-container"
      id="container"
      ref={cameraContainerRef}
      >
      <video
        ref={videoRef}
        src={mediaFile || guruDevDattaVideo}
        autoPlay
        loop
        muted
        className="camera-feed"
        style={{ width: "100%", height: "100%" }}
      />

      {imageDataArray.length > 0 && (
        <>
          <div
            style={{
              position: "absolute",
              top: "78%",
              left: "52%",
              transform: "translateX(-50%)",
              color: "red",
              fontSize: "65px",
              fontWeight: "bold",
              zIndex: 2,
            }}
            >
            {imageDataArray[currentIndex]?.customer_name} " {imageDataArray[currentIndex]?.slogan} "
          </div>
          <div className="corner-wrapper">
            <img
              src={imageDataArray[currentIndex]?.image_base64}
              alt="Received"
              className="corner-image"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardWithSSE;

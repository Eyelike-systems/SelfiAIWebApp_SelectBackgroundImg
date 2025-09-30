import { useEffect, useState } from "react";
import config from "../config";

const useLocationAndDeviceCheck = () => {
  const [isMobile, setIsMobile] = useState(true);
  const [isAllowed, setIsAllowed] = useState(null);
  const [distanceAway, setDistanceAway] = useState(null);

  useEffect(() => {
    const mobileCheck = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    console.log("mobileCheck: ", mobileCheck)
    setIsMobile(mobileCheck);

    if (!mobileCheck) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(`${config.IP_ADDRESS}/location-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude, deviceType: "mobile" })
          });

          const data = await res.json();
          if (data.allowed) {
            setIsAllowed(true);
          } else {
            setIsAllowed(false);
            setDistanceAway(data.distance);
          }
        } catch (err) {
          console.error("Location fetch error:", err);
          setIsAllowed(false);
        }
      },
      (err) => {
        console.error("Location access denied", err);
        setIsAllowed(false);
      }
    );
  }, []);

  return { isMobile, isAllowed, distanceAway };
};

export default useLocationAndDeviceCheck;

import { useEffect } from "react";

declare global {
  interface Window {
    google?: {
      maps?: unknown;
    };
    __googleMapsLoaded?: boolean;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

const GoogleMapsLoader = () => {
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      return;
    }

    if (window.google?.maps) {
      window.__googleMapsLoaded = true;
      return;
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.__googleMapsLoaded = true;
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__googleMapsLoaded = true;
    };
    document.head.appendChild(script);
  }, []);

  return null;
};

export default GoogleMapsLoader;
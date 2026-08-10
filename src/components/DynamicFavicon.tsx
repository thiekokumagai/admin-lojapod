import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { buildImageUrl } from "@/utils/image-url";

export function DynamicFavicon() {
  const { data: settings } = useSettings();

  useEffect(() => {
    if (settings) {
      if (settings.faviconUrl) {
        const href = buildImageUrl(settings.faviconUrl);
        
        // Update standard favicon
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.getElementsByTagName("head")[0].appendChild(link);
        }
        link.href = href;

        // Update apple-touch-icon if it exists or create it
        let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (!appleLink) {
          appleLink = document.createElement("link");
          appleLink.rel = "apple-touch-icon";
          document.getElementsByTagName("head")[0].appendChild(appleLink);
        }
        appleLink.href = href;
      }
      
      const storeName = settings.storeName || "Lojapod";
      document.title = `${storeName}`;
    }
  }, [settings]);

  return null;
}

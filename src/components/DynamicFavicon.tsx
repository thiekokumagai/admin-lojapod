import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { buildImageUrl } from "@/utils/image-url";
import { isSuperAdmin } from "@/lib/auth";

export function DynamicFavicon() {
  const { data: settings } = useSettings();
  const superAdmin = isSuperAdmin();

  useEffect(() => {
    if (superAdmin) {
      document.title = "Super Admin | Loja Pod";
      const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = "/favicon.ico";
      }
      return;
    }

    if (settings) {
      const href = settings.faviconUrl
        ? buildImageUrl(settings.faviconUrl)
        : "/favicon-192x192.png";
      
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
      
      const storeName = (settings.storeName && settings.storeName !== "undefined")
        ? settings.storeName
        : "Loja Pod";
      document.title = `${storeName};
    }
  }, [settings, superAdmin]);

  return null;
}

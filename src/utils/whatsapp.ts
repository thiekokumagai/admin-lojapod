export function openWhatsApp(phone: string, text: string = "") {
  if (!phone) return;
  const phoneStr = phone.replace(/\D/g, "");
  if (!phoneStr) return;
  const numero = phoneStr.startsWith("55") ? phoneStr : `55${phoneStr}`;
  const message = text ? encodeURIComponent(text) : "";

  const urlApp = `whatsapp://send?phone=${numero}${message ? `&text=${message}` : ""}`;
  const urlWeb = `https://wa.me/${numero}${message ? `?text=${message}` : ""}`;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = urlApp;
    setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.open(urlWeb, "_blank", "noopener,noreferrer");
      }
    }, 1500);
  } else {
    window.open(urlWeb, "_blank", "noopener,noreferrer");
  }
}

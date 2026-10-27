export function formatWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (!clean) return "";

  // Se o número tem 10 ou 11 dígitos (padrão Brasil: DDD + celular/fixo),
  // adiciona o DDI 55 do Brasil. Evita que DDD 66 (Mato Grosso) seja interpretado como Tailândia (+66).
  if (clean.length <= 11) {
    return `55${clean}`;
  }

  // Se tem 12 ou 13 dígitos e começa com 55, já possui o DDI
  if ((clean.length === 12 || clean.length === 13) && clean.startsWith("55")) {
    return clean;
  }

  return clean;
}

export function openWhatsApp(phone: string, text: string = "") {
  if (!phone) return;
  const numero = formatWhatsAppNumber(phone);
  if (!numero) return;
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

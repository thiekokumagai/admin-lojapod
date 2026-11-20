export function getPlatformBaseDomain(): "podipedir.com.br" | "lojapod.com" {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === "lojapod.com" || hostname.endsWith(".lojapod.com")) {
      return "lojapod.com";
    }
  }
  return "podipedir.com.br";
}

export function getStoreDomainSuffix(): string {
  return `.${getPlatformBaseDomain()}`;
}

export function formatStoreHost(subdomain?: string, customDomain?: string | null): string {
  if (customDomain) {
    return customDomain;
  }
  return `${subdomain || ""}${getStoreDomainSuffix()}`;
}

export function getWebhookApiBaseUrl(): string {
  const baseDomain = getPlatformBaseDomain();
  let base = import.meta.env.VITE_ADMIN_API || `https://api.${baseDomain}`;
  if (baseDomain === "podipedir.com.br" && base.includes("api.lojapod.com")) {
    base = base.replace("api.lojapod.com", "api.podipedir.com.br");
  } else if (baseDomain === "lojapod.com" && base.includes("api.podipedir.com.br")) {
    base = base.replace("api.podipedir.com.br", "api.lojapod.com");
  }
  return base;
}

export function getStoreUrl(subdomain?: string, customDomain?: string | null): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  if (!subdomain) return "#";
  if (typeof window === "undefined") return `https://${subdomain}.podipedir.com.br`;

  const hostname = window.location.hostname.toLowerCase();
  const port = window.location.port ? `:${window.location.port}` : "";
  const protocol = window.location.protocol;

  if (hostname.includes("localhost")) {
    return `${protocol}//${subdomain}.localhost${port}`;
  }
  return `${protocol}//${subdomain}.${getPlatformBaseDomain()}`;
}

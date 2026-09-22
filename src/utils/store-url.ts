export function getStoreUrl(subdomain?: string, customDomain?: string | null): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  if (!subdomain) return '#';
  if (typeof window === 'undefined') return `https://${subdomain}.lojapod.com`;
  
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  if (hostname.includes('localhost')) {
    return `${protocol}//${subdomain}.localhost${port}`;
  }
  return `${protocol}//${subdomain}.lojapod.com`;
}

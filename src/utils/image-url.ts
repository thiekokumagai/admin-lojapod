export function buildImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  const bucket = (import.meta.env.VITE_MINIO_BUCKET || "").replace(/['"]/g, "").trim();
  const publicUrl = (import.meta.env.VITE_MINIO_PUBLIC_URL || "").replace(/['"]/g, "").trim().replace(/\/$/, "");
  const cleanPath = imagePath.replace(/^\//, "");

  if (!bucket) {
    return `${publicUrl}/${cleanPath}`;
  }

  return `${publicUrl}/${bucket}/${cleanPath}`;
}
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ExternalLink, X, ZoomIn } from "lucide-react";
import { buildImageUrl } from "@/utils/image-url";

export interface ImagePreviewModalProps {
  images: Array<{ url: string; title?: string } | string>;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ImagePreviewModal({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  if (!images || images.length === 0) return null;

  const safeIndex = Math.min(Math.max(0, currentIndex), images.length - 1);
  const currentItem = images[safeIndex];
  const rawUrl = typeof currentItem === "string" ? currentItem : currentItem?.url;
  const fullUrl = buildImageUrl(rawUrl);
  const imageTitle = typeof currentItem === "object" ? currentItem.title : undefined;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl w-[95vw] p-0 overflow-hidden bg-black/95 border-slate-800 text-white shadow-2xl focus:outline-none"
        onKeyDown={handleKeyDown}
        hideCloseButton
      >
        <DialogTitle className="sr-only">
          {title || imageTitle || "Visualização da Imagem"}
        </DialogTitle>

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10 text-xs sm:text-sm">
          <div className="flex items-center gap-2 truncate font-medium text-white/90">
            <ZoomIn className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{title || imageTitle || "Imagem do produto"}</span>
            {images.length > 1 && (
              <span className="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70 font-mono">
                {safeIndex + 1} de {images.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {fullUrl && (
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
                title="Abrir imagem original em nova aba"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Abrir original</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Image container */}
        <div className="relative flex items-center justify-center min-h-[350px] max-h-[75vh] p-4 sm:p-6 bg-black/40">
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all transform -translate-y-1/2 top-1/2 backdrop-blur-sm border border-white/10 shadow-lg"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {fullUrl ? (
            <img
              src={fullUrl}
              alt={title || "Imagem do produto"}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-md select-none transition-all duration-200 shadow-xl"
            />
          ) : (
            <div className="text-white/60 text-sm">Imagem indisponível</div>
          )}

          {images.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all transform -translate-y-1/2 top-1/2 backdrop-blur-sm border border-white/10 shadow-lg"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Thumbnails bar if multiple images */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 bg-black/80 border-t border-white/10 overflow-x-auto">
            {images.map((img, idx) => {
              const url = buildImageUrl(typeof img === "string" ? img : img.url);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-12 w-12 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                    idx === safeIndex
                      ? "border-primary ring-2 ring-primary/40 opacity-100 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

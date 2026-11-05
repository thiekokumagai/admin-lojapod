import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ChevronLeft, ChevronRight, Crop, Eye, Trash2, Upload } from "lucide-react";
import { buildImageUrl } from "@/utils/image-url";
import { getCroppedFileFromUrl } from "@/utils/image-crop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";
import type { ProductImage } from "@/types/product";

type PendingImage = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
  originalFile?: File;
  originalPreviewUrl?: string;
};

type SavedImageCropTarget = {
  id: string;
  url: string;
};

type PendingImageCropTarget = {
  id: string;
};

type ProductImageManagerProps = {
  images: ProductImage[];
  pendingImages: PendingImage[];
  isUploading: boolean;
  isDeletingImage: boolean;
  isUpdatingImage?: boolean;
  onPendingImagesChange: (files: File[]) => void;
  onRemovePendingImage: (id: string) => void;
  onUpdatePendingImage?: (id: string, newFile: File) => void;
  onDeleteImage: (imageId: string) => void;
  onReplaceImage?: (imageId: string, file: File) => Promise<void> | void;
  /** Recebe os IDs das imagens salvas na nova ordem (a primeira é a principal). */
  onReorderImages?: (imageIds: string[]) => void;
  isReordering?: boolean;
};

const MAX_IMAGES = 6;

export function ProductImageManager({
  images,
  pendingImages,
  isUploading,
  isDeletingImage,
  isUpdatingImage = false,
  onPendingImagesChange,
  onRemovePendingImage,
  onUpdatePendingImage,
  onDeleteImage,
  onReplaceImage,
  onReorderImages,
  isReordering = false,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [savedCropTarget, setSavedCropTarget] = useState<SavedImageCropTarget | null>(null);
  const [pendingCropTarget, setPendingCropTarget] = useState<PendingImageCropTarget | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Large image viewer modal state
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const allPreviewImages = useMemo(() => {
    const saved = images.map((img) => ({ url: img.url }));
    const pending = pendingImages.map((img) => ({ url: img.previewUrl }));
    return [...saved, ...pending];
  }, [images, pendingImages]);

  const cropImageUrl = useMemo(() => {
    if (savedCropTarget) return buildImageUrl(savedCropTarget.url);
    if (pendingCropTarget) {
      const pendingImage = pendingImages.find(img => img.id === pendingCropTarget.id);
      return pendingImage?.originalPreviewUrl || pendingImage?.previewUrl || null;
    }
    return null;
  }, [savedCropTarget, pendingCropTarget, pendingImages]);

  const totalImages = images.length + pendingImages.length;
  const remainingSlots = Math.max(0, MAX_IMAGES - totalImages);

  useEffect(() => {
    if (savedCropTarget || pendingCropTarget) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [savedCropTarget, pendingCropTarget]);

  const closeCropDialog = () => {
    setSavedCropTarget(null);
    setPendingCropTarget(null);
  };

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);

    if (acceptedFiles.length < files.length) {
      toast({ title: `Você pode adicionar no máximo ${MAX_IMAGES} fotos.` });
    }

    if (acceptedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const nextFiles = [...pendingImages.map((image) => image.file), ...acceptedFiles];
    onPendingImagesChange(nextFiles);
    event.target.value = "";
  };

  const handleApplyCrop = useCallback(async () => {
    if (!croppedAreaPixels || (!savedCropTarget && !pendingCropTarget)) {
      return;
    }

    setIsCropping(true);

    try {
      if (savedCropTarget && onReplaceImage) {
        const cropped = await getCroppedFileFromUrl(
          buildImageUrl(savedCropTarget.url),
          croppedAreaPixels,
          `cropped-${savedCropTarget.id}.jpg`,
        );
        await onReplaceImage(savedCropTarget.id, cropped);
      } else if (pendingCropTarget && onUpdatePendingImage) {
        const pendingImage = pendingImages.find(img => img.id === pendingCropTarget.id);
        if (pendingImage) {
          const cropped = await getCroppedFileFromUrl(
            pendingImage.originalPreviewUrl || pendingImage.previewUrl,
            croppedAreaPixels,
            `cropped-${pendingImage.id}.jpg`,
          );
          onUpdatePendingImage(pendingImage.id, cropped);
        }
      }
      closeCropDialog();
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível recortar a imagem",
      });
    } finally {
      setIsCropping(false);
    }
  }, [croppedAreaPixels, onReplaceImage, savedCropTarget]);

  const handleMoveSavedImage = (from: number, to: number) => {
    if (!onReorderImages || to < 0 || to >= images.length) return;
    const ids = images.map((img) => img.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    onReorderImages(ids);
  };

  const slots = Array.from({ length: MAX_IMAGES }, (_, index) => {
    const savedImage = images[index];
    if (savedImage) {
      return { type: "saved" as const, key: `saved-${savedImage.id}`, image: savedImage, index };
    }

    const pendingImage = pendingImages[index - images.length];
    if (pendingImage) {
      return { type: "pending" as const, key: `pending-${pendingImage.id}`, image: pendingImage, index };
    }

    return { type: "empty" as const, key: `empty-${index}`, index };
  });

  const actionBtn =
    "flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-xl">Fotos do produto</CardTitle>
          <span className="text-xs text-muted-foreground shrink-0">
            {totalImages}/{MAX_IMAGES}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelectFiles}
        />
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map((slot) => {
            if (slot.type === "empty") return null;

            const isSaved = slot.type === "saved";
            const isMain = slot.index === 0;
            const src = isSaved ? buildImageUrl(slot.image.url) : slot.image.previewUrl;
            const busy = isSaved ? isDeletingImage || isUpdatingImage || isReordering : isUploading;
            const canReorder = isSaved && !!onReorderImages && images.length > 1;
            const canCrop = isSaved ? !!onReplaceImage : !!onUpdatePendingImage;

            return (
              <div
                key={slot.key}
                className={`group relative aspect-square overflow-hidden rounded-xl border bg-muted ${
                  isMain ? "ring-2 ring-primary ring-offset-1" : ""
                }`}
              >
                <img
                  src={src}
                  alt={isSaved ? `Imagem ${slot.index + 1}` : slot.image.name}
                  className="h-full w-full cursor-pointer object-cover"
                  onClick={() => setPreviewIndex(slot.index)}
                />

                {isMain ? (
                  <span className="pointer-events-none absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Principal
                  </span>
                ) : !isSaved ? (
                  <span className="pointer-events-none absolute left-1 top-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Nova
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => (isSaved ? onDeleteImage(slot.image.id) : onRemovePendingImage(slot.image.id))}
                  disabled={busy}
                  title={isSaved ? "Excluir imagem" : "Remover imagem"}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1">
                  {canReorder ? (
                    <button
                      type="button"
                      onClick={() => handleMoveSavedImage(slot.index, slot.index - 1)}
                      disabled={slot.index === 0 || busy}
                      title="Mover para a esquerda"
                      className={actionBtn}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="h-6 w-6" />
                  )}

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(slot.index)}
                      title="Ver imagem grande"
                      className={actionBtn}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {canCrop ? (
                      <button
                        type="button"
                        onClick={() =>
                          isSaved
                            ? setSavedCropTarget({ id: slot.image.id, url: slot.image.url })
                            : setPendingCropTarget({ id: slot.image.id })
                        }
                        disabled={busy}
                        title="Recortar imagem"
                        className={actionBtn}
                      >
                        <Crop className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {canReorder ? (
                    <button
                      type="button"
                      onClick={() => handleMoveSavedImage(slot.index, slot.index + 1)}
                      disabled={slot.index === images.length - 1 || busy}
                      title="Mover para a direita"
                      className={actionBtn}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="h-6 w-6" />
                  )}
                </div>
              </div>
            );
          })}

          {remainingSlots > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 px-1 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="mb-1 h-6 w-6" />
              <span className="text-[11px] font-medium">{totalImages === 0 ? "Adicionar fotos" : "Adicionar"}</span>
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP. A primeira imagem é a principal (aparece na vitrine e nos pedidos). Use as setas para reordenar e toque na foto para ver em tamanho grande.
        </p>

        {/* Large Image Modal */}
        <ImagePreviewModal
          isOpen={previewIndex !== null}
          initialIndex={previewIndex ?? 0}
          images={allPreviewImages}
          onClose={() => setPreviewIndex(null)}
          title="Foto do Produto"
        />

        {/* Crop Dialog */}
        <Dialog open={!!savedCropTarget || !!pendingCropTarget} onOpenChange={(open) => !open && closeCropDialog()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Recortar imagem</DialogTitle>
            </DialogHeader>

            {cropImageUrl ? (
              <div className="space-y-4">
                <div className="relative h-[420px] overflow-hidden rounded-xl bg-black">
                  <Cropper
                    image={cropImageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Zoom</p>
                  <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(value) => setZoom(value[0] ?? 1)} />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCropDialog}
                    disabled={isCropping}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApplyCrop()}
                    disabled={isCropping || isUpdatingImage}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    {isCropping || isUpdatingImage ? "Aplicando..." : "Aplicar crop"}
                  </button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
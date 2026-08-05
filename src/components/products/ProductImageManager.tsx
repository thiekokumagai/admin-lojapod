import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Crop, Eye, ImageIcon, Plus, X } from "lucide-react";
import { buildImageUrl } from "@/utils/image-url";
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
};

const MAX_IMAGES = 6;

function createImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

async function getCroppedFile(file: File, area: Area) {
  const imageUrl = URL.createObjectURL(file);
  const image = await createImageElement(imageUrl);

  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;

  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(imageUrl);
    throw new Error("Não foi possível preparar o crop da imagem");
  }

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), file.type || "image/jpeg", 0.92);
  });

  URL.revokeObjectURL(imageUrl);

  if (!blob) {
    throw new Error("Não foi possível finalizar o crop da imagem");
  }

  return new File([blob], file.name, { type: blob.type || file.type });
}

async function getCroppedFileFromUrl(imageUrl: string, area: Area, fileName: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Não foi possível carregar a imagem para recorte");
  }

  const blob = await response.blob();
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  return getCroppedFile(file, area);
}

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

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Fotos do produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelectFiles}
        />
        <div className="flex flex-wrap gap-3 pb-2">
          {slots.map((slot) => {
            if (slot.type === "saved") {
              return (
                <div key={slot.key} className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                  <img
                    src={buildImageUrl(slot.image.url)}
                    alt={`Imagem ${slot.index + 1}`}
                    className="h-full w-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                    onClick={() => setPreviewIndex(slot.index)}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  {/* View large image button */}
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(slot.index)}
                    title="Ver imagem grande"
                    className="absolute left-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background transition-transform"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteImage(slot.image.id)}
                    disabled={isDeletingImage || isUpdatingImage}
                    title="Excluir imagem"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-90"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {onReplaceImage ? (
                    <button
                      type="button"
                      onClick={() => setSavedCropTarget({ id: slot.image.id, url: slot.image.url })}
                      disabled={isUpdatingImage || isDeletingImage}
                      title="Recortar imagem"
                      className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                    >
                      <Crop className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            }

            if (slot.type === "pending") {
              return (
                <div key={slot.key} className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                  <img
                    src={slot.image.previewUrl}
                    alt={slot.image.name}
                    className="h-full w-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                    onClick={() => setPreviewIndex(slot.index)}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* View large image button */}
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(slot.index)}
                    title="Ver imagem grande"
                    className="absolute left-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background transition-transform"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemovePendingImage(slot.image.id)}
                    disabled={isUploading}
                    title="Remover imagem"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-90"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {onUpdatePendingImage ? (
                    <button
                      type="button"
                      onClick={() => setPendingCropTarget({ id: slot.image.id })}
                      disabled={isUploading}
                      title="Recortar imagem"
                      className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                    >
                      <Crop className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            }

            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={remainingSlots === 0 || isUploading}
                className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 hover:bg-muted/80 transition-colors"
              >
                <ImageIcon className="h-8 w-8" />
                {remainingSlots > 0 ? (
                  <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">Máximo de {MAX_IMAGES} fotos por produto. Clique na foto para ver em tamanho grande.</p>

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
import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { getCroppedFileFromUrl } from "@/utils/image-crop";

type ImageCropDialogProps = {
  /** URL da imagem a recortar (blob: ou http). null fecha o modal. */
  imageUrl: string | null;
  fileName?: string;
  onClose: () => void;
  /** Recebe o arquivo já recortado (quadrado). */
  onApply: (file: File) => Promise<void> | void;
};

/** Modal de recorte quadrado, o mesmo usado nas fotos de produto. */
export function ImageCropDialog({ imageUrl, fileName = "imagem.jpg", onClose, onApply }: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [imageUrl]);

  const handleApply = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    setIsApplying(true);
    try {
      const file = await getCroppedFileFromUrl(imageUrl, croppedAreaPixels, fileName);
      await onApply(file);
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Não foi possível recortar a imagem" });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={!!imageUrl} onOpenChange={(open) => !open && !isApplying && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recortar imagem</DialogTitle>
        </DialogHeader>

        {imageUrl ? (
          <div className="space-y-4">
            <div className="relative h-[60vh] max-h-[420px] overflow-hidden rounded-xl bg-black">
              <Cropper
                image={imageUrl}
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

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isApplying}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={isApplying || !croppedAreaPixels}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {isApplying ? "Aplicando..." : "Aplicar crop"}
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

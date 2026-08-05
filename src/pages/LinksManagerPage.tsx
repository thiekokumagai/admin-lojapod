import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { uploadSettingsMedia } from "@/services/settings.service";
import { buildImageUrl } from "@/utils/image-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Plus,
  Save,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Upload,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";

interface MarketingLink {
  id: string;
  title: string;
  imageUrl: string;
  url: string;
  isActive: boolean;
  order: number;
}

export default function LinksManagerPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [links, setLinks] = useState<MarketingLink[]>([]);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    if (settings && settings.marketingLinks) {
      const sortedLinks = [...settings.marketingLinks].sort((a, b) => (a.order || 0) - (b.order || 0));
      setLinks(sortedLinks);
    }
  }, [settings]);

  const handleAddLink = () => {
    const newLink: MarketingLink = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      title: "",
      imageUrl: "",
      url: "",
      isActive: true,
      order: links.length,
    };
    setLinks([...links, newLink]);
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const handleChange = (id: string, field: keyof MarketingLink, value: any) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(id);
      const res = await uploadSettingsMedia(file);
      handleChange(id, "imageUrl", res.url);
      toast({ title: "Imagem do link enviada com sucesso!" });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Falha ao enviar a imagem.",
      });
    } finally {
      setIsUploading(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newLinks = [...links];
    const temp = newLinks[index - 1];
    newLinks[index - 1] = newLinks[index];
    newLinks[index] = temp;
    newLinks.forEach((l, i) => (l.order = i));
    setLinks(newLinks);
  };

  const handleMoveDown = (index: number) => {
    if (index === links.length - 1) return;
    const newLinks = [...links];
    const temp = newLinks[index + 1];
    newLinks[index + 1] = newLinks[index];
    newLinks[index] = temp;
    newLinks.forEach((l, i) => (l.order = i));
    setLinks(newLinks);
  };

  const handleSave = async () => {
    const invalid = links.find((l) => !l.imageUrl || !l.url);
    if (invalid) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Todos os links devem ter uma imagem e uma URL de destino.",
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        marketingLinks: links,
      } as any);

      toast({
        title: "Links salvos!",
        description: "A página de links foi atualizada com sucesso.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os links.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Página de Links</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie os banners e links dinâmicos da sua página pública (Instagram/Biolink).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-initial rounded-xl">
            <a href={`${import.meta.env.VITE_STORE_URL}/links`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Ver Página
            </a>
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSave()}
            disabled={updateSettingsMutation.isPending}
            className="flex-1 sm:flex-initial rounded-xl"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="rounded-2xl sm:rounded-3xl border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold">Banners Dinâmicos ({links.length})</CardTitle>
          <Button onClick={handleAddLink} size="sm" variant="secondary" className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar Link
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {links.length === 0 ? (
            <div className="text-center py-10 sm:py-14 border-2 border-dashed rounded-2xl bg-muted/20 space-y-3">
              <LinkIcon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum link adicionado ainda.</p>
              <Button onClick={handleAddLink} variant="outline" size="sm" className="rounded-xl">
                <Plus className="mr-1.5 h-4 w-4" />
                Adicionar meu primeiro link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link, idx) => (
                <div
                  key={link.id}
                  className="flex flex-col md:flex-row gap-4 p-4 sm:p-5 border rounded-2xl bg-card shadow-sm transition-all hover:border-primary/40 relative group"
                >
                  {/* Top Bar for Mobile: Position badge + Reorder controls + Delete */}
                  <div className="flex items-center justify-between pb-2 border-b md:border-b-0 md:pb-0 md:flex-col md:justify-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-medium md:hidden text-muted-foreground">
                        {link.title || `Banner ${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center md:flex-col gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === links.length - 1}
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>

                      {/* Mobile delete button right in the top bar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 md:hidden"
                        onClick={() => handleRemoveLink(link.id)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Image Container */}
                  <div className="w-full md:w-44 shrink-0 space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-medium">Banner / Imagem</Label>
                    <div className="relative h-32 md:h-28 w-full bg-muted rounded-xl border overflow-hidden group/img flex items-center justify-center">
                      {link.imageUrl ? (
                        <img src={buildImageUrl(link.imageUrl)} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-[11px]">Sem imagem</span>
                        </div>
                      )}

                      {/* Upload overlay label */}
                      <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-90 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity cursor-pointer p-2">
                        {isUploading === link.id ? (
                          <Loader2 className="h-6 w-6 animate-spin mb-1" />
                        ) : (
                          <Upload className="h-5 w-5 mb-1" />
                        )}
                        <span className="text-xs font-semibold">
                          {isUploading === link.id ? "Enviando..." : link.imageUrl ? "Trocar Imagem" : "Enviar Imagem"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void handleUploadImage(e, link.id)}
                          disabled={isUploading === link.id}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Inputs and Actions */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">
                          Título (Opcional - Uso Interno)
                        </Label>
                        <Input
                          placeholder="Ex: Promoção de Verão"
                          value={link.title}
                          onChange={(e) => handleChange(link.id, "title", e.target.value)}
                          className="h-10 text-sm rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">URL de Destino</Label>
                        <Input
                          placeholder="Ex: https://... ou /categorias/123"
                          value={link.url}
                          onChange={(e) => handleChange(link.id, "url", e.target.value)}
                          className="h-10 text-sm rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t gap-2">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={link.isActive}
                          onCheckedChange={(val) => handleChange(link.id, "isActive", val)}
                        />
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                          {link.isActive ? "Link Ativo (Visível)" : "Oculto na página"}
                        </span>
                      </div>

                      {/* Desktop Remove Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden md:inline-flex text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl"
                        onClick={() => handleRemoveLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" /> Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

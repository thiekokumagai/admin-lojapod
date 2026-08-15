import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { PageLoader } from "@/components/common/PageLoader";

import {
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Pencil,
  Link,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useSettings } from "@/hooks/useSettings";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrderBatch,
} from "@/services/category.service";

import { buildImageUrl } from "@/utils/image-url";
import { getStoreUrl } from "@/utils/store-url";
import type { CategoryList } from "@/types/category";

import {
  categorySchema,
  type CategoryFormData,
} from "@/validations/category.validation";

export default function CategoriesPage() {
  const { data: categories, loading, reload } = useCategories();
  const { data: settings } = useSettings();

  const [localCategories, setLocalCategories] = useState<CategoryList[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryList | null>(
    null,
  );
  const [subdomain, setSubdomain] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSavingOrderRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: "",
      file: null,
      isVisible: true,
      excludeFromBestSeller: false,
      oldUrl: "",
    },
  });

  const file = watch("file") as File | null;
  const watchedTitle = watch("title") || "";
  const watchedIsVisible = watch("isVisible");
  const watchedExcludeFromBestSeller = watch("excludeFromBestSeller");

  const canShowEditButton =
    !editingCategory ||
    watchedTitle.trim() !== (editingCategory.title || "").trim() ||
    watchedIsVisible !== editingCategory.isVisible ||
    watchedExcludeFromBestSeller !== (editingCategory.excludeFromBestSeller || false) ||
    (watch("oldUrl") || "") !== (editingCategory.oldUrl || "") ||
    file !== null ||
    removeImage;

  useEffect(() => {
    if (categories) setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (settings && (settings as any).storeId) {
      import("@/services/api").then(({ apiFetch }) => {
        apiFetch(`/stores/${(settings as any).storeId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.subdomain) setSubdomain(data.subdomain);
          })
          .catch(() => {});
      });
    }
  }, [settings]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const saveOrder = async (items: CategoryList[]) => {
    if (isSavingOrderRef.current) return;

    isSavingOrderRef.current = true;

    try {
      await updateCategoryOrderBatch(
        items.map((item, index) => ({
          id: item.id,
          order: index + 1,
        })),
      );
    } finally {
      isSavingOrderRef.current = false;
    }
  };

  const handleReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setLocalCategories((prev) => {
      const items = [...prev];

      const fromIndex = items.findIndex((i) => i.id === fromId);
      const toIndex = items.findIndex((i) => i.id === toId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);

      const updated = items.map((item, index) => ({
        ...item,
        order: index + 1,
      }));

      if (saveTimeout.current) clearTimeout(saveTimeout.current);

      saveTimeout.current = setTimeout(() => {
        saveOrder(updated);
      }, 300);

      return updated;
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setLocalCategories((prev) => {
      const items = [...prev];
      const temp = items[index - 1];
      items[index - 1] = items[index];
      items[index] = temp;

      const updated = items.map((item, i) => ({
        ...item,
        order: i + 1,
      }));

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        saveOrder(updated);
      }, 300);

      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    setLocalCategories((prev) => {
      if (index === prev.length - 1) return prev;
      const items = [...prev];
      const temp = items[index + 1];
      items[index + 1] = items[index];
      items[index] = temp;

      const updated = items.map((item, i) => ({
        ...item,
        order: i + 1,
      }));

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        saveOrder(updated);
      }, 300);

      return updated;
    });
  };

  const openCreate = () => {
    setEditingCategory(null);
    setImagePreview("");
    setRemoveImage(false);

    reset({
      title: "",
      file: null,
      isVisible: true,
      excludeFromBestSeller: false,
      oldUrl: "",
    });

    setOpen(true);
  };

  const openEdit = (category: CategoryList) => {
    setEditingCategory(category);

    setImagePreview(category.image ? buildImageUrl(category.image) : "");
    setRemoveImage(false);

    reset({
      title: category.title,
      file: null,
      isVisible: category.isVisible,
      excludeFromBestSeller: category.excludeFromBestSeller || false,
      oldUrl: category.oldUrl || "",
    });

    setOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSaving(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          title: data.title,
          file: data.file ?? null,
          isVisible: data.isVisible,
          excludeFromBestSeller: data.excludeFromBestSeller,
          oldUrl: data.oldUrl,
          removeImage,
        });

        toast({ title: "Categoria atualizada" });
      } else {
        await createCategory({
          title: data.title,
          file: data.file ?? null,
          isVisible: data.isVisible,
          excludeFromBestSeller: data.excludeFromBestSeller,
          oldUrl: data.oldUrl,
        });

        toast({ title: "Categoria criada" });
      }

      reset({
        title: "",
        file: null,
        isVisible: true,
        excludeFromBestSeller: false,
        oldUrl: "",
      });

      setOpen(false);
      setEditingCategory(null);
      setImagePreview("");
      setRemoveImage(false);

      await reload();
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao salvar categoria",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    setValue("file", nextFile);
    setRemoveImage(false);

    setImagePreview(URL.createObjectURL(nextFile));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar?")) return;
    setLoadingId(id);
    try {
      await deleteCategory(id);
      await reload();

      toast({ title: "Categoria deletada" });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao deletar categoria",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCopyLink = (category: CategoryList) => {
    const baseUrl = subdomain ? getStoreUrl(subdomain) : (import.meta.env.VITE_STORE_URL || window.location.origin.replace("admin.", ""));
    const slug = category.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const link = `${baseUrl}/${slug}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado para a área de transferência!" });
  };

  if (loading && localCategories.length === 0) {
    return <PageLoader message="Carregando categorias..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Arraste para reordenar
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={async () => {
              setIsRefreshing(true);
              await reload();
              setIsRefreshing(false);
            }}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>

          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Mobile Grid View */}
      <div className="grid md:hidden gap-3">
        {localCategories.map((c, index) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => setDraggingId(c.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggingId) handleReorder(draggingId, c.id);
              setDraggingId(null);
            }}
            onDragEnd={() => setDraggingId(null)}
            className={`bg-card border rounded-md p-4 shadow-sm flex flex-col gap-3 ${draggingId === c.id ? "opacity-50" : ""}`}
          >
            {/* Top Bar for Reorder */}
            <div className="flex items-center justify-between pb-2 border-b gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  #{index + 1}
                </span>
                <span className="font-bold text-foreground text-sm truncate">{c.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Mover para cima"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === localCategories.length - 1}
                  title="Mover para baixo"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GripVertical className="hidden h-5 w-5 text-muted-foreground shrink-0 active:cursor-grabbing cursor-grab" />
              
              {c.image ? (
                <img src={buildImageUrl(c.image)} className="h-12 w-12 rounded-full object-cover shrink-0 border" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted shrink-0 border flex items-center justify-center text-xs text-muted-foreground">—</div>
              )}
              
              <div className="flex flex-col flex-1 min-w-0">
                <Badge variant={c.isVisible ? "default" : "secondary"} className="w-fit mt-1 py-0 text-[10px]">
                  {c.isVisible ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => handleCopyLink(c)} className="h-8 w-8" title="Copiar link da categoria">
                  <Link className="h-4 w-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)} className="h-8 w-8">
                  <Pencil className="h-4 w-4 text-slate-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(c.id)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  disabled={loadingId === c.id}
                >
                  {loadingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Imagem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {localCategories.map((c) => (
                <TableRow
                  key={c.id}
                  draggable
                  onDragStart={() => setDraggingId(c.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggingId) handleReorder(draggingId, c.id);
                    setDraggingId(null);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={draggingId === c.id ? "opacity-50" : ""}
                >
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground hover:cursor-grabbing" />
                  </TableCell>

                  <TableCell>
                    {c.image ? (
                      <img
                        src={buildImageUrl(c.image)}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted" />
                    )}
                  </TableCell>

                  <TableCell>{c.title}</TableCell>

                  <TableCell>
                    <Badge variant={c.isVisible ? "default" : "secondary"}>
                      {c.isVisible ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyLink(c)}
                      title="Copiar link da categoria"
                    >
                      <Link className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(c.id)}
                      className="text-destructive"
                      disabled={loadingId === c.id}
                    >
                      {loadingId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>
            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>

          <div className="space-y-4">
            <div className="flex justify-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    className="h-24 w-24 rounded-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setValue("file", null);
                      setImagePreview("");
                      setRemoveImage(true);
                    }}
                    className="absolute -top-2 -right-2 bg-destructive p-1 rounded-full"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className="h-24 w-24 flex items-center justify-center border-2 border-dashed rounded-full cursor-pointer">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            <div>
              <Label>Título</Label>
              <Input {...register("title")} />
              {errors.title && (
                <p className="text-sm text-red-500 mt-2">
                  {errors.title.message}
                </p>
              )}
            </div>

            <Controller
              name="isVisible"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <Label>Visível no site</Label>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            <Controller
              name="excludeFromBestSeller"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <Label>Ocultar do Ranking Best Seller</Label>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            {canShowEditButton ? (
              <Button
                className="w-full"
                onClick={handleSubmit(onSubmit)}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategory ? "Editar" : "Criar"}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProductItems } from "@/hooks/useProductItems";
import { useProducts } from "@/hooks/useProducts";
import { useVariations } from "@/hooks/useVariations";
import {
  createProduct,
  createProductItems,
  deleteProductImage,
  getProductById,
  getProductItems,
  linkProductVariations,
  removeProductVariation,
  removeProductVariationOption,
  replaceProductImage,
  updateProduct,
  updateProductItem,
  updateProductItemsBatch,
  uploadProductImages,
} from "@/services/product.service";
import { ProductDetailsForm, type ProductDetailsFormValues } from "@/components/products/ProductDetailsForm";
import { PageLoader } from "@/components/common/PageLoader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProductImage, ProductItem, ProductResponse, UpdateProductItemPayload } from "@/types/product";
import type { Variation } from "@/types/variation";
import type { QuickEditMode } from "@/components/products/ProductStockEditor";

const ProductVariationSelector = lazy(() => import("@/components/products/ProductVariationSelector").then(m => ({ default: m.ProductVariationSelector })));
const ProductImageManager = lazy(() => import("@/components/products/ProductImageManager").then(m => ({ default: m.ProductImageManager })));
const ProductStockEditor = lazy(() => import("@/components/products/ProductStockEditor").then(m => ({ default: m.ProductStockEditor })));

const productSchema = z.object({
  title: z.string().min(1, "Informe o nome do produto."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  description: z.string().optional(),
  descriptionFormated: z.string().optional(),
  price: z.number().min(0, "O preço deve ser maior ou igual a zero.").optional(),
  promotionalPrice: z.number().min(0, "O preço promocional deve ser maior ou igual a zero.").optional(),
  costPrice: z.number().min(0, "O preço de custo deve ser maior ou igual a zero.").optional(),
});

type PendingImage = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
  originalFile?: File;
  originalPreviewUrl?: string;
};

function buildOptionHash(optionIds: string[]) {
  return [...optionIds].sort().join("|");
}

function getOrderedOptionIds(optionIds: string[], selectedVariationIds: string[], variations: Variation[]) {
  return selectedVariationIds
    .map((variationId) => {
      const variation = variations.find((item) => item.id === variationId);
      const option = variation?.options.find((item) => optionIds.includes(item.id));
      return option?.id ?? null;
    })
    .filter((value): value is string => !!value);
}

function getOptionCombinations(variationsWithSelections: Array<{ variation: Variation; optionIds: string[] }>) {
  return variationsWithSelections.reduce<Array<{ optionIds: string[]; labels: string[] }>>(
    (accumulator, entry) => {
      const options = entry.variation.options.filter((option) => entry.optionIds.includes(option.id));

      if (accumulator.length === 0) {
        return options.map((option) => ({
          optionIds: [option.id],
          labels: [option.value],
        }));
      }

      return accumulator.flatMap((combination) =>
        options.map((option) => ({
          optionIds: [...combination.optionIds, option.id],
          labels: [...combination.labels, option.value],
        })),
      );
    },
    [],
  );
}

function hasItemWithVariation(item: ProductItem, variationId: string) {
  return item.options.some((option) => option.variationId === variationId);
}

function hasItemWithOption(item: ProductItem, optionId: string) {
  return item.options.some((option) => option.optionId === optionId);
}

function getSelectedOptionsMap(product: ProductResponse) {
  const activeIds = new Set(product.activeOptionIds);
  return product.variations.reduce<Record<string, string[]>>((acc, variation) => {
    acc[variation.variationId] = variation.options
      .filter((option) => activeIds.has(option.id))
      .map((option) => option.id);
    return acc;
  }, {});
}

function sortProductItemsByVariationOrder(items: ProductItem[], selectedVariationIds: string[]) {
  return [...items].sort((a, b) => {
    const labelA = selectedVariationIds
      .map((variationId) => a.options.find((option) => option.variationId === variationId)?.optionValue ?? "")
      .join(" / ");
    const labelB = selectedVariationIds
      .map((variationId) => b.options.find((option) => option.variationId === variationId)?.optionValue ?? "")
      .join(" / ");

    return labelA.localeCompare(labelB, "pt-BR", { numeric: true, sensitivity: "base" });
  });
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewProduct = id === "novo";

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];
  const productsQuery = useProducts();
  const variationsQuery = useVariations();
  const variations = variationsQuery.data ?? [];

  const [productId, setProductId] = useState<string | null>(isNewProduct ? null : id ?? null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedVariationIds, setSelectedVariationIds] = useState<string[]>([]);
  const [selectedOptionsByVariation, setSelectedOptionsByVariation] = useState<Record<string, string[]>>({});
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [bulkMode, setBulkMode] = useState<QuickEditMode>("add");
  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});
  const [directStockValue, setDirectStockValue] = useState("");
  const [stockObservation, setStockObservation] = useState("");
  const [hasVariations, setHasVariations] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [savingStep, setSavingStep] = useState<string | null>(null);

  const productForm = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      description: "",
      descriptionFormated: "",
      price: undefined,
      promotionalPrice: undefined,
      costPrice: undefined,
    },
  });

  const { data: savedItemsData, isLoading: loadingSavedItems, refetch: refetchItems } = useProductItems(productId ?? "");
  const savedItems = useMemo(() => savedItemsData ?? [], [savedItemsData]);

  useEffect(() => {
    if (!savedItems?.length) {
      setBulkValues({});
      setDirectStockValue("");
      return;
    }

    const optionsMap: Record<string, string[]> = {};
    const variationIdsSet = new Set<string>();

    savedItems.forEach(item => {
      item.options.forEach(opt => {
        if (!optionsMap[opt.variationId]) {
          optionsMap[opt.variationId] = [];
        }
        if (!optionsMap[opt.variationId].includes(opt.optionId)) {
          optionsMap[opt.variationId].push(opt.optionId);
        }
        variationIdsSet.add(opt.variationId);
      });
    });

    setSelectedOptionsByVariation(optionsMap);
    setSelectedVariationIds(Array.from(variationIdsSet));
    
    const hasAnyVariation = savedItems.some(item => item.options.length > 0);
    setHasVariations(hasAnyVariation);

    setBulkValues(
      savedItems.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = "";
        return acc;
      }, {}),
    );

    setDirectStockValue("");
  }, [savedItems]);

  const selectedVariations = useMemo(
    () =>
      selectedVariationIds
        .map((variationId) => variations.find((variation) => variation.id === variationId))
        .filter((variation): variation is Variation => !!variation),
    [selectedVariationIds, variations],
  );

  const combinedItems = useMemo(() => {
    if (!hasVariations) return savedItems;

    const variationsWithSelections = selectedVariationIds
      .map((variationId) => {
        const variation = variations.find((v) => v.id === variationId);
        const optionIds = selectedOptionsByVariation[variationId] ?? [];
        return variation && optionIds.length > 0 ? { variation, optionIds } : null;
      })
      .filter((entry): entry is { variation: Variation; optionIds: string[] } => !!entry);

    if (variationsWithSelections.length === 0) return savedItems;

    const combinations = getOptionCombinations(variationsWithSelections);
    
    const existingMap = new Map<string, ProductItem>();
    savedItems.forEach(item => {
      const hash = buildOptionHash(item.options.map(o => o.optionId));
      existingMap.set(hash, item);
    });

    const results: Array<any> = [];

    combinations.forEach(combo => {
      const orderedOptionIds = getOrderedOptionIds(combo.optionIds, selectedVariationIds, variations);
      const hash = buildOptionHash(orderedOptionIds);
      const existing = existingMap.get(hash);

      if (existing) {
        results.push(existing);
      } else {
        results.push({
          id: `virtual-${hash}`,
          isVirtual: true,
          stock: 0,
          options: orderedOptionIds.map(optId => {
             const variation = variations.find(v => v.options.some(o => o.id === optId));
             const option = variation?.options.find(o => o.id === optId);
             return {
               variationId: variation?.id ?? "",
               optionId: optId,
               optionValue: option?.value ?? ""
             };
          })
        });
      }
    });

    return sortProductItemsByVariationOrder(results as ProductItem[], selectedVariationIds);
  }, [hasVariations, savedItems, selectedVariationIds, selectedOptionsByVariation, variations]);

  const orderedSavedItems = combinedItems;

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: !isNewProduct && !!id,
    staleTime: 5 * 60 * 1000,
  });

  const currentProduct = productQuery.data;

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductId(product.id);
      setImages(product.images);
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));
      setIsVisible(product.status === "active");
      navigate(`/produtos/${product.id}`, { replace: true });
      toast({ title: "Produto criado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível criar o produto" });
    },
  });



  useEffect(() => {
    if (productQuery.data) {
      const product = productQuery.data;
      setProductId(product.id);
      setImages(product.images);
      setSelectedVariationIds(productQuery.data.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(productQuery.data));
      setIsVisible(productQuery.data.status === "active");
      setHasVariations((product.variationIds?.length ?? 0) > 0);
      productForm.reset({
        title: product.title,
        description: product.description ?? "",
        descriptionFormated: product.descriptionFormated ?? "",
        categoryId: product.categoryId,
        price: product.price,
        promotionalPrice: product.promotionalPrice,
        costPrice: product.costPrice,
      });
    }
  }, [productQuery.data, productForm]);

  const isInitialPageLoading =
    !isNewProduct && (productQuery.isLoading || categoriesQuery.loading || variationsQuery.isLoading);

  const linkVariationsMutation = useMutation({
    mutationFn: async ({ currentProductId, variationIds, stocks }: { currentProductId: string; variationIds: string[]; stocks?: Record<string, number> }) => {
      const currentProductData = await getProductById(currentProductId);
      const alreadyLinkedVariationIds = currentProductData.variationIds ?? [];
      const variationIdsToLink = variationIds.filter((variationId) => !alreadyLinkedVariationIds.includes(variationId));

      let product = currentProductData;

      if (variationIdsToLink.length > 0) {
        product = await linkProductVariations(currentProductId, variationIdsToLink);
      }

      const variationsWithSelections = variationIds
        .map((variationId) => {
          const variation = variations.find((item) => item.id === variationId);
          const optionIds = selectedOptionsByVariation[variationId] ?? [];
          return variation && optionIds.length > 0 ? { variation, optionIds } : null;
        })
        .filter((entry): entry is { variation: Variation; optionIds: string[] } => !!entry);

      if (variationsWithSelections.length === 0) {
        return await getProductById(currentProductId);
      }

      const combinations = getOptionCombinations(variationsWithSelections).map((combination) => ({
        optionIds: getOrderedOptionIds(combination.optionIds, variationIds, variations),
      }));

      const existingItems = await getProductItems(currentProductId);
      const existingHashes = new Set(
        existingItems.map((item) => buildOptionHash(item.options.map((option) => option.optionId))),
      );

      const uniqueItemsToCreate = combinations.filter(
        (combination, index, array) =>
          array.findIndex((entry) => buildOptionHash(entry.optionIds) === buildOptionHash(combination.optionIds)) === index,
      );

      const itemsToCreate = uniqueItemsToCreate
        .filter((combination) => !existingHashes.has(buildOptionHash(combination.optionIds)))
        .map((combination) => {
          const hash = buildOptionHash(combination.optionIds);
          return {
            options: combination.optionIds,
            stock: stocks?.[hash] ?? 0,
          };
        });

      if (itemsToCreate.length > 0) {
        await createProductItems(currentProductId, itemsToCreate);
      }

      return await getProductById(currentProductId);
    },
    onSuccess: async (product) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));
      await refetchItems();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message || "Não foi possível vincular as variações" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (values: ProductDetailsFormValues) => updateProduct(productId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível atualizar o produto" });
    },
  });

  const removeVariationMutation = useMutation({
    mutationFn: ({ currentProductId, variationId }: { currentProductId: string; variationId: string }) =>
      removeProductVariation(currentProductId, { variationId }),
    onSuccess: async (product, variables) => {
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));

      setBulkValues((prev) => {
        const next = { ...prev };
        savedItems.forEach((item) => {
          if (hasItemWithVariation(item, variables.variationId)) {
            delete next[item.id];
          }
        });
        return next;
      });

      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      await refetchItems();
      toast({ title: "Variação removida" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível remover a variação" });
    },
  });

  const removeVariationOptionMutation = useMutation({
    mutationFn: ({ currentProductId, variationId, optionId }: { currentProductId: string; variationId: string; optionId: string }) =>
      removeProductVariationOption(currentProductId, { variationId, optionId }),
    onSuccess: async (product, variables) => {
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));

      setBulkValues((prev) => {
        const next = { ...prev };
        savedItems.forEach((item) => {
          if (hasItemWithOption(item, variables.optionId)) {
            delete next[item.id];
          }
        });
        return next;
      });

      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      await refetchItems();
      toast({ title: "Opção removida" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível remover a opção" });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: ({ currentProductId, files }: { currentProductId: string; files: File[] }) =>
      uploadProductImages(currentProductId, files),
    onSuccess: (product) => {
      setImages(product.images);
      setPendingImages([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível enviar as imagens" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ currentProductId, imageId }: { currentProductId: string; imageId: string }) =>
      deleteProductImage(currentProductId, imageId),
    onSuccess: (_, variables) => {
      setImages((prev) => prev.filter((image) => image.id !== variables.imageId));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Imagem removida" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível remover a imagem" });
    },
  });

  const replaceImageMutation = useMutation({
    mutationFn: ({ currentProductId, imageId, file }: { currentProductId: string; imageId: string; file: File }) =>
      replaceProductImage(currentProductId, imageId, file),
    onSuccess: (product) => {
      setImages(product.images);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Imagem atualizada" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível atualizar a imagem" });
    },
  });

  const updateStockBatchMutation = useMutation({
    mutationFn: (items: { itemId: string; payload: UpdateProductItemPayload }[]) => updateProductItemsBatch(items),
    onSuccess: async () => {
      await refetchItems();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível salvar o estoque" });
    },
  });

  const saveDirectStockMutation = useMutation({
    mutationFn: async ({ currentProductId, payload, itemId, initialStock }: { currentProductId: string; payload: UpdateProductItemPayload; itemId?: string; initialStock?: number }) => {
      if (itemId) {
        await updateProductItem(itemId, payload);
      } else {
        await createProductItems(currentProductId, [
          {
            stock: initialStock ?? 0,
          },
        ]);
      }
    },
    onSuccess: async () => {
      await refetchItems();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível salvar o estoque" });
    },
  });

  useEffect(() => {
    return () => {
      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [pendingImages]);

  const handlePendingImagesChange = (files: File[]) => {
    setPendingImages((previous) => {
      // revoke ONLY if we are completely replacing it (we don't revoke original URLs here as they might be reused if not carefully managed)
      return files.map((file) => {
        const id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const url = URL.createObjectURL(file);
        return {
          id,
          name: file.name,
          previewUrl: url,
          file,
          originalFile: file,
          originalPreviewUrl: url,
        };
      });
    });
  };

  const handleRemovePendingImage = (pendingId: string) => {
    setPendingImages((prev) => {
      const target = prev.find((image) => image.id === pendingId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.originalPreviewUrl && target.originalPreviewUrl !== target.previewUrl) {
          URL.revokeObjectURL(target.originalPreviewUrl);
        }
      }
      return prev.filter((image) => image.id !== pendingId);
    });
  };

  const handleUpdatePendingImage = (pendingId: string, newFile: File) => {
    setPendingImages((prev) => 
      prev.map((image) => {
        if (image.id === pendingId) {
          if (image.previewUrl && image.previewUrl !== image.originalPreviewUrl) {
            URL.revokeObjectURL(image.previewUrl);
          }
          return {
            ...image,
            file: newFile,
            previewUrl: URL.createObjectURL(newFile),
          };
        }
        return image;
      })
    );
  };

  const handleChangeVariation = (slot: number, variationId: string) => {
    const nextVariationIds = [...selectedVariationIds];
    const previousVariationId = nextVariationIds[slot];
    nextVariationIds[slot] = variationId;

    const cleanedVariationIds = nextVariationIds.filter(Boolean);
    setSelectedVariationIds(cleanedVariationIds);

    setSelectedOptionsByVariation((prev) => {
      const next = { ...prev };

      if (previousVariationId && previousVariationId !== variationId) {
        delete next[previousVariationId];
      }

      if (variationId && !next[variationId]) {
        next[variationId] = [];
      }

      Object.keys(next).forEach((key) => {
        if (!cleanedVariationIds.includes(key)) {
          delete next[key];
        }
      });

      return next;
    });
  };

  const handleAddVariationSlot = () => {
    if (selectedVariationIds.length >= variations.length) {
      return;
    }
    setSelectedVariationIds((prev) => [...prev, ""]);
  };

  const handleRemoveVariationSlot = (slot: number) => {
    const variationIdToRemove = selectedVariationIds[slot];
    const nextVariationIds = selectedVariationIds.filter((_, index) => index !== slot);
    setSelectedVariationIds(nextVariationIds);

    if (variationIdToRemove) {
      setSelectedOptionsByVariation((prev) => {
        const next = { ...prev };
        delete next[variationIdToRemove];
        return next;
      });
    }
  };

  const handleToggleVariationOption = (variationId: string, optionId: string, checked: boolean) => {
    setSelectedOptionsByVariation((prev) => {
      const current = prev[variationId] ?? [];
      const nextValues = checked ? [...new Set([...current, optionId])] : current.filter((itemId) => itemId !== optionId);
      return {
        ...prev,
        [variationId]: nextValues,
      };
    });
  };

  const handleToggleAllVariationOptions = (variationId: string, checked: boolean) => {
    const variation = variations.find((item) => item.id === variationId);
    if (!variation) return;

    setSelectedOptionsByVariation((prev) => ({
      ...prev,
      [variationId]: checked ? variation.options.map((option) => option.id) : [],
    }));
  };

  const handleSaveEverything = async () => {
    const isValid = await productForm.trigger();
    if (!isValid) {
      toast({ variant: "destructive", title: "Preencha os campos obrigatórios" });
      return;
    }

    const rawValues = productForm.getValues();

    // Validações preventivas (Fase 2)
    if (hasVariations) {
      const hasAnySelectedOption = Object.values(selectedOptionsByVariation).some(opts => opts.length > 0);
      if (selectedVariationIds.filter(Boolean).length === 0 || !hasAnySelectedOption) {
        toast({ variant: "destructive", title: "Configuração de Variação Incompleta", description: "Selecione ao menos uma variação e suas opções." });
        return;
      }
    }

    const formValues = {
      ...rawValues,
      isVisible,
      descriptionFormated: rawValues.description?.replace(/<[^>]*>/g, "").trim() ?? "",
    };

    let currentId = productId;

    try {
      // 1. Salvar Produto
      setSavingStep("Salvando informações principais...");
      if (!currentId) {
        const product = await createProductMutation.mutateAsync(formValues);
        currentId = product.id;
        setProductId(currentId);
      } else {
        await updateProductMutation.mutateAsync(formValues);
      }

      // 2. Upload de Imagens
      if (pendingImages.length > 0) {
        setSavingStep(`Enviando ${pendingImages.length} imagem(ns)...`);
        await uploadImagesMutation.mutateAsync({
          currentProductId: currentId!,
          files: pendingImages.map((image) => image.file),
        });
      }

      // 3. Variações e Estoque
      if (hasVariations) {
        setSavingStep("Sincronizando grade de variações...");
        const validVariationIds = selectedVariationIds.filter(Boolean);
        if (validVariationIds.length > 0) {
          const stocksMap: Record<string, number> = {};
          combinedItems.forEach(item => {
            if (item.isVirtual) {
              const hash = buildOptionHash(item.options.map((o: any) => o.optionId));
              const value = Number(bulkValues[item.id]) || 0;
              stocksMap[hash] = value;
            }
          });

          await linkVariationsMutation.mutateAsync({
            currentProductId: currentId!,
            variationIds: validVariationIds,
            stocks: stocksMap
          });

          const itemsToUpdate = combinedItems
            .filter((item) => !item.isVirtual && (bulkValues[item.id] ?? "") !== "")
            .map((item) => {
              const value = Number(bulkValues[item.id]);
              return {
                itemId: item.id,
                payload: {
                  type: bulkMode === "add" ? "ADD" : bulkMode === "subtract" ? "SUBTRACT" : "SET",
                  quantity: value,
                  observation: stockObservation,
                } as UpdateProductItemPayload
              };
            });

          if (itemsToUpdate.length > 0) {
            setSavingStep("Atualizando quantidades em estoque...");
            await updateStockBatchMutation.mutateAsync(itemsToUpdate);
          }
        }
      } else {
        const value = Number(directStockValue) || 0;
        const directItem = savedItems.find((item) => item.options.length === 0);

        if (!directItem) {
          setSavingStep("Criando controle de estoque...");
          await saveDirectStockMutation.mutateAsync({
            currentProductId: currentId!,
            payload: {
              type: "SET",
              quantity: value,
              observation: stockObservation,
            },
            initialStock: value,
          });
        } else if (!Number.isNaN(value) && directStockValue !== "") {
          setSavingStep("Atualizando estoque direto...");
          await saveDirectStockMutation.mutateAsync({
            currentProductId: currentId!,
            payload: {
              type: bulkMode === "add" ? "ADD" : bulkMode === "subtract" ? "SUBTRACT" : "SET",
              quantity: value,
              observation: stockObservation,
            },
            itemId: directItem.id,
          });
        }
      }

      setSavingStep(null);
      setBulkValues({});
      setDirectStockValue("");
      setStockObservation("");
      queryClient.invalidateQueries({ queryKey: ["product", currentId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      await refetchItems();
      toast({ title: "Tudo salvo com sucesso!" });
    } catch (error: any) {
      setSavingStep(null);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    }
  };

  const isSaving =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    uploadImagesMutation.isPending ||
    linkVariationsMutation.isPending ||
    updateStockBatchMutation.isPending ||
    saveDirectStockMutation.isPending;

  if (isInitialPageLoading) {
    return <PageLoader message="Carregando produto..." />;
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="space-y-1">
          <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-3 w-fit hover:bg-transparent flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para produtos</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNewProduct ? "Novo produto" : currentProduct?.title ?? "Editar produto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie imagens, dados básicos, variações e estoque em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="product-active"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
            <Label htmlFor="product-active" className="cursor-pointer font-semibold">
              {isVisible ? "Ativo" : "Inativo"}
            </Label>
          </div>
          <Button
            type="button"
            className="h-12 rounded-2xl px-8 font-semibold shadow-lg transition-all hover:scale-[1.02]"
            disabled={isSaving}
            onClick={() => void handleSaveEverything()}
          >
            {isSaving ? (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>{savingStep || "Salvando..."}</span>
              </div>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar tudo</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        <Tabs defaultValue="produto" className="w-full">
          <TabsList className="mb-8 border-b rounded-none w-full justify-start bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="produto" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent pb-3 pt-2 px-1 text-base font-semibold data-[state=active]:bg-transparent">
              Produto
            </TabsTrigger>
            {productId && (
              <>
                <TabsTrigger value="variacoes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent pb-3 pt-2 px-1 text-base font-semibold data-[state=active]:bg-transparent">
                  Variações
                </TabsTrigger>
                <TabsTrigger value="estoque" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent pb-3 pt-2 px-1 text-base font-semibold data-[state=active]:bg-transparent">
                  Estoque
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="produto" className="space-y-8 outline-none">
            {currentProduct && currentProduct.totalStock === 0 && (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Produto sem estoque!</AlertTitle>
                <AlertDescription>
                  Este produto consta com estoque 0 e aparecerá como esgotado para os clientes. Ajuste o estoque na aba <strong>Estoque</strong>.
                </AlertDescription>
              </Alert>
            )}

            {/* Images Section */}
            <Suspense fallback={<PageLoader message="Carregando gestor de imagens..." />}>
          <ProductImageManager
            images={images}
            pendingImages={pendingImages}
            isUploading={uploadImagesMutation.isPending}
            isDeletingImage={deleteImageMutation.isPending}
            isUpdatingImage={replaceImageMutation.isPending}
            onPendingImagesChange={handlePendingImagesChange}
            onRemovePendingImage={handleRemovePendingImage}
            onUpdatePendingImage={handleUpdatePendingImage}
            onDeleteImage={(imageId) => {
              if (!productId) return;
              deleteImageMutation.mutate({ currentProductId: productId, imageId });
            }}
            onReplaceImage={async (imageId, file) => {
              if (!productId) return;
              await replaceImageMutation.mutateAsync({ currentProductId: productId, imageId, file });
            }}
          />
        </Suspense>

        <ProductDetailsForm
          form={productForm}
          categories={categories}
        />
        </TabsContent>

        <TabsContent value="variacoes" className="space-y-8 outline-none">
        {/* Variations Toggle Section */}
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xl font-bold">Variações de Produto</Label>
              <p className="text-sm text-muted-foreground">
                Ative se este produto possui tamanhos, cores ou outras opções.
              </p>
            </div>
            <Switch
              checked={hasVariations}
              onCheckedChange={setHasVariations}
              className="scale-125"
            />
          </div>

          <div className="mt-8 space-y-8">
            {hasVariations ? (
              <>
                <Suspense fallback={<PageLoader message="Carregando variações..." />}>
                  <ProductVariationSelector
                    variations={variations}
                    selectedVariationIds={selectedVariationIds}
                    selectedOptionsByVariation={selectedOptionsByVariation}
                    onChangeVariation={handleChangeVariation}
                    onAddSlot={handleAddVariationSlot}
                    onRemoveSlot={handleRemoveVariationSlot}
                    onToggleOption={handleToggleVariationOption}
                    onToggleAllOptions={handleToggleAllVariationOptions}
                    onRemoveVariation={(variationId) => {
                      if (!productId) return;
                      removeVariationMutation.mutate({ currentProductId: productId, variationId });
                    }}
                    onRemoveVariationOption={(variationId, optionId) => {
                      if (!productId) return;
                      removeVariationOptionMutation.mutate({ currentProductId: productId, variationId, optionId });
                    }}
                    disabled={
                      !productId ||
                      linkVariationsMutation.isPending ||
                      removeVariationMutation.isPending ||
                      removeVariationOptionMutation.isPending
                    }
                  />
                </Suspense>
              </>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-3xl bg-muted/20">
                <p className="text-muted-foreground">Ative as variações acima para configurá-las.</p>
              </div>
            )}
          </div>
        </div>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-8 outline-none">
        {/* Estoque */}
        <div className="space-y-4">
          {hasVariations ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold hidden">Grade de Estoque</h3>
              <Suspense fallback={<PageLoader message="Carregando editor de estoque..." />}>
                    <ProductStockEditor
                      productId={productId || undefined}
                      productReady={true}
                      hasVariations={true}
                      loadingSavedItems={loadingSavedItems}
                      savedItems={orderedSavedItems}
                      directStockValue=""
                      bulkMode={bulkMode}
                      bulkValues={bulkValues}
                      observation={stockObservation}
                      isSaving={isSaving}
                      onModeChange={setBulkMode}
                      onDirectStockChange={setDirectStockValue}
                      onValueChange={(itemId, value) => setBulkValues(prev => ({ ...prev, [itemId]: value }))}
                      onObservationChange={setStockObservation}
                      onSaveAll={() => void handleSaveEverything()}
                    />
                  </Suspense>
                </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Gerenciar Estoque Direto</h3>
                <Suspense fallback={<PageLoader message="Carregando editor de estoque..." />}>
                  <ProductStockEditor
                    productId={productId || undefined}
                    productReady={true}
                    hasVariations={false}
                    loadingSavedItems={loadingSavedItems}
                    savedItems={savedItems}
                    directStockValue={directStockValue}
                    bulkMode={bulkMode}
                    bulkValues={{}}
                    observation={stockObservation}
                    isSaving={isSaving}
                    onModeChange={setBulkMode}
                    onDirectStockChange={setDirectStockValue}
                    onValueChange={() => {}}
                    onObservationChange={setStockObservation}
                    onSaveAll={() => void handleSaveEverything()}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </TabsContent>
        </Tabs>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            className="h-11 rounded-xl px-6 text-sm font-semibold shadow-md transition-all active:scale-95"
            disabled={isSaving}
            onClick={() => void handleSaveEverything()}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>{savingStep || "Processando..."}</span>
              </div>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Finalizar Cadastro</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

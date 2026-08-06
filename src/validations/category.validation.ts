import { z } from "zod";

export const categorySchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(50, "Título muito grande"),

  file: z
    .any()
    .nullable()
    .optional(),  
    isVisible: z.boolean().optional(),
    excludeFromBestSeller: z.boolean().optional(),
    oldUrl: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
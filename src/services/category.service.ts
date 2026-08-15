import { apiFetch } from "./api";
import type { CategoryList,CreateCategoryDTO, UpdateCategoryDTO } from "@/types/category";


export async function getCategories(): Promise<CategoryList[]> {
  const response = await apiFetch("/categories");
  return response.json();
}

export async function createCategory(
  form: CreateCategoryDTO
): Promise<void> {
  const body = new FormData();
  body.append("title", form.title.trim());
  if (form.file) {
    body.append("file", form.file);
  }
  body.append("isVisible", form.isVisible ? "true" : "false");
  if (form.excludeFromBestSeller !== undefined) {
    body.append("excludeFromBestSeller", form.excludeFromBestSeller ? "true" : "false");
  }
  if (form.oldUrl) {
    body.append("oldUrl", form.oldUrl);
  }
  await apiFetch("/categories", {
    method: "POST",
    body,
  });
}
export async function updateCategory(
  id: string,
  form: UpdateCategoryDTO
): Promise<void> {
  const body = new FormData();

  if (form.title) {
    body.append("title", form.title);
  }

  if (form.file) {
    body.append("file", form.file);
  }

  if (form.isVisible !== undefined) {
    body.append("isVisible", form.isVisible ? "true" : "false");
  }
  if (form.removeImage !== undefined) {
    body.append("removeImage", form.removeImage ? "true" : "false");
  }
  if (form.excludeFromBestSeller !== undefined) {
    body.append("excludeFromBestSeller", form.excludeFromBestSeller ? "true" : "false");
  }
  await apiFetch(`/categories/${id}`, {
    method: "PATCH",
    body,
  });
}
export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, {
    method: "DELETE",
  });
}
export async function updateCategoryOrderBatch(
  items: { id: string; order: number }[]
) {
  const response = await apiFetch("/categories/batch/order", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });

  return response.json();
}
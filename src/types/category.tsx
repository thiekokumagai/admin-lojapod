export type CategoryList = {
    id: string;
    title: string;
    image: string | null;
    order: number | null;
    isVisible: boolean;
    excludeFromBestSeller?: boolean;
    deletedAt: string | null;
};
export type CreateCategoryDTO = {
    title: string;
    isVisible: boolean;
    excludeFromBestSeller?: boolean;
    file: File | null;
  };

  export type UpdateCategoryDTO = {
    title?: string;
    file?: File | null;
    isVisible?: boolean;
    excludeFromBestSeller?: boolean;
    removeImage?: boolean;
  };
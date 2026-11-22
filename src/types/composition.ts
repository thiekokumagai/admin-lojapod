export interface CompositionOption {
  id: string;
  groupId: string;
  name: string;
  description?: string | null;
  price: number | string;
  costPrice?: number | string | null;
  maxQuantityPerItem: number;
  sortOrder: number;
  isActive: boolean;
  linkedProductId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompositionGroup {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  minQuantity: number;
  maxQuantity: number;
  freeQuantity: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  options: CompositionOption[];
  productsCount?: number;
}

export interface ProductComposition {
  id: string;
  productId: string;
  groupId: string;
  sortOrder: number;
  customMinQuantity?: number | null;
  customMaxQuantity?: number | null;
  customFreeQuantity?: number | null;
  createdAt: string;
  updatedAt: string;
  group: CompositionGroup;
}

export interface CreateCompositionGroupPayload {
  name: string;
  description?: string;
  minQuantity?: number;
  maxQuantity?: number;
  freeQuantity?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCompositionGroupPayload = Partial<CreateCompositionGroupPayload>;

export interface CreateCompositionOptionPayload {
  name: string;
  description?: string;
  price?: number;
  costPrice?: number;
  maxQuantityPerItem?: number;
  sortOrder?: number;
  isActive?: boolean;
  linkedProductId?: string | null;
}

export type UpdateCompositionOptionPayload = Partial<CreateCompositionOptionPayload>;

export interface AttachProductCompositionItem {
  groupId: string;
  sortOrder?: number;
  customMinQuantity?: number | null;
  customMaxQuantity?: number | null;
  customFreeQuantity?: number | null;
}

export interface AttachProductCompositionPayload {
  groups: AttachProductCompositionItem[];
}

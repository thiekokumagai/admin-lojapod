export interface PaymentRule {
  id: string;
  paymentMethod: string; // 'pix' | 'cash' | 'debit' | 'credit'
  type: 'discount' | 'charge';
  value: number;
  maxInstallments?: number;
  parcelaMin?: number;
  parcelaMax?: number;
  passedToCustomer?: boolean;
}

export interface InstallmentRule {
  id: string;
  parcelaMin: number;
  parcelaMax: number;
  juros: number;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  logoUrl: string | null;
  whiteLogoUrl: string | null;
  faviconUrl: string | null;
  topHeaderText: string | null;
  searchSuffix?: string;
  searchCity?: string;
  bannerUrls: string[];
  phone: string;
  instagram: string | null;
  pixelId: string | null;
  marketingLinks?: { id: string; title: string; imageUrl: string; url: string; isActive: boolean; order: number }[];
  
  // Endereço
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string | null;
  hideAddress: boolean;
  
  deliveryOriginCep: string | null;
  deliveryOriginNumber: string | null;
  deliveryRanges: any;
  
  // Pagamentos
  pixEnabled: boolean;
  pixKeyType: string | null;
  pixKey: string | null;
  pixHolder: string | null;
  
  payOnDeliveryCash: boolean;
  payOnDeliveryCardDebit: boolean;
  payOnDeliveryCardCredit: boolean;
  
  paymentRules: PaymentRule[];
  installmentRules?: InstallmentRule[] | null;
  
  createdAt?: string;
  updatedAt?: string;
}

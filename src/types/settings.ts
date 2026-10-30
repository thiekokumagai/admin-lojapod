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

export interface SavedStoreAddress {
  id: string;
  title: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  complement?: string;
  reference?: string;
  isActive?: boolean;
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
  searchState?: string;
  restrictToCity?: boolean;
  bannerUrls: string[];
  phone: string;
  instagram: string | null;
  pixelId: string | null;
  facebookPixelEnabled?: boolean;
  facebookConversionsToken?: string | null;
  facebookConversionsApiEnabled?: boolean;
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
  savedStoreAddresses?: SavedStoreAddress[];
  
  deliveryOriginCep: string | null;
  deliveryOriginNumber: string | null;
  deliveryRanges: any;
  
  businessHours?: any;
  isTemporarilyClosed?: boolean;
  closedNoticeMessage?: string | null;
  enableExchangePolicy?: boolean;
  exchangePolicy?: string | null;
  
  // Pagamentos
  pixEnabled: boolean;
  pixKeyType: string | null;
  pixKey: string | null;
  pixHolder: string | null;
  
  payOnDeliveryCash: boolean;
  payOnDeliveryCardDebit: boolean;
  payOnDeliveryCardCredit: boolean;
  payOnDeliveryMealVoucher: boolean;
  payOnDeliveryFoodVoucher: boolean;
  
  // Frete e Retirada
  freeShippingEnabled?: boolean;
  freeShippingMinValue?: number | null;
  storePickupEnabled?: boolean;
  deliveryType?: string; // "NO_FEE", "FIXED_FEE", "TO_COMBINE", "DISTANCE"
  deliveryFixedFee?: number | null;
  paymentRules: PaymentRule[];
  installmentRules?: InstallmentRule[] | null;
  
  templateId?: 'classic' | 'menu-express' | 'urban' | 'urban';
  primaryColor?: string | null;
  secondaryColor?: string | null;
  priceColor?: string | null;
  defaultProductSort?: string | null;

  // Estoque e Disponibilidade
  autoHideOutOfStock?: boolean;
  enableStockAlertNotification?: boolean;
  showVariationsOnCard?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

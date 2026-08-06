export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productItemId: string | null;
  productName: string;
  price: number;
  quantity: number;
  variation: string | null;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  itemsTotal: number;
  freight: number;
  totalOrder: number;
  totalReceived: number;
  cardFee?: number;
  
  paymentDiscount?: number;
  installmentSurcharge?: number;
  couponDiscount?: number;
  couponFreightDiscount?: number;
  receiptDiscount?: number;
  receiptSurcharge?: number;
  
  appliedTaxRule?: any;
  appliedCouponRule?: any;
  paymentType: string;
  paymentMethod: string;
  pixKey: string | null;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  complement: string | null;
  observation?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  installments?: number;
  couponId?: string | null;
  coupon?: {
    title: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

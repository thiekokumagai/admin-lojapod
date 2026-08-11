import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductSearch } from "@/components/orders/ProductSearch";
import { CustomerSearch } from "@/components/orders/CustomerSearch";
import { OrderSummary } from "@/components/orders/OrderSummary";
import type { ProductResponse } from "@/types/product";
import { customersService, type Customer, type CustomerAddress } from "@/services/customers.service";
import { getProductById } from "@/services/product.service";
import type { Coupon } from "@/services/coupon.service";
import { useOrderDetails, useUpdateOrderFull } from "@/hooks/useOrders";
import { useToast } from "@/components/ui/use-toast";
import { buildImageUrl } from "@/utils/image-url";
import { useSettings } from "@/hooks/useSettings";
import { useFreight } from "@/hooks/useFreight";
import { formatFreightDestinationAddress } from "@/utils/freight-address";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SimpleAddressForm } from "@/components/orders/SimpleAddressForm";

interface OrderItem {
  productId: string;
  productItemId?: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variation?: string;
  maxStock?: number;
  isPromo?: boolean;
  oldPrice?: number;
}

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: order, isLoading } = useOrderDetails(id ?? "");
  const updateMutation = useUpdateOrderFull();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBudgetMode, setIsBudgetMode] = useState(false);
  const [customTotal, setCustomTotal] = useState("");
  const [showProductPrices, setShowProductPrices] = useState(true);
  const [orderNote, setOrderNote] = useState("");
  
  const [productForVariation, setProductForVariation] = useState<ProductResponse | null>(null);

  const { data: storeSettings } = useSettings();
  const { calculate, loading: isCalculatingFreight } = useFreight();

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [creditInstallments, setCreditInstallments] = useState(1);

  // Load existing order data
  useEffect(() => {
    if (order) {
      // Configura itens iniciais, depois busca infos atualizadas de promo/preço antigo
      const initialItems = order.items.map(item => ({
        productId: item.productId,
        productItemId: item.productItemId,
        title: item.productName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        variation: item.variation || undefined,
        maxStock: undefined, 
        isPromo: false, // will be updated below
        oldPrice: item.price,
      }));
      setOrderItems(initialItems);

      const loadProductsData = async () => {
        try {
          const enrichedItems = await Promise.all(
            initialItems.map(async (item) => {
              try {
                const product = await getProductById(item.productId);
                if (product) {
                  return {
                    ...item,
                    price: product.promotionalPrice || product.price || item.price,
                    isPromo: !!product.promotionalPrice,
                    oldPrice: product.price || item.price,
                  };
                }
              } catch (e) {
                console.warn("Could not fetch product", item.productId);
              }
              return item;
            })
          );
          setOrderItems(enrichedItems);
        } catch (e) {
          console.error("Error enriching items", e);
        }
      };
      loadProductsData();

      const orderAddressObj: CustomerAddress = {
        id: "endereco-pedido",
        customerId: order.customerId || "",
        street: order.street,
        number: order.number,
        neighborhood: order.neighborhood,
        city: order.city,
        state: order.state,
        cep: order.cep,
        complement: order.complement || "",
        isDefault: true,
      };

      // Carrega os endereços salvos do cliente do banco de dados
      const loadFullCustomerData = async () => {
        let fullCustomer: Customer | null = null;
        if (order.customerId) {
          fullCustomer = await customersService.getCustomerById(order.customerId).catch(() => null);
        }
        if (!fullCustomer && order.customerPhone) {
          const searchRes = await customersService.getCustomers({ search: order.customerPhone }).catch(() => null);
          if (searchRes && searchRes.data && searchRes.data.length > 0) {
            fullCustomer = searchRes.data[0];
          }
        }

        if (fullCustomer && fullCustomer.addresses && fullCustomer.addresses.length > 0) {
          const matchedAddr = fullCustomer.addresses.find(
            a => a.street === order.street && a.number === order.number
          );
          let allAddresses = [...fullCustomer.addresses];

          if (matchedAddr) {
            allAddresses = allAddresses.map(a => ({
              ...a,
              isDefault: a.id === matchedAddr.id
            }));
            setSelectedAddress(matchedAddr);
          } else {
            allAddresses = [orderAddressObj, ...allAddresses.map(a => ({ ...a, isDefault: false }))];
            setSelectedAddress(orderAddressObj);
          }

          setSelectedCustomer({
            ...fullCustomer,
            name: order.customerName || fullCustomer.name,
            phone: order.customerPhone || fullCustomer.phone,
            addresses: allAddresses
          });
        } else {
          setSelectedCustomer({
            id: order.customerId || "",
            name: order.customerName,
            phone: order.customerPhone,
            addresses: [orderAddressObj]
          });
          setSelectedAddress(orderAddressObj);
        }
      };

      loadFullCustomerData();
      if (order.coupon) {
        setCoupon({
          id: order.couponId || "",
          code: "",
          title: order.coupon.title,
          type: order.coupon.type as any,
          value: 0,
          currentUses: 0,
          isActive: true
        });
      }
      setPaymentMethod(order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'credit' ? 'Cartão de Crédito' : order.paymentMethod === 'debit' ? 'Cartão de Débito' : order.paymentMethod === 'cash' ? 'Dinheiro' : order.paymentMethod);
      setIsPaid(order.paymentStatus === "PAID");
      setCreditInstallments(order.installments || 1);
      setCustomTotal("");
      setOrderNote(order.observation || "");
    }
  }, [order]);

  useEffect(() => {
    if (selectedAddress) {
      const fullDest = formatFreightDestinationAddress(selectedAddress);
      calculate(fullDest).then(res => {
         if (res && !res.error && res.freightPrice !== null) {
            setDeliveryFee(res.freightPrice);
         } else {
            setDeliveryFee(0);
         }
      });
    } else {
      setDeliveryFee(0);
    }
  }, [selectedAddress, calculate]);

  const pixDiscountPercent = useMemo(() => {
    const rule = storeSettings?.paymentRules?.find((r: any) => r.paymentMethod === 'pix' && r.type === 'discount');
    return rule ? rule.value : 0;
  }, [storeSettings]);

  const installmentsOptions = useMemo(() => {
    const rules = storeSettings?.paymentRules?.filter((r: any) => r.paymentMethod === 'credit' && r.type === 'charge') || [];
    const options = [{ value: 1, interest: 0 }];
    if (rules.length === 0) return options;
    rules.sort((a: any, b: any) => (a.parcelaMin || 0) - (b.parcelaMin || 0));
    rules.forEach((rule: any) => {
       const min = rule.parcelaMin || 2;
       const max = rule.parcelaMax || min;
       const interest = rule.passedToCustomer !== false ? rule.value : 0; 
       for (let i = min; i <= max; i++) {
           if (!options.find(o => o.value === i)) {
               options.push({ value: i, interest: interest });
           }
       }
    });
    return options.sort((a, b) => a.value - b.value);
  }, [storeSettings]);

  const effectiveItems = orderItems.map(item => {
    if (paymentMethod !== "PIX" && paymentMethod !== "" && item.isPromo && item.oldPrice) {
      return { ...item, price: item.oldPrice };
    }
    return item;
  });

  const subtotal = effectiveItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = coupon ? (coupon.type === "VALUE" ? (coupon.value || 0) : coupon.type === "PERCENTAGE" ? subtotal * ((coupon.value || 0) / 100) : 0) : 0;
  
  const totalAfterCoupon = Math.max(0, subtotal - discount);
  const effectiveDeliveryFee = coupon?.type === 'FREE_SHIPPING' ? 0 : deliveryFee;
  
  const nonPromoItemsTotal = effectiveItems.reduce((acc, item) => acc + (!item.isPromo ? item.price * item.quantity : 0), 0);
  const pixDiscountBase = Math.min(nonPromoItemsTotal, totalAfterCoupon);
  
  const pixDiscountAmount = paymentMethod === "PIX" ? pixDiscountBase * (pixDiscountPercent / 100) : 0;
  const discountedProductsTotal = totalAfterCoupon - pixDiscountAmount;

  const effectiveCreditInstallments = paymentMethod === "Cartão de Crédito" ? creditInstallments : 1;
  const selectedInstallment = installmentsOptions.find((opt) => opt.value === effectiveCreditInstallments) ?? installmentsOptions[0];
  const creditInterestAmount = paymentMethod === "Cartão de Crédito" ? (totalAfterCoupon + effectiveDeliveryFee) * (selectedInstallment.interest / 100) : 0;

  const total = discountedProductsTotal + effectiveDeliveryFee + creditInterestAmount;
  const parsedCustomTotal = parseFloat(customTotal.replace(/\./g, '').replace(',', '.'));
  const finalTotal = !isNaN(parsedCustomTotal) && customTotal.trim() !== "" ? parsedCustomTotal : total;

  const isValid = (isBudgetMode || (selectedCustomer !== null && selectedAddress !== null)) && orderItems.length > 0 && paymentMethod !== "";

  const handleSubmit = async () => {
    if (!id || !isValid || (!isBudgetMode && !selectedCustomer)) return;
    
    if (isBudgetMode) {
      toast({
        title: "Modo Orçamento",
        description: "Orçamentos servem apenas para calcular preços e não são salvos.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = selectedCustomer.id;
      let finalCustomerName = selectedCustomer.name;
      let finalCustomerPhone = selectedCustomer.phone;

      // Se o cliente existe no banco, atualiza nome e telefone no cadastro dele
      if (selectedCustomer.id && !selectedCustomer.id.startsWith("temp_")) {
        try {
          await customersService.updateCustomer(selectedCustomer.id, {
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
          });
        } catch (err) {
          console.warn("Não foi possível atualizar o cliente no banco ao editar pedido:", err);
        }
      } else if (!selectedCustomer.id || selectedCustomer.id.startsWith("temp_")) {
        // Se era um cliente temporário, cria no banco de dados
        try {
          const createdCust = await customersService.createCustomer({
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
          });
          if (createdCust && createdCust.id) {
            finalCustomerId = createdCust.id;
          }
        } catch (err) {
          console.warn("Não foi possível cadastrar o cliente no banco ao editar pedido:", err);
        }
      }

      // Se houver um endereço selecionado e o cliente tiver ID no banco, atualiza ou adiciona o endereço no cliente
      if (finalCustomerId && !finalCustomerId.startsWith("temp_") && selectedAddress) {
        const isTempAddress = !selectedAddress.id || selectedAddress.id.startsWith("temp_") || selectedAddress.id === "endereco-pedido" || selectedAddress.id.startsWith("addr_");
        const payloadAddr = {
          street: selectedAddress.street,
          number: selectedAddress.number,
          neighborhood: selectedAddress.neighborhood,
          city: selectedAddress.city,
          state: selectedAddress.state,
          cep: selectedAddress.cep,
          complement: selectedAddress.complement,
        };

        if (isTempAddress) {
          try {
            await customersService.addAddress(finalCustomerId, payloadAddr);
          } catch (err) {
            console.warn("Não foi possível adicionar o endereço no cliente ao editar pedido:", err);
          }
        } else {
          try {
            await customersService.updateAddress(finalCustomerId, selectedAddress.id, payloadAddr);
          } catch (err) {
            console.warn("Não foi possível atualizar o endereço no cliente ao editar pedido:", err);
          }
        }
      }

      const payload = {
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerId: finalCustomerId && !finalCustomerId.startsWith("temp_") ? finalCustomerId : undefined,
        itemsTotal: Number(subtotal.toFixed(2)),
        freight: Number(effectiveDeliveryFee.toFixed(2)),
        paymentDiscount: paymentMethod === 'PIX' ? Number(pixDiscountAmount.toFixed(2)) : 0,
        installmentSurcharge: paymentMethod === 'Cartão de Crédito' ? Number(creditInterestAmount.toFixed(2)) : 0,
        couponTitle: coupon?.title || undefined,
        couponDiscount: coupon?.type !== 'FREE_SHIPPING' ? Number(discount.toFixed(2)) : 0,
        couponFreightDiscount: coupon?.type === 'FREE_SHIPPING' ? Number(deliveryFee.toFixed(2)) : 0,
        totalOrder: Number(finalTotal.toFixed(2)),
        totalReceived: isPaid ? Number(finalTotal.toFixed(2)) : 0,
        paymentType: paymentMethod === 'PIX' ? 'online' : 'entrega',
        paymentMethod: paymentMethod === 'PIX' ? 'pix' : paymentMethod === 'Cartão de Crédito' ? 'credit' : paymentMethod === 'Cartão de Débito' ? 'debit' : paymentMethod === 'Dinheiro' ? 'cash' : paymentMethod,
        paymentStatus: isPaid ? "PAID" : "PENDING",
        installments: paymentMethod === 'Cartão de Crédito' ? effectiveCreditInstallments : 1,
        showProductPrices: showProductPrices,
        street: selectedAddress?.street || "Local",
        number: selectedAddress?.number || "S/N",
        neighborhood: selectedAddress?.neighborhood || "Local",
        city: selectedAddress?.city || storeSettings?.searchCity || "Campo Grande",
        state: selectedAddress?.state || "MS",
        cep: selectedAddress?.cep || "00000-000",
        complement: selectedAddress?.complement || "",
        observation: orderNote.trim(),
        items: effectiveItems.map(item => ({
          productId: item.productId,
          productItemId: item.productItemId,
          productName: item.title,
          quantity: item.quantity,
          price: item.price,
          variation: item.variation || ""
        }))
      };

      await updateMutation.mutateAsync({ id, payload });
      toast({
        title: "Pedido editado com sucesso!",
        description: "As alterações foram salvas e enviadas para impressão."
      });
      navigate("/pedidos");
    } catch (error) {
      toast({
        title: "Erro ao editar pedido",
        description: "Tente novamente ou verifique os dados.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProduct = (product: ProductResponse) => {
    if (product.variations && product.variations.length > 0 && product.items && product.items.length > 0) {
      setProductForVariation(product);
      return;
    }
    const defaultItem = product.items?.[0];
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id && !item.variation);
      if (existing) {
        const newQuantity = existing.quantity + 1;
        if (newQuantity > product.totalStock) return prev;
        return prev.map((item) => 
          item.productId === product.id && !item.variation ? { ...item, quantity: newQuantity } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productItemId: defaultItem?.id,
          title: product.title,
          price: product.promotionalPrice || product.price || 0,
          quantity: 1,
          imageUrl: product.images?.[0]?.url,
          maxStock: product.totalStock,
          isPromo: !!product.promotionalPrice,
          oldPrice: product.price || 0,
        }
      ];
    });
  };

  const confirmAddVariation = (selectedItem: any) => {
    if (!productForVariation || !selectedItem) return;
    const variationLabel = selectedItem.options.map((o: any) => o.optionValue).join(" - ");
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === productForVariation.id && item.variation === variationLabel);
      if (existing) {
        const newQuantity = existing.quantity + 1;
        if (newQuantity > selectedItem.stock) return prev;
        return prev.map((item) => 
          item.productId === productForVariation.id && item.variation === variationLabel ? { ...item, quantity: newQuantity } : item
        );
      }
      return [
        ...prev,
        {
          productId: productForVariation.id,
          productItemId: selectedItem.id,
          title: productForVariation.title,
          price: productForVariation.promotionalPrice || productForVariation.price || 0,
          quantity: 1,
          imageUrl: productForVariation.images?.[0]?.url,
          variation: variationLabel,
          maxStock: selectedItem.stock,
          isPromo: !!productForVariation.promotionalPrice,
          oldPrice: productForVariation.price || 0,
        }
      ];
    });
    setProductForVariation(null);
  };

  const handleUpdateQuantity = (productId: string, variation: string | undefined, quantity: number) => {
    if (quantity < 1) return;
    setOrderItems((prev) => 
      prev.map((item) => {
        if (item.productId === productId && item.variation === variation) {
          if (item.maxStock !== undefined && quantity > item.maxStock) {
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const handleRemoveProduct = (productId: string, variation: string | undefined) => {
    setOrderItems((prev) => prev.filter((item) => !(item.productId === productId && item.variation === variation)));
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Editar Pedido #{order?.orderNumber}</h1>
          <p className="text-sm text-slate-500 font-medium">Altere produtos, cliente ou desconto.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Products and Customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Search Section */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Produtos</h2>
            <ProductSearch onSelectProduct={handleAddProduct} />
            
            {orderItems.length > 0 && (
              <div className="mt-6 space-y-3">
                {effectiveItems.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={buildImageUrl(item.imageUrl)} alt={item.title} className="w-10 h-10 rounded-md object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
                          <span className="text-xs text-slate-400">Sem img</span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-700 text-sm">{item.title}</div>
                        {item.variation && <div className="text-xs text-slate-500">{item.variation}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right flex flex-col items-end">
                        {item.isPromo && item.oldPrice && paymentMethod !== "PIX" && paymentMethod !== "" && (
                          <span className="text-xs text-amber-500 font-bold">Sem desconto PIX</span>
                        )}
                        {item.isPromo && item.oldPrice && (paymentMethod === "PIX" || paymentMethod === "") && (
                          <span className="text-xs text-muted-foreground line-through">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.oldPrice * item.quantity)}
                          </span>
                        )}
                        <span className="font-bold text-slate-700 text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7 rounded-md"
                          onClick={() => handleUpdateQuantity(item.productId, item.variation, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7 rounded-md disabled:opacity-50"
                          disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                          onClick={() => handleUpdateQuantity(item.productId, item.variation, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                        onClick={() => handleRemoveProduct(item.productId, item.variation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Search Section */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Cliente</h2>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isBudgetMode} 
                  onCheckedChange={(val) => {
                    setIsBudgetMode(val);
                    if (val) {
                      setSelectedCustomer(null);
                      setSelectedAddress(null);
                    }
                  }} 
                />
                <Label className="text-sm font-medium text-slate-600 cursor-pointer" onClick={() => setIsBudgetMode(!isBudgetMode)}>Modo Orçamento</Label>
              </div>
            </div>
            
            {isBudgetMode ? (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                  <strong>Atenção:</strong> No modo orçamento o pedido não é salvo no sistema. Apenas calcule o frete buscando um endereço.
                </div>
                
                {selectedAddress ? (
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                    <div className="font-medium text-slate-800">Endereço de Entrega (Orçamento)</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {selectedAddress.street}, {selectedAddress.number} - {selectedAddress.neighborhood}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-2 right-2 text-slate-500"
                      onClick={() => setSelectedAddress(null)}
                    >
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <SimpleAddressForm 
                    onCancel={() => {}}
                    onSave={(addr) => setSelectedAddress(addr)}
                  />
                )}
              </div>
            ) : (
              <CustomerSearch 
                initialCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer} 
                onSelectAddress={setSelectedAddress} 
                mode="edit"
              />
            )}

            {!isBudgetMode && selectedCustomer && (
              <div className="mt-6">
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Observação do Pedido (Opcional)</Label>
                <textarea 
                  className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ex: Entregar na portaria, troco para 100..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary and Payment */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Resumo do Pedido</h2>
            <OrderSummary 
              subtotal={subtotal}
              deliveryFee={effectiveDeliveryFee}
              discount={discount}
              total={total}
              coupon={coupon}
              onApplyCoupon={setCoupon}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              creditInstallments={creditInstallments}
              onCreditInstallmentsChange={setCreditInstallments}
              installmentsOptions={installmentsOptions}
              isPaid={isPaid}
              onIsPaidChange={setIsPaid}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isValid={isValid}
              pixDiscountAmount={pixDiscountAmount}
              creditInterestAmount={creditInterestAmount}
              isCalculatingFreight={isCalculatingFreight}
              isBudgetMode={isBudgetMode}
              customTotal={customTotal}
              onCustomTotalChange={setCustomTotal}
              showProductPrices={showProductPrices}
              onShowProductPricesChange={setShowProductPrices}
              submitLabel="Salvar e Imprimir"
            />
          </div>
        </div>
      </div>
      
      {/* Variations Dialog */}
      <Dialog open={!!productForVariation} onOpenChange={(open) => !open && setProductForVariation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolha a Variação</DialogTitle>
            <DialogDescription>
              Selecione a variação desejada para o produto "{productForVariation?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {productForVariation?.items?.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${item.stock > 0 ? 'hover:bg-slate-50 cursor-pointer border-slate-200' : 'opacity-50 border-slate-100 bg-slate-50 cursor-not-allowed'}`}
                onClick={() => {
                  if (item.stock > 0) {
                    confirmAddVariation(item);
                  }
                }}
              >
                <div className="font-medium text-slate-800">
                  {item.options.map(o => o.optionValue).join(" - ")}
                </div>
                <div className="text-sm text-slate-500">
                  {item.stock} em estoque
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

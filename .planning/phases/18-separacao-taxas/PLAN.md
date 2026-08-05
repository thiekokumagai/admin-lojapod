# Fase 18: Separação de Taxas e Descontos (Front-end)

Este documento registra as modificações feitas no painel administrativo para suportar a segregação de taxas e descontos nos pedidos.

## O Que Foi Feito

### 1. Tipagem e Serviço de Dados

- **`types/order.ts`:** Ampliamos a interface `Order` para englobar os novos dados: `paymentDiscount`, `installmentSurcharge`, `couponDiscount`, `couponFreightDiscount`, `receiptDiscount` e `receiptSurcharge`.
- **`services/order.service.ts`:** Alteramos a assinatura e o envio de payload do método `receiveOrder` para contemplar os novos campos detalhados.

### 2. Componente de Recebimento (`OrderDetailDrawer.tsx`)

- Alteramos a mecânica do método interno `handleReceiveOrder`.
- Antes os estados combinados (como soma de descontos) eram enviados para as chaves antigas do back-end (`discount`, `surcharge`).
- Agora o Drawer mapeia rigorosamente cada pedaço (desconto manual vai para `receiptDiscount`, desconto de PIX vai para `paymentDiscount`, juros de cartão vão para `installmentSurcharge`) evitando sobreposições.

### 3. Exibição Detalhada (`OrderDetailsPage.tsx`)

- A seção "Resumo Financeiro" do pedido ganhou mais transparência.
- O bloco agora renderiza os descontos de forma individual (se existirem), incluindo nomes específicos como `Desconto Cupom`, `Desconto Frete (Cupom)`, `Desconto Pagamento`, `Desconto Recebimento`.
- O mesmo se aplica para acréscimos (`Acréscimo Parcelamento` e `Acréscimo Recebimento`).

### 4. Caixas

- O código do `CashRegisterDetailsPage.tsx` foi avaliado. Como os fechamentos de caixa utilizam `totalReceived` e `cardFee` do pedido finalizado, eles continuam compatíveis e operantes sem necessidade de atualização, já que a regra de agrupamento financeiro ocorre internamente no pedido.

### 5. Testes

paymentDiscount → desconto por forma de pagamento (ex: PIX)
installmentSurcharge → juros/acréscimo de parcelamento
couponDiscount → desconto de cupom
couponFreightDiscount → desconto de frete do cupom
receiptDiscount → desconto manual no recebimento
receiptSurcharge → acréscimo manual no recebimento

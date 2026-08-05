# Plan 24-01: Interface de Criação de Pedido no Admin (Completo)

## Resumo das Alterações
1. **Página `CreateOrderPage.tsx` e Rota:** Foi criada a nova página com o layout dividido em seções para Produtos, Cliente e Resumo. A rota `/pedidos/novo` foi adicionada em `src/App.tsx`. Também adicionado um botão "Novo Pedido" na listagem de pedidos em `OrdersPage.tsx`.
2. **Busca de Produtos:** Criado o componente `ProductSearch.tsx` que utiliza a API de produtos para buscar pelo nome via input, permitindo selecionar o produto e adicioná-lo à lista do pedido com opção de alterar quantidade ou remover (gerenciado localmente).
3. **Busca de Clientes:** Criado o componente `CustomerSearch.tsx`. Permite a busca por telefone ou nome usando um debounce. Exibe resultados e, ao selecionar um cliente, mostra e permite selecionar os endereços salvos deste cliente usando RadioGroup.
4. **Resumo e Pagamento:** Criado o componente `OrderSummary.tsx` que exibe o input de cupom com botão "Aplicar", valida localmente com os cupons ativos, e mostra um combo box de Forma de Pagamento e um toggle "Pedido já está pago?". O cálculo de subtotal, desconto e total foi implementado de forma reativa.
5. **Finalização do Pedido:** O endpoint `createOrder` foi adicionado em `src/services/order.service.ts`. A ação do botão "Finalizar Pedido" chama a API com o payload completo e depois de um sucesso exibe um toast notification e redireciona de volta à lista de pedidos.
6. **Correções:** Resolvido um problema de importação do `useToast` para usar corretamente o componente da UI em vez do hook da pasta incorreta.

## Decisões Técnicas
- **Estado Local:** O estado principal foi centralizado no componente pai `CreateOrderPage.tsx` para fácil construção do payload final, enquanto as complexidades de busca foram delegadas aos filhos.
- **Validação de Cupom:** A validação é feita buscando a lista de todos os cupons disponíveis e verificando a disponibilidade (status = true) e regras (valor mínimo) localmente, pois não foi criado/não há um endpoint de validação única na API de momento.
- **Tratamento de Pagamento:** Foi utilizado o endpoint unificado `POST /orders` para enviar a lista de produtos formatados, forma de pagamento, se já foi pago, cliente e endereço, se existente.

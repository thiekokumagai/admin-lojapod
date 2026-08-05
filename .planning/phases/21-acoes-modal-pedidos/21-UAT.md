# UAT: Fase 21 - Ações do modal de pedidos

**Data:** 27/05/2026
**Status:** 🟡 Pendente de Validação

## Critérios de Aceite (Testes)

- [ ] **Teste 1: Botões Desabilitados**
  - **Ação:** Abra o painel e acesse os detalhes de um pedido.
  - **Esperado:** Os botões de **Compartilhar** e **Editar Pedido** devem estar na tela, mas desabilitados (sem ação ao clicar).

- [ ] **Teste 2: Botão do WhatsApp**
  - **Ação:** Ainda no modal de pedidos, clique no botão do **WhatsApp**.
  - **Esperado:** Deve abrir uma nova aba com o link da API do WhatsApp (`https://wa.me/55...`) com o número de telefone extraído do pedido.

- [ ] **Teste 3: Impressão de Recibo**
  - **Ação:** Clique no botão de **Imprimir**.
  - **Esperado:** 
    1. Deve abrir a rota `/pedidos/:id/imprimir` em uma nova aba.
    2. A tela deve mostrar o layout em formato de nota (linhas pontilhadas separando produtos dos preços, resumo das informações, etc).
    3. A caixa de diálogo de impressão do navegador deve abrir **automaticamente** em cerca de meio segundo.
    4. Ao fechar a caixa de impressão (seja confirmando ou cancelando), a aba da nota deve se **fechar automaticamente**.

---
*Aguardando feedback do usuário para cada um dos itens.*

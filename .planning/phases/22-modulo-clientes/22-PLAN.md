# Phase 22: Módulo de Clientes

**Goal**: Criar e gerenciar a base de clientes do e-commerce. A captura automática no ato do pedido já foi implementada; agora precisamos da interface de listagem, detalhes e edição, bem como os endpoints correspondentes.

## Wave 1: Backend API (Clientes e Endereços)

- [x] **22-01: Endpoints e Serviços do CustomerModule**
  - **Contexto**: O model `Customer` e a captura automática já estão no Prisma, mas falta a API REST.
  - **Ação**: Criar `customers.controller.ts`, `customers.service.ts` e `customers.module.ts`.
  - **Endpoints**:
    - `GET /api/customers` (Listagem paginada com filtro por nome e telefone)
    - `GET /api/customers/:id` (Detalhes e relacionamento de endereços)
    - `PUT /api/customers/:id` (Atualizar nome/telefone)
  - `gap_closure`: false

## Wave 2: Frontend (Painel Administrativo)

- [x] **22-02: Integração e Serviços no Frontend**
  - **Contexto**: A UI precisará buscar dados na nova API.
  - **Ação**: Criar o arquivo `customers.service.ts` no frontend consumindo a nova API.
  - `gap_closure`: false

- [x] **22-03: Tela de Listagem e Navegação**
  - **Contexto**: O lojista precisa de uma página dedicada aos clientes.
  - **Ação**: 
    - Adicionar o item **"Clientes"** no `AdminSidebar.tsx` (na mesma seção de Pedidos).
    - Criar `CustomersPage.tsx` com uma tabela de dados (Nome, Telefone, Quantidade de Pedidos, Data de Cadastro).
    - Implementar paginação e busca por termo.
  - `gap_closure`: false

- [x] **22-04: Drawer de Detalhes e Histórico**
  - **Contexto**: Exibir as informações avançadas do cliente.
  - **Ação**: Criar um componente de "Gaveta" (Drawer) que abre ao clicar na linha da tabela do cliente, mostrando os endereços salvos dele e um botão/link para ver o histórico de pedidos.
  - `gap_closure`: false

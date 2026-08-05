# Phase 26: Trocar tabelas por grid (cards) no mobile no admin - PLAN

**Objetivo**: Substituir a rolagem horizontal de tabelas em dispositivos móveis por um layout de grid/cards onde os itens ficam "um embaixo do outro" (empilhados), melhorando consideravelmente a usabilidade mobile do painel administrativo.

## 1. Escopo das Melhorias
Ao invés de exigir rolagem horizontal para visualizar dados, usaremos as classes responsivas do Tailwind (`hidden md:table` e `grid md:hidden` ou `flex md:hidden`) para renderizar os dados em forma de Cards no mobile e Tabelas no Desktop.

## 2. Tarefas e Implementação

### [x] Tarefa 26.01: Grid Mobile de Produtos e Categorias
**Descrição:** Atualizar `ProductListTable.tsx` e `CategoriesPage.tsx`.
**Ações:**
1. Em `ProductListTable.tsx`, manter o `<Table>` com `hidden md:table` (ou `hidden md:block` no container). Criar um bloco iterando `products.map` com layout de card:
   - Exibir imagem (ou fallback), título, e preço em destaque.
   - Status e estoque (badges) logo abaixo.
   - Botão de ações (dropdown) no topo direito do card.
2. Em `CategoriesPage.tsx`, fazer o mesmo para as categorias, mantendo o botão de reordenação arrastável no lado esquerdo do card e os botões de edição no lado direito.

### [x] Tarefa 26.02: Grid Mobile de Pedidos e Clientes
**Descrição:** Atualizar `OrdersPage.tsx` e `CustomersPage.tsx`.
**Ações:**
1. Em `OrdersPage.tsx`, transformar o mapeamento de `groupedOrders` para renderizar `divs` (cards) com borda arredondada. Incluir o número do pedido, o status com badge e o total formatado no layout em blocos empilhados.
2. Em `CustomersPage.tsx`, transformar a tabela de clientes num grid (`flex-col gap-3 md:hidden`). O card exibirá Nome (destaque), Telefone, e Data de cadastro, com uma seta de navegação (`ChevronRight`).

### [x] Tarefa 26.03: Grid Mobile no Financeiro (Caixas, Custos e Investimentos)
**Descrição:** Atualizar `CashRegistersPage.tsx`, `CustosFixosPage.tsx` e `InvestmentsPage.tsx`.
**Ações:**
1. Converter a tabela de `CashRegistersPage` para cards (Título em negrito, Período, botões de ação na base do card).
2. Converter a tabela de `CustosFixosPage` para cards (Nome, valor, repetição, ações em botões lado a lado).
3. Converter a tabela de histórico de `InvestmentsPage` para cards com formatação que identifique claramente Entradas e Saídas por cores.

### [x] Tarefa 26.04: Grid Mobile no Resumo de Caixa e Movimentações Manuais
**Descrição:** Atualizar os painéis detalhados em `CashRegisterDetailsPage.tsx`.
**Ações:**
1. Na visualização "Pedidos Incluídos neste Caixa", implementar a estrutura em formato de lista/cards.
2. Na visualização "Movimentações Manuais", apresentar a lista de movimentações como extrato em blocos verticais, com valor à direita e descrição em texto principal.

## 3. Critérios de Sucesso (UAT)
- [x] No mobile (telas < 768px), o layout exibe blocos (cards) para cada item nas páginas principais ao invés de usar `overflow-x-auto` em `Table`.
- [x] No desktop (telas >= 768px), o layout continua exibindo o padrão original em tabela sem quebrar o estilo.
- [x] O scroll vertical com lista em grid/cards é fluído e não há vazamento do conteúdo nas laterais.
- [x] Todos os botões e ações da linha continuam acessíveis dentro do respectivo card no mobile.

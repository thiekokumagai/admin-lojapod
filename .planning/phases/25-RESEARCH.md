# Phase 25: Melhoria de todas as telas no mobile do admin - RESEARCH

**Objetivo**: Analisar o painel administrativo (`ecommerce-admin-front`) para identificar e mapear gargalos de usabilidade e problemas de responsividade em dispositivos móveis.

## 1. Problemas Comuns Identificados (Padrões de UI)

### 1.1 Tabelas e Listagens (DataTables)
Telas afetadas: `OrdersPage`, `ProductsPage`, `CustomersPage`, `CashRegisterDetailsPage`, etc.
- **Problema**: O componente `<Table>` puro quebra em telas menores ou fica espremido, dificultando a leitura e o clique nas ações.
- **Solução**: Envolver as tabelas em uma `div` com `overflow-x-auto` para permitir scroll horizontal no mobile. Alternativamente, para listas críticas como Pedidos e Produtos, usar um layout de "Cards" (empilhado) no mobile e tabela apenas em telas maiores (`md:table`).

### 1.2 Barras de Busca e Filtros
Telas afetadas: Praticamente todas que listam dados (`DashboardPage`, `OrdersPage`).
- **Problema**: Formulários em linha (`flex-row`) com inputs de busca e botões de filtro lado a lado vazam da tela ou esmagam os campos.
- **Solução**: Usar `flex-col md:flex-row` para que, no mobile, a busca e os filtros fiquem um debaixo do outro, ocupando `w-full`.

### 1.3 Modais e Drawers (Dialog / Sheet)
- **Problema**: Formulários longos dentro de modais (como edição de estoque, detalhes de pedido, etc.) não rolam corretamente ou têm botões de ação escondidos abaixo do teclado virtual do celular.
- **Solução**: Garantir `max-h-[90vh] overflow-y-auto` no conteúdo do modal. Fixar o `<DialogFooter>` na parte inferior ou garantir espaçamento adequado.

### 1.4 Navegação (Tabs)
Telas afetadas: `CashRegisterDetailsPage` (Pedidos Recebidos / Movimentações), `ProductDetailsPage`.
- **Problema**: O `<TabsList>` quando possui muitos itens quebra para múltiplas linhas feias ou corta o texto.
- **Solução**: Adicionar `overflow-x-auto whitespace-nowrap` ou `flex-wrap` estilizado no `<TabsList>`.

### 1.5 Cabeçalhos e Botões de Ação Principal
- **Problema**: Títulos grandes (como o nome do caixa) ao lado de botões ("Lançar Movimentação") ficam mal alinhados.
- **Solução**: Adicionar `flex-col md:flex-row items-start md:items-center` e `w-full` nos botões do mobile.

## 2. Abordagem de Implementação (Plano de Ação)

Para resolver isso de forma estruturada:

1. **Refatoração Global de Tabelas**:
   - Envolver *todas* as tabelas em `<div className="overflow-x-auto">`.
   - Ajustar `min-w-[800px]` (ou apropriado) na `<Table>` para garantir que ela não esmague o texto interno, ativando o scroll nativo da div pai no mobile.

2. **Ajuste de Cabeçalhos e Buscas**:
   - Procurar por `<div className="flex justify-between items-center">` no topo das páginas e substituir por `<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">`.
   - Garantir que botões como "Novo Pedido", "Adicionar Produto" fiquem com `w-full md:w-auto` no mobile.

3. **Revisão de Grids (Cards)**:
   - Em telas como `DashboardPage` e resumo do Caixa, garantir que os KPIs usem `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. (A tela do caixa já está próxima disso, mas requer conferência).

4. **Correção de Modais/Drawers**:
   - Revisar componentes de Overlay para garantir paddings confortáveis para toque (touch targets de no mínimo 44x44px).

## 3. Conclusão
A implementação não exige mudanças lógicas complexas, mas sim uma varredura em todas as páginas aplicando classes do Tailwind voltadas para a abordagem Mobile-First (ajustando o estado inicial para telas pequenas e aplicando restrições via `md:` e `lg:`).

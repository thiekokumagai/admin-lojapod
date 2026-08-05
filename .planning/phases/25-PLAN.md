# Phase 25: Melhoria de todas as telas no mobile do admin - PLAN

**Objetivo**: Adaptar e melhorar a interface e experiência de uso de todas as telas do painel administrativo para dispositivos móveis, garantindo responsividade e usabilidade, seguindo o `25-RESEARCH.md`.

## 1. Escopo das Melhorias
A fase foca na aplicação de técnicas de web design responsivo (Mobile First) em componentes estruturais do painel (`<Table>`, botões, barras de busca, `<Dialog>`).

## 2. Tarefas e Implementação

### [ ] Tarefa 25.01: Ajuste de Componentes Globais e Layout Base
**Descrição:** Garantir que o Sidebar/Menu e componentes base como tabelas se comportem bem em telas pequenas.
**Ações:**
1. Em `ecommerce-admin-front/src/components/ui/table.tsx`: Adicionar scroll horizontal de forma global ou garantir que os consumos de `Table` sejam enrolados num contêiner com `overflow-x-auto`.
2. Revisar o `Layout` e `Sidebar` para garantir que ocupam o tamanho correto sem vazar em mobile.

### [ ] Tarefa 25.02: Melhoria nas Telas de Produtos, Categorias e Pedidos
**Descrição:** Aplicar refatoração nos cabeçalhos e tabelas destas telas principais.
**Ações:**
1. `ProductsPage.tsx`, `CategoriesPage.tsx`, `OrdersPage.tsx`: Alterar os topos de `flex-row` para `flex-col md:flex-row`.
2. Garantir que os botões "Novo" fiquem com `w-full md:w-auto`.
3. Ajustar o campo de "Busca" para ocupar a largura correta.
4. Envolver o componente `<Table>` num `div overflow-x-auto` com `min-w-[800px]` (ou apropriado) para o conteúdo interno.

### [ ] Tarefa 25.03: Melhoria nas Telas Financeiras e Clientes
**Descrição:** Refatoração visual responsiva nos módulos de Clientes e Caixas.
**Ações:**
1. `CustomersPage.tsx`, `CashRegistersPage.tsx`, `CustosFixosPage.tsx`, `InvestmentsPage.tsx`: Aplicar a mesma lógica de `flex-col md:flex-row` e `<div overflow-x-auto>` nas tabelas.
2. Na página `CashRegisterDetailsPage.tsx`:
   - Corrigir o scroll do `<TabsList>` (garantir que não quebra feio em telas pequenas).
   - Revisar o topo (que já possui `flex-col md:flex-row`, mas verificar o botão "Lançar Movimentação").

### [ ] Tarefa 25.04: Ajuste de Drawers e Modais
**Descrição:** Modais e Drawers devem possuir áreas de rolagem e rodapés fixos, ou pelo menos espaçamentos seguros para mobile.
**Ações:**
1. Revisar `OrderDetailsPage.tsx` (Drawer de pedido) e `ProductDetailsPage.tsx` para garantir que o layout de abas e campos de edição fiquem responsivos.
2. Conferir formulários dentro de Modais, como `DialogContent`, garantindo `max-h-[90vh]` e `overflow-y-auto`.

## 3. Critérios de Sucesso (UAT)
- [ ] O painel não apresenta scroll horizontal no `body` da página em um dispositivo móvel.
- [ ] Todas as tabelas (`Produtos`, `Pedidos`, etc.) podem ser deslizadas lateralmente sem quebrar o restante do layout.
- [ ] Modais podem ser rolados internamente sem esconder botões cruciais sob o teclado.
- [ ] Botões de ação e campos de busca adaptam sua largura adequadamente em telas estreitas.

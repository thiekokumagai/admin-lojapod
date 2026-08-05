# Phase 03 — Research

## RESEARCH COMPLETE

### Menu lateral
- `AdminSidebar.tsx` já importa `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent` mas usa lista plana `menuItems`.
- Padrão: extrair `src/data/admin-nav.ts` com seções `{ label?, items[] }` e mapear para `SidebarGroup` + `SidebarGroupLabel`.

### Configuração unificada
- `DeliveriesPage`, `PaymentsPage`, `SettingsPage` são páginas independentes com estado local + mock.
- Consolidar em `SettingsPage` com 3 componentes de formulário; redirects em `App.tsx` para `/entregas` e `/pagamentos`.

### Listagem de produtos
- `ProductListCard` = cards + filtro cliente; substituir por tabela + `@/components/ui/table` + `pagination`.
- **API (`GET /products`)** já aceita `page`, `limit`, `search`, `categoryId` (`ListProductsDto`).
- Resposta inclui `items[]` com `stock` e `sku` por item (via `findById` no repositório).
- Frontend `getProducts()` ignora query params — precisa estender `product.service.ts` e `useProducts`.
- **Paginação:** preferir **server-side** com `limit=30` (alinha com pedido do usuário e reduz payload).
- API não retorna `total` — usar heurística "página cheia = pode haver próxima" ou pedir `meta.total` em follow-up.
- **Status:** não há campo `active` no `Product`; derivar: `Ativo` se `sum(items.stock) > 0`, senão `Inativo`.
- **Bulk desativar:** `PATCH /products/{id}/items` zerando estoque dos itens; **ativar:** manter UX com toast se sem itens.
- **Bulk excluir:** `DELETE /products/{id}` em sequência (já existe).

### Componentes UI disponíveis
- `checkbox`, `badge`, `select`, `table`, `pagination`, `card`, `alert`.

### Riscos
| Risco | Mitigação |
|-------|-----------|
| Listagem sem total de páginas | Botão próximo desabilitado quando `length < 30` |
| Bulk enable sem itens | Toast + link para editar produto |
| Performance list API (N×findById) | Aceitar na fase; otimizar API em fase futura |

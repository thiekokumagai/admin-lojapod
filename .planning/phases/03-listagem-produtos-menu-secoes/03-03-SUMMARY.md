# Summary — Plan 03-03: Listagem de produtos (tabela + paginação + bulk)

## Status: ✅ Complete

## What was built

Substituição da listagem por cards em tabela administrativa completa com filtros, sort client-side, seleção em massa e paginação server-side de 30 itens por página.

## Files created/modified

- **`src/types/product.ts`**: adicionados `ProductListParams`, `ProductListMeta` e campos `totalStock`, `primarySku`, `status` em `ProductResponse`
- **`src/services/product.service.ts`**: `normalizeProduct` calcula `totalStock`/`primarySku`/`status`; `getProducts()` refatorado para aceitar `ProductListParams` e retornar `{ products, meta }`
- **`src/hooks/useProducts.ts`**: aceita `params?: ProductListParams`; `queryKey: ['products', params]` invalida por filtro/página
- **`src/components/products/ProductListTable.tsx`** (novo): tabela com colunas Checkbox | Foto | Nome↕ | Preço↕ | SKU | Estoque | Status; barra de bulk actions; paginação Previous/Next; `PAGE_SIZE = 30`
- **`src/pages/ProductsPage.tsx`** (reescrito): gerencia estado de `page`, `filters`, `selectedIds`; bulk delete/disable/enable via mutations

## Acceptance criteria verified

- [x] `ProductListTable` exporta e usa `Table` de `@/components/ui/table`
- [x] `PAGE_SIZE = 30` no código
- [x] Barra bulk só renderiza quando `selectedIds.length > 0`
- [x] `ProductsPage.tsx` importa `ProductListTable` (não `ProductListCard`)
- [x] Mudar página incrementa `page` e refetch com `limit=30`
- [x] `npm run build` passou sem erros

## Commit

`feat(03-03): tabela de produtos com paginacao server-side, filtros e bulk actions`

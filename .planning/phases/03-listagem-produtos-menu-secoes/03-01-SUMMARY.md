# Summary — Plan 03-01: Menu lateral em seções

## Status: ✅ Complete

## What was built

Refatoração do `AdminSidebar` para navegação agrupada em seções, eliminando o array `menuItems` hardcoded e centralizando a configuração em `admin-nav.ts`.

## Files created/modified

- **`src/data/admin-nav.ts`** (novo): exporta `dashboardNavItem` (Dashboard solto) e `navSections` (array com 3 seções: Catálogo, Vendas, Configuração)
- **`src/components/admin/AdminSidebar.tsx`** (modificado): removido `menuItems` inline; importa de `@/data/admin-nav`; renderiza Dashboard em `SidebarGroup` sem label + seções agrupadas com `SidebarGroupLabel`

## Acceptance criteria verified

- [x] `src/data/admin-nav.ts` existe e exporta `dashboardNavItem` e `navSections`
- [x] `navSections` tem exatamente 3 seções: "Catálogo", "Vendas", "Configuração"
- [x] Seção Configuração contém apenas 1 item com `url: "/configuracoes"`
- [x] `AdminSidebar.tsx` não contém array `menuItems` hardcoded
- [x] Entregas e Pagamentos removidos do menu lateral

## Commit

`feat(03-01): menu lateral em secoes com navSections + AdminSidebar refatorado`

# Contexto — Listagem de produtos + menu em seções

> Escopo ajustado pelo usuário (substitui estrutura genérica dos prints).

## Menu lateral — estrutura definida

Usar `SidebarGroup` + `SidebarGroupLabel` do módulo existente (`@/components/ui/sidebar`). Config centralizada em `navSections[]` consumida por `AdminSidebar.tsx`.

### Item solto (sem label de seção)

| Label | Rota | Ícone (sugestão) |
|-------|------|------------------|
| Dashboard | `/` | `LayoutDashboard` |

### Seção: Catálogo

| Label | Rota | Ícone (sugestão) |
|-------|------|------------------|
| Produtos | `/produtos` | `Package` |
| Categorias | `/categorias` | `FolderTree` |
| Variações | `/variacoes` | `SlidersHorizontal` |
| Cupons | `/cupons` | `Ticket` |

### Seção: Vendas

| Label | Rota | Ícone (sugestão) |
|-------|------|------------------|
| Pedidos | `/pedidos` | `ShoppingBag` |
| Caixa | `/caixa` | `Landmark` |

### Seção: Configuração

| Label | Rota | Ícone (sugestão) |
|-------|------|------------------|
| Configuração | `/configuracoes` | `Settings` |

**Um único item de menu** — não listar Entregas, Pagamentos e Configurações separadamente na sidebar.

### Removidos do menu

- `/entregas` e `/pagamentos` como rotas de menu (conteúdo absorvido pela página unificada)
- Itens dos prints inexistentes (Collections, CMS, etc.)
- Links soltos da lista plana antiga sem equivalente

---

## Página unificada de Configuração (`/configuracoes`)

Uma página só, com **três blocos/formulários independentes** na mesma tela (scroll vertical ou seções em `Card`). Cada bloco com seu próprio estado e botão **Salvar** (ou salvar por seção).

### 1. Formulário — Entregas

Extrair lógica/UI de `DeliveriesPage.tsx`:

- Endereço de origem
- Tabela de faixas de distância × valor (limite 32 km)
- Alerta de limite máximo

### 2. Formulário — Pagamentos

Extrair lógica/UI de `PaymentsPage.tsx`:

- Chave PIX
- Tabela de parcelas / juros do cartão

### 3. Formulário — Configurações gerais

Manter conteúdo de `SettingsPage.tsx`:

- Logo, banner, dados da loja, horários de funcionamento, etc.

### Implementação sugerida

- `SettingsPage.tsx` — layout da página + título “Configuração”
- Componentes: `DeliverySettingsForm`, `PaymentSettingsForm`, `GeneralSettingsForm` (em `components/settings/` ou similar)
- **Rotas antigas:** redirecionar `/entregas` e `/pagamentos` → `/configuracoes` (compatibilidade) ou remover rotas e atualizar links internos
- Remover `DeliveriesPage` / `PaymentsPage` como páginas de rota após migração (podem virar só os forms)

---

## Tela de listagem de produtos

### Layout (referência prints)

- Cabeçalho: título + botão primário **Novo produto** → `/produtos/novo`
- Barra de filtros: **Busca**, **Status**, **Tipo** (categoria), link **Limpar filtros**
- Tabela: checkbox, **Thumbnail**, **Nome** ↕, **Preço** ↕, **SKU**, **Estoque** ↕, **Status** ↕
- Badge de status (ex.: Ativo — pill verde)
- Barra contextual com linhas selecionadas: **Desativar**, **Ativar**, **Excluir**
- **Paginação** no rodapé da tabela

### Paginação

- Componente: `@/components/ui/pagination`
- **30 itens por página** (`limit = 30`, fixo nesta fase)
- **Server-side** — API já aceita `?page=&limit=&search=&categoryId=` (`ListProductsDto`)
- Estado: `page`, resetar para página 1 ao mudar filtros/busca
- Exibir intervalo: “Mostrando 1–30 de …” (total exato quando API expuser `meta.total`)
- `hasNextPage`: inferir quando retorno tiver 30 itens

### Módulos existentes a reutilizar

- `@/components/ui/sidebar`, `AdminSidebar`, `AdminLayout`
- `@/components/ui/table`, `@/components/ui/pagination`
- `ProductsPage`, `useProducts`, `useCategories`
- Forms atuais em `DeliveriesPage`, `PaymentsPage`, `SettingsPage` (refatorar em componentes)

---

## Estado atual vs alvo

| Área | Hoje | Alvo |
|------|------|------|
| Menu | Lista plana (10 itens) | Dashboard + Catálogo + Vendas + 1 link Configuração |
| Config | 3 páginas/rotas separadas | 1 página, 3 forms separados |
| Listagem | Cards | Tabela + bulk + paginação 30/página |
| Paginação | Nenhuma | Client-side, 30 por página |

---

## Escopo da fase

1. **Menu** — `navSections[]`; seção “Configuração” com um único item.
2. **Página Configuração** — unificar Entregas + Pagamentos + Gerais em `/configuracoes` com forms separados; redirects das rotas antigas.
3. **Listagem** — tabela, filtros, barra de ações em massa.
4. **Paginação** — client-side, **30** itens por página.
5. **Bulk actions** — desativar/ativar/excluir em lote.
6. **API gap** — validar `status`, `sku`, estoque na listagem.

## Fora de escopo

- Paginação server-side (até API suportar)
- Páginas novas só para preencher menu
- Redesign global de tema

# Phase 25: Research (Backend CronJob)

## 1. Current State & Dependencies
- **Scheduling**: O pacote `@nestjs/schedule` **não está instalado** no `ecommerce-api/package.json`. Precisará ser instalado (`npm install @nestjs/schedule`) e importado no `AppModule` (`ScheduleModule.forRoot()`).
- **Prisma Schema**: O modelo `Product` não possui a flag de destaque. Precisaremos adicionar `isBestSeller Boolean @default(false)`.

## 2. Reutilização de Lógica
- A lógica de negócio para determinar o volume de vendas real já existe em `AnalyzePurchaseUseCase` (`ecommerce-api/src/modules/investments/domain/use-cases/analyze-purchase.use-case.ts`).
- Ele agrupa a soma de quantidades (`_sum: { quantity: true }`) da tabela `OrderItem` filtrando por pedidos não cancelados (`status: { not: 'CANCELLED' }`) dos últimos 3 meses, e faz um peso extra para os últimos 15 dias.

## 3. Fluxo do CronJob (Ranking)
1. **Reset**: Fazer um `prisma.product.updateMany({ data: { isBestSeller: false } })` para zerar as coroas antigas.
2. **Cálculo**: Executar a consulta de agregação nos pedidos, somando `quantidade_vendida` por `productId`.
3. **Filtro de Categoria**: Ignorar produtos cuja categoria tenha no nome "resistência" ou "coil". (Pode-se usar uma query na tabela `Category`).
4. **Top 1 por Categoria**: Agrupar os resultados do cálculo por `categoryId` e selecionar o `productId` com a maior `media_mensal` (ou quantidade vendida ponderada).
5. **Update**: Executar um `updateMany` ou uma transação de `update` individual ativando `isBestSeller: true` para os IDs selecionados.

## 4. Risks & Considerations
- **Performance do Banco**: O CronJob fará um `groupBy` na tabela de `OrderItem`. Como será 1x ao dia de madrugada (ex: `0 3 * * *`), não impactará a performance diurna da loja.
- **Sincronização Prisma**: Como haverá mudança no `schema.prisma`, será obrigatório rodar um `schema push` (migrate) e atualizar os clients que dependem disso.

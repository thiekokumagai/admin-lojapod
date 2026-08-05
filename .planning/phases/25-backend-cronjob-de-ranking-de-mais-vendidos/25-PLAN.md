# Phase 25: Backend CronJob de Ranking de Mais Vendidos - Plan

## 1. Setup e Dependências
- **Ação:** Instalar dependência de agendamento no `ecommerce-api`.
- **Comando:** Executar `npm install @nestjs/schedule` no diretório `ecommerce-api`.
- **Implementação:** Importar `ScheduleModule.forRoot()` no `AppModule` (`ecommerce-api/src/app.module.ts`).

## 2. Atualização de Banco de Dados [BLOCKING]
- **Ação:** Adicionar o campo no `schema.prisma`.
- **Implementação:** No model `Product` em `ecommerce-api/prisma/schema.prisma`, adicionar `isBestSeller Boolean @default(false)`.
- **Ação Obrigatória:** Executar `npx prisma db push --accept-data-loss` (ou similar) no backend após a alteração, para refletir no banco de dados, e gerar os novos tipos (`npx prisma generate`).

## 3. Implementação do Serviço de CronJob
- **Ação:** Criar um serviço no módulo de Produtos (`ProductsModule`) chamado `products-ranking.cron.service.ts` (ou similar).
- **Implementação:**
  - Anotar com `@Injectable()`.
  - Criar um método decorado com `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` (ou '0 3 * * *' para rodar as 3h da manhã).
  - O método deve:
    1. Executar um `prisma.product.updateMany({ data: { isBestSeller: false } })` para zerar todos os produtos.
    2. Utilizar lógica semelhante ao `AnalyzePurchaseUseCase` para buscar pedidos dos últimos 3 meses: agrupar `OrderItem` por `productId` onde o status não seja `CANCELLED`.
    3. Trazer também a categoria associada ao produto. Ignorar as categorias que possuam "resistência" ou "coil" (case-insensitive) no nome.
    4. Agrupar os resultados calculados (`_sum.quantity`) em um dicionário usando o `categoryId` como chave. Apenas o `productId` com a maior quantidade para aquela chave "vence".
    5. Disparar `prisma.product.updateMany({ where: { id: { in: vencedores } }, data: { isBestSeller: true } })`.
- **Registro:** Registrar o `ProductsRankingCronService` como `provider` no `ProductsModule`.

## 4. Atualização da Vitrine (Opcional, se o Client Front já exibir)
- **Implementação:** No client-front, a listagem `GET /store/products` da API deve passar a retornar `isBestSeller`. Como a API do backend apenas reflete o model do Prisma na rota de Store (se usar prisma diretamente), o campo já será exposto. No frontend `ecommerce-client-front`, certificar-se que os componentes consumam o novo campo do payload, substituindo o destaque puramente visual via índice pelo verdadeiro campo.

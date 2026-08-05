# Phase 25: Backend: CronJob de ranking de Mais Vendidos - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Criar uma rotina em background (CronJob) na API para calcular os produtos mais vendidos baseados no histórico de pedidos e salvar esse ranking, otimizando o carregamento da loja.
</domain>

<decisions>
## Implementation Decisions

### Frequência de Execução
- O CronJob deve rodar 1 vez por dia.

### Critério de Cálculo
- Utilizar a lógica de avaliação de 3 meses de histórico e tendência de 15 dias (a mesma lógica atualmente aplicada na simulação de compra - `AnalyzePurchaseUseCase`).

### Armazenamento e Regras de Negócio
- Adicionar uma flag `isBestSeller` (booleano) na tabela `Product`.
- A flag deve ser verdadeira para **exatamente 1 produto por categoria**.
- Exceção: A categoria "Resistência" deve ser excluída (nenhum produto desta categoria receberá a flag).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Referência de Cálculo
- `../ecommerce-api/src/modules/investments/domain/use-cases/analyze-purchase.use-case.ts` — Contém a lógica de cálculo de média de 3 meses + tendência de 15 dias.

</canonical_refs>

<specifics>
## Specific Ideas

- O job diário vai resetar todas as flags `isBestSeller` e depois atualizar apenas os "campeões" de cada categoria.
</specifics>

<deferred>
## Deferred Ideas

None — phase scope completely covers the user requests.
</deferred>

---

*Phase: 25-backend-cronjob-de-ranking-de-mais-vendidos*
*Context gathered: 2026-07-02 via /gsd-discuss-phase*

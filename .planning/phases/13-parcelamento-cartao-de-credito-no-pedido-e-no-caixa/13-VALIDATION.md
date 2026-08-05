---
phase: 13
slug: parcelamento-cartao-de-credito-no-pedido-e-no-caixa
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-23
---

# Fase 13 — Estratégia de Validação

> Contrato de validação e amostragem de testes de interface para a Fase 13.

---

## Infraestrutura de Testes

| Propriedade | Valor |
|-------------|-------|
| **Framework** | Vitest / React Testing Library |
| **Arquivo de Configuração** | `vitest.config.ts` |
| **Comando de Teste Rápido** | `npm run test` |
| **Comando de Suite Completa** | `npm run build` |
| **Tempo Estimado** | ~12 segundos |

---

## Frequência de Amostragem

- **Após cada commit de tarefa:** Executar `npm run test` ou compilar
- **Antes da homologação final:** Compilação de produção (`npm run build`) sem erros TypeScript

---

## Mapa de Verificação por Tarefa

| ID da Tarefa | Plano | Onda | Requisito | Ameaça Seg. | Comportamento Seguro | Tipo de Teste | Comando Automatizado | Arquivo Existe | Status |
|--------------|-------|------|-----------|-------------|----------------------|---------------|----------------------|----------------|--------|
| 13-01-01 | 01 | 1 | Parcelas Dinâmicas na Gaveta | — | UI responsiva às regras | unitário | `npm run test` | ❌ W0 | ⬜ pendente |
| 13-01-02 | 01 | 1 | Relatório Premium do Caixa | — | Renderização correta | unitário | `npm run test` | ❌ W0 | ⬜ pendente |

*Status: ⬜ pendente · ✅ verde · ❌ vermelho · ⚠️ instável*

---

## Requisitos da Onda 0 (Wave 0)

- [ ] `src/components/OrderDetailDrawer.spec.tsx`
- [ ] `src/pages/CashRegisterDetailsPage.spec.tsx`

---

## Validações Manuais

| Comportamento | Requisito | Motivo para ser Manual | Instruções de Teste |
|---------------|-----------|------------------------|---------------------|
| Simulação de Recebimento | Operação de Venda | Requer interação com mouse e tela | Selecionar parcelas, verificar legenda e salvar |

---

## Assinatura de Validação

- [x] Todas as tarefas possuem comandos automatizados ou verificações de Onda 0
- [x] Sem flags de modo de observação (watch-mode)
- [x] `nyquist_compliant: true` definido no cabeçalho (frontmatter)

**Aprovação:** pendente

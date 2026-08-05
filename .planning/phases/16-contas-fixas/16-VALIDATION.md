---
phase: 16
slug: contas-fixas
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-25
---

# Fase 16 — Estratégia de Validação (Frontend)

> Contrato de validação e amostragem de testes de interface para a Fase 16.

---

## Infraestrutura de Testes

| Propriedade | Valor |
|-------------|-------|
| **Framework** | Vitest / React Testing Library |
| **Arquivo de Configuração** | `vitest.config.ts` |
| **Comando de Teste Rápido** | `npm run test` |
| **Comando de Suite Completa** | `npm run build` |
| **Tempo Estimado** | ~15 segundos |

---

## Frequência de Amostragem

- **Após cada commit de tarefa:** Executar `npm run test` ou compilar
- **Antes da homologação final:** Compilação de produção (`npm run build`) sem erros TypeScript

---

## Mapa de Verificação por Tarefa

| ID da Tarefa | Plano | Onda | Requisito | Ameaça Seg. | Comportamento Seguro | Tipo de Teste | Comando Automatizado | Arquivo Existe | Status |
|--------------|-------|------|-----------|-------------|----------------------|---------------|----------------------|----------------|--------|
| 16-01-01 | 01 | 1 | CRUD de Custos Fixos | — | Validação de formulários no front | unitário | `npm run test` | ❌ W0 | ⬜ pendente |
| 16-01-02 | 01 | 1 | Dialog de Pagamento e Alertas | — | Desabilitado se sem caixa ativo | unitário | `npm run test` | ❌ W0 | ⬜ pendente |
| 16-01-03 | 01 | 1 | Extrato do Caixa Atualizado | — | Renderização de saídas no caixa | unitário | `npm run test` | ❌ W0 | ⬜ pendente |

*Status: ⬜ pendente · ✅ verde · ❌ vermelho · ⚠️ instável*

---

## Requisitos da Onda 0 (Wave 0)

- [ ] `src/pages/CustosFixosPage.spec.tsx`
- [ ] `src/pages/CashRegisterDetailsPage.spec.tsx`

---

## Validações Manuais

| Comportamento | Requisito | Motivo para ser Manual | Instruções de Teste |
|---------------|-----------|------------------------|---------------------|
| Lançamento de Pagamento Editado | Fluxo de Caixa | Requer alteração de input e clique | Pagar conta de Luz editando valor base de R$100 para R$120, verificar se o valor final descontado no saldo é R$120 e se o valor base permanece R$100 no cadastro |

---

## Assinatura de Validação

- [x] Todas as tarefas possuem comandos automatizados ou verificações de Onda 0
- [x] Sem flags de modo de observação (watch-mode)
- [x] `nyquist_compliant: true` definido no cabeçalho (frontmatter)

**Aprovação:** pendente

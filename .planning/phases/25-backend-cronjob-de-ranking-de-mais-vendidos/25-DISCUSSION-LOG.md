# Phase 25: Discussion Log

**Date:** 2026-07-02
**Phase:** 25-backend-cronjob-de-ranking-de-mais-vendidos

> Note: This log is for historical reference. Downstream agents use CONTEXT.md, not this file.

## 1. Frequência de Execução
- **User Selection:** 1 vez por dia.

## 2. Critério de Cálculo
- **User Selection:** Lógica de 3 meses + tendência de 15 dias (usada no AnalyzePurchaseUseCase).

## 3. Armazenamento na tabela
- **User Selection:** Criar uma flag no produto. Será apenas 1 produto marcado por categoria, ignorando a categoria "Resistência".

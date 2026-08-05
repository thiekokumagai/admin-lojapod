---
phase: 17
status: completed
title: "Módulo de Investimento"
---

# Resumo da Fase 17: Módulo de Investimento

## O que foi feito:
Esta fase adicionou o novo "Módulo de Investimento", permitindo a gestão financeira apartada do fluxo principal de caixa. O módulo atua como uma carteira, recebendo injeções de capital (entradas via sangria de caixa) e descontando compras com fornecedores (saídas).

### 1. Backend (`ecommerce-api`)
- **Schema e Banco de Dados**: Adicionado o modelo `InvestmentTransaction` ao Prisma para registrar movimentações do tipo `ENTRY` e `OUTFLOW`.
- **Use Cases**:
  - `AddInvestmentUseCase`: Retira dinheiro do caixa ativo do usuário (lançando um `OUTFLOW`) e registra uma entrada (`ENTRY`) no módulo de investimento.
  - `RegisterPurchaseUseCase`: Subtrai o valor da carteira (registrando como `OUTFLOW`) e salva a descrição da compra da mercadoria.
  - `GetInvestmentSummaryUseCase`: Calcula e devolve o saldo dinâmico em tempo real, permitindo valores negativos caso o investimento inicial seja ultrapassado pelas compras.
- **API**: Controladores disponíveis sob o prefixo `/investments/*`.

### 2. Frontend (`ecommerce-admin-front`)
- **Página de Investimentos (`/investimentos`)**:
  - Construída com os três cards principais (Saldo, Entradas e Saídas). O Saldo fica vermelho quando negativo, demonstrando excesso de gastos sobre a reserva original.
  - Tabela listando o histórico completo de transações com datas formatadas.
- **Ações e Modais**:
  - `AddInvestmentModal`: Dialog para o lojista colocar o valor do investimento a ser transferido do caixa aberto.
  - `RegisterPurchaseModal`: Dialog para o lojista registrar a saída (compra de estoque) incluindo a descrição do que está sendo pago.
- **Hook Query**: As operações em segundo plano atualizam reativamente a tela de investimentos e a tela do caixa aberto.
- **Navegação**: A opção de "Módulo de Investimento" foi incluída na seção Financeiro do menu lateral.

## Notas Técnicas
- Todas as alterações seguiram estritamente o padrão da Clean Architecture.
- As transações numéricas utilizam `Intl.NumberFormat` formatando para `pt-BR`, seguindo as correções visuais globais anteriores.
- A fase foi imediatamente comitada na master utilizando Conventional Commits (`feat: add investment module...`), de acordo com as regras persistidas na documentação do projeto.

---
**Importante**: Como o banco de dados recebeu o novo modelo `InvestmentTransaction`, caso haja algum erro de "Unknown type", pode ser necessário reiniciar o servidor da API e rodar o `npx prisma generate` manualmente para refletir na máquina local.

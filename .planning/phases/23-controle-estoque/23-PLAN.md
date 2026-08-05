# Phase 23: Controle de Estoque Avançado (Réplica)

**Goal**: Implementar a réplica do controle de estoque do sistema antigo (estilo Vendizap), incluindo operações matemáticas diretas (Somar, Subtrair, Substituir), histórico de movimentações (auditoria) e preview do resultado do estoque.

## Wave 1: Backend API (Histórico e Ajustes de Estoque)

- [x] **23-01: Modelagem e Endpoints de Histórico de Estoque**
  - **Contexto**: Atualmente o estoque é um campo simples na model. Precisamos rastrear cada alteração manual (Somar, Subtrair, Substituir) para gerar o histórico do estoque.
  - **Ação**: 
    - Criar model `StockMovement` no Prisma, relacionando com `Product` e/ou `Variation`.
    - Campos do model: `type` (ADD, SUBTRACT, SET), `quantity` (valor da alteração), `previousStock` (estoque antes), `newStock` (estoque depois), `observation` (opcional), `createdAt`.
    - Atualizar a mutation/serviço de edição de estoque para registrar o movimento quando a quantidade for alterada manualmente pelo usuário admin.
    - Criar endpoint para recuperar o histórico de estoque de um produto/variação.
  - `gap_closure`: false

## Wave 2: Frontend (Painel Administrativo - Interface de Edição)

- [x] **23-02: Componente de Edição Avançada de Estoque**
  - **Contexto**: A aba de estoque no formulário de produtos precisa permitir operações matemáticas.
  - **Ação**: 
    - Na aba/seção de Estoque, adicionar controles (botões estilo toggle) para escolher a operação: "Somar", "Subtrair", "Substituir".
    - Adicionar um campo de input numérico para a quantidade.
    - Exibir o cálculo de "Resultado previsto" baseado no "Estoque Atual" e na "Quantidade" inserida.
    - Caso existam variações (ex: teor de nicotina), renderizar a grade de estoque permitindo o ajuste individual.
  - `gap_closure`: false

- [x] **23-03: Drawer/Modal de Histórico e Observações**
  - **Contexto**: O lojista precisa ver o histórico das baixas ou entradas de estoque e registrar justificativas.
  - **Ação**:
    - Criar uma visualização (Drawer ou na própria aba) para listar as alterações de estoque anteriores (Ex: "+2 - 24/06/2026 13:34 - Saldo: 2").
    - Adicionar um campo de texto "Observações sobre o ajuste (opcional)" no momento da edição.
    - Consumir a API de histórico criada em 23-01.
  - `gap_closure`: false

- [x] **23-04: Integração de Edição Rápida**
  - **Contexto**: Facilitar o controle de estoque rápido.
  - **Ação**: 
    - Na listagem de variações, incluir controles rápidos (botões `-` e `+`) para ajustes imediatos.
    - Incluir opção de "Desativar estoque desse produto".
  - `gap_closure`: false

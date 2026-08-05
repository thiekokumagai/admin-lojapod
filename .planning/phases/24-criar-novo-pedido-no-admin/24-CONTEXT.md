# Phase 24: Criar novo pedido no admin - Context

**Status:** Ready for planning
**Source:** PRD Express Path (from user prompt)

<domain>
## Phase Boundary

O objetivo desta fase é criar um fluxo completo dentro do painel administrativo (ecommerce-admin-front) para permitir a criação manual de novos pedidos (Order) pelo lojista, sem depender da interface do cliente.

</domain>

<decisions>
## Implementation Decisions

### Busca e Seleção de Produtos
- Deve existir um campo de busca simples para produtos.
- O lojista deve poder ir selecionando os produtos para adicionar ao carrinho do pedido.

### Identificação do Cliente
- Deve existir um campo de telefone para buscar clientes existentes.
- Caso o cliente seja encontrado e possua endereços salvos, eles devem ser exibidos para seleção.

### Descontos
- O sistema deve permitir a aplicação de um cupom de desconto ao pedido, caso desejado.

### Pagamento e Finalização
- O lojista deve poder selecionar a forma de pagamento do pedido antes da finalização.
- Deve existir uma opção (toggle/checkbox) indicando se o pedido já está pago ou não.
- Após o preenchimento de todos os dados e revisão, deve ser possível finalizar o pedido.

### the agent's Discretion
- A interface e layout exatos dos campos de busca, exibição de carrinho e fluxo de etapas (se em wizard, drawer, ou página única) fica a critério do desenvolvedor, mas deve seguir a identidade visual do painel.
- O mapeamento dos endpoints necessários no backend e eventuais novos DTOs devem ser implementados se não existirem.

</decisions>

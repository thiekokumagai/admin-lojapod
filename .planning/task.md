# Tarefas do Projeto: Cadastro de Produto Único

## Fase 1: Fundação e Fluxo (Concluído)
- [x] Layout de página única (Remoção de Tabs)
- [x] Sincronização reativa de SKUs e Opções
- [x] Salvamento unificado (handleSaveEverything)
- [x] Grade de estoque com itens virtuais (preview)

## Fase 2: Polimento e UX (Concluído)
- [x] Estados de loading granulares
- [x] Validações preventivas
- [x] Máscara de moeda BRL
- [x] Layout Full-width
- [x] Tratamento de erro 404

## Fase 3: Ajustes de API e Integração (Concluído)
- [x] Remover SKU do payload de salvamento de itens
- [x] Utilizar rota individual para PATCH (`/products/items/{itemId}`)
- [x] Utilizar rota de coleção para POST (`/products/{id}/items`)
- [x] Remover prefixo `/api/` das chamadas (conforme ambiente)

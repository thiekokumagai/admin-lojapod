# Plano Fase 1: Simplificar Cadastro de Produto

O objetivo é otimizar o processo de criação e edição de produtos consolidando as três abas existentes (Produto, Variações, Estoque) em uma única página coesa. Isso permitirá que os usuários gerenciem tudo de uma vez, com foco em velocidade e facilidade de uso.

## Revisão do Usuário Necessária

> [!IMPORTANT]
> **Lógica de Salvamento Unificada**: Clicar em "Salvar" agora gerenciará os dados do produto, upload de imagens, vinculação de variações e atualizações de estoque em sequência. Se qualquer etapa falhar, notificaremos o usuário, mas tentaremos concluir toda a cadeia.

> [!NOTE]
> **Comportamento do Alternador de Variações**: Desativar "Variações" ocultará a seleção de variações e a grade de estoque, mostrando em vez disso uma única entrada de estoque. Se o produto já possuir variações, elas serão preservadas no banco de dados, mas ocultas na interface, a menos que sejam reativadas.

## Mudanças Propostas

### [Frontend] Refatoração do Cadastro de Produto

#### [MODIFY] [ProductDetailsPage.tsx](file:///c:/sites/podemais-admin/admin-wonderland/src/pages/ProductDetailsPage.tsx)
- Remover `Tabs` e `TabsContent`.
- Reordenar o layout:
  1. `ProductImageManager` (Seção superior)
  2. `ProductDetailsForm` (Dados principais do produto)
  3. **Alternador de Variação**: Uma nova seção com um Switch/Toggle para ativar/desativar variações.
  4. **Seção Condicional**:
     - **OFF**: Entrada de Estoque Simples (integrada ao fluxo da página).
     - **ON**: `ProductVariationSelector` seguido pela grade do `ProductStockEditor`.
- **Função de Salvamento Unificada**: Implementar `handleSaveEverything` que coordena:
  - `updateProductMutation` / `createProductMutation`
  - `uploadImagesMutation`
  - `linkVariationsMutation` (se variações estiverem ATIVADAS)
  - `updateStockBatchMutation` ou `saveDirectStockMutation`
- **Opções Sincronizadas**: Ao carregar ou atualizar variações, derivar o estado "marcado" das opções diretamente dos itens de produto existentes (buscados via `/products/{id}/items`). Isso garante que apenas as opções com um SKU salvo correspondente sejam marcadas como ativas no seletor.

#### [MODIFY] [ProductDetailsForm.tsx](file:///c:/sites/podemais-admin/admin-wonderland/src/components/products/ProductDetailsForm.tsx)
- Remover o `<form>` interno e a lógica de `onSubmit` para permitir que faça parte de um formulário maior ou seja gerenciado pelo botão de salvamento unificado do pai.
- Ajustar o estilo para melhor se adequar ao layout de página única (possivelmente removendo o wrapper `Card` se o pai fornecer um).

#### [MODIFY] [ProductStockEditor.tsx](file:///c:/sites/podemais-admin/admin-wonderland/src/components/products/ProductStockEditor.tsx)
- Ajustar o estilo para ser mais compacto, pois agora fará parte de uma página maior.
- Garantir que ele lide com o estado "produto não pronto" graciosamente dentro do fluxo de página única.

## Plano de Verificação

### Verificação Manual
1. **Fluxo de Novo Produto**:
   - Preencher imagens primeiro.
   - Preencher detalhes do produto.
   - Ativar variações, selecionar uma variação e opções.
   - Preencher o estoque para as variações.
   - Clicar em "Salvar" e verificar se tudo foi criado corretamente de uma só vez.
2. **Fluxo de Produto Simples**:
   - Preencher detalhes.
   - Desativar variações.
   - Preencher estoque direto.
   - Salvar e verificar.
3. **Alternância de Toggle**:
   - Alternar variações LIGADO/DESLIGADO e verificar transições de UI e persistência de dados (estado local).

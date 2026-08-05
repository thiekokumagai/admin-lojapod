# Fase 21: Ações do modal de pedidos (Frontend)

Este documento registra o plano para a implementação das ações na gaveta de detalhamento de pedidos (`OrderDetailDrawer`), conforme definido no ROADMAP.md.

## O Que Deve Ser Feito

### 1. Botões de Ação na Gaveta de Pedidos
- **Arquivo**: `src/components/OrderDetailDrawer.tsx`
- Adicionar uma fileira de botões de ação (ex: no rodapé ou cabeçalho do Drawer) seguindo esta exata sequência:
  1. **Imprimir**: Botão que abre uma nova aba na rota `/pedidos/:id/imprimir`.
  2. **Compartilhar**: Botão visual (ícone de compartilhamento), porém sem ação definida por enquanto (pode emitir um alerta temporário ou ficar `disabled`).
  3. **Editar pedido**: Botão visual (ícone de edição), porém sem ação definida por enquanto.
  4. **WhatsApp**: Botão que extrai o número de contato do pedido, formata e abre uma aba com o link da API do WhatsApp (`https://wa.me/55...`).

### 2. Tela de Impressão do Pedido (Layout de Recibo)
- **Novo Arquivo**: `src/pages/OrderPrintPage.tsx`
- **Configuração de Rota**: Adicionar `/pedidos/:id/imprimir` em `src/App.tsx`.
- A página não deve renderizar o layout global (`AdminSidebar`, etc), apenas o conteúdo de impressão limpo.
- Buscar o pedido via ID assim que a página montar usando a função de API existente (`getOrderById`).
- **Layout do Recibo (Baseado na imagem fornecida)**:
  - Cabeçalho: "Pod & Mais" e "podemais.store" centralizados.
  - Número do Pedido: "Pedido #XXXX" em negrito.
  - Dados do Cliente: Data/Hora, Nome, Contato.
  - Tabela/Lista de Itens: "1x NOME DO PRODUTO ............. R$ 00,00".
  - Totalizadores: Total dos itens, Frete, Descontos, Total Pedido, Total Recebido.
  - Informações de Pagamento: Status, Forma e Chave.
  - Endereço de Entrega: Endereço formatado com CEP.
- **Ciclo de Vida de Impressão**:
  - Implementar um `useEffect` que detecta quando os dados terminam de carregar.
  - Chamar `window.print()`.
  - Capturar o fechamento da janela de impressão com eventos (ex: `window.onafterprint`) e executar `window.close()` para fechar a aba automaticamente.

### 3. Backend
- Nenhuma alteração estrutural será necessária, pois os dados (cliente, itens, descontos, frete, endereço) já são fornecidos pelo endpoint `GET /orders/:id`.
- *Atenção:* Resolver o erro de TypeScript atualmente pendente no backend que quebra o build e inicialização (`Types of property 'couponId' are incompatible...`), a fim de permitir o teste do frontend sem impedimentos.

## Próximos Passos
- Para iniciar a codificação desta fase, execute: `/gsd-execute-phase 21`

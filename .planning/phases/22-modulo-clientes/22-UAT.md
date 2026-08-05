# Phase 22: Módulo de Clientes - UAT

## Resumo da Fase
Criar o módulo de clientes na API e no painel administrativo, permitindo a gestão dos clientes que foram gerados automaticamente durante a entrada de pedidos.

---

### [ ] Teste 1: Endpoints da API (Backend)
- **Ação:** Faça uma chamada para a rota `GET /api/customers` e `GET /api/customers/:id`.
- **Esperado:** O endpoint de listagem deve retornar um formato paginado contendo a lista de clientes. O endpoint de detalhes deve retornar as informações completas do cliente, incluindo seus endereços (`addresses`).

### [ ] Teste 2: Item de Menu
- **Ação:** Acesse o painel administrativo.
- **Esperado:** Na barra lateral (`AdminSidebar`), deve existir o menu "Clientes", posicionado preferencialmente próximo à seção de Pedidos ou Vendas.

### [ ] Teste 3: Listagem de Clientes e Paginação (Frontend)
- **Ação:** Acesse a tela de Clientes (`/clientes`).
- **Esperado:** A tela deve exibir uma tabela com as colunas principais (Nome, Telefone, Data de Cadastro). Deve haver paginação funcional na parte inferior da tabela e a listagem deve refletir os dados reais da API.

### [ ] Teste 4: Busca por Nome/Telefone (Frontend)
- **Ação:** Na tela de Clientes, utilize o campo de busca no topo para procurar um cliente específico pelo nome ou por parte do telefone.
- **Esperado:** A tabela deve atualizar reativamente exibindo apenas os clientes que correspondem à pesquisa, e as páginas devem ser recalculadas de acordo com o resultado.

### [ ] Teste 5: Detalhes e Endereços (Frontend)
- **Ação:** Clique sobre a linha de um cliente na tabela.
- **Esperado:** Um Drawer (gaveta lateral) deve ser aberto mostrando os detalhes do cliente, as informações de contato e a lista com os endereços de entrega (CustomerAddress) vinculados a ele.

---
*Aguardando feedback do usuário para cada um dos itens.*

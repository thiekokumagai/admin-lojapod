# Cronograma (Roadmap)

## Marco 1 (Milestone 1): Simplificação do Cadastro de Produtos

### [CONCLUÍDO] Fase 1: Interface de Página Única e Salvamento Unificado

- Reorganização do layout (Imagens -> Dados -> Variações).
- Implementação de `handleSaveEverything`.
- Sincronização de opções via itens.
- Itens virtuais na grade de estoque.

---

### [CONCLUÍDO] Fase 2: Polimento e Validação do Fluxo

- Feedbacks visuais granulares durante o salvamento (estados de carregamento por etapa).
- Validações preventivas (impedir salvamento se campos críticos estiverem faltando).
- Tratamento de erros aprimorado.

---

### [CONCLUÍDO] Fase 3: Tela de Listagem de Produtos com Menu Lateral em Seções e Ações em Massa

**Objetivo:** Reorganizar o painel administrativo com menu em seções (Catálogo, Vendas, Configuração), página única de configuração com três formulários, e listagem de produtos em tabela com paginação (30/página), filtros e ações em massa.
**Depende de:** Fases 1–2 do cadastro (concluída / pendente de polimento)
**Planos:** 3 planos em 2 ondas (waves)

Planos:

- [x] 03-01 — Menu lateral em seções (`navSections` + `AdminSidebar`)
- [x] 03-02 — Página unificada `/configuracoes` (Entregas + Pagamentos + Gerais)
- [x] 03-03 — Tabela de produtos + paginação API 30 + ações em massa (bulk actions)

**Onda 1 (Wave 1)** *(paralelo)*: 03-01, 03-02  
**Onda 2 (Wave 2)** *(após o menu)*: 03-03

---

### [CONCLUÍDO] Fase 4: Configurações de Identidade, Endereço, Pagamentos e Descontos

**Objetivo:** Implementar as configurações completas e reais do e-commerce unificando o formulário `/configuracoes` com a API do backend, com upload de logo/favicon/banners (até 7), autopreenchimento de endereço por CEP, ativação do PIX e métodos presenciais, e regras dinâmicas de descontos, taxas e parcelamento.
**Requisitos**: REQ-07
**Depende de:** Fase 3
**Planos:** 2 planos

Planos:

- [x] 04-01: Identidade Visual, Contato e Endereço com Busca de CEP (Frontend)
- [x] 04-02: PIX, Pagamentos e Regras Dinâmicas de Descontos e Taxas (Frontend)

---

### [CONCLUÍDO] Fase 5: Filtro de Valores Mockados

**Objetivo:** Filtrar em tempo de execução os valores de testes e placeholders padrões (como "Minha Loja", "Rua 14 de Julho", "podemais@email.com", etc.) no carregamento dos formulários de configurações, mantendo os campos de texto completamente limpos e prontos para o onboarding se não houver configurações reais salvas.
**Depende de:** Fase 4
**Planos:** 1 plano

Planos:

- [x] 05-01: Implementar filtros reativos de placeholders nos formulários de Configurações (Apenas Frontend)

---

### [CONCLUÍDO] Fase 6: Configuração de Juros Customizados de Parcelas (Backend & Frontend)

**Objetivo:** Permitir ao lojista configurar juros customizados para cartão de crédito em faixas de parcelas (ex: de 2 a 3 parcelas, de 4 a 5 parcelas) com inputs numéricos totalmente editáveis tanto para os intervalos de parcelas quanto para a taxa de juros correspondente, integrando o backend e o frontend.
**Depende de:** Fase 4
**Planos:** 2 planos

Planos:

- [x] 06-01: Extensão do Schema, DTO e Repositório para Suportar Faixas de Juros (Backend)
- [x] 06-02: Formulário com Inputs Editáveis de Faixas de Parcelas e Juros (Frontend)

---

### [CONCLUÍDO] Fase 7: Gestão e Listagem de Pedidos (Portal de Pedidos)

**Objetivo:** Implementar o painel de gerenciamento de vendas com listagem reativa agrupada cronologicamente por datas (Hoje, datas anteriores), filtros avançados, e gaveta lateral de detalhamento do pedido fiel ao design de alta fidelidade e suporte ao fluxo de cancelamento.
**Depende de:** Fase 3
**Planos:** 2 planos

Planos:

- [x] 07-02: Tela de Listagem de Pedidos Agrupada por Data (Frontend)
- [x] 07-03: Drawer de Detalhes do Pedido e Ação de Cancelamento (Frontend)

---

### [CONCLUÍDO] Fase 8: Integração Dinâmica de Pedidos e Estoque (Integração Dinâmica de Pedidos & Estoque)

**Objetivo:** Interligar pedidos aos produtos e variações reais do banco de dados (remover mock no use case), decrementando o estoque do produto/variação quando o pedido for confirmado/criado e revertendo a baixa em caso de cancelamento.
**Depende de:** Fase 7
**Planos:** 1 plano

Planos:

- [x] 08-01: Associação de Pedidos a Produtos Reais, Validação e Atualização Dinâmica de Estoque (Backend & Frontend)

---

### [CONCLUÍDO] Fase 9: Melhorias no Checkout e Pedidos

**Objetivo:** Dividir o ciclo de vida do pedido entre entrega e pagamento no backend e disponibilizar os novos gatilhos operacionais no painel.
**Depende de:** Fase 8
**Planos:** 1 plano

Planos:

- [x] 09-01: Melhorias no Checkout e Pedidos (Backend)

---

### [CONCLUÍDO] Fase 10: Ajustes UI na Listagem e Modal de Pedidos

**Objetivo:** Integrar o dropdown de alteração logística na gaveta de detalhamento, fixar o rodapé com as ações e recalibrar a matemática de exibição dos totais.
**Depende de:** Fase 9
**Planos:** 1 plano

Planos:

- [x] 10-01: Ajustes UI na Listagem e Modal de Pedidos (Frontend)

---

### [CONCLUÍDO] Fase 11: Paginação e Refinamentos de Fluxo Financeiro

**Objetivo:** Adicionar paginação nativa na listagem de pedidos, ocultar inputs financeiros sob recebimento e estruturar o fluxo de cancelamento seguro de vendas.
**Depende de:** Fase 10
**Planos:** 1 plano

Planos:

- [x] 11-01: Paginação e Refinamentos de Fluxo Financeiro (Backend & Frontend)

---

### Fase 12: Pedidos pagos irem para o caixa admin e api

**Objetivo:** [A ser planejado]
**Requisitos**: TBD
**Depende de:** Fase 11
**Planos:** 0 planos

Planos:

- [ ] TBD (execute o comando `/gsd-plan-phase 12` para detalhar)

### Phase 14: Configurar taxas de debito/credito com repasse opcional ao cliente

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 13
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 14 to break down)

---

### Fase 13: Parcelamento e Taxas de Cartão de Crédito no Caixa e Pedidos

**Objetivo:** Implementar a lógica de parcelamento dinâmico de cartão de crédito integrado às configurações do lojista, calculando os juros e taxas descontados por pedido e consolidando os totais Bruto, Taxas e Líquido no resumo do caixa.
**Depende de:** Fase 12
**Planos:** 1 plano

Planos:

- [ ] 13-01: Implementação de Parcelamento, Taxas de Cartão e Consolidação Financeira (Backend & Frontend)

### Phase 16: Contas fixas

**Goal:** [To be planned] - Poder excluir lançamento das contas fixas no caixa
**Requirements**: TBD
**Depends on:** Phase 15
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 16 to break down)

---

### [CONCLUÍDO] Fase 15: Módulo de Cupom

**Objetivo:** Criar módulo de cupons de desconto (valor fixo, porcentagem ou frete grátis), com regras de limite de uso e datas de validade, integrado ao checkout de pedidos.
**Requisitos**: TBD
**Depende de:** Fase 14
**Planos:** 1 plano

Planos:

- [x] 15-01: Módulo de Cupom no Backend e Frontend

---

### [CONCLUÍDO] Fase 17: Módulo de Investimento

**Objetivo:** Criar um módulo de investimento semelhante à conta fixa (com entrada e saída). O valor adicionado como investimento deve entrar como crédito neste módulo e sair do caixa principal. Ao realizar a conferência de um pedido (produtos que chegaram para estoque), o valor gasto deve ser subtraído do módulo de investimento (podendo inclusive ficar negativo se o gasto exceder o investimento inicial). Isso servirá para separar o dinheiro usado em compras de produtos e rastrear os gastos com fornecedores de forma segura.
**Planos:** 1 plano

Planos:

- [x] 17-01: Módulo de Investimento no Backend e Frontend

---

### [CONCLUÍDO] Fase 18: Separação de Taxas e Descontos

**Objetivo:** Suportar a segregação detalhada de taxas e descontos nos pedidos, evitando sobreposição e garantindo um resumo financeiro transparente na listagem de pedidos e fechamentos de caixa.
**Planos:** 1 plano

Planos:

- [x] 18-01: Separação de Taxas e Descontos no Recebimento e Detalhes de Pedidos (Frontend)

---

### [CONCLUÍDO] Fase 19: Dashboard Dinâmico e Indicadores de Vendas

**Objetivo:** Modernizar o painel de controle administrativo, tornando todos os KPIs (Vendas, Pedidos, Ticket Médio, Itens Vendidos), gráficos e a lista de itens mais vendidos totalmente dinâmicos, com filtros por data (default "Hoje") e filtragem de best-sellers por categoria.
**Planos:** 1 plano

Planos:

- [x] 19-01: Lógica do Dashboard no Backend NestJS e Integração com Página do Dashboard no Frontend (Backend & Frontend)

---

### [CONCLUÍDO] Fase 20: Indicadores de Desempenho e Vendas do Dia no Caixa

**Objetivo:** Adicionar métricas estratégicas detalhadas na visualização do caixa administrativo (Faturamento de Hoje, Pedidos no Período, Ticket Médio do Período, e Itens Vendidos Hoje) e otimizar o layout separando as informações de caixa/saldos das métricas comerciais com espaçamento aprimorado.
**Planos:** 1 plano

Planos:

- [x] 20-01: Lógica e Visualização de Indicadores do Período e Vendas do Dia no Detalhamento do Caixa (Frontend)

---

### Fase 21: Ações do modal de pedidos

**Objetivo:** Implementar botões de ação na gaveta de pedidos na seguinte sequência: Imprimir (abrir em nova aba para impressão no modelo recebido, fechando a aba em caso de fechamento do diálogo de impressão), Compartilhar (sem ação por enquanto), Editar pedido (sem ação por enquanto), e WhatsApp (botão para abrir conversa com o cliente no WhatsApp do pedido).
**Requisitos**: TBD
**Depende de:** Fase 20
**Planos:** 0 planos

Planos:

- [ ] TBD (execute o comando `/gsd-plan-phase 21` para detalhar)

---

### Fase 22: Módulo de Clientes

**Objetivo:** Criar e gerenciar a base de clientes. O sistema deve capturar o cliente automaticamente (buscar por telefone ou criar um novo junto com seu endereço) no momento da geração do pedido, vinculando-o ao `Order`. Além disso, implementar uma tela no painel administrativo para listar e gerenciar os clientes.
**Requisitos**: TBD
**Depende de:** Fase 21
**Planos:** 4 planos

Planos:

- [x] 22-01: Endpoints e Serviços do CustomerModule (Backend)
- [x] 22-02: Integração e Serviços no Frontend
- [x] 22-03: Tela de Listagem e Navegação
- [x] 22-04: Drawer de Detalhes e Histórico

---

### Fase 23: Controle de Estoque Avançado (Réplica)

**Objetivo:** Implementar a réplica do controle de estoque do sistema antigo. Inclui operações matemáticas diretas (Somar, Subtrair, Substituir) no estoque de produtos e variações, com preview do resultado, campo para observação, histórico de movimentações (auditoria) e edição rápida inline.
**Requisitos**: Interface similar ao Vendizap, histórico de movimentação de estoque.
**Depende de:** Fase 22
**Planos:** 4 planos

Planos:

- [ ] 23-01: Modelagem e Endpoints de Histórico de Estoque (Backend)
- [ ] 23-02: Componente de Edição Avançada de Estoque (Frontend)
- [ ] 23-03: Drawer de Histórico de Movimentações e Observações (Frontend)
- [ ] 23-04: Integração de Edição Rápida nas Variações (Frontend)

---

### Phase 24: Criar novo pedido no admin

**Objetivo:** Permitir a criação de um novo pedido diretamente pelo painel administrativo, contemplando busca simples de produtos para adição, busca de cliente pelo telefone com exibição de endereços salvos, aplicação de cupom de desconto e escolha da forma de pagamento, finalizando o pedido.
**Requisitos**: Selecionar produtos via busca simples, buscar cliente por telefone, usar endereços salvos, aplicar cupom, método de pagamento, finalizar pedido.
**Depende de:** Fase 23
**Planos:** 0 planos

Planos:

- [ ] TBD (execute o comando `/gsd-plan-phase 24` para detalhar)

---

### Fase 25: Melhoria de todas as telas no mobile do admin

**Objetivo:** Adaptar e melhorar a interface e experiência de uso de todas as telas do painel administrativo para dispositivos móveis, garantindo responsividade e usabilidade.
**Requisitos**: TBD
**Depende de:** N/A
**Planos:** 0 planos

Planos:

- [x] 25-01: Ajuste de Componentes Globais e Layout Base
- [x] 25-02: Melhoria nas Telas de Produtos, Categorias e Pedidos
- [x] 25-03: Melhoria nas Telas Financeiras e Clientes
- [x] 25-04: Ajuste de Drawers e Modais

### Phase 25: Backend: CronJob de ranking de Mais Vendidos

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 24
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 25 to break down)

---

### Fase 26: Trocar tabelas por grid (cards) no mobile no admin

**Objetivo:** Substituir as tabelas com scroll horizontal (aplicadas na Fase 25) por layouts em grid/cards (um embaixo do outro) quando o painel for acessado via mobile, garantindo uma melhor leitura e toques mais responsivos para dispositivos móveis.
**Requisitos**: No desktop mantém-se a Tabela. No mobile, exibe-se uma lista de Cards (um item por linha).
**Depende de:** Fase 25
**Planos:** 0 planos

Planos:

- [ ] TBD (execute o comando `/gsd-plan-phase 26` para detalhar)


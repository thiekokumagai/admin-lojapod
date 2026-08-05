# Fase 16: Contas fixas - Contexto (Frontend)

**Data de Coleta:** 2026-05-25
**Status:** Pronto para Planejamento
**Origem:** Solicitação do Usuário

<domain>
## Fronteiras da Fase (Fase 16)

Desenvolvimento da interface administrativa para a configuração e gerenciamento de custos fixos ("Contas fixas"). A tela permitirá que o lojista adicione, edite, liste e exclua custos recorrentes, definindo regras de repetição (sempre repetir ou parcelada de 1 a 10 ou 12 vezes) e seu valor base.
A interface integrará a ação de pagamento ("Pagar / Lançar Saída") que abrirá um dialog elegante permitindo editar o valor final real (como energia/luz, que oscila mensalmente) e confirmará a transação, inserindo uma saída financeira real no caixa ativo e exibindo-a como fluxo negativo no extrato detalhado do caixa.
</domain>

<decisions>
## Decisões de Interface e Navegação

### 1. Novo Painel de Custos Fixos (`CustosFixosPage.tsx`)
- **Menu Lateral**: Adição do item "Contas Fixas" sob a seção "Financeiro" no menu lateral (`admin-nav.ts`), utilizando o ícone `Receipt` (Recibo) ou `DollarSign`.
- **Roteamento**: Registro da rota `/financeiro/custos-fixos` no arquivo central de rotas (`src/App.tsx`) vinculada ao novo componente de página.
- **Componentização e Visual Premium**:
  - Tabela organizada exibindo os custos fixos ativos, seu tipo (Sempre Repetir ou Parcelado, ex: "Parcela 2 de 10"), valor base e o botão de ação principal **Pagar / Lançar Saída**.
  - Cartões de resumo na parte superior com design premium indicando o total de custos fixos cadastrados e a soma estimada mensal.
  - Botão de **Novo Custo Fixo** abrindo uma gaveta ou formulário dialog lateral utilizando shadcn/ui.

### 2. Formulário de Cadastro e Edição (React Hook Form + Zod)
- Validação estrita dos campos:
  - `name`: Nome da conta (Obrigatório, min 3 caracteres)
  - `value`: Valor estimado (Numérico, positivo, formatado adequadamente)
  - `repeats`: Se repete ou não (Checkbox/Switch, default `true`)
  - `type`: Tipo de repetição (Seletor, `"ALWAYS"` para sempre repetir ou `"INSTALLMENTS"` para parcelado)
  - `installmentsCount`: Quantidade de parcelas (Seletor numérico de 1 a 12, exibido condicionalmente apenas se o tipo for `"INSTALLMENTS"`)

### 3. Modal de Confirmação de Pagamento ("Pagar Conta")
- Acionado via clique em "Pagar / Lançar Saída" em qualquer custo fixo.
- Abre um `Dialog` do shadcn/ui.
- **Destaque de Valor Editável**: Exibe um input numérico de destaque (estilo moeda BRL) preenchido por padrão com o valor estimado do custo fixo, mas permitindo que o lojista altere para o valor real da fatura daquele mês.
- **Aviso Explicativo**: Uma nota legível/alerta de destaque ("Este é um Custo Fixo. O valor inserido será lançado como saída no caixa atual, sem alterar a configuração padrão desta conta.").
- **Detecção de Caixa Ativo**:
  - Verifica com TanStack Query se há um caixa ativo aberto atualmente.
  - Caso não haja nenhum caixa ativo, o botão de confirmação fica desabilitado e exibe um alerta vermelho chamando o usuário para abrir o caixa primeiro.
  - Caso haja caixa aberto, vincula a transação a este caixa.

### 4. Extrato de Caixa Atualizado (`CashRegisterDetailsPage.tsx`)
- Atualização do painel de detalhes do caixa para acomodar as movimentações manuais:
  - **Grid de Cards**:
    - Faturamento Bruto (Soma de vendas PIX/Cartão/Dinheiro + Entradas manuais)
    - Taxas Comerciais (Retidas no cartão)
    - Total de Saídas (Soma das saídas manuais e pagamentos de custos fixos, card com cor de destaque destrutiva sutil)
    - Saldo Líquido do Caixa (`Faturamento Bruto - Taxas - Saídas`)
  - **Tabela de Transações/Movimentações**:
    - Exibição unificada ou aba secundária contendo a listagem de todas as movimentações manuais de entrada e saída lançadas naquele caixa.
    - Saídas de custos fixos representadas de forma clara: `Despesa: Luz - R$ 150,00` (com texto de valor em vermelho/negativo).
</decisions>

<canonical_refs>
## Referências Canônicas

* [Configuração de Menu: src/data/admin-nav.ts](file:///c:/sites/podemais/ecommerce-admin-front/src/data/admin-nav.ts)
* [Página de Caixa Detalhes: src/pages/CashRegisterDetailsPage.tsx](file:///c:/sites/podemais/ecommerce-admin-front/src/pages/CashRegisterDetailsPage.tsx)
* [Definição de Rotas: src/App.tsx](file:///c:/sites/podemais/ecommerce-admin-front/src/App.tsx)
</canonical_refs>

<specifics>
## Ideias Específicas
- Utilização de `lucide-react` para ícones expressivos e `sonner` para feedback instantâneo de sucesso após criação, edição ou pagamento de um custo fixo.
</specifics>

<deferred>
## Ideias Adiadas
- Nenhuma — a implementação cobrirá todos os aspectos da experiência do usuário configurando e pagando despesas fixas.
</deferred>

---
*Fase: 16-contas-fixas*
*Contexto gerado: 2026-05-25 via solicitação direta do usuário*

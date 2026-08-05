# Contexto — Fase 4: Configurações de Identidade, Endereço, Pagamentos e Descontos

Este documento define os requisitos de negócio e técnicos para a fase de **Configurações**, unificando as persistências no banco de dados da API (`ecommerce-core-api`) e os formulários do painel administrativo (`admin-wonderland`).

---

## 📋 Requisitos e Estrutura dos Campos

A página de Configurações unificada (`/configuracoes`) precisará gerenciar e salvar quatro áreas principais, com persistência direta no backend:

### 1. Identidade & Contato da Loja
* **Logo**: Upload de imagem para a logo oficial da loja.
* **Texto do Topo**: Mensagem promocional ou de aviso exibida no topo da loja (ex: "Entregas rápidas em Campo Grande!").
* **Banners**: Galeria dinâmica de banners promocionais (suporte a até 7 imagens em carrossel).
* **Favicon**: Upload de ícone da aba do navegador.
* **Nome da Loja**: Nome oficial de exibição do e-commerce.
* **Telefone Contato**: Telefone comercial/WhatsApp.
* **Instagram**: Link ou @ do perfil da loja.

### 2. Endereço da Loja
* **CEP**: Código de endereçamento postal da loja (origem para o cálculo de frete).
* **Endereço**: Logradouro (rua, avenida).
* **Número**: Número do estabelecimento.
* **Bairro**: Bairro do estabelecimento.
* **Estado e Cidade**: Estado (UF) e Cidade da loja física.
* **Complemento**: Apartamento, bloco, sala, etc.
* **Ocultar endereço da loja**: Booleano (`true` ou `false`) para definir se o endereço físico deve ser escondido no frontend público do cliente.

### 3. Pagamento e Recebimento
* **Opção PIX**:
  - Habilitado/Desabilitado.
  - **Tipo de chave**: CPF/CNPJ, E-mail ou Telefone.
  - **Chave**: A chave de recebimento propriamente dita.
  - **Titular**: Nome completo do titular da conta bancária vinculada à chave.
* **Pagamento Presencial (Entrega)**:
  - **Dinheiro**: Se aceita dinheiro na entrega (com campo/opção de troco).
  - **Maquininha**: Se aceita cartão na maquininha na entrega, separando em **Crédito** e **Débito**.

### 4. Desconto, Taxas e Parcelas (Regras Dinâmicas)
Gerenciamento de regras de desconto ou acréscimo com a possibilidade de adicionar várias configurações via botão **"Nova Configuração"**:
* **Forma de Pagamento**: Seleção entre as formas ativas (Pix, Dinheiro, Débito, Crédito).
* **Tipo de Ação**: Desconto ou Acréscimo.
* **Valor**: Percentual ou valor fixo.
* **Configuração de Parcelas (específico para Cartão de Crédito)**:
  - Limite máximo de parcelas permitidas (Ex: "Até 3x sem juros" ou "Até 12x").

---

## 🗄️ Arquitetura Backend (`ecommerce-core-api`)

Criaremos um módulo de Configurações no backend para persistir essas informações em um formato robusto e escalável.

### Modelo de Banco de Dados (Prisma Schema)
Como as configurações do sistema são um singleton (geralmente apenas um registro ativo), criaremos uma tabela `StoreSettings` no Prisma:

```prisma
model StoreSettings {
  id               String   @id @default(uuid())
  storeName        String
  logoUrl          String?
  faviconUrl       String?
  topHeaderText    String?
  bannerUrls       String[] // Array de strings (até 7 banners)
  phone            String
  instagram        String?
  
  // Endereço
  cep              String
  street           String
  number           String
  neighborhood     String
  city             String
  state            String
  complement       String?
  hideAddress      Boolean  @default(false)
  
  // Pagamentos
  pixEnabled       Boolean  @default(false)
  pixKeyType       String?  // 'CPF_CNPJ' | 'EMAIL' | 'PHONE'
  pixKey           String?
  pixHolder        String?
  
  payOnDeliveryCash       Boolean @default(false)
  payOnDeliveryCardDebit  Boolean @default(false)
  payOnDeliveryCardCredit Boolean @default(false)
  
  // Descontos/Taxas adicionais salvos como JSON para flexibilidade
  paymentRules     Json?    // Array de regras dinâmicas
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### Endpoints da API
* `GET /settings`: Retorna a configuração atual. Se não houver, retorna valores padrão.
* `PUT /settings`: Atualiza as configurações de forma atômica (salvamento de seção ou geral).
* `POST /settings/upload`: Endpoint para upload de mídia (logo, favicon e banners) integrado ao MinIO/S3.

---

## 🎨 Arquitetura Frontend (`admin-wonderland`)

Refatorar os formulários mockados de `/configuracoes` para se conectarem diretamente à API:

1. **`GeneralSettingsForm.tsx`**:
   - Campos de Identidade Visual (Logo, Favicon, Nome, Topo, Banners com carrossel/visualização de até 7 imagens).
   - Campos de Endereço Completo (CEP com busca por ViaCEP, Rua, Número, Bairro, Cidade/Estado, Ocultar Endereço).
2. **`PaymentSettingsForm.tsx`**:
   - Configurações do PIX (Tipo de chave, Chave e Titular).
   - Configurações do pagamento presencial (Dinheiro, Débito, Crédito).
3. **`PaymentRulesSettingsForm.tsx`** (Novo):
   - Tabela/Lista dinâmica para gerenciar as taxas, parcelas e descontos por forma de pagamento.
   - Botão **"Nova Configuração"** para adicionar linhas dinâmicas de regras de forma de pagamento, tipo (desconto/acréscimo), valor (%) e número de parcelas (para crédito).

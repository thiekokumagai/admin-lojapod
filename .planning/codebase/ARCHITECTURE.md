# Arquitetura

## Padrões de Projeto
- **Organização de Componentes por Funcionalidade**: Componentes são agrupados por domínio (auth, products, variations) ou utilidade (ui, common).
- **Camada de Serviço**: A comunicação com a API é abstraída em arquivos de serviço em `src/services`.
- **Hooks Customizados**: A lógica de negócio e de busca de dados é frequentemente extraída em hooks personalizados em `src/hooks`.
- **Formulários Baseados em Validação**: Utiliza Zod para validação de schema e React Hook Form para gerenciamento de estado do formulário.
- **UI Atômica (parcial)**: Componentes base de UI (átomos/moléculas) estão localizados em `src/components/ui`, baseados no Shadcn UI.

## Fluxo de Dados
- **Estado do Servidor**: Gerenciado pelo TanStack Query (React Query) para cache e sincronização.
- **Estado Global**: Uso mínimo de estado global; baseia-se amplamente no estado da URL (via React Router) e no estado do servidor.
- **Estado de Autenticação**: Gerenciado em `auth.service.ts` com armazenamento de token em memória/sessão.

## Roteamento
- **Roteamento Declarativo**: Definido em `src/App.tsx` usando `react-router-dom`.
- **Rotas Protegidas**: Gerenciadas via verificações de autenticação (provavelmente no `App.tsx` ou componentes de layout especializados).

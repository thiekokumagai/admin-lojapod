# Integrações Externas

## APIs
- **Admin API**: Acessada via `apiFetch` em `src/services/api.ts`. URL base definida na variável de ambiente `VITE_ADMIN_API`.
- **Autenticação**: Fluxo de autenticação customizado com tokens de acesso/atualização gerenciados em `src/services/auth.service.ts`.

## Serviços
- **Gerenciamento de Produtos**: `product.service.ts` para operações de CRUD e upload de imagens.
- **Gerenciamento de Categorias**: `category.service.ts`.
- **Gerenciamento de Variações**: `variation.service.ts`.
- **Autenticação**: `auth.service.ts` gerenciando login, renovação de token e persistência de sessão.

## Variáveis de Ambiente
- `VITE_ADMIN_API`: URL base para a API do backend.

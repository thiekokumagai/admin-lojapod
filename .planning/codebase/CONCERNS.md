# Preocupações com a Base de Código

## Dívida Técnica
- **Múltiplos Arquivos de Lock**: Encontrados `bun.lock`, `package-lock.json` e `pnpm-lock.yaml`. Isso pode levar a inconsistências de dependência. Um único gerenciador de pacotes deve ser escolhido.
- **Baixa Cobertura de Testes**: Presença mínima de testes na base de código. Fluxos críticos de negócio (pedidos, pagamentos, criação de produtos) devem ser testados.
- **Regras Relaxadas do ESLint**: `@typescript-eslint/no-unused-vars` está configurado como `off`, o que pode levar a código desordenado e bugs potenciais.

## Riscos Arquiteturais
- **Uso Direto de Fetch**: Embora o `apiFetch` forneça um wrapper, muitos componentes ou serviços podem estar fortemente acoplados a esta implementação específica.
- **Componentes de Página Grandes**: `ProductDetailsPage.tsx` é bastante grande (~30k bytes), sugerindo que pode estar fazendo demais e poderia se beneficiar de uma decomposição adicional.

## Segurança
- **Autenticação**: O manuseio de tokens é customizado. Certifique-se de que os padrões de rotação de refresh tokens e armazenamento seguro sejam robustos.

## UX/UI
- **Responsividade**: O painel administrativo tem muitas tabelas e formulários complexos. Garantir a responsividade móvel para todas essas páginas é uma tarefa significativa.

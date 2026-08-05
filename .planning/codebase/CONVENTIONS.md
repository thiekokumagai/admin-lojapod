# Convenções de Código

## Padrões de Linguagem
- **TypeScript**: Modo estrito (conforme tsconfig) provavelmente ativado.
- **ESNext**: Uso de recursos modernos do JavaScript (ES2020+).

## Padrões React
- **Componentes Funcionais**: Todos os componentes são escritos como componentes funcionais com hooks.
- **Nomenclatura de Arquivos**: PascalCase para componentes (`ProductDetailsForm.tsx`), camelCase para hooks (`useProduct.ts`) e utilitários.
- **Estrutura de Componentes**: Imports -> Tipos/Interfaces -> Lógica do Componente -> Subcomponentes (se internos).

## Estilização
- **CSS Utility-first**: Tailwind CSS é o método principal de estilização.
- **Classes Condicionais**: `clsx` e `tailwind-merge` são usados para estilização dinâmica.

## Gerenciamento de Estado
- **React Query**: Usado para quase todas as operações de busca de dados.
- **React Hook Form**: Padronizado para gerenciamento de formulários.

## Linting & Formatação
- **ESLint**: Regras recomendadas para JS, TS e React Hooks.
- **Variáveis Não Utilizadas**: Atualmente configurado como `off` no ESLint, o que pode ser uma preocupação.

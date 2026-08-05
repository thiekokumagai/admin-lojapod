# Estrutura do Projeto

```text
src/
├── components/          # Componentes React
│   ├── admin/           # Layout/componentes específicos de admin
│   ├── auth/            # Componentes de autenticação (Login, etc.)
│   ├── common/          # Componentes compartilhados entre funcionalidades
│   ├── products/        # Componentes de gerenciamento de produtos
│   ├── ui/              # Componentes base de UI (Shadcn)
│   └── variations/      # Componentes de variações de produto
├── data/                # Dados estáticos e constantes
├── hooks/               # Hooks React customizados
├── lib/                 # Configurações de bibliotecas de terceiros (ex: utils.ts)
├── pages/               # Componentes de rota principal/páginas
├── services/            # Serviços de API e lógica de negócio
├── test/                # Configuração de testes e helpers
├── types/               # Interfaces e tipos TypeScript
├── utils/               # Funções auxiliares
└── validations/         # Schemas Zod para validação de formulários
```

## Arquivos Chave
- `src/App.tsx`: Componente principal da aplicação e definição de rotas.
- `src/main.tsx`: Ponto de entrada da aplicação.
- `src/services/api.ts`: Configuração base da API.
- `tailwind.config.ts`: Configuração do Tailwind CSS.
- `vite.config.ts`: Configuração de build do Vite.

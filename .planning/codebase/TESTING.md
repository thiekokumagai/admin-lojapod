# Estratégia de Testes

## Frameworks
- **Testes Unitários/Integração**: Vitest.
- **Testes End-to-End**: Playwright.
- **Testes de Componente**: React Testing Library.

## Configuração
- `vitest.config.ts`: Configurado para JSDOM e testes React.
- `playwright.config.ts`: Configuração padrão de E2E.

## Estado Atual
- **Cobertura**: Provavelmente baixa, pois apenas `example.test.ts` foi encontrado em `src/test`.
- **Mocks**: Configurações para testes encontradas em `src/test/setup.ts`.

## Execução
- `npm test`: Executa o Vitest em modo único.
- `npm run test:watch`: Executa o Vitest em modo de observação.

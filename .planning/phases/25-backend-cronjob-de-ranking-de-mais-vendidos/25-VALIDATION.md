# Phase 25: Validation Strategy

## 1. Unit/Integration tests
- Verificar se o build do NestJS termina com sucesso após a instalação do `@nestjs/schedule`.

## 2. E2E tests
- N/A

## 3. Manual UAT
- Adicionar o campo `isBestSeller` via `prisma db push`.
- Invocar manualmente a rotina ou iniciar a API e aguardar o cronjob (pode-se adicionar um cron temporário de 1 minuto para validar na máquina local) e verificar se no banco de dados exatamente 1 produto por categoria foi marcado como `isBestSeller: true`.
- Verificar se a categoria de resistência permaneceu com todos em `false`.

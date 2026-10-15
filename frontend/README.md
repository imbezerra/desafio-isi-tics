# Passe · Frontend

Base React do desafio, criada com o template oficial react-ts do Vite.

## Pré-requisitos

Node.js 22.13 ou superior da linha 22 LTS e npm 10 ou superior. React 19, TypeScript 6 e Vite 8. As versões exatas estão no package-lock.json.

## Instalação e execução

Na raiz do repositório:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

A interface está em http://localhost:5173. A porta é fixa; encerre outra instância nessa porta antes de iniciar o Vite.

## Variáveis de ambiente

VITE_API_URL=http://localhost:3000 será a origem pública da API, sem /api/v1. Não use essa variável para segredos. O cliente HTTP será adicionado na próxima etapa.

## Estrutura e bibliotecas

- src/main.tsx: entrada React, fontes locais e providers.
- src/app/: roteamento declarativo mínimo e configuração do cache.
- src/styles/tokens.css: tokens visuais compartilhados.
- test/: configuração e teste inicial da política de consultas.
- React e React DOM 19: componentes e renderização, conforme a stack obrigatória.
- TypeScript 6 e os pacotes @types: checagem estática em modo estrito.
- Vite 8 e @vitejs/plugin-react 6: desenvolvimento e build com o template oficial.
- React Router 7: navegação no modo biblioteca, sem o modo framework.
- TanStack React Query 5: cache e estados das futuras consultas à API.
- @fontsource/geist e @fontsource/geist-mono 5: fontes locais do mockup.
- ESLint 10, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh e globals: lint para TypeScript/React e regras de hooks.
- Prettier 3: formatação e verificação sem alterar arquivos.
- Vitest 4, jsdom 27 e Testing Library React, Jest DOM e User Event: testes de componentes e interações, sem modo de observação.

## Verificações

Dentro de frontend/:

```bash
npm test
npm run lint
npm run format:check
npm run build
```

## Funcionalidades não implementadas

Esta etapa prepara a base. Cliente HTTP, contratos, consultas do resumo da liga, estrutura lateral e componentes compartilhados estão disponíveis. Tela inicial, consulta de jogadores e Docker serão adicionados nos commits seguintes.

## Uso de inteligência artificial

Será preenchido posteriormente

## Camada de consultas e componentes compartilhados

src/shared/api concentra fetch, contratos e mensagens de falha. src/features/overview consulta a API por hooks de dados. src/shared/components fornece tabela, paginação, campos, mensagens, marca e estrutura lateral. src/shared/formatters limita-se à apresentação em pt-BR. src/styles/global.css e os SVGs locais mantêm o visual compartilhado. Os testes verificam HTTP, cancelamento, mensagens, formatação e estados da tabela.

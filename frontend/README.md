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

VITE_API_URL=http://localhost:3000 será a origem pública da API, sem /api/v1. Não use essa variável para segredos. O cliente HTTP acrescenta o prefixo /api/v1 a essa origem.

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

A base, o cliente HTTP, os componentes compartilhados, a tela inicial e a consulta de jogadores estão implementados. Docker será integrado no próximo commit. Ainda faltam cadastro, edição, condição, exclusão, clubes, compra, venda, histórico/CSV, escalação, partidas e classificação. Mobile não faz parte do escopo atual solicitado.

## Uso de inteligência artificial

Será preenchido posteriormente

## Telas, consultas e componentes compartilhados

src/features/home implementa a tela inicial do Figma com números reais da liga. src/features/players separa tela, filtros, serviço HTTP e hooks. src/features/overview consulta clubes e o resumo da liga. src/shared/api concentra fetch, contratos e erros; shared/components compartilha tabela, paginação, campos, mensagens, marca e estrutura lateral. shared/formatters limita-se à apresentação em pt-BR. Os SVGs do Figma são servidos localmente.

## Consulta de jogadores e critérios de avaliação

A tabela mostra as colunas obrigatórias da API, na ordem recebida. Paginação de dez itens, busca, filtros combináveis e ordenação são enviados ao backend. Selecionar Só livres limpa e desabilita o filtro por clube, prevenção permitida pelo enunciado. Nova combinação volta à página 1. Carregamento, lista vazia, erro e nova tentativa usam componentes compartilhados; recusas preservam o message da API. Não há recálculo de regras de negócio no frontend.

Os testes verificam cliente HTTP, apresentação, estados da tabela, filtros, navegação e paginação. Os componentes cobrem os primeiros itens F01/F02; a pontuação só pode ser confirmada pela banca. O restante do fluxo será implementado nas próximas entregas.

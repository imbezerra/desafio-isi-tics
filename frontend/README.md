# 🖥️ Passe · Frontend

Interface em **React 19, TypeScript 6 e Vite 8**, consumindo a API NestJS. Os fluxos e as informações seguem o [enunciado](../docs/README.md); o Figma é referência visual.

[Guia principal](../README.md) · [Backend](../backend/README.md) · [Barema](../docs/barema.md)

## 🧰 Pré-requisitos

- Execução completa em containers: Docker Engine e Docker Compose v2 ou superior.
- Desenvolvimento local: Node.js 22 LTS, versão 22.13 ou superior da linha 22, e npm 10 ou superior.
- API em `http://localhost:3000`, com CORS liberado para `http://localhost:5173`.
- Porta `5173` livre. Os comandos locais abaixo usam Bash no Ubuntu 24.04.

## 🚀 Instalação e execução

### Opção principal: Docker

Siga a [execução do README principal](../README.md). O Compose sobe a aplicação completa, constrói os arquivos estáticos e os serve com Nginx em `http://localhost:5173`. O fallback de SPA permite acessar ou recarregar `/players` e outras rotas diretamente.

### Alternativa: desenvolvimento local

Com a API já em execução, a partir da **raiz do repositório**:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Abra `http://localhost:5173`. O servidor tem porta fixa e atualização automática. Não execute Vite e o container de frontend simultaneamente nessa porta; a preparação local da API está no [README do backend](../backend/README.md).

### Conferência local do build — opcional

Com o servidor de desenvolvimento parado, dentro de **`frontend/`**:

```bash
npm run build
npm run preview
```

O preview também usa `http://localhost:5173`. Ele serve para verificar o build; no Compose, quem entrega os arquivos de produção é o Nginx.

## 🗄️ Banco de dados

O frontend não acessa o PostgreSQL. Criação e recriação do banco são responsabilidade do backend e estão documentadas no [guia principal](../README.md). Testes do frontend usam respostas HTTP simuladas e não alteram o banco da aplicação.

Para explorar as telas com clubes, jogadores, contratos, histórico e partida já cadastrados, há uma [carga demonstrativa opcional](../README.md), executada explicitamente pelo backend somente em banco vazio. Ela não faz parte da instalação padrão nem exige alteração no frontend.

## 🔐 Variáveis de ambiente

O [frontend/.env.example](.env.example) contém:

- `VITE_API_URL=http://localhost:3000`: origem da API acessível pelo navegador, **sem `/api/v1`**; o cliente acrescenta o prefixo.

Essa variável é pública e incorporada no build: nunca coloque segredos nela. Após mudá-la, reinicie o Vite ou reconstrua a imagem. No Compose, ela vem do `.env` da raiz como argumento de build, não do `.env` local do frontend.

`FRONTEND_PORT` e `FRONTEND_ORIGIN`, documentadas na [raiz](../README.md), configuram a porta pública do container e o CORS da API; não são variáveis lidas pelo React. Hostnames internos, como `backend`, não funcionam como origem da API no navegador.

## 📁 Estrutura e responsabilidades

```text
src/app/          Rotas declarativas e configuração do cache
src/features/     Telas, serviços HTTP, consultas, formulários e estilos por funcionalidade
src/shared/api/   Cliente HTTP, ApiError e contratos da API
src/shared/       Componentes, hooks, downloads, formatação e validação reutilizáveis
src/styles/       Tokens e estilos globais
public/assets/    SVGs locais da referência visual
test/unit/        Componentes, consultas, validadores e formatadores isolados
test/integration/ Páginas e navegação com HTTP simulado
test/fixtures/    Dados exclusivos dos testes
test/helpers/     Simulação HTTP e montagem dos providers
```

`features/` reúne `home`, `overview`, `players`, `clubs`, `market`, `lineups`, `matches` e `standings`. Componentes apresentam a interface; arquivos `*.api.ts` centralizam HTTP, `*.queries.ts` compartilham consultas e `*-fields.ts` organizam os campos e validações. O hook compartilhado `useAction` controla escritas e bloqueia envio duplo.

### Bibliotecas e motivos de uso

- **`react` e `react-dom`:** componentes e renderização. O projeto foi iniciado com o template oficial `react-ts` do Vite.
- **`typescript`, `@types/react`, `@types/react-dom` e `@types/node`:** checagem estática da aplicação e dos testes.
- **`vite` e `@vitejs/plugin-react`:** desenvolvimento com atualização automática e build estático.
- **`react-router`:** navegação declarativa no modo biblioteca, sem modo framework.
- **`@tanstack/react-query`:** cache, cancelamento, estados de leitura e atualização das consultas após escritas.
- **`@fontsource/geist` e `@fontsource/geist-mono`:** fontes servidas localmente, sem CDN.
- **ESLint:** `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react-hooks` e `eslint-plugin-react-refresh` verificam TypeScript, hooks e Fast Refresh; `@stylistic/eslint-plugin` exige separação visual no código.
- **`prettier`:** formatação consistente, complementando as regras de espaçamento do ESLint.
- **`vitest` e `jsdom`:** execução dos testes e ambiente DOM simulado.
- **`@testing-library/react`, `@testing-library/jest-dom` e `@testing-library/user-event`:** testes pela perspectiva do usuário, com rótulos, papéis acessíveis e interações.

As versões exatas estão no `package-lock.json`, instalado com `npm ci`. Estilos usam CSS próprio e tokens visuais, sem Tailwind; SVGs e fontes ficam locais.

## 🧭 Decisões e premissas

- **Organização por funcionalidade:** cada área reúne sua interface e integração; tabela, campos, mensagens, diálogos, formatação e estrutura lateral são compartilhados. Componentes não chamam `fetch` diretamente.
- **API como fonte de verdade:** valores, ordem, totais, placares, duelos e classificação vêm do servidor. Não há recálculo local de regras; somente a soma de valor e taxa no custo total, permitida pelo enunciado.
- **Validação:** obrigatórios, tamanhos e faixas individuais são conferidos junto aos campos. Regras cruzadas e dependentes do banco ficam na API, salvo as prevenções expressamente permitidas, como não selecionar jogador doente na escalação.
- **Texto e datas:** espaços U+0020 são normalizados sem apagar controles que a API deve recusar. Datas de compra são montadas em UTC−3, independentemente do fuso do navegador; apresentação de datas e moedas usa o padrão pt-BR.
- **Cache e escritas:** consultas têm validade de 30 segundos, atualização manual e nenhuma repetição automática. Escritas usam bloqueio síncrono contra clique duplo e invalidam as consultas afetadas, mantendo filtros e ajustando a página se o último item sair da lista.
- **Erros e feedback:** o `message` da API é preservado; falhas de rede têm explicação própria. Uma recusa mantém os campos; durante envio, edição e fechamento do diálogo ficam bloqueados. Resultado bem-sucedido não é perdido se uma consulta posterior falhar.
- **Histórico e CSV:** nomes e valores históricos são os recebidos, inclusive após alteração do cadastro. Exportação usa os mesmos filtros e baixa o Blob sem reconstruir o conteúdo; erro JSON não vira arquivo CSV.
- **Navegação e acessibilidade:** rotas preservam filtros de partidas e abas do clube; campos têm rótulos, mensagens usam alertas e diálogos/abas oferecem navegação por teclado e restauração de foco.
- **Visual:** referência “Telas · Desktop” do Figma, adaptada aos componentes existentes. A tela inicial e os contadores são opcionais; seus dados vêm da API. O foco é desktop em 1366 × 768, sem objetivo de reprodução pixel a pixel.
- **Nomes:** identificadores internos em inglês; campos públicos e enums permanecem como no contrato, com textos da interface em português.

## 🧪 Testes e qualidade

Dentro de **`frontend/`**, após `npm ci`:

```bash
npm test
npm run lint
npm run format:check
npm run build
npm audit
```

`npm test` executa `vitest run` e termina sozinho. `format:check` executa ESLint e Prettier **sem alterar arquivos**; `npm run format` aplica correções intencionalmente. `.editorconfig` e `.gitattributes` orientam indentação e finais de linha LF.

A suíte cobre listagens, filtros, formulários, sucesso e recusas, preservação do `message`, cache, downloads, navegação e bloqueio de clique duplo nas nove ações. Respostas simuladas deliberadamente diferentes das fórmulas verificam a ausência de recálculo local. Em 20/10/2026 passaram **335 testes**.

Foco nativo, rolagem e disposição foram conferidos no navegador em 1366 × 768. Compra, venda, escalação, partidas e CSV também foram exercitados com API e PostgreSQL descartáveis; esses cenários não usam o banco principal. O jsdom simula a abertura e o fechamento de `<dialog>`, não substituindo a conferência no navegador.

## 🚧 Funcionalidades não implementadas

Os fluxos obrigatórios de F01 a F14 estão implementados. O layout mobile permanece fora do escopo desta versão; o diferencial de responsividade não é reivindicado. Outras limitações gerais estão no [README principal](../README.md).

## 🤖 Uso de inteligência artificial

Consulte a declaração central no [README principal](../README.md).

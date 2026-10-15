# Passe · Frontend

Interface React do desafio. A implementação segue o contrato e o barema de `docs/`; o mockup orienta o visual, sem substituir as regras escritas.

## Pré-requisitos

- Node.js 22.13 ou superior da linha 22 LTS e npm 10 ou superior.
- API NestJS em `http://localhost:3000`, com CORS liberado para `http://localhost:5173`.
- Para a execução completa em containers: Docker Engine e Docker Compose v2.

O projeto foi iniciado com o template oficial `react-ts` pelo comando `npm create vite@9.2.1 frontend -- --template react-ts --no-interactive`. Usa React 19, TypeScript 6 e Vite 8. As versões exatas de todas as dependências estão no `package-lock.json`.

## Instalação e execução no Ubuntu 24.04

A primeira opção é o Docker Compose, a partir da raiz do repositório:

```bash
cp .env.example .env
docker compose up -d --build
```

Origem da API: `http://localhost:3000`. URL da interface: `http://localhost:5173`. O build é feito a partir do código do repositório e de imagens públicas de Node.js, Nginx e PostgreSQL; não depende de serviços hospedados pelo candidato. O banco inicia vazio e as migrations são aplicadas pelo backend.

Para desenvolver a interface fora do Docker, com a API já iniciada, a partir da raiz:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

A interface abre em `http://localhost:5173`. A porta é fixa: se estiver ocupada, encerre a outra instância antes de iniciar o servidor de desenvolvimento. Não execute Vite e o container de frontend ao mesmo tempo na porta 5173.

Build e conferência local de produção, dentro de `frontend/`:

```bash
npm run build
npm run preview
```

O preview usa a mesma porta 5173 e exige que o outro servidor de frontend esteja parado. No Docker, Nginx entrega os arquivos estáticos e devolve `index.html` para as rotas da aplicação, permitindo abrir ou recarregar `/players` diretamente.

## Variáveis de ambiente

`frontend/.env.example` contém `VITE_API_URL=http://localhost:3000`, a origem da API sem `/api/v1`. O cliente acrescenta esse prefixo. É uma configuração pública incorporada no build, nunca um lugar para segredos. Mudanças exigem reiniciar o Vite ou reconstruir a imagem.

No Compose, a variável vem do `.env` da raiz e é passada como argumento de build. `FRONTEND_PORT` controla a porta pública da interface; `FRONTEND_ORIGIN` configura o CORS do backend. A origem da API precisa ser acessível pelo navegador; nomes da rede interna Docker, como `backend`, não servem.

## Estrutura e responsabilidades

- `src/main.tsx`: entrada da aplicação, fontes locais, estilos e providers.
- `src/app/App.tsx`: rotas declarativas, link para pular ao conteúdo e página não encontrada.
- `src/app/query-client.ts`: política de cache das consultas; sem novas tentativas automáticas.
- `src/features/home/`: tela inicial do mockup, atalho Enter e explicação das seis etapas.
- `src/features/overview/`: serviços e hooks de leitura dos contadores, clubes e resumo da liga.
- `src/features/players/`: listagem, filtros, cadastro, detalhes, edição, condição e confirmação de exclusão. `players.api.ts` concentra o contrato HTTP; `players.queries.ts` controla as consultas; `player-fields.ts` define campos, validação simples e corpos permitidos. `PlayerForm` compartilha cadastro/edição; `PlayerConditionForm` e `DeletePlayerDialog` tratam as ações específicas; `PlayerDialog` carrega os detalhes atualizados; `PlayerResult`, `PlayerIdentity` e `PlayerIndicators` compartilham a apresentação. Componentes não fazem `fetch`.
- `src/shared/api/`: cliente HTTP, erro centralizado e tipos dos campos consumidos da API.
- `src/shared/components/`: tabela com carregamento/vazio/erro, paginação, campo com rótulo/erro, mensagens, janelas com `<dialog>` nativo, ações de formulário, ícones, marca e estrutura lateral reutilizáveis.
- `src/shared/hooks/useAction.ts`: estado de escrita, mensagem de erro e bloqueio síncrono contra clique duplo, sem repetir pedidos automaticamente.
- `src/shared/formatters.ts`: apresentação de moedas e iniciais, sem cálculos de negócio.
- `src/styles/`: tokens visuais e estilos compartilhados.
- `public/assets/`: SVGs do Figma baixados para uso permanente local, com suas dimensões originais.
- `test/unit/`: testes de componentes isolados, consultas e formatação, espelhando as funcionalidades.
- `test/integration/`: navegação e páginas completas com respostas HTTP simuladas.
- `test/fixtures/` e `test/helpers/`: dados exclusivos de testes, simulação HTTP e providers.
- `Dockerfile`, `nginx.conf` e `.dockerignore`: build com Node 22 e servidor estático com fallback de SPA.

## Bibliotecas e motivos de uso

- React e React DOM 19: componentes e renderização da interface, conforme a stack obrigatória.
- TypeScript 6 e `@types/react`, `@types/react-dom`, `@types/node`: checagem estática, incluindo os testes; modo estrito e proibição de variáveis sem uso.
- Vite 8 e `@vitejs/plugin-react` 6: template oficial, servidor de desenvolvimento, atualização de componentes e build estático.
- React Router 7: navegação no modo biblioteca/declarativo, sem usar o modo framework proibido.
- TanStack React Query 5: cache, cancelamento por `AbortSignal`, estados de consulta e atualização por invalidação, sem recarregar a página.
- `@fontsource/geist` e `@fontsource/geist-mono` 5: fontes do mockup servidas localmente, sem depender de CDN.
- ESLint 10, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` e `globals`: análise de TypeScript/React, regras de hooks e compatibilidade com Fast Refresh.
- `@stylistic/eslint-plugin` 5: exige separação visual entre imports e declarações, funções, tipos, membros de classe e blocos de execução; complementa o Prettier, que preserva linhas em branco, mas não cria todas essas separações.
- Prettier 3: formatação consistente, com comandos separados para verificar e modificar.
- Vitest 4: testes executados uma vez, sem modo de observação.
- Testing Library React, Jest DOM e User Event: testar componentes pelos rótulos, papéis acessíveis e interações reais de usuário.
- jsdom 27: ambiente DOM para os testes de componentes.

O estilo usa CSS próprio com tokens do Figma. O código de referência gerado pelo plugin foi adaptado para componentes semânticos e layouts flex/grid, sem adicionar Tailwind nem copiar o posicionamento absoluto dos protótipos.

## Verificações

Dentro de `frontend/`, após `npm ci`:

```bash
npm test
npm run lint
npm run format:check
npm run build
npm audit
```

`npm test` usa `vitest run`: termina sozinho, sem observar arquivos. Há testes de tabela, filtros, paginação pela API, carregamento/vazio/erro, moedas, navegação e dos quatro fluxos de escrita de jogadores. Os testes conferem os onze campos do cadastro, os quatro permitidos na edição, confirmação da exclusão, respostas 204/404/409, preservação de filtros, valores exatos do servidor, clique duplo e bloqueio durante envio. Os pedidos são simulados; testes não criam nem apagam dados no banco da aplicação. O ambiente jsdom simula apenas abertura/fechamento de `<dialog>`; foco nativo, rolagem e disposição são conferidos no Chrome em 1366 × 768.

`npm run format:check` executa ESLint e Prettier sem alterar arquivos, incluindo a checagem de linhas em branco. Para corrigir intencionalmente, `npm run format` aplica as correções automáticas do ESLint e depois o Prettier. A configuração usa dois espaços e finais de linha LF; `.editorconfig` orienta editores compatíveis e `.gitattributes` mantém LF também no checkout do Git, inclusive no Windows. Os testes de tooling verificam que o lint rejeita código sem as separações e que a correção é estável com o Prettier. Nos estilos, os blocos de seletores também ficam separados por uma linha em branco.

## Decisões e premissas

- A referência visual é a página “Telas · Desktop” da cópia autorizada do Figma. O foco atual é Chrome em 1366 × 768; mobile foi retirado do escopo solicitado, embora ainda conste como diferencial no barema.
- A tela inicial é opcional no enunciado. Seus números vêm da API, não dos exemplos do mockup; líder só aparece quando há partidas gravadas.
- A lista recebe dez jogadores por página. Filtros e ordenação são enviados à API, e a ordem e os valores devolvidos são preservados.
- Os filtros têm rótulos visíveis. Vínculo, idade, valores e ordenação ficam em uma seção expansível; são aplicados pelo botão “Aplicar filtros”. Uma nova combinação volta à página 1.
- Selecionar “Só livres” limpa e desabilita o clube, prevenção expressamente permitida pelo enunciado. Combinações de faixas contraditórias são enviadas e o `message` da API é mostrado.
- O frontend não calcula overall, mercado, taxas, multas, patrimônio ou classificação. Formatar um número em pt-BR não altera a regra que o produziu.
- Cadastro e edição compartilham um formulário. O cliente exige os campos, o tamanho do nome em pontos de código Unicode após normalizar espaços U+0020 e as faixas inteiras individuais. Formato do nome, soma dos atributos, relação com potencial/idade e demais regras cruzadas são validados pela API, cujo `message` aparece no formulário sem apagar os campos digitados.
- O cadastro envia os onze campos definidos, sem condição, clube, base ou overall. Depois de salvar, a confirmação mostra base, overall, potencial e mercado devolvidos pela API, mesmo que o jogador não corresponda aos filtros atuais. A edição envia apenas nome, posição, agilidade e idade; posição fica bloqueada para jogador com clube.
- A alteração de condição impede a transição direta de Doente para Apto e explica o motivo. As demais recusas, inclusive alterações concorrentes, são decididas pela API. A exclusão é oferecida apenas para jogadores livres e exige confirmação; o cliente trata 204 sem tentar ler JSON.
- Cada escrita bem-sucedida atualiza as consultas e os contadores sem recarregar a página. Os filtros são preservados; excluir o único item da última página volta à anterior. O bloqueio de envio usa referência síncrona além de botão desabilitado, e as escritas não têm repetição automática. As janelas bloqueiam fechamento durante o envio, têm rolagem interna, Escape e restauração de foco; o menu também aceita teclado.
- Não há endpoints de estatísticas adicionais: o resumo usa consultas existentes. A ordenação permanece no backend.
- O tratamento de falha HTTP preserva o `message`; falhas de rede recebem uma explicação de conexão e opção de nova tentativa.
- Identificadores em inglês, camelCase para funções/variáveis e PascalCase para componentes/tipos. Campos públicos snake_case e enums permanecem como no contrato; textos e commits em português.

## Funcionalidades não implementadas

Esta etapa cobre a base, tela inicial, módulo de jogadores e Docker completo: listagem, filtros, paginação, cadastro, detalhes/edição, alteração de condição e exclusão de jogador livre com confirmação. São os fluxos de F01 a F04; a pontuação só pode ser confirmada pela banca. Ainda faltam clubes, compra, venda, histórico/CSV, escalação, partidas e classificação. Itens futuros do menu são informativos, identificados como “Em breve”.

As alterações de jogadores serão revisadas em commits por responsabilidade, mediante aprovação do usuário. A próxima sequência funcional é: criação/listagem de clubes; página do clube; compra; venda; histórico; CSV; escalação; partidas; classificação; revisão final. O F4 exige pelo menos dez commits em `frontend/` e push em três dias distintos: commits locais não comprovam os dias de envio.

Testes e lint/formatação atendem à estrutura dos respectivos diferenciais F5 quando os comandos passam; somam até 1,5 ponto. Sem o diferencial de responsividade, não se deve anunciar os 2 pontos completos de F5. O Compose atende à estrutura do diferencial Docker de B5 quando a lista abre pelo comando documentado.

## Uso de inteligência artificial

Será preenchido posteriormente

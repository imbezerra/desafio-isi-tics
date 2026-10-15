# Backend da liga

API NestJS, Node.js 22, TypeScript e PostgreSQL 16. Regras e contrato: [enunciado](../docs/README.md). Os seis endpoints de jogadores estão implementados sob `/api/v1/players`, o cadastro/consulta de clubes sob `/api/v1/clubs`, a compra em `POST /api/v1/players/{id}/buy` e a venda em `POST /api/v1/players/{id}/sell`.

O histórico está disponível em `GET /api/v1/clubs/{id}/transactions` e a exportação CSV em `GET /api/v1/clubs/{id}/transactions/export`. Ambos aceitam `type` (`COMPRA`, `VENDA` ou os dois separados por vírgula, sem espaços e sem repetição) e `player_id`. Exemplo: `/api/v1/clubs/1/transactions?type=VENDA&player_id=2`. O JSON inclui `data` e `summary`, com os totais dos mesmos registros filtrados. O CSV preserva essa ordem e usa UTF-8 sem BOM, separador `;`, vírgula decimal e LF inclusive na última linha.

A escalação é consultada em `GET /api/v1/clubs/{id}/lineup` e substituída em `PUT /api/v1/clubs/{id}/lineup`, com corpo como `{ "formation": "2-1-1", "player_ids": [1, 2, 3, 4, 5] }`. As formações aceitas são `3-1`, `2-2`, `2-1-1` e `1-2-1`. Os cinco ids devem ser distintos e incluir um goleiro, com os jogadores de linha distribuídos pelos setores da formação. Todos devem pertencer ao clube e estar APTO ou MAL_CONDICIONADO. A resposta traz `club_id`, `formation`, `complete` e `players` na ordem do elenco, sem alterar o caixa. Sem escalação, `formation` é nulo e `players` é vazio; ao perder um titular por doença ou venda, a formação é preservada e `complete` passa a falso.

Para jogar, envie `POST /api/v1/matches` com `{ "home_club_id": 1, "away_club_id": 2 }`. Os clubes devem ser distintos e ter escalações completas. A resposta `201` inclui `Location`, o placar e os seis duelos registrados. `GET /api/v1/matches` lista partidas sem duelos, com filtro opcional `club_id`; `GET /api/v1/matches/{id}` traz todos os duelos. `GET /api/v1/standings` calcula a classificação de todos os clubes, inclusive os sem jogos, por pontos, saldo, gols marcados e nome.

## Execução com Docker

Siga a [execução na raiz](../README.md). A API em `http://localhost:3000` aplica migrations antes de iniciar, sem inserir dados de exemplo.

## Logs HTTP

O Logger do NestJS registra uma linha por requisição concluída: data/hora de Brasília, método, caminho e status final. Exemplo do conteúdo: `2026-10-14T10:30:00-03:00 GET /api/v1/players 200`. O middleware é registrado antes do parser JSON e do CORS, incluindo recusas por JSON malformado, rotas inexistentes e preflight. Corpos e query strings ficam fora do log.

No Docker, execute `docker compose logs -f backend` na raiz; no desenvolvimento local, acompanhe o terminal de `npm run start:dev`. Os testes HTTP de `test/integration/common/` verificam uma chamada ao Logger por resposta, com os status 200, 400, 404, 409 e 204.

## Desenvolvimento local no Ubuntu 24.04

Na raiz, inicie o banco:

```bash
docker compose up -d db
```

Depois, na pasta `backend/`:

```bash
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run start:dev
```

O `.env.example` usa PostgreSQL em `localhost:5432`. Caso a porta ou as credenciais do Compose sejam alteradas localmente, atualize `DATABASE_URL` no `.env` do backend para corresponder.

Para recriar o banco de desenvolvimento do zero, apagando dados, na pasta `backend/`:

```bash
npm run prisma:reset
```

## Verificações

Na pasta `backend/`:

```bash
npm run build
npm run lint
npm run format:check
npm test
```

Os testes unitários ficam em `test/unit/`, organizados por área: `common/`, `jogadores/`, `clubes/`, `mercado/` e `liga/`. Essas áreas espelham os diretórios de `src/`; `tooling/` verifica a compatibilidade das ferramentas de teste. O Jest procura os arquivos `*.spec.ts` somente nessa pasta. O comando termina sozinho e inclui os exemplos de valor de mercado RN02–RN05.

Os testes usam Jest 30, `@types/jest` 30 e `ts-jest` 29.4.14 ou superior na linha 29, que declara suporte ao Jest 30. A numeração principal do transformador não precisa ser igual à do executor. O [guia de migração do Jest](https://jestjs.io/docs/upgrading-to-jest30) orienta a revisão de tipos, matchers e configuração; o projeto mantém a separação entre testes unitários e de integração e a execução sem modo de observação.

## Testes de integração

Os testes em `test/integration/` fazem requisições HTTP contra NestJS usando PostgreSQL real. Ficam separados por módulo, em `test/integration/jogadores/`, `test/integration/clubes/`, `test/integration/mercado/` e `test/integration/liga/`. Exigem um banco exclusivo terminado em `_test` e limpam suas tabelas a cada caso; nunca aponte para um banco com dados que você queira preservar.

Na raiz, com o serviço `db` em execução, crie o banco de testes uma vez:

```bash
docker compose exec -T db createdb -U liga_user liga_futebol_test
```

Na pasta `backend/`, no Ubuntu, usando a porta padrão do Compose:

```bash
DATABASE_URL='postgresql://liga_user:liga_password@localhost:5432/liga_futebol_test?schema=public' npm run prisma:deploy
TEST_DATABASE_URL='postgresql://liga_user:liga_password@localhost:5432/liga_futebol_test?schema=public' npm run test:integration
```

Na configuração local com porta `5434`, substitua `5432` nas URLs acima por `5434`. O ambiente de teste utiliza porta HTTP temporária, sem disputar a porta da API Docker.

São verificados cadastro, cabeçalho Location, formatos inválidos, filtros, paginação, ordenação, edição, exclusão lógica e atomicidade da alteração de condição dos jogadores. Para clubes, são verificados caixa inicial, normalização, unicidade de nome e sigla, ordenação, consulta e `404`. Para compra, são verificados os contratos, a transação, os limites de caixa e elenco, as recusas e o rollback da operação. Para venda, os testes cobrem multa, lucro, comissão, contrato, liberação do jogador, remoção da escalação, recompra, corpo ignorado e rollback de todos os efeitos.

Histórico e CSV são verificados com o ciclo real de compra e venda: filtros combinados, totais, conciliação com o caixa, nomes e valores do momento, desempate por id, preservação após exclusão lógica, formatos de CSV e erros JSON na exportação.

Os testes de escalação verificam as quatro formações, consulta vazia, ordenação, substituição, validações, preservação da escalação nas recusas e rollback em falha de gravação. Os elencos são formados por compras reais via API. Venda e alteração para DOENTE são testadas com escalação criada pelo endpoint, incluindo a ausência de retorno automático depois da recuperação.

Partidas e classificação usam o exemplo da RN20 (Águias FC 1 × 2 Delta FC) como referência, compartilhado em `test/fixtures/liga.fixture.ts`. Os testes verificam os seis duelos, redução de condição e arredondamento, empate sem gol, preservação de dados após edição/venda/exclusão, formações históricas, filtros, ordem, efeitos sobre a classificação, ausência de efeitos em caixa/elenco e rollback caso um duelo falhe. Os testes unitários de classificação reproduzem também o exemplo de seis clubes e quatro partidas da RN21.

## Variáveis

- `DATABASE_URL`: conexão PostgreSQL, usada pelo Prisma.
- `PORT`: porta HTTP da API; padrão 3000.
- `FRONTEND_ORIGIN`: única origem permitida pelo CORS; padrão `http://localhost:5173`.
- `TEST_DATABASE_URL`: conexão exclusiva usada somente pelos testes de integração.

## Organização e bibliotecas

- NestJS (`common`, `core`, `platform-express`): módulos, injeção de dependências, HTTP, pipes e erros.
- `@nestjs/config`: carrega as variáveis do `.env`.
- `@nestjs/swagger`: documentação interativa em `/docs` e especificação em `/docs-json`.
- Prisma (`@prisma/client` e CLI `prisma`): consultas parametrizadas, transações e migrations.
- `decimal.js`: precisão decimal e arredondamento explícito dos cálculos.
- `class-validator` e `class-transformer`: suporte ao mecanismo global de validação do NestJS; os formatos estritos de jogadores são validados pelos pipes próprios.
- `reflect-metadata` e `rxjs`: infraestrutura do NestJS.
- Jest, `ts-jest` e `@nestjs/testing`: testes TypeScript e inicialização da API de integração.
- ESLint, `typescript-eslint`, Prettier e plugins/configurações associados: análise estática e formatação.
- TypeScript, Nest CLI, schematics, ts-node, ts-loader e source-map-support: compilação e ferramentas de desenvolvimento.
- Pacotes `@types/*`: declarações de tipos para Node.js, Express e Jest.

### Correções de dependências transitivas

Os `overrides` do npm são restritos aos consumidores afetados: Swagger usa `js-yaml` 5.4.3 e `@prisma/config` usa `deepmerge-ts` 8.0.0. São correções dos alertas [GHSA-r3ph-w7gj-g6xm](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm) e [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), sem migrar NestJS ou Prisma de versão principal. O [deepmerge-ts 8](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0) altera o tratamento de Maps e algumas APIs; o Prisma instalado usa a função `deepmerge` para configuração, e este projeto não usa Maps nem configuração Prisma customizada. Geração do cliente, migrations, reset, testes e imagem Docker devem ser revalidados ao alterar essas versões. O lockfile fixa a árvore instalada.

Na árvore de testes, o override de `@istanbuljs/load-nyc-config` usa `js-yaml` 4.3.2 em vez da linha 3, retirando a cadeia antiga `argparse` 1 → `sprintf-js` afetada pelo alerta GHSA-hp3w-g68c-fv3c. O consumidor usa a API `load`, preservada na versão escolhida. `test/unit/tooling/nyc-config.compatibility.spec.ts` carrega a configuração de `test/fixtures/nyc-compatibility.yml` pelo pacote real do Istanbul para verificar essa compatibilidade. O override não altera o YAML usado pelo Swagger.

Verificação: `npm audit --omit=dev` para a árvore de produção; `npm audit` inclui as ferramentas de desenvolvimento. Em 14/10/2026, a migração para Jest 30 e o ajuste restrito do carregador de cobertura eliminaram os 34 apontamentos anteriores: ambas as auditorias retornaram zero na resolução limpa das dependências. O resultado representa os alertas conhecidos nessa data, não uma garantia de ausência de vulnerabilidades futuras. Não foi utilizado `audit fix --force`.

## Arquitetura em camadas por módulo

O backend usa arquitetura em camadas e o padrão Repository. O barema B2 exige separação entre controllers e regras/persistência, mas não exige um pattern específico. Essa estrutura também separa acesso ao banco dos serviços, para facilitar manutenção e testes.

Dentro de `src/jogadores/`, `src/clubes/`, `src/mercado/` e `src/liga/`, cada pasta tem uma responsabilidade:

- `controllers/`: rotas, status HTTP e cabeçalhos. Recebe entradas validadas e chama o service.
- `dto/`: tipos dos dados de cadastro, edição e consulta. Define contratos; os pipes validam esses contratos em execução.
- `pipes/`: validação estrita de corpo e query params, normalização e seleção de campos permitidos.
- `services/`: coordena os casos de uso. Busca jogador, chama regras, executa gravações pelo repository e monta a resposta. Não contém consultas Prisma nem fórmulas de cálculo.
- `repositories/`: concentra as consultas Prisma, o mapeamento de campos para gravação e o isolamento das transações. Não decide se uma edição, condição ou exclusão é permitida.
- `domain/`: regras de edição, transição de condição, exclusão e listagem. Funções sem dependência de NestJS ou Prisma.
- `presenters/`: transforma os registros em respostas com os nomes e valores numéricos exigidos pela API, usando os cálculos compartilhados.
- `swagger/`: documentação dos parâmetros da API.
- `jogadores.module.ts`: registra controller, service e repository para injeção de dependências.

Em `src/mercado/`, `CompraInputPipe` valida `club_id` e o formato de `loyalty_until`; `compra.rules.ts` aplica o prazo, a taxa e os limites de caixa e elenco. `venda.rules.ts` calcula multa, lucro, comissão progressiva, crédito e situação final do contrato. `MercadoService` coordena compra e venda, enquanto `MercadoRepository` concentra as consultas e faz caixa, vínculo do jogador, contrato, transação e saída da escalação participarem da mesma transação serializável. Os presenters montam as respostas `200` usando um mapeamento compartilhado de transação. `fidelidade.rules.ts` calcula dias restantes e percentual de multa para a consulta do clube e para a venda.

A venda ignora o corpo, inclusive JSON malformado, conforme V1. Um jogador no elenco sem contrato ativo indica inconsistência dos dados: a venda retorna 500 sem gravar efeitos. Contratos ativos permanecem com esse status até a venda, mesmo após o prazo de fidelidade; nesse caso a venda os encerra sem multa.

O histórico tem `HistoricoController`, `HistoricoService` e `HistoricoRepository` próprios dentro do módulo de mercado. JSON e CSV compartilham validação, consulta e apresentação das transações. O repository filtra e ordena no PostgreSQL, sem consultar os dados atuais do jogador para montar os registros históricos. `historico-resumo.ts` soma os valores com Decimal, e `historico-csv.presenter.ts` cuida do formato e do escape. Jogadores excluídos permanecem no histórico sem filtro; usá-los em `player_id` retorna 404. Sem registros, o JSON tem lista vazia e totais zerados, e o CSV contém somente cabeçalho e LF. O Content-Type CSV é definido após o sucesso da consulta, mantendo erros em JSON.

Em `src/liga/`, `EscalacaoInputPipe` valida formação e ids; `escalacao.rules.ts` confere clube, condição e distribuição dos setores definidos em `formacoes.ts`. `EscalacoesService` coordena a substituição, e `EscalacoesRepository` grava formação e cinco titulares numa transação serializável. O presenter reutiliza a apresentação de jogadores e a ordenação compartilhada em `common/orderings/elenco.ordering.ts`, também usada pela consulta de clube. Conflitos concorrentes retornam 409, sem repetição automática.

Ainda em `src/liga/`, `partida.rules.ts` seleciona os confrontos, aplica o efeito da condição e calcula gols; `classificacao.rules.ts` acumula placares e aplica desempates. Os controllers e pipes validam os dados e delegam aos serviços. `PartidasRepository` lê os titulares e grava partida e seis duelos na mesma transação serializável, preservando os dados usados. A consulta apresenta os registros gravados e deriva `result` do placar. `ClassificacaoService` lê clubes e placares numa transação consistente e calcula a tabela sem gravar pontos ou posições. No empate de nomes normalizados, o id crescente garante uma ordem estável, conforme as premissas.

`src/common/` mantém tipos, cálculos e parsers reutilizados. `src/database/` gerencia a conexão Prisma. O endpoint de saúde delega a consulta técnica ao `HealthService`.

### Transações e erros

O service delimita a operação chamando `repository.emTransacao(...)`. O repository entrega ao callback uma instância vinculada ao cliente transacional. Assim, ler o jogador, remover da escalação e gravar a condição usam a mesma transação serializável. Uma falha desfaz tudo; o teste de integração simula essa situação no PostgreSQL.

As regras de domínio lançam `RegraNegocioError`, sem depender de HTTP. O filtro central converte essa falha em `409` com `message`. Prazo de fidelidade fora da faixa lança `EntradaInvalidaError`, convertido em `400`. Formatos inválidos são recusados pelos pipes com `400`, e o service responde `404` quando não encontra o recurso ativo.

Essa é uma arquitetura em camadas pragmática, não uma implementação completa de Clean Architecture: o repository retorna registros tipados pelo Prisma e o presenter conhece esse formato. A dependência do ORM está explícita nessa fronteira, enquanto as regras de domínio permanecem independentes.

### Organização dos testes

Todos os testes ficam em `test/`: unitários em `unit/`, espelhando a área testada, e integração HTTP em `integration/`, separados por módulo. O build de produção exclui toda a pasta `test/`.

## Decisões, pendências e uso de IA

Consulte as seções correspondentes do [README da raiz](../README.md), mantidas como registro central do desenvolvimento. Nenhum commit é criado antes da aprovação do responsável pelo projeto.

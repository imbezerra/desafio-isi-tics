# Backend da liga

API NestJS, Node.js 22, TypeScript e PostgreSQL 16. Regras e contrato: [enunciado](../docs/README.md). Os seis endpoints de jogadores estão implementados sob `/api/v1/players`, o cadastro/consulta de clubes sob `/api/v1/clubs`, a compra em `POST /api/v1/players/{id}/buy` e a venda em `POST /api/v1/players/{id}/sell`.

## Execução com Docker

Siga a [execução na raiz](../README.md). A API em `http://localhost:3000` aplica migrations antes de iniciar, sem inserir dados de exemplo.

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

Os testes unitários ficam em `test/unit/`, organizados por área: `common/`, `jogadores/`, `clubes/` e `mercado/`. Essa estrutura espelha os diretórios de `src/`. O Jest procura os arquivos `*.spec.ts` somente nessa pasta. O comando termina sozinho e inclui os exemplos de valor de mercado RN02–RN05.

## Testes de integração

Os testes em `test/integration/` fazem requisições HTTP contra NestJS usando PostgreSQL real. Ficam separados por módulo, em `test/integration/jogadores/`, `test/integration/clubes/` e `test/integration/mercado/`. Exigem um banco exclusivo terminado em `_test` e limpam suas tabelas a cada caso; nunca aponte para um banco com dados que você queira preservar.

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

## Arquitetura em camadas por módulo

O backend usa arquitetura em camadas e o padrão Repository. O barema B2 exige separação entre controllers e regras/persistência, mas não exige um pattern específico. Essa estrutura também separa acesso ao banco dos serviços, para facilitar manutenção e testes.

Dentro de `src/jogadores/`, `src/clubes/` e `src/mercado/`, cada pasta tem uma responsabilidade:

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

`src/common/` mantém tipos, cálculos e parsers reutilizados. `src/database/` gerencia a conexão Prisma. O endpoint de saúde delega a consulta técnica ao `HealthService`.

### Transações e erros

O service delimita a operação chamando `repository.emTransacao(...)`. O repository entrega ao callback uma instância vinculada ao cliente transacional. Assim, ler o jogador, remover da escalação e gravar a condição usam a mesma transação serializável. Uma falha desfaz tudo; o teste de integração simula essa situação no PostgreSQL.

As regras de domínio lançam `RegraNegocioError`, sem depender de HTTP. O filtro central converte essa falha em `409` com `message`. Prazo de fidelidade fora da faixa lança `EntradaInvalidaError`, convertido em `400`. Formatos inválidos são recusados pelos pipes com `400`, e o service responde `404` quando não encontra o recurso ativo.

Essa é uma arquitetura em camadas pragmática, não uma implementação completa de Clean Architecture: o repository retorna registros tipados pelo Prisma e o presenter conhece esse formato. A dependência do ORM está explícita nessa fronteira, enquanto as regras de domínio permanecem independentes.

### Organização dos testes

Todos os testes ficam em `test/`: unitários em `unit/`, espelhando a área testada, e integração HTTP em `integration/`, separados por módulo. O build de produção exclui toda a pasta `test/`.

## Decisões, pendências e uso de IA

Consulte as seções correspondentes do [README da raiz](../README.md), mantidas como registro central do desenvolvimento. Nenhum commit é criado antes da aprovação do responsável pelo projeto.

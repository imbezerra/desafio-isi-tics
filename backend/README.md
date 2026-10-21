# ⚙️ Passe · Backend

API REST em **NestJS 11, TypeScript, Node.js 22 e PostgreSQL 16**, seguindo as regras e o contrato de [docs/](../docs/README.md).

[Guia principal](../README.md) · [Frontend](../frontend/README.md) · [Barema](../docs/barema.md)

## 🧰 Pré-requisitos

- Execução em containers: Docker Engine e Docker Compose v2 ou superior.
- Desenvolvimento local: Node.js 22 LTS, versão 22.13 ou superior da linha 22, e npm 10 ou superior.
- PostgreSQL 16, iniciado pelo Compose. Os comandos locais abaixo usam Bash no Ubuntu 24.04.

## 🚀 Instalação e execução

### Opção principal: Docker

Siga a [execução do README principal](../README.md). Ela sobe frontend, backend e banco, aplica as migrations e inicia a API em `http://localhost:3000`. Não é necessário instalar npm no host para essa opção.

### Alternativa: desenvolvimento local

Em um ambiente novo, na **raiz do repositório**, prepare somente o banco:

```bash
cp .env.example .env
docker compose up -d db
```

Depois, a partir da raiz:

```bash
cd backend
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run start:dev
```

O último comando mantém a API em execução com recompilação automática. A origem é `http://localhost:3000`, a base das rotas é `/api/v1` e o Swagger está em `http://localhost:3000/docs`; o documento OpenAPI está em `/docs-json`.

Não execute a API local e o container de backend simultaneamente na porta `3000`. Se o banco do Compose usar outra porta ou credenciais, ajuste `DATABASE_URL` em `backend/.env` antes de aplicar as migrations.

## 🗄️ Criação e recriação do banco

`npm run prisma:deploy` aplica as migrations versionadas ao PostgreSQL iniciado pelo Compose. Não há seed automático: o banco novo começa vazio.

**Somente para apagar os registros e recriar o banco de desenvolvimento**, com o banco em execução, dentro de `backend/`:

```bash
npm run prisma:reset
```

Para a execução inteiramente em Docker, utilize o [comando de recriação da raiz](../README.md). Não edite migrations já aplicadas; evoluções do schema recebem uma nova migration.

### 🌱 Carga demonstrativa — opcional

Com as migrations aplicadas e um **banco vazio**, dentro de `backend/`, no desenvolvimento local:

```bash
npm run build
npm run seed:demo
```

No Docker, após construir e iniciar os serviços atualizados, execute na **raiz**:

```bash
docker compose exec backend npm run seed:demo
```

São criados 2 clubes com 5 titulares cada, 4 jogadores livres, 11 contratos, 12 transações (11 compras e 1 venda), 2 escalações `2-1-1` e 1 partida com 6 duelos. As fidelidades usam uma data relativa de 90 dias. Um jogador comprado doente passa pelas transições permitidas de recuperação e é vendido, demonstrando multa, lucro e comissão, sem manipular valores financeiros.

`src/demo/demo.data.ts` define entradas fictícias; `demo.seed.ts` reutiliza pipes, serviços e repositories dos módulos. `demo.repository.ts` confere as sete tabelas e envolve toda a carga numa transação serializável; `demo.runner.ts` é a entrada exclusiva do comando, carrega o `.env` local quando existe e encerra a conexão. Não há novas dependências, variáveis obrigatórias ou endpoints.

Banco preenchido ou falha retorna código de saída diferente de zero. Repetir a carga não altera os registros existentes; jogadores excluídos também impedem a execução. A carga não apaga dados e falhas não deixam registros parciais. Não faça outras ações durante sua execução. Ela não faz parte da inicialização, do reset ou da preparação da banca e não tem pontuação específica no barema.

## 🔐 Variáveis de ambiente

Copie [backend/.env.example](.env.example) para `backend/.env` no desenvolvimento local:

- `DATABASE_URL`: conexão Prisma. Exemplo local: `postgresql://liga_user:liga_password@localhost:5432/liga_futebol?schema=public`.
- `PORT=3000`: porta HTTP do processo NestJS.
- `FRONTEND_ORIGIN=http://localhost:5173`: única origem liberada pelo CORS.
- `TEST_DATABASE_URL`: conexão exclusiva dos testes HTTP, com banco terminado em `_test`; é fornecida no comando de testes, não usada pela aplicação.

No Docker, o Compose monta `DATABASE_URL` usando `db:5432`, define `PORT=3000` e recebe as demais configurações do [.env.example da raiz](../.env.example). Nunca use o banco da aplicação em `TEST_DATABASE_URL`: a suíte limpa as tabelas entre os casos.

## 📁 Estrutura e responsabilidades

```text
prisma/           Schema, mapeamentos e migrations das sete tabelas
src/common/       Cálculos, parsers, ordenação, erros e logs compartilhados
src/database/     Conexão e ciclo de vida do Prisma
src/demo/         Carga demonstrativa opcional, isolada da inicialização
src/players/      Cadastro, consulta, edição, condição e exclusão lógica
src/clubs/        Cadastro, consulta, elenco e resumo financeiro
src/market/       Compra, venda, contratos, histórico e CSV
src/league/       Escalação, partidas, duelos históricos e classificação
src/health/       Verificação de saúde com consulta ao banco
test/unit/        Testes unitários por área de src/
test/integration/ Testes HTTP com PostgreSQL real e exclusivo
test/fixtures/    Dados compartilhados somente pelos testes
```

Os módulos separam `controllers/` (HTTP), `dto/` e `pipes/` (contratos e validação), `services/` (casos de uso), `domain/` (regras), `repositories/` (Prisma e transações) e `presenters/` (respostas). `swagger/` reúne a documentação auxiliar. Controllers não acessam o banco nem calculam regras.

### Bibliotecas e motivos de uso

- **NestJS:** `@nestjs/common`, `@nestjs/core` e `@nestjs/platform-express` fornecem módulos, injeção de dependências e HTTP; `@nestjs/config` carrega o `.env`; `@nestjs/swagger` documenta a API.
- **Prisma:** `@prisma/client` executa consultas parametrizadas e transações; a CLI `prisma` gera o cliente e aplica migrations.
- **`decimal.js`:** precisão e arredondamento explícitos dos cálculos monetários.
- **`class-validator` e `class-transformer`:** infraestrutura do `ValidationPipe`; pipes próprios implementam os formatos estritos do contrato, sem coerção dos números JSON.
- **`reflect-metadata` e `rxjs`:** infraestrutura de metadados e execução do NestJS.
- **`jest`, `ts-jest` e `@nestjs/testing`:** testes TypeScript e inicialização da API de integração. `@types/jest`, `@types/node` e `@types/express` fornecem os tipos utilizados.
- **ESLint:** `eslint`, `@eslint/js`, `@eslint/eslintrc`, `typescript-eslint` e `globals` verificam o código; `eslint-config-prettier` e `eslint-plugin-prettier` integram a formatação.
- **`prettier`:** padroniza a formatação, com comando separado de verificação.
- **TypeScript e ferramentas Nest:** `typescript`, `@nestjs/cli`, `@nestjs/schematics`, `ts-node`, `ts-loader` e `source-map-support` permitem compilar, desenvolver e depurar.

As versões exatas estão no `package-lock.json`. Overrides restritos no `package.json` corrigem dependências transitivas de Swagger, Prisma e ferramentas de cobertura. O teste `test/unit/tooling/nyc-config.compatibility.spec.ts` verifica o carregador real de configuração de cobertura.

## 🧭 Decisões e premissas

- **Arquitetura em camadas com Repository:** serviços coordenam operações e repositories concentram o Prisma. Não é Clean Architecture completa: registros tipados pelo ORM atravessam a fronteira do repository; as regras de domínio permanecem independentes.
- **Persistência:** `@map` e `@@map` preservam os nomes físicos em português, com identificadores internos em inglês. Nome normalizado e sigla de clube são únicos; um jogador só pode estar em uma escalação. A chave auxiliar Unicode usa `TEXT`, sem retirar o limite de 60 pontos de código do nome.
- **Cálculos:** fórmulas compartilhadas evitam duplicação. Overall, mercado, patrimônio e classificação não são colunas; valores e nomes históricos são gravados quando a operação ocorre.
- **Atomicidade:** edição, condição, exclusão, compra, venda, escalação e partida usam transações serializáveis. Compra, venda, escalação e partida convertem conflito concorrente em `409`, sem repetição automática; falhas inesperadas desfazem a operação.
- **Listagens:** filtros persistidos ficam no PostgreSQL; busca Unicode, mercado e ordenação de jogadores são aplicados pela API antes de paginar. Isso reutiliza a fórmula central, mas consome memória proporcional aos candidatos; grandes volumes exigiriam consultas especializadas.
- **Contratos e históricos:** o contrato continua `ATIVO` após a fidelidade até a venda, que o encerra sem multa. Exclusão de jogador é lógica. Transações e duelos não são recalculados com o cadastro atual; a classificação é derivada dos placares gravados.
- **Texto e datas:** normalização somente de espaços U+0020, ordenação por pontos de código Unicode e UTC−3 fixo, sem horário de verão histórico.
- **Erros:** tratamento central retorna JSON com `message`: `400` para entrada inválida, `404` para recurso inexistente, `409` para regra de negócio e `500` genérico para falha inesperada, sem stack trace. Consultas, exclusão e venda ignoram corpo, conforme V1.
- **CSV:** JSON e exportação compartilham filtros e ordem. CSV usa UTF-8 sem BOM, `;`, vírgula decimal e LF final; erros da exportação continuam em JSON.

## 🧪 Testes e qualidade

Dentro de **`backend/`**, após a instalação e geração do cliente:

```bash
npm test
npm run lint
npm run format:check
npm run build
npm audit
```

Os testes unitários terminam sozinhos, incluem valor de mercado RN02–RN05 e ficam separados do build de produção. `format:check` somente verifica; `npm run format` altera intencionalmente a formatação. `npm audit` consulta os alertas conhecidos, incluindo desenvolvimento; não é garantia de ausência de vulnerabilidades.

### Integração com PostgreSQL — opcional para executar a aplicação

A suíte HTTP apaga dados **somente do banco de testes indicado**. Com o serviço `db` em execução e as credenciais padrão, crie esse banco uma única vez, na **raiz**:

```bash
docker compose exec -T db createdb -U liga_user liga_futebol_test
```

Depois, dentro de **`backend/`**, em Bash, usando a porta padrão `5432`:

```bash
DATABASE_URL='postgresql://liga_user:liga_password@localhost:5432/liga_futebol_test?schema=public' npm run prisma:deploy
TEST_DATABASE_URL='postgresql://liga_user:liga_password@localhost:5432/liga_futebol_test?schema=public' npm run test:integration
```

Se já criou `liga_futebol_test`, não repita `createdb`. Se alterou porta ou credenciais, ajuste as URLs de teste. A API de integração usa uma porta temporária.

Os testes cobrem os módulos, códigos HTTP, `Location`, rollback, limites financeiros, CSV, snapshots e unicidades diretamente no PostgreSQL. Na revisão de 20/10/2026, incluindo a carga demonstrativa, passaram **184 testes unitários e 65 de integração**; os exemplos RN20 e RN21 são referências adicionais, não uma reprodução do roteiro privado da banca.

Os testes de `test/unit/demo/` validam as entradas fictícias e a proteção das sete tabelas. `test/integration/demo/` verifica a carga completa no PostgreSQL, conciliação do caixa, repetição, preservação de dados existentes, jogador excluído, rollback e execuções concorrentes. A carga não é executada automaticamente pelos testes dos demais módulos.

## 📋 Logs HTTP

Na **raiz**, para ler os logs do container:

```bash
docker compose logs backend
```

O Logger do NestJS produz uma linha por requisição concluída, com data/hora em UTC−3, método, caminho e status, inclusive recusas. Corpos e query strings não são registrados. No desenvolvimento local, os logs aparecem no terminal do servidor.

## 🚧 Funcionalidades não implementadas

Nenhuma funcionalidade obrigatória de backend identificada no enunciado ficou pendente de implementação. Limitações da estratégia de listagem e de concorrência estão documentadas acima; as pendências gerais ficam no [README principal](../README.md).

## 🤖 Uso de inteligência artificial

Consulte a declaração central no [README principal](../README.md).

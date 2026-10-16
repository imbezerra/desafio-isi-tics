# Liga fictícia de futebol

Aplicação do desafio descrito em [docs/README.md](docs/README.md). Os requisitos são consultados antes de implementar cada funcionalidade; a pontuação segue [docs/barema.md](docs/barema.md).

## Pré-requisitos

- Docker Engine com Docker Compose v2, em execução. No Windows, Rancher Desktop com engine compatível com Docker.
- Para desenvolvimento fora dos containers: Node.js 22.13 ou superior da linha 22 LTS e npm 10 ou superior.
- PostgreSQL 16 é iniciado pela imagem pública `postgres:16-alpine`.

## Instalação e execução no Ubuntu 24.04

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up -d --build
```

A origem da API é `http://localhost:3000`. A base dos endpoints é `/api/v1`, a saúde está em `http://localhost:3000/api/v1/health` e o Swagger em `http://localhost:3000/docs`.

A interface está em `http://localhost:5173`. O Compose constrói e inicia frontend, API e banco com esse único comando. A API aplica as migrations antes de iniciar; o banco começa vazio, sem carga automática. O frontend usa build estático servido pelo Nginx, com suporte ao acesso direto às rotas, como `/players`.

Para acompanhar o ambiente:

```bash
docker compose ps
docker compose logs backend
```

Cada requisição concluída gera uma única linha pelo Logger do NestJS, com data/hora de Brasília, método, caminho e status final, inclusive nas recusas. Corpos e query strings não são registrados.

## Criação e recriação do banco

A criação inicial ocorre no primeiro comando de execução acima. Para recriar o banco da aplicação do zero, apagando seus registros e reaplicando as migrations, execute na raiz:

```bash
docker compose exec backend npx prisma migrate reset --force
```

Esse comando apaga os dados da aplicação. Não execute para apenas reiniciar o ambiente.

## Variáveis de ambiente

O arquivo `.env.example` da raiz contém as configurações locais do Compose: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_ORIGIN`, `FRONTEND_PORT` e `VITE_API_URL`. São valores de exemplo para desenvolvimento. `VITE_API_URL` é a origem da API vista pelo navegador, sem `/api/v1`, incorporada durante o build do frontend; não use o hostname interno `backend` nela. Ao mudar a porta da API, ajuste também essa origem. Ao mudar a porta da interface, ajuste `FRONTEND_ORIGIN` para manter o CORS restrito.

As portas padrão no host são `5432` para PostgreSQL e `3000` para a API. Se a porta `5432` já estiver ocupada, ajuste `POSTGRES_PORT` no seu `.env`; por exemplo, `5434`. Dentro da rede Docker, a conexão continua usando `db:5432`.

Para executar a API fora do Docker e rodar verificações, consulte [backend/README.md](backend/README.md). O desenvolvimento e as verificações da interface estão em [frontend/README.md](frontend/README.md).

## Estrutura de pastas e bibliotecas

- `backend/src/common/`: tipos, cálculos, normalização de texto, parsers e tratamento central de erros.
- `backend/src/database/`: conexão Prisma.
- `backend/src/players/`: módulo separado em controllers, DTOs, pipes, services, repositories, domínio, presenters e Swagger.
- `backend/src/clubs/`: módulo de cadastro e consulta de clubes, com a mesma separação em camadas.
- `backend/src/market/`: compra e venda de jogadores, contratos, taxas, multas, comissões, transações atômicas, histórico filtrado com totais e exportação CSV.
- `backend/src/league/`: escalações, partidas com seis duelos históricos e classificação calculada.
- `backend/test/unit/`: testes unitários organizados por área, espelhando os diretórios de `src/`.
- `backend/test/integration/`: testes de integração HTTP organizados por módulo, com PostgreSQL exclusivo.
- `backend/prisma/`: modelo de dados e migrations versionadas das sete tabelas obrigatórias.
- `docs/`: enunciado, barema, glossário e exemplo de avaliação fornecidos para o desafio.
- `frontend/src/app/`: roteamento e configuração das consultas.
- `frontend/src/features/`: funcionalidades da interface, com tela, estilos, serviços HTTP e hooks separados.
- `frontend/src/shared/`: contratos da API, cliente HTTP, componentes reutilizáveis e formatação.
- `frontend/test/`: testes unitários e de integração de componentes, organizados por área.
- `frontend/public/assets/`: SVGs locais extraídos do mockup, sem URLs temporárias.

As bibliotecas e os motivos de uso estão descritos nos READMEs do backend e do frontend.

## Decisões e premissas

- As regras monetárias usam precisão decimal e arredondamento somente no resultado final de cada cálculo.
- O banco mantém os nomes em português exigidos; as respostas HTTP usam os nomes em inglês e snake_case do contrato.
- Identificadores, classes, arquivos e pastas do backend e do frontend adotam inglês, com camelCase para funções/variáveis e PascalCase para tipos/classes/componentes. Os aliases do Prisma usam inglês com `@map`/`@@map`, preservando as tabelas e colunas em português exigidas pelo enunciado. Campos públicos e valores de lista da API permanecem exatamente como definidos; mensagens, documentação e commits continuam em português.
- Arquitetura em camadas com Repository: controllers delegam ao serviço, serviços coordenam regras e transações, e repositories concentram o Prisma. Funções de domínio validam regras; pipes validam os formatos sem converter textos em números nos corpos JSON. A explicação de cada camada está no README do backend.
- A exclusão de jogador é lógica. Registros históricos não são apagados.
- Na listagem, o PostgreSQL aplica filtros persistidos. Busca Unicode, filtro de mercado e ordenação são feitos na API antes de paginar, reutilizando o cálculo central de mercado. Essa escolha evita duplicar a fórmula em SQL, mas consome memória proporcional aos jogadores candidatos. Para volumes elevados, essa etapa precisará migrar para consultas especializadas no banco.
- Edição, condição, exclusão, compra, venda, escalação e partida usam transações com isolamento serializável. Não há repetição automática em conflito concorrente; compra, venda, escalação e partida retornam 409 nesse caso, e falhas inesperadas retornam 500 e desfazem a operação.
- Partidas guardam os nomes, posições, condições, atributos usados, valores dos duelos, formações e placar do momento. As consultas não recalculam duelos com os dados atuais. A classificação é calculada pelos placares gravados, incluindo todos os clubes, e nunca persistida.
- Os nomes são normalizados usando somente espaços U+0020; a comparação alfabética segue pontos de código Unicode, sem collation dependente do sistema.

## Funcionalidades não implementadas

O backend está implementado. No frontend, estão disponíveis a tela inicial, o módulo de jogadores, a listagem/criação de clubes e a página do clube com elenco e contratos. Jogadores têm consulta com filtros, ordenação, paginação e estados de carregamento, vazio e erro; cadastro com os sete indicadores; detalhes e edição dos quatro campos permitidos; alteração de condição; exclusão de jogador livre com confirmação. Clubes têm nome, sigla, caixa, valor do elenco e patrimônio, ordenação por nome ou patrimônio e cadastro com nome e sigla. A página de cada clube mostra o elenco na ordem da API, valores de mercado e de compra, fim da fidelidade no horário de Brasília, dias restantes e percentual de multa. Os valores calculados são exibidos a partir da resposta da API, e as ações atualizam listas, filtros e contadores sem recarregar a página. Ainda faltam compra, venda, histórico/CSV, escalação, partidas e classificação. O layout mobile não faz parte do escopo atual solicitado. Os itens de menu e abas futuros estão identificados como “Em breve”, sem botões que simulem funcionalidades inexistentes.

## Uso de inteligência artificial

Será preenchido posteriormente

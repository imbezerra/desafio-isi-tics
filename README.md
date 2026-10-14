# Liga fictícia de futebol

Aplicação do desafio descrito em [docs/README.md](docs/README.md). Os requisitos são consultados antes de implementar cada funcionalidade; a pontuação segue [docs/barema.md](docs/barema.md).

## Pré-requisitos

- Docker Engine com Docker Compose v2, em execução. No Windows, Rancher Desktop com engine compatível com Docker.
- Para desenvolvimento fora dos containers: Node.js 22 e npm 10 ou superior.
- PostgreSQL 16 é iniciado pela imagem pública `postgres:16-alpine`.

## Instalação e execução no Ubuntu 24.04

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up -d --build
```

A origem da API é `http://localhost:3000`. A base dos endpoints é `/api/v1`, a saúde está em `http://localhost:3000/api/v1/health` e o Swagger em `http://localhost:3000/docs`.

A API aplica as migrations antes de iniciar. O banco começa vazio, sem carga automática. O frontend ainda não foi implementado; neste estágio o Compose sobe somente API e banco, portanto o diferencial completo de Docker ainda depende da interface.

Para acompanhar o ambiente:

```bash
docker compose ps
docker compose logs backend
```

## Criação e recriação do banco

A criação inicial ocorre no primeiro comando de execução acima. Para recriar o banco da aplicação do zero, apagando seus registros e reaplicando as migrations, execute na raiz:

```bash
docker compose exec backend npx prisma migrate reset --force
```

Esse comando apaga os dados da aplicação. Não execute para apenas reiniciar o ambiente.

## Variáveis de ambiente

O arquivo `.env.example` da raiz contém as configurações locais do Compose: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `BACKEND_PORT` e `FRONTEND_ORIGIN`. São valores de exemplo para desenvolvimento.

As portas padrão no host são `5432` para PostgreSQL e `3000` para a API. Se a porta `5432` já estiver ocupada, ajuste `POSTGRES_PORT` no seu `.env`; por exemplo, `5434`. Dentro da rede Docker, a conexão continua usando `db:5432`.

Para executar a API fora do Docker e rodar verificações, consulte [backend/README.md](backend/README.md).

## Estrutura de pastas e bibliotecas

- `backend/src/common/`: tipos, cálculos, normalização de texto, parsers e tratamento central de erros.
- `backend/src/database/`: conexão Prisma.
- `backend/src/jogadores/`: módulo separado em controllers, DTOs, pipes, services, repositories, domínio, presenters e Swagger.
- `backend/src/clubes/`: módulo de cadastro e consulta de clubes, com a mesma separação em camadas.
- `backend/src/mercado/`: compra e venda de jogadores, contratos, taxas, multas, comissões, transações atômicas, histórico filtrado com totais e exportação CSV.
- `backend/src/liga/`: escalações, partidas com seis duelos históricos e classificação calculada.
- `backend/test/unit/`: testes unitários organizados por área, espelhando os diretórios de `src/`.
- `backend/test/integration/`: testes de integração HTTP organizados por módulo, com PostgreSQL exclusivo.
- `backend/prisma/`: modelo de dados e migrations versionadas das sete tabelas obrigatórias.
- `docs/`: enunciado, barema, glossário e exemplo de avaliação fornecidos para o desafio.
- `frontend/`: reservado para a interface.

As bibliotecas e os motivos de uso estão descritos no README do backend.

## Decisões e premissas

- As regras monetárias usam precisão decimal e arredondamento somente no resultado final de cada cálculo.
- O banco mantém os nomes em português exigidos; as respostas HTTP usam os nomes em inglês e snake_case do contrato.
- Arquitetura em camadas com Repository: controllers delegam ao serviço, serviços coordenam regras e transações, e repositories concentram o Prisma. Funções de domínio validam regras; pipes validam os formatos sem converter textos em números nos corpos JSON. A explicação de cada camada está no README do backend.
- A exclusão de jogador é lógica. Registros históricos não são apagados.
- Na listagem, o PostgreSQL aplica filtros persistidos. Busca Unicode, filtro de mercado e ordenação são feitos na API antes de paginar, reutilizando o cálculo central de mercado. Essa escolha evita duplicar a fórmula em SQL, mas consome memória proporcional aos jogadores candidatos. Para volumes elevados, essa etapa precisará migrar para consultas especializadas no banco.
- Edição, condição, exclusão, compra, venda, escalação e partida usam transações com isolamento serializável. Não há repetição automática em conflito concorrente; compra, venda, escalação e partida retornam 409 nesse caso, e falhas inesperadas retornam 500 e desfazem a operação.
- Partidas guardam os nomes, posições, condições, atributos usados, valores dos duelos, formações e placar do momento. As consultas não recalculam duelos com os dados atuais. A classificação é calculada pelos placares gravados, incluindo todos os clubes, e nunca persistida.
- Os nomes são normalizados usando somente espaços U+0020; a comparação alfabética segue pontos de código Unicode, sem collation dependente do sistema.

## Funcionalidades não implementadas

Interface React; logs HTTP por requisição. As rotas funcionais de jogadores, clubes, mercado e liga estão implementadas, incluindo partidas, histórico e classificação. A venda e a mudança para `DOENTE` removem titulares da escalação atomicamente, preservando a formação; recuperar a condição não reinsere o jogador automaticamente.

## Uso de inteligência artificial

Será preenchido posteriormente

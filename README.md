# ⚽ Passe · Liga fictícia de futebol

Aplicação fullstack para administrar jogadores, clubes e o mercado de uma liga: da contratação com fidelidade à escalação, às partidas e à classificação.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

[Backend](backend/README.md) · [Frontend](frontend/README.md) · [Enunciado](docs/README.md) · [Critérios de avaliação](docs/barema.md)

## ✨ Funcionalidades

- **Jogadores:** cadastro, edição, condição física, exclusão lógica, indicadores, busca, filtros e paginação.
- **Clubes:** criação, elenco, contratos e resumo financeiro, com ordenação por nome ou patrimônio.
- **Mercado:** compra, venda, fidelidade, taxas, multas, comissões e histórico com filtros, totais e CSV.
- **Liga:** quatro formações de cinco titulares, partidas com seis duelos históricos e classificação.

## 🧰 Pré-requisitos

- Docker Engine e Docker Compose v2 ou superior, em execução e utilizáveis sem `sudo` no Ubuntu 24.04.
- Portas locais livres: `5173` (frontend), `3000` (API) e `5432` (banco).
- Acesso à internet para baixar pacotes e imagens públicas de Node.js, Nginx e PostgreSQL 16.
- **Somente para desenvolvimento fora dos containers:** Node.js 22 LTS, versão 22.13 ou superior da linha 22, e npm 10 ou superior.

Ambiente Docker conferido: Engine 29.5.3 e Compose 5.1.4. As versões das imagens e dos pacotes estão nos Dockerfiles e lockfiles do projeto.

No Windows, pode ser utilizado o Rancher Desktop com engine compatível com Docker. Os comandos abaixo são para Bash no Ubuntu 24.04; no PowerShell, use `Copy-Item` no lugar de `cp`.

## 🚀 Instalação e execução

Com o repositório já clonado, execute na **raiz**, em um ambiente novo:

```bash
cp .env.example .env
docker compose up -d --build
```

O Compose constrói frontend e backend a partir deste repositório, inicia o PostgreSQL e aplica as migrations antes de iniciar a API. O banco novo começa **vazio**, sem carga automática. Os dois `package-lock.json` estão versionados e os builds usam `npm ci`.

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Origem da API:** [http://localhost:3000](http://localhost:3000), com endpoints em `/api/v1`.
- **Swagger:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **Saúde:** [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

Para acompanhar os serviços, na raiz:

```bash
docker compose ps
docker compose logs backend
```

O frontend de produção é servido pelo Nginx, incluindo acesso direto às rotas. Desenvolvimento local e verificações: [backend](backend/README.md) e [frontend](frontend/README.md).

## 🗄️ Criação e recriação do banco

A criação inicial ocorre no primeiro `docker compose up -d --build`, com as migrations de `backend/prisma/migrations/`. Um volume preserva os dados entre reinicializações.

**Atenção: o comando abaixo apaga todos os registros da aplicação e reaplica as migrations.** Com os serviços em execução, use na raiz somente quando quiser recriar o banco do zero:

```bash
docker compose exec backend npx prisma migrate reset --force
```

Não é necessário recriar o banco para reiniciar ou atualizar o sistema.

### 🌱 Dados demonstrativos — opcional

A instalação e a recriação acima continuam deixando o banco vazio. Para demonstração manual, com o backend atualizado e um **banco sem registros**, execute na raiz:

```bash
docker compose exec backend npm run seed:demo
```

A carga cria **2 clubes, 14 jogadores (10 contratados e 4 livres), 2 escalações completas e 1 partida com 6 duelos**. Inclui condições físicas variadas, contratos com fidelidade de 90 dias a partir da execução e histórico de compras e de uma venda com multa, lucro e comissão calculados pelos serviços existentes.

O comando nunca é executado na inicialização ou nas migrations. Recusa banco preenchido, inclusive com jogadores excluídos logicamente, sem apagar ou mesclar dados. A carga inteira usa uma transação: falhas desfazem suas gravações e uma segunda execução não duplica registros. Não execute outras ações durante a carga.

Esse recurso não tem pontuação específica e não é executado pela banca, que prepara seus próprios dados. Desenvolvimento local e testes da carga: [README do backend](backend/README.md).

## 🔐 Variáveis de ambiente

O [.env.example](.env.example) da raiz configura o Compose. As credenciais são exemplos de desenvolvimento, não credenciais de produção.

- `POSTGRES_DB=liga_futebol`: nome do banco da aplicação.
- `POSTGRES_USER=liga_user` e `POSTGRES_PASSWORD=liga_password`: credenciais locais do PostgreSQL.
- `POSTGRES_PORT=5432`: porta do banco no host; dentro do Docker permanece `db:5432`.
- `BACKEND_PORT=3000`: porta pública da API; internamente ela escuta em `3000`.
- `FRONTEND_PORT=5173`: porta pública do frontend; o Nginx escuta em `80` no container.
- `FRONTEND_ORIGIN=http://localhost:5173`: única origem liberada pelo CORS da API.
- `VITE_API_URL=http://localhost:3000`: origem pública da API vista pelo navegador, sem `/api/v1`.

Se uma porta estiver ocupada, ajuste o `.env` local. Mudar a porta da API exige ajustar `VITE_API_URL`; mudar a do frontend exige ajustar `FRONTEND_ORIGIN`. Como `VITE_API_URL` é incorporada no build, reconstrua o frontend após alterá-la. Não use o hostname interno `backend` nem coloque segredos nessa variável.

As variáveis específicas de desenvolvimento e testes estão nos READMEs do [backend](backend/README.md) e do [frontend](frontend/README.md).

## 📁 Estrutura e bibliotecas

```text
backend/    API NestJS, regras, persistência, migrations e testes
frontend/   Interface React, funcionalidades, componentes e testes
docs/       Enunciado, barema, glossário e exemplo de avaliação
```

- [Backend: estrutura, bibliotecas e responsabilidades](backend/README.md): NestJS, Prisma, Decimal.js, Jest e ferramentas de qualidade.
- [Frontend: estrutura, bibliotecas e responsabilidades](frontend/README.md): React, Vite, React Router, TanStack Query e ferramentas de interface e testes.

Cada README explica o motivo das dependências declaradas no respectivo `package.json`.

## 🧭 Decisões e premissas

- Backend em camadas por módulo, com Repository; frontend organizado por funcionalidade e componentes compartilhados.
- Regras de negócio e valores calculados ficam na API. A interface formata e apresenta as respostas, sem recalcular as regras; apenas soma valor e taxa no custo total, conforme permitido.
- Identificadores internos em inglês; tabelas e colunas em português, com mapeamento Prisma. Campos públicos e enums seguem o contrato do desafio.
- Precisão decimal para moedas e UTC−3 fixo para datas. Exclusão de jogador é lógica; transações e duelos preservam os dados do momento.
- As decisões específicas, inclusive limites da estratégia de listagem, transações e cache, estão nas seções correspondentes dos READMEs técnicos.

## ✅ Verificações

Os comandos de testes, lint, formatação, build e auditoria estão nos READMEs do [backend](backend/README.md) e do [frontend](frontend/README.md). Os testes terminam sozinhos, sem modo de observação; a verificação de formatação não altera arquivos.

Na revisão de 20/10/2026, incluindo a carga demonstrativa, passaram 184 testes unitários do backend, 65 testes de integração com PostgreSQL exclusivo e 335 testes do frontend. Os nove fluxos de escrita e o CSV foram conferidos também em ambiente descartável, com interface de produção em 1366 × 768. Isso não substitui os roteiros da banca nem garante pontuação.

## 🚧 Funcionalidades não implementadas

Nenhuma funcionalidade obrigatória identificada no enunciado ficou pendente de implementação. Conforme orientação posterior recebida, as telas mobile foram retiradas do escopo da versão final; esta implementação foi conferida em desktop, a 1366 × 768. A fidelidade visual pixel a pixel ao Figma não é um objetivo desta versão.

## 🤖 Uso de inteligência artificial

Utilizei o **Codex como principal ferramenta de desenvolvimento assistido** para acelerar a implementação e apoiar a análise do enunciado. A IA contribuiu de forma significativa para o código do backend e do frontend, os testes, a configuração do Docker e a documentação. Também utilizei integrações MCP e plugins do **Figma** para consultar as telas desktop e orientar a construção da interface.

Meu papel foi definir o escopo, avaliar as propostas e acompanhar a implementação à luz das regras de negócio. Discuti alternativas de tecnologia antes de escolher NestJS, pedi uma separação mais clara das camadas do backend e dos testes, e avaliei a organização do frontend por funcionalidades. Sempre que uma solução parecia confusa ou distante da documentação, solicitei explicações e ajustes antes de seguir. Assim, aceitei sugestões como a centralização dos cálculos no backend e o uso de testes automatizados, alterei propostas de arquitetura e interface e descartei caminhos que não atendiam às decisões do projeto.

Também usei a IA para **simular a avaliação da banca** com base no enunciado e no barema: revisar regras de negócio, conferir respostas da API, executar testes e verificar a instalação em um ambiente isolado. Na validação final, fiz testes manuais dos principais fluxos da aplicação e comparei o comportamento observado com o esperado. Essas verificações ajudaram a identificar pontos que precisavam de correção, sem substituir a avaliação oficial.

Conduzi, portanto, um desenvolvimento assistido com decisões e validações sob minha responsabilidade. Pedi explicações sobre as mudanças para compreender e conseguir apresentar o projeto; **cada commit foi submetido à minha aprovação antes de ser criado**, e fiz manualmente os _pushes_ para o repositório remoto.

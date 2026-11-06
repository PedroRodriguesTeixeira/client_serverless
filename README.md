# clientes-serverless

API serverless para cadastro de clientes (CRUD), construída com **AWS SAM**, **AWS Lambda** (Node.js 20 + TypeScript), **API Gateway** e **Amazon DynamoDB**.

> ⚠️ **Projeto em desenvolvimento.** A criação de clientes (`POST /clientes`) e a listagem (`GET /clientes`) estão implementadas. As demais rotas já estão declaradas na infraestrutura, mas os handlers ainda estão vazios ou retornam respostas provisórias. Até o momento, os testes da API são feitos **localmente** com o `sam local`.

---

## Sumário

- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Status dos endpoints](#status-dos-endpoints)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Executando localmente](#executando-localmente)
- [Exemplos de uso](#exemplos-de-uso)
- [Geração da chave dos clientes](#geração-da-chave-dos-clientes)
- [Pontos de atenção](#pontos-de-atenção)
- [Próximos passos](#próximos-passos)

---

## Arquitetura

```
Cliente HTTP ──► API Gateway ──► Lambda (uma por operação) ──► DynamoDB
```

- Cada operação do CRUD é uma **Lambda separada**, com seu próprio handler.
- O código compartilhado (ex.: geração de chave) fica em `backend/src/services` e é empacotado junto com cada Lambda pelo **esbuild** durante o `sam build`.
- O nome da tabela chega às Lambdas pela variável de ambiente `TABLE_NAME`, definida no `template.yml`.
- Cada Lambda recebe apenas a permissão IAM de que precisa (leitura, escrita ou CRUD).

## Estrutura do projeto

```
clientes-serverless/
├── template.yml                 # IaC principal: Lambdas, rotas da API e tabela
├── database/
│   └── template.yml             # Stack separada, só com a tabela de testes
└── backend/
    ├── package.json
    └── src/
        ├── handlers/            # Um arquivo por Lambda
        │   ├── criar.ts         # POST   /clientes
        │   ├── obter.ts         # GET    /clientes
        │   ├── buscar.ts        # GET    /clientes/{pk}
        │   ├── atualizar.ts     # PUT    /clientes/{pk}
        │   └── excluir.ts       # DELETE /clientes/{pk}
        └── services/
            └── incrementalPkService.ts   # Gera a chave sequencial dos clientes
```

## Status dos endpoints

| Método | Rota              | Lambda                     | Permissão IAM | Status                                   |
|--------|-------------------|----------------------------|---------------|------------------------------------------|
| POST   | `/clientes`       | `CriarClienteFunction`     | Escrita       | ✅ Implementado (em testes)               |
| GET    | `/clientes`       | `ListarClientesFunction`   | Leitura       | ✅ Implementado: lista clientes via DynamoDB (em testes) |
| GET    | `/clientes/{pk}`  | `BuscarClienteFunction`    | Leitura       | ⏳ Não implementado                       |
| PUT    | `/clientes/{pk}`  | `AtualizarClienteFunction` | CRUD          | ⏳ Não implementado                       |
| DELETE | `/clientes/{pk}`  | `ExcluirClienteFunction`   | CRUD          | ⏳ Não implementado                       |

## Pré-requisitos

- [Node.js 20+](https://nodejs.org/) e npm
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), configurada com as **suas** credenciais (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Docker](https://www.docker.com/) (o `sam local` usa containers para executar as Lambdas)

> 🔒 Nunca faça commit de credenciais, `.env`, `samconfig.toml` ou chaves `.pem`. Esses arquivos já estão no `.gitignore`.

## Configuração

### 1. Instalar as dependências

```bash
cd backend
npm install
```

### 2. Parâmetros do template

O `template.yml` aceita os parâmetros abaixo:

| Parâmetro     | Descrição                                   | Valores               |
|---------------|---------------------------------------------|-----------------------|
| `TableName`   | Nome da tabela do DynamoDB usada pelas Lambdas | Defina o seu       |
| `Environment` | Ambiente de execução                        | `dev`, `staging`, `prod` (padrão: `dev`) |

Ambos são repassados às Lambdas como variáveis de ambiente (`TABLE_NAME` e `ENVIRONMENT`).

### 3. Criar a tabela de testes

A tabela usada nos testes locais fica em uma stack separada (`database/template.yml`). Ela usa uma chave de partição `pk` do tipo `String` e cobrança sob demanda (`PAY_PER_REQUEST`).

```bash
cd database
sam deploy --guided
```

> Se preferir outro nome de tabela, ajuste o template e informe o mesmo nome no parâmetro `TableName` do template principal.

### 4. Inicializar o contador de clientes

A geração de chaves depende de um item de controle na tabela (veja [Geração da chave dos clientes](#geração-da-chave-dos-clientes)). Crie-o uma única vez, antes do primeiro `POST`:

```bash
aws dynamodb put-item \
  --table-name <NOME_DA_TABELA> \
  --item '{"pk": {"S": "FINAL#CLIENT"}, "lastClient": {"N": "0"}}'
```

## Executando localmente

Na raiz do projeto:

```bash
# Compila os handlers TypeScript com esbuild
sam build

# Sobe a API em http://127.0.0.1:3000
sam local start-api --parameter-overrides TableName=<NOME_DA_TABELA>
```

As Lambdas rodam localmente em Docker, mas acessam a tabela do DynamoDB **na sua conta AWS**, usando as credenciais configuradas na AWS CLI.

Para testar uma Lambda isoladamente, sem a API:

```bash
sam local invoke CriarClienteFunction --event evento.json
```

Para sobrescrever variáveis de ambiente, use `--env-vars env.json` (o arquivo `env.json` não deve ir para o repositório).

## Exemplos de uso

### Criar cliente

```bash
curl -X POST http://127.0.0.1:3000/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome": "Maria Silva", "email": "maria@exemplo.com", "telefone": "11999999999"}'
```

**Resposta (200):**

```json
{ "message": "Usuário criado com sucesso!" }
```

**Corpo vazio (400):**

```json
{ "message": "Corpo da requisição vazio." }
```

Campos aceitos no corpo:

| Campo      | Tipo   |
|------------|--------|
| `nome`     | string |
| `email`    | string |
| `telefone` | string |

> Ainda não existe validação dos campos. Qualquer JSON é aceito, e campos ausentes são gravados vazios.

### Listar clientes

```bash
curl http://127.0.0.1:3000/clientes
```

A resposta `200 OK` retorna os clientes encontrados no DynamoDB no campo `message`:

```json
{ "message": [ ... ] }
```

## Geração da chave dos clientes

Os clientes recebem uma chave sequencial no formato `CLIENTE#<número>` (ex.: `CLIENTE#1`, `CLIENTE#2`...).

O `incrementalPkService.ts`, localizado em `backend/src/services/`, faz isso em dois passos:

O handler importa a função usando o caminho relativo abaixo:

```ts
import { incrementalPk } from "../services/incrementalPkService";
```

1. Lê o item de controle `pk = "FINAL#CLIENT"` e soma 1 ao atributo `lastClient`;
2. Grava o novo valor de volta no item de controle e devolve a chave `CLIENTE#<novo valor>`.

## Pontos de atenção

Pontos conhecidos que ainda estão sendo trabalhados:

- **Contador não inicializado:** se o item `FINAL#CLIENT` não existir, a chave gerada vira `CLIENTE#NaN`. Por isso o passo 4 da configuração é obrigatório.
- **Concorrência:** a leitura e a gravação do contador são feitas em operações separadas. Duas requisições simultâneas podem gerar a mesma chave, e uma sobrescreve a outra. Uma alternativa é usar `UpdateCommand` com `ADD`, que incrementa de forma atômica.
- **Caminho do serviço incremental:** `criar.ts` importa `incrementalPk` usando `../services/incrementalPkService`, que aponta para `backend/src/services/incrementalPkService.ts`.
- **Tabela declarada em dois templates:** a tabela existe tanto em `database/template.yml` quanto em `template.yml`, com nome fixo. Fazer deploy das duas stacks na mesma conta e região gera conflito. Além disso, o nome fixo no recurso pode ficar diferente do parâmetro `TableName` usado nas permissões e na variável de ambiente.
- **Erros:** falhas no DynamoDB retornam status `400` com o objeto de erro na resposta. O ideal seria retornar `500` com uma mensagem genérica, sem expor detalhes internos.
- **Status de criação:** o `POST` retorna `200`. O mais comum para criação é `201 Created`, junto com a chave do novo cliente.

## Próximos passos

- [ ] Implementar `GET /clientes/{pk}` (busca por chave)
- [ ] Implementar `PUT /clientes/{pk}` (atualização)
- [ ] Implementar `DELETE /clientes/{pk}` (exclusão)
- [ ] Validar o corpo das requisições
- [ ] Tornar o contador de chaves atômico
- [ ] Unificar a definição da tabela em um só template
- [ ] Adicionar testes automatizados
- [ ] Fazer o deploy completo na AWS (Lambdas + API Gateway)

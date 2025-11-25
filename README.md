# GeminiIntegration

Projeto Node.js com TypeScript para integração com Google Gemini API - Upload de arquivos e busca de informações.

## Instalação

```bash
npm install
```

## Configuração

1. Crie um arquivo `.env` na raiz do projeto:
```env
GEMINI_API_KEY=your_api_key_here
PORT=3000
```

2. Obtenha sua API Key do Gemini em: https://makersuite.google.com/app/apikey

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento com nodemon
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Executa o código compilado
- `npm run clean` - Remove a pasta dist

## Estrutura do Projeto

```
.
├── src/                # Backend (Node.js + TypeScript)
│   ├── controllers/    # Controllers das rotas
│   ├── services/       # Serviços (Gemini API)
│   ├── routes/         # Definição de rotas
│   ├── middleware/     # Middlewares (upload)
│   ├── types/          # Tipos TypeScript
│   └── index.ts        # Entrada da aplicação
├── frontend/           # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── services/    # Serviços de API
│   │   └── App.tsx
│   └── package.json
├── dist/               # Código compilado (gerado automaticamente)
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Endpoints

### 1. Listar Arquivos
**GET** `/api/files`

Lista todos os arquivos enviados para o Gemini.

**Query Parameters (opcionais):**
- `pageSize` - Número de arquivos por página (padrão: todos)
- `pageToken` - Token para paginação (retornado na resposta anterior)

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": {
    "files": [
      {
        "id": "5lfpjnjfsvwo",
        "displayName": "documento.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": "12345",
        "state": "ACTIVE",
        "createTime": "2024-01-01T00:00:00Z",
        "updateTime": "2024-01-01T00:00:00Z",
        "uri": "https://generativelanguage.googleapis.com/v1beta/files/5lfpjnjfsvwo"
      }
    ],
    "nextPageToken": "token_para_proxima_pagina"
  }
}
```

**Exemplo com cURL:**
```bash
curl http://localhost:3000/api/files
```

**Com paginação:**
```bash
curl "http://localhost:3000/api/files?pageSize=10&pageToken=token_aqui"
```

### 2. Upload de Arquivo
**POST** `/api/files/upload`

Envia um arquivo para o Gemini e retorna o `fileUri` para uso posterior.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (arquivo a ser enviado)

**Response:**
```json
{
  "success": true,
  "data": {
    "fileUri": "gs://...",
    "fileName": "documento.pdf",
    "mimeType": "application/pdf",
    "size": 12345
  },
  "message": "Arquivo enviado com sucesso"
}
```

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@documento.pdf"
```

### 3. Buscar Informações (Chat)
**POST** `/api/files/chat`

Faz perguntas sobre o conteúdo de arquivos enviados anteriormente.

**Funcionalidade Inteligente:**
- Se você **não especificar** `fileUri` ou `fileUris`, a IA busca automaticamente em **todos os arquivos** enviados
- A IA identifica qual arquivo contém a informação relevante e responde baseado nele
- Você pode fazer upload de vários arquivos ao longo do tempo e fazer perguntas sem precisar especificar qual arquivo usar

**Request (com arquivo específico):**
```json
{
  "question": "Qual é o resumo deste documento?",
  "fileUri": "5lfpjnjfsvwo"
}
```

**Request (busca automática em todos os arquivos):**
```json
{
  "question": "Qual é o conteúdo do arquivo de teste?"
  // Sem fileUri - busca automaticamente em todos os arquivos
}
```

**Request (múltiplos arquivos específicos):**
```json
{
  "question": "Compare os dois documentos",
  "fileUris": ["id1", "id2"]
}
```

**Request (com histórico de conversa):**
```json
{
  "question": "Qual é o resumo deste documento?",
  "fileUri": "5lfpjnjfsvwo",
  "conversationHistory": [
    {
      "role": "user",
      "parts": "Qual é o tema principal?"
    },
    {
      "role": "model",
      "parts": "O tema principal é..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Resposta da IA baseada no arquivo...",
    "fileUri": "5lfpjnjfsvwo",
    "fileUrisUsed": ["5lfpjnjfsvwo"]
  }
}
```

**Nota:** O campo `fileUrisUsed` mostra quais arquivos foram utilizados na busca. Quando você não especifica `fileUri`, todos os arquivos disponíveis são usados e a IA identifica qual contém a informação relevante.

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3000/api/files/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual é o resumo deste documento?",
    "fileUri": "gs://..."
  }'
```

### 4. Informações do Arquivo
**GET** `/api/files/info/:fileUri`

Retorna informações sobre um arquivo específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "files/abc123",
    "displayName": "documento.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 12345,
    "state": "ACTIVE",
    "createTime": "2024-01-01T00:00:00Z"
  }
}
```

## Tipos de Arquivo Suportados

- PDF (`.pdf`)
- Texto (`.txt`, `.md`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- PowerPoint (`.ppt`, `.pptx`)
- Imagens (`.jpg`, `.png`, `.gif`, `.webp`)

## Exemplo de Uso Completo

### Via API (cURL)

1. **Upload do arquivo:**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@meu_documento.pdf"
```

2. **Salve o `fileUri` retornado**

3. **Faça perguntas sobre o arquivo:**
```bash
curl -X POST http://localhost:3000/api/files/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quais são os pontos principais?",
    "fileUri": "gs://..."
  }'
```

### Via Frontend (React)

1. **Inicie o backend:**
```bash
npm run dev
```

2. **Em outro terminal, inicie o frontend:**
```bash
cd frontend
npm install
npm start
```

3. **Acesse `http://localhost:3000` no navegador**

4. **Use a interface para:**
   - Fazer upload de arquivos
   - Ver lista de arquivos
   - Fazer perguntas sobre os arquivos usando o chat

Veja mais detalhes no [README do frontend](./frontend/README.md).


# Integração n8n com Gemini Integration

Este guia mostra como integrar o n8n com sua API Gemini para criar workflows automatizados.

## Pré-requisitos

1. **Servidor Gemini rodando:**
   ```bash
   npm run dev
   ```
   O servidor deve estar rodando em `http://localhost:3000`

2. **n8n instalado e rodando:**
   ```bash
   npm install -g n8n
   n8n
   ```
   Acesse: `http://localhost:5678`

## Endpoints Disponíveis

Sua API expõe os seguintes endpoints:

- `GET /api/files` - Lista todos os arquivos
- `POST /api/files/upload` - Upload de arquivo
- `POST /api/files/chat` - Chat com arquivos
- `GET /api/files/info/:fileUri` - Informações de um arquivo

## Workflows Exemplos

### 1. Workflow: Processar Upload e Fazer Pergunta

Este workflow:
1. Recebe um arquivo via webhook
2. Faz upload para o Gemini
3. Faz uma pergunta sobre o arquivo
4. Envia resultado por email/Slack

**Configuração no n8n:**

#### Node 1: Webhook (Trigger)
- **Tipo:** Webhook
- **Método:** POST
- **Path:** `gemini-upload`
- **Response Mode:** Respond to Webhook

#### Node 2: HTTP Request - Upload
- **Tipo:** HTTP Request
- **Método:** POST
- **URL:** `http://localhost:3000/api/files/upload`
- **Body Content Type:** Form-Data
- **Body Parameters:**
  - Name: `file`
  - Value: `{{ $json.body.file }}` (ou o campo do webhook)

#### Node 3: HTTP Request - Chat
- **Tipo:** HTTP Request
- **Método:** POST
- **URL:** `http://localhost:3000/api/files/chat`
- **Body Content Type:** JSON
- **Body:**
  ```json
  {
    "question": "Faça um resumo deste documento",
    "fileUri": "{{ $json.data.fileUri }}"
  }
  ```

#### Node 4: Email/Slack (Opcional)
- Configure para enviar o resultado

---

### 2. Workflow: Monitorar Arquivos e Processar Automaticamente

Este workflow:
1. Monitora novos arquivos em uma pasta/Google Drive
2. Faz upload automático
3. Processa com Gemini
4. Salva resultado

**Configuração no n8n:**

#### Node 1: Google Drive / File System (Trigger)
- Configure para monitorar novos arquivos

#### Node 2: HTTP Request - Upload
- Mesma configuração do exemplo anterior

#### Node 3: HTTP Request - Chat
- Mesma configuração do exemplo anterior

#### Node 4: Salvar Resultado
- Pode salvar em banco de dados, Google Sheets, etc.

---

### 3. Workflow: Chatbot com Webhook

Este workflow cria um chatbot que:
1. Recebe perguntas via webhook
2. Busca em todos os arquivos automaticamente
3. Retorna resposta

**Configuração no n8n:**

#### Node 1: Webhook (Trigger)
- **Tipo:** Webhook
- **Método:** POST
- **Path:** `gemini-chat`
- **Response Mode:** Respond to Webhook

#### Node 2: HTTP Request - Chat
- **Tipo:** HTTP Request
- **Método:** POST
- **URL:** `http://localhost:3000/api/files/chat`
- **Body Content Type:** JSON
- **Body:**
  ```json
  {
    "question": "{{ $json.body.question }}"
  }
  ```
  **Nota:** Sem `fileUri`, busca em todos os arquivos automaticamente!

#### Node 3: Responder Webhook
- Retorna `{{ $json.data.response }}`

---

## Exemplos de JSON para Importar no n8n

### Workflow 1: Upload e Chat Básico

```json
{
  "name": "Gemini - Upload e Chat",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "gemini-upload",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "gemini-upload"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/files/upload",
        "sendBody": true,
        "bodyContentType": "multipart-form-data",
        "specifyBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "file",
              "value": "={{ $json.body.file }}"
            }
          ]
        }
      },
      "id": "upload-file",
      "name": "Upload File",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/files/chat",
        "sendBody": true,
        "bodyContentType": "json",
        "specifyBody": true,
        "jsonBody": "={\n  \"question\": \"Faça um resumo deste documento\",\n  \"fileUri\": \"{{ $json.data.fileUri }}\"\n}",
        "options": {}
      },
      "id": "chat-with-file",
      "name": "Chat with File",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [650, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json.data.response }}"
      },
      "id": "respond-webhook",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Upload File", "type": "main", "index": 0}]]
    },
    "Upload File": {
      "main": [[{"node": "Chat with File", "type": "main", "index": 0}]]
    },
    "Chat with File": {
      "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
    }
  }
}
```

### Workflow 2: Chatbot Simples

```json
{
  "name": "Gemini - Chatbot",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "gemini-chat",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "gemini-chat"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/files/chat",
        "sendBody": true,
        "bodyContentType": "json",
        "specifyBody": true,
        "jsonBody": "={\n  \"question\": \"{{ $json.body.question }}\"\n}",
        "options": {}
      },
      "id": "chat-request",
      "name": "Chat Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\n  \"response\": \"{{ $json.data.response }}\",\n  \"filesUsed\": \"{{ $json.data.fileUrisUsed }}\"\n}"
      },
      "id": "respond-webhook",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Chat Request", "type": "main", "index": 0}]]
    },
    "Chat Request": {
      "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
    }
  }
}
```

---

## Como Usar os Workflows

### Método 1: Importar JSON

1. No n8n, clique em **"Add workflow"**
2. Clique nos **3 pontos** (menu) no canto superior direito
3. Selecione **"Import from File"** ou **"Import from URL"**
4. Cole o JSON do workflow
5. Ative o workflow

### Método 2: Criar Manualmente

1. Crie um novo workflow
2. Adicione os nodes conforme os exemplos acima
3. Configure cada node
4. Conecte os nodes
5. Ative o workflow

---

## Exemplos de Uso

### Como Descobrir a URL do Endpoint

Depois de ativar o workflow no n8n:
1. Clique no node **Webhook**
2. A URL completa estará no campo **"Webhook URL"**
3. Geralmente é: `http://localhost:5678/webhook/[nome-do-path]`

### Testar Upload via cURL

```bash
curl -X POST http://localhost:5678/webhook/gemini-upload \
  -F "file=@documento.pdf"
```

### Testar Chat via cURL

```bash
curl -X POST http://localhost:5678/webhook/gemini-chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Qual é o resumo deste documento?"}'
```

### Testar Chat com Arquivo Específico

```bash
curl -X POST http://localhost:5678/webhook/gemini-chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quais são os pontos principais?",
    "fileUri": "5lfpjnjfsvwo"
  }'
```

**📋 Veja mais exemplos de teste em:** [n8n-workflows/TEST_ENDPOINTS.md](./n8n-workflows/TEST_ENDPOINTS.md)

---

## Integrações Avançadas

### Integrar com Slack

1. Adicione node **Slack** após o chat
2. Configure para enviar mensagem com `{{ $json.data.response }}`

### Integrar com Google Sheets

1. Adicione node **Google Sheets** após o chat
2. Configure para salvar resultados automaticamente

### Integrar com Banco de Dados

1. Adicione node **PostgreSQL/MySQL** após o chat
2. Salve perguntas e respostas para histórico

### Agendar Tarefas (Cron)

1. Use node **Cron** como trigger
2. Configure para processar arquivos periodicamente

---

## Dicas e Boas Práticas

1. **Tratamento de Erros:**
   - Adicione node **IF** para verificar `success: false`
   - Configure tratamento de erros apropriado

2. **Logging:**
   - Use node **Set** para adicionar timestamps
   - Salve logs em arquivo ou banco

3. **Rate Limiting:**
   - Adicione node **Wait** entre requisições se necessário
   - Configure delays apropriados

4. **Segurança:**
   - Use autenticação nos webhooks
   - Configure CORS apropriadamente no servidor Gemini

---

## Troubleshooting

### Erro: "Connection refused"
- Verifique se o servidor Gemini está rodando em `http://localhost:3000`
- Verifique se a porta está correta

### Erro: "API Key não configurada"
- Configure a API Key no servidor Gemini primeiro
- Acesse a interface de configuração

### Webhook não responde
- Verifique se o workflow está ativo
- Verifique a URL do webhook no n8n
- Teste com cURL primeiro

---

## Próximos Passos

1. Explore outros nodes do n8n
2. Crie workflows mais complexos
3. Integre com outros serviços
4. Automatize processos completos

Para mais informações sobre n8n, visite: https://docs.n8n.io


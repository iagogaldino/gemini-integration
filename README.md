# Gemini Integration - Monorepo

Projeto monorepo para integração com Google Gemini API - Upload de arquivos e busca de informações usando IA.

## 🚀 Início Rápido

### 1. Instalar dependências

```bash
npm run install:all
```

Isso instalará as dependências da raiz, backend e frontend.

### 2. Configurar API Key

Crie um arquivo `.env` na pasta `backend/`:

```env
GEMINI_API_KEY=sua_api_key_aqui
PORT=3000
```

Obtenha sua API Key em: https://makersuite.google.com/app/apikey

### 3. Iniciar em desenvolvimento

```bash
npm run dev
```

Isso iniciará:
- **Backend** na porta **3000** (http://localhost:3000)
- **Frontend** na porta **4200** (http://localhost:4200)

## 📋 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia backend e frontend simultaneamente
- `npm run dev:backend` - Inicia apenas o backend
- `npm run dev:frontend` - Inicia apenas o frontend

### Build
- `npm run build` - Faz build de ambos os projetos
- `npm run build:backend` - Build apenas do backend
- `npm run build:frontend` - Build apenas do frontend

### Produção
- `npm start` - Inicia ambos em modo produção
- `npm run start:backend` - Inicia backend em produção
- `npm run start:frontend` - Inicia frontend em produção

### Limpeza
- `npm run clean` - Limpa builds de ambos
- `npm run clean:backend` - Limpa build do backend
- `npm run clean:frontend` - Limpa build do frontend

## 🔧 Estrutura do Projeto

```
.
├── backend/          # Backend (Node.js + TypeScript + Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── types/
│   └── package.json
├── frontend/         # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
└── package.json      # Scripts do monorepo
```

## 🌐 Portas

- **Backend API**: `http://localhost:3000`
- **Frontend**: `http://localhost:4200`

## 📝 Endpoints da API

### Arquivos
- `GET /api/files` - Listar arquivos
- `POST /api/files/upload` - Upload de arquivo
- `POST /api/files/chat` - Chat com IA sobre os arquivos
- `GET /api/files/info/:fileUri` - Informações de um arquivo
- `DELETE /api/files/:fileUri` - Deletar arquivo
- `POST /api/files/:fileUri/deactivate` - Desativar arquivo
- `POST /api/files/:fileUri/activate` - Reativar arquivo

### Configuração
- `POST /api/config/test-key` - Testar API key
- `GET /api/config/status` - Status da configuração
- `GET /api/config/usage` - Informações de uso

## 🐛 Solução de Problemas

### Frontend não carrega

1. Verifique se não há processos conflitantes na porta 4200:
   ```bash
   netstat -ano | findstr ":4200"
   ```

2. Limpe o cache do navegador (Ctrl+Shift+Delete) ou use modo anônimo

3. Verifique se o React terminou de compilar (pode levar alguns segundos)

### Backend não inicia

1. Verifique se o arquivo `.env` existe em `backend/`
2. Verifique se a porta 3000 está livre
3. Verifique os logs no terminal

### Erro "Cannot GET /"

- Aguarde alguns segundos para o React compilar
- Recarregue a página (F5 ou Ctrl+R)
- Limpe o cache do navegador

## 📚 Documentação Adicional

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)


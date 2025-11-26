# Frontend - Gemini Integration

Interface React para testar a API de integração com Google Gemini.

## 🚀 Como usar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
REACT_APP_API_URL=http://localhost:3000
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npm start
```

O frontend estará disponível em `http://localhost:4200`.

## 📋 Funcionalidades

### 📁 Upload de Arquivos
- Faça upload de arquivos (PDF, TXT, DOCX, imagens, etc.)
- Visualize o status do upload
- Suporte a múltiplos formatos

### 📋 Listagem de Arquivos
- Veja todos os arquivos enviados
- Informações detalhadas de cada arquivo
- Atualização em tempo real

### 💬 Chat com IA
- Faça perguntas sobre os arquivos
- Busca automática em todos os arquivos (sem precisar especificar qual)
- Ou selecione um arquivo específico para perguntar
- Histórico de conversa mantido

## 🎨 Interface

A interface é moderna e responsiva, com:
- Design limpo e intuitivo
- Feedback visual para ações
- Mensagens de erro e sucesso
- Layout adaptável

## 🔧 Estrutura

```
frontend/
├── src/
│   ├── components/      # Componentes React
│   │   ├── FileUpload.tsx
│   │   ├── FileList.tsx
│   │   └── Chat.tsx
│   ├── services/        # Serviços de API
│   │   └── api.ts
│   ├── App.tsx          # Componente principal
│   └── index.tsx        # Entry point
└── package.json
```

## 📝 Notas

- Certifique-se de que o backend está rodando em `http://localhost:3000`
- O frontend se conecta automaticamente à API configurada
- Todos os arquivos são gerenciados pelo backend/Gemini

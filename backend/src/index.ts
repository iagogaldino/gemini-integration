import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GeminiService } from './services/gemini.service';
import { FileStatusService } from './services/file-status.service';
import { FileController } from './controllers/file.controller';
import { ConfigController } from './controllers/config.controller';
import { createFileRoutes } from './routes/file.routes';
import { createConfigRoutes } from './routes/config.routes';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração CORS
const corsOptions = {
  origin: [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173', // Vite default
    'http://localhost:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializa serviços
let geminiApiKey = process.env.GEMINI_API_KEY;
let geminiService: GeminiService | null = null;
let fileController: FileController | null = null;

const initializeServices = (apiKey: string) => {
  try {
    geminiService = new GeminiService(apiKey);
    fileController = new FileController(geminiService);
    process.env.GEMINI_API_KEY = apiKey;
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error);
    return false;
  }
};

if (geminiApiKey) {
  if (initializeServices(geminiApiKey)) {
    console.log('✅ API Key carregada do .env');
  } else {
    console.warn('⚠️ Erro ao inicializar serviço com API key do .env');
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY não encontrada no .env. Configure via interface web.');
}

const configController = new ConfigController();
const fileStatusService = new FileStatusService();

// Exporta serviços para uso global
(global as any).fileStatusService = fileStatusService;

// Exporta funções para uso nos controllers
(global as any).reinitializeServices = initializeServices;
(global as any).getFileController = () => fileController;
(global as any).getGeminiService = () => geminiService;
(global as any).getCurrentModel = () => {
  if (geminiService) {
    return (geminiService as any).currentModelName || 'gemini-2.5-flash';
  }
  return 'gemini-2.5-flash';
};

// Rotas
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando' });
});

// Middleware para verificar se API key está configurada
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const controller = (global as any).getFileController();
  if (!controller) {
    return res.status(503).json({
      success: false,
      error: 'API Key não configurada. Configure em Configurações.',
    });
  }
  next();
};

// Rotas protegidas - só funcionam se API key estiver configurada
if (fileController) {
  app.use('/api/files', createFileRoutes(fileController));
} else {
  app.use('/api/files', checkApiKey, (req, res) => {
    res.status(503).json({
      success: false,
      error: 'API Key não configurada. Configure em Configurações.',
    });
  });
}

app.use('/api/config', createConfigRoutes(configController));

// Tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
  });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 Listar: GET http://localhost:${PORT}/api/files`);
  console.log(`📁 Upload: POST http://localhost:${PORT}/api/files/upload`);
  console.log(`💬 Chat: POST http://localhost:${PORT}/api/files/chat`);
  console.log(`ℹ️  Info: GET http://localhost:${PORT}/api/files/info/:fileUri`);
});

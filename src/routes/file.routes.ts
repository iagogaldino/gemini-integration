import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { upload } from '../middleware/upload.middleware';

export function createFileRoutes(fileController: FileController | null): Router {
  const router = Router();

  // Middleware para obter controller dinamicamente
  const getController = () => {
    return (global as any).getFileController() || fileController;
  };

  // Lista todos os arquivos
  router.get('/', (req, res) => {
    const controller = getController();
    if (!controller) {
      return res.status(503).json({
        success: false,
        error: 'API Key não configurada. Configure em Configurações.',
      });
    }
    controller.listFiles(req, res);
  });

  // Upload de arquivo
  router.post('/upload', upload.single('file'), (req, res) => {
    const controller = getController();
    if (!controller) {
      return res.status(503).json({
        success: false,
        error: 'API Key não configurada. Configure em Configurações.',
      });
    }
    controller.uploadFile(req, res);
  });

  // Chat/busca com arquivo
  router.post('/chat', (req, res) => {
    const controller = getController();
    if (!controller) {
      return res.status(503).json({
        success: false,
        error: 'API Key não configurada. Configure em Configurações.',
      });
    }
    controller.chatWithFile(req, res);
  });

  // Obter informações de um arquivo
  router.get('/info/:fileUri', (req, res) => {
    const controller = getController();
    if (!controller) {
      return res.status(503).json({
        success: false,
        error: 'API Key não configurada. Configure em Configurações.',
      });
    }
    controller.getFileInfo(req, res);
  });

  // Desativar arquivo
  router.post('/:fileUri/deactivate', (req, res) => {
    const controller = getController();
    if (!controller) {
      return res.status(503).json({
        success: false,
        error: 'API Key não configurada. Configure em Configurações.',
      });
    }
    controller.deactivateFile(req, res);
  });

  // Reativar arquivo
  router.post('/:fileUri/activate', (req, res) => {
    const controller = getController();
    if (!controller) {
      return res.status(503).json({
        success: false,
        error: 'API Key não configurada. Configure em Configurações.',
      });
    }
    controller.activateFile(req, res);
  });

  // Deletar arquivo
  router.delete('/:fileUri', (req, res) => {
    const controller = getController();
    if (!controller) {
      return res.status(503).json({
        success: false,
        error: 'API Key não configurada. Configure em Configurações.',
      });
    }
    controller.deleteFile(req, res);
  });

  return router;
}


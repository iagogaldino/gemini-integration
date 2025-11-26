import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';

export function createConfigRoutes(configController: ConfigController): Router {
  const router = Router();

  // Testa API key
  router.post('/test-key', configController.testApiKey);

  // Obtém status da configuração
  router.get('/status', configController.getStatus);

  // Obtém informações de uso e limites
  router.get('/usage', configController.getUsage);

  return router;
}


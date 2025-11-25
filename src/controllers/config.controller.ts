import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class ConfigController {
  /**
   * Testa uma API key do Gemini
   * POST /api/config/test-key
   */
  testApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        res.status(400).json({
          success: false,
          error: 'API key é obrigatória',
        });
        return;
      }

      // Testa a API key tentando criar uma instância e fazer uma chamada simples
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        // Tenta fazer uma chamada simples para validar
        await model.generateContent('test');
        
        // Se chegou aqui, a API key é válida
        // Atualiza a variável de ambiente (em memória)
        process.env.GEMINI_API_KEY = apiKey;
        
        // Reinicializa os serviços com a nova API key
        if ((global as any).reinitializeServices) {
          (global as any).reinitializeServices(apiKey);
        }
        
        res.status(200).json({
          success: true,
          message: 'API key válida e configurada com sucesso',
        });
      } catch (error: any) {
        // Se falhar, a API key é inválida
        res.status(400).json({
          success: false,
          error: 'API key inválida ou sem permissões. Verifique e tente novamente.',
        });
      }
    } catch (error: any) {
      console.error('Erro ao testar API key:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao testar API key',
      });
    }
  };

  /**
   * Obtém o status da configuração atual
   * GET /api/config/status
   */
  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      
      res.status(200).json({
        success: true,
        data: {
          hasApiKey,
          configured: hasApiKey,
        },
      });
    } catch (error: any) {
      console.error('Erro ao obter status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao obter status',
      });
    }
  };

  /**
   * Obtém informações sobre uso e limites do serviço
   * GET /api/config/usage
   */
  getUsage = async (req: Request, res: Response): Promise<void> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        res.status(503).json({
          success: false,
          error: 'API Key não configurada',
        });
        return;
      }

      const geminiService = (global as any).getGeminiService();
      if (!geminiService) {
        res.status(503).json({
          success: false,
          error: 'Serviço não inicializado',
        });
        return;
      }

      // Obtém informações dos arquivos
      let filesInfo = {
        total: 0,
        active: 0,
        processing: 0,
        failed: 0,
        totalSize: 0,
      };

      try {
        const files = await geminiService.listFiles();
        filesInfo.total = files.files.length;
        files.files.forEach((file: any) => {
          if (file.state === 'ACTIVE') filesInfo.active++;
          else if (file.state === 'PROCESSING') filesInfo.processing++;
          else if (file.state === 'FAILED') filesInfo.failed++;
          
          if (file.sizeBytes) {
            filesInfo.totalSize += parseInt(file.sizeBytes) || 0;
          }
        });
      } catch (error) {
        console.warn('Erro ao obter informações dos arquivos:', error);
      }

      // Informações sobre o modelo atual
      const currentModel = (global as any).getCurrentModel?.() || 'gemini-2.5-flash';

      // Limites conhecidos da API (baseado na documentação)
      const limits = {
        // Limites de rate (requests por minuto)
        rateLimit: {
          free: '15 RPM',
          paid: '360 RPM',
          note: 'Limites podem variar por tipo de conta',
        },
        // Limites de tokens
        tokenLimit: {
          input: '1M tokens',
          output: '8K tokens',
          note: 'Limites variam por modelo',
        },
        // Limites de arquivos
        fileLimit: {
          maxSize: '20 MB por arquivo',
          supportedFormats: [
            'PDF', 'TXT', 'DOCX', 'XLSX', 'PPTX',
            'JPEG', 'PNG', 'GIF', 'WEBP'
          ],
        },
        // Limites de armazenamento
        storage: {
          note: 'Arquivos são armazenados no Google Cloud',
          expiration: 'Arquivos podem expirar após período de inatividade',
        },
      };

      // Informações sobre a API key (parcialmente mascarada)
      const apiKeyInfo = {
        configured: true,
        keyPreview: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : null,
      };

      res.status(200).json({
        success: true,
        data: {
          apiKey: apiKeyInfo,
          model: {
            current: currentModel,
            available: [
              'gemini-2.5-flash',
              'gemini-2.0-flash',
              'gemini-pro-latest',
              'gemini-flash-latest',
            ],
          },
          files: filesInfo,
          limits: limits,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Erro ao obter informações de uso:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao obter informações de uso',
      });
    }
  };
}


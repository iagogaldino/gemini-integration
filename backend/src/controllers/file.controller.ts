import { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';

export class FileController {
  private geminiService: GeminiService;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
  }

  /**
   * Upload de arquivo para o Gemini
   * POST /api/files/upload
   */
  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const mimeType = req.file.mimetype;

      const result = await this.geminiService.uploadFile(
        fileBuffer,
        fileName,
        mimeType
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Arquivo enviado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao fazer upload do arquivo',
      });
    }
  };

  /**
   * Busca informações de um arquivo
   * POST /api/files/chat
   * 
   * Se fileUri/fileUris não for fornecido, busca automaticamente em todos os arquivos
   */
  chatWithFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { question, fileUri, fileUris, conversationHistory } = req.body;

      if (!question) {
        res.status(400).json({ error: 'Pergunta é obrigatória' });
        return;
      }

      // Se não houver fileUri nem fileUris, busca em todos os arquivos
      let finalFileUri = fileUri;
      let finalFileUris = fileUris;

      if (!fileUri && (!fileUris || fileUris.length === 0)) {
        // Busca todos os arquivos disponíveis
        const allFiles = await this.geminiService.listFiles();
        if (allFiles.files.length === 0) {
          res.status(400).json({
            error: 'Nenhum arquivo encontrado. Faça upload de arquivos primeiro.',
          });
          return;
        }
        // Filtra apenas arquivos ativos
        const fileStatusService = (global as any).fileStatusService;
        if (fileStatusService) {
          finalFileUris = fileStatusService.filterActive(
            allFiles.files.map((file) => file.id)
          );
        } else {
          finalFileUris = allFiles.files.map((file) => file.id);
        }
        
        if (finalFileUris.length === 0) {
          res.status(400).json({
            error: 'Nenhum arquivo ativo encontrado. Reative arquivos ou faça upload de novos.',
          });
          return;
        }
      } else if (finalFileUris && finalFileUris.length > 0) {
        // Filtra arquivos ativos se fileUris foi fornecido
        const fileStatusService = (global as any).fileStatusService;
        if (fileStatusService) {
          finalFileUris = fileStatusService.filterActive(finalFileUris);
        }
      } else if (finalFileUri) {
        // Verifica se o arquivo específico está ativo
        const fileStatusService = (global as any).fileStatusService;
        if (fileStatusService && !fileStatusService.isActive(finalFileUri)) {
          res.status(400).json({
            error: 'Este arquivo está desativado. Reative-o para usá-lo.',
          });
          return;
        }
      }

      const result = await this.geminiService.chatWithFile({
        question,
        fileUri: finalFileUri,
        fileUris: finalFileUris,
        conversationHistory,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Erro no chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar informações',
      });
    }
  };

  /**
   * Lista todos os arquivos enviados
   * GET /api/files
   */
  listFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const pageSize = req.query.pageSize
        ? parseInt(req.query.pageSize as string)
        : undefined;
      const pageToken = req.query.pageToken as string | undefined;
      const includeInactive = req.query.includeInactive === 'true';

      const result = await this.geminiService.listFiles(pageSize, pageToken);

      // Adiciona informação de status (ativo/inativo) para cada arquivo
      const fileStatusService = (global as any).fileStatusService;
      const filesWithStatus = result.files.map((file) => {
        const isActive = fileStatusService
          ? fileStatusService.isActive(file.id)
          : true;
        const status = fileStatusService?.getStatus(file.id);

        return {
          ...file,
          isActive,
          status: status || { active: true },
        };
      });

      // Filtra arquivos inativos se não incluir
      const filteredFiles = includeInactive
        ? filesWithStatus
        : filesWithStatus.filter((file) => file.isActive);

      res.status(200).json({
        success: true,
        data: {
          files: filteredFiles,
          nextPageToken: result.nextPageToken,
        },
        count: filteredFiles.length,
        total: result.files.length,
        active: filteredFiles.length,
        inactive: result.files.length - filteredFiles.length,
      });
    } catch (error: any) {
      console.error('Erro ao listar arquivos:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao listar arquivos',
      });
    }
  };

  /**
   * Obtém informações de um arquivo
   * GET /api/files/info/:fileUri
   */
  getFileInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileUri } = req.params;

      if (!fileUri) {
        res.status(400).json({ error: 'fileUri é obrigatório' });
        return;
      }

      const fileInfo = await this.geminiService.getFileInfo(fileUri);

      res.status(200).json({
        success: true,
        data: fileInfo,
      });
    } catch (error: any) {
      console.error('Erro ao obter informações do arquivo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao obter informações do arquivo',
      });
    }
  };

  /**
   * Deleta um arquivo
   * DELETE /api/files/:fileUri
   */
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileUri } = req.params;

      if (!fileUri) {
        res.status(400).json({ error: 'fileUri é obrigatório' });
        return;
      }

      await this.geminiService.deleteFile(fileUri);

      // Remove o status do arquivo deletado
      const fileStatusService = (global as any).fileStatusService;
      if (fileStatusService) {
        // O status será removido automaticamente quando o arquivo não existir mais
      }

      res.status(200).json({
        success: true,
        message: 'Arquivo deletado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao deletar arquivo',
      });
    }
  };

  /**
   * Desativa um arquivo (não deleta, apenas marca como inativo)
   * POST /api/files/:fileUri/deactivate
   */
  deactivateFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileUri } = req.params;

      if (!fileUri) {
        res.status(400).json({ error: 'fileUri é obrigatório' });
        return;
      }

      const fileStatusService = (global as any).fileStatusService;
      if (!fileStatusService) {
        res.status(500).json({ error: 'Serviço de status não disponível' });
        return;
      }

      fileStatusService.deactivate(fileUri);

      res.status(200).json({
        success: true,
        message: 'Arquivo desativado com sucesso',
        data: {
          fileUri,
          active: false,
        },
      });
    } catch (error: any) {
      console.error('Erro ao desativar arquivo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao desativar arquivo',
      });
    }
  };

  /**
   * Reativa um arquivo
   * POST /api/files/:fileUri/activate
   */
  activateFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileUri } = req.params;

      if (!fileUri) {
        res.status(400).json({ error: 'fileUri é obrigatório' });
        return;
      }

      const fileStatusService = (global as any).fileStatusService;
      if (!fileStatusService) {
        res.status(500).json({ error: 'Serviço de status não disponível' });
        return;
      }

      fileStatusService.reactivate(fileUri);

      res.status(200).json({
        success: true,
        message: 'Arquivo reativado com sucesso',
        data: {
          fileUri,
          active: true,
        },
      });
    } catch (error: any) {
      console.error('Erro ao reativar arquivo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao reativar arquivo',
      });
    }
  };
}


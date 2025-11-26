import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { FileDataPart, Part } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { UploadFileResponse, ChatRequest, ChatResponse } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private model: any;
  public currentModelName: string = 'gemini-2.5-flash';
  private fallbackModels: string[] = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-pro-latest',
    'gemini-flash-latest',
  ];
  private currentModelIndex: number = 0;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.currentModelName = this.fallbackModels[0];
    this.model = this.genAI.getGenerativeModel({ model: this.currentModelName });
  }

  /**
   * Função auxiliar para retry com backoff exponencial
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Verifica se é um erro que vale a pena tentar novamente
        const isRetryable = 
          error.message?.includes('503') ||
          error.message?.includes('overloaded') ||
          error.message?.includes('Service Unavailable') ||
          error.message?.includes('429') ||
          error.message?.includes('rate limit');

        if (!isRetryable || attempt === maxRetries - 1) {
          throw error;
        }

        // Backoff exponencial: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⚠️ Tentativa ${attempt + 1}/${maxRetries} falhou. Tentando novamente em ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Tenta usar um modelo alternativo
   */
  private getModel(modelName: string) {
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Faz upload de um arquivo para o Gemini
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadFileResponse> {
    let tempFilePath: string | null = null;
    try {
      // Cria arquivo temporário
      const tempDir = os.tmpdir();
      const tempFileName = `gemini-upload-${Date.now()}-${fileName}`;
      tempFilePath = path.join(tempDir, tempFileName);

      // Salva o buffer em arquivo temporário
      fs.writeFileSync(tempFilePath, fileBuffer);

      // Faz upload do arquivo
      const uploadResult = await this.fileManager.uploadFile(tempFilePath, {
        mimeType: mimeType,
        displayName: fileName,
      });

      // Aguarda o processamento do arquivo
      let file = uploadResult.file;
      while (file.state === 'PROCESSING') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        file = await this.fileManager.getFile(file.name);
      }

      if (file.state === 'FAILED') {
        throw new Error('Falha ao processar o arquivo');
      }

      // Extrai apenas o ID do arquivo (última parte do name)
      let fileId = file.name;
      if (fileId.includes('/')) {
        fileId = fileId.split('/').pop() || fileId;
      }

      return {
        fileUri: fileId, // Retorna apenas o ID para uso no chat
        fileName: file.displayName || fileName,
        mimeType: file.mimeType || mimeType,
        size: parseInt(file.sizeBytes) || undefined,
      };
    } catch (error: any) {
      throw new Error(`Erro ao fazer upload do arquivo: ${error.message}`);
    } finally {
      // Remove arquivo temporário
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (err) {
          console.error('Erro ao remover arquivo temporário:', err);
        }
      }
    }
  }

  /**
   * Busca informações de um arquivo usando chat
   * Se nenhum fileUri for fornecido, busca em todos os arquivos disponíveis
   */
  async chatWithFile(request: ChatRequest): Promise<ChatResponse> {
    try {
      const parts: Part[] = [];
      const fileIdsUsed: string[] = [];

      // Adiciona arquivos ao contexto se fornecidos
      if (request.fileUri) {
        // Extrai o ID do arquivo do URI completo se necessário
        let fileId = request.fileUri;
        if (fileId.includes('/files/')) {
          fileId = fileId.split('/files/')[1];
        }
        
        // Obtém informações do arquivo para pegar o mimeType
        try {
          const fileInfo = await this.fileManager.getFile(fileId);
          const filePart: FileDataPart = {
            fileData: {
              fileUri: fileInfo.uri || fileId,
              mimeType: fileInfo.mimeType,
            },
          };
          parts.push(filePart);
          fileIdsUsed.push(fileId);
        } catch (err) {
          // Se não conseguir obter info, tenta com o URI fornecido
          const filePart: FileDataPart = {
            fileData: {
              fileUri: fileId,
              mimeType: 'text/plain', // fallback
            },
          };
          parts.push(filePart);
          fileIdsUsed.push(fileId);
        }
      } else if (request.fileUris && request.fileUris.length > 0) {
        for (const uri of request.fileUris) {
          let fileId = uri;
          if (fileId.includes('/files/')) {
            fileId = fileId.split('/files/')[1];
          }
          
          try {
            const fileInfo = await this.fileManager.getFile(fileId);
            const filePart: FileDataPart = {
              fileData: {
                fileUri: fileInfo.uri || fileId,
                mimeType: fileInfo.mimeType,
              },
            };
            parts.push(filePart);
            fileIdsUsed.push(fileId);
          } catch (err) {
            const filePart: FileDataPart = {
              fileData: {
                fileUri: fileId,
                mimeType: 'text/plain', // fallback
              },
            };
            parts.push(filePart);
            fileIdsUsed.push(fileId);
          }
        }
      } else {
        // Se nenhum arquivo foi especificado, busca em todos os arquivos disponíveis
        try {
          const allFiles = await this.listFiles();
          if (allFiles.files.length > 0) {
            // Filtra apenas arquivos ativos
            const fileStatusService = (global as any).fileStatusService;
            const activeFiles = fileStatusService
              ? fileStatusService.filterActive(allFiles.files.map((f) => f.id))
              : allFiles.files.map((f) => f.id);

            // Adiciona apenas arquivos ativos
            for (const file of allFiles.files) {
              if (activeFiles.includes(file.id)) {
                try {
                  const fileInfo = await this.fileManager.getFile(file.id);
                  const filePart: FileDataPart = {
                    fileData: {
                      fileUri: fileInfo.uri || file.id,
                      mimeType: fileInfo.mimeType,
                    },
                  };
                  parts.push(filePart);
                  fileIdsUsed.push(file.id);
                } catch (err) {
                  console.warn(`Erro ao obter info do arquivo ${file.id}:`, err);
                }
              }
            }
          }
        } catch (err) {
          console.warn('Erro ao buscar todos os arquivos:', err);
        }
      }

      // Adiciona a pergunta do usuário
      parts.push({ text: request.question });

      // Tenta com retry e fallback de modelos
      let text: string | undefined;
      const useChat = !!(request.conversationHistory && request.conversationHistory.length > 0);

      // Função para executar a geração de conteúdo com retry e fallback
      const executeGeneration = async (modelToUse: any, useChatMode: boolean) => {
        if (useChatMode) {
          const chat = modelToUse.startChat({
            history: request.conversationHistory!.map((msg) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.parts }],
            })),
          });
          const result = await chat.sendMessage(parts);
          return result.response.text();
        } else {
          const result = await modelToUse.generateContent(parts);
          return result.response.text();
        }
      };
      
      try {
        // Primeira tentativa com retry no modelo atual
        text = await this.retryWithBackoff(
          () => executeGeneration(this.model, useChat),
          3,
          1000
        );
      } catch (error: any) {
        // Se falhar, tenta modelos alternativos
        const isOverloaded = 
          error.message?.includes('503') ||
          error.message?.includes('overloaded') ||
          error.message?.includes('Service Unavailable');

        if (isOverloaded) {
          console.log('⚠️ Modelo sobrecarregado, tentando modelos alternativos...');
          
          let lastError = error;
          for (let i = 1; i < this.fallbackModels.length; i++) {
            try {
              const alternativeModel = this.getModel(this.fallbackModels[i]);
              console.log(`🔄 Tentando modelo alternativo: ${this.fallbackModels[i]}`);
              
              text = await this.retryWithBackoff(
                () => executeGeneration(alternativeModel, useChat),
                2,
                2000
              );
              
              // Se funcionou, atualiza o modelo padrão
              this.currentModelIndex = i;
              this.currentModelName = this.fallbackModels[i];
              this.model = alternativeModel;
              console.log(`✅ Modelo alternativo funcionou: ${this.fallbackModels[i]}`);
              break;
            } catch (altError: any) {
              lastError = altError;
              console.log(`❌ Modelo ${this.fallbackModels[i]} também falhou`);
            }
          }
          
          if (!text) {
            throw new Error(
              `Todos os modelos estão sobrecarregados ou indisponíveis. ` +
              `Por favor, tente novamente em alguns instantes. ` +
              `Erro original: ${lastError.message}`
            );
          }
        } else {
          throw error;
        }
      }

      if (!text) {
        throw new Error('Não foi possível gerar uma resposta');
      }

      return {
        response: text,
        fileUri: request.fileUri || request.fileUris?.[0] || fileIdsUsed[0],
        fileUrisUsed: fileIdsUsed.length > 0 ? fileIdsUsed : undefined,
      };
    } catch (error: any) {
      // Mensagens de erro mais amigáveis
      if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        throw new Error(
          'O serviço do Gemini está temporariamente sobrecarregado. ' +
          'Por favor, tente novamente em alguns instantes. ' +
          'Estamos tentando modelos alternativos automaticamente.'
        );
      }
      throw new Error(`Erro ao buscar informações: ${error.message}`);
    }
  }

  /**
   * Lista todos os arquivos enviados
   */
  async listFiles(pageSize?: number, pageToken?: string) {
    try {
      const listParams: any = {};
      if (pageSize) {
        listParams.pageSize = pageSize;
      }
      if (pageToken) {
        listParams.pageToken = pageToken;
      }

      const result = await this.fileManager.listFiles(listParams);
      
      // Formata os arquivos para retornar apenas o ID
      const files = result.files.map((file) => {
        let fileId = file.name;
        if (fileId.includes('/')) {
          fileId = fileId.split('/').pop() || fileId;
        }
        
        return {
          id: fileId,
          displayName: file.displayName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          state: file.state,
          createTime: file.createTime,
          updateTime: file.updateTime,
          uri: file.uri,
        };
      });

      return {
        files,
        nextPageToken: result.nextPageToken,
      };
    } catch (error: any) {
      throw new Error(`Erro ao listar arquivos: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um arquivo pelo URI
   */
  async getFileInfo(fileUri: string) {
    try {
      const file = await this.fileManager.getFile(fileUri);
      return {
        name: file.name,
        displayName: file.displayName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        state: file.state,
        createTime: file.createTime,
        updateTime: file.updateTime,
      };
    } catch (error: any) {
      throw new Error(`Erro ao obter informações do arquivo: ${error.message}`);
    }
  }

  /**
   * Deleta um arquivo do Gemini
   */
  async deleteFile(fileUri: string): Promise<void> {
    try {
      // Extrai o ID do arquivo do URI completo se necessário
      let fileId = fileUri;
      if (fileId.includes('/files/')) {
        fileId = fileId.split('/files/')[1];
      }
      if (fileId.includes('/')) {
        fileId = fileId.split('/').pop() || fileId;
      }

      await this.fileManager.deleteFile(fileId);
    } catch (error: any) {
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  }
}


import * as fs from 'fs';
import * as path from 'path';

interface FileStatus {
  fileId: string;
  active: boolean;
  deactivatedAt?: string;
  reactivatedAt?: string;
}

export class FileStatusService {
  private statusFile: string;
  private statuses: Map<string, FileStatus> = new Map();

  constructor() {
    // Arquivo para persistir status (opcional - pode usar memória apenas)
    this.statusFile = path.join(process.cwd(), 'file-statuses.json');
    this.loadStatuses();
  }

  /**
   * Carrega status dos arquivos do arquivo (se existir)
   */
  private loadStatuses() {
    try {
      if (fs.existsSync(this.statusFile)) {
        const data = fs.readFileSync(this.statusFile, 'utf-8');
        const statuses: FileStatus[] = JSON.parse(data);
        statuses.forEach((status) => {
          this.statuses.set(status.fileId, status);
        });
      }
    } catch (error) {
      console.warn('Erro ao carregar status dos arquivos:', error);
    }
  }

  /**
   * Salva status dos arquivos no arquivo
   */
  private saveStatuses() {
    try {
      const statuses = Array.from(this.statuses.values());
      fs.writeFileSync(this.statusFile, JSON.stringify(statuses, null, 2));
    } catch (error) {
      console.warn('Erro ao salvar status dos arquivos:', error);
    }
  }

  /**
   * Verifica se um arquivo está ativo
   */
  isActive(fileId: string): boolean {
    const status = this.statuses.get(fileId);
    // Se não há registro, assume que está ativo
    return status ? status.active : true;
  }

  /**
   * Desativa um arquivo
   */
  deactivate(fileId: string): void {
    const status: FileStatus = {
      fileId,
      active: false,
      deactivatedAt: new Date().toISOString(),
    };
    this.statuses.set(fileId, status);
    this.saveStatuses();
  }

  /**
   * Reativa um arquivo
   */
  reactivate(fileId: string): void {
    const status: FileStatus = {
      fileId,
      active: true,
      reactivatedAt: new Date().toISOString(),
    };
    this.statuses.set(fileId, status);
    this.saveStatuses();
  }

  /**
   * Obtém o status de um arquivo
   */
  getStatus(fileId: string): FileStatus | null {
    return this.statuses.get(fileId) || null;
  }

  /**
   * Filtra arquivos ativos
   */
  filterActive(fileIds: string[]): string[] {
    return fileIds.filter((id) => this.isActive(id));
  }
}


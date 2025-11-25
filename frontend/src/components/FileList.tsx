import React, { useEffect, useState } from 'react';
import { api, FileInfo, ListFilesResponse } from '../services/api';
import './FileList.css';

interface FileListProps {
  refreshTrigger: number;
}

const FileList: React.FC<FileListProps> = ({ refreshTrigger }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: ListFilesResponse = await api.listFiles(undefined, undefined, showInactive);
      setFiles(result.data.files);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger, showInactive]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o arquivo "${fileName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(fileId);
    try {
      await api.deleteFile(fileId);
      // Remove o arquivo da lista localmente
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch (err: any) {
      alert(`Erro ao deletar arquivo: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (fileId: string, isActive: boolean) => {
    setToggling(fileId);
    try {
      if (isActive) {
        await api.deactivateFile(fileId);
      } else {
        await api.activateFile(fileId);
      }
      // Atualiza o status localmente
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId
            ? {
                ...file,
                isActive: !isActive,
                status: {
                  active: !isActive,
                  ...(file.status || {}),
                  ...(!isActive
                    ? { reactivatedAt: new Date().toISOString() }
                    : { deactivatedAt: new Date().toISOString() }),
                },
              }
            : file
        )
      );
    } catch (err: any) {
      alert(`Erro ao ${isActive ? 'desativar' : 'reativar'} arquivo: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="file-list">
        <h2>📋 Arquivos Enviados</h2>
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list">
        <h2>📋 Arquivos Enviados</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h2>📋 Arquivos Enviados</h2>
        <div className="header-actions">
          <label className="toggle-inactive">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <span>Mostrar inativos</span>
          </label>
          <button onClick={loadFiles} className="refresh-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>
      {files.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum arquivo enviado ainda.</p>
          <p>Faça upload de um arquivo para começar!</p>
        </div>
      ) : (
        <div className="files-grid">
          {files.map((file) => (
            <div key={file.id} className="file-card">
              <div className="file-icon">
                {file.mimeType.includes('pdf') ? '📄' :
                 file.mimeType.includes('image') ? '🖼️' :
                 file.mimeType.includes('word') ? '📝' :
                 file.mimeType.includes('excel') ? '📊' :
                 file.mimeType.includes('powerpoint') ? '📊' : '📄'}
              </div>
              <div className="file-info">
                <div className="file-header-row">
                  <h3>
                    {file.displayName || 'Sem nome'}
                    {file.isActive === false && (
                      <span className="inactive-badge">🔒 Inativo</span>
                    )}
                  </h3>
                  <div className="file-actions">
                    <button
                      onClick={() => handleToggleActive(file.id, file.isActive !== false)}
                      disabled={toggling === file.id || deleting === file.id}
                      className={`toggle-btn ${file.isActive === false ? 'activate' : 'deactivate'}`}
                      title={file.isActive === false ? 'Reativar arquivo' : 'Desativar arquivo'}
                    >
                      {toggling === file.id
                        ? '⏳'
                        : file.isActive === false
                        ? '✅'
                        : '🔒'}
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, file.displayName || 'arquivo')}
                      disabled={deleting === file.id || toggling === file.id}
                      className="delete-btn"
                      title="Deletar arquivo"
                    >
                      {deleting === file.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
                <p className="file-meta">
                  <span>📦 {formatSize(file.sizeBytes)}</span>
                  <span>📅 {formatDate(file.createTime)}</span>
                </p>
                <p className="file-state">
                  Estado: <span className={`state ${file.state.toLowerCase()}`}>{file.state}</span>
                </p>
                <p className="file-id">ID: {file.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;


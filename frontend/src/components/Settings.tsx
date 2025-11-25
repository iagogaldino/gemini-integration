import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Settings.css';

interface UsageInfo {
  apiKey: {
    configured: boolean;
    keyPreview: string | null;
  };
  model: {
    current: string;
    available: string[];
  };
  files: {
    total: number;
    active: number;
    processing: number;
    failed: number;
    totalSize: number;
  };
  limits: {
    rateLimit: {
      free: string;
      paid: string;
      note: string;
    };
    tokenLimit: {
      input: string;
      output: string;
      note: string;
    };
    fileLimit: {
      maxSize: string;
      supportedFormats: string[];
    };
    storage: {
      note: string;
      expiration: string;
    };
  };
  timestamp: string;
}

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    checkApiKeyStatus();
    loadUsageInfo();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      await api.listFiles();
      setCurrentStatus('valid');
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('403')) {
        setCurrentStatus('invalid');
      } else {
        setCurrentStatus('unknown');
      }
    }
  };

  const loadUsageInfo = async () => {
    setLoadingUsage(true);
    try {
      const result = await api.getUsage();
      if (result.success) {
        setUsageInfo(result.data);
        setCurrentStatus('valid');
      }
    } catch (error: any) {
      console.error('Erro ao carregar informações de uso:', error);
      if (error.message?.includes('API Key não configurada')) {
        setCurrentStatus('invalid');
      }
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage('Por favor, insira uma API key');
      setStatus('error');
      return;
    }

    setStatus('testing');
    setMessage('Testando API key...');

    try {
      const response = await fetch('http://localhost:3000/api/config/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('✅ API key válida! A configuração foi salva.');
        setCurrentStatus('valid');
        setApiKey('');
        // Recarrega as informações
        await loadUsageInfo();
        // Recarrega a página após 2 segundos para aplicar a nova API key
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'API key inválida. Verifique e tente novamente.');
        setCurrentStatus('invalid');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('Erro ao testar API key: ' + (error.message || 'Erro desconhecido'));
      setCurrentStatus('invalid');
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'valid':
        return <span className="status-badge valid">✓ Configurada</span>;
      case 'invalid':
        return <span className="status-badge invalid">✗ Inválida</span>;
      default:
        return <span className="status-badge unknown">? Desconhecido</span>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="settings">
      <h2>⚙️ Configurações</h2>

      <div className="settings-section">
        <div className="section-header">
          <h3>API Key do Gemini</h3>
          {getStatusBadge()}
        </div>

        <div className="settings-content">
          <p className="settings-description">
            Configure sua API key do Google Gemini para usar o sistema.
            Você pode obter uma API key em:{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="api-key-link"
            >
              Google AI Studio
            </a>
          </p>

          <div className="api-key-input-group">
            <label htmlFor="api-key-input">API Key</label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Insira sua API key do Gemini"
              className="api-key-input"
              disabled={status === 'testing'}
            />
            <button
              onClick={handleTestApiKey}
              disabled={status === 'testing' || !apiKey.trim()}
              className="test-btn"
            >
              {status === 'testing' ? '⏳ Testando...' : '🧪 Testar e Salvar'}
            </button>
          </div>

          {message && (
            <div className={`settings-message ${status}`}>
              {message}
            </div>
          )}

          <div className="settings-info">
            <h4>ℹ️ Informações</h4>
            <ul>
              <li>A API key é salva no servidor e aplicada imediatamente</li>
              <li>Você pode testar a API key antes de salvar</li>
              <li>A API key é necessária para todas as funcionalidades do sistema</li>
              <li>Mantenha sua API key segura e não a compartilhe</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Informações de Uso */}
      <div className="settings-section">
        <div className="section-header">
          <h3>📊 Uso e Estatísticas</h3>
          <button onClick={loadUsageInfo} className="refresh-btn" disabled={loadingUsage}>
            {loadingUsage ? '⏳' : '🔄'}
          </button>
        </div>

        <div className="settings-content">
          {loadingUsage ? (
            <div className="loading-state">Carregando informações...</div>
          ) : usageInfo ? (
            <>
              {/* Modelo Atual */}
              <div className="info-card">
                <h4>🤖 Modelo em Uso</h4>
                <div className="info-item">
                  <span className="info-label">Modelo Atual:</span>
                  <span className="info-value highlight">{usageInfo.model.current}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Modelos Disponíveis:</span>
                  <div className="tags-list">
                    {usageInfo.model.available.map((model) => (
                      <span
                        key={model}
                        className={`tag ${model === usageInfo.model.current ? 'active' : ''}`}
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estatísticas de Arquivos */}
              <div className="info-card">
                <h4>📁 Arquivos Armazenados</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{usageInfo.files.total}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-item success">
                    <span className="stat-value">{usageInfo.files.active}</span>
                    <span className="stat-label">Ativos</span>
                  </div>
                  <div className="stat-item warning">
                    <span className="stat-value">{usageInfo.files.processing}</span>
                    <span className="stat-label">Processando</span>
                  </div>
                  <div className="stat-item error">
                    <span className="stat-value">{usageInfo.files.failed}</span>
                    <span className="stat-label">Falhados</span>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Tamanho Total:</span>
                  <span className="info-value">{formatBytes(usageInfo.files.totalSize)}</span>
                </div>
              </div>

              {/* Limites */}
              <div className="info-card">
                <h4>⚡ Limites e Quotas</h4>
                <div className="limits-grid">
                  <div className="limit-item">
                    <span className="limit-label">Rate Limit (Free):</span>
                    <span className="limit-value">{usageInfo.limits.rateLimit.free}</span>
                  </div>
                  <div className="limit-item">
                    <span className="limit-label">Rate Limit (Paid):</span>
                    <span className="limit-value">{usageInfo.limits.rateLimit.paid}</span>
                  </div>
                  <div className="limit-item">
                    <span className="limit-label">Tokens (Input):</span>
                    <span className="limit-value">{usageInfo.limits.tokenLimit.input}</span>
                  </div>
                  <div className="limit-item">
                    <span className="limit-label">Tokens (Output):</span>
                    <span className="limit-value">{usageInfo.limits.tokenLimit.output}</span>
                  </div>
                  <div className="limit-item">
                    <span className="limit-label">Tamanho Máx. Arquivo:</span>
                    <span className="limit-value">{usageInfo.limits.fileLimit.maxSize}</span>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Formatos Suportados:</span>
                  <div className="tags-list">
                    {usageInfo.limits.fileLimit.supportedFormats.map((format) => (
                      <span key={format} className="tag">{format}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* API Key Info */}
              {usageInfo.apiKey.keyPreview && (
                <div className="info-card">
                  <h4>🔑 API Key</h4>
                  <div className="info-item">
                    <span className="info-label">Preview:</span>
                    <span className="info-value monospace">{usageInfo.apiKey.keyPreview}</span>
                  </div>
                </div>
              )}

              <div className="last-updated">
                Última atualização: {new Date(usageInfo.timestamp).toLocaleString('pt-BR')}
              </div>
            </>
          ) : (
            <div className="error-state">
              Não foi possível carregar as informações de uso.
              {currentStatus === 'invalid' && (
                <p>Configure uma API key válida para ver as estatísticas.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="settings-section">
        <div className="section-header">
          <h3>Status do Sistema</h3>
        </div>

        <div className="settings-content">
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Backend:</span>
              <span className="status-value success">✓ Online</span>
            </div>
            <div className="status-item">
              <span className="status-label">API Key:</span>
              <span className={`status-value ${currentStatus === 'valid' ? 'success' : currentStatus === 'invalid' ? 'error' : 'warning'}`}>
                {currentStatus === 'valid' ? '✓ Válida' : currentStatus === 'invalid' ? '✗ Inválida' : '? Desconhecido'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

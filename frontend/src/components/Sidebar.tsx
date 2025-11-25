import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'upload', label: 'Upload', icon: '📁' },
    { id: 'files', label: 'Arquivos', icon: '📋' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🚀 Gemini</h1>
        <p className="sidebar-subtitle">Integration</p>
      </div>
      
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="footer-text">Gemini Integration</p>
        <p className="footer-version">v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;


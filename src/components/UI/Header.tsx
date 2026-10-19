import React from "react";

interface HeaderProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath = '/', onNavigate }) => {
  const isTest = currentPath === '/test' || currentPath.startsWith('/test');

  const handleNav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-title">Hose Pipe Viewer</span>
      </div>
      <nav className="header-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-tab ${!isTest ? 'active' : ''}`}
          onClick={handleNav('/')}
        >
          <span className="nav-tab-icon">⚙️</span>
          Configurator
        </button>
        <button
          type="button"
          className={`nav-tab ${isTest ? 'active' : ''}`}
          onClick={handleNav('/test')}
        >
          <span className="nav-tab-icon">🧪</span>
          Model Tester
        </button>
      </nav>
    </header>
  );
};

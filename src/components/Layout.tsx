import React from 'react';
import { Link, useLocation } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Historial Autos · Agencia</h1>
        <nav>
          <Link
            to="/vehicles"
            className={`app-nav-link ${isActive('/vehicles') ? 'active' : ''}`}
          >
            <span className="icon">🚗</span>
            Autos
          </Link>
          <Link
            to="/quotes"
            className={`app-nav-link ${isActive('/quotes') ? 'active' : ''}`}
          >
            <span className="icon">📄</span>
            Presupuestos
          </Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};

export default Layout;

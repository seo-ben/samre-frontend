import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--gray-light)' }}>
      <Sidebar />
      {/* Le Sidebar rend son propre spacer, donc pas besoin de marginLeft */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main className="main-content" style={{ flex: 1, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

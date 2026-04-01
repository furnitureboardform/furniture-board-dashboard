import { useState } from 'react';
import { FinishForm } from './components/FinishForm';
import { HandleForm } from './components/HandleForm';
import { FinishList } from './components/FinishList';
import { HandleList } from './components/HandleList';
import type { ActiveTab } from './lib/types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('finishes');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">Furniture Dashboard</h1>
          <nav className="tabs">
            <button
              className={`tab ${activeTab === 'finishes' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('finishes')}
            >
              Okleiny
            </button>
            <button
              className={`tab ${activeTab === 'handles' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('handles')}
            >
              Uchwyty
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="layout">
          <aside className="sidebar">
            {activeTab === 'finishes' ? (
              <FinishForm onSaved={handleSaved} />
            ) : (
              <HandleForm onSaved={handleSaved} />
            )}
          </aside>

          <section className="content">
            {activeTab === 'finishes' ? (
              <FinishList refreshKey={refreshKey} />
            ) : (
              <HandleList refreshKey={refreshKey} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

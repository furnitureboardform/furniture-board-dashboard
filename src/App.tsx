import { useState } from 'react';
import { FinishForm } from './components/FinishForm';
import { HandleForm } from './components/HandleForm';
import { HdfForm } from './components/HdfForm';
import { FinishList } from './components/FinishList';
import { HandleList } from './components/HandleList';
import { HdfList } from './components/HdfList';
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
            <button
              className={`tab ${activeTab === 'hdf' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('hdf')}
            >
              Płyty HDF
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="layout">
          <aside className="sidebar">
            {activeTab === 'finishes' && <FinishForm onSaved={handleSaved} />}
            {activeTab === 'handles' && <HandleForm onSaved={handleSaved} />}
            {activeTab === 'hdf' && <HdfForm onSaved={handleSaved} />}
          </aside>

          <section className="content">
            {activeTab === 'finishes' && <FinishList refreshKey={refreshKey} />}
            {activeTab === 'handles' && <HandleList refreshKey={refreshKey} />}
            {activeTab === 'hdf' && <HdfList refreshKey={refreshKey} />}
          </section>
        </div>
      </main>
    </div>
  );
}

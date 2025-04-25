// src/App.js
import React from 'react';
import { MarketDataProvider } from './contexts/MarketDataContext';
import RealtimeMarketPage from './pages/RealtimeMarketPage';

function App() {
  return (
    <MarketDataProvider>
      <div className="App">
        <header className="App-header">
          <h1>증권 트레이딩 시스템</h1>
        </header>
        <main>
          <RealtimeMarketPage />
        </main>
      </div>
    </MarketDataProvider>
  );
}

export default App;

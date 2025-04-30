// src/pages/RealtimeMarketPage.jsx
import React from 'react';
import RealtimeStockViewer from '../components/realtime/RealtimeStockViewer';
import { useMarketData } from '../contexts/MarketDataContext';

const RealtimeMarketPage = () => {
  const { isConnected } = useMarketData();

  return (
    <div className="realtime-market-page">
      <RealtimeStockViewer />
    </div>
  );
};

export default RealtimeMarketPage;

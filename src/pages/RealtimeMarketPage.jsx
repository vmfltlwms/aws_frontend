// src/pages/RealtimeMarketPage.jsx
import React from 'react';
import RealtimeStockViewer from '../components/realtime/RealtimeStockViewer';
import { useMarketData } from '../contexts/MarketDataContext';

const RealtimeMarketPage = () => {
  const { isConnected } = useMarketData();

  return (
    <div className="realtime-market-page">
      <h2>실시간 시장 데이터</h2>
      <div className="connection-status">
        서버 연결 상태:{' '}
        <span className={isConnected ? 'connected' : 'disconnected'}>
          {isConnected ? '연결됨' : '연결 중...'}
        </span>
      </div>

      <RealtimeStockViewer />
    </div>
  );
};

export default RealtimeMarketPage;

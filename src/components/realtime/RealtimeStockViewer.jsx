// src/components/realtime/RealtimeStockViewer.jsx
import React, { useState } from 'react';
import { useMarketData } from '../../contexts/MarketDataContext';

const RealtimeStockViewer = () => {
  const [stockCode, setStockCode] = useState('');
  const { state, isConnected, subscribe, unsubscribe } = useMarketData();
  const stockList = Object.keys(state.stockData || {});

  const handleAddStock = () => {
    if (!stockCode || stockCode.trim() === '') return;

    // 종목코드 형식 검증 (6자리 숫자)
    const codePattern = /^\d{6}$/;
    if (!codePattern.test(stockCode)) {
      alert('종목코드는 6자리 숫자여야 합니다.');
      return;
    }

    // 실시간 시세 구독
    subscribe('1', [stockCode], ['0D'], false);
    setStockCode('');
  };

  const handleRemoveStock = (code) => {
    // 실시간 시세 구독 해제
    unsubscribe('1', [code]);
  };

  const handleUnsubscribeAll = () => {
    // 그룹 전체 구독 해제
    unsubscribe('1');
  };

  // 주가 변동에 따른 CSS 클래스 반환
  const getPriceClass = (change) => {
    if (!change) return '';
    return parseFloat(change) > 0
      ? 'price-up'
      : parseFloat(change) < 0
      ? 'price-down'
      : '';
  };

  return (
    <div className="realtime-stock-viewer">
      <div className="stock-input-container">
        <input
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
          placeholder="종목코드 6자리 입력"
          maxLength={6}
        />
        <button onClick={handleAddStock} disabled={!isConnected}>
          종목 추가
        </button>
        <button
          onClick={handleUnsubscribeAll}
          disabled={!isConnected || stockList.length === 0}
        >
          전체 해제
        </button>
      </div>

      <div className="stock-list-container">
        <h3>실시간 시세 ({stockList.length})</h3>
        {stockList.length === 0 ? (
          <p className="no-data-message">등록된 종목이 없습니다.</p>
        ) : (
          <table className="stock-table">
            <thead>
              <tr>
                <th>종목코드</th>
                <th>현재가</th>
                <th>전일대비</th>
                <th>등락률(%)</th>
                <th>거래량</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {stockList.map((code) => {
                const stockData = state.stockData[code];
                return (
                  <tr key={code}>
                    <td>{code}</td>
                    <td className={getPriceClass(stockData?.change)}>
                      {stockData?.price?.toLocaleString() || '-'}
                    </td>
                    <td className={getPriceClass(stockData?.change)}>
                      {stockData?.change
                        ? stockData.change.toLocaleString()
                        : '-'}
                    </td>
                    <td className={getPriceClass(stockData?.change)}>
                      {stockData?.change_ratio
                        ? stockData.change_ratio.toFixed(2)
                        : '-'}
                    </td>
                    <td>
                      {stockData?.volume
                        ? stockData.volume.toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveStock(code)}
                        className="remove-btn"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .realtime-stock-viewer {
          margin: 20px 0;
        }

        .stock-input-container {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }

        .stock-input-container input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          flex: 1;
          max-width: 150px;
        }

        .stock-input-container button {
          padding: 8px 16px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .stock-input-container button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .stock-list-container {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 16px;
          background-color: #f9f9f9;
        }

        .stock-table {
          width: 100%;
          border-collapse: collapse;
        }

        .stock-table th,
        .stock-table td {
          padding: 12px 8px;
          text-align: right;
          border-bottom: 1px solid #e0e0e0;
        }

        .stock-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        .stock-table th:first-child,
        .stock-table td:first-child {
          text-align: center;
        }

        .stock-table th:last-child,
        .stock-table td:last-child {
          text-align: center;
        }

        .price-up {
          color: #d60000;
        }

        .price-down {
          color: #0051c7;
        }

        .remove-btn {
          background-color: #ff4d4f;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
        }

        .no-data-message {
          text-align: center;
          padding: 20px;
          color: #888;
        }
      `}</style>
    </div>
  );
};

export default RealtimeStockViewer;

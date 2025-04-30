// src/components/realtime/RealtimeStockTable.jsx
import React from 'react';

const RealtimeStockTable = ({ stocksWithData, state, getPriceClass }) => {
  return (
    <div className="stock-list-container">
      <h3>실시간 시세 ({stocksWithData.length})</h3>

      {stocksWithData.length === 0 ? (
        <p className="no-data-message">
          등록된 종목이 없거나 데이터가 수신되지 않았습니다.
        </p>
      ) : (
        <table className="stock-table">
          <thead>
            <tr>
              <th>종목코드</th>
              <th>현재가</th>
              <th>전일대비</th>
              <th>등락률(%)</th>
              <th>거래량</th>
            </tr>
          </thead>
          <tbody>
            {stocksWithData.map((code) => {
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RealtimeStockTable;

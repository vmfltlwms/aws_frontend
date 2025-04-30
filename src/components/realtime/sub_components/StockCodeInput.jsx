// src/components/realtime/StockCodeInput.jsx
import React from 'react';

const StockCodeInput = ({ stockCode, setStockCode }) => {
  return (
    <div className="control-panel">
      <div className="control-group">
        <label>종목 코드:</label>
        <input
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
          placeholder="종목코드 6자리"
          maxLength={6}
        />
      </div>
    </div>
  );
};

export default StockCodeInput;

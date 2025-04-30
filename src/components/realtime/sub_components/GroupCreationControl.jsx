// src/components/realtime/GroupCreationControl.jsx
import React from 'react';
import { DATA_TYPES } from '../../../constants/marketDataTypes';

const GroupCreationControl = ({
  selectedType,
  setSelectedType,
  handleCreateGroup,
  isConnected,
}) => {
  return (
    <div className="control-panel group-creation">
      <div className="control-group">
        <label>데이터 타입:</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="data-type-select"
        >
          {DATA_TYPES.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name} ({type.code})
            </option>
          ))}
        </select>
        <button
          onClick={handleCreateGroup}
          disabled={!isConnected}
          className="btn-add"
        >
          그룹 생성
        </button>
      </div>
    </div>
  );
};

export default GroupCreationControl;

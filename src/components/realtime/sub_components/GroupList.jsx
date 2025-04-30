// src/components/realtime/GroupList.jsx
import React from 'react';
import { getTypeName } from '../../../constants/marketDataTypes';

const GroupList = ({
  groups,
  stockCode,
  isConnected,
  handleAddStock,
  handleDeleteGroup,
  handleRemoveStock,
}) => {
  return (
    <div className="groups-container">
      {groups.length === 0 ? (
        <p className="no-data-message">
          생성된 그룹이 없습니다. 먼저 그룹을 생성해주세요.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.id} className="group-panel">
            <div className="group-header">
              <h3>
                그룹 {group.id} - {getTypeName(group.type)} ({group.type})
              </h3>
              <div className="group-actions">
                <button
                  onClick={() => handleAddStock(group.id)}
                  disabled={!stockCode || !isConnected}
                  className="btn-add-small"
                >
                  종목 추가
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="btn-delete-small"
                >
                  그룹 삭제
                </button>
              </div>
            </div>

            <div className="group-items">
              {group.items.length === 0 ? (
                <p className="no-data-message">등록된 종목이 없습니다.</p>
              ) : (
                <div className="item-chips">
                  {group.items.map((item) => (
                    <div key={item} className="item-chip">
                      <span className="item-code">{item}</span>
                      <button
                        onClick={() => handleRemoveStock(group.id, item)}
                        className="btn-remove-item"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GroupList;

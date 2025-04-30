import React from 'react';

const ConnectionStatus = ({ isConnected }) => {
  return (
    <div className="connection-status">
      서버 연결 상태:{' '}
      <span className={isConnected ? 'connected' : 'disconnected'}>
        {isConnected ? '--연결됨' : '--연결 중...'}
      </span>
    </div>
  );
};

export default ConnectionStatus;

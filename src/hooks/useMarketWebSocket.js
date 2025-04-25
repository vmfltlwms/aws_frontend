// src/hooks/useMarketWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useMarketWebSocket = (
  baseUrl = 'ws://localhost:8000/api/realtime/ws/market'
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const wsRef = useRef(null);

  // 연결 설정
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(baseUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        // 자동 재연결 로직
        setTimeout(connect, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      wsRef.current = ws;
    };

    connect();

    // 정리 함수
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [baseUrl]);

  // 실시간 시세 구독
  const subscribePrice = useCallback(
    (groupNo, items, dataTypes = ['0D'], refresh = true) => {
      if (!isConnected || !wsRef.current) return;

      const subscribeMessage = {
        action: 'subscribe_price',
        group_no: groupNo,
        items: items,
        data_types: dataTypes,
        refresh: refresh,
      };

      wsRef.current.send(JSON.stringify(subscribeMessage));

      // 로컬 상태 업데이트
      setSubscriptions((prev) => ({
        ...prev,
        [groupNo]: {
          items: refresh
            ? [...items]
            : [...(prev[groupNo]?.items || []), ...items],
          dataTypes: refresh
            ? [...dataTypes]
            : [...(prev[groupNo]?.dataTypes || []), ...dataTypes],
        },
      }));
    },
    [isConnected]
  );

  // 실시간 시세 구독 해제
  const unsubscribePrice = useCallback(
    (groupNo, items = null, dataTypes = null) => {
      if (!isConnected || !wsRef.current) return;

      const unsubscribeMessage = {
        action: 'unsubscribe_price',
        group_no: groupNo,
        items: items,
        data_types: dataTypes,
      };

      wsRef.current.send(JSON.stringify(unsubscribeMessage));

      // 로컬 상태 업데이트
      setSubscriptions((prev) => {
        const newState = { ...prev };

        if (!items) {
          // 그룹 전체 삭제
          delete newState[groupNo];
        } else {
          // 특정 아이템만 삭제
          if (newState[groupNo]) {
            if (!dataTypes) {
              // 해당 종목의 모든 타입 삭제
              newState[groupNo].items = newState[groupNo].items.filter(
                (item) => !items.includes(item)
              );
            } else {
              // 해당 타입만 삭제 (현재 구현에서는 모든 종목에 대해 해당 타입 삭제)
              newState[groupNo].dataTypes = newState[groupNo].dataTypes.filter(
                (type) => !dataTypes.includes(type)
              );
            }

            // 비어있는 그룹 삭제
            if (
              newState[groupNo].items.length === 0 ||
              newState[groupNo].dataTypes.length === 0
            ) {
              delete newState[groupNo];
            }
          }
        }

        return newState;
      });
    },
    [isConnected]
  );

  return {
    isConnected,
    messages,
    subscriptions,
    subscribePrice,
    unsubscribePrice,
  };
};

export default useMarketWebSocket;

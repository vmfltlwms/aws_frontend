// src/hooks/useMarketWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useMarketWebSocket = (
  // 백엔드가 3000 포트에서 실행 중인 경우
  baseUrl = 'ws://localhost:3000/api/realtime/ws/market'
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // 연결 설정
  useEffect(() => {
    let reconnectTimeout = null;

    // 지연 시간을 두고 초기 연결 시도
    const initialConnectTimeout = setTimeout(() => {
      connect();
    }, 1000); // 1초 지연

    // 연결 함수
    const connect = () => {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.CONNECTING ||
          wsRef.current.readyState === WebSocket.OPEN)
      ) {
        console.log('WebSocket already connecting or connected');
        return;
      }

      try {
        console.log('Connecting to WebSocket:', baseUrl);
        const ws = new WebSocket(baseUrl);
        wsRef.current = ws;

        // 바이너리 데이터 처리 설정
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          console.log('WebSocket connected by kim');
        };

        ws.onclose = (event) => {
          setIsConnected(false);
          console.log(
            `WebSocket disconnected: code=${event.code}, reason=${event.reason}`
          );

          // 정상 종료가 아닌 경우에만 재연결 시도
          if (event.code !== 1000) {
            const shouldReconnect =
              reconnectAttemptsRef.current < maxReconnectAttempts;
            if (shouldReconnect) {
              reconnectAttemptsRef.current += 1;
              const delay = Math.min(
                1000 * Math.pow(2, reconnectAttemptsRef.current),
                30000
              );
              console.log(
                `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms...`
              );
              reconnectTimeout = setTimeout(connect, delay);
            } else {
              console.error(
                'Max reconnect attempts reached. Please refresh the page.'
              );
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onmessage = (event) => {
          try {
            console.log('원시 WebSocket 메시지 수신:', event.data);

            // 문자열 데이터 처리
            if (typeof event.data === 'string') {
              const data = JSON.parse(event.data);
              console.log('파싱된 WebSocket 메시지:', data);
              setMessages((prev) => [...prev, data]);
            }
            // 바이너리 데이터 처리
            else if (event.data instanceof ArrayBuffer) {
              console.log('바이너리 WebSocket 메시지 수신:', event.data);
              // 바이너리 데이터 처리 로직이 필요한 경우 여기에 구현
            }
          } catch (error) {
            console.error('WebSocket 메시지 파싱 오류:', error);
          }
        };
      } catch (error) {
        console.error('WebSocket connection creation error:', error);
        // 연결 시도 실패 시에도 재연결 로직 적용
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        reconnectTimeout = setTimeout(connect, delay);
      }
    };

    // 정리 함수
    return () => {
      if (initialConnectTimeout) {
        clearTimeout(initialConnectTimeout);
      }

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      if (wsRef.current) {
        // 1000은 정상 종료 코드입니다
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [baseUrl]);

  // 실시간 시세 구독 (useCallback 사용)
  const subscribePrice = useCallback(
    (groupNo, items = ['000660'], dataTypes = ['0D'], refresh = true) => {
      if (!isConnected || !wsRef.current) {
        console.error('Cannot subscribe: WebSocket not connected');
        return;
      }

      const subscribeMessage = {
        action: 'subscribe_price',
        group_no: groupNo,
        items: items,
        data_types: dataTypes,
        refresh: refresh,
      };

      try {
        wsRef.current.send(JSON.stringify(subscribeMessage));
        console.log(
          `Subscribed to price data: group=${groupNo}, items=${items.join(
            ','
          )}, types=${dataTypes.join(',')}`
        );

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
      } catch (error) {
        console.error('Error sending subscription message:', error);
      }
    },
    [isConnected]
  );

  // 실시간 시세 구독 해제 (useCallback 사용)
  const unsubscribePrice = useCallback(
    (groupNo, items = null, dataTypes = null) => {
      if (!isConnected || !wsRef.current) {
        console.error('Cannot unsubscribe: WebSocket not connected');
        return;
      }

      const unsubscribeMessage = {
        action: 'unsubscribe_price',
        group_no: groupNo,
        items: items,
        data_types: dataTypes,
      };

      try {
        wsRef.current.send(JSON.stringify(unsubscribeMessage));
        console.log(
          `Unsubscribed from price data: group=${groupNo}${
            items ? ', items=' + items.join(',') : ''
          }`
        );

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
                // 해당 타입만 삭제
                newState[groupNo].dataTypes = newState[
                  groupNo
                ].dataTypes.filter((type) => !dataTypes.includes(type));
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
      } catch (error) {
        console.error('Error sending unsubscription message:', error);
      }
    },
    [isConnected]
  );

  // 주식 조회 요청 (차트 데이터 등)
  const requestStockData = useCallback(
    (action, params = {}) => {
      if (!isConnected || !wsRef.current) {
        console.error('Cannot request data: WebSocket not connected');
        return;
      }

      const requestMessage = {
        action,
        ...params,
      };

      try {
        wsRef.current.send(JSON.stringify(requestMessage));
        console.log(`Requested ${action} with params:`, params);
      } catch (error) {
        console.error(`Error sending ${action} request:`, error);
      }
    },
    [isConnected]
  );

  return {
    isConnected,
    messages,
    subscriptions,
    subscribePrice,
    unsubscribePrice,
    requestStockData,
  };
};

export default useMarketWebSocket;

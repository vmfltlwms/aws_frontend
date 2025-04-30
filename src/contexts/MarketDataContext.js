// src/contexts/MarketDataContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import useMarketWebSocket from '../hooks/useMarketWebSocket';

// 초기 상태
const initialState = {
  groups: {},
  stockData: {},
};

// 리듀서 함수
function marketDataReducer(state, action) {
  switch (action.type) {
    case 'SUBSCRIBE_GROUP':
      console.log('SUBSCRIBE_GROUP 액션:', action.payload);
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.payload.groupNo]: {
            items: action.payload.refresh
              ? [...action.payload.items]
              : [
                  ...(state.groups[action.payload.groupNo]?.items || []),
                  ...action.payload.items,
                ],
            dataTypes: action.payload.refresh
              ? [...action.payload.dataTypes]
              : [
                  ...(state.groups[action.payload.groupNo]?.dataTypes || []),
                  ...action.payload.dataTypes,
                ],
          },
        },
      };

    case 'UNSUBSCRIBE_GROUP':
      console.log('UNSUBSCRIBE_GROUP 액션:', action.payload);
      const { groupNo, items, dataTypes } = action.payload;
      const newGroups = { ...state.groups };

      if (!items) {
        // 그룹 전체 삭제
        delete newGroups[groupNo];
      } else {
        if (newGroups[groupNo]) {
          // 특정 항목만 삭제
          if (!dataTypes) {
            newGroups[groupNo].items = newGroups[groupNo].items.filter(
              (item) => !items.includes(item)
            );
          } else {
            newGroups[groupNo].dataTypes = newGroups[groupNo].dataTypes.filter(
              (type) => !dataTypes.includes(type)
            );
          }

          // 비어있는 그룹 삭제
          if (
            newGroups[groupNo].items.length === 0 ||
            newGroups[groupNo].dataTypes.length === 0
          ) {
            delete newGroups[groupNo];
          }
        }
      }

      return {
        ...state,
        groups: newGroups,
      };

    case 'UPDATE_STOCK_DATA':
      console.log('UPDATE_STOCK_DATA 액션:', action.payload);
      return {
        ...state,
        stockData: {
          ...state.stockData,
          [action.payload.code]: action.payload.data,
        },
      };

    default:
      return state;
  }
}

// Context 생성
const MarketDataContext = createContext();

// Provider 컴포넌트
export function MarketDataProvider({ children }) {
  const [state, dispatch] = useReducer(marketDataReducer, initialState);
  const { isConnected, messages, subscribePrice, unsubscribePrice } =
    useMarketWebSocket();

  // 실시간 데이터 수신 시 상태 업데이트
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    console.log('서버에서 메시지 수신:', lastMessage);

    // 메시지 형식 분석 및 처리
    try {
      // 실시간 가격 데이터 처리
      if (lastMessage.type === 'realtime_price') {
        dispatch({
          type: 'UPDATE_STOCK_DATA',
          payload: {
            code: lastMessage.item,
            data: lastMessage.data,
          },
        });
      }
      // 다른 형식의 메시지에서 주식 데이터 추출 시도
      else if (
        lastMessage.action === 'subscribe_price' &&
        lastMessage.status === 'success'
      ) {
        console.log('구독 성공 응답:', lastMessage);
        // 구독 성공 처리 (필요시)
      }
      // 키움 API 특유의 메시지 형식 처리
      else if (lastMessage.trnm === 'RECV') {
        const stockCode = lastMessage.item;
        const typeCode = lastMessage.typ;
        const values = lastMessage.values || {};

        // 데이터 타입에 따른 처리
        if (typeCode === '0D') {
          // 현재가 정보
          // 필요한 필드 추출 (필드명은 키움 API 문서 참조)
          const price = parseFloat(values['81'] || 0); // 현재가
          const change = parseFloat(values['86'] || 0); // 전일대비
          const changeRatio = parseFloat(values['25'] || 0); // 등락율
          const volume = parseInt(values['13'] || 0); // 거래량

          console.log(`종목 ${stockCode} 데이터 수신:`, {
            price,
            change,
            changeRatio,
            volume,
          });

          dispatch({
            type: 'UPDATE_STOCK_DATA',
            payload: {
              code: stockCode,
              data: {
                price,
                change,
                change_ratio: changeRatio,
                volume,
                timestamp: Date.now(),
              },
            },
          });
        }
      }
    } catch (error) {
      console.error('메시지 처리 중 오류:', error);
    }
  }, [messages]);

  // 구독 메서드
  const subscribe = (groupNo, items, dataTypes = ['0D'], refresh = false) => {
    console.log(
      `구독 요청: 그룹=${groupNo}, 종목=${items.join(
        ','
      )}, 타입=${dataTypes.join(',')}, 새로고침=${refresh}`
    );

    // 서버에 구독 요청 전송
    subscribePrice(groupNo, items, dataTypes, refresh);

    // 로컬 상태 업데이트
    dispatch({
      type: 'SUBSCRIBE_GROUP',
      payload: { groupNo, items, dataTypes, refresh },
    });
  };

  // 구독 해제 메서드
  const unsubscribe = (groupNo, items = null, dataTypes = null) => {
    console.log(
      `구독 해제 요청: 그룹=${groupNo}, 종목=${
        items ? items.join(',') : '전체'
      }`
    );

    // 서버에 구독 해제 요청 전송
    unsubscribePrice(groupNo, items, dataTypes);

    // 로컬 상태 업데이트
    dispatch({
      type: 'UNSUBSCRIBE_GROUP',
      payload: { groupNo, items, dataTypes },
    });
  };

  // 연결 상태 변화 로깅
  useEffect(() => {
    console.log(
      `WebSocket 연결 상태 변경: ${isConnected ? '연결됨' : '연결 끊김'}`
    );
  }, [isConnected]);

  return (
    <MarketDataContext.Provider
      value={{
        state,
        isConnected,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
}

// Hook 생성
export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
}

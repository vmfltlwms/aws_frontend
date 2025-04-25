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
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'realtime_price') {
      dispatch({
        type: 'UPDATE_STOCK_DATA',
        payload: {
          code: lastMessage.item,
          data: lastMessage.data,
        },
      });
    }
  }, [messages]);

  // 구독 메서드
  const subscribe = (groupNo, items, dataTypes = ['0D'], refresh = false) => {
    subscribePrice(groupNo, items, dataTypes, refresh);
    dispatch({
      type: 'SUBSCRIBE_GROUP',
      payload: { groupNo, items, dataTypes, refresh },
    });
  };

  // 구독 해제 메서드
  const unsubscribe = (groupNo, items = null, dataTypes = null) => {
    unsubscribePrice(groupNo, items, dataTypes);
    dispatch({
      type: 'UNSUBSCRIBE_GROUP',
      payload: { groupNo, items, dataTypes },
    });
  };

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

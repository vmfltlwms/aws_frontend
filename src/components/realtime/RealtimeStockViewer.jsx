// src/components/realtime/RealtimeStockViewer.jsx
import React, { useState, useEffect } from 'react';
import './RealtimeStockViewer.css'; // CSS 파일 임포트
import { useMarketData } from '../../contexts/MarketDataContext';
import { DATA_TYPES, getTypeName } from '../../constants/marketDataTypes';
import GroupList from './sub_components/GroupList';
import StockCodeInput from './sub_components/StockCodeInput';
import ConnectionStatus from './sub_components/ConnectionStatus';
import RealtimeStockTable from './sub_components/RealtimeStockTable';
import GroupCreationControl from './sub_components/GroupCreationControl';

const RealtimeStockViewer = () => {
  const { state, isConnected, subscribe, unsubscribe } = useMarketData();
  const [stockCode, setStockCode] = useState('');
  const [selectedType, setSelectedType] = useState(DATA_TYPES[5].code); // 기본값: 주식호가잔량
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [nextGroupId, setNextGroupId] = useState(1);

  // 전체 등록된 종목 목록 (데이터가 있는 종목)
  const stocksWithData = Object.keys(state.stockData || {});

  // 상태가 변경될 때마다 그룹 목록 업데이트
  useEffect(() => {
    const groupsFromState = Object.keys(state.groups || {}).map((groupNo) => {
      return {
        id: groupNo,
        type: state.groups[groupNo].dataTypes[0], // 각 그룹은 1개의 타입만 가짐
        items: state.groups[groupNo].items,
      };
    });

    setGroups(groupsFromState);

    // 기존 그룹이 있으면 다음 그룹 ID 계산
    if (groupsFromState.length > 0) {
      const maxGroupId = Math.max(
        ...groupsFromState.map((g) => parseInt(g.id))
      );
      setNextGroupId(maxGroupId + 1);
    }
  }, [state.groups]);

  // 연결 상태 변화 감지
  useEffect(() => {
    if (isConnected) {
      console.log('WebSocket 연결됨 - 실시간 데이터 수신 가능');
    } else {
      console.log('WebSocket 연결 끊김 - 실시간 데이터 수신 불가');
    }
  }, [isConnected]);

  // 그룹 생성 핸들러
  const handleCreateGroup = () => {
    setError(null);

    if (!isConnected) {
      setError('서버에 연결되어 있지 않습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 같은 타입의 그룹이 이미 존재하는지 확인
    const existingGroup = groups.find((g) => g.type === selectedType);
    if (existingGroup) {
      setError(
        `이미 같은 타입(${getTypeName(selectedType)})의 그룹이 존재합니다.`
      );
      return;
    }

    try {
      const groupId = nextGroupId.toString();
      console.log(`그룹 생성: ID=${groupId}, 타입=${selectedType}`);

      // 실시간 시세 구독 (빈 items 배열로 시작)
      subscribe(groupId, [], [selectedType], true);

      // 다음 그룹 ID 업데이트
      setNextGroupId((prev) => prev + 1);

      console.log(`그룹 생성 완료: ID=${groupId}, 타입=${selectedType}`);
    } catch (err) {
      console.error('그룹 생성 중 오류 발생:', err);
      setError(`그룹 생성 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 종목 추가 핸들러
  const handleAddStock = (groupId) => {
    setError(null);

    if (!stockCode || stockCode.trim() === '') {
      setError('종목코드를 입력해주세요.');
      return;
    }

    // 종목코드 형식 검증 (6자리 숫자)
    const codePattern = /^\d{6}$/;
    if (!codePattern.test(stockCode)) {
      setError('종목코드는 6자리 숫자여야 합니다.');
      return;
    }

    // 이미 그룹에 추가된 종목인지 확인
    const group = groups.find((g) => g.id === groupId);
    if (group && group.items.includes(stockCode)) {
      setError(`이미 그룹 ${groupId}에 추가된 종목입니다.`);
      return;
    }

    if (!isConnected) {
      setError('서버에 연결되어 있지 않습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      console.log(`그룹 ${groupId}에 종목 추가 시도: ${stockCode}`);

      // 그룹의 기존 데이터 타입 가져오기
      const dataTypes = state.groups[groupId]?.dataTypes || [];
      if (dataTypes.length === 0) {
        setError(`그룹 ${groupId}에 데이터 타입이 없습니다.`);
        return;
      }

      // 실시간 시세 구독 (false: 기존 등록 유지, 추가만 함)
      subscribe(groupId, [stockCode], dataTypes, false);

      console.log(`종목 추가 요청 완료: ${stockCode}`);
      setStockCode('');
    } catch (err) {
      console.error('종목 추가 중 오류 발생:', err);
      setError(`종목 추가 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 종목 제거 핸들러
  const handleRemoveStock = (groupId, code) => {
    try {
      console.log(`그룹 ${groupId}에서 종목 제거 시도: ${code}`);

      // 실시간 시세 구독 해제
      unsubscribe(groupId, [code]);

      console.log(`종목 제거 완료: ${code}`);
    } catch (err) {
      console.error('종목 제거 중 오류 발생:', err);
      setError(`종목 제거 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 그룹 삭제 핸들러
  const handleDeleteGroup = (groupId) => {
    try {
      console.log(`그룹 ${groupId} 삭제 시도`);

      // 그룹 전체 구독 해제
      unsubscribe(groupId);

      console.log(`그룹 삭제 완료: ${groupId}`);
    } catch (err) {
      console.error('그룹 삭제 중 오류 발생:', err);
      setError(`그룹 삭제 중 오류가 발생했습니다: ${err.message}`);
    }
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
      <ConnectionStatus isConnected={isConnected} />
      {/* 에러 메시지 표시 */}
      {error && <div className="error-message">{error}</div>}

      {/* 그룹 생성 컨트롤 */}
      <GroupCreationControl
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        handleCreateGroup={handleCreateGroup}
        isConnected={isConnected}
      />

      {/* 종목 추가 컨트롤 */}
      <StockCodeInput stockCode={stockCode} setStockCode={setStockCode} />

      {/* 그룹 목록 */}
      <GroupList
        groups={groups}
        stockCode={stockCode}
        isConnected={isConnected}
        handleAddStock={handleAddStock}
        handleDeleteGroup={handleDeleteGroup}
        handleRemoveStock={handleRemoveStock}
      />

      {/* 실시간 데이터 표시 */}
      <RealtimeStockTable
        stocksWithData={stocksWithData}
        state={state}
        getPriceClass={getPriceClass}
      />
    </div>
  );
};

export default RealtimeStockViewer;

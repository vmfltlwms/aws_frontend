// src/constants/marketDataTypes.js

export const DATA_TYPES = [
  { code: '00', name: '주문체결' },
  { code: '04', name: '잔고' },
  { code: '0A', name: '주식기세' },
  { code: '0B', name: '주식체결' },
  { code: '0C', name: '주식우선호가' },
  { code: '0D', name: '주식호가잔량' },
  { code: '0E', name: '주식시간외호가' },
  { code: '0F', name: '주식당일거래원' },
  { code: '0G', name: 'ETF NAV' },
  { code: '0H', name: '주식예상체결' },
  { code: '0J', name: '업종지수' },
  { code: '0U', name: '업종등락' },
  { code: '0g', name: '주식종목정보' },
  { code: '0m', name: 'ELW 이론가' },
  { code: '0s', name: '장시작시간' },
  { code: '0u', name: 'ELW 지표' },
  { code: '0w', name: '종목프로그램매매' },
  { code: '1h', name: 'VI발동/해제' },
];

// 데이터 타입 이름 가져오기 유틸리티 함수
export const getTypeName = (typeCode) => {
  const foundType = DATA_TYPES.find((type) => type.code === typeCode);
  return foundType ? foundType.name : typeCode;
};

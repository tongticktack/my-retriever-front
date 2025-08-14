// src/components/map/LostItemMap.tsx

'use client';

import { Map } from 'react-kakao-maps-sdk';

interface LostItemMapProps {
  children: React.ReactNode;
  onMapClick: () => void; // 지도의 빈 공간을 클릭했을 때 실행될 함수
}

const MapViewer = ({ children, onMapClick }: LostItemMapProps) => {
  return (
    // 부모 flex 컨테이너의 공간을 채우기 위한 div 래퍼
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }}
        style={{ width: '100%', height: '100%' }}
        level={9}
        onClick={onMapClick} // 지도를 클릭하면 prop으로 받은 함수를 실행
      >
        {children}
      </Map>
    </div>
  );
};

export default MapViewer;

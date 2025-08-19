// src/components/map/MapViewer.tsx

'use client';

import { Map } from 'react-kakao-maps-sdk';

interface LostItemMapProps {
  children: React.ReactNode;
  onMapClick: () => void;
  onCreate: (map: kakao.maps.Map) => void; // 👈 [추가] 지도 인스턴스를 전달할 콜백 함수
}

const MapViewer = ({ children, onMapClick, onCreate }: LostItemMapProps) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }}
        style={{ width: '100%', height: '100%' }}
        level={9}
        onClick={onMapClick}
        onCreate={onCreate} // 👈 [추가] Map이 생성될 때 onCreate 함수를 호출합니다.
      >
        {children}
      </Map>
    </div>
  );
};

export default MapViewer;

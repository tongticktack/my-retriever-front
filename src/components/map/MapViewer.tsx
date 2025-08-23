'use client';

import { Map } from 'react-kakao-maps-sdk';

interface LostItemMapProps {
  children: React.ReactNode;
  onMapClick: () => void;
  onCreate: (map: kakao.maps.Map) => void;
}

const MapViewer = ({ children, onMapClick, onCreate }: LostItemMapProps) => {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }}
        style={{ width: '100%', height: '100%' }}
        level={9}
        onClick={onMapClick}
        onCreate={onCreate}
      >
        {children}
      </Map>
    </div>
  );
};

export default MapViewer;

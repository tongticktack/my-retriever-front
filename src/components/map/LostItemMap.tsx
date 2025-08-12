'use client';

import React, { useEffect, useState } from 'react';
import { Map, MapMarker, MarkerClusterer, MapInfoWindow } from 'react-kakao-maps-sdk';

// 분실물 데이터 타입 정의
interface LostItem {
  id: number;
  name: string;
  photo: string;
  lat: number;
  lng: number;
}

// 백엔드 API에서 받아왔다고 가정하는 예시 데이터
const lostItemData: LostItem[] = [
    { id: 1, name: "갈색 가죽 지갑", photo: "https://picsum.photos/id/237/150/100", lat: 37.5665, lng: 126.9780 },
    { id: 2, name: "검은색 에어팟 프로", photo: "https://picsum.photos/id/1/150/100", lat: 37.5659, lng: 126.9778 },
    { id: 3, name: "학생증", photo: "https://picsum.photos/id/10/150/100", lat: 37.5668, lng: 126.9782 },
    { id: 4, name: "파란색 우산", photo: "https://picsum.photos/id/40/150/100", lat: 37.4979, lng: 127.0276 }, // 강남역 근처
    { id: 5, name: "아이폰 14", photo: "https://picsum.photos/id/50/150/100", lat: 37.4981, lng: 127.0272 },   // 강남역 근처
    { id: 6, name: "자동차 키", photo: "https://picsum.photos/id/60/150/100", lat: 37.4985, lng: 127.0278 },   // 강남역 근처
];


const LostItemMap = () => {
  // 분실물 데이터를 저장할 state
  const [items, setItems] = useState<LostItem[]>([]);
  // 클릭된 마커의 정보를 저장할 state. null이면 정보창을 띄우지 않음.
  const [selectedMarker, setSelectedMarker] = useState<LostItem | null>(null);

  useEffect(() => {
    // 실제로는 이 부분에서 fetch, axios 등으로 API를 호출하여 데이터를 받아옵니다.
    setItems(lostItemData);
  }, []);

  return (
    <Map
      center={{ lat: 37.5665, lng: 126.9780 }}
      style={{ width: '100%', height: '100%' }}
      level={8}
      // 지도를 클릭하면 선택된 마커를 null로 설정하여 정보창을 닫습니다.
      onClick={() => setSelectedMarker(null)}
    >
      <MarkerClusterer averageCenter={true} minLevel={6}>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <MapMarker
              position={{ lat: item.lat, lng: item.lng }}
              // 마커를 클릭하면 selectedMarker state를 현재 item으로 변경
              onClick={() => setSelectedMarker(item)}
            />
            {/* selectedMarker와 현재 마커(item)가 일치할 때만 정보창을 보여줍니다. */}
            {selectedMarker && selectedMarker.id === item.id && (
              <MapInfoWindow position={{ lat: item.lat, lng: item.lng }}>
                <div style={{ padding: '10px', width: '160px', boxSizing: 'border-box' }}>
                  <img src={item.photo} alt={item.name} style={{ width: '100%', height: 'auto', borderRadius: '5px' }} />
                  <p style={{ marginTop: '8px', textAlign: 'center', fontWeight: 'bold' }}>{item.name}</p>
                </div>
              </MapInfoWindow>
            )}
          </React.Fragment>
        ))}
      </MarkerClusterer>
    </Map>
  );
};

export default LostItemMap;
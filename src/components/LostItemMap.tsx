// components/map/LostItemMap.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Map, MapMarker, MarkerClusterer, MapInfoWindow } from 'react-kakao-maps-sdk';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface LostItem {
  id: string;
  category: string;
  foundDate: string;
  photo: string;
  name: string;
  lat: number;
  lng: number;
  storagePlace: string;
}

const LostItemMap = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<LostItem | null>(null);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "PoliceLostItem"));
        console.log("Firestore 문서 개수:", querySnapshot.docs.length);
        const itemsData = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>): LostItem | null => {
          const data = doc.data();
          
          if (!data.location?.latitude || !data.location?.longitude || !data.foundDate) {
            console.warn(`ID가 ${doc.id}인 문서에 필수 필드가 없어 건너뜁니다.`);
            return null;
          }
          
          const date = data.foundDate.toDate();
          const formattedDate = date.toLocaleDateString("ko-KR", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return {
            id: doc.id,
            category: data.category,
            foundDate: formattedDate,
            photo: data.imageURL,
            name: data.itemName,
            lat: data.location.latitude,
            lng: data.location.longitude,
            storagePlace: data.storagePlace,
          };
        }).filter(Boolean) as LostItem[]; // null 항목 제거 및 타입 단언

        setItems(itemsData);
      } catch (error) {
        console.error("데이터 수집 실패:", error);
      }
    };

    fetchLostItems();
  }, []);

  return (
    // 부모 flex 컨테이너의 공간을 채우기 위한 div 래퍼
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }}
        style={{ width: '100%', height: '100%' }}
        level={9}
        onClick={() => setSelectedMarker(null)}
      >
        <MarkerClusterer averageCenter={true} minLevel={7}>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <MapMarker
                position={{ lat: item.lat, lng: item.lng }}
                onClick={() => setSelectedMarker(item)}
              />
              {selectedMarker && selectedMarker.id === item.id && (
                <MapInfoWindow position={{ lat: item.lat, lng: item.lng }}>
                  <div style={{ padding: '10px', width: '220px', lineHeight: '1.5' }}>
                    <img src={item.photo} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '5px' }} />
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.name}</p>
                      <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{item.category}</p>
                      <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                        <strong>습득 날짜:</strong> {item.foundDate}
                      </p>
                    </div>
                  </div>
                </MapInfoWindow>
              )}
            </React.Fragment>
          ))}
        </MarkerClusterer>
      </Map>
    </div>
  );
};

export default LostItemMap;
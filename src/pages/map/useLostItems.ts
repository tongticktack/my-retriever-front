// src/pages/map/useLostItems.ts

import { useState, useEffect } from 'react';
// import { db } from '@/lib/firebase'; // Firestore는 사용하지 않으므로 주석 처리
// import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { LostItem } from './types';

export const useLostItems = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore에서 데이터를 가져오는 대신, 테스트용 데이터를 생성합니다.
    const createMockData = () => {
      const mockItems: LostItem[] = [];
      const baseLat = 37.5665; // 서울 시청 위도
      const baseLng = 126.9780; // 서울 시청 경도

      for (let i = 0; i < 100; i++) {
        mockItems.push({
          id: `mock_${i}`,
          name: `테스트 아이템 ${i + 1}`,
          category: '기타',
          photo: 'https://placehold.co/220x120?text=No+Image',
          foundDate: '2025-08-15',
          storagePlace: '테스트 보관소',
          // 기본 위치 주변에 무작위로 마커를 생성합니다.
          lat: baseLat + (Math.random() - 0.5) * 0.02,
          lng: baseLng + (Math.random() - 0.5) * 0.02,
        });
      }
      
      console.log("생성된 테스트용 마커 데이터:", mockItems);
      setItems(mockItems);
      setLoading(false);
    };

    createMockData();

    // 원래의 Firestore 데이터 로딩 로직은 잠시 주석 처리합니다.
    /*
    const fetchLostItems = async () => {
      // ... (기존 Firestore 코드) ...
    };
    fetchLostItems();
    */
  }, []);

  return { items, loading };
};

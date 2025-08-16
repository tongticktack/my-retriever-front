// src/pages/map/useLostItems.ts

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { LostItem } from './types';

// 모듈 스코프에 캐시 변수를 만듭니다.
// 이 변수는 앱이 새로고침 되기 전까지 데이터를 메모리에 유지합니다.
let cachedItems: LostItem[] | null = null;

export const useLostItems = () => {
  // 초기 상태를 캐시된 데이터로 우선 설정합니다.
  const [items, setItems] = useState<LostItem[]>(cachedItems || []);
  const [loading, setLoading] = useState(!cachedItems); // 캐시가 없으면 로딩 상태로 시작합니다.

  useEffect(() => {
    const getItems = async () => {
      // 만약 캐시에 데이터가 이미 있다면, 네트워크 요청 없이 즉시 함수를 종료합니다.
      if (cachedItems) {
        return;
      }

      // 캐시에 데이터가 없으면 Firestore에서 데이터를 가져옵니다.
      try {
        const querySnapshot = await getDocs(collection(db, "testPortalLostItem2"));
        
        const itemsData = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>): LostItem | null => {
          const data = doc.data();
          if (!data.location?.latitude || !data.location?.longitude) {
            return null;
          }
          return {
            id: doc.id,
            category: data.itemCategory,
            foundDate: data.foundDate,
            photo: data.imageURL,
            name: data.itemName,
            lat: data.location.latitude,
            lng: data.location.longitude,
            storagePlace: data.storagePlace,
          };
        }).filter(Boolean) as LostItem[];

        cachedItems = itemsData; // 가져온 데이터를 캐시에 저장합니다.
        setItems(itemsData);
      } catch (error) {
        console.error("Firestore 데이터 수집 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    getItems();
  }, []); // 의존성 배열이 비어있어 컴포넌트가 처음 마운트될 때 한 번만 실행됩니다.

  return { items, loading };
};

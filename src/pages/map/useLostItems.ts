// src/pages/map/useLostItems.ts

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { LostItem } from './types'; // 같은 폴더의 타입을 가져옵니다.

export const useLostItems = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "PortalLostItem"));
        
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

        console.log("마커로 변환될 최종 데이터 (items):", itemsData);
        setItems(itemsData);
      } catch (error) {
        console.error("데이터 수집 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  return { items, loading };
};

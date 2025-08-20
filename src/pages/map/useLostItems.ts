// src/pages/map/useLostItems.ts

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { LostItem } from './types';

let cachedData: {
  portal: LostItem[] | null;
  police: LostItem[] | null;
} = {
  portal: null,
  police: null,
};

const fetchAndMapItems = async (collectionName: string): Promise<LostItem[]> => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>): LostItem | null => {
    const data = doc.data();
    if (!data.location?.latitude || !data.location?.longitude) {
      return null;
    }
    return {
      id: doc.id,
      category: data.itemCategory,
      foundDate: data.foundDate,
      photo: data.imageUrl,
      name: data.itemName,
      lat: data.location.latitude,
      lng: data.location.longitude,
      storagePlace: data.storagePlace,
    };
  }).filter(Boolean) as LostItem[];
};

export const useLostItems = () => {
  const [portalItems, setPortalItems] = useState<LostItem[]>(cachedData.portal || []);
  const [policeItems, setPoliceItems] = useState<LostItem[]>(cachedData.police || []);
  const [loading, setLoading] = useState(!cachedData.portal || !cachedData.police);

  useEffect(() => {
    const getItems = async () => {
      if (cachedData.portal && cachedData.police) {
        return;
      }

      try {
        const [portalData, policeData] = await Promise.all([
          fetchAndMapItems("PortalLostItem"),
          fetchAndMapItems("PoliceLostItem")
        ]);

        console.log("Portal 데이터 개수:", portalData.length);
        console.log("Police 데이터 개수:", policeData.length);
        cachedData.portal = portalData;
        cachedData.police = policeData;

        setPortalItems(portalData);
        setPoliceItems(policeData);

      } catch (error) {
        console.error("Firestore 데이터 수집 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    getItems();
  }, []);

  const allItems = useMemo(() => [...portalItems, ...policeItems], [portalItems, policeItems]);

  // 지도 페이지에서는 portalItems를 items라는 이름으로 사용하고,
  // 다른 곳에서는 allItems 등을 사용할 수 있도록 모든 데이터를 반환합니다.
  return { items: portalItems, portalItems, policeItems, allItems, loading };
};

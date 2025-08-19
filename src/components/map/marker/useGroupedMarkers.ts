// src/components/map/marker/useGroupedMarkers.ts

import { useMemo } from 'react';
import type { LostItem, RepresentativeMarker } from '@/pages/map/types';

export const useGroupedMarkers = (items: LostItem[]): RepresentativeMarker[] => {
  const representativeMarkers = useMemo((): RepresentativeMarker[] => {
    // 아이템이 없으면 빈 배열을 반환합니다.
    if (!items || items.length === 0) return [];

    // 위도와 경도를 키로 사용하여 아이템을 그룹화할 객체입니다.
    const groups: { [key: string]: LostItem[] } = {};
    
    items.forEach(item => {
      // 위도, 경도 값이 유효한 숫자인지 확인합니다.
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        const key = `${item.lat},${item.lng}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }
    });

    // 그룹화된 객체를 지도에 표시할 마커 배열 형태로 변환합니다.
    return Object.entries(groups).map(([key, groupItems]) => {
      const [lat, lng] = key.split(',').map(Number);
      return {
        lat,
        lng,
        items: groupItems,
        // 그룹 ID는 여러 아이템이 있을 경우 'group-' 접두사를 붙이고, 하나만 있을 경우 해당 아이템의 ID를 사용합니다.
        id: groupItems.length > 1 ? `group-${key}` : groupItems[0].id,
        // 그룹의 대표 보관 장소는 첫 번째 아이템의 보관 장소로 설정합니다.
        storagePlace: groupItems[0].storagePlace,
      };
    });
  }, [items]);

  return representativeMarkers;
};

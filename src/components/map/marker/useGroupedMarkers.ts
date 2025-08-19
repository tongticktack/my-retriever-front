// src/components/map/marker/useGroupedMarkers.ts

import { useMemo } from 'react';
import type { LostItem, RepresentativeMarker } from '@/pages/map/types';

export const useGroupedMarkers = (items: LostItem[]): RepresentativeMarker[] => {
  const representativeMarkers = useMemo((): RepresentativeMarker[] => {
    if (!items || items.length === 0) return [];

    const groups: { [key: string]: LostItem[] } = {};
    
    items.forEach(item => {
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        const key = `${item.lat},${item.lng}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }
    });

    // 클러스터링에 사용되던 key 속성을 제거하고 반환합니다.
    return Object.entries(groups).map(([key, groupItems]) => {
      const [lat, lng] = key.split(',').map(Number);
      return {
        lat,
        lng,
        items: groupItems,
        id: groupItems.length > 1 ? `group-${key}` : groupItems[0].id,
        storagePlace: groupItems[0].storagePlace,
      };
    });
  }, [items]);

  return representativeMarkers;
};

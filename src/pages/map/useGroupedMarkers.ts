// src/pages/map/useGroupedMarkers.ts

import { useMemo } from 'react';
import type { LostItem, RepresentativeMarker } from './types';

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

    return Object.entries(groups).map(([key, groupItems]) => {
      const [lat, lng] = key.split(',').map(Number);
      return {
        lat,
        lng,
        isGroup: groupItems.length > 1,
        items: groupItems,
        id: groupItems.length > 1 ? `group-${key}` : groupItems[0].id,
        // 👈 [수정] addressName -> storagePlace 로 속성 이름을 다시 통일합니다.
        storagePlace: groupItems[0].storagePlace, 
      };
    });
  }, [items]);

  return representativeMarkers;
};

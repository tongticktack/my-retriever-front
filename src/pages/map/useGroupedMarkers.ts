// src/pages/map/useGroupedMarkers.ts

import { useMemo } from 'react';
import type { LostItem } from './types';
import type { RepresentativeMarker } from './index';

/**
 * LostItem 배열을 받아서 좌표 기반으로 그룹화된 RepresentativeMarker 배열을 반환하는 커스텀 훅
 * @param items - 원본 분실물 아이템 배열
 * @returns 그룹화된 대표 마커 배열
 */
export const useGroupedMarkers = (items: LostItem[]): RepresentativeMarker[] => {
  const representativeMarkers = useMemo((): RepresentativeMarker[] => {
    if (!items || items.length === 0) return [];

    const groups: { [key: string]: LostItem[] } = {};
    
    items.forEach(item => {
      // 유효한 위도, 경도 값이 있는 아이템만 그룹화합니다.
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
      };
    });
  }, [items]);

  return representativeMarkers;
};
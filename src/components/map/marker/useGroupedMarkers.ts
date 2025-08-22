// src/components/map/marker/useGroupedMarkers.ts

import { useMemo } from 'react';
import type { LostItem, RepresentativeMarker } from '@/pages/map/types';

// 필터링할 '이미지 없음' URL을 상수로 정의합니다.
const NO_IMAGE_URL = 'https://www.lost112.go.kr/lostnfs/images/sub/img04_no_img.gif';

export const useGroupedMarkers = (items: LostItem[]): RepresentativeMarker[] => {
  const representativeMarkers = useMemo((): RepresentativeMarker[] => {
    if (!items || items.length === 0) return [];

    // 1. storagePlace를 기준으로 아이템을 그룹화합니다.
    const groups: { [key: string]: LostItem[] } = {};
    
    items.forEach(item => {
      // storagePlace가 있고, 좌표값이 유효한 아이템만 그룹화 대상으로 삼습니다.
      if (item.storagePlace && typeof item.lat === 'number' && typeof item.lng === 'number') {
        const key = item.storagePlace;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }
    });

    // 2. 그룹화된 데이터를 처리하여 유효한 마커만 남깁니다.
    const processedMarkers = Object.entries(groups).map(([key, groupItems]) => {
      // 2-1. 각 그룹 내에서 유효한 사진을 가진 아이템만 필터링합니다.
      const validPhotoItems = groupItems.filter(item => 
        item.photo && item.photo !== NO_IMAGE_URL
      );

      // 2-2. 필터링 후 아이템이 하나도 남지 않으면, 이 마커는 표시하지 않도록 null을 반환합니다.
      if (validPhotoItems.length === 0) {
        return null;
      }

      // 2-3. 유효한 아이템이 있는 경우, 마커 데이터를 생성합니다.
      // 대표 좌표는 그룹의 첫 번째 아이템의 좌표를 사용합니다.
      const representativeItem = validPhotoItems[0];
      return {
        lat: representativeItem.lat,
        lng: representativeItem.lng,
        items: validPhotoItems, // 사진이 있는 아이템 목록만 포함합니다.
        id: `group-${key}`, // storagePlace를 기반으로 고유 ID 생성
        storagePlace: key, // key 자체가 storagePlace 입니다.
      };
    });

    // 3. null로 처리된 (비어있는) 마커 그룹을 최종 결과에서 제거합니다.
    return processedMarkers.filter(Boolean) as RepresentativeMarker[];

  }, [items]);

  return representativeMarkers;
};

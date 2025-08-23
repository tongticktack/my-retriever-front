import { useMemo } from 'react';
import type { LostItem, RepresentativeMarker } from '@/pages/map/types';

// 사진 없는 URL 상수 정의
const NO_IMAGE_URL1 = 'https://www.lost112.go.kr/lostnfs/images/sub/img04_no_img.gif';
const NO_IMAGE_URL2 = 'https://www.lost112.go.kr/lostnfs/images/sub/img02_no_img.gif';

export const useGroupedMarkers = (items: LostItem[]): RepresentativeMarker[] => {
  const representativeMarkers = useMemo((): RepresentativeMarker[] => {
    if (!items || items.length === 0) return [];

    // storagePlace 기준 아이템 그룹화
    const groups: { [key: string]: LostItem[] } = {};
    
    items.forEach(item => {
      // storagePlace가 있고, 좌표값이 유효한 아이템만 그룹화 대상
      if (item.storagePlace && typeof item.lat === 'number' && typeof item.lng === 'number') {
        const key = item.storagePlace;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }
    });

    // 그룹화된 데이터를 처리하여 유효한 마커만 추출
    const processedMarkers = Object.entries(groups).map(([key, groupItems]) => {
      // 그룹 내 유효 사진 아이템 필터링
      const validPhotoItems = groupItems.filter(item => 
        item.photo && item.photo !== NO_IMAGE_URL1 && item.photo !== NO_IMAGE_URL2
      );

      // 아이템 없을 경우 null 반환
      if (validPhotoItems.length === 0) {
        return null;
      }

      // 유효한 아이템이 있는 경우 마커 데이터 생성 좌표는 그룹 내 첫 번째 아이템 기준
      const representativeItem = validPhotoItems[0];
      return {
        lat: representativeItem.lat,
        lng: representativeItem.lng,
        items: validPhotoItems, // 사진 존재 아이템 목록만 포함
        id: `group-${key}`, // storagePlace를 기반으로 고유 ID 생성
        storagePlace: key, // key = storagePlace
      };
    });

    // null 마커 그룹 최종 결과에서 제거
    return processedMarkers.filter(Boolean) as RepresentativeMarker[];

  }, [items]);

  return representativeMarkers;
};

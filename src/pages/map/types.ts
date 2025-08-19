// src/pages/map/types.ts

export interface LostItem {
  id: string;
  category: string;
  foundDate: string;
  photo: string;
  name:string;
  lat: number;
  lng: number;
  storagePlace: string;
}

// '집단'을 나타내는 타입 정의 (클러스터링에 필요했던 key 속성 제거)
export type RepresentativeMarker = {
  lat: number;
  lng: number;
  items: LostItem[]; // 이 집단에 포함된 분실물 배열
  id: string;
  storagePlace: string;
};

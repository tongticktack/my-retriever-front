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

export type RepresentativeMarker = {
  lat: number;
  lng: number;
  isGroup: boolean;
  items: LostItem[];
  id: string;
  // 👈 [수정] addressName -> storagePlace 로 속성 이름을 다시 통일합니다.
  storagePlace: string;
};
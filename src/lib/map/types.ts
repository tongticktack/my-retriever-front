// central map types (moved from pages)
export interface LostItem {
  id: string;
  category: string;
  foundDate: string;
  photo: string;
  name: string;
  lat: number;
  lng: number;
  storagePlace: string;
}

export type RepresentativeMarker = {
  lat: number;
  lng: number;
  items: LostItem[];
  id: string;
  storagePlace: string;
};

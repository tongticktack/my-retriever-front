// src/pages/map/index.tsx

import Panel from "@/components/Panel";
import styles from "./map.module.css";
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useLostItems } from './useLostItems';
import { useGroupedMarkers } from './useGroupedMarkers';
import Markers from '@/components/map/Markers';
import type { LostItem } from './types';
import Sidebar from '@/components/map/Sidebar';

const MapViewer = dynamic(() => import('@/components/map/MapViewer'), {
  ssr: false,
  loading: () => <p>지도를 불러오는 중입니다...</p>
});

export type RepresentativeMarker = {
  lat: number;
  lng: number;
  isGroup: boolean;
  items: LostItem[];
  id: string;
};

export default function MapPage() {
  const { items, loading } = useLostItems();
  const representativeMarkers = useGroupedMarkers(items);
  
  const [selectedMarker, setSelectedMarker] = useState<LostItem | null>(null);
  const [sidebarItems, setSidebarItems] = useState<LostItem[] | null>(null);

  const handleCloseSidebar = () => {
    setSidebarItems(null);
  };
  
  const handleMapClick = () => {
    setSelectedMarker(null);
    setSidebarItems(null);
  };

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>분실물 지도</h1>
        </div>
        <div className={styles.content} style={{ position: 'relative' }}>
          <MapViewer onMapClick={handleMapClick}>
            {!loading && (
              <Markers
                markers={representativeMarkers}
                selectedMarker={selectedMarker}
                onMarkerClick={setSelectedMarker}
                onClusterClick={setSidebarItems}
              />
            )}
          </MapViewer>
          {sidebarItems && (
            <Sidebar items={sidebarItems} onClose={handleCloseSidebar} />
          )}
        </div>
      </Panel>
    </main>
  );
}

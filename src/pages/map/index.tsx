// src/pages/map/index.tsx

import Panel from "@/components/Panel";
import styles from "./map.module.css";
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useLostItems } from './useLostItems'; // 상대 경로로 훅을 가져옵니다.
import Markers from '@/components/map/Markers';
import type { LostItem } from './types'; // 상대 경로로 타입을 가져옵니다.

const MapViewer = dynamic(() => import('@/components/map/MapViewer'), {
  ssr: false,
  loading: () => <p>지도를 불러오는 중입니다...</p>
});

export default function MapPage() {
  const { items, loading } = useLostItems();
  const [selectedMarker, setSelectedMarker] = useState<LostItem | null>(null);

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>분실물 지도</h1>
        </div>
        <div className={styles.content}>
          <MapViewer onMapClick={() => setSelectedMarker(null)}>
            {!loading && (
              <Markers
                items={items}
                selectedMarker={selectedMarker}
                onMarkerClick={setSelectedMarker}
              />
            )}
          </MapViewer>
        </div>
      </Panel>
    </main>
  );
}

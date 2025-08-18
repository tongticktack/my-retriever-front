// src/pages/map/index.tsx

import Panel from "@/components/Panel";
import styles from "./map.module.css";
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useLostItems } from './useLostItems';
import { useGroupedMarkers } from './useGroupedMarkers';
import Markers from '@/components/map/Markers';
import type { LostItem, RepresentativeMarker } from './types';
import Sidebar from "@/components/map/sidebar/Sidebar";
import CategoryFilter from "@/components/map/category/CategoryFilter";

const MapViewer = dynamic(() => import('@/components/map/MapViewer'), {
  ssr: false,
  loading: () => <p>지도를 불러오는 중입니다...</p>
});

export default function MapPage() {
  const { items, loading } = useLostItems();
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  const filteredItems = useMemo(() => {
    if (!mainCategory) {
      return items;
    }
    return items.filter(item => {
      const [itemMain, itemSub] = item.category.split(' > ');
      if (!subCategory) {
        return itemMain === mainCategory;
      }
      return itemMain === mainCategory && itemSub === subCategory;
    });
  }, [items, mainCategory, subCategory]);

  const representativeMarkers = useGroupedMarkers(filteredItems);
  
  const [selectedMarker, setSelectedMarker] = useState<LostItem | null>(null);
  const [sidebarItems, setSidebarItems] = useState<LostItem[] | null>(null);
  const [sidebarLocation, setSidebarLocation] = useState<string | null>(null);

  const handleClusterClick = (marker: RepresentativeMarker) => {
    setSidebarItems(marker.items);
    // 👈 [수정] marker.addressName -> marker.storagePlace 로 수정합니다.
    setSidebarLocation(marker.storagePlace); 
  };

  const handleCloseSidebar = () => {
    setSidebarItems(null);
    setSidebarLocation(null);
  };
  
  const handleMapClick = () => {
    setSelectedMarker(null);
    handleCloseSidebar();
  };

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>분실물 지도</h1>
          <CategoryFilter onFilterChange={(main, sub) => {
            setMainCategory(main);
            setSubCategory(sub);
          }} />
        </div>
        <div className={styles.content} style={{ position: 'relative' }}>
          <MapViewer onMapClick={handleMapClick}>
            {!loading && (
              <Markers
                markers={representativeMarkers}
                selectedMarker={selectedMarker}
                onMarkerClick={setSelectedMarker}
                onClusterClick={handleClusterClick}
              />
            )}
          </MapViewer>
          {sidebarItems && (
            <Sidebar 
              items={sidebarItems} 
              storagePlace={sidebarLocation}
              onClose={handleCloseSidebar} 
            />
          )}
        </div>
      </Panel>
    </main>
  );
}

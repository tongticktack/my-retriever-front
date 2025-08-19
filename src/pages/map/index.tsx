// src/pages/map/index.tsx

import Panel from "@/components/Panel";
import styles from "./map.module.css";
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useLostItems } from './useLostItems';
import { useGroupedMarkers } from '../../components/map/marker/useGroupedMarkers';
import Markers from '@/components/map/marker/Markers';
import type { LostItem, RepresentativeMarker } from './types';
import Sidebar from "@/components/map/sidebar/Sidebar";
import CategoryFilter from "@/components/map/category/CategoryFilter";

const MapViewer = dynamic(() => import('@/components/map/MapViewer'), {
  ssr: false,
  loading: () => <p>지도를 불러오는 중입니다...</p>
});

export default function MapPage() {
  const { items, loading } = useLostItems();
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  const filteredItems = useMemo(() => {
    if (!mainCategory) return items;
    return items.filter(item => {
      if (!item.category) return false;
      const [itemMain, itemSub] = item.category.split(' > ');
      if (!subCategory) return itemMain === mainCategory;
      return itemMain === mainCategory && itemSub === subCategory;
    });
  }, [items, mainCategory, subCategory]);

  const representativeMarkers = useGroupedMarkers(filteredItems);
  
  const [sidebarItems, setSidebarItems] = useState<LostItem[] | null>(null);
  const [sidebarLocation, setSidebarLocation] = useState<string | null>(null);

  // 이 함수는 이제 Markers 컴포넌트 내부의 div 클릭 시 직접 호출됩니다.
  const handleGroupClick = (marker: RepresentativeMarker) => {
    setSidebarItems(marker.items);
    setSidebarLocation(marker.storagePlace); 
  };

  const handleCloseSidebar = () => {
    setSidebarItems(null);
    setSidebarLocation(null);
  };
  
  const handleMapClick = () => {
    handleCloseSidebar();
  };

  // 클러스터링 기능이 제거되었으므로 handleLibraryClusterClick 핸들러를 삭제합니다.

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
          <MapViewer onMapClick={handleMapClick} onCreate={setMap}>
            {!loading && (
              // Markers 컴포넌트에 onLibraryClusterClick prop을 전달하지 않습니다.
              <Markers
                markers={representativeMarkers}
                onGroupClick={handleGroupClick}
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

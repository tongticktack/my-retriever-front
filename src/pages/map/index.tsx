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

  // 그룹화된 마커를 생성하는 useGroupedMarkers 훅을 다시 사용합니다.
  const representativeMarkers = useGroupedMarkers(filteredItems);
  
  // 사이드바에 표시할 그룹화된 아이템 목록과 장소 상태를 관리합니다.
  const [sidebarItems, setSidebarItems] = useState<LostItem[] | null>(null);
  const [sidebarLocation, setSidebarLocation] = useState<string | null>(null);

  // 그룹 마커를 클릭했을 때 호출될 핸들러입니다.
  const handleGroupClick = (marker: RepresentativeMarker) => {
    setSidebarItems(marker.items);
    setSidebarLocation(marker.storagePlace); 
  };

  // 사이드바를 닫는 핸들러입니다.
  const handleCloseSidebar = () => {
    setSidebarItems(null);
    setSidebarLocation(null);
  };
  
  // 지도 클릭 시 사이드바를 닫습니다.
  const handleMapClick = () => {
    handleCloseSidebar();
  };

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
        
          <CategoryFilter onFilterChange={(main, sub) => {
            setMainCategory(main);
            setSubCategory(sub);
          }} />
        </div>
        <div className={styles.content} style={{ position: 'relative' }}>
          <MapViewer onMapClick={handleMapClick} onCreate={setMap}>
            {!loading && (
              // Markers 컴포넌트에 그룹화된 마커와 그룹 클릭 핸들러를 전달합니다.
              <Markers
                markers={representativeMarkers}
                onGroupClick={handleGroupClick}
              />
            )}
          </MapViewer>
          {/* sidebarItems가 있을 때만 사이드바를 렌더링합니다. */}
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

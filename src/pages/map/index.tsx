import Panel from "@/components/Panel";
import styles from "./map.module.css";
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useLostItems } from '@/lib/map/useLostItems';
import { useGroupedMarkers } from '@/components/map/marker/useGroupedMarkers';
import Markers from '@/components/map/marker/Markers';
import type { LostItem, RepresentativeMarker } from '@/lib/map/types';
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

  return (
  <main className={`${styles.themeVars} ${styles.main}`}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>분실물 지도</h1>
        </div>


        <div className={styles.filterContainer}>
        
          <CategoryFilter onFilterChange={(main, sub) => {
            setMainCategory(main);
            setSubCategory(sub);
          }} />
        </div>
        <div className={styles.content} style={{ position: 'relative' }}>
          <MapViewer onMapClick={handleMapClick} onCreate={() => { /* no-op */ }}>
            {!loading && (
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

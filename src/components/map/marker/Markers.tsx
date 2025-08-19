// src/components/map/marker/Markers.tsx

'use client';

import React from 'react';
// MarkerClusterer와 MapMarker는 더 이상 필요 없으므로 import에서 제거합니다.
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { RepresentativeMarker } from '@/pages/map/types';

// onLibraryClusterClick prop을 제거합니다.
interface MarkersProps {
  markers: RepresentativeMarker[];
  onGroupClick: (marker: RepresentativeMarker) => void;
}

const Markers = ({ markers, onGroupClick }: MarkersProps) => {
  // MarkerClusterer를 제거하고 CustomOverlayMap만 렌더링합니다.
  return (
    <>
      {markers.map((group) => (
        <CustomOverlayMap key={group.id} position={{ lat: group.lat, lng: group.lng }} zIndex={1}>
          <div
            style={{
              width: "60px",
              height: "60px",
              background: 'url(/pawIcon.svg) no-repeat center',
              backgroundSize: 'contain',
              color: "#ffffff",
              textAlign: "center",
              lineHeight: "60px",
              fontSize: "17px",
              fontWeight: "bold",
              textShadow: '1px 1px 2px black',
              cursor: 'pointer',
            }}
            // div에 직접 onClick 이벤트를 연결하여 사이드바를 엽니다.
            onClick={() => onGroupClick(group)}
          >
            {group.items.length}
          </div>
        </CustomOverlayMap>
      ))}
    </>
  );
};

export default Markers;

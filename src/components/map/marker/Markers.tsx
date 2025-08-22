// src/components/map/marker/Markers.tsx

'use client';

import React from 'react';
// MarkerClusterer를 다시 import 합니다.
import { CustomOverlayMap, MarkerClusterer } from 'react-kakao-maps-sdk';
import type { RepresentativeMarker } from '@/pages/map/types';

interface MarkersProps {
  markers: RepresentativeMarker[];
  onGroupClick: (marker: RepresentativeMarker) => void;
}

const Markers = ({ markers, onGroupClick }: MarkersProps) => {
  const clusterStyles = [
    {
      width: "70px",
      height: "70px",
      background: 'url(/pawIcon.svg) no-repeat center',
      backgroundSize: 'contain',
      color: "#ffffff",
      textAlign: "center",
      lineHeight: "90px",
      fontSize: "17px",
      fontWeight: "bold",
      textShadow: '1px 1px 2px black',
      cursor: 'pointer',
      opacity: 0.9,
      paddingLeft: '8px',
    },
  ];

  return (
    <MarkerClusterer
      averageCenter={true}
      minLevel={8}
      // minClusterSize는 2로 되돌려 단일 마커와 클러스터를 구분합니다.
      minClusterSize={1}
      gridSize={110}
      // styles prop을 사용하여 클러스터의 디자인을 커스텀합니다.
      styles={clusterStyles}
    >
      {/* 이 부분은 원래 코드와 동일하게, 동일 좌표 아이템을 그룹핑하여 표시합니다. */}
      {markers.map((group) => (
        <CustomOverlayMap key={group.id} position={{ lat: group.lat, lng: group.lng }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              background: 'url(/pawIcon.svg) no-repeat center',
              backgroundSize: 'contain',
              color: "#ffffff",
              textAlign: "center",
              lineHeight: "90px",
              fontSize: "17px",
              fontWeight: "bold",
              textShadow: '1px 1px 2px black',
              cursor: 'pointer',
              opacity: 0.7,
              paddingLeft: '8px',
            }}
            onClick={() => onGroupClick(group)}
          >
            {group.items.length}
          </div>
        </CustomOverlayMap>
      ))}
    </MarkerClusterer>
  );
};

export default Markers;

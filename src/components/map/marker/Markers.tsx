'use client';

import React from 'react';
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
      cursor: 'pointer',
      opacity: 0.9,
      paddingLeft: '8px',
    },
  ];

  return (
    <MarkerClusterer
      averageCenter={true}
      minLevel={8}
      minClusterSize={1}
      gridSize={110}
      styles={clusterStyles}
    >
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

// src/components/map/Markers.tsx

'use client';

import React from 'react';
import { MapMarker, MapInfoWindow, MarkerClusterer, CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { LostItem, RepresentativeMarker } from '@/pages/map/types';

interface MarkersProps {
  markers: RepresentativeMarker[];
  selectedMarker: LostItem | null;
  onMarkerClick: (item: LostItem | null) => void;
  // 👈 [수정] onClusterClick이 받는 파라미터 타입을 RepresentativeMarker로 변경합니다.
  onClusterClick: (marker: RepresentativeMarker) => void; 
}

const Markers = ({ markers, selectedMarker, onMarkerClick, onClusterClick }: MarkersProps) => {
  // 단일 마커 아이콘
  const markerImage = {
    src: "/mapIcon.svg",
    size: { width: 20, height: 25 },
    options: { offset: { x: 10, y: 25 } },
  };

  // react-kakao-maps-sdk 클러스터 스타일
  const clustererStyles = [
    {
      width: "60px",
      height: "60px",
      background: 'url(/pawIcon.svg) no-repeat center',
      backgroundSize: 'contain',
      color: "#ffffff",
      textAlign: "center",
      lineHeight: "76px",
      fontSize: "17px",
      fontWeight: "bold",
      textIndent: "4px",
      textShadow: '1px 1px 2px black',
    },
  ];
  
  return (
    <MarkerClusterer
      averageCenter={true}
      minLevel={4}
      styles={clustererStyles}
    >
      {markers.map((marker) => {
        if (marker.isGroup) {
          return (
            <React.Fragment key={marker.id}>
              <CustomOverlayMap position={{ lat: marker.lat, lng: marker.lng }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: 'url(/pawIcon.svg) no-repeat center',
                    backgroundSize: 'contain',
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: "76px",
                    fontSize: "17px",
                    fontWeight: "bold",
                    textIndent: "4px",
                    textShadow: '1px 1px 2px black',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    onMarkerClick(null);
                    onClusterClick(marker);
                  }}
                >
                  {marker.items.length}
                </div>
              </CustomOverlayMap>
              
              {marker.items.map((item) => (
                <MapMarker
                  key={item.id}
                  position={{ lat: item.lat, lng: item.lng }}
                  opacity={0}
                />
              ))}
            </React.Fragment>
          );
        } else {
          const item = marker.items[0];
          return (
            <React.Fragment key={item.id}>
              <MapMarker
                position={{ lat: item.lat, lng: item.lng }}
                onClick={() => onMarkerClick(item)}
                image={markerImage}
              />
              {selectedMarker && selectedMarker.id === item.id && (
                <MapInfoWindow 
                  position={{ lat: item.lat, lng: item.lng }} 
                  removable={false}
                >
                  <div style={{ padding: '10px', width: '220px', lineHeight: '1.5' }}>
                    <img
                      src={item.photo || 'https://placehold.co/220x120?text=No+Image'}
                      alt={item.name}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '5px' }}
                    />
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.name}</p>
                      <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{item.category}</p>
                      <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                        <strong>습득 날짜:</strong> {item.foundDate}
                      </p>
                    </div>
                  </div>
                </MapInfoWindow>
              )}
            </React.Fragment>
          );
        }
      })}
    </MarkerClusterer>
  );
};

export default Markers;

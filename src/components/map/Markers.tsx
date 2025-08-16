// src/components/map/Markers.tsx

'use client';

import React from 'react';
import { MapMarker, MapInfoWindow, MarkerClusterer, CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { LostItem } from '@/pages/map/types';
import type { RepresentativeMarker } from '@/pages/map/index';

interface MarkersProps {
  markers: RepresentativeMarker[];
  selectedMarker: LostItem | null;
  onMarkerClick: (item: LostItem | null) => void;
  onClusterClick: (items: LostItem[]) => void;
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
      width: "60px", // 클러스터 아이콘의 너비
      height: "60px", // 클러스터 아이콘의 높이
      // public 폴더의 SVG 파일을 배경 이미지로 사용합니다.
      background: 'url(pawIcon.svg)',
      backgroundSize: 'contain', // 이미지가 영역 안에 맞게 표시되도록 설정
      color: "#ffffff", // 숫자 텍스트 색상
      textAlign: "center",
      linewidth: "20px",
      textIndent: "4px",
      lineHeight: "76px", // 숫자를 세로 중앙에 위치시키기 위해 높이와 같게 설정
      fontSize: "17px",
      fontWeight: "bold"
    },
    // 마커 개수가 더 많은 클러스터에 대한 스타일 (옵션)
    {
      width: "100px",
      height: "100px",
      background: 'url(pawIcon.svg)',
      backgroundSize: 'contain',
      color: "#ffffff",
      textAlign: "center",
      textIndent: "9px",
      lineHeight: "127px",
      fontSize: "23px",
      fontWeight: "bold"
    },
  ];
  
  const calculator = [15];
  return (
    <MarkerClusterer
      averageCenter={true}
      minLevel={4}
      styles={clustererStyles}
      calculator={calculator}
    >
      {markers.map((marker) => {
        if (marker.isGroup) {
          // 여러 아이템이 묶인 커스텀 클러스터
          return (
            <CustomOverlayMap
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
            >
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
                  onClusterClick(marker.items);
                }}
              >
                {marker.items.length}
              </div>
            </CustomOverlayMap>
          );
        } else {
          // 단일 아이템 마커
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
                  removable={false} // 👈 [수정] 닫기 버튼 제거
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

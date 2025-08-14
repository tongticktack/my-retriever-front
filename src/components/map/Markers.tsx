// src/components/map/Markers.tsx

'use client';

import React from 'react';
import { MapMarker, MapInfoWindow, MarkerClusterer } from 'react-kakao-maps-sdk';
import type { LostItem } from '@/pages/map/types';

interface MarkersProps {
  items: LostItem[];
  selectedMarker: LostItem | null;
  onMarkerClick: (item: LostItem | null) => void;
}

const Markers = ({ items, selectedMarker, onMarkerClick }: MarkersProps) => {
 const markerImage = {
    src: "mapIcon.svg", // public 폴더의 파일은 '/'로 시작하는 절대 경로로 접근합니다.
    size: {
      width: 20, // 실제 SVG 파일의 너비에 맞게 조절하세요.
      height: 25, // 실제 SVG 파일의 높이에 맞게 조절하세요.
    },
    options: {
      // 마커의 뾰족한 끝이 정확한 위치를 가리키도록 오프셋을 설정합니다.
      offset: {
        x: 10, // 너비의 절반
        y: 25, // 높이 전체
      },
    },
  };

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
      {items.map((item) => {
        console.log("개별 마커 데이터:", item);
        if (typeof item.lat !== 'number' || typeof item.lng !== 'number') {
          return null;
        }

        return (
          <React.Fragment key={item.id}>
            <MapMarker
              position={{ lat: item.lat, lng: item.lng }}
              onClick={() => onMarkerClick(item)}
              image={markerImage}
            />
            {selectedMarker && selectedMarker.id === item.id && (
              <MapInfoWindow position={{ lat: item.lat, lng: item.lng }}>
                <div style={{ padding: '10px', width: '220px', lineHeight: '1.5' }}>
                  {/* 👇 이미지가 null일 경우, 기본 이미지를 보여줍니다. */}
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
      })}
    </MarkerClusterer>
  );
};

export default Markers;

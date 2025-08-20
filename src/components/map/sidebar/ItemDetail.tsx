// src/components/map/ItemDetail.tsx
import React from 'react';
import type { LostItem } from '@/pages/map/types';
import styles from './Sidebar.module.css'; // 기존 사이드바 스타일 재활용

interface ItemDetailProps {
  item: LostItem;
  onBack: () => void;
}

const ItemDetail = ({ item, onBack }: ItemDetailProps) => {
  console.log("전달된 사진 URL:", item.photo);
  return (
    <div className={styles.detailContainer}>
      <button onClick={onBack} className={styles.backButton}>&larr; 목록으로 돌아가기</button>
      <img
        src={item.photo || 'https://placehold.co/350x200?text=No+Image'}
        alt={item.name}
        className={styles.detailImage}
        onError={(e) => {
          e.currentTarget.src = 'https://www.lost112.go.kr/lostnfs/images/sub/img02_no_img.gif';
          e.currentTarget.onerror = null; // 무한 루프 방지
        }}
      />
      <div className={styles.detailInfo}>
        <h4 className={styles.detailName}>{item.name}</h4>
        <p className={styles.detailText}><strong>카테고리:</strong> {item.category}</p>
        <p className={styles.detailText}><strong>습득일:</strong> {item.foundDate}</p>
        <p className={styles.detailText}><strong>보관장소:</strong> {item.storagePlace}</p>
      </div>
    </div>
  );
};

export default ItemDetail;

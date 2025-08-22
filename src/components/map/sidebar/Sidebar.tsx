// src/components/map/Sidebar.tsx

import React, { useState, useEffect, useMemo } from 'react';
import type { LostItem } from '@/pages/map/types';
import styles from './Sidebar.module.css';
import ItemDetail from './ItemDetail'; // 👈 [추가] 상세 정보 컴포넌트 임포트

interface SidebarProps {
  items: LostItem[];
  storagePlace: string | null;
  onClose: () => void;
}

const Sidebar = ({ items, storagePlace, onClose }: SidebarProps) => {
  const [detailItem, setDetailItem] = useState<LostItem | null>(null);

  // 다른 클러스터를 클릭해서 아이템 목록이 바뀌면 상세 뷰를 닫습니다.
  useEffect(() => {
    setDetailItem(null);
  }, [items]);

  const sortedItems = useMemo(() => {
    // 원본 배열을 변경하지 않기 위해 복사본을 만들어 정렬합니다.
    return [...items].sort((a, b) => new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime());
  }, [items]);

  // 상세 뷰를 보여줘야 할 때
  if (detailItem) {
    return (
      <>
        <div className={styles.overlay} onClick={onClose} />
        <div className={styles.sidebar}>
          <ItemDetail item={detailItem} onBack={() => setDetailItem(null)} />
        </div>
      </>
    );
  }

  // 목록 뷰를 보여줄 때
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h3>{items[0].storagePlace || '분실물 목록'} ({items.length}개)</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <ul className={styles.itemList}>
          {sortedItems.map(item => (
            // 👈 [수정] li에 onClick 이벤트 추가
            <li key={item.id} className={styles.itemCard} onClick={() => setDetailItem(item)}>
              <img
                src={item.photo || 'https://placehold.co/80x80?text=No+Image'}
                alt={item.name}
                className={styles.itemImage}
                onError={(e) => {
                  e.currentTarget.src = 'https://www.lost112.go.kr/lostnfs/images/sub/img02_no_img.gif';
                  e.currentTarget.onerror = null; // 무한 루프 방지
                }}
              />
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemCategory}>{item.category}</p>
                <p className={styles.itemDate}><strong>습득일:</strong> {item.foundDate}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;

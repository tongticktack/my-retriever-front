import React, { useState, useEffect, useMemo } from 'react';
import type { LostItem } from '@/pages/map/types';
import styles from './Sidebar.module.css';
import ItemDetail from './ItemDetail';

interface SidebarProps {
  items: LostItem[];
  storagePlace: string | null;
  onClose: () => void;
}

const Sidebar = ({ items, storagePlace, onClose }: SidebarProps) => {
  const [detailItem, setDetailItem] = useState<LostItem | null>(null);
  const [isClosing, setIsClosing] = useState(false); // 닫기 애니메이션 상태 추가

  useEffect(() => {
    // items가 변경되면 상세 아이템 뷰를 닫고 목록으로 돌아갑니다.
    setDetailItem(null);
  }, [items]);

  // 닫기 버튼 클릭 시 애니메이션을 먼저 실행하고, 애니메이션이 끝난 후 onClose를 호출합니다.
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // CSS 애니메이션 시간과 동일하게 설정 (0.3s)
  };

  const sortedItems = useMemo(() => {
    // 최신순으로 아이템을 정렬합니다.
    return [...items].sort((a, b) => new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime());
  }, [items]);

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
            <li key={item.id} className={styles.itemCard} onClick={() => setDetailItem(item)}>
              <img
                src={item.photo || 'https://placehold.co/80x80?text=No+Image'}
                alt={item.name}
                className={styles.itemImage}
                onError={(e) => {
                  e.currentTarget.src = 'https://www.lost112.go.kr/lostnfs/images/sub/img02_no_img.gif';
                  e.currentTarget.onerror = null;
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
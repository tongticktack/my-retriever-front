import React, { useState, useEffect, useMemo } from 'react';
import type { LostItem } from '@/pages/map/types';
import styles from './Sidebar.module.css';
import ItemDetail from './ItemDetail';

interface SidebarProps {
  items: LostItem[];
  storagePlace: string | null;
  onClose: () => void;
}

// 애니메이션 시간을 상수로 정의하여 관리 용이성을 높입니다.
const ANIMATION_DURATION = 350;

const Sidebar = ({ items, storagePlace, onClose }: SidebarProps) => {
  const [detailItem, setDetailItem] = useState<LostItem | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // 뷰 전환 애니메이션을 위한 상태
  const [isListView, setIsListView] = useState(true);

  useEffect(() => {
    // 외부 items가 변경되면 목록 뷰로 초기화합니다.
    if (detailItem) {
      handleBack();
    }
  }, [items]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION); // 상수를 사용합니다.
  };

  const handleItemClick = (item: LostItem) => {
    setDetailItem(item); // 먼저 상세 페이지에 표시할 데이터를 설정합니다.
    setIsListView(false); // 그 다음, 뷰 전환 애니메이션을 시작합니다.
  };

  const handleBack = () => {
    setIsListView(true); // 먼저 뷰 전환 애니메이션을 시작합니다.
    setTimeout(() => {
      setDetailItem(null); // 애니메이션이 끝난 후, 상세 페이지 데이터를 초기화합니다.
    }, ANIMATION_DURATION); // 상수를 사용합니다.
  };

  const sortedItems = useMemo(() => {
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

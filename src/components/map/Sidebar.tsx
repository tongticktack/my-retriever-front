// src/components/map/Sidebar.tsx

import React from 'react';
import type { LostItem } from '@/pages/map/types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  items: LostItem[];
  onClose: () => void;
}

const Sidebar = ({ items, onClose }: SidebarProps) => {
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h3>같은 위치의 분실물 ({items.length}개)</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <ul className={styles.itemList}>
          {items.map(item => (
            <li key={item.id} className={styles.itemCard}>
              <img
                src={item.photo || 'https://placehold.co/220x120?text=No+Image'}
                alt={item.name}
                className={styles.itemImage}
              />
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemCategory}>{item.category}</p>
                <p className={styles.itemDate}><strong>습득일:</strong> {item.foundDate}</p>
                <p className={styles.itemStorage}><strong>보관장소:</strong> {item.storagePlace}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;

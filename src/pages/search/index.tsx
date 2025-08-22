import React, { useState, useMemo } from 'react';
import { useLostItems } from '../map/useLostItems';
import { categories } from '@/components/map/category/categoryData';
import styles from './search.module.css';
import type { LostItem } from '../map/types';

const PAGE_SIZE = 12;
const PAGE_CHUNK_SIZE = 10;

const NO_IMAGE_URLS = [
  'https://www.lost112.go.kr/lostnfs/images/sub/img04_no_img.gif',
  'https://www.lost112.go.kr/lostnfs/images/sub/img02_no_img.gif',
];

export default function FindItemsPage() {
  const { allItems, loading } = useLostItems();

  // 필터 상태 관리
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  // 페이지네이션 상태 관리
  const [currentPage, setCurrentPage] = useState(1);
  
  // 모달 상태 관리
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);

  // 필터링된 아이템 목록
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // 사진 유무 필터
      if (hasPhoto) {
        if (!item.photo || NO_IMAGE_URLS.includes(item.photo)) {
          return false;
        }
      }

      // 카테고리 필터
      if (mainCategory && item.category) {
        const [itemMain, itemSub] = item.category.split(' > ');
        if (mainCategory !== itemMain) {
          return false;
        }
        if (subCategory && subCategory !== itemSub) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, mainCategory, subCategory, hasPhoto]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 10페이지 단위 묶음 계산 로직
  const chunkIndex = Math.floor((currentPage - 1) / PAGE_CHUNK_SIZE);
  const startPage = chunkIndex * PAGE_CHUNK_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_CHUNK_SIZE - 1, totalPages);
  const prevChunkPage = Math.max(1, startPage - PAGE_CHUNK_SIZE);
  const nextChunkPage = Math.min(totalPages, startPage + PAGE_CHUNK_SIZE);

  const subCategoryOptions = useMemo(() => {
    if (!mainCategory) return [];
    const selected = categories.find(cat => cat.main === mainCategory);
    return selected ? ['전체', ...selected.sub] : [];
  }, [mainCategory]);

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMainCategory(e.target.value);
    setSubCategory('');
    setCurrentPage(1);
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubCategory(e.target.value === '전체' ? '' : e.target.value);
    setCurrentPage(1);
  };

  const handleCardClick = (item: LostItem) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  return (
    <main className={styles.main}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h1 className={styles.title}>분실물 찾기</h1>
        </div>

        {/* 필터 UI */}
        <div className={styles.filterContainer}>
          <select className={styles.selectBox} value={mainCategory} onChange={handleMainCategoryChange}>
            <option value="">대분류 전체</option>
            {categories.map(cat => (
              <option key={cat.main} value={cat.main}>{cat.main}</option>
            ))}
          </select>
          <select 
            className={styles.selectBox} 
            value={subCategory} 
            onChange={handleSubCategoryChange}
            disabled={!mainCategory || subCategoryOptions.length <= 1}
          >
            <option value="">소분류 전체</option>
            {subCategoryOptions.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <div className={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              id="hasPhoto" 
              checked={hasPhoto} 
              onChange={(e) => {
                setHasPhoto(e.target.checked);
                setCurrentPage(1);
              }}
            />
            <label htmlFor="hasPhoto">사진이 있는 분실물만 보기</label>
          </div>
        </div>

        {/* 로딩 및 결과 표시 */}
        {loading ? (
          <div className={styles.message}>데이터를 불러오는 중입니다...</div>
        ) : (
          <>
            <div className={styles.gridContainer}>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => (
                  <div key={item.id} className={styles.card} onClick={() => handleCardClick(item)}>
                    <img
                      src={item.photo && !NO_IMAGE_URLS.includes(item.photo) ? item.photo : 'https://placehold.co/300x200?text=No+Image'}
                      alt={item.name}
                      className={styles.cardImage}
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/300x200?text=No+Image';
                        e.currentTarget.onerror = null;
                      }}
                    />
                    <div className={styles.cardBody}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemCategory}>{item.category}</p>
                      <p className={styles.itemDate}><strong>습득일:</strong> {item.foundDate}</p>
                      <p className={styles.itemPlace}><strong>보관장소:</strong> {item.storagePlace}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.message}>조건에 맞는 분실물이 없습니다.</div>
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.arrowButton} 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                <button 
                  className={styles.arrowButton} 
                  onClick={() => setCurrentPage(prevChunkPage)}
                  disabled={startPage === 1}
                >
                  ‹
                </button>
                <div className={styles.pageNumbers}>
                  {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                    <button
                      key={page}
                      className={page === currentPage ? styles.current : ''}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  className={styles.arrowButton} 
                  onClick={() => setCurrentPage(nextChunkPage)}
                  disabled={endPage === totalPages}
                >
                  ›
                </button>
                 <button 
                  className={styles.arrowButton} 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 상세 정보 모달 */}
      {selectedItem && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedItem.photo && !NO_IMAGE_URLS.includes(selectedItem.photo) ? selectedItem.photo : 'https://placehold.co/600x400?text=No+Image'}
              alt={selectedItem.name}
              className={styles.modalImage}
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image';
                e.currentTarget.onerror = null;
              }}
            />
            <div className={styles.modalDetails}>
              <h2>{selectedItem.name}</h2>
              <p><strong>분류:</strong> {selectedItem.category}</p>
              <p><strong>습득일:</strong> {selectedItem.foundDate}</p>
              <p><strong>보관장소:</strong> {selectedItem.storagePlace}</p>
            </div>
            <button className={styles.modalCloseButton} onClick={closeModal}>
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
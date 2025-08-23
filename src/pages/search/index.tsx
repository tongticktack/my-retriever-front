// src/pages/find/index.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
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

const CustomSelect = ({ options, value, onChange, placeholder, disabled = false }: {
  options: { value: string; label: string; }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.customSelect} ref={selectRef}>
      <button 
        className={styles.selectToggle} 
        onClick={() => !disabled && setIsOpen(!isOpen)} 
        disabled={disabled}
      >
        {selectedOption ? (
          <span className={styles.selectedText}>{selectedOption.label}</span>
        ) : (
          <span className={styles.placeholderText}>{placeholder}</span>
        )}
        <span className={styles.chev}>▼</span>
      </button>
      {isOpen && (
        <div className={styles.options}>
          {options.map(option => (
            <div
              key={option.value}
              className={styles.option}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default function FindItemsPage() {
  const { allItems, loading } = useLostItems();

  // 필터 관리
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [sortOrDate, setSortOrDate] = useState('newest');
  const [selectedDate, setSelectedDate] = useState('');

  // 페이지네이션, 모달 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);

  const processedItems = useMemo(() => {
    let items = allItems.filter(item => {
      if (hasPhoto && (!item.photo || NO_IMAGE_URLS.includes(item.photo))) return false;
      if (mainCategory && item.category) {
        const [itemMain, itemSub] = item.category.split(' > ');
        if (mainCategory !== itemMain) return false;
        if (subCategory && subCategory !== itemSub) return false;
      }
      if (sortOrDate === 'date' && selectedDate && item.foundDate !== selectedDate) return false;
      return true;
    });

    if (sortOrDate !== 'date') {
      return items.sort((a, b) => {
        const dateA = new Date(a.foundDate).getTime();
        const dateB = new Date(b.foundDate).getTime();
        return sortOrDate === 'newest' ? dateB - dateA : dateA - dateB;
      });
    }
    return items;
  }, [allItems, mainCategory, subCategory, hasPhoto, selectedDate, sortOrDate]);

  const totalPages = Math.ceil(processedItems.length / PAGE_SIZE);
  const paginatedItems = processedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const chunkIndex = Math.floor((currentPage - 1) / PAGE_CHUNK_SIZE);
  const startPage = chunkIndex * PAGE_CHUNK_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_CHUNK_SIZE - 1, totalPages);
  const prevChunkPage = Math.max(1, startPage - PAGE_CHUNK_SIZE);
  const nextChunkPage = Math.min(totalPages, startPage + PAGE_CHUNK_SIZE);
  
  const mainCategoryOptions = [{ value: '', label: '대분류 전체' }, ...categories.map(cat => ({ value: cat.main, label: cat.main }))];
  
  const subCategoryOptions = useMemo(() => {
    if (!mainCategory) return [];
    const selected = categories.find(cat => cat.main === mainCategory);
    return selected ? [{ value: '', label: '소분류 전체' }, ...selected.sub.map(s => ({ value: s, label: s }))] : [];
  }, [mainCategory]);

  const sortOptions = [
    { value: 'newest', label: '최신 순' },
    { value: 'oldest', label: '오래된 순' },
    { value: 'date', label: '날짜 선택' },
  ];

  const resetPage = () => setCurrentPage(1);

  const handleMainCategoryChange = (value: string) => {
    setMainCategory(value);
    setSubCategory('');
    resetPage();
  };

  const handleSubCategoryChange = (value: string) => {
    setSubCategory(value);
    resetPage();
  };
  
  const handleSortOrDateChange = (value: string) => {
    setSortOrDate(value);
    if (value !== 'date') setSelectedDate('');
    resetPage();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    resetPage();
  };

  const handleCardClick = (item: LostItem) => setSelectedItem(item);
  const closeModal = () => setSelectedItem(null);

  return (
    <main className={styles.main}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h1 className={styles.title}>분실물 찾기</h1>
        </div>

        <div className={styles.filterContainer}>
          <CustomSelect
            placeholder="대분류 전체"
            options={mainCategoryOptions}
            value={mainCategory}
            onChange={handleMainCategoryChange}
          />
          <CustomSelect
            placeholder="소분류 전체"
            options={subCategoryOptions}
            value={subCategory}
            onChange={handleSubCategoryChange}
            disabled={!mainCategory || subCategoryOptions.length <= 1}
          />
          <CustomSelect
            placeholder="정렬"
            options={sortOptions}
            value={sortOrDate}
            onChange={handleSortOrDateChange}
          />
          {sortOrDate === 'date' && (
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={handleDateChange}
            />
          )}
          <div className={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              id="hasPhoto" 
              checked={hasPhoto} 
              onChange={(e) => {
                setHasPhoto(e.target.checked);
                resetPage();
              }}
            />
            <label htmlFor="hasPhoto">사진 있는 분실물만 보기</label>
          </div>
        </div>

        {loading ? (
          <div className={styles.message}>데이터를 불러오는 중입니다...</div>
        ) : (
          <>
            <div className={styles.gridContainer}>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => (
                  <div key={item.id} className={styles.card} onClick={() => handleCardClick(item)}>
                    <img
                      src={item.photo && !NO_IMAGE_URLS.includes(item.photo) ? item.photo : NO_IMAGE_URLS[0]}
                      alt={item.name}
                      className={styles.cardImage}
                      onError={(e) => { e.currentTarget.src = NO_IMAGE_URLS[0]; }}
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
                <div className={styles.message}>
                  <img 
                    src="/Sad.svg"
                    className={styles.messageImage}
                  />조건에 맞는 분실물이 없어요!
                  </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
                <button onClick={() => setCurrentPage(prevChunkPage)} disabled={startPage === 1}>‹</button>
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
                <button onClick={() => setCurrentPage(nextChunkPage)} disabled={endPage === totalPages}>›</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedItem && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedItem.photo && !NO_IMAGE_URLS.includes(selectedItem.photo) ? selectedItem.photo : NO_IMAGE_URLS[0]}
              alt={selectedItem.name}
              className={styles.modalImage}
              onError={(e) => { e.currentTarget.src = NO_IMAGE_URLS[0]; }}
            />
            <div className={styles.modalDetails}>
              <h2>{selectedItem.name}</h2>
              <p><strong>분류:</strong> {selectedItem.category}</p>
              <p><strong>습득일:</strong> {selectedItem.foundDate}</p>
              <p><strong>보관장소:</strong> {selectedItem.storagePlace}</p>
            </div>
            <button className={styles.modalCloseButton} onClick={closeModal}>닫기</button>
          </div>
        </div>
      )}
    </main>
  );
}

// src/components/map/CategoryFilter.tsx
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { categories } from './categoryData';
// ▼▼▼ 올바른 CSS 파일 경로로 수정 ▼▼▼
import styles from './CategoryFilter.module.css'; 

interface FilterProps {
  onFilterChange: (mainCategory: string, subCategory: string) => void;
}

// 재사용성을 위해 CustomSelect 컴포넌트를 내부에 정의
const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.customSelect} ref={selectRef}>
      <button
        type="button"
        className={styles.selectToggle}
        onClick={() => setIsOpen(!isOpen)}
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
          {/* 전체 옵션 */}
          <div
            className={styles.option}
            onClick={() => handleOptionClick('')}
          >
            {placeholder}
          </div>
          {/* 나머지 옵션 */}
          {options.map((option) => (
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


const CategoryFilter = ({ onFilterChange }: FilterProps) => {
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  const mainCategoryOptions = categories.map(cat => ({ value: cat.main, label: cat.main }));
  
  const subCategoryOptions = mainCategory
    ? categories.find(cat => cat.main === mainCategory)?.sub.map(s => ({ value: s, label: s })) || []
    : [];

  const handleMainCategoryChange = (value: string) => {
    setMainCategory(value);
    setSubCategory(''); // 대분류 변경 시 소분류 초기화
  };

  useEffect(() => {
    onFilterChange(mainCategory, subCategory);
  }, [mainCategory, subCategory, onFilterChange]);

  return (
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
        onChange={setSubCategory}
        disabled={!mainCategory || subCategoryOptions.length === 0}
      />
    </div>
  );
};

export default CategoryFilter;

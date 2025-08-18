// src/components/map/CategoryFilter.tsx
import React, { useState, useEffect } from 'react';
import { categories } from './categoryData';
import styles from './CategoryFilter.module.css';

interface FilterProps {
  onFilterChange: (mainCategory: string, subCategory: string) => void;
}

const CategoryFilter = ({ onFilterChange }: FilterProps) => {
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subCategories, setSubCategories] = useState<string[]>([]);

  useEffect(() => {
    if (mainCategory) {
      const selectedMain = categories.find(cat => cat.main === mainCategory);
      setSubCategories(selectedMain ? selectedMain.sub : []);
    } else {
      setSubCategories([]);
    }
    setSubCategory(''); // 대분류 변경 시 소분류 초기화
  }, [mainCategory]);

  useEffect(() => {
    onFilterChange(mainCategory, subCategory);
  }, [mainCategory, subCategory, onFilterChange]);

  return (
    <div className={styles.filterContainer}>
      <select 
        className={styles.selectBox} 
        value={mainCategory} 
        onChange={(e) => setMainCategory(e.target.value)}
      >
        <option value="">대분류 전체</option>
        {categories.map(cat => (
          <option key={cat.main} value={cat.main}>{cat.main}</option>
        ))}
      </select>
      <select 
        className={styles.selectBox} 
        value={subCategory} 
        onChange={(e) => setSubCategory(e.target.value)}
        disabled={!mainCategory}
      >
        <option value="">소분류 전체</option>
        {subCategories.map(sub => (
          <option key={sub} value={sub}>{sub}</option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;

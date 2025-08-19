import Image from "next/image";
import { useState } from "react";
import Panel from "@/components/Panel";
import styles from "./my.module.css";

export default function MyPage() {
  const [currentPage, setCurrentPage] = useState<number>(6);
  const totalPages = 42; // placeholder, replace with real total from API

  // Determine current chunk of pages (10 per chunk)
  const chunkSize = 10;
  const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
  const startPage = chunkIndex * chunkSize + 1;
  const endPage = Math.min(startPage + chunkSize - 1, totalPages);
  const prevChunkStart = Math.max(1, startPage - chunkSize);
  const nextChunkStart = Math.min(totalPages, startPage + chunkSize);

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>나의 분실물 조회</h1>
        </div>

        <div className={styles.container}>
          <section className={styles.searchBar}>
            <div className={styles.filters}>
              <button className={styles.filterItem} type="button">
                <div className={styles.filterLabel}>물품 카테고리</div>
                <div className={styles.filterHint}>카테고리 추가</div>
              </button>

              <button className={styles.filterItem} type="button">
                <div className={styles.filterLabel}>분실 일자</div>
                <div className={styles.filterHint}>날짜 추가</div>
              </button>

              <button className={styles.filterItem} type="button">
                <div className={styles.filterLabel}>분실 장소</div>
                <div className={styles.filterHint}>장소 추가</div>
              </button>
            </div>

            <button className={styles.searchButton} aria-label="검색">
              <Image src="/searchIcon.svg" alt="search" width={20} height={20} />
            </button>
          </section>

          <section className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th>관리번호</th>
                  <th>습득물명</th>
                  <th>습득 일자</th>
                  <th>습득 장소</th>
                  <th>분실자명</th>
                  <th>보관장소</th>
                </tr>
              </thead>

              <tbody>
                <tr className={styles.emptyRow}>
                  <td colSpan={6} className={styles.emptyCell} />
                </tr>
              </tbody>
            </table>

            <div className={styles.pagination}>
              <button
                className={styles.prevArrow}
                aria-label="이전 묶음"
                onClick={() => setCurrentPage(prevChunkStart)}
                type="button"
                disabled={startPage === 1}
              >
                ‹
              </button>

              <div className={styles.pageNumbers} role="navigation" aria-label="페이지 네비게이션">
                {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((p) => (
                  <button
                    key={p}
                    className={p === currentPage ? styles.current : undefined}
                    onClick={() => setCurrentPage(p)}
                    aria-current={p === currentPage ? "page" : undefined}
                    aria-label={`페이지 ${p}`}
                    type="button"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                className={styles.nextArrow}
                aria-label="다음 묶음"
                onClick={() => setCurrentPage(nextChunkStart)}
                type="button"
                disabled={endPage === totalPages}
              >
                ›
              </button>
              </div>
          </section>

          <button className={styles.floatingButton} type="button">
            <Image src="/pawIcon.svg" alt="paw" width={20} height={20} />
            <span>분실물 등록</span>
          </button>
        </div>
      </Panel>
    </main>
  );
}

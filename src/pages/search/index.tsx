import Image from "next/image";
import { useState } from "react";
import Panel from "@/components/Panel";
import styles from "./search.module.css";
import FilterModal from "./search.filter";

export default function SearchPage() {
  const [currentPage, setCurrentPage] = useState<number>(6);
  const totalPages = 42; // 여길 db에서 받아와야 함, 일단 설정 값

  // filter modal state
  const [openFilter, setOpenFilter] = useState<null | "category" | "date" | "place">(null);
  const [categoryValue, setCategoryValue] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState<string | null>(null);
  const [placeValue, setPlaceValue] = useState<string | null>(null);

  
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
          <h1 className={styles.title}>경찰청 유실물 리스트</h1>
        </div>

        <div className={styles.container}>
          <section className={styles.searchBar}>
            <div className={styles.filters}>
              <button
                className={styles.filterItem}
                type="button"
                onClick={() => setOpenFilter(openFilter === "category" ? null : "category")}
              >
                <div className={styles.filterLabel}>물품 카테고리</div>
                <div className={styles.filterHint}>{categoryValue ?? "카테고리 추가"}</div>

                <FilterModal
                  mode="category"
                  open={openFilter === "category"}
                  value={categoryValue}
                  onChange={(v) => setCategoryValue(v)}
                  onClose={() => setOpenFilter(null)}
                />
              </button>

              <button
                className={styles.filterItem}
                type="button"
                onClick={() => setOpenFilter(openFilter === "date" ? null : "date")}
              >
                <div className={styles.filterLabel}>분실 일자</div>
                <div className={styles.filterHint}>{dateValue ?? "날짜 추가"}</div>

                <FilterModal
                  mode="date"
                  open={openFilter === "date"}
                  value={dateValue}
                  onChange={(v) => setDateValue(v)}
                  onClose={() => setOpenFilter(null)}
                />
              </button>

              <button
                className={styles.filterItem}
                type="button"
                onClick={() => setOpenFilter(openFilter === "place" ? null : "place")}
              >
                <div className={styles.filterLabel}>분실 장소</div>
                <div className={styles.filterHint}>{placeValue ?? "장소 추가"}</div>

                <FilterModal
                  mode="place"
                  open={openFilter === "place"}
                  value={placeValue}
                  onChange={(v) => setPlaceValue(v)}
                  onClose={() => setOpenFilter(null)}
                />
              </button>

              <button className={styles.searchButton} aria-label="검색">
                <Image src="/search-outline.svg" alt="search" width={20} height={20} />
              </button>
            </div>
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
        </div>
      </Panel>
    </main>
  );
}

import Image from "next/image";
import { useEffect, useState } from "react";
import Panel from "@/components/Panel";
import styles from "./my.module.css";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

type TableRow = {
  id: string;
  major: string; // extracted.category
  minor: string; // extracted.subcategory
  date: string;  // extracted.lost_date (그대로 문자열로 표시)
  place: string; // extracted.region
};

const PAGE_SIZE = 10;

export default function MyPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지 번호 묶음 계산
  const chunkSize = 10;
  const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
  const startPage = chunkIndex * chunkSize + 1;
  const endPage = Math.min(startPage + chunkSize - 1, totalPages);
  const prevChunkStart = Math.max(1, startPage - chunkSize);
  const nextChunkStart = Math.min(totalPages, startPage + chunkSize);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // ⚠️ created_at 으로 정렬 (createdAt 아님)
        const q = query(
          collection(db, "lost_items"),
          orderBy("created_at", "desc"),
          limit(500) // 필요 시 조정
        );
        const snap = await getDocs(q);

        const items: TableRow[] = snap.docs.map((d) => {
          const ex: any = (d.data() as any)?.extracted ?? {};
          return {
            id: d.id,
            major: String(ex.category ?? "-"),
            minor: String(ex.subcategory ?? "-"),
            date: String(ex.lost_date ?? "-"),
            place: String(ex.region ?? "-"),
          };
        });

        if (!mounted) return;
        setRows(items);
        setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
      } catch (e: any) {
        console.error("[fetch error]", e);
        if (!mounted) return;
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 현재 페이지 분할
  const paged = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>나의 분실물 조회</h1>
        </div>

        <div className={styles.container}>
          <section className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th>인덱스</th>
                  <th>분실물 대분류</th>
                  <th>분실물 소분류</th>
                  <th>분실 일자</th>
                  <th>분실 장소</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr className={styles.emptyRow}>
                    <td colSpan={5} className={styles.emptyCell}>로딩 중...</td>
                  </tr>
                )}

                {error && !loading && (
                  <tr className={styles.emptyRow}>
                    <td colSpan={5} className={styles.emptyCell}>{error}</td>
                  </tr>
                )}

                {!loading && !error && paged.length === 0 && (
                  <tr className={styles.emptyRow}>
                    <td colSpan={5} className={styles.emptyCell}>데이터가 없습니다</td>
                  </tr>
                )}

                {!loading && !error && paged.map((r, i) => {
                  const index = (currentPage - 1) * PAGE_SIZE + i + 1;
                  return (
                    <tr key={r.id} className={styles.tableDataRow}>
                      <td>{index}</td>
                      <td>{r.major}</td>
                      <td>{r.minor}</td>
                      <td>{r.date}</td>
                      <td>{r.place}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 페이지네이션 */}
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
                {Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i).map((p) => (
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
            <Image src="/pawIcon-white.svg" alt="paw" width={25} height={25} />
            <span>분실물 등록</span>
          </button>
        </div>
      </Panel>
    </main>
  );
}


// import Image from "next/image";
// import { useEffect, useState } from "react";
// import Panel from "@/components/Panel";
// import styles from "./my.module.css";
// import { db } from '@/lib/firebase';
// import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

// type Extracted = {
//   category?: string;      // 분실물 대분류
//   subcategory?: string;   // 분실물 소분류
//   lost_date?: unknown;    // 분실 일자 (Timestamp | ISO 문자열 등)
//   lost_data?: unknown;    // (오타로 들어올 경우 대비)
//   region?: string;        // 분실 장소
// };

// type TableRow = {
//   id: string;
//   major: string; // 대분류
//   minor: string; // 소분류
//   date: string;  // 일자 (표시용 문자열)
//   place: string; // 장소
// };

// const PAGE_SIZE = 10;

// const formatDate = (raw: unknown): string => {
//   // Firestore Timestamp
//   if (raw && typeof raw === "object" && "toDate" in (raw as any)) {
//     const d = (raw as Timestamp).toDate();
//     return d.toLocaleDateString("ko-KR", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     });
//   }
//   // ISO 또는 일반 문자열
//   if (typeof raw === "string") {
//     const t = new Date(raw);
//     if (!isNaN(t.getTime())) {
//       return t.toLocaleDateString("ko-KR", {
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//       });
//     }
//     return raw; // 자유 텍스트면 그대로
//   }
//   return "-";
// };

// export default function MyPage() {

//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [totalPages, setTotalPages] = useState<number>(1);

//   const [rows, setRows] = useState<TableRow[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   // 페이지네이션(페이지 번호 묶음) 계산
//   const chunkSize = 10;
//   const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
//   const startPage = chunkIndex * chunkSize + 1;
//   const endPage = Math.min(startPage + chunkSize - 1, totalPages);
//   const prevChunkStart = Math.max(1, startPage - chunkSize);
//   const nextChunkStart = Math.min(totalPages, startPage + chunkSize);

//   useEffect(() => {
//     let mounted = true;

//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const q = query(
//           collection(db, "lost_items"),
//           orderBy("createdAt", "desc")
//         );
//         const snap = await getDocs(q);
//         if (!mounted) return;

//   const items: TableRow[] = snap.docs.map((d) => {
//           const data = d.data() as { extracted?: Extracted };
//           const ex = data?.extracted ?? {};

//           const major = ex.category ?? "-";
//           const minor = ex.subcategory ?? "-";
//           // lost_date를 우선 사용, 혹시 오타로 lost_data가 들어온 경우도 대비
//           const date = formatDate(ex.lost_date ?? ex.lost_data);
//           const place = ex.region ?? "-";

//           return { id: d.id, major, minor, date, place };
//         });
//         console.debug(`[MyPage] fetched ${snap.size} documents from lost_items`);
//         if (snap.size === 0) {
//           setError("컬렉션에 문서가 없습니다: 'lost_items' (snap.size=0). 컬렉션명/보안규칙/데이터 존재 여부를 확인하세요.");
//         } else {
//           setError(null);
//         }

//         setRows(items);
//         setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
//       } catch (e) {
//         console.error("failed to fetch lost_items", e);
//         setError("데이터를 불러오는 중 오류가 발생했습니다.");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     })();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // 현재 페이지에 보여줄 행 슬라이스
//   const pagedRows = rows.slice(
//     (currentPage - 1) * PAGE_SIZE,
//     currentPage * PAGE_SIZE
//   );

//   return (
//     <main className={styles.main}>
//       <Panel>
//         <div className={styles.header}>
//           <h1 className={styles.title}>나의 분실물 조회</h1>
//         </div>

//         <div className={styles.container}>
//           <section className={styles.tableWrap}>
//             <table className={styles.table}>
//               <thead>
//                 <tr className={styles.tableHeaderRow}>
//                   <th>인덱스</th>
//                   <th>분실물 대분류</th>
//                   <th>분실물 소분류</th>
//                   <th>분실 일자</th>
//                   <th>분실 장소</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading && (
//                   <tr className={styles.emptyRow}>
//                     <td colSpan={5} className={styles.emptyCell}>
//                       로딩 중...
//                     </td>
//                   </tr>
//                 )}

//                 {error && !loading && (
//                   <tr className={styles.emptyRow}>
//                     <td colSpan={5} className={styles.emptyCell}>
//                       {error}
//                     </td>
//                   </tr>
//                 )}

//                 {!loading && !error && pagedRows.length === 0 && (
//                   <tr className={styles.emptyRow}>
//                     <td colSpan={5} className={styles.emptyCell}>
//                       데이터가 없습니다
//                     </td>
//                   </tr>
//                 )}

//                 {!loading &&
//                   !error &&
//                   pagedRows.map((r, i) => {
//                     const index = (currentPage - 1) * PAGE_SIZE + i + 1; // 인덱스 번호
//                     return (
//                       <tr key={r.id}>
//                         <td>{index}</td>
//                         <td>{r.major}</td>
//                         <td>{r.minor}</td>
//                         <td>{r.date}</td>
//                         <td>{r.place}</td>
//                       </tr>
//                     );
//                   })}
//               </tbody>
//             </table>

//             {/* 페이지네이션 */}
//             <div className={styles.pagination}>
//               <button
//                 className={styles.prevArrow}
//                 aria-label="이전 묶음"
//                 onClick={() => setCurrentPage(prevChunkStart)}
//                 type="button"
//                 disabled={startPage === 1}
//               >
//                 ‹
//               </button>

//               <div
//                 className={styles.pageNumbers}
//                 role="navigation"
//                 aria-label="페이지 네비게이션"
//               >
//                 {Array.from(
//                   { length: Math.max(0, endPage - startPage + 1) },
//                   (_, i) => startPage + i
//                 ).map((p) => (
//                   <button
//                     key={p}
//                     className={p === currentPage ? styles.current : undefined}
//                     onClick={() => setCurrentPage(p)}
//                     aria-current={p === currentPage ? "page" : undefined}
//                     aria-label={`페이지 ${p}`}
//                     type="button"
//                   >
//                     {p}
//                   </button>
//                 ))}
//               </div>

//               <button
//                 className={styles.nextArrow}
//                 aria-label="다음 묶음"
//                 onClick={() => setCurrentPage(nextChunkStart)}
//                 type="button"
//                 disabled={endPage === totalPages}
//               >
//                 ›
//               </button>
//             </div>
//           </section>

//           <button className={styles.floatingButton} type="button">
//             <Image src="/pawIcon-white.svg" alt="paw" width={25} height={25} />
//             <span>분실물 등록</span>
//           </button>
//         </div>
//       </Panel>
//     </main>
//   );
// }

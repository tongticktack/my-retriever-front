// import Image from "next/image";
// import { useEffect, useState } from "react";
// import Panel from "@/components/Panel";
// import styles from "./my.module.css";
// import { db, auth } from "@/lib/firebase";
// import {collection,getDocs,query,orderBy,limit,where} from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";

// type TableRow = {
//   id: string;
//   major: string; // extracted.category
//   minor: string; // extracted.subcategory
//   date: string;  // extracted.lost_date (그대로 문자열로 표시)
//   place: string; // extracted.region
// };

// const PAGE_SIZE = 10;

// export default function MyPage() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [rows, setRows] = useState<TableRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [uid, setUid] = useState<string | null>(null);

//   // 페이지 번호 묶음 계산
//   const chunkSize = 10;
//   const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
//   const startPage = chunkIndex * chunkSize + 1;
//   const endPage = Math.min(startPage + chunkSize - 1, totalPages);
//   const prevChunkStart = Math.max(1, startPage - chunkSize);
//   const nextChunkStart = Math.min(totalPages, startPage + chunkSize);

//   // 1) 로그인 상태 구독해서 uid 획득
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (user) => {
//       setUid(user?.uid ?? null);
//     });
//     return () => unsub();
//   }, []);

//   // 2) uid를 이용해 sources.user_id == uid 인 문서만 조회
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // 로그인 사용자 없음 → 안내 문구
//         if (!uid) {
//           setRows([]);
//           setTotalPages(1);
//           setError("이용자가 아니라서 조회가 불가능해요 !");
//           return;
//         }

//         // ⚠️ created_at 으로 정렬 (스키마 기준)
//         // ⚠️ where + orderBy 조합은 복합 인덱스가 필요할 수 있음(콘솔 안내 링크로 생성)
//         const q = query(
//           collection(db, "lost_items"),
//           where("sources.user_id", "==", uid),
//           orderBy("created_at", "desc"),
//           limit(500) // 필요 시 조정
//         );

//         const snap = await getDocs(q);

//         const items: TableRow[] = snap.docs.map((d) => {
//           const ex: any = (d.data() as any)?.extracted ?? {};
//           return {
//             id: d.id,
//             major: String(ex.category ?? "-"),
//             minor: String(ex.subcategory ?? "-"),
//             date: String(ex.lost_date ?? "-"),
//             place: String(ex.region ?? "-"),
//           };
//         });

//         if (!mounted) return;
//         setRows(items);
//         setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
//       } catch (e: any) {
//         console.error("[fetch error]", e);
//         if (!mounted) return;
//         setError("데이터를 불러오는 중 오류가 발생했습니다.");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [uid]);

//   // 현재 페이지 분할
//   const paged = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
//                     <td colSpan={5} className={styles.emptyCell}>로딩 중...</td>
//                   </tr>
//                 )}

//                 {error && !loading && (
//                   <tr className={styles.emptyRow}>
//                     <td colSpan={5} className={styles.emptyCell}>{error}</td>
//                   </tr>
//                 )}

//                 {!loading && !error && paged.length === 0 && (
//                   <tr className={styles.emptyRow}>
//                     <td colSpan={5} className={styles.emptyCell}>데이터가 없습니다</td>
//                   </tr>
//                 )}

//                 {!loading && !error && paged.map((r, i) => {
//                   const index = (currentPage - 1) * PAGE_SIZE + i + 1;
//                   return (
//                     <tr key={r.id} className={styles.tableDataRow}>
//                       <td>{index}</td>
//                       <td>{r.major}</td>
//                       <td>{r.minor}</td>
//                       <td>{r.date}</td>
//                       <td>{r.place}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>

//             {/* 페이지네비게이션 */}
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

//               <div className={styles.pageNumbers} role="navigation" aria-label="페이지 네비게이션">
//                 {Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i).map((p) => (
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



import Image from "next/image";
import { useEffect, useState } from "react";
import Panel from "@/components/Panel";
import styles from "./my.module.css";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
        const q = query(
          collection(db, "lost_items"),
          orderBy("created_at", "desc"),
          limit(500)
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



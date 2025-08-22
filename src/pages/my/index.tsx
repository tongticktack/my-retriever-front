import Image from "next/image";
import { useEffect, useState } from "react";
import Panel from "@/components/Panel";
import styles from "./my.module.css";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import DetailPage from "./detail";
import { onAuthStateChanged, User } from "firebase/auth";

type TableRow = {
  id: string;
  major: string; // # extracted.category
  minor: string; // # extracted.subcategory
  date: string;  // # extracted.lost_date (그대로 문자열로 표시)
  place: string; // # extracted.region
};


const PAGE_SIZE = 10;

export default function MyPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // # 페이지 번호 묶음 계산
  const chunkSize = 10;
  const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
  const startPage = chunkIndex * chunkSize + 1;
  const endPage = Math.min(startPage + chunkSize - 1, totalPages);
  const prevChunkStart = Math.max(1, startPage - chunkSize);
  const nextChunkStart = Math.min(totalPages, startPage + chunkSize);
  

  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      (async () => {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        if (!currentUser) {
          // # 미가입 사용자일 때
          setRows([]);
          setTotalPages(1);
          setError('회원이 아니라서 조회할 수 없어요 !');
          setLoading(false);
          return;
        }

        try {
          const itemsCol = collection(db, 'lost_items', currentUser.uid, 'items');
          const q = query(itemsCol, orderBy('created_at', 'desc'), limit(500));
          const snap = await getDocs(q);

          const items: TableRow[] = snap.docs.map((d) => {
            const data: any = d.data() as any;
            const ex: any = data?.extracted ?? {};
            return {
              id: d.id,
              major: String(ex.category ?? '-'),
              minor: String(ex.subcategory ?? '-'),
              date: String(ex.lost_date ?? '-'),
              place: String(ex.region ?? '-'),
            };
          });

          if (!mounted) return;
          // # 가입은 했지만 등록 기록이 없는 회원일 때
          setRows(items);
          setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
          if (snap.size === 0) {
            setError('등록하신 적이 없습니다 !');
          } else {
            setError(null);
          }
        } catch (e: any) {
          console.error('[fetch error]', e);
          if (!mounted) return;
          setError(e?.message ?? '데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      try { unsub(); } catch { /* ignore */ }
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
            {(error && !loading) || (!loading && !error && paged.length === 0) ? (
              <div className={styles.tableOverlay}>
                <div className={styles.messageBox}>
                  <img src="/Smile.svg" alt="smile" />
                  <div>{error ?? '데이터가 없습니다'}</div>
                </div>
              </div>
            ) : null}
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

                {!loading && !error && paged.map((r, i) => {
                  const index = (currentPage - 1) * PAGE_SIZE + i + 1;
                  const handleClick = async () => {
                    if (!user) return;
                    try {
                      setLoadingDetail(true);
                      const dref = doc(db, 'lost_items', user.uid, 'items', r.id);
                      const dsnap = await getDoc(dref);
                      if (!dsnap.exists()) {
                        setDetailItem(null);
                        setDetailOpen(true);
                      } else {
                        setDetailItem({ id: dsnap.id, ...(dsnap.data() as any) });
                        setDetailOpen(true);
                      }
                    } catch (err) {
                      console.error('failed to load detail', err);
                      setDetailItem(null);
                      setDetailOpen(true);
                    } finally {
                      setLoadingDetail(false);
                    }
                  };
                  return (
                    <tr
                      key={r.id}
                      className={styles.tableDataRow}
                      onClick={handleClick}
                      role={user ? "button" : undefined}
                      tabIndex={user ? 0 : undefined}
                      onKeyDown={(e) => { if (user && (e.key === 'Enter' || e.key === ' ')) handleClick(); }}
                      style={{ cursor: user ? 'pointer' : 'default' }}
                    >
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

            {!((error && !loading) || (!loading && !error && paged.length === 0)) && (
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
            )}
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
// import { useRouter } from "next/router";
// import Panel from "@/components/Panel";
// import styles from "./my.module.css";
// import { db, auth } from "@/lib/firebase";
// import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
// import { onAuthStateChanged, User } from "firebase/auth";

// type TableRow = {
//   id: string;
//   major: string; // # extracted.category
//   minor: string; // # extracted.subcategory
//   date: string;  // # extracted.lost_date (그대로 문자열로 표시)
//   place: string; // # extracted.region
// };


// const PAGE_SIZE = 10;

// export default function MyPage() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [rows, setRows] = useState<TableRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [user, setUser] = useState<User | null>(null);

//   // # 페이지 번호 묶음 계산
//   const chunkSize = 10;
//   const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
//   const startPage = chunkIndex * chunkSize + 1;
//   const endPage = Math.min(startPage + chunkSize - 1, totalPages);
//   const prevChunkStart = Math.max(1, startPage - chunkSize);
//   const nextChunkStart = Math.min(totalPages, startPage + chunkSize);
  

//   useEffect(() => {
//     let mounted = true;
//     const unsub = onAuthStateChanged(auth, (currentUser: User | null) => {
//       setUser(currentUser);
//       (async () => {
//         if (!mounted) return;
//         setLoading(true);
//         setError(null);

//         if (!currentUser) {
//           // # 미가입 사용자일 때
//           setRows([]);
//           setTotalPages(1);
//           setError('회원이 아니라서 조회할 수 없어요 !');
//           setLoading(false);
//           return;
//         }

//         try {
//           const itemsCol = collection(db, 'lost_items', currentUser.uid, 'items');
//           const q = query(itemsCol, orderBy('created_at', 'desc'), limit(500));
//           const snap = await getDocs(q);

//           const items: TableRow[] = snap.docs.map((d) => {
//             const data: any = d.data() as any;
//             const ex: any = data?.extracted ?? {};
//             return {
//               id: d.id,
//               major: String(ex.category ?? '-'),
//               minor: String(ex.subcategory ?? '-'),
//               date: String(ex.lost_date ?? '-'),
//               place: String(ex.region ?? '-'),
//             };
//           });

//           if (!mounted) return;
//           // # 가입은 했지만 등록 기록이 없는 회원일 때
//           setRows(items);
//           setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
//           if (snap.size === 0) {
//             setError('등록하신 적이 없습니다 !');
//           } else {
//             setError(null);
//           }
//         } catch (e: any) {
//           console.error('[fetch error]', e);
//           if (!mounted) return;
//           setError(e?.message ?? '데이터를 불러오는 중 오류가 발생했습니다.');
//         } finally {
//           if (mounted) setLoading(false);
//         }
//       })();
//     });

//     return () => {
//       mounted = false;
//       try { unsub(); } catch { /* ignore */ }
//     };
//   }, []);

//   const paged = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
//   const router = useRouter();

//   return (
//     <main className={styles.main}>
//       <Panel>
//         <div className={styles.header}>
//           <h1 className={styles.title}>나의 분실물 조회</h1>
//         </div>

//         <div className={styles.container}>
//           <section className={styles.tableWrap}>
//             {(error && !loading) || (!loading && !error && paged.length === 0) ? (
//               <div className={styles.tableOverlay}>
//                 <div className={styles.messageBox}>
//                   <img src="/Smile.svg" alt="smile" />
//                   <div>{error ?? '데이터가 없습니다'}</div>
//                 </div>
//               </div>
//             ) : null}
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

//             {!((error && !loading) || (!loading && !error && paged.length === 0)) && (
//               <div className={styles.pagination}>
//                 <button
//                   className={styles.prevArrow}
//                   aria-label="이전 묶음"
//                   onClick={() => setCurrentPage(prevChunkStart)}
//                   type="button"
//                   disabled={startPage === 1}
//                 >
//                   ‹
//                 </button>

//                 <div className={styles.pageNumbers} role="navigation" aria-label="페이지 네비게이션">
//                   {Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i).map((p) => (
//                     <button
//                       key={p}
//                       className={p === currentPage ? styles.current : undefined}
//                       onClick={() => setCurrentPage(p)}
//                       aria-current={p === currentPage ? "page" : undefined}
//                       aria-label={`페이지 ${p}`}
//                       type="button"
//                     >
//                       {p}
//                     </button>
//                   ))}
//                 </div>

//                 <button
//                   className={styles.nextArrow}
//                   aria-label="다음 묶음"
//                   onClick={() => setCurrentPage(nextChunkStart)}
//                   type="button"
//                   disabled={endPage === totalPages}
//                 >
//                   ›
//                 </button>
//               </div>
//             )}
//           </section>
//           {user && (
//             <button className={styles.floatingButton} type="button" onClick={() => router.push('/my/register')}>
//               <Image src="/pawIcon-white.svg" alt="paw" width={20} height={20} />
//               <span>분실물 등록</span>
//             </button>
//           )}
//         </div>
//       </Panel>

//     </main>
//   );
// }



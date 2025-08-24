import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Panel from "@/components/Panel";
import styles from "./my.module.css";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc, deleteDoc } from "firebase/firestore";
import DetailPage from "./detail";
import { onAuthStateChanged, User } from "firebase/auth";

type TableRow = {
  id: string;
  major: string; // extracted.category
  minor: string; // extracted.subcategory
  date: string;  // extracted.lost_date
  place: string; // extracted.region
};

type AlertModalProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

function AlertModal({ open, message, onClose }: AlertModalProps) {
  if (!open) return null;

  // ConfirmModal과 동일한 CSS 클래스 이름을 사용합니다.
  return (
    <div className={styles.confirmModalOverlay} role="dialog" aria-modal="true">
      <div className={styles.confirmModal}>
        <img src="/Smile.svg" alt="smile" className={styles.confirmIcon} />
        <h3 className={styles.confirmTitle}>알림</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          {/* 버튼만 하나로 변경하고, 새로 만든 CSS 클래스를 적용합니다. */}
          <button className={styles.alertOkBtn} onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  );
}
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);



  // 페이지 번호 묶음 계산
  const chunkSize = 10;
  const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
  const startPage = chunkIndex * chunkSize + 1;
  const endPage = Math.min(startPage + chunkSize - 1, totalPages);
  const prevChunkStart = Math.max(1, startPage - chunkSize);
  const nextChunkStart = Math.min(totalPages, startPage + chunkSize);

  // 사용자 인증 상태 감지 및 firebase에서 분실물 목록 불러오기
  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      (async () => {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        if (!currentUser) {
          // crrentUse id가 없는 비정상적인 접근일 때 -> 다시 로그인 페이지로
          router.push('/login');
          return;
        }

        try {
          // firebase에서 문서 불러오기
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
          // 회원 중에 등록 기록이 없는 회원일 때
          setRows(items);
          setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
          if (snap.size === 0) {
            setError('등록하신 분실물이 없어요!');
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
  const router = useRouter();

  const handleDelete = async (itemId: string) => {
    if (!user) {
      alert('오류: 사용자 정보가 없습니다.');
      return;
    }

    try {
      // 1. Firestore 문서 경로 참조
      const itemRef = doc(db, 'lost_items', user.uid, 'items', itemId);

      // 2. Firestore에서 문서 삭제
      await deleteDoc(itemRef);

      // 3. 현재 화면의 목록(state)에서도 삭제된 항목 제거
      setRows(currentRows => currentRows.filter(row => row.id !== itemId));

      // 4. 모달 닫기
      setDetailOpen(false);
      setShowSuccessModal(true);

    } catch (err) {
      console.error("삭제 중 오류 발생: ", err);
      alert('삭제하는 중 오류가 발생했습니다.');
    }
  };
  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>나의 분실물 조회</h1>
        </div>

        <div className={styles.container}>
          <section className={styles.tableWrap}>

            {/* 🔹 에러 or 데이터 없음 표시 */}
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
                {/* 🔹 로딩 중일 때 */}
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

            {/* 🔹 페이지네이션 */}
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

          {/* 🔹 분실물 등록 버튼 (로그인 상태일 때만) */}
          {user && (<button className={styles.floatingButton} type="button" onClick={() => router.push('/my/register')}>
            <Image src="/pawIcon.svg" alt="paw" width={20} height={20} />
            <span>분실물 등록</span>
          </button>
          )}
        </div>
      </Panel>
        <DetailPage open={detailOpen}
          loading={loadingDetail} item={detailItem}
          onClose={() => setDetailOpen(false)}
          onDelete={() => {
            if (detailItem?.id) {
              handleDelete(detailItem.id);
            }
          }} />
        <AlertModal
          open={showSuccessModal}
          message="삭제가 완료되었어요!"
          onClose={() => setShowSuccessModal(false)}
        />
    </main>
  );
}

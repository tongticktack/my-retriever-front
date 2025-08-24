import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Panel from "@/components/Panel";
import styles from "./my.module.css";
import { db, auth, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import DetailPage from "./detail";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref as storageRef, deleteObject } from "firebase/storage";
type TableRow = {
  id: string;
  major: string; // extracted.category
  minor: string; // extracted.subcategory
  date: string;  // extracted.lost_date
  place: string; // extracted.region
  fullData: any; // 전체 데이터 객체
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
        <img src="/Smile.svg" className={styles.confirmIcon} />
        <h3 className={styles.confirmTitle}>
          <p className={styles.confirmMessage}>{message}
          </p>
        </h3>
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
  const [showFoundModal, setShowFoundModal] = useState(false);


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
          const userDocRef = doc(db, 'lost_items', currentUser.uid);

          // 2. getDocs (여러 문서) 대신 getDoc (단일 문서)으로 가져옵니다.
          const docSnap = await getDoc(userDocRef);

          let items: TableRow[] = [];

          // 3. 문서가 존재하면, 그 안의 'items' 배열 데이터를 가져옵니다.
          if (docSnap.exists()) {
            const itemsArray = docSnap.data().items || [];

            // created_at 기준으로 내림차순 정렬 (배열이므로 클라이언트에서 정렬)
            // Firestore Timestamp 객체는 toMillis()로 변환하여 비교합니다.
            itemsArray.sort((a: any, b: any) =>
              (b.created_at?.toMillis() ?? 0) - (a.created_at?.toMillis() ?? 0)
            );

            items = itemsArray.map((itemData: any) => {
              const ex = itemData?.extracted ?? {};
              return {
                id: itemData.id,
                major: String(ex.category ?? '-'),
                minor: String(ex.subcategory ?? '-'),
                date: String(ex.lost_date ?? '-'),
                place: String(ex.region ?? '-'),
                fullData: itemData,
              };
            });
            setRows(items);
          }
          if (!mounted) return;
          // 회원 중에 등록 기록이 없는 회원일 때
          setRows(items);
          setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
          if (items.length === 0) {
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

  const performDelete = async (itemId: string, onSuccess: () => void) => {
    if (!user) return;

    const rowToRemove = rows.find(row => row.id === itemId);
    if (!rowToRemove) {
      console.error("삭제할 아이템을 찾을 수 없습니다.");
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }
    const itemObjectToRemove = rowToRemove.fullData;

    try {
      // Storage에서 이미지 파일 삭제
      const mediaIds = itemObjectToRemove.media_ids;
      if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
        const deletePromises = mediaIds.map(filePath => {
          const fileRef = storageRef(storage, filePath);
          return deleteObject(fileRef).catch(err => console.warn(`파일 삭제 실패: ${filePath}`, err));
        });
        await Promise.all(deletePromises);
      }

      // Firestore에서 배열 항목 삭제
      const userDocRef = doc(db, 'lost_items', user.uid);
      await updateDoc(userDocRef, {
        items: arrayRemove(itemObjectToRemove)
      });

      // UI 상태 업데이트 및 성공 콜백 실행
      setRows(currentRows => currentRows.filter(row => row.id !== itemId));
      setDetailOpen(false);
      onSuccess(); // ◀️ 전달받은 성공 함수 실행

    } catch (err) {
      console.error("삭제 중 오류 발생: ", err);
      alert('삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 기존 삭제 핸들러
  const handleDelete = (itemId: string) => {
    performDelete(itemId, () => setShowSuccessModal(true));
  };

  // '찾았어요!' 버튼을 위한 새로운 핸들러
  const handleFound = (itemId: string) => {
    performDelete(itemId, () => setShowFoundModal(true));
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
                  const handleClick = () => {
                    // Firestore에 다시 요청하지 않고,
                    // 'r' 객체에 이미 담겨있는 원본 데이터(fullData)를 바로 사용합니다.
                    setDetailItem(r.fullData);
                    setDetailOpen(true);
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
        }}
        onFound={() => {
          if (detailItem?.id) {
            handleFound(detailItem.id);
          }
        }}  
        />
      <AlertModal
        open={showSuccessModal}
        message="삭제가 완료되었어요!"
        onClose={() => setShowSuccessModal(false)}
      />
      <AlertModal
        open={showFoundModal}
        message="찾았어요! 처리가 완료되었어요!"
        onClose={() => setShowFoundModal(false)}
      />
    </main>
  );
}

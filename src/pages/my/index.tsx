import Image from "next/image";
import { useEffect, useState } from "react";
import Panel from "@/components/Panel";
import styles from "./my.module.css";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function MyPage() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 1; // 여길 db에서 받아와야 함, 일단 설정 값

  const [rows, setRows] = useState<Array<{ major: string; minor: string; date: string; place: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  
  const chunkSize = 10;
  const chunkIndex = Math.floor((currentPage - 1) / chunkSize);
  const startPage = chunkIndex * chunkSize + 1;
  const endPage = Math.min(startPage + chunkSize - 1, totalPages);
  const prevChunkStart = Math.max(1, startPage - chunkSize);
  const nextChunkStart = Math.min(totalPages, startPage + chunkSize);

  // helper: try many possible keys to extract a value from the extracted object
  const pick = (raw: any, keys: string[]) => {
    if (raw == null) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) {
      // if array of objects or strings, stringify
      const first = raw[0];
      if (typeof first === 'string') return raw.join(', ');
      if (first && typeof first === 'object') return raw.map((r: any) => {
        return (r.text || r.content || Object.values(r).join(' '))
      }).join('; ');
      return String(raw);
    }
    if (typeof raw === 'object') {
      for (const k of keys) {
        if (k in raw && raw[k] != null) return String(raw[k]);
      }
      // common nested fields
      if ('text' in raw) return String(raw.text);
      if ('content' in raw) return String(raw.content);
      // fallback to joining primitive values
      try {
        return Object.entries(raw).map(([k, v]) => `${k}: ${String(v)}`).join('; ');
      } catch (e) {
        return String(raw);
      }
    }
    return String(raw);
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'lost_items'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!mounted) return;
        const items = snap.docs.map((d) => {
          const doc = d.data();
          const raw = doc.extracted;

          const major = pick(raw, ['majorCategory','category','대분류','main','type','kind','label']);
          const minor = pick(raw, ['minorCategory','subcategory','소분류','sub','subtype']);
          const date = pick(raw, ['lostDate','date','dateString','분실일자','foundDate']);
          const place = pick(raw, ['lostPlace','place','location','장소','where']);

          return { major, minor, date, place };
        });
        setRows(items);
      } catch (e) {
        console.error('failed to fetch lost_items', e);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

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
            <Image src="/pawIcon-white.svg" alt="paw" width={25} height={25} />
            <span>분실물 등록</span>
          </button>
        </div>
      </Panel>

  {/* inline popovers are rendered inside filter buttons now */}
    </main>
  );
}

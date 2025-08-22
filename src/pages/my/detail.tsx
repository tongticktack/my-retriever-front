import React from 'react';
import styles from './detail.module.css';
import { useRouter } from 'next/router';

type Props = {
  open: boolean;
  loading?: boolean;
  item: any | null;
  onClose: () => void;
};

export default function DetailPage({ open, loading, item, onClose }: Props) {
  const router = useRouter();
  if (!open) return null;

  return (
    <div className={styles.detailOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div>불러오는 중...</div>
        ) : item ? (
          <div className={styles.content}>
            <header className={styles.header}>
              <h3>{item.item_name ?? '상세 정보'}</h3>
            </header>

            <section className={styles.infoBox}>
              <div className={styles.meta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>분실 장소</span>
                  <span className={styles.metaValue}>{item.extracted?.region ?? '-'}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>분실 일자</span>
                  <span className={styles.metaValue}>{item.extracted?.lost_date ?? '-'}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>대/소분류</span>
                  <span className={styles.metaValue}>{item.extracted?.category ?? '-'} / {item.extracted?.subcategory ?? '-'}</span>
                </div>
              </div>

              <div className={styles.note}>
                <div className={styles.noteLabel}>특이사항</div>
                <div className={styles.noteText}>{item.note ? <div style={{ whiteSpace: 'pre-wrap' }}>{item.note}</div> : '-'}</div>
              </div>
            </section>

            <div className={styles.actions}>
              <button type="button" className={styles.popoverBtn} onClick={onClose}>닫기</button>
              <button type="button" className={styles.popoverPrimary} onClick={() => { onClose(); router.push(`/my/register?id=${item.id}`); }}>수정</button>
            </div>
          </div>
        ) : (
          <div>데이터를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import styles from './detail.module.css';
import { useRouter } from 'next/router';
import { storage } from '@/lib/firebase';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';

type Props = {
  open: boolean;
  loading?: boolean;
  item: any | null;
  onClose: () => void;
};

export default function DetailPage({ open, loading, item, onClose }: Props) {
  const router = useRouter();
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const mediaKey = item?.id; // Use item id as a key to re-trigger effect

  useEffect(() => {
    if (!open || !item?.media_ids) {
      setMediaUrls([]);
      return;
    }

    let isMounted = true;
    const raw = item.media_ids;
    const normalizedMediaIds: string[] = (() => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
      if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
      if (typeof raw === 'object') return Object.values(raw).map(String).filter(Boolean);
      return [];
    })();

    if (normalizedMediaIds.length === 0) {
      setMediaUrls([]);
      return;
    }

    Promise.all(
      normalizedMediaIds.map((idOrName) => {
        const path = idOrName.includes('/') ? idOrName : `lost/${idOrName}`;
        return getDownloadURL(storageRef(storage, path)).catch((err) => {
          console.warn(`Failed to load media: ${idOrName}`, err);
          return null; // Return null on error to not break Promise.all
        });
      })
    ).then((urls) => {
      if (isMounted) {
        setMediaUrls(urls.filter((url): url is string => !!url));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [open, mediaKey]);

  if (!open) return null;

  return (
    <div className={styles.detailOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : item ? (
          <div className={styles.content}>
            <header className={styles.header}>
              <h3>상세 정보</h3>
            </header>

            <section className={styles.infoBox}>
              <div className={styles.leftCol}>
                <div className={styles.meta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>분실 물품</span>
                    <span className={styles.metaValue}>{item.item_name ?? '-'}</span>
                  </div>
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
              </div>

              {mediaUrls.length > 0 && (
                <div className={styles.mediaColumn}>
                  {mediaUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`분실물 사진 ${idx + 1}`}
                      className={styles.thumbnail}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
            </section>

            <div className={styles.actions}>
              <button type="button" className={styles.popoverBtn} onClick={onClose}>닫기</button>
              <button type="button" className={styles.popoverPrimary} onClick={() => { onClose(); router.push(`/my/register?id=${item.id}`); }}>수정</button>
            </div>
          </div>
        ) : (
          <div className={styles.error}>데이터를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
}

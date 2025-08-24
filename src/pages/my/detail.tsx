/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import styles from './detail.module.css';
import { useRouter } from 'next/router';
import { storage } from '@/lib/firebase';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';

interface ExtractedFields { category?: string; subcategory?: string; region?: string; lost_date?: string; }
interface LostItemRecord {
  id?: string;
  item_name?: string;
  note?: string;
  media_ids?: string[];
  extracted?: ExtractedFields;
  [k: string]: unknown;
}
type Props = {
  open: boolean;
  loading?: boolean;
  item: LostItemRecord | null;
  onClose: () => void;
  onDelete: () => void;
  onFound: () => void;
};

function ConfirmModal({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className={styles.confirmModalOverlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <img src="/Sad.svg" alt="warning" className={styles.confirmIcon} />
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button className={styles.confirmBtn} onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmFoundModal({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className={styles.confirmModalOverlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
  <img src="/Smile.svg" className={styles.confirmIcon} alt="confirm" />
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button className={styles.realbutton} onClick={onConfirm}>찾았어요!</button>
        </div>
      </div>
    </div>
  );
}

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DetailPage({ open, loading, item, onClose, onDelete, onFound }: Props) {
  const router = useRouter();
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFound, setShowFound] = useState(false);
  const mediaKey = item?.id;

  // 모달 open -> item.media_ids가 있을 때 Storage URL 비동기 로드
  useEffect(() => {

    // 모달 close or 미디어 없으면 초기화 후 종료
    if (!open || !item?.media_ids) {
      setMediaUrls([]);
      return;
    }

    let isMounted = true;

    // media_ids 정규화
    const rawIds: unknown = item.media_ids;
    const normalizedMediaIds: string[] = (() => {
      if (!rawIds) return [];
      if (Array.isArray(rawIds)) return rawIds.filter(Boolean).map(String);
      if (typeof rawIds === 'string') return rawIds.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (typeof rawIds === 'object') return Object.values(rawIds).map(String).filter(Boolean);
      return [];
    })();

    if (normalizedMediaIds.length === 0) {
      setMediaUrls([]);
      return;
    }

    // storage 경로 변환 -> getdownLoadURL 병렬 요청
    Promise.all(
      normalizedMediaIds.map((idOrName) => {
        const path = idOrName.includes('/') ? idOrName : `lost/${idOrName}`;
        return getDownloadURL(storageRef(storage, path)).catch((err) => {
          console.warn(`Failed to load media: ${idOrName}`, err);
          return null;
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
  }, [open, mediaKey, item?.media_ids]);

  if (!open) return null;

  const handleDeleteClick = () => {
    setShowConfirm(true); // window.confirm 대신 확인 모달 열기
  };

  const handleConfirmDelete = () => {
    onDelete(); // 실제 삭제 로직 실행
    setShowConfirm(false); // 확인 모달 닫기
  };

  const handleFoundClick = () => {
    setShowFound(true); // 확인 모달 닫기
  };

  const handleConfirmFound = () => {
    // '찾았어요!' 확정 시 부모의 onFound 호출 (삭제 + 성공 모달 표시 로직 상위에서 처리)
    onFound();
    setShowFound(false); // 자신(찾았어요 확인 모달) 닫기
  };
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
              <button type="button" className={styles.foundBtn} onClick={handleFoundClick}>
                찾았어요!
              </button>

              {/* 오른쪽 버튼 그룹 */}
              <div className={styles.actionsRight}>
                <button type="button" className={styles.popoverBtn} onClick={onClose}>닫기</button>
                <button type="button" className={styles.popoverPrimary} onClick={() => { onClose(); router.push(`/my/register?id=${item.id}`); }}>수정</button>
                <button type="button" className={styles.deleteBtn} onClick={handleDeleteClick}>삭제</button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.error}>데이터를 불러올 수 없습니다.</div>
        )}
        <ConfirmModal
          open={showConfirm}
          title="정말 삭제할까요?"
          message="삭제된 분실물 정보는 복구할 수 없어요."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}>
        </ConfirmModal>
        <ConfirmFoundModal
          open={showFound}
          title="정말 찾았나요?"
          message="처리된 분실물 정보는 복구할 수 없어요."
          onConfirm={handleConfirmFound}
          onCancel={() => setShowFound(false)}>
        </ConfirmFoundModal>
      </div>
    </div>

  );
}

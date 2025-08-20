import React, { useCallback, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ChatComposer.module.css';

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  sending?: boolean; // show loading indicator
  maxLength?: number;
  attachments: File[];
  onChangeAttachments: (files: File[]) => void;
  uploading?: boolean;
}

export default function ChatComposer({ value, onChange, onSend, disabled, placeholder, sending, maxLength, attachments, onChangeAttachments, uploading }: ChatComposerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composingRef = useRef(false); // IME 조합 중 여부
  const allowedTypes = useRef(new Set(['image/png','image/jpeg']));
  const MAX_ATTACHMENTS = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image
  const [notice, setNotice] = useState<string | null>(null);
  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3800);
    return () => clearTimeout(t);
  }, [notice]);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    let rejectedType = 0, rejectedSize = 0, rejectedOverLimit = 0;
    const newFiles: File[] = [];
    const existing = attachments;
    const currentLen = existing.length;
    for (const f of arr) {
      if (!allowedTypes.current.has(f.type)) { rejectedType++; continue; }
      if (f.size > MAX_FILE_SIZE) { rejectedSize++; continue; }
      if (currentLen + newFiles.length >= MAX_ATTACHMENTS) { rejectedOverLimit++; break; }
      const dup = existing.some(e => e.name === f.name && e.size === f.size && e.lastModified === f.lastModified) || newFiles.some(e => e.name === f.name && e.size === f.size && e.lastModified === f.lastModified);
      if (dup) continue; // duplicates silently skip
      newFiles.push(f);
    }
    if (!newFiles.length) {
      if (rejectedType || rejectedSize || rejectedOverLimit) {
        const parts: string[] = [];
        if (rejectedType) parts.push(`허용되지 않는 형식 ${rejectedType}개 (PNG/JPEG만 가능)`);
        if (rejectedSize) parts.push(`5MB 초과 ${rejectedSize}개`);
        if (rejectedOverLimit) parts.push(`최대 ${MAX_ATTACHMENTS}장 제한`);
        showNotice(parts.join(' · '));
      }
      return;
    }
    // Merge (avoid duplicates by name+size+lastModified)
    const merged = [...existing];
    newFiles.forEach(f => {
      if (merged.length < MAX_ATTACHMENTS) merged.push(f);
    });
    onChangeAttachments(merged.slice(0, MAX_ATTACHMENTS));
    if (rejectedType || rejectedSize || rejectedOverLimit) {
      const parts: string[] = [];
      if (rejectedType) parts.push(`형식 제외 ${rejectedType}`);
      if (rejectedSize) parts.push(`5MB 초과 ${rejectedSize}`);
      if (rejectedOverLimit) parts.push(`제한 초과`);
      showNotice(parts.join(' · '));
    }
  }, [attachments, onChangeAttachments, MAX_FILE_SIZE, showNotice]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (composingRef.current) return; // 조합 중에는 전송 금지 (첫 글자 남는 문제 방지)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
        // 즉시 DOM 반영 강제 (React state 비동기 반영 중 IME race 방지)
        if (inputRef.current) inputRef.current.value = '';
      }
    }
  }, [onSend, disabled, value]);

  return (
    <div className={styles.wrapper}>
      {attachments.length > 0 && (
        <div className={`${styles.attachments} ${styles.attachmentsTop}`} aria-label="선택된 이미지">
          {attachments.map((f, idx) => {
            const url = typeof window !== 'undefined' ? URL.createObjectURL(f) : '';
            return (
              <div key={idx} className={styles.thumb}>
                {url && <Image src={url} alt={f.name} width={60} height={60} onLoadingComplete={() => { URL.revokeObjectURL(url); }} className={styles.thumbImg} />}
                <button type="button" className={styles.removeBtn} aria-label="이미지 제거" onClick={() => {
                  const copy = attachments.slice();
                  copy.splice(idx, 1);
                  onChangeAttachments(copy);
                }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      {notice && (
        <div className={styles.notice} role="alert" aria-live="polite">{notice}</div>
      )}
      <div className={styles.composer}>
        <button
          type="button"
          className={styles.imageBtn}
          onClick={() => { if (!disabled && !uploading && attachments.length < MAX_ATTACHMENTS) fileInputRef.current?.click(); }}
          disabled={disabled || uploading || attachments.length >= MAX_ATTACHMENTS}
          title={uploading ? '업로드 중...' : (attachments.length >= MAX_ATTACHMENTS ? '최대 3개까지 첨부 가능' : '이미지 선택')}
          aria-label="이미지 추가"
        >
          <Image src="/clip.svg" alt="" width={12} height={12} aria-hidden="true" className={styles.imageIcon} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          style={{ display: 'none' }}
          onChange={e => {
            const before = attachments.length;
            handleFiles(e.target.files);
            const after = attachments.length;
            if (e.target.files && e.target.files.length && after === before) {
              // All rejected
              // (Silent fail; could show toast/alert if desired)
            }
            // allow re-select same file name by resetting value
            e.currentTarget.value = '';
          }}
        />
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={e => {
            const v = e.target.value;
            if (maxLength && v.length > maxLength) {
              onChange(v.slice(0, maxLength));
            } else {
              onChange(v);
            }
          }}
          onKeyDown={handleKey}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => {
            composingRef.current = false;
            // 조합 종료 후 value state 와 DOM 동기화
            if (inputRef.current && inputRef.current.value !== value) {
              inputRef.current.value = value;
            }
          }}
          // 입력창은 전송 중에도 계속 포커스를 유지하도록 disabled 제거
          disabled={false}
          maxLength={maxLength}
        />
  <button
    className={`${styles.sendBtn} ${sending ? styles.loading : ''}`}
    onMouseDown={(e) => { // 클릭 시 버튼이 포커스 훔치지 않게
      e.preventDefault();
    }}
    onClick={() => {
      onSend();
      requestAnimationFrame(() => { inputRef.current?.focus(); });
    }}
    disabled={disabled || sending || !value.trim()}
    aria-live="polite"
  >
          {sending ? <span className={styles.spinner} aria-label="전송중" /> : '전송'}
        </button>
      </div>
      {maxLength && (
        <div style={{display:'flex', justifyContent:'flex-end', width:'100%', fontSize:'0.65rem', color:'#9ca3af', marginTop:4}}>
          <span>{value.length}/{maxLength}{attachments.length ? ` · 이미지 ${attachments.length}/${MAX_ATTACHMENTS}` : ''}</span>
        </div>
      )}
    </div>
  );
}

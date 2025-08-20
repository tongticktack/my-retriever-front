import React, { useCallback, useRef } from 'react';
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
  const allowedTypes = useRef(new Set(['image/png','image/jpeg']));
  const MAX_ATTACHMENTS = 3;

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).filter(f => allowedTypes.current.has(f.type));
    if (!newFiles.length) return;
    // Merge (avoid duplicates by name+size+lastModified)
    const existing = attachments;
    const merged = [...existing];
    newFiles.forEach(f => {
      const dup = existing.some(e => e.name === f.name && e.size === f.size && e.lastModified === f.lastModified);
      if (!dup && merged.length < MAX_ATTACHMENTS) merged.push(f);
    });
    onChangeAttachments(merged.slice(0, MAX_ATTACHMENTS));
  }, [attachments, onChangeAttachments]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
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
          disabled={disabled}
          maxLength={maxLength}
        />
  <button className={`${styles.sendBtn} ${sending ? styles.loading : ''}`} onClick={onSend} disabled={disabled || !value.trim()} aria-live="polite">
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

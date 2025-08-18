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
}

export default function ChatComposer({ value, onChange, onSend, disabled, placeholder, sending, maxLength }: ChatComposerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }, [onSend, disabled, value]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.composer}>
        <button type="button" className={styles.imageBtn} disabled title="이미지 검색 준비중" aria-label="이미지 검색 (준비중)">
          <Image src="/clip.svg" alt="" width={12} height={12} aria-hidden="true" className={styles.imageIcon} />
        </button>
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
          <span>{value.length}/{maxLength}</span>
        </div>
      )}
    </div>
  );
}

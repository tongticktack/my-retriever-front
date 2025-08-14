import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './ChatComposer.module.css';

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  sending?: boolean; // show loading indicator
}

export default function ChatComposer({ value, onChange, onSend, disabled, placeholder, sending }: ChatComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME 조합 중에는 아무 것도 하지 않음
    if (isComposing) return;
    if (e.key === 'Enter') {
      // Shift / Alt / Ctrl / Meta 중 하나라도 눌리면 줄바꿈 허용 (기본 동작)
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return; // allow newline (Shift+Enter)
      // Plain Enter -> 전송
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }, [onSend, disabled, value, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // auto resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.composer}>
        <button type="button" className={styles.imageBtn} disabled title="이미지 검색 준비중" aria-label="이미지 검색 (준비중)">
          <Image src="/clip.svg" alt="" width={12} height={12} aria-hidden="true" className={styles.imageIcon} />
        </button>
        <textarea
          ref={inputRef}
          className={styles.input}
            placeholder={placeholder}
          value={value}
          rows={1}
          onChange={handleChange}
          onKeyDown={handleKey}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={disabled}
        />
        <button className={`${styles.sendBtn} ${sending ? styles.loading : ''}`} onClick={onSend} disabled={disabled || !value.trim()} aria-live="polite">
          {sending ? <span className={styles.spinner} aria-label="전송중" /> : '전송'}
        </button>
      </div>
    </div>
  );
}

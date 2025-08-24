 import { useState, useEffect, useRef, useCallback } from 'react';
 import styles from './DatePicker.module.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  max?: string; // YYYY-MM-DD
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  inputClassName?: string; // 제공 시 기존 input 스타일 유지
}

function formatYMD(d: Date) {
  // Local timezone safe formatting (avoids UTC shift from toISOString)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

 function parse(value: string) {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [y,m,day] = parts;
  const dt = new Date(y, m - 1, day);
  return isNaN(dt.getTime()) ? null : dt;
 }

export default function DatePicker({ value, onChange, max, placeholder = '날짜 선택', ariaLabel, disabled, inputClassName }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const maxDate = max ? parse(max) : null;
  const selected = parse(value);
  const initialMonth = selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1);
  const [cursorMonth, setCursorMonth] = useState(initialMonth);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  // If value changes externally adjust month
  useEffect(() => {
    if (selected) {
      setCursorMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
    // only react to concrete value changes; selected derived but stable for same value string
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const prevMonth = useCallback(() => {
    setCursorMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }, []);
  const nextMonth = useCallback(() => {
    setCursorMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }, []);

  const weeks: (Date | null)[] = [];
  const startDay = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1).getDay();
  for (let i=0;i<startDay;i++) weeks.push(null);
  const daysInMonth = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth()+1, 0).getDate();
  for (let d=1; d<=daysInMonth; d++) {
    weeks.push(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), d));
  }

  const canGoNext = (() => {
    if (!maxDate) return true;
    const next = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth()+1, 1);
    return next <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  })();

  const handleSelect = (d: Date) => {
    if (disabled) return;
    if (maxDate && d > maxDate) return;
    onChange(formatYMD(d));
    setOpen(false);
  };

  const renderDay = (d: Date | null, idx: number) => {
    if (!d) return <div key={idx} />;
    const ymd = formatYMD(d);
    const isSelected = selected && formatYMD(selected) === ymd;
    const isToday = formatYMD(today) === ymd;
    const disabledDay = !!(maxDate && d > maxDate);
    const weekend = d.getDay() === 0; // Sunday red
    const classNames = [styles.dayBtn];
    if (isSelected) classNames.push(styles.selected);
    if (isToday) classNames.push(styles.today);
    if (disabledDay) classNames.push(styles.disabled);
    if (weekend) classNames.push(styles.weekend);
    return (
      <button
        type="button"
        key={idx}
        className={classNames.join(' ')}
        onClick={() => !disabledDay && handleSelect(d)}
        disabled={disabledDay}
        aria-label={`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
      >{d.getDate()}</button>
    );
  };

  const label = `${cursorMonth.getFullYear()}년 ${cursorMonth.getMonth()+1}월`;
  const valueLabel = value ? value : placeholder;

  const calendar = open && (
    <div className={styles.calendar} role="dialog" aria-modal="false">
      <div className={styles.calHeader}>
        <button type="button" className={styles.navBtn} aria-label="이전 달" onClick={prevMonth}>‹</button>
        <div className={styles.monthLabel}>{label}</div>
        <button type="button" className={styles.navBtn} aria-label="다음 달" onClick={nextMonth} disabled={!canGoNext}>›</button>
      </div>
      <div className={styles.grid}>
        {['일','월','화','수','목','금','토'].map(d => <div key={d} className={styles.dow}>{d}</div>)}
        {weeks.map((d,i) => renderDay(d,i))}
      </div>
    </div>
  );

  if (inputClassName) {
    return (
      <div className={`${styles.wrapper} ${styles.fullWidth}`} ref={wrapRef}>
        <input
          type="text"
            aria-label={ariaLabel || placeholder}
          className={inputClassName}
          readOnly
          placeholder={placeholder}
          value={value}
          onClick={() => !disabled && setOpen(o => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled) setOpen(o => !o);
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          disabled={disabled}
        />
        {calendar}
      </div>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel || placeholder}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        <span className={!value ? styles.placeholder : ''}>{valueLabel}</span>
        <span className={styles.chevron}>📅</span>
      </button>
      {calendar}
    </div>
  );
 }

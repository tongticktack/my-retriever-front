import React from "react";
import styles from "./search.module.css";

type Props = {
  mode: "category" | "date" | "place";
  open: boolean;
  value: string | null;
  onChange: (v: string) => void;
  onClose: () => void;
};

export default function FilterModal({ mode, open, value, onChange, onClose }: Props) {
  if (!open) return null;

  return (
    <div className={styles.filterPopover} onClick={(e) => e.stopPropagation()}>
      <div className={styles.filterPopoverBody}>
        {mode === "category" && (
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={styles.popoverSelect}
          >
            <option value="">선택하세요</option>
            <option value="의류">의류</option>
            <option value="전자기기">전자기기</option>
            <option value="지갑">지갑</option>
            <option value="기타">기타</option>
          </select>
        )}

        {mode === "date" && (
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={styles.popoverInput}
          />
        )}

        {mode === "place" && (
          <input
            placeholder="장소를 입력하세요"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={styles.popoverInput}
          />
        )}
      </div>

      <div className={styles.filterPopoverFooter}>
        <button type="button" className={styles.popoverBtn} onClick={onClose}>
          닫기
        </button>
        <button type="button" className={styles.popoverPrimary} onClick={onClose}>
          적용
        </button>
      </div>
    </div>
  );
}

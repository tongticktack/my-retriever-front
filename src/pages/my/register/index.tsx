import Image from "next/image";
import { useState } from "react";
import Panel from "@/components/Panel";
import styles from "./register.module.css";
import { categories} from "@/components/map/category/categoryData";
import { useRef, useEffect } from "react";

export default function RegisterPage() {
  const [mainCategory, setMainCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [openMain, setOpenMain] = useState(false);
  const [openSub, setOpenSub] = useState(false);

  const currentSubs = (categories.find((c) => c.main === mainCategory) || { sub: [] }).sub;

  const mainRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  function handleFiles(files: FileList | File[]) {
    // revoke old preview URLs
    previews.forEach((p) => URL.revokeObjectURL(p));
    const arr = Array.from(files as FileList);
    setPhotos(arr);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  function removePhoto(index: number) {
    // revoke single preview URL
    const url = previews[index];
    if (url) URL.revokeObjectURL(url);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mainRef.current && !mainRef.current.contains(e.target as Node)) setOpenMain(false);
      if (subRef.current && !subRef.current.contains(e.target as Node)) setOpenSub(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>나의 분실물 등록</h1>
        </div>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>분실 정보</h2>

            <input className={styles.input} placeholder="분실 지역" aria-label="분실 지역" />
            <input className={styles.input} placeholder="분실 장소" aria-label="분실 장소" />
            <input className={styles.input} placeholder="분실 일자" aria-label="분실 일자" />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>물품 정보</h2>

            <input className={styles.input} placeholder="분실물명" aria-label="분실물명" />

            <div className={styles.row}>
              <input className={`${styles.input} ${styles.halfItem}`} placeholder="색상" aria-label="색상" />

              <div className={styles.half}>
                <div className={styles.customSelect} ref={mainRef}>
                  <button
                    type="button"
                    className={styles.selectToggle}
                    onClick={() => setOpenMain((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={openMain}
                  >
                    <span className={mainCategory ? styles.selectedText : styles.placeholderText}>
                      {mainCategory || "대분류"}
                    </span>
                    <span className={styles.chev}>▾</span>
                  </button>

                  {openMain && (
                    <div className={styles.options} role="listbox">
                      {categories.map((c) => (
                        <div
                          key={c.main}
                          className={styles.option}
                          role="option"
                          onClick={() => {
                            setMainCategory(c.main);
                            setSubCategory("");
                            setOpenMain(false);
                          }}
                        >
                          {c.main}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.customSelect} ref={subRef}>
                  <button
                    type="button"
                    className={styles.selectToggle}
                    onClick={() => setOpenSub((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={openSub}
                    disabled={!mainCategory}
                  >
                    <span className={subCategory ? styles.selectedText : styles.placeholderText}>
                      {subCategory || "소분류"}
                    </span>
                    <span className={styles.chev}>▾</span>
                  </button>

                  {openSub && (
                    <div className={styles.options} role="listbox">
                      {currentSubs.length === 0 ? (
                        <div className={styles.optionDisabled}>대분류를 선택해주세요</div>
                      ) : (
                        currentSubs.map((s) => (
                          <div
                            key={s}
                            className={styles.option}
                            role="option"
                            onClick={() => {
                              setSubCategory(s);
                              setOpenSub(false);
                            }}
                          >
                            {s}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <textarea className={styles.textarea} placeholder="특이 사항" aria-label="특이 사항" />

            <div className={styles.photoUploadWrapper}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenFile}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  // revoke old previews
                  previews.forEach((p) => URL.revokeObjectURL(p));
                  setPhotos([f]);
                  setPreviews([URL.createObjectURL(f)]);
                }}
              />

              <div
                className={`${styles.photoUploadBox} ${dragOver ? styles.dragOver : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer?.files && e.dataTransfer.files.length) {
                    handleFiles(e.dataTransfer.files);
                  }
                }}
              >
                {previews.length === 0 ? (
                  <div className={styles.photoPlaceholder}>
                    <div className={styles.plus}>＋</div>
                    <div>사진 업로드 (클릭 또는 드래그)</div>
                  </div>
                  ) : (
                  <div className={styles.previewGrid}>
                    {previews.map((src, i) => (
                      <div key={i} className={styles.previewItem}>
                        <img src={src} className={styles.previewImg} alt={`preview-${i}`} />
                        <button
                          type="button"
                          className={styles.removePhotoBtn}
                          aria-label={`사진 삭제 ${i + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(i);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className={styles.footer}>
            <button className={styles.submit} type="submit">
              등록
            </button>
          </div>
        </form>
      </Panel>

      {/* Floating icon to resemble the provided screen (non-functional) */}
      <button className={styles.floatingButton} type="button" aria-label="분실물 등록">
        <Image src="/pawIcon.svg" alt="paw" width={20} height={20} />
        <span>분실물 등록</span>
      </button>
    </main>
  );
}

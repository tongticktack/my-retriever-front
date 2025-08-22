import Image from "next/image";
import { useState } from "react";
import Panel from "@/components/Panel";
import styles from "./register.module.css";
import { categories} from "@/components/map/category/categoryData";
import { useRef, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes } from "firebase/storage";

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
  const [saving, setSaving] = useState(false);
  const [place, setPlace] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [showReview, setShowReview] = useState(false);

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

  const isValid = () => {
    return place && date && itemName && mainCategory && subCategory && note;
  };

  async function performSubmit() {
    if (saving) return;
    setSaving(true);
    try {
      // upload photos to storage and collect storage ids (fullPath)
      const mediaIds: string[] = [];
      for (const file of photos) {
        const path = `lost/${Date.now()}_${file.name}`;
        const pRef = storageRef(storage, path);
        await uploadBytes(pRef, file);
        mediaIds.push(pRef.fullPath);
      }

      const userId = auth?.currentUser?.uid || null;
      await addDoc(collection(db, "lost_items"), {
        user_id: userId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        extracted: {
          category: mainCategory,
          lost_date: date,
          region: place,
          subcategory: subCategory,
        },
        media_ids: mediaIds,
        item_name: itemName,
        note: note,
      });

      setShowSuccess(true);
      setPlace("");
      setDate("");
      setMainCategory("");
      setSubCategory("");
      setItemName("");
      setNote("");
      setPhotos([]);
      setPreviews([]);
    } catch (err) {
      console.error("저장 실패", err);
      alert("저장에 실패했습니다. 콘솔을 확인하세요.");
    } finally {
      setSaving(false);
    }
  }

  function handleRegisterClick() {
    if (!isValid()) {
      setShowMissing(true);
      return;
    }
    // show review modal before submitting
    setShowReview(true);
  }

  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>나의 분실물 등록</h1>
        </div>

  <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>등록 정보</h2>

            {/* 분실 장소 (full width) */}
            <div className={styles.fieldWrap}>
              <input
                className={styles.input}
                placeholder="분실 장소"
                aria-label="분실 장소"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>

            {/* 대분류 / 소분류 side-by-side */}
            <div className={styles.row}>
              <div className={styles.halfItem}>
                <div className={styles.fieldWrap}>
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
                  </div>
              </div>

              <div className={styles.halfItem}>
                <div className={styles.fieldWrap}>
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
            </div>

            {/* 날짜 + 분실물명 side-by-side */}
            <div className={styles.row}>
              <div className={styles.halfItem}>
                <div className={styles.fieldWrap}>
                  <input
                    type="date"
                    className={styles.input}
                    aria-label="분실 일자"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.halfItem}>
                <div className={styles.fieldWrap}>
                  <input
                    className={styles.input}
                    placeholder="분실물명"
                    aria-label="분실물명"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 특이사항 */}
            <div className={styles.fieldWrap}>
              <textarea
                className={styles.textarea}
                placeholder="특이 사항"
                aria-label="특이 사항"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* 사진 업로드 */}
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

          <div className={styles.requiredNote}>사진을 제외한 모든 항목을 작성해야 합니다.</div>
          <div className={styles.footer}>
            <button className={styles.submit} type="button" disabled={saving} onClick={handleRegisterClick}>
              {saving ? "저장중..." : "등록"}
            </button>
          </div>
        </form>
      </Panel>

      {/* Floating icon to resemble the provided screen (non-functional) */}
      <button className={styles.floatingButton} type="button" aria-label="분실물 등록">
        <Image src="/pawIcon.svg" alt="paw" width={20} height={20} />
        <span>분실물 등록</span>
      </button>
      {showSuccess && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <p className={styles.modalText}>등록이 완료되었어요!</p>
            <button
              className={styles.modalClose}
              onClick={() => setShowSuccess(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
      {showMissing && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <p className={styles.modalText}>항목이 다 작성되지 않았어요!</p>
            <button className={styles.modalClose} onClick={() => setShowMissing(false)}>확인</button>
          </div>
        </div>
      )}

      {showReview && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalText}>제출 전 항목을 확인하세요</h3>
            <div style={{textAlign:'left', marginBottom:12}}>
              <div><strong>분실 장소:</strong> {place}</div>
              <div><strong>대분류 / 소분류:</strong> {mainCategory} / {subCategory}</div>
              <div><strong>분실 일자:</strong> {date}</div>
              <div><strong>분실물명:</strong> {itemName}</div>
              <div><strong>특이사항:</strong> {note}</div>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'center'}}>
              <button className={styles.modalClose} onClick={() => setShowReview(false)}>취소</button>
              <button className={styles.modalClose} onClick={async () => { setShowReview(false); await performSubmit(); }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

import { useState } from "react";
import Image from "next/image";
import router from "next/router";
import Panel from "@/components/Panel";
import styles from "./register.module.css";
import { categories} from "@/components/map/category/categoryData";
import { useRef, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function RegisterPage() {
  const [mainCategory, setMainCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [openMain, setOpenMain] = useState(false);
  const [openSub, setOpenSub] = useState(false);

  const currentSubs = (categories.find((c) => c.main === mainCategory) || { sub: [] }).sub;

  const mainRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = useState<File[]>([]); // newly added local files
  const [newPreviews, setNewPreviews] = useState<string[]>([]); // object URLs for new files
  const [existingMediaIds, setExistingMediaIds] = useState<string[]>([]); // media_ids from firestore
  const [existingPreviewUrls, setExistingPreviewUrls] = useState<string[]>([]); // download URLs for existing media
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [place, setPlace] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [newPreviews]);

  useEffect(() => {
    const { id } = router.query;
    if (!id) return;
    const load = async () => {
      try {
        const userId = auth?.currentUser?.uid || null;
        if (!userId) return;
        const docRef = doc(db, "lost_items", userId, "items", String(id));
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;
        const data: any = snap.data();
        const ex = data.extracted || {};
        setMainCategory(ex.category || "");
        setSubCategory(ex.subcategory || "");
        setPlace(ex.region || "");
        setDate(ex.lost_date || "");
        setItemName(data.item_name || "");
        setNote(data.note || "");
        // Load existing media from storage (if any)
        const rawMedia = (data.media_ids ?? []) as unknown;
        let ids: string[] = [];
        if (Array.isArray(rawMedia)) {
          ids = rawMedia.filter(Boolean) as string[];
        } else if (typeof rawMedia === 'string' && rawMedia.trim()) {
          // support stray string field (comma-separated fallback)
          ids = rawMedia.split(',').map((s) => s.trim()).filter(Boolean);
        }
        setExistingMediaIds(ids);
        if (ids.length) {
          try {
            const urls = await Promise.all(
              ids.map(async (mid) => {
                const path = mid.includes('/') ? mid : `lost/${mid}`;
                const r = storageRef(storage, path);
                return await getDownloadURL(r);
              })
            );
            setExistingPreviewUrls(urls);
          } catch (e) {
            console.error('failed to load existing media previews', e);
            setExistingPreviewUrls([]);
          }
        } else {
          setExistingPreviewUrls([]);
        }
        setEditId(String(id));
      } catch (err) {
        console.error('failed to load item for edit', err);
      }
    };
    load();
  }, [router.query]);

  function handleFiles(files: FileList | File[]) {
    // revoke old preview URLs
  newPreviews.forEach((p) => URL.revokeObjectURL(p));
    const arr = Array.from(files as FileList);
    setPhotos(arr);
    const urls = arr.map((f) => URL.createObjectURL(f));
  setNewPreviews(urls);
  }

  function removePhoto(index: number) {
    // revoke single preview URL
  const url = newPreviews[index];
    if (url) URL.revokeObjectURL(url);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  setNewPreviews((prev) => prev.filter((_, i) => i !== index));
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
  // upload newly added photos to storage and collect storage ids (fullPath)
  const mediaIds: string[] = [...existingMediaIds];
      for (const file of photos) {
        const path = `lost/${Date.now()}_${file.name}`;
        const pRef = storageRef(storage, path);
        await uploadBytes(pRef, file);
        mediaIds.push(pRef.fullPath);
      }

      const userId = auth?.currentUser?.uid || null;

      // Store or update registration under `lost_items/{userId}/items/{doc}`
      if (userId) {
        const itemsCol = collection(db, "lost_items", userId, "items");
        await addDoc(itemsCol, {
          extracted: {
            category: mainCategory,
            lost_date: date,
            region: place,
            subcategory: subCategory,
          },
          media_ids: mediaIds,
          item_name: itemName,
          note: note,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      setShowSuccess(true);
      setPlace("");
      setDate("");
      setMainCategory("");
      setSubCategory("");
      setItemName("");
      setNote("");
      setPhotos([]);
  setNewPreviews([]);
  setExistingMediaIds([]);
  setExistingPreviewUrls([]);
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
          <h1 className={styles.title}>{editId ? "나의 분실물 수정" : "나의 분실물 등록"}</h1>
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
                  newPreviews.forEach((p) => URL.revokeObjectURL(p));
                  setPhotos([f]);
                  setNewPreviews([URL.createObjectURL(f)]);
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
                {existingPreviewUrls.length === 0 && newPreviews.length === 0 ? (
                  <div className={styles.photoPlaceholder}>
                    <div className={styles.plus}>＋</div> 
                    <div>사진 업로드 (클릭 또는 드래그)</div>
                  </div>
                ) : (
                  <div className={styles.previewGrid}>
                    {/* existing media (read-only) */}
                    {existingPreviewUrls.map((src, i) => (
                      <div key={`exist-${i}`} className={styles.previewItem}>
                        <img src={src} className={styles.previewImg} alt={`existing-${i}`} />
                      </div>
                    ))}
                    {/* newly added previews (removable) */}
                    {newPreviews.map((src, i) => (
                      <div key={`new-${i}`} className={styles.previewItem}>
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
              {saving ? "저장중..." : (editId ? "수정" : "등록")}
            </button>
            <button className={styles.floatingButton} type="button" onClick={() => router.push('/my')}>
            <Image src="/pawIcon.svg" alt="paw" width={20} height={20} />
            <span>목록으로 돌아가기</span>
          </button>
          </div>
        </form>
      </Panel>

  {/* floating registration button removed per request */}
  {showSuccess && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <img src="/Smile.svg" alt="smile" />
            <p className={styles.modalText}>등록이 완료되었어요!</p>
            <button
              className={styles.modalClose}
      onClick={() => { setShowSuccess(false); router.push('/my'); }}
            >
              확인
            </button>
          </div>
        </div>
      )}
      {showMissing && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <img src="/Sad.svg" alt="sad" />
            <p className={styles.modalText}>항목이 다 작성되지 않았어요!</p>
            <button className={styles.modalClose} onClick={() => setShowMissing(false)}>확인</button>
          </div>
        </div>
      )}

      {showReview && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalText} style={{ paddingTop: '20px'}}>제출 전 항목을 확인하세요</h3>
            <div className={styles.modalContent}>
              <div><strong>분실 장소:</strong> {place}</div>
              <div><strong>대분류 / 소분류:</strong> {mainCategory} / {subCategory}</div>
              <div><strong>분실 일자:</strong> {date}</div>
              <div><strong>분실물명:</strong> {itemName}</div>
              <div><strong>특이사항:</strong> {note}</div>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom: '10px'}}>
              <button className={styles.modalClose} onClick={() => setShowReview(false)}>취소</button>
              <button className={styles.modalClose} onClick={async () => { setShowReview(false); await performSubmit(); }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

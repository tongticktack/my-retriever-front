/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import DatePicker from "@/components/DatePicker";
import Image from "next/image";
import router from "next/router";
import Panel from "@/components/Panel";
import styles from "./register.module.css";
import { categories } from "@/components/map/category/categoryData";
import { useRef, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

interface ExtractedFields { category?: string; subcategory?: string; region?: string; lost_date?: string; }
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
  const [photos, setPhotos] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingMediaIds, setExistingMediaIds] = useState<string[]>([]);
  const [existingPreviewUrls, setExistingPreviewUrls] = useState<string[]>([]);
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

  // url 쿼리로 폼 채우기
  useEffect(() => {
    // 1. 라우터가 준비되지 않았으면 아무 작업도 하지 않습니다.
    if (!router.isReady) return;

    // 2. URL 쿼리에서 id를 가져옵니다. (타입: string | string[] | undefined)
    const { id: queryId } = router.query;

    // 3. 만약 id가 배열이면 첫 번째 요소를, 문자열이면 그 값을 사용합니다.
    const id = Array.isArray(queryId) ? queryId[0] : queryId;

    // 4. 최종적으로 id가 유효한 문자열이 아닐 경우, 함수를 종료합니다. (신규 등록 모드)
    if (!id) {
      // 혹시 모를 editId 상태를 초기화해줍니다.
      setEditId(null);
      return;
    }

    const load = async () => {
      try {
        const userId = auth?.currentUser?.uid;
        if (!userId) return;

        const docRef = doc(db, "lost_items", userId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          console.warn("사용자 문서를 찾을 수 없습니다.");
          return;
        }

        interface StoredItem { id: string; extracted?: ExtractedFields; media_ids?: string[]; item_name?: string; note?: string; is_found?: boolean; created_at?: string | Date; updated_at?: string | Date; }
        const itemsArray: StoredItem[] = snap.data().items || [];
        const itemToEdit = itemsArray.find((item) => item.id === id);

        if (!itemToEdit) {
          console.warn(`ID '${id}'에 해당하는 아이템을 배열에서 찾을 수 없습니다.`);
          return;
        }

        // 5. 찾은 데이터로 폼 상태를 채우고, 올바른 id를 editId에 저장합니다.
        const data = itemToEdit;
        const ex = data.extracted || {};
        setMainCategory(ex.category || "");
        setSubCategory(ex.subcategory || "");
        setPlace(ex.region || "");
        setDate(ex.lost_date || "");
        setItemName(data.item_name || "");
        setNote(data.note || "");
        setEditId(id); // ◀️ 여기서 올바른 id가 저장됩니다.

        // 미디어 경로 처리
        const mediaIds = data.media_ids || [];
        setExistingMediaIds(mediaIds);

        if (mediaIds.length) {
          try {
            const urls = await Promise.all(
              mediaIds.map(async (mid: string) => {
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

      } catch (err) {
        console.error('failed to load item for edit', err);
      }
    };

    load();
    // id 값 변화만 감지 (router.query 객체 전체 의존 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.id]);

  // 사용자 선택 파일 준비 및 저장
  function handleFiles(files: FileList | File[]) {
    newPreviews.forEach((p) => URL.revokeObjectURL(p));

    const arr = Array.from(files as FileList);
    setPhotos(arr);

    const urls = arr.map((f) => URL.createObjectURL(f));
    setNewPreviews(urls);
  }

  // 특정 사진 제거
  function removePhoto(index: number) {
    const url = newPreviews[index];
    if (url) URL.revokeObjectURL(url);

    // 해당 인덱스 제거
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // 바깥 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mainRef.current && !mainRef.current.contains(e.target as Node)) setOpenMain(false);
      if (subRef.current && !subRef.current.contains(e.target as Node)) setOpenSub(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // 필수 입력값 검증 (note 는 선택 사항으로 변경)
  const isValid = () => {
    return !!(place && date && itemName && mainCategory && subCategory);
  };

  // submit 함수
  async function performSubmit() {
    if (saving) return;
    setSaving(true);
    try {
      //새로 추가된 사진을 firebase storage에 업로드 -> 경로 모으기
      const mediaIds: string[] = [...existingMediaIds];
      for (const file of photos) {
        const path = `lost/${Date.now()}_${file.name}`;
        const pRef = storageRef(storage, path);
        await uploadBytes(pRef, file);
        mediaIds.push(pRef.fullPath);
      }

      const userId = auth?.currentUser?.uid || null;

      // editId 기준 -> 있으면 수정, 없으면 등록
      if (userId) {
        const userDocRef = doc(db, "lost_items", userId);
        if (editId) {
          // 수정: 전체 문서를 가져와서 -> items 배열을 수정한 뒤 -> 덮어쓰기
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const existingItems = docSnap.data().items || [];
            interface ExistingItem { id: string; extracted?: ExtractedFields; media_ids?: string[]; item_name?: string; note?: string; is_found?: boolean; created_at?: string | Date; updated_at?: string | Date; }
            const updatedItems = existingItems.map((item: ExistingItem) => {
              if (item.id === editId) {
                // 수정할 아이템을 찾아 내용 변경
                return {
                  ...item, // 기존 id, created_at 등은 유지
                  extracted: { category: mainCategory, lost_date: date, region: place, subcategory: subCategory },
                  media_ids: mediaIds,
                  item_name: itemName,
                  note: note,
                  is_found: false,
                  updated_at: new Date(),
                };
              }
              return item;
            });
            await updateDoc(userDocRef, { items: updatedItems });
          }
        } else {
          // 등록: 새 아이템 객체를 생성하여 items 배열에 추가
          const newItem = {
            id: Date.now().toString(), // 배열 내에서 고유 ID 생성
            extracted: { category: mainCategory, lost_date: date, region: place, subcategory: subCategory },
            media_ids: mediaIds,
            item_name: itemName,
            note: note,
            is_found: false,
            created_at: new Date(),
            updated_at: new Date(),
          };
          // setDoc과 { merge: true }를 사용해 문서가 없으면 생성하고, 있으면 items 배열만 업데이트
          await setDoc(userDocRef, {
            items: arrayUnion(newItem)
          }, { merge: true });
        }
      }
      // 성공 표시 -> 상태 초기화
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
    setShowReview(true);
  }

  return (
    <main className={`${styles.themeVars} ${styles.main}`}>
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
                            aria-selected={mainCategory === c.main}
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
                    {openMain && (
                      <div className={styles.options} role="listbox">
                        {categories.map((c) => (
                          <div
                            key={c.main}
                            className={styles.option}
                            role="option"
                            aria-selected={mainCategory === c.main}
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
                              aria-selected={subCategory === s}
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
                              aria-selected={subCategory === s}
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
                  <div className={styles.dateWrap}>
                    <DatePicker value={date} onChange={setDate} max={new Date().toISOString().split('T')[0]} ariaLabel="분실 일자" inputClassName={styles.input} />
                    {/* 날짜 지우기 버튼 제거 (요청에 따라) */}
                  </div>
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

                {/* 사진이 하나도 없을 때 */}
                {existingPreviewUrls.length === 0 && newPreviews.length === 0 ? (
                  <div className={styles.photoPlaceholder}>
                    <div className={styles.plus}>＋</div>
                    <div>사진 업로드 (클릭 또는 드래그)</div>
                  </div>
                ) : (
                  <div className={styles.previewGrid}>
                    {/* 기존 firebase 저장 미디어 */}
                    {existingPreviewUrls.map((src, i) => (
                      <div key={`exist-${i}`} className={styles.previewItem}>
                        <img src={src} className={styles.previewImg} alt={`existing-${i}`} />
                        {editId && (
                          <button
                            type="button"
                            className={styles.removePhotoBtn}
                            aria-label={`기존 사진 삭제 ${i + 1}`}
                            title="사진 제거"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExistingPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
                              setExistingMediaIds(prev => prev.filter((_, idx) => idx !== i));
                            }}
                          >×</button>
                        )}
                      </div>
                    ))}
                    {/* 새로 추가한 미디어 */}
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
          <div className={styles.buttonContainer}>
            <button className={styles.submit} type="button" disabled={saving} onClick={handleRegisterClick}>
              {saving ? "저장중..." : (editId ? "수정" : "등록")}
            </button>
            <button className={styles.backButton} type="button" onClick={() => router.push('/my')}>
              <Image src="/pawIcon.svg" alt="paw" width={20} height={20} />
              <span>목록으로 돌아가기</span>
            </button>
          </div>
        </form>
      </Panel>


      {showSuccess && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <img src="/Smile.svg" alt="smile" />
            <p className={styles.modalText}>{editId ? "수정이 완료되었어요!" : "등록이 완료되었어요!"}</p>
            <button
              className={styles.modalClose}
              onClick={() => { setShowSuccess(false); router.push('/my'); }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 확인 모달: 제출 전에 입력값 최종 확인 */}
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
            <h3 className={styles.modalText} style={{ paddingTop: '20px' }}>제출 전 항목을 확인하세요</h3>
            <div className={styles.modalContent}>
              <div><strong>분실 장소:</strong> {place}</div>
              <div><strong>대분류 / 소분류:</strong> {mainCategory} / {subCategory}</div>
              <div><strong>분실 일자:</strong> {date}</div>
              <div><strong>분실물명:</strong> {itemName}</div>
              <div><strong>특이사항:</strong> {note}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '10px' }}>
              <button className={styles.modalClose} onClick={() => setShowReview(false)}>취소</button>
              <button className={styles.modalClose} onClick={async () => { setShowReview(false); await performSubmit(); }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

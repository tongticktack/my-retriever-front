import Image from "next/image";
import Panel from "@/components/Panel";
import styles from "./register.module.css";

export default function RegisterPage() {
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
              <input className={`${styles.input} ${styles.half}`} placeholder="색상" aria-label="색상" />
              <input className={`${styles.input} ${styles.half}`} placeholder="수량" aria-label="수량" />
            </div>

            <button className={styles.photoButton} type="button">
              <span>물품 사진</span>
            </button>

            <textarea className={styles.textarea} placeholder="특이 사항" aria-label="특이 사항" />
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

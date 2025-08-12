import styles from "./search.module.css";

export default function SearchPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>검색</h1>
      </div>
      <div className={styles.content}>
        <p className={styles.description}>검색 기능이 곧 추가됩니다.</p>
      </div>
    </main>
  );
}

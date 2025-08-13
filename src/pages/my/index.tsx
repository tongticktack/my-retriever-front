import Panel from "@/components/Panel";
import styles from "./my.module.css";

export default function MyPage() {
  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>내 정보</h1>
        </div>
        <div className={styles.content}>
          <p className={styles.description}>내 정보 기능이 곧 추가됩니다.</p>
        </div>
      </Panel>
    </main>
  );
}

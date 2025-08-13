import Panel from "@/components/Panel";
import styles from "./map.module.css";

export default function MapPage() {
  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>지도</h1>
        </div>
        <div className={styles.content}>
          <p className={styles.description}>지도 기능이 곧 추가됩니다.</p>
        </div>
      </Panel>
    </main>
  );
}

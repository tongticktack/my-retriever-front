import Panel from "@/components/Panel";
import styles from "./map.module.css"; // CSS 파일은 같은 폴더에 위치
import dynamic from 'next/dynamic';

const LostItemMap = dynamic(() => import('@/components/LostItemMap'), {
  ssr: false,
  loading: () => <p>지도를 불러오는 중입니다...</p>
});

export default function MapPage() {
  return (
    <main className={styles.main}>
      <Panel>
        <div className={styles.header}>
          <h1 className={styles.title}>분실물 지도</h1>
        </div>
        <div className={styles.content}>
          <LostItemMap />
        </div>
      </Panel>
    </main>
  );
}
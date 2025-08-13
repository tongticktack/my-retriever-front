import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Panel from "@/components/Panel";
import styles from "./chat.module.css";
import { useAuth } from "@/context/AuthContext";

export default function ChatPage() {
  const { user, loading, signOutUser } = useAuth();

  return (
    <>
      <Head>
        <title>My Retriever</title>
        <meta name="description" content="AI 기반 분실물 검색 및 관리 서비스" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Panel>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderRight}>
              {loading ? null : user ? (
                <>
                  <span className={styles.userName}>
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                  <button
                    type="button"
                    onClick={signOutUser}
                    className={styles.logoutBtn}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signup" className={styles.signupBtn}>회원가입</Link>
                  <Link href="/login" className={styles.loginBtn}>로그인</Link>
                </>
              )}
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.logoSection}>
              <div className={styles.dogLogoContainer}>
                <Image
                  src="/loosyMainPageFace.svg"
                  alt="My Retriever Dog Logo"
                  width={300}
                  height={300}
                  className={styles.dogLogo}
                />
              </div>
            </div>
            <div className={styles.searchSection}>
              <input
                type="text"
                placeholder="EX. 나 오늘 오후 1시쯤 성균관대 근처에서 파란색 지갑을 잃어버렸어."
                className={styles.searchInput}
              />
              <div className={styles.searchButtons}>
                <button className={styles.plusBtn}>
                  <span>+</span>
                </button>
                <button className={styles.imageBtn}>
                  <span>📷</span> 이미지
                </button>
                <button className={styles.searchBtn}>
                  <span>🔍</span> 검색
                </button>
              </div>
            </div>
          </div>
        </Panel>
      </main>
    </>
  );
}

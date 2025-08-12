import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import styles from "./_app.module.css";
import "../styles/globals.css";

// 사이드바를 숨길 페이지들
const HIDE_SIDEBAR_PAGES = ["/login", "/signup", "/register"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // 현재 페이지가 사이드바를 숨겨야 하는 페이지인지 확인
  const shouldHideSidebar = HIDE_SIDEBAR_PAGES.includes(router.pathname);

  return (
    <>
      {!shouldHideSidebar && <Sidebar />}
      <div className={shouldHideSidebar ? "" : styles.mainContent}>
        <Component {...pageProps} />
      </div>
    </>
  );
}

import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import styles from "./_app.module.css";
import "../styles/reset.css"; // reset first
import "../styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";

const HIDE_SIDEBAR_PAGES = ["/login", "/signup", "/register"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const shouldHideSidebar = HIDE_SIDEBAR_PAGES.includes(router.pathname);

  return (
    <AuthProvider>
      {!shouldHideSidebar && <Sidebar />}
      <div className={shouldHideSidebar ? "" : styles.mainContent}>
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}

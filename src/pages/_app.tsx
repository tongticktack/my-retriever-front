import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import styles from "./_app.module.css";
import "../styles/reset.css"; // reset first
import "../styles/globals.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useEffect } from "react";


const HIDE_SIDEBAR_PAGES = ["/login", "/signup", "/register"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAuthPage = HIDE_SIDEBAR_PAGES.includes(router.pathname);

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/login");
    }
  }, [user, loading, router, isAuthPage]);

  if (loading || (!user && !isAuthPage)) {
    return null;
  }
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const shouldHideSidebar = HIDE_SIDEBAR_PAGES.includes(router.pathname);

  return (
    <AuthProvider>
      <AuthGate>
        {!shouldHideSidebar && <Sidebar />}
        <div className={shouldHideSidebar ? "" : styles.mainContent}>
          <Component {...pageProps} />
        </div>
      </AuthGate>
    </AuthProvider>
  );
}

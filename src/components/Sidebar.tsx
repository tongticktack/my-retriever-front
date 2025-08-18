import Image from "next/image";
import NavButton from "./NavButton";
import styles from "./Sidebar.module.css";
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
const ChatSessionSidebarList = dynamic(() => import('./chat/ChatSessionSidebarList'), { ssr: false });
import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const sessionStorageKey = user ? `chat_session_${user.uid}` : 'chat_session_guest';
  useEffect(() => {
    try { const s = localStorage.getItem(sessionStorageKey); if (s) setActiveSessionId(s); } catch {}
  }, [sessionStorageKey]);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ sessionId?: string }>).detail;
      if (detail?.sessionId) setActiveSessionId(detail.sessionId);
    };
    window.addEventListener('chat-session-selected', handler);
    const delHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ sessionId?: string }>).detail;
      if (detail?.sessionId && detail.sessionId === activeSessionId) {
        setActiveSessionId(null);
      }
    };
    window.addEventListener('chat-session-deleted', delHandler);
    return () => window.removeEventListener('chat-session-selected', handler);
  }, [activeSessionId]);
  useEffect(() => {
  return () => {};
  }, []);

  const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || 'http://localhost:8000';

  const handleSelect = useCallback(async (id: string) => {
    setActiveSessionId(id);
    try { localStorage.setItem(sessionStorageKey, id); } catch {}
    if (router.pathname !== '/') {
      try { await router.push('/'); } catch (e) { console.warn('[sidebar] navigation error', e); }
    }
    // 라우트 전환 후 이벤트 디스패치 (ChatPage 마운트 보장)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('chat-session-selected', { detail: { sessionId: id } }));
    }, 0);
  }, [router, sessionStorageKey]);

  const handleNew = useCallback(async () => {
    // Create a brand new session immediately
    try {
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/chat/session`, { method: 'POST', headers, body: JSON.stringify({ anonymous: !user, user_id: user ? user.uid : 'guest' }) });
      if (!res.ok) throw new Error('세션 생성 실패');
      const data = await res.json();
      const newId = data.session_id || data.sessionId;
      if (!newId) return;
      setActiveSessionId(newId);
      try { localStorage.setItem(sessionStorageKey, newId); } catch {}
      if (router.pathname !== '/') {
        try { await router.push('/'); } catch (e) { console.warn('[sidebar] navigation error', e); }
      }
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chat-session-created', { detail: { sessionId: newId } }));
        window.dispatchEvent(new CustomEvent('chat-session-selected', { detail: { sessionId: newId } }));
      }, 0);
    } catch (e) {
      console.warn(e);
      // fallback: just clear current session if error
      setActiveSessionId(null);
      try { localStorage.removeItem(sessionStorageKey); } catch {}
    }
  }, [API_BASE, router, sessionStorageKey, user]);
  const menuItems = [
    { href: "/", icon: "/chatIcon.svg", label: "Chat" },
    { href: "/map", icon: "/mapIcon.svg", label: "Map" },
    { href: "/search", icon: "/searchIcon.svg", label: "Search" },
    { href: "/my", icon: "/myPageIcon.svg", label: "My" },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/myRetrieverlogo.svg"
          alt="My Retriever Logo"
          width={160}
          height={54}
          priority
        />
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavButton
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
        {router.pathname === '/' && (
          <ChatSessionSidebarList
            userId={user ? user.uid : null}
            activeSessionId={activeSessionId}
            onSelect={handleSelect}
            onNew={handleNew}
          />
        )}
      </nav>
    </div>
  );
}

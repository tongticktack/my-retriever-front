import React, { useCallback, useEffect, useState, useRef } from 'react';
import styles from './ChatSessionSidebarList.module.css';
const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || 'http://localhost:8000';

interface ChatSessionItem {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  userId: string | null;
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  className?: string;
}

const rel = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso); const now = Date.now(); const diff = now - d.getTime();
  const m = Math.floor(diff/60000); if (m < 1) return '지금'; if (m < 60) return m+'분 전';
  const h = Math.floor(m/60); if (h < 24) return h+'시간 전';
  const day = Math.floor(h/24); if (day < 7) return day+'일 전';
  return d.toLocaleDateString();
};

const ChatSessionSidebarList: React.FC<Props> = ({ userId, activeSessionId, onSelect, onNew, className }) => {
  const [items, setItems] = useState<ChatSessionItem[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const prevItemsRef = useRef<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!userId) { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/chat/sessions?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('세션 불러오기 실패');
      const data = await res.json();
      const rawUnknown: unknown = data;
      let arr: unknown[] = [];
      if (Array.isArray(rawUnknown)) arr = rawUnknown;
      else if (rawUnknown && typeof rawUnknown === 'object') {
        const maybeSessions = (rawUnknown as Record<string, unknown>)['sessions'];
        if (Array.isArray(maybeSessions)) arr = maybeSessions as unknown[];
      }
      const normalized: ChatSessionItem[] = arr.map((r): ChatSessionItem | null => {
        if (typeof r !== 'object' || r === null) return null;
        const anyR = r as Record<string, unknown>;
        const id = (anyR.id || anyR.session_id || anyR.sessionId) as string | undefined;
        if (!id) return null;
        return {
          id,
          title: (anyR.title || anyR.name) as string | undefined,
          created_at: (anyR.created_at || anyR.createdAt) as string | undefined,
          updated_at: (anyR.updated_at || anyR.updatedAt) as string | undefined,
        };
      }).filter((x): x is ChatSessionItem => !!x);
      // sort by updated_at desc then created_at
      normalized.sort((a, b) => {
        const ta = Date.parse(a.updated_at || a.created_at || '') || 0;
        const tb = Date.parse(b.updated_at || b.created_at || '') || 0;
        return tb - ta;
      });
      // diff for exit animations
      const prev = prevItemsRef.current;
      const nextIds = new Set(normalized.map(n => n.id));
      const removed = prev.filter(p => !nextIds.has(p.id));
      if (removed.length) {
        setExiting(old => new Set([...Array.from(old), ...removed.map(r => r.id)]));
        // after animation remove
        setTimeout(() => {
          setExiting(old => {
            const copy = new Set(old);
            removed.forEach(r => copy.delete(r.id));
            return copy;
          });
          setItems(normalized);
          prevItemsRef.current = normalized;
        }, 250);
      } else {
        setItems(normalized);
        prevItemsRef.current = normalized;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally { setLoading(false); }
  }, [userId]);

useEffect(() => { fetchList(); }, [fetchList, userId]);
  // Listen to session created/updated events to auto refresh
  useEffect(() => {
    const handler = () => { fetchList(); };
    window.addEventListener('chat-session-created', handler);
    window.addEventListener('chat-session-updated', handler);
    return () => {
      window.removeEventListener('chat-session-created', handler);
      window.removeEventListener('chat-session-updated', handler);
    };
  }, [fetchList]);

  return (
  <div className={`${styles.wrapper} chatSessionList ${className || ''}`.trim()}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>세션</span>
        <div className={styles.actions}>
      <button className={styles.iconBtn} onClick={() => { onNew(); }} aria-label="새 세션">＋</button>
        </div>
      </div>
      <ul className={styles.list}>
        {items.map(s => {
          const active = s.id === activeSessionId;
          const isExiting = exiting.has(s.id);
          return (
            <li key={s.id} className={isExiting ? 'animExit' : 'animEnter'} style={{ '--h': '40px' } as React.CSSProperties}>
              <div className={`${styles.itemBtn} ${active ? 'active ' + styles.active : ''}`} style={{position:'relative', opacity:isExiting?0.4:1}}>
                <button style={{all:'unset',cursor:'pointer',display:'block',width:'100%'}} onClick={() => { onSelect(s.id); }} aria-current={active ? 'true': undefined}>
                  <div className={styles.titleLine} contentEditable suppressContentEditableWarning
                    onBlur={async (e) => {
                      const newTitle = e.currentTarget.textContent?.trim() || '';
                      if (newTitle && newTitle !== s.title) {
                        try {
                          await fetch(`${API_BASE}/chat/session/${encodeURIComponent(s.id)}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: newTitle }) });
                          window.dispatchEvent(new CustomEvent('chat-session-updated', { detail: { sessionId: s.id } }));
                        } catch {/* ignore */}
                      }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); } }}
                  >{s.title || '제목 없음'}</div>
                  <div className={styles.timeLine}>{rel(s.updated_at || s.created_at)}</div>
                </button>
                <button title="삭제" aria-label="세션 삭제" onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!confirm('이 세션을 삭제하시겠습니까?')) return;
                  try {
                    const res = await fetch(`${API_BASE}/chat/session/${encodeURIComponent(s.id)}`, { method:'DELETE' });
                    if (!res.ok) throw new Error('삭제 실패');
                    window.dispatchEvent(new CustomEvent('chat-session-deleted', { detail: { sessionId: s.id } }));
                    // 로컬 refresh
                    await fetchList();
                  } catch {
                    alert('삭제 중 오류');
                  }
                }} style={{position:'absolute',top:4,right:4,border:'none',background:'transparent',color:'#b2553d',fontSize:'12px',cursor:'pointer',padding:2,lineHeight:1}}>✕</button>
              </div>
            </li>
          );
        })}
        {!loading && !error && items.length === 0 && (
          <li className={styles.empty}>세션이 없습니다.</li>
        )}
        {loading && <li className={styles.empty}>불러오는 중...</li>}
        {error && <li className={styles.empty} style={{color:'#c0392b'}}>{error}</li>}
      </ul>
      {!userId && <div className={styles.badgeGuest}>게스트 모드 (저장 안됨)</div>}
      {userId && <div className={styles.badgeInfo}>로그인 상태: 세션 자동 저장</div>}
    </div>
  );
};

export default ChatSessionSidebarList;

import React, { useEffect, useState, useCallback } from 'react';
import styles from './ChatSessions.module.css';

interface ChatSessionItem {
  id: string;
  title?: string;
  created_at?: string; // ISO
  updated_at?: string; // ISO
}

interface Props {
  userId: string | null;
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

const formatRelative = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '지금';
  if (diffMin < 60) return diffMin + '분 전';
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + '시간 전';
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return diffDay + '일 전';
  return date.toLocaleDateString();
};

const ChatSessions: React.FC<Props> = ({ userId, activeSessionId, onSelect, onNewSession }) => {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!userId) { // guests: we'd only have one local session, so skip server fetch
      setSessions([]);
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/chat/sessions/?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('세션 불러오기 실패');
      const data = await res.json();
      // Expecting array of sessions with id & title
      setSessions(Array.isArray(data) ? data : (data.sessions || []));
    } catch (e) {
      const message = e instanceof Error ? e.message : '알 수 없는 오류';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>대화</span>
        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={fetchSessions} aria-label="새로고침">↻</button>
          <button className={styles.iconBtn} onClick={onNewSession} aria-label="새 대화">＋</button>
        </div>
      </div>
      {loading && <div className={styles.msgInfo}>불러오는 중...</div>}
      {error && <div className={styles.msgErr}>{error}</div>}
      <ul className={styles.list}>
        {sessions.map(s => {
          const isActive = s.id === activeSessionId;
          return (
            <li key={s.id}>
              <button
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => onSelect(s.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className={styles.label}>{s.title || '제목 없음'}</span>
                <span className={styles.time}>{formatRelative(s.updated_at || s.created_at)}</span>
              </button>
            </li>
          );
        })}
        {sessions.length === 0 && !loading && !error && (
          <li className={styles.msgInfo}>세션이 없습니다.</li>
        )}
      </ul>
    </div>
  );
};

export default ChatSessions;

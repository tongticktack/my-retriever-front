import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Panel from "@/components/Panel";
import styles from "./chat.module.css";
import { useAuth } from "@/context/AuthContext";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatComposer from '@/components/chat/ChatComposer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type ChatAttachment = {
  media_id?: string;
  url: string;
  width?: number;
  height?: number;
  hash?: string;
  palette?: string[];
  content_type?: string;
  // local optimistic flag (object URL) so we can revoke later if needed
  __localUrl?: boolean;
};
type ChatMessage = { role: 'user' | 'assistant'; content: string; ts: number; attachments?: ChatAttachment[] };

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || 'http://localhost:8000';

export default function ChatPage() {
  const { user, loading, signOutUser } = useAuth();
  const [input, setInput] = useState('');
  const MAX_INPUT = 800; // 사용자 입력 최대 길이
  const RATE_LIMIT_MS = 800; // 메시지 전송 최소 간격
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading] = useState(false); // 업로드 진행 표시 (순차 업로드 즉시 처리되어 미사용 상태)
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyAbortRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<number>(0);

  // 세션 복원 용 키 (게스트/유저 구분) - 현재 직접 로컬스토리지 접근으로 대체되어 미사용, 향후 유지 가능
  // const sessionStorageKey = useMemo(() => user ? `chat_session_${user.uid}` : 'chat_session_guest', [user]);
  const isValidSessionId = useCallback((sid: string | null | undefined) => !!sid && sid !== 'undefined' && sid !== 'null', []);
  const draftKey = useCallback((sid: string | null) => sid ? `chat_draft_${sid}` : 'chat_draft_new', []); // 유지 (세션 없을 때 임시 draft)
  const inputRef = useRef('');
  useEffect(() => { inputRef.current = input; }, [input]);

  // 사용자 변경 시: 로그인 사용자는 항상 새로 시작, 게스트는 이전 guest 세션만 복원
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUid = user ? user.uid : null;
    if (prevUserIdRef.current !== currentUid) {
      if (!user) {
        // 게스트: 이전 guest 세션 복원 시도
        let restored: string | null = null;
        try { restored = localStorage.getItem('chat_session_guest'); } catch {}
        setSessionId(isValidSessionId(restored || '') ? restored : null);
      } else {
        setSessionId(null);
      }
      setMessages([]);
      setInput('');
      prevUserIdRef.current = currentUid;
    }
  }, [user, isValidSessionId]);

  const loadHistory = useCallback(async (sid: string) => {
  if (!isValidSessionId(sid)) { return; }
    try {
      if (historyAbortRef.current) historyAbortRef.current.abort();
      const ac = new AbortController();
      historyAbortRef.current = ac;
      setHistoryLoading(true);
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const primaryUrl = `${API_BASE}/chat/history/${encodeURIComponent(sid)}?limit=50`;
      let res = await fetch(primaryUrl, { headers, signal: ac.signal });
      if (!res.ok) {
        const fallbackUrl = `${API_BASE}/chat/history?session_id=${encodeURIComponent(sid)}&limit=50`;
        const alt = await fetch(fallbackUrl, { headers, signal: ac.signal });
        if (alt.ok) {
          res = alt;
        } else {
          throw new Error(`히스토리 로드 실패 (${res.status})`);
        }
      }
      const data = await res.json();
      type RawMsg = { role?: unknown; content?: unknown; ts?: unknown; created_at?: unknown; attachments?: unknown };
      const rawList: RawMsg[] = Array.isArray(data.messages) ? data.messages : Array.isArray(data) ? data : [];
      const mapped: ChatMessage[] = rawList.map((m, idx) => {
        let content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        if (content.length > 8000) content = content.slice(0, 8000) + '\n... (truncated)';
        let ts: number;
        if (typeof m.ts === 'number') ts = m.ts; else if (typeof m.ts === 'string') ts = Date.parse(m.ts); else if (typeof m.created_at === 'string') ts = Date.parse(m.created_at); else ts = Date.now() - (rawList.length - idx) * 1000;
        // attachments parsing
        let attachments: ChatAttachment[] | undefined;
        if (m.attachments && Array.isArray(m.attachments)) {
          attachments = m.attachments.map((raw: unknown) => {
            if (!raw || typeof raw !== 'object') return null;
            const a = raw as Record<string, unknown>;
            const url = typeof a.url === 'string' ? a.url : '';
            if (!url) return null;
            return {
              media_id: typeof a.media_id === 'string' ? a.media_id : (typeof a.mediaId === 'string' ? a.mediaId : (typeof a.id === 'string' ? a.id : undefined)),
              url,
              width: typeof a.width === 'number' ? a.width : undefined,
              height: typeof a.height === 'number' ? a.height : undefined,
              hash: typeof a.hash === 'string' ? a.hash : undefined,
              palette: Array.isArray(a.palette) ? a.palette.filter((p: unknown): p is string => typeof p === 'string') : undefined,
              content_type: typeof a.content_type === 'string' ? a.content_type : (typeof a.mime === 'string' ? a.mime : undefined),
            } as ChatAttachment;
          }).filter((x: ChatAttachment | null): x is ChatAttachment => !!x);
        }
        return {
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content,
          ts,
          attachments,
        };
      });
      setMessages(mapped);
      setError(null);
    } catch (e) {
      const err = e as unknown;
      if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError') {
      } else {
        if (err instanceof Error) setError(err.message); else setError('히스토리 로드 오류');
      }
    }
    finally { setHistoryLoading(false); }
  }, [user, isValidSessionId]);

  // 게스트 모드에서 복원된 세션이 있고 아직 메시지를 불러오지 않았다면 자동 로드
  useEffect(() => {
    if (!user && isValidSessionId(sessionId) && messages.length === 0 && !historyLoading) {
      void loadHistory(sessionId!);
    }
  }, [user, sessionId, messages.length, historyLoading, loadHistory, isValidSessionId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ sessionId?: string }>).detail;
      if (!detail?.sessionId) return;
      const newId = detail.sessionId;
      setSessionId(prev => {
        if (prev === newId) {
          // 동일 세션 재선택: 기존 메시지 유지 (깜빡임 방지). 필요 시 최신 메시지만 merge 로드 가능.
          // if (isValidSessionId(newId)) void loadHistory(newId); // 선택적 갱신 비활성화
          return prev;
        } else {
          try { if (prev) localStorage.setItem(draftKey(prev), inputRef.current); } catch {}
          let draft = '';
          try { draft = localStorage.getItem(draftKey(newId)) || ''; } catch {}
          setInput(draft);
          setMessages([]);
          setError(null);
          if (isValidSessionId(newId)) void loadHistory(newId);
          return newId;
        }
      });
    };
    window.addEventListener('chat-session-selected', handler);
    window.addEventListener('chat-session-created', handler);
    const delHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ sessionId?: string }>).detail;
  if (detail?.sessionId && detail.sessionId === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
    };
    window.addEventListener('chat-session-deleted', delHandler);
    return () => {
      window.removeEventListener('chat-session-selected', handler);
      window.removeEventListener('chat-session-created', handler);
      window.removeEventListener('chat-session-deleted', delHandler);
    };
  }, [draftKey, loadHistory, isValidSessionId, sessionId]);

  // 세션 변경 또는 입력 변경 시 draft 저장 (디바운스 없이 즉시; 필요 시 개선 가능)
  useEffect(() => {
    if (sessionId) {
      try { localStorage.setItem(draftKey(sessionId), input); } catch {}
    }
  }, [input, sessionId, draftKey]);

  // sendMessage: 로그인 없어도 동작 (token optional)
  // (이전 구현 잔여) 별도 업로드 헬퍼 사용하지 않음

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return; // text required (no image-only)
    if (input.length > MAX_INPUT) return;
    const now = Date.now();
    if (now - lastSendRef.current < RATE_LIMIT_MS) return; // rate limit
    lastSendRef.current = now;
    setSending(true);
    const originalInput = input;
    const localFiles = attachments.slice();
    try {
      // optimistic user message with local object URLs
      const localPreviews: ChatAttachment[] = localFiles.map(f => ({ url: URL.createObjectURL(f), __localUrl: true }));
      setMessages(prev => [...prev, { role: 'user', content: originalInput, ts: Date.now(), attachments: localPreviews }]);
      setInput('');
      setAttachments([]);

      // auth headers
      const token = user ? await user.getIdToken() : null;
      const authHeaders: Record<string,string> = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;

      // create session if needed
      let currentSession = sessionId;
      let newlyCreated = false;
      if (!isValidSessionId(currentSession)) {
        const sessionResp = await fetch(`${API_BASE}/chat/session`, { method:'POST', headers: authHeaders });
        if (!sessionResp.ok) throw new Error('세션 생성 실패');
        const sData = await sessionResp.json();
        currentSession = sData.session_id || sData.id;
        newlyCreated = true;
        setSessionId(currentSession);
        window.dispatchEvent(new CustomEvent('chat-session-created', { detail: { session: sData } }));
      }

      // upload attachments (reuse existing helper for consistency) - but we need token; fallback to manual if token present
      const mediaIds: string[] = [];
      for (const f of localFiles) {
        const form = new FormData();
        form.append('file', f);
        const upResp = await fetch(`${API_BASE}/media/upload`, { method:'POST', headers: authHeaders, body: form });
        if (!upResp.ok) throw new Error('이미지 업로드 실패');
        const upData = await upResp.json();
        const mid = upData.media_id || upData.mediaId || upData.id;
        if (mid) mediaIds.push(mid);
      }

      // send message
      const sendHeaders: Record<string,string> = { 'Content-Type': 'application/json', ...authHeaders };
      const body = { session_id: currentSession, content: originalInput, media_ids: mediaIds };
      const sendResp = await fetch(`${API_BASE}/chat/send`, { method:'POST', headers: sendHeaders, body: JSON.stringify(body) });
      if (!sendResp.ok) throw new Error('전송 실패');
      const payload = await sendResp.json();
      // try common shapes
      let assistantContent: string | undefined;
      let assistantAttachments: ChatAttachment[] | undefined;
      const assistantRaw = payload.assistant || payload.assistant_message || payload.reply || payload.response;
      if (assistantRaw) {
        if (typeof assistantRaw === 'string') assistantContent = assistantRaw; else if (typeof assistantRaw.content === 'string') assistantContent = assistantRaw.content;
        const atts = assistantRaw.attachments || assistantRaw.media || assistantRaw.images;
        if (Array.isArray(atts)) {
          assistantAttachments = atts.map((a: unknown) => {
            if (!a) return null;
            if (typeof a !== 'object') return null;
            const obj = a as Record<string, unknown>;
            const url = typeof obj.url === 'string' ? obj.url : (typeof obj.src === 'string' ? obj.src : '');
            if (!url) return null;
            return {
              media_id: (obj.media_id || obj.mediaId || obj.id) as string | undefined,
              url,
              width: typeof obj.width === 'number' ? obj.width : undefined,
              height: typeof obj.height === 'number' ? obj.height : undefined,
              content_type: (obj.content_type || obj.mime) as string | undefined,
            } as ChatAttachment;
          }).filter((x: ChatAttachment | null): x is ChatAttachment => !!x);
        }
      }
      if (!assistantContent) assistantContent = (payload.content || payload.reply) as string | undefined;
      if (!assistantContent) assistantContent = JSON.stringify(payload);
      const finalAssistant: ChatMessage = { role:'assistant', content: assistantContent, ts: Date.now(), attachments: assistantAttachments };
      setMessages(prev => [...prev, finalAssistant]);
      window.dispatchEvent(new CustomEvent('chat-session-updated', { detail: { sessionId: currentSession, newlyCreated } }));
    } catch (e) {
      if (e instanceof Error) setError(e.message); else setError('전송 오류');
      // rollback input so user can retry
      setInput(prev => prev || originalInput);
      lastSendRef.current = 0; // allow retry immediately
    } finally {
      setSending(false);
    }
  }, [input, attachments, sessionId, user, isValidSessionId]);

  // 자동 스크롤
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 날짜 포맷 헬퍼
  const formatDate = (ts:number) => new Date(ts).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
  const formatTime = (ts:number) => new Date(ts).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:false });

  const handleSend = () => { if (!sending) void sendMessage(); };

  return (
    <>
      <Head>
        <title>My Retriever</title>
        <meta name="description" content="AI 기반 분실물 검색 및 관리 서비스" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Panel className={styles.panelFull}>
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
            <div className={styles.logoSection} style={{ display: messages.length ? 'none':'block' }}>
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
            <div className={styles.chatArea}>
              <div ref={messagesRef} className={styles.messages}>
                {historyLoading && <div className={styles.noMessages}>히스토리 불러오는 중...</div>}
                {!historyLoading && messages.length === 0 && <div className={styles.noMessages}>메시지를 입력해 대화를 시작하세요.</div>}
                {messages.reduce<{ elements: React.ReactElement[]; lastDate: string | null }>((acc, m, i) => {
                  const msgDate = formatDate(m.ts);
                  if (acc.lastDate !== msgDate) {
                    acc.elements.push(<div key={`date-${m.ts}`} className={styles.dateDivider}>{msgDate}</div>);
                  }
                  const isUser = m.role === 'user';
                  acc.elements.push(
                    <div key={m.ts + '-' + i} className={`${styles.msgGroup} ${isUser ? styles.msgGroupUser : styles.msgGroupAssistant}`}>
                      {!isUser && (
                        <div className={styles.avatarOverlap}>
                          <Image src="/loosyChatBoxIcon.svg" alt="assistant" width={44} height={44} className={styles.avatar} />
                        </div>
                      )}
                      <div className={styles.msgStack} style={isUser ? { alignItems:'flex-end' } : undefined}>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className={`${styles.msgImages} ${isUser ? styles.msgImagesUser : styles.msgImagesAssistant}`}>
                            {m.attachments.map((att, ai) => (
                              <div key={ai} className={styles.msgImageWrap}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={att.url}
                                  alt={att.media_id || `attachment-${ai}`}
                                  className={styles.msgImage}
                                  onLoad={() => { if (att.__localUrl) { try { URL.revokeObjectURL(att.url); } catch {} } }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant} ${!isUser ? styles.bubbleWithAvatar : ''}`}>
                          {isUser ? m.content : (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                              components={{
                                a: (props: React.ComponentProps<'a'>) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                                code: (props: { className?: string; children?: React.ReactNode }) => {
                                  const { className, children, ...rest } = (props || {}) as { className?: string; children?: React.ReactNode };
                                  return <code className={className} {...rest}>{children}</code>;
                                }
                              }}
                            >{m.content}</ReactMarkdown>
                          )}
                        </div>
                        <div className={`${styles.time} ${isUser ? styles.timeUser : ''}`}>{formatTime(m.ts)}</div>
                      </div>
                    </div>
                  );
                  acc.lastDate = msgDate;
                  return acc;
                }, { elements:[], lastDate: null }).elements}
                <div ref={bottomRef} />
              </div>
              {error && <div style={{ color: 'red', fontSize: '.8rem' }}>{error}</div>}
              <div className={styles.inputSection}>
                <div className={styles.composerOuter}>
                <ChatComposer
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  disabled={sending || uploading}
                  sending={sending}
                  maxLength={MAX_INPUT}
                  attachments={attachments}
                  onChangeAttachments={setAttachments}
                  uploading={uploading}
                  placeholder={user ? '나 오늘 오후 1시쯤 성균관대 근처에서 파란색 지갑을 잃어버렸어.' : '나 오늘 오후 1시쯤 성균관대 근처에서 파란색 지갑을 잃어버렸어.'}
                />
                </div>
                <div style={{ fontSize: '.65rem', color:'#9ca3af', marginTop:'4px' }}>
                  {isValidSessionId(sessionId) ? (
                    <>세션 ID: {sessionId}</>
                  ) : (
                    <>세션이 없습니다. 첫 메시지를 보내면 새 세션이 생성됩니다.</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </main>
    </>
  );
}

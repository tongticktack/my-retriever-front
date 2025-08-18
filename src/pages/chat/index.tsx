import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Panel from "@/components/Panel";
import styles from "./chat.module.css";
import { useAuth } from "@/context/AuthContext";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ChatComposer from '@/components/chat/ChatComposer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type ChatMessage = { role: 'user' | 'assistant'; content: string; ts: number };

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || 'http://localhost:8000';

export default function ChatPage() {
  const { user, loading, signOutUser } = useAuth();
  const [input, setInput] = useState('');
  const MAX_INPUT = 800; // 사용자 입력 최대 길이
  const RATE_LIMIT_MS = 800; // 메시지 전송 최소 간격
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyAbortRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<number>(0);

  const sessionStorageKey = useMemo(() => user ? `chat_session_${user.uid}` : 'chat_session_guest', [user]);
  const isValidSessionId = useCallback((sid: string | null | undefined) => !!sid && sid !== 'undefined' && sid !== 'null', []);
  const draftKey = useCallback((sid: string | null) => sid ? `chat_draft_${sid}` : 'chat_draft_new', []);
  const inputRef = useRef('');
  useEffect(() => { inputRef.current = input; }, [input]);

  // 사용자 변경(게스트 -> 로그인, 혹은 다른 계정) 시 세션 초기화 후 해당 사용자 저장된 세션 로드
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUid = user ? user.uid : null;
    if (prevUserIdRef.current !== currentUid) {
      // 사용자 변경됨
      let restored: string | null = null;
      try { restored = currentUid ? localStorage.getItem(`chat_session_${currentUid}`) : localStorage.getItem('chat_session_guest'); } catch {}
      setSessionId(restored || null); // 없으면 null -> 첫 메시지 시 생성
      setMessages([]); // 다른 사용자 기록과 섞이지 않도록 초기화
      setInput('');
      prevUserIdRef.current = currentUid;
    }
  }, [user]);

  // 로그인 여부와 관계없이 세션 복구
  useEffect(() => {
    try {
      const stored = localStorage.getItem(sessionStorageKey);
      if (stored && isValidSessionId(stored)) {
        setSessionId(stored);
      } else {
        if (stored && !isValidSessionId(stored)) {
          // 잘못된 값 정리
          localStorage.removeItem(sessionStorageKey);
        }
        setSessionId(null);
      }
    } catch { /* noop */ }
  }, [sessionStorageKey, isValidSessionId]);

  // 히스토리 로드 (선택된 세션)
  const loadHistory = useCallback(async (sid: string) => {
  if (!isValidSessionId(sid)) { return; }
    try {
      // 이전 요청 취소
      if (historyAbortRef.current) historyAbortRef.current.abort();
      const ac = new AbortController();
      historyAbortRef.current = ac;
      setHistoryLoading(true);
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const primaryUrl = `${API_BASE}/chat/history/${encodeURIComponent(sid)}`;
      let res = await fetch(primaryUrl, { headers, signal: ac.signal });
      if (!res.ok) {
        // fallback to query style (서버 라우팅 차이 대비)
        const fallbackUrl = `${API_BASE}/chat/history?session_id=${encodeURIComponent(sid)}`;
        const alt = await fetch(fallbackUrl, { headers, signal: ac.signal });
        if (alt.ok) {
          res = alt;
        } else {
          throw new Error(`히스토리 로드 실패 (${res.status})`);
        }
      }
      const data = await res.json();
      type RawMsg = { role?: unknown; content?: unknown; ts?: unknown };
      const rawList: RawMsg[] = Array.isArray(data.messages) ? data.messages : Array.isArray(data) ? data : [];
      const mapped: ChatMessage[] = rawList.map((m, idx) => {
        let content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        if (content.length > 8000) content = content.slice(0, 8000) + '\n... (truncated)';
        return {
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content,
          ts: typeof m.ts === 'number' ? m.ts : (typeof m.ts === 'string' ? Date.parse(m.ts) : Date.now() - (rawList.length - idx) * 1000),
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



  // (이전 effect 제거: 즉시 로드 방식으로 전환)

  // 외부(사이드바)에서 세션 선택/생성 이벤트 수신 -> 세션 갱신 & 메시지 초기화 / 동일 세션 재선택 시 강제 reload
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ sessionId?: string }>).detail;
      if (!detail?.sessionId) return;
      const newId = detail.sessionId;
      setSessionId(prev => {
        if (prev === newId) {
          // 동일 세션 재선택: 강제 reload (메시지만 초기화, input 유지)
            setMessages([]);
            setError(null);
            // 즉시 히스토리 재로드
            if (isValidSessionId(newId)) void loadHistory(newId);
            return prev; // sessionId 변화 없음
        } else {
          // 기존 세션 draft 저장
          try { if (prev) localStorage.setItem(draftKey(prev), inputRef.current); } catch {}
          // 새 세션 draft 복원
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
  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const now = Date.now();
  if (now - lastSendRef.current < RATE_LIMIT_MS) return; // rate limit
  if (input.length > MAX_INPUT) return;
    lastSendRef.current = now;

    setError(null);
    setSending(true);
    const originalInput = input;
    const createdAt = Date.now();
    try {
      const token = user ? await user.getIdToken() : null;
      let currentSession = isValidSessionId(sessionId) ? sessionId : null;
      let newlyCreated = false;
      if (!currentSession) {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resSession = await fetch(`${API_BASE}/chat/session`, { 
          method:'POST',
          headers,
          body: JSON.stringify({
            anonymous: !user,
            user_id: user ? user.uid : "guest"
          }) 
        });
        if (!resSession.ok) throw new Error('세션 생성 실패');
        const sessionData = await resSession.json();
        currentSession = sessionData.session_id || sessionData.sessionId;
  if (!currentSession) throw new Error('session_id 없음');
        setSessionId(currentSession);
        try { if (currentSession) localStorage.setItem(sessionStorageKey, currentSession); } catch {}
        if (typeof window !== 'undefined' && currentSession) {
          window.dispatchEvent(new CustomEvent('chat-session-created', { detail: { sessionId: currentSession } }));
          window.dispatchEvent(new CustomEvent('chat-session-selected', { detail: { sessionId: currentSession } }));
        }
        newlyCreated = true;
      }
      // 사용자 메시지 추가 (고정 timestamp)
      setMessages(prev => [...prev, { role:'user', content: originalInput, ts: createdAt }]);
      setInput('');
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resSend = await fetch(`${API_BASE}/chat/send`, { method:'POST', headers, body: JSON.stringify({ session_id: currentSession, content: originalInput }) });
      if (!resSend.ok) throw new Error('메시지 전송 실패');
      const replyData = await resSend.json();
      // 서버 응답에서 LLM 메시지 추출 우선순위:
      // 1) replyData.body.content (권장 스키마)
      // 2) replyData.body (문자열일 경우)
      // 3) replyData.content / reply
      // 4) body가 배열일 때 첫 요소의 content
      let assistantContent: string | undefined;
      if (replyData) {
        const body: unknown = (replyData as Record<string, unknown>)?.body;
        if (body) {
          if (typeof body === 'string') assistantContent = body;
          else if (typeof body === 'object') {
            const maybeObj = body as { content?: unknown } | Array<{ content?: unknown }>;
            if (!Array.isArray(maybeObj) && typeof maybeObj.content === 'string') {
              assistantContent = maybeObj.content;
            } else if (Array.isArray(maybeObj) && maybeObj.length) {
              const first = maybeObj[0];
              if (first && typeof first.content === 'string') assistantContent = first.content;
            }
            // body 내부에 assistant_message 형태가 있을 수도 있음
            if (!assistantContent && !Array.isArray(maybeObj)) {
              const maybeAssistantMsg = (maybeObj as { assistant_message?: { content?: unknown } }).assistant_message;
              if (maybeAssistantMsg && typeof maybeAssistantMsg.content === 'string') {
                assistantContent = maybeAssistantMsg.content;
              }
            }
          }
        }
        // 최상위 assistant_message.content 우선 추출
        if (!assistantContent) {
          const topAssistant = (replyData as { assistant_message?: { content?: unknown } }).assistant_message;
          if (topAssistant && typeof topAssistant.content === 'string') {
            assistantContent = topAssistant.content;
          }
        }
        if (!assistantContent) {
          if (typeof replyData.content === 'string') assistantContent = replyData.content;
          else if (typeof replyData.reply === 'string') assistantContent = replyData.reply;
        }
      }
      if (!assistantContent) assistantContent = JSON.stringify(replyData);
      setMessages(prev => [...prev, { role:'assistant', content: assistantContent, ts: Date.now() }]);
      // 세션 제목이 서버에서 첫 응답 처리 후 생성/갱신될 수 있으므로 업데이트 이벤트 디스패치
      if (typeof window !== 'undefined' && currentSession) {
        window.dispatchEvent(new CustomEvent('chat-session-updated', { detail: { sessionId: currentSession, newlyCreated } }));
      }
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message); else setError('에러 발생');
      setInput(prev => prev || originalInput);
      lastSendRef.current = 0;
    } finally {
      setSending(false);
    }
  }, [input, sessionId, user, sessionStorageKey, isValidSessionId]);

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
                  disabled={sending}
                  sending={sending}
                  maxLength={MAX_INPUT}
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

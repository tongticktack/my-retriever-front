import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Panel from "@/components/Panel";
import styles from "./chat.module.css";
import { useAuth } from "@/context/AuthContext";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ChatComposer from '@/components/ChatComposer';

type ChatMessage = { role: 'user' | 'assistant'; content: string; ts: number };

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || 'http://localhost:8000';

export default function ChatPage() {
  const { user, loading, signOutUser } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSendRef = useRef<number>(0);

  const sessionStorageKey = useMemo(() => user ? `chat_session_${user.uid}` : 'chat_session_guest', [user]);

  // 로그인 여부와 관계없이 세션 복구
  useEffect(() => {
    try {
      const stored = localStorage.getItem(sessionStorageKey);
      setSessionId(stored || null);
    } catch { /* noop */ }
  }, [sessionStorageKey]);

  // sendMessage: 로그인 없어도 동작 (token optional)
  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const now = Date.now();
    if (now - lastSendRef.current < 600) return; // 디바운스
    lastSendRef.current = now;

    setError(null);
    setSending(true);
    const originalInput = input;
    const createdAt = Date.now();
    try {
      const token = user ? await user.getIdToken() : null;
      let currentSession = sessionId;
      if (!currentSession) {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resSession = await fetch(`${API_BASE}/chat/session`, { method:'POST', headers, body: JSON.stringify({ anonymous: !user }) });
        if (!resSession.ok) throw new Error('세션 생성 실패');
        const sessionData = await resSession.json();
        currentSession = sessionData.session_id || sessionData.sessionId;
        if (!currentSession) throw new Error('session_id 없음');
        setSessionId(currentSession);
        try { localStorage.setItem(sessionStorageKey, currentSession); } catch {}
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
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message); else setError('에러 발생');
      setInput(prev => prev || originalInput);
      lastSendRef.current = 0;
    } finally {
      setSending(false);
    }
  }, [input, sessionId, user, sessionStorageKey]);

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
                {messages.length === 0 && <div className={styles.noMessages}>메시지를 입력해 대화를 시작하세요.</div>}
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
                        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant} ${!isUser ? styles.bubbleWithAvatar : ''}`}>{m.content}</div>
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
                <ChatComposer
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  disabled={sending}
                  sending={sending}
                  placeholder={user ? '나 오늘 오후 1시쯤 성균관대 근처에서 파란색 지갑을 잃어버렸어.' : '나 오늘 오후 1시쯤 성균관대 근처에서 파란색 지갑을 잃어버렸어.'}
                />
                <div style={{ fontSize: '.65rem', color:'#9ca3af', marginTop:'4px' }}>
                  세션: {sessionId ? sessionId : '없음'} {user ? '' : '(게스트)'}
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </main>
    </>
  );
}

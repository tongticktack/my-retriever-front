import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import styles from "./index.module.css";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) {
    router.replace("/");
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code.includes("user-not-found")) setError("등록되지 않은 이메일입니다.");
      else if (code.includes("wrong-password")) setError("비밀번호가 올바르지 않습니다.");
      else setError("로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch {
      setError("구글 로그인 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Log In</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => router.push('/signup')}
            disabled={submitting}
          >
            회원가입
          </button>
        </form>
        <hr className={styles.divider} />
        <button className={styles.googleBtn} onClick={handleGoogle} disabled={submitting}>
          G  구글 계정으로 로그인
        </button>
      </div>
    </main>
  );
}

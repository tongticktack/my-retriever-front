import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import styles from "./index.module.css";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
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
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setSubmitting(true);
    try {
      const displayName = `${lastName.trim()}${firstName.trim()}`.trim();
      await signUp(email.trim(), password, displayName || undefined);
      router.replace("/");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code.includes("email-already-in-use")) setError("이미 사용 중인 이메일입니다.");
      else if (code.includes("invalid-email")) setError("이메일 형식이 올바르지 않습니다.");
      else setError("회원가입에 실패했습니다.");
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
        <h1 className={styles.title}>Sign Up</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="성"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="이름"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className={`${styles.input} ${styles.inputFull}`}
            placeholder="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={`${styles.input} ${styles.inputFull}`}
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} disabled={submitting}>
            {submitting ? "가입 중..." : "회원가입"}
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

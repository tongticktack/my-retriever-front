import styles from "./index.module.css";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Log In</h1>
        <form className={styles.form} onSubmit={(e)=>e.preventDefault()}>
          <input className={styles.input} placeholder="이메일" type="email" />
          <input className={styles.input} placeholder="비밀번호" type="password" />
          <button className={styles.button}>로그인</button>
        </form>
        <hr className={styles.divider} />
        <button className={styles.googleBtn}>G  구글 계정으로 로그인</button>
      </div>
    </main>
  );
}

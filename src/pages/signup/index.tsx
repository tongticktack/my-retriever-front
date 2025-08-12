import styles from "./index.module.css";

export default function SignupPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Sign Up</h1>
        <form className={styles.form} onSubmit={(e)=>e.preventDefault()}>
          <input className={styles.input} placeholder="성" />
          <input className={styles.input} placeholder="이름" />
          <input className={`${styles.input} ${styles.inputFull}`} placeholder="이메일" type="email" />
          <input className={`${styles.input} ${styles.inputFull}`} placeholder="비밀번호" type="password" />
          <button className={styles.button}>회원가입</button>
        </form>
        <hr className={styles.divider} />
        <button className={styles.googleBtn}>G  구글 계정으로 로그인</button>
      </div>
    </main>
  );
}

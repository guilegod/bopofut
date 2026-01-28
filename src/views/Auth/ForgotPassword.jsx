import { useState } from "react";
import styles from "./ForgotPassword.module.css";
import { forgotPassword } from "../../services/authService.js"; // ajuste o caminho

export default function ForgotPassword({ onGoLogin }) {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setOk(false);

    try {
      setLoading(true);
      await forgotPassword(email);
      setOk(true);
    } catch (err) {
      setError(err?.message || "Erro ao enviar e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>Recuperar senha</div>
          <div className={styles.subtitle}>
            Informe seu e-mail e enviaremos um link para redefinir.
          </div>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="seu@email.com"
              required
            />
          </div>

          {ok ? (
            <div className={styles.ok}>
              Se existir uma conta com esse e-mail, enviamos um link de recuperação.
            </div>
          ) : null}

          {error ? <div className={styles.error}>{error}</div> : null}

          <button className={styles.primary} disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </button>

          <button className={styles.link} type="button" onClick={onGoLogin} disabled={loading}>
            Voltar → Login
          </button>
        </form>
      </div>
    </div>
  );
}

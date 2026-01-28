import { useState } from "react";
import styles from "./Login.module.css";

export default function Login({ onLoginSuccess, onGoRegister, onGoForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await onLoginSuccess({ email, password });
    } catch (err) {
      setError(err?.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>BoraPo</div>
          <div className={styles.subtitle}>Entre para ver peladas e fazer reservas!</div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Senha</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
            />
          </div>

          {/* 🔑 Esqueci minha senha */}
          <button
            className={styles.link}
            type="button"
            onClick={onGoForgotPassword}
            disabled={loading}
          >
            Esqueci minha senha
          </button>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button className={styles.primary} type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <button
            className={styles.link}
            type="button"
            onClick={onGoRegister}
            disabled={loading}
          >
            Não tenho conta → Criar agora
          </button>
        </form>

        <div className={styles.hint}>
          Dica: <b>BoraPo</b> junte-se a nossa turma, <b>Participe!</b>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import styles from "./Register.module.css";

export default function Register({ onRegisterSuccess, onGoLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Preencha nome, email e senha.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await onRegisterSuccess({ name, email, password, role: "user" });
    } catch (err) {
      setError(err?.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>Criar conta</div>
          <div className={styles.subtitle}>Crie sua conta para entrar nas peladas</div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button className={styles.primary} type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <button
            className={styles.link}
            type="button"
            onClick={onGoLogin}
            disabled={loading}
          >
            Já tenho conta → Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

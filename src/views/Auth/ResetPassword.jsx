import { useEffect, useMemo, useState } from "react";
import styles from "./ResetPassword.module.css";
import { apiRequest } from "../../services/api.js";

export default function ResetPassword({ onGoLogin }) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const tokenFromUrl = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("token") || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const t = String(token || "").trim();
    if (!t || t.length < 20) {
      setError("Token inválido. Abra o link enviado no seu e-mail.");
      return;
    }

    if (!password || password.length < 6) {
      setError("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== password2) {
      setError("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/auth/reset", {
        method: "POST",
        body: { token: t, password },
      });

      setDone(true);

      // limpa token da URL pra não ficar reaproveitando
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err?.message || "Não consegui redefinir a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>Nova senha</div>
          <div className={styles.subtitle}>
            Crie uma senha nova para entrar no <b>BoraPô</b>.
          </div>
        </div>

        {done ? (
          <div className={styles.doneBox}>
            <div className={styles.doneTitle}>Senha atualizada ✅</div>
            <div className={styles.doneSub}>
              Agora você já pode entrar com a nova senha.
            </div>

            <button className={styles.primary} type="button" onClick={onGoLogin}>
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {!tokenFromUrl ? (
              <div className={styles.warn}>
                Abra este link a partir do e-mail de recuperação (ele vem com o token).
              </div>
            ) : null}

            <div className={styles.field}>
              <label>Nova senha</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <div className={styles.field}>
              <label>Confirmar senha</label>
              <input
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="repita a senha"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button className={styles.primary} type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Atualizar senha"}
            </button>

            <button
              className={styles.link}
              type="button"
              onClick={onGoLogin}
              disabled={loading}
            >
              Voltar para o login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

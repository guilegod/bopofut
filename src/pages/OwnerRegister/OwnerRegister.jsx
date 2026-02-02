import { useState } from "react";
import styles from "./OwnerRegister.module.css";

import { register, setToken } from "../../services/authService.js"; // ajuste o caminho se for diferente

export default function OwnerRegister({ onDone, onGoLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit(e) {
  e.preventDefault();
  setMsg("");

  if (!form.name || !form.email || !form.password) {
    setMsg("Preencha nome, email e senha.");
    return;
  }

  try {
    setLoading(true);

    const data = await register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: "arena_owner",
    });

    // 🔐 padrão do seu api.js
    const token = data?.token || data?.accessToken;

    if (!token) {
      setMsg("Conta criada! Faça login para continuar.");
      setTimeout(() => onGoLogin?.(), 800);
      return;
    }

    // salva token (authService já sabe onde salvar)
    setToken(token);

    setMsg("Conta criada! Entrando no painel…");

    // 👉 aqui você manda pro fluxo do dono
    setTimeout(() => {
      onDone?.(); // ex: setView("arenaPanel") ou criar arena
    }, 400);

  } catch (err) {
    setMsg(err?.message || "Erro ao cadastrar. Tente novamente.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cadastro do Dono</h1>
        <p className={styles.sub}>
          Crie sua conta como dono de arena para acessar o painel no PC.
        </p>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label}>
            Nome
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
            />
          </label>

          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="seuemail@exemplo.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label className={styles.label}>
            Senha
            <input
              className={styles.input}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="Crie uma senha"
              type="password"
              autoComplete="new-password"
            />
          </label>

          <label className={styles.label}>
            WhatsApp (opcional)
            <input
              className={styles.input}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="(41) 99999-9999"
              inputMode="tel"
            />
          </label>

          {msg ? <div className={styles.msg}>{msg}</div> : null}

          <button className={styles.btn} disabled={loading} type="submit">
            {loading ? "Criando..." : "Criar conta de dono"}
          </button>

          <button className={styles.btnGhost} type="button" onClick={onGoLogin}>
            Já tenho conta → Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

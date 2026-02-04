// src/views/Auth/OwnerRegister.jsx  (ajuste o caminho se o seu for outro)
import { useMemo, useState } from "react";
import styles from "./OwnerRegister.module.css";

import { register, setToken } from "../../services/authService.js"; // ajuste o caminho se for diferente

// 🔧 Helper: tenta chamar /owner/apply (opcional)
// - Se seu backend ainda não tiver esse endpoint, não dá erro fatal.
async function tryOwnerApply(payload) {
  try {
    // tenta usar o mesmo base URL do seu projeto (Vite) ou fallback
    const base =
      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
      "";

    const url = base ? `${base.replace(/\/$/, "")}/owner/apply` : `/owner/apply`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ⚠️ se seu backend exigir token aqui, ele já estará salvo via setToken(token),
        // mas como isso depende do seu authService, deixamos sem Authorization.
        // Se quiser, eu ajusto depois para puxar token do storage e mandar aqui.
      },
      body: JSON.stringify(payload),
    });

    // se 404/401/etc, só ignora sem quebrar o fluxo
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    return data;
  } catch {
    return null;
  }
}

export default function OwnerRegister({ onGoLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [stage, setStage] = useState("form"); // "form" | "pending"

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && form.email.trim() && form.password);
  }, [form.name, form.email, form.password]);

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    if (!canSubmit) {
      setMsg("Preencha nome, email e senha.");
      return;
    }

    try {
      setLoading(true);

      // ✅ Importante:
      // Aqui você NÃO deve “liberar owner” de verdade no backend.
      // O correto é o backend criar o usuário com ownerStatus = PENDING.
      // Se hoje seu backend usa "role", mantenha "arena_owner" mas com status PENDING.
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: "arena_owner", // pode manter; o que manda é o status PENDING no backend
        phone: form.phone?.trim() || undefined,
      });

      // 🔐 padrão do seu api.js
      const token = data?.token || data?.accessToken;

      if (token) {
        setToken(token);
      }

      // (opcional) tenta criar/atualizar solicitação de aprovação no backend, se existir
      // Isso deixa seu fluxo pronto pro painel admin aprovar.
      await tryOwnerApply({
        phone: form.phone?.trim() || "",
        // você pode enviar mais campos aqui no futuro: cpf/cnpj, cidade, etc.
      });

      // UI: não entra no painel — fica pendente
      setStage("pending");
      setMsg(
        "✅ Solicitação enviada! Sua conta será liberada após aprovação. Você pode fechar e voltar depois."
      );
    } catch (err) {
      setMsg(err?.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------
  // UI: Tela de pendência
  // ----------------------------
  if (stage === "pending") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Aguardando aprovação</h1>
          <p className={styles.sub}>
            Recebemos seu cadastro como dono de arena. Agora precisamos aprovar sua conta antes de liberar o painel.
          </p>

          {msg ? <div className={styles.msg}>{msg}</div> : null}

          <button className={styles.btn} type="button" onClick={onGoLogin}>
            Ir para o login
          </button>

          <button
            className={styles.btnGhost}
            type="button"
            onClick={() => {
              // permite corrigir dados e reenviar
              setStage("form");
              setMsg("");
            }}
          >
            Editar dados
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------
  // UI: Formulário
  // ----------------------------
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cadastro do Dono</h1>
        <p className={styles.sub}>
          Cadastre-se como dono de arena. Sua conta será liberada após aprovação.
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

          <button className={styles.btn} disabled={loading || !canSubmit} type="submit">
            {loading ? "Enviando..." : "Enviar solicitação"}
          </button>

          <button className={styles.btnGhost} type="button" onClick={onGoLogin}>
            Já tenho conta → Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

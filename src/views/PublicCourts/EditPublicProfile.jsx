import { useEffect, useMemo, useState } from "react";

function cardStyle() {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "var(--shadow-sm)",
  };
}

function inputStyle() {
  return {
    width: "100%",
    borderRadius: 14,
    padding: "12px 12px",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    outline: "none",
  };
}

function btn(kind = "ghost") {
  const base = {
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 1000,
    border: "1px solid var(--border)",
    cursor: "pointer",
  };
  if (kind === "primary") {
    return { ...base, background: "var(--primary)", borderColor: "transparent", color: "white" };
  }
  if (kind === "danger") {
    return { ...base, background: "var(--danger)", borderColor: "transparent", color: "white" };
  }
  return { ...base, background: "var(--surface)", color: "var(--text)" };
}

function helpTextStyle(color = "var(--text)") {
  return { opacity: 0.75, fontSize: 12, color, lineHeight: 1.35 };
}

// espelho do normalizeUsername do mock (sem depender de import, pra manter modal simples)
function normalizeUsernameLocal(input) {
  let u = String(input || "").trim();
  if (!u) return "";
  if (u.startsWith("@")) u = u.slice(1);
  u = u.trim().toLowerCase();
  u = u.replace(/[^a-z0-9_.]/g, "");
  if (u.length < 3) return "";
  if (u.length > 20) u = u.slice(0, 20);
  return u;
}

const POSICOES = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante"];
const NIVEIS = ["Iniciante", "Médio", "Avançado", "Pro"];
const PE = ["Destro", "Canhoto", "Ambidestro"];

export default function EditPublicProfile({ open, initial, onClose, onSave }) {
  const safeInitial = useMemo(() => {
    const u = initial || {};
    return {
      name: u.name || "",
      username: u.username || "",
      avatar: u.avatar || "",
      city: u.city || "Curitiba",
      bairro: u.bairro || "",
      position: u.position || "Meia",
      level: u.level || "Médio",
      foot: u.foot || "Destro",
      bio: u.bio || "",
      tagsText: (u.tags || []).join(", "),
    };
  }, [initial]);

  const [form, setForm] = useState(safeInitial);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(safeInitial);
    setErr("");
  }, [open, safeInitial]);

  if (!open) return null;

  const normalized = normalizeUsernameLocal(form.username);

  function save() {
    setErr("");

    const payload = {
      name: String(form.name || "").trim(),
      username: String(form.username || "").trim(),
      avatar: String(form.avatar || "").trim(),
      city: String(form.city || "").trim(),
      bairro: String(form.bairro || "").trim(),
      position: String(form.position || "").trim(),
      level: String(form.level || "").trim(),
      foot: String(form.foot || "").trim(),
      bio: String(form.bio || "").trim().slice(0, 120),
      tags: String(form.tagsText || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    };

    if (!payload.name) {
      setErr("Preencha seu nome.");
      return;
    }

    // username opcional, mas se digitou algo, precisa virar um @ válido após normalizar
    const typed = String(form.username || "").trim();
    if (typed && !normalized) {
      setErr("Esse @username ficou inválido. Use 3–20 chars: a-z, 0-9, _ ou .");
      return;
    }

    onSave?.(payload);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={{ ...cardStyle(), width: "min(760px, 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 1000, fontSize: 16 }}>✏️ Editar perfil</div>
          <button type="button" style={btn("ghost")} onClick={onClose}>
            Fechar
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <input
                style={inputStyle()}
                placeholder="Nome"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div style={helpTextStyle()}>Como você aparece para os outros.</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <input
                style={inputStyle()}
                placeholder="@username (opcional)"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
              <div style={helpTextStyle()}>
                {String(form.username || "").trim()
                  ? normalized
                    ? `Vai ficar: @${normalized}`
                    : "Regras: 3–20 chars (a-z, 0-9, _ ou .)"
                  : "Dica: usar @username facilita compartilhar e buscar depois."}
              </div>
            </div>
          </div>

          <input
            style={inputStyle()}
            placeholder="Foto (URL) — opcional"
            value={form.avatar}
            onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              style={inputStyle()}
              placeholder="Cidade"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <input
              style={inputStyle()}
              placeholder="Bairro"
              value={form.bairro}
              onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <select
              style={inputStyle()}
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            >
              {POSICOES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              style={inputStyle()}
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
            >
              {NIVEIS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <select
              style={inputStyle()}
              value={form.foot}
              onChange={(e) => setForm((f) => ({ ...f, foot: e.target.value }))}
            >
              {PE.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <textarea
            style={{ ...inputStyle(), minHeight: 92, resize: "vertical" }}
            placeholder="Bio (até 120 caracteres)"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />

          <input
            style={inputStyle()}
            placeholder="Tags (separe por vírgula) ex: Futsal, Campo, Vôlei"
            value={form.tagsText}
            onChange={(e) => setForm((f) => ({ ...f, tagsText: e.target.value }))}
          />

          {err ? (
            <div style={{ ...helpTextStyle("var(--danger)"), opacity: 1, fontWeight: 900 }}>{err}</div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            <button type="button" style={btn("primary")} onClick={save}>
              💾 Salvar
            </button>
            <button type="button" style={btn("ghost")} onClick={onClose}>
              Cancelar
            </button>
          </div>

          <div style={helpTextStyle()}>
            Tudo aqui salva no <b>localStorage</b> por enquanto. Depois a gente liga no backend (/me).
          </div>
        </div>
      </div>
    </div>
  );
}

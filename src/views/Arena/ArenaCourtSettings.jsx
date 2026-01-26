import { useEffect, useMemo, useState } from "react";
import styles from "./ArenaCourtSettings.module.css";
import { apiRequest } from "../../services/api.js";
import { getToken } from "../../services/authService.js";

function clean(v) {
  return String(v ?? "").trim();
}

function safeUUID() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `court_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeType(t) {
  const x = String(t || "").toUpperCase();
  return x === "FUT7" ? "FUT7" : "FUTSAL";
}

function typeLabel(t) {
  const x = String(t || "").toUpperCase();
  if (x === "FUT7") return "Sintético";
  return "Futsal";
}

function initials(name) {
  const n = String(name || "").trim();
  if (!n) return "QD";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "Q";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "D";
  return (a + b).toUpperCase();
}

export default function ArenaCourtSettings({
  user,
  courts = [],
  onBack,
  onCourtsUpdated, // opcional: App atualizar state
}) {
  const role = String(user?.role || "").toLowerCase();
  const isArenaOwner = role === "arena_owner" || role === "admin";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [list, setList] = useState(Array.isArray(courts) ? courts : []);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | FUTSAL | FUT7

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "FUTSAL",
    city: "",
    address: "",
    pricePerHour: "",
    isActive: true,
  });

  async function refresh() {
    const token = getToken();
    if (!token) {
      setErrorMsg("Você precisa estar logado.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const endpoint = isArenaOwner ? "/courts/mine" : "/courts";
      const raw = await apiRequest(endpoint, { token });

      const next =
        Array.isArray(raw) ? raw : raw?.courts || raw?.data || raw?.items || [];

      setList(Array.isArray(next) ? next : []);
      onCourtsUpdated?.(Array.isArray(next) ? next : []);
    } catch (e) {
      console.error(e);
      setErrorMsg("Não consegui carregar suas quadras. Veja o console.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // mantém a lista inicial se veio via props, mas também puxa do backend pra ficar “o que tá online”
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = clean(query).toLowerCase();

    return (list || [])
      .filter((c) => {
        if (typeFilter !== "ALL" && normalizeType(c?.type) !== typeFilter) return false;
        if (!q) return true;

        const hay = `${c?.name || ""} ${c?.city || ""} ${c?.address || ""} ${c?.type || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR"));
  }, [list, query, typeFilter]);

  function openCreate() {
    setEditing(null);
    setErrorMsg("");
    setForm({
      name: "",
      type: "FUTSAL",
      city: "",
      address: "",
      pricePerHour: "",
      isActive: true,
    });
    setIsModalOpen(true);
  }

  function openEdit(court) {
    setEditing(court);
    setErrorMsg("");
    setForm({
      name: court?.name || "",
      type: normalizeType(court?.type),
      city: court?.city || "",
      address: court?.address || "",
      pricePerHour:
        court?.pricePerHour == null || Number.isNaN(Number(court.pricePerHour))
          ? ""
          : String(Number(court.pricePerHour)),
      isActive: court?.isActive !== false,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditing(null);
    setErrorMsg("");
  }

  async function saveCourt() {
    if (!isArenaOwner) {
      setErrorMsg("Somente arena_owner pode cadastrar/editar quadras.");
      return;
    }

    const token = getToken();
    if (!token) {
      setErrorMsg("Você precisa estar logado.");
      return;
    }

    const name = clean(form.name);
    if (name.length < 2) {
      setErrorMsg("Nome da quadra precisa ter pelo menos 2 caracteres.");
      return;
    }

    const city = clean(form.city);
    const address = clean(form.address);

    const price = clean(form.pricePerHour);
    const priceNum = price === "" ? null : Number(price);
    if (price !== "" && !Number.isFinite(priceNum)) {
      setErrorMsg("Preço por hora inválido.");
      return;
    }

    const body = {
      name,
      type: normalizeType(form.type),
      city: city || null,
      address: address || null,
      pricePerHour: priceNum,
      isActive: !!form.isActive,
    };

    setSaving(true);
    setErrorMsg("");
    try {
      if (editing?.id) {
        await apiRequest(`/courts/${editing.id}`, { method: "PATCH", token, body });
      } else {
        await apiRequest("/courts", {
          method: "POST",
          token,
          // teu backend exige id no body
          body: { id: safeUUID(), ...body },
        });
      }

      await refresh();
      closeModal();
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro ao salvar. Confere backend online e login como arena_owner.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(court) {
    if (!isArenaOwner) return;

    const token = getToken();
    if (!token) {
      setErrorMsg("Você precisa estar logado.");
      return;
    }

    try {
      setErrorMsg("");
      await apiRequest(`/courts/${court.id}`, {
        method: "PATCH",
        token,
        body: { isActive: court?.isActive === false ? true : false },
      });
      await refresh();
    } catch (e) {
      console.error(e);
      setErrorMsg("Não consegui atualizar o status da quadra.");
    }
  }

  const emptyState = !loading && filtered.length === 0;

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <button type="button" className={styles.backBtn} onClick={() => onBack?.()} aria-label="Voltar">
          ←
        </button>

        <div className={styles.titleWrap}>
          <div className={styles.title}>Quadras</div>
          <div className={styles.subtitle}>
            Cadastre e edite as quadras da sua arena (isso alimenta Agenda e MatchCreator)
          </div>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => refresh()}
            disabled={loading}
            title="Atualizar lista"
          >
            ↻ Atualizar
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={openCreate}
            disabled={!isArenaOwner}
            title={!isArenaOwner ? "Somente arena_owner" : "Cadastrar nova quadra"}
          >
            + Nova Quadra
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.search}
            placeholder="Nome, cidade, endereço..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filtersLabel}>Tipo</div>
          <div className={styles.pills}>
            <button
              type="button"
              className={`${styles.pill} ${typeFilter === "ALL" ? styles.pillActive : ""}`}
              onClick={() => setTypeFilter("ALL")}
            >
              Todas
            </button>

            <button
              type="button"
              className={`${styles.pill} ${typeFilter === "FUTSAL" ? styles.pillActive : ""}`}
              onClick={() => setTypeFilter("FUTSAL")}
            >
              Futsal
            </button>

            <button
              type="button"
              className={`${styles.pill} ${typeFilter === "FUT7" ? styles.pillActive : ""}`}
              onClick={() => setTypeFilter("FUT7")}
            >
              Fut7
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {errorMsg ? <div className={styles.errorBox}>⚠ {errorMsg}</div> : null}

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.emptyBox}>
            <div className={styles.emptyTitle}>Carregando…</div>
            <div className={styles.emptySub}>Buscando suas quadras no backend.</div>
          </div>
        ) : emptyState ? (
          <div className={styles.emptyBox}>
            <div className={styles.emptyTitle}>Nenhuma quadra encontrada</div>
            <div className={styles.emptySub}>
              Tenta limpar a busca ou cadastre uma nova quadra.
            </div>

            <div className={styles.emptyActions}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => {
                  setQuery("");
                  setTypeFilter("ALL");
                }}
              >
                Limpar filtros
              </button>

              <button type="button" className={styles.primaryBtn} onClick={openCreate} disabled={!isArenaOwner}>
                + Nova Quadra
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((c) => {
              const active = c?.isActive !== false;
              const t = normalizeType(c?.type);
              const badge = t === "FUT7" ? styles.badgeFut7 : styles.badgeFutsal;

              return (
                <div key={c.id || c.name} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.avatar}>{initials(c?.name)}</div>

                    <div className={styles.cardHead}>
                      <div className={styles.cardTitleRow}>
                        <div className={styles.cardTitle}>{c?.name || "Quadra"}</div>
                        <span className={`${styles.badge} ${badge}`}>{typeLabel(t)}</span>
                      </div>

                      <div className={styles.meta}>
                        <span>📍 {c?.city || "Curitiba"}</span>
                        <span className={styles.metaDot}>•</span>
                        <span>{c?.address || "Endereço não informado"}</span>
                      </div>
                    </div>

                    <div className={`${styles.status} ${active ? styles.statusOn : styles.statusOff}`}>
                      {active ? "ATIVA" : "INATIVA"}
                    </div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.chip}>
                      🕒{" "}
                      {c?.pricePerHour != null && Number.isFinite(Number(c.pricePerHour))
                        ? `R$ ${Number(c.pricePerHour).toFixed(0)}/h`
                        : "R$ —/h"}
                    </div>

                    <div className={styles.cardActions}>
                      <button type="button" className={styles.linkBtn} onClick={() => openEdit(c)}>
                        ✏ Editar
                      </button>

                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => toggleActive(c)}
                        disabled={!isArenaOwner}
                        title={!isArenaOwner ? "Somente arena_owner" : "Ativar/Inativar"}
                      >
                        {active ? "⏸ Pausar" : "▶ Ativar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>
                {editing?.id ? "Editar quadra" : "Nova quadra"}
              </div>

              <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              <label className={styles.label}>
                Nome
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Ex: Sintético 1"
                />
              </label>

              <label className={styles.label}>
                Tipo
                <select
                  className={styles.select}
                  value={form.type}
                  onChange={(e) => setForm((s) => ({ ...s, type: normalizeType(e.target.value) }))}
                >
                  <option value="FUTSAL">Futsal</option>
                  <option value="FUT7">Fut7 (Sintético)</option>
                </select>
              </label>

              <label className={styles.label}>
                Cidade
                <input
                  className={styles.input}
                  value={form.city}
                  onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                  placeholder="Ex: Curitiba"
                />
              </label>

              <label className={styles.label}>
                Endereço
                <input
                  className={styles.input}
                  value={form.address}
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                  placeholder="Rua, número…"
                />
              </label>

              <label className={styles.label}>
                Preço por hora (R$)
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={form.pricePerHour}
                  onChange={(e) => setForm((s) => ({ ...s, pricePerHour: e.target.value }))}
                  placeholder="Ex: 120"
                />
              </label>

              <label className={styles.switchRow}>
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                />
                <span>Quadra ativa (aparece para agendar/criar pelada)</span>
              </label>
            </div>

            {errorMsg ? <div className={styles.modalError}>⚠ {errorMsg}</div> : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostBtn} onClick={closeModal} disabled={saving}>
                Cancelar
              </button>

              <button type="button" className={styles.primaryBtn} onClick={saveCourt} disabled={saving}>
                {saving ? "Salvando…" : editing?.id ? "Salvar alterações" : "Criar quadra"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

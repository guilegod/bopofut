import { useEffect, useMemo, useState } from "react";
import styles from "./AdminPanel.module.css";

import { apiRequest } from "../../services/api.js";
import { getToken } from "../../services/authService.js";

// ===========================
// Helpers tolerantes (não quebra)
// ===========================
async function tryGet(paths) {
  let lastErr = null;
  for (const p of paths) {
    try {
      const token = getToken(); // ✅ token manual (resolve o mismatch das chaves)
      const res = await apiRequest(p, { method: "GET", token });
      return { ok: true, data: res, path: p };
    } catch (e) {
      lastErr = e;
    }
  }
  return { ok: false, error: lastErr, path: paths?.[0] || "" };
}

async function tryPost(paths, body) {
  let lastErr = null;
  for (const p of paths) {
    try {
      const token = getToken(); // ✅ token manual (resolve o mismatch das chaves)
      const res = await apiRequest(p, { method: "POST", body, token });
      return { ok: true, data: res, path: p };
    } catch (e) {
      lastErr = e;
    }
  }
  return { ok: false, error: lastErr, path: paths?.[0] || "" };
}

function asArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x.items)) return x.items;
  if (Array.isArray(x.data)) return x.data;
  if (Array.isArray(x.results)) return x.results;
  return [];
}

function pickId(obj) {
  return obj?.id || obj?.userId || obj?.ownerId || obj?.arenaId || obj?._id;
}

function safeText(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

function fmtNum(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return new Intl.NumberFormat("pt-BR").format(x);
}

// ===========================
// Card simples (interno)
// ===========================
function StatCard({ title, value, hint, tone = "neutral" }) {
  return (
    <div className={`${styles.statCard} ${styles[`tone_${tone}`] || ""}`}>
      <div className={styles.statTitle}>{title}</div>
      <div className={styles.statValue}>{value}</div>
      {hint ? <div className={styles.statHint}>{hint}</div> : null}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState("overview"); // overview | approvals | monitor

  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);

  const [ownersPending, setOwnersPending] = useState([]);
  const [arenasPending, setArenasPending] = useState([]);
  const [organizersPending, setOrganizersPending] = useState([]);

  const [onlineNow, setOnlineNow] = useState([]);
  const [sources, setSources] = useState({});

  const counts = useMemo(() => {
    return {
      owners: ownersPending.length,
      arenas: arenasPending.length,
      organizers: organizersPending.length,
      online: onlineNow.length,
    };
  }, [ownersPending, arenasPending, organizersPending, onlineNow]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      // 1) Stats
      const statsTry = await tryGet(["/admin/stats", "/admin/overview", "/admin/metrics"]);
      if (statsTry.ok) {
        setStats(statsTry.data);
        setSources((s) => ({ ...s, stats: statsTry.path }));
      } else {
        setStats(null);
      }

      // 2) Pendências
      const ownersTry = await tryGet([
        "/admin/owners/pending",
        "/admin/owners?status=PENDING",
        "/admin/owner-applications?status=PENDING",
      ]);
      setOwnersPending(ownersTry.ok ? asArray(ownersTry.data) : []);
      setSources((s) => ({ ...s, owners: ownersTry.ok ? ownersTry.path : "" }));

      const arenasTry = await tryGet([
        "/admin/arenas/pending",
        "/admin/arenas?status=PENDING",
        "/arenas?status=PENDING",
      ]);
      setArenasPending(arenasTry.ok ? asArray(arenasTry.data) : []);
      setSources((s) => ({ ...s, arenas: arenasTry.ok ? arenasTry.path : "" }));

      const orgTry = await tryGet([
        "/admin/organizers/pending",
        "/admin/organizers?status=PENDING",
        "/admin/organizer-applications?status=PENDING",
      ]);
      setOrganizersPending(orgTry.ok ? asArray(orgTry.data) : []);
      setSources((s) => ({ ...s, organizers: orgTry.ok ? orgTry.path : "" }));

      // 3) Online agora
      const onlineTry = await tryGet(["/admin/online", "/presence/online", "/admin/presence/online"]);
      setOnlineNow(onlineTry.ok ? asArray(onlineTry.data) : []);
      setSources((s) => ({ ...s, online: onlineTry.ok ? onlineTry.path : "" }));
    } catch (e) {
      setError(e?.message || "Erro ao carregar painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // =========================
  // Approvals actions
  // =========================
  async function approveOwner(item) {
    const id = pickId(item);
    if (!id) return;
    setBusyKey(`owner_ok_${id}`);
    setError("");

    const res = await tryPost(
      [`/admin/owners/${id}/approve`, `/admin/owner-applications/${id}/approve`, `/admin/owners/approve`],
      { userId: id, id }
    );

    if (res.ok) setOwnersPending((prev) => prev.filter((x) => pickId(x) !== id));
    else setError(res?.error?.message || "Falha ao aprovar owner.");

    setBusyKey("");
  }

  async function rejectOwner(item) {
    const id = pickId(item);
    if (!id) return;
    const reason = prompt("Motivo (opcional):") || "";
    setBusyKey(`owner_no_${id}`);
    setError("");

    const res = await tryPost(
      [`/admin/owners/${id}/reject`, `/admin/owner-applications/${id}/reject`, `/admin/owners/reject`],
      { userId: id, id, reason }
    );

    if (res.ok) setOwnersPending((prev) => prev.filter((x) => pickId(x) !== id));
    else setError(res?.error?.message || "Falha ao reprovar owner.");

    setBusyKey("");
  }

  async function approveArena(item) {
    const id = pickId(item);
    if (!id) return;
    setBusyKey(`arena_ok_${id}`);
    setError("");

    const res = await tryPost(
      [`/admin/arenas/${id}/approve`, `/admin/arenas/approve`, `/admin/arena-applications/${id}/approve`],
      { arenaId: id, id }
    );

    if (res.ok) setArenasPending((prev) => prev.filter((x) => pickId(x) !== id));
    else setError(res?.error?.message || "Falha ao aprovar arena.");

    setBusyKey("");
  }

  async function rejectArena(item) {
    const id = pickId(item);
    if (!id) return;
    const reason = prompt("Motivo (opcional):") || "";
    setBusyKey(`arena_no_${id}`);
    setError("");

    const res = await tryPost(
      [`/admin/arenas/${id}/reject`, `/admin/arenas/reject`, `/admin/arena-applications/${id}/reject`],
      { arenaId: id, id, reason }
    );

    if (res.ok) setArenasPending((prev) => prev.filter((x) => pickId(x) !== id));
    else setError(res?.error?.message || "Falha ao reprovar arena.");

    setBusyKey("");
  }

  async function approveOrganizer(item) {
    const id = pickId(item);
    if (!id) return;
    setBusyKey(`org_ok_${id}`);
    setError("");

    const res = await tryPost(
      [`/admin/organizers/${id}/approve`, `/admin/organizers/approve`, `/admin/organizer-applications/${id}/approve`],
      { organizerId: id, id }
    );

    if (res.ok) setOrganizersPending((prev) => prev.filter((x) => pickId(x) !== id));
    else setError(res?.error?.message || "Falha ao aprovar organizador.");

    setBusyKey("");
  }

  async function rejectOrganizer(item) {
    const id = pickId(item);
    if (!id) return;
    const reason = prompt("Motivo (opcional):") || "";
    setBusyKey(`org_no_${id}`);
    setError("");

    const res = await tryPost(
      [`/admin/organizers/${id}/reject`, `/admin/organizers/reject`, `/admin/organizer-applications/${id}/reject`],
      { organizerId: id, id, reason }
    );

    if (res.ok) setOrganizersPending((prev) => prev.filter((x) => pickId(x) !== id));
    else setError(res?.error?.message || "Falha ao reprovar organizador.");

    setBusyKey("");
  }

  const totalPend = counts.owners + counts.arenas + counts.organizers;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>Admin</div>
          <h1 className={styles.title}>Painel Administrativo</h1>
          <p className={styles.sub}>Aprovações, monitoramento e visão geral do app.</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnGhost} type="button" onClick={loadAll} disabled={loading || !!busyKey}>
            {loading ? "Carregando..." : "↻ Atualizar"}
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "overview" ? styles.tabActive : ""}`}
          onClick={() => setTab("overview")}
        >
          Visão geral
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "approvals" ? styles.tabActive : ""}`}
          onClick={() => setTab("approvals")}
        >
          Aprovações
          {totalPend > 0 ? <span className={styles.pill}>{totalPend}</span> : null}
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "monitor" ? styles.tabActive : ""}`}
          onClick={() => setTab("monitor")}
        >
          Monitor
          {counts.online > 0 ? <span className={styles.pill}>{counts.online}</span> : null}
        </button>
      </div>

      {error ? <div className={styles.msgError}>{error}</div> : null}

      {/* OVERVIEW */}
      {tab === "overview" ? (
        <div className={styles.grid}>
          <StatCard
            title="Owners pendentes"
            value={fmtNum(counts.owners)}
            hint={sources.owners ? `fonte: ${sources.owners}` : "endpoint não disponível"}
            tone={counts.owners ? "warn" : "ok"}
          />
          <StatCard
            title="Arenas pendentes"
            value={fmtNum(counts.arenas)}
            hint={sources.arenas ? `fonte: ${sources.arenas}` : "endpoint não disponível"}
            tone={counts.arenas ? "warn" : "ok"}
          />
          <StatCard
            title="Organizadores pendentes"
            value={fmtNum(counts.organizers)}
            hint={sources.organizers ? `fonte: ${sources.organizers}` : "endpoint não disponível"}
            tone={counts.organizers ? "warn" : "ok"}
          />
          <StatCard
            title="Online agora"
            value={fmtNum(counts.online)}
            hint={sources.online ? `fonte: ${sources.online}` : "endpoint não disponível"}
            tone="neutral"
          />

          <div className={styles.bigCard}>
            <div className={styles.bigTitle}>Resumo rápido</div>

            <div className={styles.bigBody}>
              <div className={styles.line}>
                • Pendências totais: <b>{fmtNum(totalPend)}</b>
              </div>
              <div className={styles.line}>
                • Online agora: <b>{fmtNum(counts.online)}</b>
              </div>
              <div className={styles.line}>
                • Stats avançados: <b>{stats ? "Disponível" : "Ainda não implementado"}</b>
              </div>
            </div>

            {stats ? (
              <div className={styles.statsBox}>
                <div className={styles.statsTitle}>Stats (do backend)</div>
                <pre className={styles.pre}>{JSON.stringify(stats, null, 2)}</pre>
              </div>
            ) : (
              <div className={styles.hintBox}>
                Dica: quando você criar um endpoint tipo <b>/admin/stats</b>, esse painel vai mostrar: usuários totais,
                novos hoje, matches, reservas, receita, etc.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* APPROVALS */}
      {tab === "approvals" ? (
        <div className={styles.approvalsGrid}>
          <ApprovalsSection
            title="👤 Owners pendentes"
            items={ownersPending}
            empty="Nenhum owner pendente 🎉"
            busyKey={busyKey}
            onApprove={approveOwner}
            onReject={rejectOwner}
            kind="owner"
          />
          <ApprovalsSection
            title="🏟️ Arenas pendentes"
            items={arenasPending}
            empty="Nenhuma arena pendente 🎉"
            busyKey={busyKey}
            onApprove={approveArena}
            onReject={rejectArena}
            kind="arena"
          />
          <ApprovalsSection
            title="🧩 Organizadores pendentes"
            items={organizersPending}
            empty="Nenhum organizador pendente 🎉"
            busyKey={busyKey}
            onApprove={approveOrganizer}
            onReject={rejectOrganizer}
            kind="org"
          />
        </div>
      ) : null}

      {/* MONITOR */}
      {tab === "monitor" ? (
        <div className={styles.monitorCard}>
          <div className={styles.monitorHead}>
            <div>
              <div className={styles.monitorTitle}>Online agora</div>
              <div className={styles.monitorSub}>
                {sources.online
                  ? `fonte: ${sources.online}`
                  : "endpoint não disponível (crie /admin/online ou /presence/online)"}
              </div>
            </div>
            <div className={styles.badge}>{fmtNum(counts.online)}</div>
          </div>

          {onlineNow.length === 0 ? (
            <div className={styles.empty}>
              Sem dados de online agora. Se quiser, eu te passo o endpoint ideal pro backend.
            </div>
          ) : (
            <div className={styles.list}>
              {onlineNow.map((u) => {
                const id = pickId(u);
                const name = safeText(u?.name || u?.user?.name || u?.username || u?.email);
                const last = safeText(u?.lastSeenAt || u?.lastSeen || u?.updatedAt, "");
                return (
                  <div className={styles.item} key={`online-${id || name}-${last}`}>
                    <div className={styles.itemTitle}>{name}</div>
                    <div className={styles.itemSub}>{last ? `última atividade: ${last}` : "ativo"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ApprovalsSection({ title, items, empty, busyKey, onApprove, onReject, kind }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>{title}</div>
        <div className={styles.badge}>{items.length}</div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>{empty}</div>
      ) : (
        <div className={styles.list}>
          {items.map((it) => {
            const id = pickId(it);

            const name =
              kind === "arena"
                ? safeText(it?.name || it?.arenaName || it?.title)
                : safeText(it?.name || it?.fullName || it?.user?.name);

            const sub =
              kind === "arena"
                ? `${safeText(it?.city, "")}${safeText(it?.address, "") ? ` • ${safeText(it?.address)}` : ""}`
                : safeText(it?.email || it?.user?.email, "");

            const status = safeText(it?.status || it?.ownerStatus || "PENDING");

            const keyOk = `${kind}_ok_${id}`;
            const keyNo = `${kind}_no_${id}`;

            return (
              <div className={styles.itemCard} key={`${kind}-${id || name}`}>
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{name}</div>
                  <div className={styles.itemSub}>{sub}</div>
                  <div className={styles.itemMeta}>
                    <span className={styles.tag}>status: {status}</span>
                    {id ? <span className={styles.tag}>id: {id}</span> : null}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.btnOk}
                    disabled={!!busyKey}
                    onClick={() => onApprove(it)}
                  >
                    {busyKey === keyOk ? "..." : "Aprovar"}
                  </button>

                  <button
                    type="button"
                    className={styles.btnNo}
                    disabled={!!busyKey}
                    onClick={() => onReject(it)}
                  >
                    {busyKey === keyNo ? "..." : "Reprovar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

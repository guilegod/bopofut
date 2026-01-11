import { useMemo, useState } from "react";
import styles from "./OwnerDashboard.module.css";

export default function OwnerDashboard({
  user,
  matches = [],
  courts = [],

  // navegação
  onBack,
  onOpenMatchCreator,
  onOpenMyMatches,
  onOpenMatchAdmin,
  onOpenFinance,
  onOpenAccountSettings,
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | SCHEDULED | STARTED | FINISHED | CANCELLED

  const safeUser = user || { name: "Organizador", role: "owner" };

  // ====== Fake KPIs (depois vamos derivar do backend) ======
  const kpis = useMemo(() => {
    const total = matches.length;

    const scheduled = matches.filter((m) => (m?.admin?.status || "SCHEDULED") === "SCHEDULED").length;
    const started = matches.filter((m) => (m?.admin?.status || "") === "STARTED").length;
    const finished = matches.filter((m) => (m?.admin?.status || "") === "FINISHED").length;

    const totalPlayers = matches.reduce((acc, m) => acc + (m?.currentPlayers?.length || 0), 0);

    // fake receita: soma de (players * pricePerPlayer) quando existir
    const revenue = matches.reduce((acc, m) => {
      const players = m?.currentPlayers?.length || 0;
      const price = Number(m?.pricePerPlayer || 0);
      return acc + players * price;
    }, 0);

    // taxa fake (exemplo 10%)
    const fees = Math.round(revenue * 0.1);

    return {
      total,
      scheduled,
      started,
      finished,
      totalPlayers,
      revenue,
      fees,
    };
  }, [matches]);

  const normalizedMatches = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();

    return (matches || [])
      .map((m) => {
        const court = (courts || []).find((c) => c?.id === m?.courtId) || null;
        const status = m?.admin?.status || "SCHEDULED";

        return {
          ...m,
          __court: court,
          __status: status,
          __playersCount: m?.currentPlayers?.length || 0,
        };
      })
      .filter((m) => {
        if (statusFilter !== "ALL" && m.__status !== statusFilter) return false;

        if (!q) return true;
        const hay = `${m?.title || ""} ${m?.date || ""} ${m?.time || ""} ${m?.__court?.name || ""} ${
          m?.__court?.address || ""
        }`.toLowerCase();

        return hay.includes(q);
      })
      .sort((a, b) => {
        // ordena: STARTED primeiro, depois SCHEDULED, depois FINISHED, CANCELLED
        const order = { STARTED: 0, SCHEDULED: 1, FINISHED: 2, CANCELLED: 3 };
        return (order[a.__status] ?? 99) - (order[b.__status] ?? 99);
      });
  }, [matches, courts, query, statusFilter]);

  function statusLabel(status) {
    if (status === "STARTED") return "INICIADA";
    if (status === "FINISHED") return "FINALIZADA";
    if (status === "CANCELLED") return "CANCELADA";
    return "AGENDADA";
  }

  function statusTone(status) {
    if (status === "STARTED") return styles.statusLive;
    if (status === "FINISHED") return styles.statusDone;
    if (status === "CANCELLED") return styles.statusOff;
    return styles.statusSoon;
  }

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <button type="button" className={styles.backBtn} onClick={() => onBack?.()}>
          ←
        </button>

        <div className={styles.titleWrap}>
          <div className={styles.title}>Painel do Organizador</div>
          <div className={styles.subtitle}>
            {safeUser?.name ? `Bem-vindo, ${safeUser.name}` : "Bem-vindo"} • Controle de partidas e receitas
          </div>
        </div>

        <div className={styles.topActions}>
          <button type="button" className={styles.ghostBtn} onClick={() => onOpenAccountSettings?.()}>
            ⚙ Conta
          </button>

          <button type="button" className={styles.primaryBtn} onClick={() => onOpenMatchCreator?.()}>
            ＋ Criar Partida
          </button>
        </div>
      </div>

      {/* KPIs */}
      <section className={styles.kpis}>
        <KpiCard label="Partidas" value={kpis.total} hint="Total" />
        <KpiCard label="Agendadas" value={kpis.scheduled} hint="Próximas" />
        <KpiCard label="Ao vivo" value={kpis.started} hint="Em andamento" />
        <KpiCard label="Finalizadas" value={kpis.finished} hint="Concluídas" />
        <KpiCard label="Jogadores" value={kpis.totalPlayers} hint="Participações" />
        <KpiCard label="Receita" value={formatMoneyBRL(kpis.revenue)} hint="Estimativa" />
        <KpiCard label="Taxas" value={formatMoneyBRL(kpis.fees)} hint="Estimativa" />
      </section>

      {/* Ações rápidas */}
      <section className={styles.quickRow}>
        <button type="button" className={styles.quickCard} onClick={() => onOpenMyMatches?.()}>
          <div className={styles.quickIcon}>⚽</div>
          <div className={styles.quickText}>
            <div className={styles.quickTitle}>Minhas Partidas</div>
            <div className={styles.quickSub}>Gerencie vagas, lista e status</div>
          </div>
          <div className={styles.quickArrow}>→</div>
        </button>

        <button type="button" className={styles.quickCard} onClick={() => onOpenFinance?.()}>
          <div className={styles.quickIcon}>💰</div>
          <div className={styles.quickText}>
            <div className={styles.quickTitle}>Financeiro</div>
            <div className={styles.quickSub}>Receitas, taxas e repasses</div>
          </div>
          <div className={styles.quickArrow}>→</div>
        </button>
      </section>

      {/* Filtros */}
      <section className={styles.filters}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, quadra, data..."
          />
        </div>

        <div className={styles.pills}>
          <Pill active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
            Todos
          </Pill>
          <Pill active={statusFilter === "SCHEDULED"} onClick={() => setStatusFilter("SCHEDULED")}>
            Agendadas
          </Pill>
          <Pill active={statusFilter === "STARTED"} onClick={() => setStatusFilter("STARTED")}>
            Ao vivo
          </Pill>
          <Pill active={statusFilter === "FINISHED"} onClick={() => setStatusFilter("FINISHED")}>
            Finalizadas
          </Pill>
          <Pill active={statusFilter === "CANCELLED"} onClick={() => setStatusFilter("CANCELLED")}>
            Canceladas
          </Pill>
        </div>
      </section>

      {/* Lista */}
      <section className={styles.list}>
        <div className={styles.listHead}>
          <div className={styles.listTitle}>Suas partidas</div>
          <button type="button" className={styles.ghostBtn} onClick={() => onOpenMatchCreator?.()}>
            ＋ Nova
          </button>
        </div>

        {normalizedMatches.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Nenhuma partida por aqui</div>
            <div className={styles.emptySub}>
              Crie sua primeira pelada e comece a preencher vagas.
            </div>
            <button type="button" className={styles.primaryBtn} onClick={() => onOpenMatchCreator?.()}>
              Criar Partida
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {normalizedMatches.map((m) => (
              <button
                key={m.id || `${m.title}-${m.date}-${m.time}`}
                type="button"
                className={styles.card}
                onClick={() => onOpenMatchAdmin?.(m)}
                title="Abrir admin da partida"
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardTitle}>{m.title || "Pelada"}</div>
                  <div className={`${styles.status} ${statusTone(m.__status)}`}>
                    {statusLabel(m.__status)}
                  </div>
                </div>

                <div className={styles.meta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaIcon}>🗓️</span>
                    <span>{m.date || "—"} • {m.time || "—"}</span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaIcon}>📍</span>
                    <span>{m.__court?.name || "Quadra"}{m.__court?.address ? ` • ${m.__court.address}` : ""}</span>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.chip}>
                    👥 {m.__playersCount}/{m.maxPlayers || 14}
                  </div>

                  <div className={styles.chip}>
                    💵 {formatMoneyBRL((m.__playersCount || 0) * Number(m.pricePerPlayer || 0))}
                  </div>

                  <div className={styles.cardArrow}>→</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value, hint }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiTop}>
        <div className={styles.kpiLabel}>{label}</div>
        <div className={styles.kpiHint}>{hint}</div>
      </div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.pill} ${active ? styles.pillActive : ""}`}
    >
      {children}
    </button>
  );
}

function formatMoneyBRL(value) {
  const n = Number(value || 0);
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

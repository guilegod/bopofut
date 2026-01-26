import { useMemo, useState } from "react";
import styles from "./ArenaDashboard.module.css";

export default function ArenaDashboard({
  user,
  courts = [],
  matches = [],

  onBack,
  onOpenAgenda,
  onOpenFinance,
  onOpenPromotions,
  onOpenAccountSettings,
  onOpenCourtSettings,
  onOpenTournaments,
}) {
  const safeUser = user || { name: "Arena Owner", role: "arena_owner" };

  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [courtFilter, setCourtFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE

  // ✅ quadra padrão para abrir agenda (quando não veio uma específica)
  const defaultCourt = useMemo(() => {
    const list = Array.isArray(courts) ? courts : [];
    if (list.length === 0) return null;

    const active = list.find((c) => c?.isActive !== false);
    return active || list[0] || null;
  }, [courts]);

  function openAgenda(court) {
    onOpenAgenda?.(court || defaultCourt || null);
  }

  // ==========================================
  // KPIs com base em matches reais
  // ==========================================
  const kpis = useMemo(() => {
    const totalCourts = (courts || []).length;

    const activeCourts = (courts || []).filter((c) => c?.isActive !== false).length;
    const inactiveCourts = totalCourts - activeCourts;

    const courtIds = new Set((courts || []).map((c) => c.id).filter(Boolean));
    const arenaMatches = (matches || []).filter((m) => courtIds.has(m?.courtId));

    const now = new Date();
    const ms2h = 2 * 60 * 60 * 1000;

    const scheduled = arenaMatches.filter((m) => {
      const d = new Date(m?.date);
      return !Number.isNaN(d.getTime()) && d.getTime() >= now.getTime();
    }).length;

    const started = arenaMatches.filter((m) => {
      const d = new Date(m?.date);
      const t = d.getTime();
      return !Number.isNaN(t) && t <= now.getTime() && now.getTime() <= t + ms2h;
    }).length;

    const finished = arenaMatches.filter((m) => {
      const d = new Date(m?.date);
      const t = d.getTime();
      return !Number.isNaN(t) && t + ms2h < now.getTime();
    }).length;

    const totalPlayers = arenaMatches.reduce((acc, m) => acc + ((m?.presences || []).length || 0), 0);

    const revenue = arenaMatches.reduce((acc, m) => {
      const players = (m?.presences || []).length || 0;
      const price = Number(m?.pricePerPlayer || 0);
      return acc + players * price;
    }, 0);

    const commission = Math.round(revenue * 0.12);

    return {
      totalCourts,
      activeCourts,
      inactiveCourts,
      scheduled,
      started,
      finished,
      totalPlayers,
      revenue,
      commission,
      arenaMatches,
    };
  }, [courts, matches]);

  const upcoming = useMemo(() => {
    const list = Array.isArray(kpis?.arenaMatches) ? kpis.arenaMatches : [];
    const now = new Date();
    const ms2h = 2 * 60 * 60 * 1000;

    return list
      .map((m) => {
        const d = new Date(m?.date);
        const t = d.getTime();
        const valid = !Number.isNaN(t);

        const status = !valid
          ? "unknown"
          : t >= now.getTime()
          ? "future"
          : now.getTime() <= t + ms2h
          ? "live"
          : "past";

        return {
          ...m,
          __date: d,
          __time: !valid ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          __day: !valid ? "" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          __players: (m?.presences || []).length || 0,
          __status: status, // future | live | past | unknown
        };
      })
      .filter((m) => !Number.isNaN(m.__date?.getTime?.() || NaN))
      .sort((a, b) => a.__date.getTime() - b.__date.getTime())
      .slice(0, 10);
  }, [kpis]);

  // ==========================================
  // Lista de quadras + filtros
  // ==========================================
  const filteredCourts = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();

    return (courts || [])
      .map((c) => ({
        ...c,
        __active: c?.isActive !== false,
        __name: c?.name || "Quadra",
        __type: c?.type || inferTypeFromText(c?.name) || "fut7",
        __pricePerHour: Number(c?.pricePerHour || 0),
      }))
      .filter((c) => {
        if (courtFilter === "ACTIVE" && !c.__active) return false;
        if (courtFilter === "INACTIVE" && c.__active) return false;

        if (!q) return true;

        const hay = `${c.__name} ${c?.address || ""} ${c.__type}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) =>
        a.__active === b.__active ? a.__name.localeCompare(b.__name, "pt-BR") : a.__active ? -1 : 1
      );
  }, [courts, query, courtFilter]);

  const courtById = useMemo(() => {
    const map = new Map();
    for (const c of courts || []) map.set(String(c.id), c);
    return map;
  }, [courts]);

  // ==========================================
  // Extras “Premium”
  // ==========================================
  const health = useMemo(() => {
    const total = Math.max(1, kpis.totalCourts);
    const pct = Math.round((kpis.activeCourts / total) * 100);
    return { pct, label: pct >= 80 ? "Operando forte" : pct >= 50 ? "Operando" : "Atenção" };
  }, [kpis]);

  const monthRevenue = useMemo(() => {
    // estimativa simples: somar partidas do mês atual
    const list = Array.isArray(kpis?.arenaMatches) ? kpis.arenaMatches : [];
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const sum = list.reduce((acc, match) => {
      const d = new Date(match?.date);
      if (Number.isNaN(d.getTime())) return acc;
      if (d.getFullYear() !== y || d.getMonth() !== m) return acc;

      const players = (match?.presences || []).length || 0;
      const price = Number(match?.pricePerPlayer || 0);
      return acc + players * price;
    }, 0);

    return sum;
  }, [kpis]);

  const initials = useMemo(() => getInitials(safeUser?.name || "Arena"), [safeUser?.name]);

  return (
    <div className={styles.page}>
      {/* ====== Topbar Premium ====== */}
      <div className={styles.topbar}>
        <button type="button" className={styles.backBtn} onClick={() => onBack?.()} aria-label="Voltar">
          ←
        </button>

        <div className={styles.hero}>
          <div className={styles.avatar}>{initials}</div>

          <div className={styles.heroText}>
            <div className={styles.titleRow}>
              <div className={styles.title}>Painel da Arena</div>
              <span className={styles.rolePill}>
                {String(safeUser?.role || "").toLowerCase() === "arena_owner" ? "ARENA OWNER" : "PAINEL"}
              </span>
            </div>

            <div className={styles.subtitle}>
              {safeUser?.name ? `Bem-vindo, ${safeUser.name}` : "Bem-vindo"} • Reservas, quadras e agenda
            </div>

            <div className={styles.heroMeta}>
              <span className={styles.metaPill}>🏟️ {kpis.activeCourts}/{kpis.totalCourts} ativas</span>
              <span className={styles.metaPill}>📊 Saúde: {health.pct}%</span>
              <span className={styles.metaPill}>💵 Mês: {formatMoneyBRL(monthRevenue)}</span>
            </div>
          </div>
        </div>

        <div className={styles.topActions}>
          <button type="button" className={styles.ghostBtn} onClick={() => onOpenAccountSettings?.()}>
            ⚙ Conta
          </button>

          <button type="button" className={styles.primaryBtn} onClick={() => onOpenCourtSettings?.()}>
            🏟️ Gerenciar Quadras
          </button>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className={styles.tabs}>
        <Tab active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
          Resumo
        </Tab>
        <Tab active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")}>
          Agenda
        </Tab>
        <Tab active={activeTab === "courts"} onClick={() => setActiveTab("courts")}>
          Quadras
        </Tab>
        <Tab active={activeTab === "money"} onClick={() => setActiveTab("money")}>
          Financeiro
        </Tab>
      </div>

      {/* ===== Overview ===== */}
      {activeTab === "overview" ? (
        <>
          {/* KPIs */}
          <section className={styles.kpis}>
            <KpiCard icon="🏟️" label="Quadras" value={kpis.totalCourts} hint="Total" tone="neutral" />
            <KpiCard icon="✅" label="Ativas" value={kpis.activeCourts} hint="Operando" tone="good" />
            <KpiCard icon="⏸️" label="Inativas" value={kpis.inactiveCourts} hint="Pausadas" tone="warn" />
            <KpiCard icon="📅" label="Agendadas" value={kpis.scheduled} hint="Futuras" tone="info" />
            <KpiCard icon="🔴" label="Ao vivo" value={kpis.started} hint="Agora" tone="hot" />
            <KpiCard icon="🏁" label="Finalizadas" value={kpis.finished} hint="Passadas" tone="neutral" />
            <KpiCard icon="👥" label="Jogadores" value={kpis.totalPlayers} hint="Presenças" tone="neutral" />
            <KpiCard icon="💰" label="Receita" value={formatMoneyBRL(kpis.revenue)} hint="Estimativa" tone="good" />
            <KpiCard icon="🤝" label="Comissão" value={formatMoneyBRL(kpis.commission)} hint="Estimativa" tone="neutral" />
          </section>

          {/* Próximas reservas */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.sectionTitle}>Próximas reservas</div>
                <div className={styles.sectionHint}>Partidas marcadas nas suas quadras (puxado do backend)</div>
              </div>

              <button type="button" className={styles.ghostBtn} onClick={() => openAgenda()}>
                🗓️ Abrir agenda
              </button>
            </div>

            {upcoming.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>Sem reservas ainda</div>
                <div className={styles.emptySub}>
                  Quando alguém criar uma pelada nas suas quadras, ela aparece aqui ✅
                </div>
              </div>
            ) : (
              <div className={styles.resGrid}>
                {upcoming.map((m) => {
                  const c = courtById.get(String(m.courtId || "")) || null;
                  const courtName = c?.name || "Quadra";
                  const who = m?.organizer?.name || "Organizador";
                  const players = (m?.presences || []).length || 0;

                  const badge = getStatusBadge(m.__status);

                  return (
                    <div key={m.id} className={styles.resCard}>
                      <div className={styles.resTop}>
                        <div className={styles.resDate}>
                          <div className={styles.resDay}>{m.__day}</div>
                          <div className={styles.resTime}>{m.__time}</div>
                        </div>

                        <span className={`${styles.resBadge} ${styles[badge.className]}`}>
                          {badge.text}
                        </span>
                      </div>

                      <div className={styles.resMain}>⚽ {m.title || "Pelada"} • {courtName}</div>

                      <div className={styles.resMeta}>
                        <span className={styles.metaChip}>👤 {who}</span>
                        <span className={styles.metaChip}>👥 {players} confirmados</span>
                        {m?.pricePerPlayer ? (
                          <span className={styles.metaChip}>🎟️ {moneyBRL(m.pricePerPlayer)}/jog</span>
                        ) : (
                          <span className={styles.metaChip}>🎟️ preço n/ informado</span>
                        )}
                      </div>

                      <div className={styles.resActions}>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          onClick={() => openAgenda(c || defaultCourt)}
                          title="Abrir agenda dessa quadra"
                        >
                          Ver agenda
                        </button>

                        <button
                          type="button"
                          className={styles.primaryBtn}
                          onClick={() => openAgenda(c || defaultCourt)}
                          title="Abrir agenda (atalho)"
                        >
                          Abrir →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Ações rápidas */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.sectionTitle}>Atalhos rápidos</div>
                <div className={styles.sectionHint}>Acesse rápido as áreas que você mais usa.</div>
              </div>
            </div>

            <div className={styles.quickRow}>
              <QuickCard
                icon="🗓️"
                title="Agenda & Horários"
                sub="Reservas reais + bloqueios/manuais"
                onClick={() => openAgenda()}
              />
              <QuickCard
                icon="💰"
                title="Financeiro"
                sub="Receita, repasses, relatórios"
                onClick={() => onOpenFinance?.()}
              />
              <QuickCard
                icon="🏷️"
                title="Promoções"
                sub="Cupons, pacotes e regras"
                onClick={() => onOpenPromotions?.()}
              />
              <QuickCard
                icon="🏆"
                title="Campeonatos"
                sub="Inscrições, tabelas e premiações"
                onClick={() => onOpenTournaments?.()}
              />
            </div>
          </section>
        </>
      ) : null}

      {/* ===== Agenda tab ===== */}
      {activeTab === "agenda" ? (
        <section className={styles.panel}>
          <div className={styles.panelTitle}>Agenda & Horários</div>
          <div className={styles.panelSub}>
            Aqui a agenda vai mostrar <b>Reservado</b> com dados reais (organizador, telefone, jogadores) + seus
            bloqueios/manuais.
          </div>

          <div className={styles.panelActions}>
            <button type="button" className={styles.primaryBtn} onClick={() => openAgenda()}>
              🗓️ Abrir agenda agora
            </button>
            <button type="button" className={styles.ghostBtn} onClick={() => onOpenCourtSettings?.()}>
              🏟️ Gerenciar quadras
            </button>
          </div>
        </section>
      ) : null}

      {/* ===== Courts tab ===== */}
      {activeTab === "courts" ? (
        <>
          <section className={styles.filters}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar quadra por nome, tipo ou endereço..."
              />
            </div>

            <div className={styles.pills}>
              <Pill active={courtFilter === "ALL"} onClick={() => setCourtFilter("ALL")}>
                Todas
              </Pill>
              <Pill active={courtFilter === "ACTIVE"} onClick={() => setCourtFilter("ACTIVE")}>
                Ativas
              </Pill>
              <Pill active={courtFilter === "INACTIVE"} onClick={() => setCourtFilter("INACTIVE")}>
                Inativas
              </Pill>

              <button type="button" className={styles.primaryBtn} onClick={() => onOpenCourtSettings?.()}>
                🏟️ Gerenciar
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.sectionTitle}>Suas quadras</div>
                <div className={styles.sectionHint}>Clique em uma quadra para abrir a agenda dela.</div>
              </div>
            </div>

            {filteredCourts.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>Nenhuma quadra encontrada</div>
                <div className={styles.emptySub}>Ajuste o filtro ou cadastre novas quadras no gerenciamento.</div>

                <button type="button" className={styles.primaryBtn} onClick={() => onOpenCourtSettings?.()}>
                  🏟️ Cadastrar / Gerenciar Quadras
                </button>
              </div>
            ) : (
              <div className={styles.courtsGrid}>
                {filteredCourts.map((c) => (
                  <button
                    key={c.id || c.__name}
                    type="button"
                    className={styles.courtCard}
                    onClick={() => openAgenda(c)}
                    title="Abrir agenda desta quadra"
                  >
                    <div className={styles.courtTop}>
                      <div className={styles.courtName}>{c.__name}</div>
                      <div className={`${styles.status} ${c.__active ? styles.statusOn : styles.statusOff}`}>
                        {c.__active ? "ATIVA" : "INATIVA"}
                      </div>
                    </div>

                    <div className={styles.courtMeta}>
                      <span className={styles.metaChip}>⚽ {formatType(c.__type)}</span>
                      <span className={styles.metaChip}>📍 {c?.address ? c.address : "Endereço não informado"}</span>
                      <span className={styles.metaChip}>
                        🕒 {c.__pricePerHour ? formatMoneyBRL(c.__pricePerHour) : "R$ —"}/h
                      </span>
                    </div>

                    <div className={styles.courtCta}>
                      <span className={styles.ctaText}>Abrir agenda</span>
                      <span className={styles.ctaArrow}>→</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {/* ===== Money tab ===== */}
      {activeTab === "money" ? (
        <section className={styles.panel}>
          <div className={styles.panelTitle}>Financeiro</div>
          <div className={styles.panelSub}>
            Em breve: repasses, PIX, mensalidade e relatórios aqui. Por enquanto, abre o módulo Financeiro.
          </div>

          <div className={styles.panelActions}>
            <button type="button" className={styles.primaryBtn} onClick={() => onOpenFinance?.()}>
              💰 Abrir financeiro
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* ===========================
   Components
   =========================== */

function KpiCard({ icon, label, value, hint, tone = "neutral" }) {
  const toneClass =
    tone === "good"
      ? styles.kpiGood
      : tone === "warn"
      ? styles.kpiWarn
      : tone === "info"
      ? styles.kpiInfo
      : tone === "hot"
      ? styles.kpiHot
      : styles.kpiNeutral;

  return (
    <div className={`${styles.kpi} ${toneClass}`}>
      <div className={styles.kpiIcon}>{icon}</div>

      <div className={styles.kpiBody}>
        <div className={styles.kpiTop}>
          <div className={styles.kpiLabel}>{label}</div>
          <div className={styles.kpiHint}>{hint}</div>
        </div>

        <div className={styles.kpiValue}>{value}</div>
        <div className={styles.kpiSpark} />
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.pill} ${active ? styles.pillActive : ""}`}>
      {children}
    </button>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.tab} ${active ? styles.tabActive : ""}`}>
      {children}
    </button>
  );
}

function QuickCard({ icon, title, sub, onClick }) {
  return (
    <button type="button" className={styles.quickCard} onClick={onClick}>
      <div className={styles.quickIcon}>{icon}</div>
      <div className={styles.quickText}>
        <div className={styles.quickTitle}>{title}</div>
        <div className={styles.quickSub}>{sub}</div>
      </div>
      <div className={styles.quickArrow}>→</div>
    </button>
  );
}

/* ===========================
   Helpers
   =========================== */

function getInitials(name) {
  const n = String(name || "").trim();
  if (!n) return "AR";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "A";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "R";
  return (a + b).toUpperCase();
}

function inferTypeFromText(txt) {
  const t = String(txt || "").toLowerCase();
  if (t.includes("futsal")) return "futsal";
  if (t.includes("fut7")) return "fut7";
  if (t.includes("society")) return "society";
  if (t.includes("sint")) return "fut7";
  return "";
}

function formatType(type) {
  const v = String(type || "").toLowerCase();
  if (v === "futsal") return "Futsal";
  if (v === "fut7") return "Fut7 (Sintético)";
  if (v === "society") return "Society";
  return v ? v.toUpperCase() : "—";
}

function formatMoneyBRL(value) {
  const n = Number(value || 0);
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

function moneyBRL(value) {
  return formatMoneyBRL(value);
}

function getStatusBadge(status) {
  if (status === "live") return { text: "AO VIVO", className: "badgeLive" };
  if (status === "past") return { text: "FINALIZADA", className: "badgePast" };
  if (status === "future") return { text: "FUTURA", className: "badgeFuture" };
  return { text: "STATUS", className: "badgeNeutral" };
}

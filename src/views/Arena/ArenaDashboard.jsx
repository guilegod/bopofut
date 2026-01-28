import { useEffect, useMemo, useState } from "react";
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

  const isMobile = useIsMobile();

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

  const courtById = useMemo(() => {
    const map = new Map();
    for (const c of courts || []) map.set(String(c.id), c);
    return map;
  }, [courts]);

  // ==========================================
  // Saúde + Mês (pra “Strava vibe”: número forte e etiqueta curta)
  // ==========================================
  const health = useMemo(() => {
    const total = Math.max(1, kpis.totalCourts);
    const pct = Math.round((kpis.activeCourts / total) * 100);
    return { pct, label: pct >= 80 ? "Operando forte" : pct >= 50 ? "Operando" : "Atenção" };
  }, [kpis]);

  const monthRevenue = useMemo(() => {
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

  // ==========================================
  // Lista de quadras (modo “rows”, sem cardão)
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

  const initials = useMemo(() => getInitials(safeUser?.name || "Arena"), [safeUser?.name]);

  return (
    <div className={styles.page}>
      {/* =========================
          Header “Strava-style”
         ========================= */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.iconBtn} onClick={() => onBack?.()} aria-label="Voltar">
            ←
          </button>

          <div className={styles.headerMain}>
            <div className={styles.headerTopRow}>
              <div className={styles.avatar}>{initials}</div>

              <div className={styles.headerText}>
                <div className={styles.titleLine}>
                  <div className={styles.title}>Painel da Arena</div>
                  <span className={styles.pill}>
                    {String(safeUser?.role || "").toLowerCase() === "arena_owner" ? "ARENA OWNER" : "PAINEL"}
                  </span>
                </div>

                <div className={styles.subtitle}>
                  {safeUser?.name ? `Bem-vindo, ${safeUser.name}` : "Bem-vindo"} • Saúde {health.pct}% • {health.label}
                </div>
              </div>
            </div>

            {/* Strip de métricas (horizontal no mobile) */}
            <div className={styles.metricsStrip} role="group" aria-label="Resumo rápido">
              <MetricChip label="Ativas" value={`${kpis.activeCourts}/${kpis.totalCourts}`} />
              <MetricChip label="Ao vivo" value={kpis.started} tone="hot" />
              <MetricChip label="Agendadas" value={kpis.scheduled} />
              <MetricChip label="Mês" value={formatMoneyBRL(monthRevenue)} tone="good" />
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button type="button" className={styles.ghostBtn} onClick={() => onOpenAccountSettings?.()}>
            ⚙ Conta
          </button>

          <button type="button" className={styles.primaryBtn} onClick={() => onOpenCourtSettings?.()}>
            🏟️ Quadras
          </button>
        </div>
      </header>

      {/* =========================
          Tabs (top no desktop / bottom no mobile)
         ========================= */}
      {!isMobile ? (
        <nav className={styles.tabsTop} aria-label="Navegação do painel">
          <SegTab active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
            Resumo
          </SegTab>
          <SegTab active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")}>
            Agenda
          </SegTab>
          <SegTab active={activeTab === "courts"} onClick={() => setActiveTab("courts")}>
            Quadras
          </SegTab>
          <SegTab active={activeTab === "money"} onClick={() => setActiveTab("money")}>
            Financeiro
          </SegTab>
        </nav>
      ) : null}

      {/* =========================
          Content
         ========================= */}
      <main className={styles.content}>
        {activeTab === "overview" ? (
          <>
            {/* KPIs em grid (Strava vibe) */}
            <section className={styles.statsSection}>
              <div className={styles.statsGrid}>
                <StatTile
                  icon="🏟️"
                  label="Quadras"
                  value={kpis.totalCourts}
                  hint={`${kpis.activeCourts} ativas`}
                  tone="neutral"
                />
                <StatTile
                  icon="✅"
                  label="Ativas"
                  value={kpis.activeCourts}
                  hint={`${health.pct}% saúde`}
                  tone="good"
                />
                <StatTile
                  icon="🔴"
                  label="Ao vivo"
                  value={kpis.started}
                  hint={kpis.started ? "rolando agora" : "nenhuma agora"}
                  tone="hot"
                />
                <StatTile
                  icon="📅"
                  label="Agendadas"
                  value={kpis.scheduled}
                  hint={kpis.scheduled ? "tem jogo marcado" : "sem agenda"}
                  tone="neutral"
                />

                <StatTile icon="👥" label="Jogadores" value={kpis.totalPlayers} hint="presenças" tone="neutral" />
                <StatTile
                  icon="💰"
                  label="Receita"
                  value={formatMoneyBRL(kpis.revenue)}
                  hint="estimada"
                  tone="good"
                />
                <StatTile
                  icon="🤝"
                  label="Comissão"
                  value={formatMoneyBRL(kpis.commission)}
                  hint="12%"
                  tone="neutral"
                />
                <StatTile icon="🏁" label="Finalizadas" value={kpis.finished} hint="últimas" tone="neutral" />
              </div>
            </section>

            {/* Próximas reservas */}
            <section className={styles.section}>
              <div className={styles.sectionHeadRow}>
                <div>
                  <div className={styles.sectionTitle}>Próximas reservas</div>
                  <div className={styles.sectionHint}>Partidas marcadas nas suas quadras.</div>
                </div>

                <button type="button" className={styles.primaryBtn} onClick={() => openAgenda()}>
                  Abrir agenda →
                </button>
              </div>

              {upcoming.length === 0 ? (
                <EmptyBlock
                  title="Sem reservas ainda"
                  sub="Quando alguém criar uma pelada nas suas quadras, ela aparece aqui."
                  ctaText="Abrir agenda"
                  onCta={() => openAgenda()}
                />
              ) : (
                <div className={styles.list}>
                  {upcoming.map((m) => {
                    const c = courtById.get(String(m.courtId || "")) || null;
                    const courtName = c?.name || "Quadra";
                    const who = m?.organizer?.name || "Organizador";
                    const players = (m?.presences || []).length || 0;
                    const badge = getStatusBadge(m.__status);

                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={styles.row}
                        onClick={() => openAgenda(c || defaultCourt)}
                        title="Abrir agenda desta quadra"
                      >
                        <div className={styles.rowLeft}>
                          <div className={styles.rowTimeBox}>
                            <div className={styles.rowDay}>{m.__day}</div>
                            <div className={styles.rowTime}>{m.__time}</div>
                          </div>

                          <div className={styles.rowMain}>
                            <div className={styles.rowTitle}>
                              ⚽ {m.title || "Pelada"} • {courtName}
                            </div>
                            <div className={styles.rowMeta}>
                              <span>👤 {who}</span>
                              <span className={styles.dot}>•</span>
                              <span>👥 {players} confirmados</span>
                              <span className={styles.dot}>•</span>
                              <span>
                                🎟️ {m?.pricePerPlayer ? `${moneyBRL(m.pricePerPlayer)}/jog` : "preço n/ informado"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.rowRight}>
                          <span className={`${styles.badge} ${styles[badge.className]}`}>{badge.text}</span>
                          <span className={styles.chev}>›</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Atalhos */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Atalhos</div>
                <div className={styles.sectionHint}>Acesso rápido pro dono da arena.</div>
              </div>

              <div className={styles.tiles}>
                <Tile icon="🗓️" title="Agenda" sub="Horários, reservas, bloqueios" onClick={() => openAgenda()} />
                <Tile icon="🏟️" title="Quadras" sub="Cadastrar/editar quadras" onClick={() => onOpenCourtSettings?.()} />
                <Tile icon="💰" title="Financeiro" sub="Receita e repasses" onClick={() => onOpenFinance?.()} />
                <Tile icon="🏷️" title="Promoções" sub="Cupons e pacotes" onClick={() => onOpenPromotions?.()} />
                <Tile icon="🏆" title="Campeonatos" sub="Tabelas e inscrições" onClick={() => onOpenTournaments?.()} />
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "agenda" ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionTitle}>Agenda & Horários</div>
              <div className={styles.sectionHint}>Aqui você abre a agenda (reservas reais + seus bloqueios/manuais).</div>
            </div>

            <div className={styles.panelBox}>
              <button type="button" className={styles.primaryBtn} onClick={() => openAgenda()}>
                🗓️ Abrir agenda agora
              </button>

              <button type="button" className={styles.ghostBtn} onClick={() => onOpenCourtSettings?.()}>
                🏟️ Gerenciar quadras
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === "courts" ? (
          <section className={styles.section}>
            <div className={styles.sectionHeadRow}>
              <div>
                <div className={styles.sectionTitle}>Suas quadras</div>
                <div className={styles.sectionHint}>Toque numa quadra pra abrir a agenda dela.</div>
              </div>

              <button type="button" className={styles.primaryBtn} onClick={() => onOpenCourtSettings?.()}>
                🏟️ Gerenciar →
              </button>
            </div>

            <div className={styles.controls}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>⌕</span>
                <input
                  className={styles.search}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome, tipo ou endereço..."
                />
              </div>

              <div className={styles.filterStrip} role="group" aria-label="Filtros de quadras">
                <SegPill active={courtFilter === "ALL"} onClick={() => setCourtFilter("ALL")}>
                  Todas
                </SegPill>
                <SegPill active={courtFilter === "ACTIVE"} onClick={() => setCourtFilter("ACTIVE")}>
                  Ativas
                </SegPill>
                <SegPill active={courtFilter === "INACTIVE"} onClick={() => setCourtFilter("INACTIVE")}>
                  Inativas
                </SegPill>
              </div>
            </div>

            {filteredCourts.length === 0 ? (
              <EmptyBlock
                title="Nenhuma quadra encontrada"
                sub="Ajuste a busca/filtro ou cadastre novas quadras."
                ctaText="Cadastrar / Gerenciar"
                onCta={() => onOpenCourtSettings?.()}
              />
            ) : (
              <div className={styles.list}>
                {filteredCourts.map((c) => (
                  <button
                    key={c.id || c.__name}
                    type="button"
                    className={styles.row}
                    onClick={() => openAgenda(c)}
                    title="Abrir agenda desta quadra"
                  >
                    <div className={styles.rowLeft}>
                      <div className={`${styles.statusDot} ${c.__active ? styles.dotOn : styles.dotOff}`} />
                      <div className={styles.rowMain}>
                        <div className={styles.rowTitle}>{c.__name}</div>
                        <div className={styles.rowMeta}>
                          <span>⚽ {formatType(c.__type)}</span>
                          <span className={styles.dot}>•</span>
                          <span>📍 {c?.address ? c.address : "Endereço não informado"}</span>
                          <span className={styles.dot}>•</span>
                          <span>🕒 {c.__pricePerHour ? `${formatMoneyBRL(c.__pricePerHour)}/h` : "R$ —/h"}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.rowRight}>
                      <span className={`${styles.pillSmall} ${c.__active ? styles.pillOn : styles.pillOff}`}>
                        {c.__active ? "ATIVA" : "INATIVA"}
                      </span>
                      <span className={styles.chev}>›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "money" ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionTitle}>Financeiro</div>
              <div className={styles.sectionHint}>Relatórios e repasses (por enquanto abre o módulo Financeiro).</div>
            </div>

            <div className={styles.panelBox}>
              <button type="button" className={styles.primaryBtn} onClick={() => onOpenFinance?.()}>
                💰 Abrir financeiro
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {/* Bottom tabs no mobile */}
      {isMobile ? (
        <nav className={styles.tabsBottom} aria-label="Navegação do painel (mobile)">
          <BottomTab active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon="🏠" label="Resumo" />
          <BottomTab active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} icon="🗓️" label="Agenda" />
          <BottomTab active={activeTab === "courts"} onClick={() => setActiveTab("courts")} icon="🏟️" label="Quadras" />
          <BottomTab active={activeTab === "money"} onClick={() => setActiveTab("money")} icon="💰" label="Grana" />
        </nav>
      ) : null}
    </div>
  );
}

/* ===========================
   UI Pieces
   =========================== */

function MetricChip({ label, value, tone = "neutral" }) {
  const toneClass = tone === "good" ? styles.metricGood : tone === "hot" ? styles.metricHot : styles.metricNeutral;

  return (
    <div className={`${styles.metricChip} ${toneClass}`}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  );
}

function SegTab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.segTab} ${active ? styles.segTabActive : ""}`}>
      {children}
    </button>
  );
}

function SegPill({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.segPill} ${active ? styles.segPillActive : ""}`}>
      {children}
    </button>
  );
}

function StatTile({ icon, label, value, hint, tone = "neutral" }) {
  const toneClass = tone === "good" ? styles.statGood : tone === "hot" ? styles.statHot : styles.statNeutral;

  return (
    <div className={`${styles.statTile} ${toneClass}`}>
      <div className={styles.statTop}>
        <span className={styles.statIcon} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.statLabel}>{label}</span>
      </div>

      <div className={styles.statValue}>{value}</div>

      <div className={styles.statBottom}>
        <span className={styles.statHint}>{hint}</span>
        <span className={styles.statBar} />
      </div>
    </div>
  );
}

function Tile({ icon, title, sub, onClick }) {
  return (
    <button type="button" className={styles.tile} onClick={onClick}>
      <div className={styles.tileIcon} aria-hidden="true">
        {icon}
      </div>

      <div className={styles.tileText}>
        <div className={styles.tileTitle}>{title}</div>
        <div className={styles.tileSub}>{sub}</div>
      </div>

      <div className={styles.tileChev} aria-hidden="true">
        ›
      </div>
    </button>
  );
}

function EmptyBlock({ title, sub, ctaText, onCta }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyTitle}>{title}</div>
      <div className={styles.emptySub}>{sub}</div>

      {ctaText ? (
        <button type="button" className={styles.primaryBtn} onClick={onCta}>
          {ctaText}
        </button>
      ) : null}
    </div>
  );
}

function BottomTab({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.bottomTab} ${active ? styles.bottomTabActive : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <div className={styles.bottomIcon} aria-hidden="true">
        {icon}
      </div>
      <div className={styles.bottomLabel}>{label}</div>
    </button>
  );
}

/* ===========================
   Helpers
   =========================== */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia("(max-width: 780px)") : null;
    const apply = () => setIsMobile(!!mq?.matches);

    apply();
    if (!mq) return;

    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener?.(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener?.(apply);
    };
  }, []);

  return isMobile;
}

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

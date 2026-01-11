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
    // Se não passar quadra, abre na padrão
    onOpenAgenda?.(court || defaultCourt || null);
  }

  // ==========================================
  // KPIs fake (depois backend)
  // ==========================================
  const kpis = useMemo(() => {
    const totalCourts = courts.length;

    const activeCourts = courts.filter((c) => c?.isActive !== false).length;
    const inactiveCourts = totalCourts - activeCourts;

    // Matches na arena (assumimos que match.courtId pertence ao array courts)
    const courtIds = new Set(courts.map((c) => c.id));
    const arenaMatches = matches.filter((m) => courtIds.has(m?.courtId));

    const scheduled = arenaMatches.filter(
      (m) => (m?.admin?.status || "SCHEDULED") === "SCHEDULED"
    ).length;
    const started = arenaMatches.filter((m) => (m?.admin?.status || "") === "STARTED").length;
    const finished = arenaMatches.filter((m) => (m?.admin?.status || "") === "FINISHED").length;

    const totalPlayers = arenaMatches.reduce(
      (acc, m) => acc + (m?.currentPlayers?.length || 0),
      0
    );

    // Receita fake: players * pricePerPlayer (sem comissão ainda)
    const revenue = arenaMatches.reduce((acc, m) => {
      const players = m?.currentPlayers?.length || 0;
      const price = Number(m?.pricePerPlayer || 0);
      return acc + players * price;
    }, 0);

    // Exemplo de comissão (futura): 12% do total
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
    };
  }, [courts, matches]);

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
        a.__active === b.__active ? a.__name.localeCompare(b.__name) : a.__active ? -1 : 1
      );
  }, [courts, query, courtFilter]);

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <button type="button" className={styles.backBtn} onClick={() => onBack?.()}>
          ←
        </button>

        <div className={styles.titleWrap}>
          <div className={styles.title}>Painel da Arena</div>
          <div className={styles.subtitle}>
            {safeUser?.name ? `Bem-vindo, ${safeUser.name}` : "Bem-vindo"} • Quadras, agenda e
            financeiro
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

      {/* KPIs */}
      <section className={styles.kpis}>
        <KpiCard label="Quadras" value={kpis.totalCourts} hint="Total" />
        <KpiCard label="Ativas" value={kpis.activeCourts} hint="Operando" />
        <KpiCard label="Inativas" value={kpis.inactiveCourts} hint="Pausadas" />
        <KpiCard label="Agendadas" value={kpis.scheduled} hint="Hoje/semana" />
        <KpiCard label="Ao vivo" value={kpis.started} hint="Em andamento" />
        <KpiCard label="Finalizadas" value={kpis.finished} hint="Concluídas" />
        <KpiCard label="Jogadores" value={kpis.totalPlayers} hint="Participações" />
        <KpiCard label="Receita" value={formatMoneyBRL(kpis.revenue)} hint="Estimativa" />
        <KpiCard label="Comissão" value={formatMoneyBRL(kpis.commission)} hint="Estimativa" />
      </section>

      {/* Ações rápidas */}
      <section className={styles.quickRow}>
        <button type="button" className={styles.quickCard} onClick={() => openAgenda()}>
          <div className={styles.quickIcon}>🗓️</div>
          <div className={styles.quickText}>
            <div className={styles.quickTitle}>Agenda & Horários</div>
            <div className={styles.quickSub}>Slots, reservas, bloqueios e feriados</div>
          </div>
          <div className={styles.quickArrow}>→</div>
        </button>

        <button type="button" className={styles.quickCard} onClick={() => onOpenFinance?.()}>
          <div className={styles.quickIcon}>💰</div>
          <div className={styles.quickText}>
            <div className={styles.quickTitle}>Financeiro</div>
            <div className={styles.quickSub}>Receita, repasses, mensalidade e relatórios</div>
          </div>
          <div className={styles.quickArrow}>→</div>
        </button>

        <button type="button" className={styles.quickCard} onClick={() => onOpenPromotions?.()}>
          <div className={styles.quickIcon}>🏷️</div>
          <div className={styles.quickText}>
            <div className={styles.quickTitle}>Promoções</div>
            <div className={styles.quickSub}>Cupons, pacotes e regras por quadra</div>
          </div>
          <div className={styles.quickArrow}>→</div>
        </button>

        <button type="button" className={styles.quickCard} onClick={() => onOpenTournaments?.()}>
          <div className={styles.quickIcon}>🏆</div>
          <div className={styles.quickText}>
            <div className={styles.quickTitle}>Campeonatos</div>
            <div className={styles.quickSub}>Tabelas, inscrições e premiações</div>
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
        </div>
      </section>

      {/* Lista de Quadras */}
      <section className={styles.list}>
        <div className={styles.listHead}>
          <div className={styles.listTitle}>Quadras</div>

          <div className={styles.listActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => onOpenCourtSettings?.()}>
              Gerenciar
            </button>
          </div>
        </div>

        {filteredCourts.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Nenhuma quadra encontrada</div>
            <div className={styles.emptySub}>
              Ajuste o filtro ou cadastre novas quadras no gerenciamento.
            </div>

            <button type="button" className={styles.primaryBtn} onClick={() => onOpenCourtSettings?.()}>
              🏟️ Cadastrar / Gerenciar Quadras
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredCourts.map((c) => (
              <button
                key={c.id || c.__name}
                type="button"
                className={styles.card}
                onClick={() => openAgenda(c)}
                title="Abrir agenda desta quadra"
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardTitle}>{c.__name}</div>

                  <div className={`${styles.status} ${c.__active ? styles.statusOn : styles.statusOff}`}>
                    {c.__active ? "ATIVA" : "INATIVA"}
                  </div>
                </div>

                <div className={styles.meta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaIcon}>⚽</span>
                    <span className={styles.metaText}>{formatType(c.__type)}</span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaIcon}>📍</span>
                    <span className={styles.metaText}>
                      {c?.address ? c.address : "Endereço não informado"}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.chip}>
                    🕒 {c.__pricePerHour ? formatMoneyBRL(c.__pricePerHour) : "R$ —"}/h
                  </div>

                  <div className={styles.chip}>🗓️ Abrir agenda</div>

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
    <button type="button" onClick={onClick} className={`${styles.pill} ${active ? styles.pillActive : ""}`}>
      {children}
    </button>
  );
}

function inferTypeFromText(txt) {
  const t = String(txt || "").toLowerCase();
  if (t.includes("futsal")) return "futsal";
  if (t.includes("fut7")) return "fut7";
  if (t.includes("society")) return "society";
  return "";
}

function formatType(type) {
  const v = String(type || "").toLowerCase();
  if (v === "futsal") return "Futsal";
  if (v === "fut7") return "Fut7";
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

import { useEffect, useMemo, useState } from "react";
import styles from "../SquarePage.module.css";
import { badgeClass, btnClass } from "../utils/ui";

function statusBadge(status) {
  if (status === "ACCEPTED") return badgeClass("live");
  if (status === "REJECTED") return badgeClass("warn");
  if (status === "CANCELED") return badgeClass("muted");
  return badgeClass("info"); // PENDING
}

function statusLabel(status) {
  if (status === "ACCEPTED") return "ACEITO";
  if (status === "REJECTED") return "RECUSADO";
  if (status === "CANCELED") return "CANCELADO";
  return "PENDENTE";
}

export default function SectionChallenges({
  teams,
  challenges,
  user,
  onCreate,
  onAccept,
  onReject,
  onCancel,
  focusId, // ✅ já tinha
  onFocusUsed, // ✅ já tinha

  // ✅ NOVO: fluxo A (vindo do PlayerProfile)
  challengeTarget, // { userId, name, ... }
}) {
  const [fromTeamId, setFromTeamId] = useState("");
  const [toTeamId, setToTeamId] = useState("");
  const [whenISO, setWhenISO] = useState("");
  const [note, setNote] = useState("");

  const canUse = !!user?.id;

  function memberId(m) {
    return m?.id || m?.userId || null;
  }

  const myTeams = useMemo(() => {
    const uid = user?.id;
    return (teams || []).filter((t) =>
      uid ? (t.members || []).some((m) => memberId(m) === uid) : false
    );
  }, [teams, user?.id]);

  function findTeam(id) {
    return (teams || []).find((t) => t.id === id) || null;
  }

  function amCaptain(teamId) {
    const t = findTeam(teamId);
    return !!user?.id && t?.captain?.id === user.id;
  }

  // ✅ acha time do alvo (se ele estiver em algum time)
  const targetTeam = useMemo(() => {
    const tid = challengeTarget?.userId;
    if (!tid) return null;
    return (
      (teams || []).find((t) => (t.members || []).some((m) => memberId(m) === tid)) ||
      null
    );
  }, [teams, challengeTarget?.userId]);

  // ✅ scroll + destaque quando veio do clique na notificação
  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`challenge-${focusId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => onFocusUsed?.(), 600);
    return () => clearTimeout(t);
  }, [focusId, onFocusUsed]);

  // ✅ FLUXO A: chegou alvo -> pré-seleciona times e "trava" adversário se possível
  useEffect(() => {
    if (!challengeTarget?.userId) return;

    // 1) meu time padrão
    const myDefault = myTeams?.[0] || null;
    if (myDefault?.id) setFromTeamId(myDefault.id);

    // 2) time do alvo
    if (targetTeam?.id) setToTeamId(targetTeam.id);
    else setToTeamId(""); // se não achou time do alvo, força escolher manualmente

    // 3) limpar data/nota (opcional)
    setWhenISO("");
    setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeTarget?.userId]);

  const fromTeam = useMemo(() => findTeam(fromTeamId), [fromTeamId, teams]);
  const toTeam = useMemo(() => findTeam(toTeamId), [toTeamId, teams]);

  const lockToTeam = Boolean(challengeTarget?.userId && targetTeam?.id); // trava se achou time do alvo

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>⚔️ Desafios (Time vs Time)</div>
        <span className={badgeClass("muted")}>{(challenges || []).length}</span>
      </div>

      {!canUse ? (
        <div className={styles.softCard}>
          <div className={styles.title}>🔒 Login necessário</div>
          <div className={styles.hint}>Entre para criar e responder desafios.</div>
        </div>
      ) : (
        <div className={styles.softCard}>
          <div className={styles.title}>Criar desafio</div>
          <div className={styles.hint}>MVP: apenas capitão do seu time cria desafio.</div>

          {/* ✅ ALVO (Fluxo A) */}
          {challengeTarget?.userId ? (
            <div style={{ marginTop: 10 }}>
              <span className={badgeClass("info")}>🎯 Alvo: {challengeTarget?.name || "Jogador"}</span>
              <span style={{ marginLeft: 10 }} className={badgeClass("muted")}>
                {targetTeam ? `Time: ${targetTeam.name} (travado)` : "Sem time nesta praça"}
              </span>
            </div>
          ) : null}

          <div className={styles.inputRow} style={{ marginTop: 10 }}>
            <select
              className={styles.input}
              value={fromTeamId}
              onChange={(e) => {
                const next = e.target.value;
                setFromTeamId(next);
                // se você escolher um time que seja igual ao adversário, limpa o adversário
                if (toTeamId && next === toTeamId) setToTeamId("");
              }}
            >
              <option value="">Meu time...</option>
              {myTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t?.captain?.id === user?.id ? "(capitão)" : ""}
                </option>
              ))}
            </select>

            <select
              className={styles.input}
              value={toTeamId}
              onChange={(e) => setToTeamId(e.target.value)}
              disabled={lockToTeam}
              title={lockToTeam ? "Travado pelo alvo do desafio" : undefined}
            >
              <option value="">Time adversário...</option>

              {/* Se alvo tem time, deixa só ele (travado) */}
              {lockToTeam ? (
                <option value={targetTeam.id}>{targetTeam.name}</option>
              ) : (
                (teams || [])
                  .filter((t) => t.id !== fromTeamId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
              )}
            </select>
          </div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="Data/Hora (ex: 2026-01-20T19:00)"
              value={whenISO}
              onChange={(e) => setWhenISO(e.target.value)}
            />

            <button
              type="button"
              className={btnClass("primary")}
              onClick={() => {
                const from = findTeam(fromTeamId);
                const to = findTeam(toTeamId);

                if (!from || !to) return;

                // regra: só capitão cria
                if (from?.captain?.id !== user?.id) return;

                // evita desafiar o mesmo time
                if (from.id === to.id) return;

                // se veio do alvo e ele não tem time, impede
                if (challengeTarget?.userId && !targetTeam) return;

                onCreate({ fromTeam: from, toTeam: to, whenISO, note });

                // reset básico
                setWhenISO("");
                setNote("");

                // se NÃO veio do alvo, limpa selects
                if (!challengeTarget?.userId) {
                  setFromTeamId("");
                  setToTeamId("");
                }
              }}
              disabled={
                !fromTeamId ||
                !toTeamId ||
                (fromTeam && fromTeam?.captain?.id !== user?.id) ||
                (challengeTarget?.userId && !targetTeam)
              }
              title={
                fromTeam && fromTeam?.captain?.id !== user?.id
                  ? "Só o capitão pode criar"
                  : challengeTarget?.userId && !targetTeam
                  ? "O alvo não está em um time nesta praça"
                  : undefined
              }
            >
              Desafiar
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              className={styles.input}
              placeholder="Nota (opcional) — ex: 'valendo refri' 😄"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      )}

      {(challenges || []).length === 0 ? (
        <div className={styles.softCard} style={{ marginTop: 12 }}>
          <div className={styles.title}>Nenhum desafio ainda</div>
          <div className={styles.hint}>Crie o primeiro desafio da praça ⚔️</div>
        </div>
      ) : (
        <div className={styles.presenceList}>
          {challenges.map((c) => {
            const canRespond = c.status === "PENDING" && amCaptain(c.toTeam?.id);
            const canCancel = c.status === "PENDING" && amCaptain(c.fromTeam?.id);

            const isFocus = focusId && c.id === focusId;

            return (
              <div
                key={c.id}
                id={`challenge-${c.id}`}
                className={`${styles.presenceRow} ${isFocus ? styles.focusRow : ""}`}
              >
                <div className={styles.presenceLeft}>
                  <div className={styles.nameBlock}>
                    <div className={styles.nameRow}>
                      <div className={styles.name}>
                        {c.fromTeam?.name} vs {c.toTeam?.name}
                      </div>
                      <span className={statusBadge(c.status)}>{statusLabel(c.status)}</span>
                    </div>

                    <div className={styles.sub}>
                      {c.whenISO ? `📅 ${c.whenISO}` : "📅 (sem data)"}{" "}
                      {c.note ? `• 💬 ${c.note}` : ""} • por{" "}
                      <b>{c.createdBy?.name || "—"}</b>
                    </div>
                  </div>
                </div>

                <div className={styles.tabs}>
                  {canRespond ? (
                    <>
                      <button
                        type="button"
                        className={btnClass("primary")}
                        onClick={() => onAccept(c.id)}
                      >
                        Aceitar
                      </button>
                      <button
                        type="button"
                        className={btnClass("ghost")}
                        onClick={() => onReject(c.id)}
                      >
                        Recusar
                      </button>
                    </>
                  ) : null}

                  {canCancel ? (
                    <button
                      type="button"
                      className={btnClass("danger")}
                      onClick={() => onCancel(c.id)}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
